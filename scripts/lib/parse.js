// Reference parsing for scripts/expected.js – zero dependencies.
// Implements the parts of the HTML5 parsing rules that matter for SEO extraction:
// raw-text <script>/<style>/<noscript>, RCDATA <title>, attribute tokenising (incl. the
// "unfinished tag" behaviour), and the implicit closing of <head> by body content.

const ENT = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', ldquo: '“', rdquo: '”',
  lsquo: '‘', rsquo: '’', copy: '©', reg: '®', hellip: '…', raquo: '»', laquo: '«', rsaquo: '›', lsaquo: '‹', pound: '£', euro: '€',
};
function decode(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);?/gi, (m, e) => {
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENT[e.toLowerCase()] !== undefined && (m.endsWith(';') || ENT[e.toLowerCase()]) ? ENT[e.toLowerCase()] : m;
  });
}

const VOID = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
const RAWTEXT = new Set(['script', 'style', 'noscript', 'iframe', 'noembed', 'noframes', 'xmp', 'template']);
const RCDATA = new Set(['title', 'textarea']);
// Elements whose boundaries are line breaks in innerText (used for sentence counting).
const BLOCK = /^(p|div|li|ul|ol|dl|dt|dd|h[1-6]|section|article|aside|header|footer|nav|main|figure|figcaption|address|table|thead|tbody|tr|td|th|caption|form|fieldset|button|select|option|blockquote|pre|hr|br)$/;
const HEAD_OK =new Set(['meta', 'link', 'title', 'style', 'script', 'base', 'noscript', 'template']);

function tokenize(html) {
  const out = [];
  const n = html.length;
  let i = 0;
  let text = '';
  const flush = () => {
    if (text) out.push({ type: 'text', text: decode(text) });
    text = '';
  };
  while (i < n) {
    const c = html[i];
    if (c !== '<') {
      text += c;
      i++;
      continue;
    }
    if (html.startsWith('<!--', i)) {
      flush();
      const e = html.indexOf('-->', i + 4);
      i = e < 0 ? n : e + 3;
      continue;
    }
    if (html[i + 1] === '!' || html[i + 1] === '?') {
      flush();
      const e = html.indexOf('>', i);
      i = e < 0 ? n : e + 1;
      continue;
    }
    const m = /^<(\/?)([a-zA-Z][^\s/>]*)/.exec(html.slice(i, i + 100));
    if (!m) {
      text += c;
      i++;
      continue;
    }
    flush();
    const end = m[1] === '/';
    const name = m[2].toLowerCase();
    let j = i + m[0].length;
    const attrs = {};
    while (j < n) {
      while (j < n && /\s/.test(html[j])) j++;
      if (j >= n) break;
      if (html[j] === '>') { j++; break; }
      if (html[j] === '/') { j++; continue; }
      let k = j + 1; // first char may be anything (incl. "<" or "=")
      while (k < n && !/[\s/>=]/.test(html[k])) k++;
      const an = html.slice(j, k).toLowerCase();
      j = k;
      while (j < n && /\s/.test(html[j])) j++;
      let val = '';
      if (html[j] === '=') {
        j++;
        while (j < n && /\s/.test(html[j])) j++;
        if (html[j] === '"' || html[j] === "'") {
          const q = html[j];
          const e = html.indexOf(q, j + 1);
          val = html.slice(j + 1, e < 0 ? n : e);
          j = e < 0 ? n : e + 1;
        } else {
          let e = j;
          while (e < n && !/[\s>]/.test(html[e])) e++;
          val = html.slice(j, e);
          j = e;
        }
      }
      if (!(an in attrs)) attrs[an] = decode(val);
    }
    i = j;
    if (end) {
      out.push({ type: 'end', name });
      continue;
    }
    out.push({ type: 'start', name, attrs });
    if (RAWTEXT.has(name) || RCDATA.has(name)) {
      const re = new RegExp(`</${name}[\\s/>]`, 'i');
      const rest = html.slice(i);
      const mm = re.exec(rest);
      const raw = mm ? rest.slice(0, mm.index) : rest;
      out.push({ type: 'raw', name, text: RCDATA.has(name) ? decode(raw) : raw });
      out.push({ type: 'end', name });
      if (!mm) { i = n; continue; }
      const close = html.indexOf('>', i + mm.index);
      i = close < 0 ? n : close + 1;
    }
  }
  flush();
  return out;
}

const ws = (s) => String(s || '').replace(/[ \t\n\r\f]+/g, ' ').trim();
const isHidden = (a) => 'hidden' in a || /display\s*:\s*none/i.test(a.style || '');

