// /stats: live statistics for the whole site. Every load requests each registered test URL
// from this server (like npm run check) and aggregates what came back, so the numbers
// always reflect the current code rather than the last expected-results.csv.

const http = require('http');
const { add, CATS, tests } = require('../registry');
const { render, esc } = require('../html');
const { PORT, ORIGIN } = require('../config');
const P = require('../../scripts/lib/parse');

// Pages that hang, delay or drop the connection on purpose (same list as scripts/selftest.js).
const SLOW = /timeout|slow_5s|page_load_time|slow_ttfb|no_response|connection_reset|renderer/;
const CONCURRENCY = 16;
const HOST = new URL(ORIGIN).host;

function get(href) {
  return new Promise((resolve) => {
    const p = href.startsWith('http') ? href.replace(/^http:\/\/[^/]+/, '') : href;
    const t0 = Date.now();
    // X-Stats-Scan keeps these requests out of the console log (see server.js).
    const req = http.request({ host: 'localhost', port: PORT, path: p, method: 'GET', headers: { Host: HOST, 'User-Agent': 'yaka-stats', 'X-Stats-Scan': '1' } }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks), ms: Date.now() - t0 }));
    });
    req.on('error', (e) => resolve({ status: 0, error: e.message, headers: {}, body: Buffer.alloc(0), ms: Date.now() - t0 }));
    req.setTimeout(10000, () => req.destroy(new Error('timeout')));
    req.end();
  });
}

async function pool(items, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
}

const noindex = (v) => /\b(noindex|none)\b/i.test(String(v || ''));
const tally = (map, key, n = 1) => map.set(key, (map.get(key) || 0) + n);

// One scanned URL -> the facts the statistics are built from.
function analyse(def, res, robots) {
  const type = String(res.headers['content-type'] || '').split(';')[0].trim().toLowerCase() || '(none)';
  const url = new URL(def.href, ORIGIN);
  const r = { def, status: res.status, type, bytes: res.body.length, ms: res.ms, html: type === 'text/html' && res.body.length > 0 };
  r.blocked = !P.robotsAllowed(robots, '*', url.pathname + url.search);
  const xrt = [].concat(res.headers['x-robots-tag'] || []).filter((v) => !/^\s*[a-z-]+bot[a-z-]*\s*:/i.test(v) || /^\s*googlebot\s*:/i.test(v));
  r.noindex = xrt.some(noindex);
  if (r.html) {
    const doc = P.parseHtml(res.body.toString('utf8'));
    const head = doc.metas.filter((m) => m.inHead);
    const meta = (n) => head.filter((m) => String(m.name || '').toLowerCase() === n);
    const title = doc.titles[0] ? P.ws(doc.titles[0].text) : null;
    const desc = meta('description')[0];
    const canon = doc.links.find((l) => l.inHead && String(l.rel || '').toLowerCase().split(/\s+/).includes('canonical'));
    r.title = title;
    r.titleCount = doc.titles.filter((t) => t.inHead).length;
    r.desc = desc ? P.ws(desc.content) : null;
    r.descCount = meta('description').length;
    r.h1 = doc.h1.length;
    r.canonical = canon && canon.href ? new URL(canon.href, url).href : null;
    r.imgsNoAlt = doc.imgs.filter((i) => !('alt' in i)).length;
    r.words = P.textStats(doc.text).wordCount;
    r.noindex = r.noindex || [...meta('robots'), ...meta('googlebot')].some((m) => noindex(m.content));
  }
  const s = res.status;
  r.reason = s === 0 ? 'No response' : r.blocked ? 'Blocked by robots.txt' : s >= 300 && s < 400 ? 'Redirected' : s !== 200 ? 'Non-200 status' : r.noindex ? 'Noindex' : r.canonical && r.canonical !== url.href ? 'Canonicalised' : '';
  r.indexable = !r.reason;
  return r;
}

const fmt = (n) => Number(n).toLocaleString('en-US');
const pct = (n, d) => (d ? ((n / d) * 100).toFixed(1) + '%' : '–');
const kb = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : (b / 1024).toFixed(1) + ' KB');

// A two-column table with a proportional bar, sorted by count.
function barTable(caption, map, total) {
  const rows = [...map].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
  const max = Math.max(1, ...rows.map((x) => x[1]));
  return `<h3>${esc(caption)}</h3>
<table class="tests stats"><tbody>
${rows.map(([k, n]) => `<tr><td>${esc(k)}</td><td class="num">${fmt(n)}</td><td class="num">${pct(n, total)}</td><td class="barcell"><span class="bar" style="width:${((n / max) * 100).toFixed(1)}%"></span></td></tr>`).join('\n')}
</tbody></table>`;
}

