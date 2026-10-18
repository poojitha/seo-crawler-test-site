// Reference crawler: crawls the running site the way a correct SEO crawler should and
// writes expected-results.csv with the SAME columns as crawl.csv (plus test metadata).
// Usage: npm run expected     (uses the server on :3000 if running, otherwise starts one)
//
// Rules (documented in coverage-report.md / README):
//  - crawl permission: robots.txt "*" group, Google longest-match semantics
//  - indexing directives: Google's view (meta robots + meta googlebot, X-Robots-Tag
//    without prefix or with "googlebot:" prefix)
//  - head elements only count while <head> is open (HTML5 implicit head closing);
//    title = document.title (first HTML <title> anywhere, SVG titles excluded)
//  - JavaScript effects come from the `js` declarations in src/routes/javascript.js
const http = require('http');
const zlib = require('zlib');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const P = require('./lib/parse');

process.env.PORT = process.env.PORT || '3000';
require('../src/routes');
const { match } = require('../src/registry');
const { ORIGIN } = require('../src/config');

const HOST = new URL(ORIGIN).host;
const UA = 'Mozilla/5.0 (compatible; YakaExpected/1.0; reference crawler)';
const TIMEOUT = 30000;
const CONCURRENCY = 8;

const COLUMNS = ['url', 'urlEncoded', 'depth', 'folderDepth', 'responseTimeMs', 'crawlTimestamp', 'redirectUrl', 'redirectType', 'status', 'statusText', 'contentType', 'httpVersion', 'lastModified', 'sizeBytes', 'transferredBytes', 'totalTransferredBytes', 'co2Mg', 'carbonRating', 'hash', 'cookies', 'title', 'titleLength', 'titlePixelWidth', 'metaDescription', 'metaDescriptionLength', 'metaDescriptionPixelWidth', 'metaKeywords', 'metaKeywordsLength', 'h1', 'h1Length', 'h1Second', 'h1SecondLength', 'h1Count', 'h2', 'h2Length', 'h2Count', 'canonical', 'metaRobots', 'metaRobots2', 'xRobotsTag', 'metaRefresh', 'relNext', 'relPrev', 'httpRelNext', 'httpRelPrev', 'amphtml', 'mobileAlternate', 'language', 'indexable', 'indexabilityReason', 'wordCount', 'sentenceCount', 'avgWordsPerSentence', 'fleschReadingEase', 'readability', 'textRatio', 'internalLinks', 'uniqueInternalLinks', 'externalLinks', 'uniqueExternalLinks', 'imagesMissingAlt', 'uniqueJsOutlinks', 'uniqueExternalJsOutlinks', 'inlinks', 'uniqueInlinks', 'uniqueJsInlinks', 'percentOfTotal', 'linkScore', 'closestNearDuplicate', 'closestNearDuplicateSimilarity', 'nearDuplicates', 'error'];
const META_COLUMNS = ['category', 'testTitle', 'test', 'expect', 'discoveredVia', 'linkedFromHub'];