// Parse an HTML document into the facts an SEO crawler extracts.
function parseHtml(html) {
  const doc = { lang: null, titles: [], metas: [], links: [], base: null, h1: [], h2: [], anchors: [], imgs: [], areas: [], iframes: [], scripts: [], styleUrls: [], text: '' };
  let mode = 'initial'; // initial -> inhead -> afterhead -> inbody
  const stack = []; // open body elements: {name, hidden, collect}
  let hiddenDepth = 0;
  let svgDepth = 0;
  const textParts = [];
  const collectors = []; // open h1/h2/a capturing text

  const toBody = () => { mode = 'inbody'; };
  const inHead = () => mode === 'inhead' || mode === 'initial' || mode === 'afterhead';
  const addText = (t) => {
    for (const c of collectors) c.text += t;
    if (mode === 'inbody' && !hiddenDepth) textParts.push(t);
  };

  const tokens = tokenize(html);
  for (let k = 0; k < tokens.length; k++) {
    const t = tokens[k];
    if (t.type === 'text') {
      if (mode !== 'inbody' && /\S/.test(t.text)) toBody();
      addText(t.text);
      continue;
    }
    if (t.type === 'raw') {
      const owner = t.name;
      if (owner === 'title') {
        if (!svgDepth) doc.titles.push({ text: t.text, inHead: inHead() });
      } else if (owner === 'textarea') addText(t.text);
      else if (owner === 'script') {
        const s = doc.scripts[doc.scripts.length - 1];
        if (s) s.text = t.text;
      }
      continue;
    }
    if (t.type === 'start') {
      const { name, attrs } = t;
      if (name === 'html') { if (doc.lang == null && 'lang' in attrs) doc.lang = attrs.lang; continue; }
      if (name === 'head') { if (mode === 'initial') mode = 'inhead'; continue; }
      if (name === 'body') { toBody(); continue; }
      if (mode !== 'inbody' && !HEAD_OK.has(name)) toBody();
      if (mode === 'initial') mode = 'inhead';
      const head = mode !== 'inbody';
      if (name === 'svg') svgDepth++;
      if (name === 'meta') doc.metas.push({ ...attrs, inHead: head });
      else if (name === 'link') doc.links.push({ ...attrs, inHead: head });
      else if (name === 'base') { if (!doc.base && attrs.href != null) doc.base = attrs.href; }
      else if (name === 'script') doc.scripts.push({ src: attrs.src, type: (attrs.type || '').toLowerCase(), text: '' });
      else if (name === 'img') doc.imgs.push(attrs);
      else if (name === 'area') doc.areas.push(attrs);
      else if (name === 'iframe') doc.iframes.push(attrs);
      // inline style="background-image:url(...)" is downloaded by browsers
      for (const m of String(attrs.style || '').matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) doc.styleUrls.push(m[1]);
      if (mode === 'inbody' && !VOID.has(name) && !RAWTEXT.has(name) && !RCDATA.has(name)) {
        const hidden = isHidden(attrs);
        if (hidden) hiddenDepth++;
        const el = { name, hidden };
        if (name === 'h1' || name === 'h2' || name === 'a') {
          el.collect = { name, attrs, text: '' };
          collectors.push(el.collect);
        }
        stack.push(el);
        if (BLOCK.test(name)) addText('\n');
      } else if (mode === 'inbody' && BLOCK.test(name)) addText('\n');
      continue;
    }
    if (t.type === 'end') {
      const { name } = t;
      if (name === 'head') { if (mode !== 'inbody') mode = 'afterhead'; continue; }
      if (name === 'svg' && svgDepth) svgDepth--;
      const at = stack.map((e) => e.name).lastIndexOf(name);
      if (at < 0) continue;
      while (stack.length > at) {
        const el = stack.pop();
        if (el.hidden) hiddenDepth--;
        if (el.collect) {
          collectors.splice(collectors.indexOf(el.collect), 1);
          const c = el.collect;
          if (c.name === 'h1') doc.h1.push(ws(c.text));
          else if (c.name === 'h2') doc.h2.push(ws(c.text));
          else doc.anchors.push({ ...c.attrs, text: ws(c.text) });
        }
      }
      addText(BLOCK.test(name) ? '\n' : ' ');
    }
  }
  // unclosed elements at EOF
  while (stack.length) {
    const el = stack.pop();
    if (!el.collect) continue;
    const c = el.collect;
    if (c.name === 'h1') doc.h1.push(ws(c.text));
    else if (c.name === 'h2') doc.h2.push(ws(c.text));
    else doc.anchors.push({ ...c.attrs, text: ws(c.text) });
  }
  // keep block boundaries as "\n", collapse all other whitespace
  doc.text = textParts.join('').replace(/[^\S\n]+/g, ' ').replace(/ ?\n\s*/g, '\n').trim();
  return doc;
}

// ---------------------------------------------------------------- text statistics
function words(text) {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
}
function syllables(w) {
  w = w.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const m = w.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}
