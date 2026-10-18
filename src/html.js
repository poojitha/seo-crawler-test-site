// HTML page builder and small response helpers shared by all route files.

const { CAT_LABEL } = require('./registry');

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Deterministic pseudo-random text so every page has unique (but stable) copy.
const LEX = (
  'the crawler reads every page and follows links across this site while it checks titles ' +
  'descriptions headings canonical tags robots directives status codes redirects images structured ' +
  'data hreflang annotations pagination sitemaps content quality internal linking architecture depth ' +
  'speed security mobile rendering javascript resources accessibility search engines index rank ' +
  'relevant useful information visitors testing technical audit report issue warning opportunity ' +
  'garden river mountain coffee window planet orange silver market harbor lantern meadow journey ' +
  'pattern signal bridge canvas engine forest island mirror pocket rocket shadow thunder valley'
).split(' ');

function rng(seed) {
  let h = 2166136261;
  for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  h = h || 1;
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 4294967296;
  };
}

function words(n, seed = 'seed') {
  const r = rng(seed);
  const out = [];
  for (let i = 0; i < n; i++) out.push(LEX[Math.floor(r() * LEX.length)]);
  return out.join(' ');
}

// Sentences of 8-16 words, about n words in total.
function para(n, seed = 'seed') {
  const r = rng(seed + '#p');
  const w = words(n, seed).split(' ');
  const out = [];
  let i = 0;
  while (i < w.length) {
    const len = 8 + Math.floor(r() * 9);
    const s = w.slice(i, i + len);
    s[0] = s[0][0].toUpperCase() + s[0].slice(1);
    out.push(s.join(' ') + '.');
    i += len;
  }
  return out.join(' ');
}

function autoDescription(o) {
  if (!o.title) return o.test ? String(o.test).slice(0, 155) : null;
  const d = o.test ? `${o.title} – ${o.test}` : `${o.title} – crawler test page.`;
  return d.length > 155 ? d.slice(0, 152).replace(/\s+\S*$/, '') + '…' : d;
}

/*
 * render(options) -> { status, headers, body }
 *  title        string | null (null = no <title>)
 *  titleTag     raw HTML replacing the generated <title>
 *  description  string | null (undefined = auto-generated unique description)
 *  h1           string | null (undefined = same as title); h1Raw = raw HTML
 *  robots, canonical, lang, charset (null = omit), viewport (false = omit)
 *  headTop      raw HTML at the very start of <head>; head = raw HTML at the end of <head>
 *  htmlTag      raw <html ...> opening tag
 *  body         raw HTML inside <main>
 *  chrome       false = no header/breadcrumb/about box/footer
 *  filler       false = no default ~110-word unique paragraph and <h2>
 *  status, reason, headers  HTTP response details
 */
function render(o) {
  const title = o.title;
  const titleTag = o.titleTag !== undefined ? o.titleTag : title == null ? '' : `<title>${esc(title)}</title>`;
  const desc = o.description === undefined ? autoDescription(o) : o.description;
  const h1 = o.h1 === undefined ? title || null : o.h1;
  const chrome = o.chrome !== false;

  const head = [
    o.headTop || '',
    o.charset === null ? '' : `<meta charset="${o.charset || 'utf-8'}">`,
    o.viewport === false ? '' : '<meta name="viewport" content="width=device-width, initial-scale=1">',
    titleTag,
    desc == null ? '' : `<meta name="description" content="${esc(desc)}">`,
    o.robots ? `<meta name="robots" content="${esc(o.robots)}">` : '',
    o.canonical ? `<link rel="canonical" href="${esc(o.canonical)}">` : '',
    o.css === false ? '' : '<link rel="stylesheet" href="/css/app.css">',
    o.head || '',
  ]
    .filter(Boolean)
    .join('\n  ');

  const about =
    chrome && (o.test || o.expect)
      ? `<section class="about">
  ${o.test ? `<p><strong>Test:</strong> ${esc(o.test)}</p>` : ''}
  ${o.expect ? `<p><strong>Expected crawler result:</strong> ${esc(o.expect)}</p>` : ''}
</section>`
      : '';

  const filler =
    o.filler === false
      ? ''
      : `<section class="filler">
  <h2>About this test page</h2>
  <p>${para(110, o.path || title || 'x')}</p>
</section>`;

  const body = [
    o.bodyTop || '',
    chrome ? '<header class="site"><a href="/" class="brand">SEO Crawler Test Site</a></header>' : '',
    chrome && o.cat && CAT_LABEL[o.cat]
      ? `<nav class="crumbs"><a href="/">Home</a> › <a href="/tests/${o.cat}">${esc(CAT_LABEL[o.cat])}</a></nav>`
      : '',
    '<main>',
    o.h1Raw !== undefined ? o.h1Raw : h1 ? `<h1>${esc(h1)}</h1>` : '',
    about,
    o.body || '',
    filler,
    '</main>',
    chrome
      ? '<footer><p>Local SEO crawler test site · <a href="/tests">All tests</a> · <a href="/sitemap.xml">XML sitemap</a></p></footer>'
      : '',
    o.bodyEnd || '',
  ]
    .filter(Boolean)
    .join('\n');

  const html =
    (o.doctype === false ? '' : '<!DOCTYPE html>\n') +
    (o.htmlTag || `<html lang="${o.lang || 'en'}">`) +
    `\n<head>\n  ${head}\n</head>\n<body>\n${body}\n</body>\n</html>\n`;

  return { status: o.status || 200, reason: o.reason, headers: o.headers || {}, body: html };
}

// A redirect response with a tiny HTML body.
function redirect(status, location, headers = {}) {
  const loc = location == null ? '' : `<p>Moved to <a href="${esc(location)}">${esc(location)}</a></p>`;
  const h = { ...headers };
  if (location != null) h.Location = location;
  return { status, headers: h, body: `<!DOCTYPE html><html><head><title>${status} Redirect</title></head><body>${loc}</body></html>` };
}

// A list of links, used by hub pages and tests that need many links.
function linkList(items) {
  return '<ul class="links">\n' + items.map(([href, text]) => `  <li><a href="${esc(href)}">${esc(text)}</a></li>`).join('\n') + '\n</ul>';
}

module.exports = { esc, words, para, render, redirect, linkList };