// ---------------------------------------------------------------- helpers
const keyOf = (u) => { const x = new URL(u); x.hash = ''; return x.href; };
const isLocal = (u) => { try { const x = new URL(u); return x.host === HOST && x.protocol === 'http:'; } catch { return false; } };
function resolve(href, base) {
  if (href == null) return null;
  const h = String(href).trim();
  if (!h || h.startsWith('#')) return null;
  try {
    const u = new URL(h, base);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    u.hash = '';
    return u.href;
  } catch { return null; }
}
const relHas = (attrs, token) => String(attrs.rel || '').toLowerCase().split(/\s+/).includes(token);
const folderDepth = (u) => { const p = new URL(u).pathname; const s = p.split('/').filter(Boolean); return p.endsWith('/') ? s.length : Math.max(0, s.length - 1); };
function parseLinkHeader(values, base) {
  const out = [];
  for (const v of [].concat(values || [])) {
    for (const part of String(v).match(/<[^>]*>[^,]*/g) || []) {
      const m = /<([^>]*)>(.*)/.exec(part);
      const params = {};
      for (const p of m[2].split(';')) { const mm = /\s*([a-z-]+)\s*=\s*"?([^"]*)"?/i.exec(p); if (mm) params[mm[1].toLowerCase()] = mm[2]; }
      out.push({ href: resolve(m[1], base), ...params });
    }
  }
  return out;
}
function parseRefresh(content, base) {
  const m = /^\s*(\d+(?:\.\d+)?)\s*(?:[;,]\s*(?:url\s*=\s*)?(.*))?$/i.exec(String(content || ''));
  if (!m) return null;
  const target = (m[2] || '').trim().replace(/^['"]|['"]$/g, '');
  return { delay: Number(m[1]), url: target ? resolve(target, base) : null };
}
// Browser encoding rules: header charset > <meta charset> prescan > windows-1252 (HTML spec default).
// An unknown label (e.g. "utf-6") is ignored like a missing one.
function decodeBody(buf, contentType) {
  const head = buf.toString('latin1', 0, 1024);
  const labels = [
    (/charset=["']?([^;\s"']+)/i.exec(contentType || '') || [])[1],
    (/<meta[^>]+charset\s*=\s*["']?([^"'\s;/>]+)/i.exec(head) || [])[1],
    'windows-1252',
  ];
  for (const l of labels) {
    if (!l) continue;
    try { return new TextDecoder(l).decode(buf); } catch {}
  }
  return new TextDecoder('windows-1252').decode(buf);
}
const noindex = (s) => /\b(noindex|none)\b/i.test(s || '');
function xRobotsApplies(value) {
  // "googlebot: noindex" applies, "otherbot: noindex" does not, plain directives apply.
  const KNOWN = /^(unavailable_after|max-snippet|max-image-preview|max-video-preview)$/i;
  let applies = '';
  let scope = 'all';
  for (const part of String(value || '').split(',')) {
    const m = /^\s*([a-z0-9_-]+)\s*:\s*(.*)$/i.exec(part);
    if (m && !KNOWN.test(m[1])) { scope = m[1].toLowerCase(); applies += scope === 'googlebot' ? ' ' + m[2] : ''; continue; }
    if (scope === 'all' || scope === 'googlebot') applies += ' ' + part;
  }
  return applies;
}

function fetchUrl(u) {
  return new Promise((resolveP) => {
    const url = new URL(u);
    const t0 = Date.now();
    const req = http.request({ host: url.hostname, port: url.port || 80, path: url.pathname + url.search, method: 'GET', headers: { 'User-Agent': UA, 'Accept-Encoding': 'gzip', Accept: 'text/html,application/xhtml+xml,*/*' } }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('error', () => resolveP({ error: 'Connection reset', ms: Date.now() - t0 }));
      res.on('aborted', () => resolveP({ error: 'Connection reset', ms: Date.now() - t0 }));
      res.on('end', () => {
        const raw = Buffer.concat(chunks);
        let body = raw;
        if (/gzip/i.test(res.headers['content-encoding'] || '')) { try { body = zlib.gunzipSync(raw); } catch { body = raw; } }
        resolveP({ status: res.statusCode, statusText: res.statusMessage, headers: res.headers, httpVersion: res.httpVersion, raw, body, ms: Date.now() - t0 });
      });
    });
    req.on('error', (e) => resolveP({ error: /reset|hang up/i.test(e.message) ? 'No response' : e.message, ms: Date.now() - t0 }));
    req.setTimeout(TIMEOUT, () => { req.destroy(); resolveP({ error: 'Timeout', ms: Date.now() - t0 }); });
    req.end();
  });
}

async function ensureServer() {
  const up = await new Promise((r) => { const q = http.get(ORIGIN + '/robots.txt', (res) => { res.resume(); r(true); }); q.on('error', () => r(false)); });
  if (up) return null;
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], { env: { ...process.env, QUIET: '1' }, stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((r) => child.stdout.once('data', r));
  return child;
}

// ---------------------------------------------------------------- crawl
(async () => {
  const child = await ensureServer();
  const robotsRes = await fetchUrl(ORIGIN + '/robots.txt');
  const robots = P.parseRobots(robotsRes.body.toString());
  const resourceCache = new Map();

  const nodes = new Map(); // key -> { key, depth, navDepth, via:Set, row, links:[], jsLinks:[] }
  let frontier = [];
  // Click depth counts navigational edges only (links, JS links, redirects). URLs reached
  // only through canonicals, hreflang, sitemaps or resources get the depth of that edge.
  const NAV = /^(start|link|link \(nofollow\)|JavaScript link|redirect)$/;
  const discover = (u, depth, via) => {
    if (!u || !isLocal(u)) return;
    const k = keyOf(u);
    let n = nodes.get(k);
    if (!n) { n = { key: k, depth, via: new Set(), links: [], jsLinks: [] }; nodes.set(k, n); frontier.push(n); }
    n.via.add(via);
    if (NAV.test(via) && (n.navDepth == null || depth < n.navDepth)) n.navDepth = depth;
  };
  discover(ORIGIN + '/', 0, 'start');

  for (let depth = 0; frontier.length; depth++) {
    const level = frontier;
    frontier = [];
    let i = 0;
    await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
      while (i < level.length) await crawlNode(level[i++], depth);
    }));
    process.stdout.write(`\rdepth ${depth}: ${nodes.size} URLs`);
  }
  console.log();

  async function resourceBytes(u) {
    if (resourceCache.has(u)) return resourceCache.get(u);
    const r = isLocal(u) && robotsAllowed(u) ? await fetchUrl(u) : null;
    const b = r && !r.error && r.status >= 200 && r.status < 300 ? r.raw.length : 0; // failed loads transfer nothing useful
    resourceCache.set(u, b);
    return b;
  }
  function robotsAllowed(u) { const x = new URL(u); return P.robotsAllowed(robots, UA, x.pathname + x.search); }

  async function crawlNode(n) {
    const url = n.key;
    const x = new URL(url);
    const def = match(decodeURIComponentSafe(x.pathname), decodeURIComponentSafe(x.pathname));
    n.def = def && def.path !== '/__404' ? def : null;
    const js = (n.def && n.def.js) || {};
    const row = Object.fromEntries(COLUMNS.map((c) => [c, '']));
    n.row = row;
    row.url = url;
    row.urlEncoded = url;
    row.depth = n.depth;
    row.folderDepth = folderDepth(url);
    row.crawlTimestamp = new Date().toISOString();
    if (!robotsAllowed(url)) {
      Object.assign(row, { statusText: 'Blocked by robots.txt', indexable: 'false', indexabilityReason: 'Blocked by robots.txt' });
      return;
    }
    const r = await fetchUrl(url);
    row.responseTimeMs = r.ms;
    if (r.error) {
      Object.assign(row, { error: r.error, indexable: 'false', indexabilityReason: 'Error' });
      return;
    }
    const ct = r.headers['content-type'] || '';
    Object.assign(row, {
      status: r.status, statusText: r.statusText, contentType: ct, httpVersion: r.httpVersion,
      lastModified: r.headers['last-modified'] || '', sizeBytes: r.body.length, transferredBytes: r.raw.length,
      hash: crypto.createHash('md5').update(r.body).digest('hex'),
      cookies: [].concat(r.headers['set-cookie'] || []).map((c) => c.split('=')[0].trim()).join(', '),
      xRobotsTag: r.headers['x-robots-tag'] || '',
    });
    const linkHdr = parseLinkHeader(r.headers.link, url);
    let redirect = null;
    if (r.status >= 300 && r.status < 400 && r.headers.location) redirect = { url: resolve(r.headers.location, url), type: 'HTTP Redirect' };
    if (!redirect && r.headers.refresh) {
      const rf = parseRefresh(r.headers.refresh, url);
      if (rf && rf.url && !(rf.url === url && rf.delay > 0)) redirect = { url: rf.url, type: 'HTTP Refresh Redirect' };
    }

    const isHtml = /html/i.test(ct) || (!ct && /^\s*</.test(r.body.toString('utf8', 0, 200)));
    // HTTP Link canonical applies to any 2xx resource (e.g. a PDF canonicalised to an HTML page)
    const hdrCanonAny = linkHdr.find((l) => /\bcanonical\b/i.test(l.rel || ''));
    if (!isHtml && hdrCanonAny && r.status >= 200 && r.status < 300) row.canonical = hdrCanonAny.href || '';
    let stats = { wordCount: 0, sentenceCount: 0, avgWordsPerSentence: '', fleschReadingEase: '', readability: '' };
    let textLen = 0;
    let doc = null;
    const resources = new Set();
    if (isHtml && r.status >= 200 && r.status < 300) {
      doc = P.parseHtml(decodeBody(r.body, ct));
      const base = doc.base ? resolve(doc.base, url) || url : url;
      const headMeta = (name) => doc.metas.filter((m) => m.inHead && String(m.name || '').toLowerCase() === name);
      const headLink = (rel) => doc.links.filter((l) => l.inHead && relHas(l, rel) && l.href != null);
      const title = js.title !== undefined ? js.title : doc.titles[0] ? P.ws(doc.titles[0].text) : '';
      const desc = js.metaDescription !== undefined ? js.metaDescription : headMeta('description')[0] ? P.ws(headMeta('description')[0].content) : '';
      const kw = headMeta('keywords')[0] ? P.ws(headMeta('keywords')[0].content) : '';
      const h1s = js.h1 !== undefined ? [js.h1, ...doc.h1.slice(js.h1 && doc.h1.length ? 1 : 0)] : doc.h1;
      const robotsMetas = doc.metas.filter((m) => m.inHead && /^(robots|googlebot)$/i.test(m.name || '')).map((m) => m.content || '');
      if (js.metaRobots) robotsMetas.push(js.metaRobots);
      const htmlCanon = headLink('canonical').map((l) => String(l.href).trim()).filter(Boolean)[0];
      const hdrCanon = linkHdr.find((l) => /\bcanonical\b/i.test(l.rel || ''));
      const canonical = js.canonical || (htmlCanon ? resolve(htmlCanon, base) : hdrCanon ? hdrCanon.href : '');
      const refreshMeta = doc.metas.find((m) => String(m['http-equiv'] || '').toLowerCase() === 'refresh');
      const mobile = headLink('alternate').find((l) => l.media) || linkHdr.find((l) => /\balternate\b/i.test(l.rel || '') && l.media);
      Object.assign(row, {
        title, titleLength: title.length, titlePixelWidth: P.pixelWidth(title, 20),
        metaDescription: desc, metaDescriptionLength: desc.length, metaDescriptionPixelWidth: P.pixelWidth(desc, 14),
        metaKeywords: kw, metaKeywordsLength: kw.length,
        h1: h1s[0] || '', h1Length: (h1s[0] || '').length, h1Second: h1s[1] || '', h1SecondLength: (h1s[1] || '').length, h1Count: h1s.length,
        h2: doc.h2[0] || '', h2Length: (doc.h2[0] || '').length, h2Count: doc.h2.length,
        canonical: canonical || '',
        metaRobots: robotsMetas[0] || '', metaRobots2: robotsMetas[1] || '',
        metaRefresh: refreshMeta ? refreshMeta.content || '' : '',
        relNext: (headLink('next')[0] && resolve(headLink('next')[0].href, base)) || '',
        relPrev: (headLink('prev')[0] && resolve(headLink('prev')[0].href, base)) || '',
        httpRelNext: (linkHdr.find((l) => /\bnext\b/i.test(l.rel || '')) || {}).href || '',
        httpRelPrev: (linkHdr.find((l) => /\bprev\b/i.test(l.rel || '')) || {}).href || '',
        amphtml: (headLink('amphtml')[0] && resolve(headLink('amphtml')[0].href, base)) || '',
        mobileAlternate: mobile ? (mobile.href && mobile.href.startsWith('http') ? mobile.href : resolve(mobile.href, base)) || '' : '',
        language: doc.lang || '',
      });
      if (!redirect && refreshMeta) {
        const rf = parseRefresh(refreshMeta.content, base);
        if (rf && rf.url && !(rf.url === url && rf.delay > 0)) redirect = { url: rf.url, type: 'Meta Refresh Redirect' };
      }
      if (!redirect && js.redirect) redirect = { url: resolve(js.redirect, url), type: 'JavaScript Redirect' };

      // links
      const anchors = doc.anchors.map((a) => ({ href: resolve(a.href, base), rel: a.rel || '' })).filter((a) => a.href);
      const jsLinks = (js.links || []).map((h) => resolve(h, url)).filter(Boolean);
      n.links = anchors.map((a) => a.href);
      n.jsLinks = jsLinks;
      const all = [...n.links, ...jsLinks];
      const internal = all.filter(isLocal);
      const external = all.filter((h) => !isLocal(h));
      Object.assign(row, {
        internalLinks: internal.length, uniqueInternalLinks: new Set(internal).size,
        externalLinks: external.length, uniqueExternalLinks: new Set(external).size,
        imagesMissingAlt: doc.imgs.filter((im) => !('alt' in im) || !String(im.alt).trim()).length,
        uniqueJsOutlinks: new Set(jsLinks.filter((h) => !n.links.includes(h))).size,
        uniqueExternalJsOutlinks: new Set(jsLinks.filter((h) => !isLocal(h) && !n.links.includes(h))).size,
      });
      stats = P.textStats(doc.text);
      textLen = doc.text.length;
      if (js.addWords) {
        // JS-inserted copy: ~11 words per sentence, ~6 characters per word
        stats.wordCount += js.addWords;
        stats.sentenceCount += Math.ceil(js.addWords / 11);
        textLen += js.addWords * 6;
      }
      n.shingles = shingles(doc.text);

      // discovery
      const D = n.depth + 1;
      anchors.forEach((a) => discover(a.href, D, /\bnofollow\b/i.test(a.rel) ? 'link (nofollow)' : 'link'));
      jsLinks.forEach((h) => discover(h, D, 'JavaScript link'));
      if (canonical) discover(canonical, D, 'canonical');
      doc.links.filter((l) => l.inHead && l.hreflang).forEach((l) => discover(resolve(l.href, base), D, 'hreflang'));
      linkHdr.forEach((l) => discover(l.href, D, l.hreflang ? 'hreflang (HTTP)' : /canonical/i.test(l.rel || '') ? 'canonical (HTTP)' : 'Link header'));
      if (row.amphtml) discover(row.amphtml, D, 'amphtml');
      if (row.mobileAlternate) discover(row.mobileAlternate, D, 'mobile alternate');
      ['next', 'prev'].forEach((rel) => headLink(rel).forEach((l) => discover(resolve(l.href, base), D, 'rel=' + rel)));
      doc.links.filter((l) => l.inHead && (relHas(l, 'author') || (relHas(l, 'alternate') && l.type))).forEach((l) => discover(resolve(l.href, base), D, '<link> in head'));
      doc.areas.forEach((a) => discover(resolve(a.href, base), D, '<area>'));
      doc.iframes.forEach((f) => discover(resolve(f.src, base), D, '<iframe>'));
      doc.links.filter((l) => relHas(l, 'stylesheet')).forEach((l) => resources.add(resolve(l.href, base)));
      doc.scripts.filter((s) => s.src).forEach((s) => resources.add(resolve(s.src, base)));
      doc.imgs.filter((im) => im.src && !/^data:/.test(im.src)).forEach((im) => resources.add(resolve(im.src, base)));
      doc.styleUrls.forEach((h) => resources.add(resolve(h, base)));
      (js.resources || []).forEach((h) => { const u = resolve(h, url); resources.add(u); discover(u, D, 'JavaScript fetch'); });
      [...resources].filter(Boolean).forEach((h) => discover(h, D, 'resource'));
    } else if (isHtml && r.status >= 400) {
      // Browsers render error pages too, so their CSS/JS/images count towards total transfer.
      const d = P.parseHtml(decodeBody(r.body, ct));
      d.links.filter((l) => relHas(l, 'stylesheet')).forEach((l) => resources.add(resolve(l.href, url)));
      d.scripts.filter((s) => s.src).forEach((s) => resources.add(resolve(s.src, url)));
      d.imgs.filter((im) => im.src && !/^data:/.test(im.src)).forEach((im) => resources.add(resolve(im.src, url)));
    }
    if (r.status === 204 || r.status === 205) resources.clear(); // nothing is rendered
    if (/xml|gzip/i.test(ct) && /sitemap/i.test(url) && r.status === 200) {
      let xml = r.body;
      if (/gzip/i.test(ct)) { try { xml = zlib.gunzipSync(r.body); } catch {} }
      const s = xml.toString();
      for (const m of s.matchAll(/<(?:loc|image:loc)>\s*([^<\s]+)\s*<\/|<xhtml:link[^>]*href="([^"]+)"/g)) discover(resolve(P.decode(m[1] || m[2]), url), n.depth + 1, 'XML sitemap');
    }
    if (url === ORIGIN + '/robots.txt') robots.sitemaps.forEach((s) => discover(s, n.depth + 1, 'robots.txt Sitemap:'));
    if (redirect && redirect.url) discover(redirect.url, n.depth + 1, 'redirect');

    let res = 0;
    for (const h of resources) if (h) res += await resourceBytes(h);
    row.totalTransferredBytes = r.raw.length + res;
    Object.assign(row, stats, { textRatio: row.sizeBytes ? +((textLen / row.sizeBytes) * 100).toFixed(3) : 0 });
    if (redirect) Object.assign(row, { redirectUrl: redirect.url || '', redirectType: redirect.type });

    // indexability
    const s = Number(row.status);
    let reason = '';
    if (redirect || (s >= 300 && s < 400)) reason = redirect ? 'Redirected' : `Status ${s}`;
    else if (s < 200 || s >= 300) reason = `Status ${s}`;
    else if (noindex(row.metaRobots) || noindex(row.metaRobots2)) reason = 'noindex (meta)';
    else if (noindex(xRobotsApplies(row.xRobotsTag))) reason = 'noindex (X-Robots-Tag)';
    else if (row.canonical && normUrl(row.canonical) !== normUrl(url)) reason = 'Canonicalised';
    row.indexable = reason ? 'false' : 'true';
    row.indexabilityReason = reason;
  }

  // ---------------------------------------------------------------- inlinks & near duplicates
  for (const n of nodes.values()) {
    if (!n.row || !n.row.status) continue;
    for (const [list, isJs] of [[n.links, false], [n.jsLinks, true]]) {
      const seen = new Set();
      for (const h of list) {
        const t = nodes.get(h);
        if (!t || !t.row) continue;
        t.inl = (t.inl || 0) + 1;
        if (!seen.has(h)) { seen.add(h); t.uinl = (t.uinl || 0) + 1; if (isJs && !n.links.includes(h)) t.ujs = (t.ujs || 0) + 1; }
      }
    }
  }
  const cand = [...nodes.values()].filter((n) => n.shingles && n.shingles.size && n.row.indexable === 'true');
  for (const a of cand) {
    let best = 0, bestUrl = '', count = 0;
    for (const b of cand) {
      if (a === b) continue;
      const lo = Math.min(a.shingles.size, b.shingles.size), hi = Math.max(a.shingles.size, b.shingles.size);
      if (lo / hi < 0.9) continue;
      let inter = 0;
      for (const s of a.shingles) if (b.shingles.has(s)) inter++;
      const sim = inter / (a.shingles.size + b.shingles.size - inter);
      if (sim >= 0.9) count++;
      if (sim > best) { best = sim; bestUrl = b.key; }
    }
    a.near = { count, best, bestUrl };
  }
  // Values that depend on who is crawling (UA / IP / request header echo pages): "*" = any value.
  const ECHO = /\/other\/(crawler_user_agent|crawler_ip_address|crawler_request_headers)$/;
  const ECHO_COLS = ['sizeBytes', 'transferredBytes', 'totalTransferredBytes', 'hash', 'title', 'titleLength', 'titlePixelWidth', 'metaDescription', 'metaDescriptionLength', 'metaDescriptionPixelWidth', 'wordCount', 'sentenceCount', 'avgWordsPerSentence', 'fleschReadingEase', 'readability', 'textRatio'];
  const edges = {};
  for (const n of nodes.values()) {
    if (!n.row) continue;
    if (n.navDepth != null) n.row.depth = n.navDepth;
    if (ECHO.test(n.key)) for (const c of ECHO_COLS) n.row[c] = '*';
    if (n.links.length || n.jsLinks.length) edges[n.key] = { links: n.links, jsLinks: n.jsLinks.filter((h) => !n.links.includes(h)) };
    Object.assign(n.row, { inlinks: n.inl || 0, uniqueInlinks: n.uinl || 0, uniqueJsInlinks: n.ujs || 0 });
    if (n.near) Object.assign(n.row, { nearDuplicates: n.near.count, closestNearDuplicate: n.near.best >= 0.9 ? n.near.bestUrl : '', closestNearDuplicateSimilarity: n.near.best >= 0.9 ? +(n.near.best * 100).toFixed(3) : '' });
  }

  // ---------------------------------------------------------------- write CSV
  const csv = (v) => { const s = v == null ? '' : String(v); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const lines = [[...COLUMNS, ...META_COLUMNS].join(',')];
  const sorted = [...nodes.values()].filter((n) => n.row).sort((a, b) => a.row.depth - b.row.depth);
  for (const n of sorted) {
    const d = n.def;
    const meta = { category: d ? d.cat : '', testTitle: d ? d.title : '', test: d ? d.test : '', expect: d ? d.expect : '', discoveredVia: [...n.via].join(' | '), linkedFromHub: d ? (d.listed ? 'yes' : 'no') : '' };
    lines.push([...COLUMNS.map((c) => csv(n.row[c])), ...META_COLUMNS.map((c) => csv(meta[c]))].join(','));
  }
  fs.writeFileSync(path.join(__dirname, '..', 'expected-results.csv'), '﻿' + lines.join('\r\n') + '\r\n');
  // Link graph, so compare.js can recount inlinks using only the pages a crawler actually crawled.
  fs.writeFileSync(path.join(__dirname, '..', 'expected-links.json'), JSON.stringify(edges));
  console.log(`Wrote expected-results.csv: ${sorted.length} rows × ${COLUMNS.length + META_COLUMNS.length} columns`);
  if (child) child.kill();
})();

function decodeURIComponentSafe(s) { try { return decodeURIComponent(s); } catch { return s; } }
function decodeURISafe(s) { try { return decodeURI(s); } catch { return s; } }
function normUrl(u) { try { const x = new URL(u); x.hash = ''; return decodeURISafe(x.href); } catch { return u; } }
function shingles(text) {
  const w = P.words(text.toLowerCase());
  const s = new Set();
  for (let i = 0; i + 3 <= w.length; i++) s.add(w[i] + ' ' + w[i + 1] + ' ' + w[i + 2]);
  return s;
}