function textStats(text) {
  const w = words(text);
  // sentence ends: . ! ? followed by whitespace, or a block boundary (line break in innerText)
  const sentences = text.split(/[.!?]+(?=\s|$)|\n+/).filter((s) => words(s).length).length;
  const syl = w.reduce((a, x) => a + syllables(x), 0);
  const asl = sentences ? w.length / sentences : 0;
  // Flesch reading ease, clamped to 0–100 as SEO tools report it
  // undefined for text without letters (e.g. only numbers)
  const raw = w.length && sentences && syl ? 206.835 - 1.015 * asl - 84.6 * (syl / w.length) : null;
  const flesch = raw == null ? null : Math.min(100, Math.max(0, raw));
  return { wordCount: w.length, sentenceCount: sentences, avgWordsPerSentence: sentences ? +asl.toFixed(3) : '', fleschReadingEase: flesch == null ? '' : +flesch.toFixed(3), readability: flesch == null ? '' : readabilityLabel(flesch) };
}
function readabilityLabel(f) {
  if (f >= 90) return 'Very Easy';
  if (f >= 80) return 'Easy';
  if (f >= 70) return 'Fairly Easy';
  if (f >= 60) return 'Normal';
  if (f >= 50) return 'Fairly Hard';
  if (f >= 30) return 'Hard';
  return 'Very Hard';
}

// ---------------------------------------------------------------- pixel width (Arial advance widths /1000 em)
const ARIAL = {
  ' ': 278, '!': 278, '"': 355, '#': 556, $: 556, '%': 889, '&': 667, "'": 191, '(': 333, ')': 333, '*': 389, '+': 584, ',': 278, '-': 333, '.': 278, '/': 278,
  0: 556, 1: 556, 2: 556, 3: 556, 4: 556, 5: 556, 6: 556, 7: 556, 8: 556, 9: 556, ':': 278, ';': 278, '<': 584, '=': 584, '>': 584, '?': 556, '@': 1015,
  A: 667, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, I: 278, J: 500, K: 667, L: 556, M: 833, N: 722, O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611,
  U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611, '[': 278, '\\': 278, ']': 278, '^': 469, _: 556, '`': 333,
  a: 556, b: 556, c: 500, d: 556, e: 556, f: 278, g: 556, h: 556, i: 222, j: 222, k: 500, l: 222, m: 833, n: 556, o: 556, p: 556, q: 556, r: 333, s: 500, t: 278,
  u: 556, v: 500, w: 722, x: 500, y: 500, z: 500, '{': 334, '|': 260, '}': 334, '~': 584, '–': 556, '—': 1000, '“': 333, '”': 333, '‘': 222, '’': 222, '…': 1000, '©': 737, ' ': 278, '↔': 1000, '→': 1000, '←': 1000, '›': 333, '·': 278, '×': 584, '≥': 549, '≤': 549, '⚡': 1000,
};
function pixelWidth(s, px) {
  let u = 0;
  for (const ch of s) u += ARIAL[ch] !== undefined ? ARIAL[ch] : /[　-鿿＀-￯]/.test(ch) ? 1000 : 556;
  return Math.round((u * px) / 1000);
}

// ---------------------------------------------------------------- robots.txt (Google semantics)
function parseRobots(txt) {
  const groups = [];
  let cur = null;
  let lastUA = false;
  const sitemaps = [];
  for (let line of String(txt).split(/\r?\n/)) {
    line = line.replace(/#.*$/, '').trim();
    if (!line) continue;
    const i = line.indexOf(':');
    if (i < 0) continue;
    const k = line.slice(0, i).trim().toLowerCase();
    const v = line.slice(i + 1).trim();
    if (k === 'user-agent') {
      if (!cur || !lastUA) groups.push((cur = { agents: [], rules: [] }));
      cur.agents.push(v.toLowerCase());
      lastUA = true;
      continue;
    }
    lastUA = false;
    if ((k === 'allow' || k === 'disallow') && cur && v) cur.rules.push({ allow: k === 'allow', path: v });
    if (k === 'sitemap') sitemaps.push(v);
  }
  return { groups, sitemaps };
}
// robots.txt pattern -> RegExp ("*" wildcard, trailing "$" anchor)
function robotsRe(p) {
  const anchored = p.endsWith('$');
  const body = anchored ? p.slice(0, -1) : p;
  const src = body
    .split('*')
    .map((x) => x.replace(/[.+?^${}()|[\]\\]/g, (c) => '\\' + c))
    .join('.*');
  return new RegExp('^' + src + (anchored ? '$' : ''));
}
// Longest matching rule wins; on a tie Allow wins. The most specific UA group is used.
function robotsAllowed(robots, ua, pathAndQuery) {
  const u = ua.toLowerCase();
  let best = null;
  for (const g of robots.groups) for (const a of g.agents) if (a !== '*' && u.includes(a) && (!best || a.length > best.len)) best = { g, len: a.length };
  const group = best ? best.g : robots.groups.find((g) => g.agents.includes('*'));
  if (!group) return true;
  let win = null;
  for (const r of group.rules) {
    if (robotsRe(r.path).test(pathAndQuery)) {
      const len = r.path.length;
      if (!win || len > win.len || (len === win.len && r.allow)) win = { allow: r.allow, len };
    }
  }
  return !win || win.allow;
}

module.exports = { tokenize, parseHtml, ws, words, textStats, pixelWidth, parseRobots, robotsAllowed, decode };