add({
  cat: '_site',
  path: '/stats',
  title: '/stats',
  listed: false,
  handler: async () => {
    const t0 = Date.now();
    const defs = tests();
    const scan = defs.filter((d) => !SLOW.test(d.path));
    const robotsRes = await get('/robots.txt');
    const robots = P.parseRobots(robotsRes.body.toString('utf8'));
    const results = (await pool(scan, (d) => get(d.href))).map((res, i) => analyse(scan[i], res, robots));
    const html = results.filter((r) => r.html);
    const ok = html.filter((r) => r.status === 200);

    const statusClass = new Map(), statusCode = new Map(), types = new Map(), reasons = new Map(), unlinked = new Map(), folders = new Map();
    for (const r of results) {
      tally(statusClass, r.status ? `${String(r.status)[0]}xx` : 'No response');
      tally(statusCode, r.status ? `${r.status} ${http.STATUS_CODES[r.status] || ''}`.trim() : 'No response');
      tally(types, r.type);
      tally(reasons, r.indexable ? 'Indexable' : r.reason);
    }
    for (const d of defs) {
      if (!d.listed) tally(unlinked, d.unlinkedReason || 'discovered another way');
      tally(folders, '/' + (d.path.split('/')[1] || ''));
    }

    // On-page checks over HTML pages that answered 200.
    const titleDup = new Map();
    for (const r of ok) if (r.title) tally(titleDup, r.title);
    const descDup = new Map();
    for (const r of ok) if (r.desc) tally(descDup, r.desc);
    const issues = new Map([
      ['Missing or empty title', ok.filter((r) => !r.title).length],
      ['Duplicate title', ok.filter((r) => r.title && titleDup.get(r.title) > 1).length],
      ['Title over 60 characters', ok.filter((r) => r.title && r.title.length > 60).length],
      ['Multiple <title> tags', ok.filter((r) => r.titleCount > 1).length],
      ['Missing or empty meta description', ok.filter((r) => !r.desc).length],
      ['Duplicate meta description', ok.filter((r) => r.desc && descDup.get(r.desc) > 1).length],
      ['Meta description over 155 characters', ok.filter((r) => r.desc && r.desc.length > 155).length],
      ['Multiple meta descriptions', ok.filter((r) => r.descCount > 1).length],
      ['Missing H1', ok.filter((r) => !r.h1).length],
      ['Multiple H1', ok.filter((r) => r.h1 > 1).length],
      ['No canonical tag', ok.filter((r) => !r.canonical).length],
      ['Images without alt attribute', ok.filter((r) => r.imgsNoAlt).length],
      ['Under 200 words', ok.filter((r) => r.words < 200).length],
    ]);

    const bytes = results.reduce((a, r) => a + r.bytes, 0);
    const words = ok.reduce((a, r) => a + r.words, 0);
    const linked = defs.filter((d) => d.listed).length;
    const ms = results.map((r) => r.ms).sort((a, b) => a - b);
    const tile = (n, label) => `<div class="card"><strong class="big">${n}</strong><span>${esc(label)}</span></div>`;

    const catRows = CATS.map(([k, label]) => {
      const all = defs.filter((d) => d.cat === k);
      const rs = results.filter((r) => r.def.cat === k);
      const n = (f) => rs.filter(f).length;
      return `<tr><td><a href="/tests/${k}">${esc(label)}</a></td><td class="num">${all.length}</td><td class="num">${all.filter((d) => d.listed).length}</td>` +
        `<td class="num">${n((r) => r.status >= 200 && r.status < 300)}</td><td class="num">${n((r) => r.status >= 300 && r.status < 400)}</td>` +
        `<td class="num">${n((r) => r.status >= 400 && r.status < 500)}</td><td class="num">${n((r) => r.status >= 500)}</td><td class="num">${n((r) => r.indexable)}</td></tr>`;
    }).join('\n');

    return render({
      title: 'Site Statistics – Live Scan of Every Test URL',
      description: 'Live statistics for the whole crawler test site: status codes, content types, indexability and on-page issues across every test URL.',
      h1: 'Site statistics',
      headers: { 'Cache-Control': 'no-store' },
      body: `<p>Generated just now by requesting every registered test URL from this server, so it always shows the
current state of the code. ${scan.length} of ${defs.length} URLs were scanned in ${fmt(Date.now() - t0)} ms; ${defs.length - scan.length}
deliberately slow or connection-dropping tests were skipped. Indexability uses the robots.txt <code>*</code> group, meta robots,
X-Robots-Tag and canonicals; JavaScript is not run.</p>
<div class="grid">
${tile(fmt(defs.length), 'test URLs')}
${tile(CATS.length, 'categories')}
${tile(`${fmt(linked)} / ${fmt(defs.length - linked)}`, 'linked / unlinked')}
${tile(fmt(results.filter((r) => r.indexable).length), 'indexable URLs')}
${tile(fmt(html.length), 'HTML pages')}
${tile(kb(bytes), 'total response size')}
${tile(fmt(words), 'words on 200 HTML pages')}
${tile(`${ms[Math.floor(ms.length / 2)] || 0} ms`, 'median response time')}
</div>

<h2>By category</h2>
<table class="tests stats">
<thead><tr><th>Category</th><th class="num">URLs</th><th class="num">Linked</th><th class="num">2xx</th><th class="num">3xx</th><th class="num">4xx</th><th class="num">5xx</th><th class="num">Indexable</th></tr></thead>
<tbody>
${catRows}
</tbody></table>

<h2>Responses</h2>
${barTable('Status class', statusClass, results.length)}
${barTable('Status codes', statusCode, results.length)}
${barTable('Content types', types, results.length)}

<h2>Indexability</h2>
${barTable('Indexable vs. reason it is not', reasons, results.length)}

<h2>On-page issues (${fmt(ok.length)} HTML pages with status 200)</h2>
${barTable('Pages affected', issues, ok.length)}

<h2>Site structure</h2>
${barTable('Unlinked URLs by how they are found', unlinked, defs.length - linked)}
${barTable('URLs by top-level folder', folders, defs.length)}`,
      filler: false,
    });
  },
});
