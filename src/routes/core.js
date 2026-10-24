// Site chrome (home, hubs, catalog, 404), static resources and the simulated "external site".

const { add, group, CATS, CAT_LABEL, tests } = require('../registry');
const { render, esc, redirect } = require('../html');
const { ORIGIN, ALT_ORIGIN } = require('../config');
const A = require('../assets');

const site = (path, handler, extra = {}) => add({ cat: '_site', path, title: path, listed: false, handler, ...extra });

// ---------------------------------------------------------------- home
site('/', (ctx) =>
  render({
    title: 'SEO Crawler Test Site',
    description: 'A local website with hundreds of technical SEO edge cases for testing crawlers such as Screaming Frog.',
    canonical: ORIGIN + '/',
    h1: 'SEO Crawler Test Site',
    head: `<link rel="alternate" hreflang="x-default" href="${ORIGIN}/">`,
    body: `
<p>Every link below opens a category hub. Each hub links to its test pages, and every test page states
what it tests and what a crawler is expected to report.</p>
<div class="grid">
${CATS.map(([k, label, desc]) => {
  const n = tests().filter((r) => r.cat === k).length;
  return `<a class="card" href="/tests/${k}"><strong>${esc(label)}</strong><span>${esc(desc)}</span><em>${n} URLs</em></a>`;
}).join('\n')}
</div>
<h2>Site-wide files</h2>
<ul class="links">
  <li><a href="/tests">Full test catalog (every URL and its expected result)</a></li>
  <li><a href="/stats">Site statistics (live scan of every test URL)</a></li>
  <li><a href="/robots.txt">robots.txt</a></li>
  <li><a href="/sitemap.xml">sitemap.xml (sitemap index)</a></li>
  <li><a href="/?parameter-on-hostname-root=parameter-value">Home page with a query parameter</a></li>
  <li><a href="/?removed_parameter=1&amp;retained_parameter=1">Home page with removable parameters (URL rewriting test)</a></li>
</ul>`,
  })
);

// ---------------------------------------------------------------- hubs
for (const [cat, label, desc] of CATS) {
  site(`/tests/${cat}`, () => {
    const rows = tests().filter((r) => r.cat === cat);
    return render({
      title: `${label} – Crawler Tests`,
      description: `${label}: ${desc}`.slice(0, 155),
      h1: label,
      cat,
      body: `<p>${esc(desc)}</p>
<table class="tests">
<thead><tr><th>Test URL</th><th>What it tests</th><th>Expected result</th></tr></thead>
<tbody>
${rows
  .map(
    (r) => `<tr><td>${r.listed ? `<a href="${esc(r.href)}">${esc(r.label || r.title || r.path)}</a>` : `<code>${esc(r.href)}</code> <small>(not linked – ${esc(r.unlinkedReason || 'discovered another way')})</small>`}</td><td>${esc(r.test || '')}</td><td>${esc(r.expect || '')}</td></tr>`
  )
  .join('\n')}
</tbody></table>`,
      filler: false,
    });
  });
}

// ---------------------------------------------------------------- catalog
site('/tests', () => {
  const rows = tests();
  return render({
    title: 'Test Catalog – Every URL and Expected Result',
    description: 'The full list of crawler test URLs on this site with the result a technical SEO crawler should report.',
    h1: `Test catalog (${rows.length} URLs)`,
    body: `<p>Unlinked URLs are shown as code: a crawler should only find them through sitemaps, canonicals,
redirects, hreflang, rel=next or JavaScript. Download as <a href="/tests.json">JSON</a>.</p>
${CATS.map(
  ([cat, label]) => `<h2 id="${cat}"><a href="/tests/${cat}">${esc(label)}</a></h2>
<table class="tests"><tbody>
${rows
  .filter((r) => r.cat === cat)
  .map((r) => `<tr><td><code>${esc(r.href)}</code></td><td>${esc(r.test || '')}</td><td>${esc(r.expect || '')}</td></tr>`)
  .join('\n')}
</tbody></table>`
).join('\n')}`,
    filler: false,
  });
});

site('/tests.json', () => ({
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(
    tests().map((r) => ({ category: r.cat, url: ORIGIN + r.href, title: r.title, test: r.test, expect: r.expect, linked: r.listed })),
    null,
    2
  ),
}));

// ---------------------------------------------------------------- 404
site('/__404', (ctx) =>
  render({
    status: 404,
    title: '404 Not Found',
    description: null,
    h1: 'Page not found',
    body: `<p>No test page exists at <code>${esc(ctx.url)}</code>.</p><p><a href="/">Back to the home page</a></p>`,
    filler: false,
  })
);

// ---------------------------------------------------------------- resources
const r = group('resources');
const file = (type, body, headers = {}) => () => ({ headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=3600', ...headers }, body });

const CSS = `:root{--bg:#fff;--fg:#1d2330;--muted:#5b6475;--line:#dde2ea;--accent:#2457d6;--card:#f5f7fb}
@media (prefers-color-scheme:dark){:root{--bg:#12151c;--fg:#e8ebf1;--muted:#9aa3b5;--line:#2a3040;--accent:#7aa2ff;--card:#1a1f2a}}
*{box-sizing:border-box}body{margin:0;font:16px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--fg)}
header.site{padding:14px 20px;border-bottom:1px solid var(--line)}.brand{font-weight:700;text-decoration:none;color:var(--fg)}
main{max-width:1040px;margin:0 auto;padding:16px 20px 40px}nav.crumbs{max-width:1040px;margin:0 auto;padding:10px 20px 0;color:var(--muted);font-size:14px}
a{color:var(--accent)}h1{font-size:28px;line-height:1.2}.about{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:4px 16px;margin:16px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}.card{display:flex;flex-direction:column;gap:6px;padding:14px;border:1px solid var(--line);border-radius:8px;text-decoration:none;color:var(--fg);background:var(--card)}
.card span{color:var(--muted);font-size:14px}.card em{color:var(--accent);font-style:normal;font-size:13px}
table.tests{width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px}table.tests td,table.tests th{border-bottom:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}
table.tests code{word-break:break-all}footer{border-top:1px solid var(--line);padding:12px 20px;color:var(--muted);font-size:14px}
.filler{color:var(--muted)}img{max-width:100%}
.card .big{font-size:24px;color:var(--fg)}table.stats{max-width:760px}table.stats .num{text-align:right;white-space:nowrap}table.stats .barcell{width:40%}.bar{display:block;height:10px;border-radius:2px;background:var(--accent)}`;

r('/css/app.css', 'Site stylesheet', 'Valid CSS file linked from every page.', '200 text/css resource.', {}, { handler: file('text/css; charset=utf-8', CSS) });
r('/js/app.js', 'Site script', 'Valid JavaScript file.', '200 application/javascript resource.', {}, {
  handler: file('application/javascript; charset=utf-8', 'document.documentElement.classList.add("js");\n'),
});
r('/bower_components/jquery/jquery.min.js', 'Vendor JS in deep folder', 'Third-party style JS file in a nested folder.', '200 JavaScript resource.', {}, {
  handler: file('application/javascript; charset=utf-8', '/*! jQuery stub for crawler tests */ window.jQuery = window.$ = function(){ return {}; };\n'),
});
r('/disallowed/', 'Disallowed resources folder', 'Any file below /disallowed/ is blocked by robots.txt (CSS/JS used in rendering tests).', 'Blocked by robots.txt; JS rendering should show the resource as blocked.', {}, {
  prefix: true,
  listed: false,
  unlinkedReason: 'referenced as CSS/JS from test pages',
  handler: (ctx) =>
    ctx.path.endsWith('.css')
      ? { headers: { 'Content-Type': 'text/css; charset=utf-8' }, body: 'body{outline:3px solid red}' }
      : ctx.path.endsWith('.js')
      ? {
          headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
          body: 'document.addEventListener("DOMContentLoaded",function(){var p=document.createElement("p");p.id="blocked-js-content";p.textContent="This text is injected by a JS file that robots.txt blocks.";document.querySelector("main").appendChild(p);});',
        }
      : render({ title: 'Disallowed page', description: null, body: '<p>Blocked by robots.txt.</p>' }),
});

r('/images/logo_small.JPG', 'Uppercase .JPG image', 'Image whose extension is uppercase. /images/logo_small.jpg (lowercase) is a 404.', '200 image/jpeg; the lowercase variant is a broken image.', {}, {
  handler: file('image/jpeg', A.JPEG),
});
r('/images/sample.gif', 'Small GIF image', 'Tiny valid image used in image tests.', '200 image/gif.', {}, { handler: file('image/gif', A.GIF), listed: false, unlinkedReason: 'used in <img> tags' });
const BIG = A.bmp(400, 300);
r('/images/large-photo.bmp', 'Large image (≈360 KB)', 'Uncompressed BMP image larger than 100 KB.', 'Flagged as "Image over 100 KB".', {}, { handler: file('image/bmp', BIG) });
r('/images/photo.jpg', 'Photo JPEG', 'Normal JPEG used in <img> and og:image tags.', '200 image/jpeg.', {}, { handler: file('image/jpeg', A.JPEG), listed: false, unlinkedReason: 'used in <img> and og:image' });
r('/favicon.ico', 'Favicon', 'Favicon requested by browsers.', '200 image/x-icon.', {}, { handler: file('image/x-icon', A.GIF), listed: false, unlinkedReason: 'linked via <link rel=icon>' });

const PDF = A.pdf('Parameters for Opening PDF Files', 'SEO crawler test PDF document', ORIGIN + '/redirects/redirect_target');
r('/pdf_open_parameters.pdf', 'PDF document', 'PDF with a /Title and a link inside it. /pdf_open_parameters.PDF (uppercase) is a 404.', '200 application/pdf; PDF title extracted; link inside the PDF discovered.', {}, {
  handler: file('application/pdf', PDF),
});
r('/files/noindex.pdf', 'PDF with X-Robots-Tag noindex', 'Non-HTML file made non-indexable with an HTTP header.', 'Non-indexable (noindex via X-Robots-Tag).', {}, {
  handler: file('application/pdf', A.pdf('Noindex PDF', 'This PDF sends X-Robots-Tag noindex', ORIGIN + '/'), { 'X-Robots-Tag': 'noindex, nofollow' }),
});
r('/Dashboard/Charts/FCF_Column2D.SWF', 'Flash file (.SWF)', 'Legacy Flash file with uppercase extension. The lowercase .swf URL is a 404.', '200 application/x-shockwave-flash.', {}, {
  handler: file('application/x-shockwave-flash', A.blob('FWS', 2048)),
});
r('/files/sample.txt', 'Plain text file', 'Linked .txt file.', '200 text/plain.', {}, { handler: file('text/plain; charset=utf-8', 'Plain text file for crawler tests.\n') });
r('/files/sample.csv', 'CSV file', 'Linked .csv file.', '200 text/csv.', {}, { handler: file('text/csv; charset=utf-8', 'id,name\n1,crawler\n') });
r('/files/sample.zip', 'ZIP archive', 'Linked .zip file.', '200 application/zip.', {}, { handler: file('application/zip', A.blob('PK\x05\x06', 22)) });
r('/files/sample.json', 'JSON file', 'Linked .json file.', '200 application/json.', {}, { handler: file('application/json', '{"ok":true}') });
r('/files/sample.xml', 'XML file', 'Linked .xml file that is not a sitemap.', '200 application/xml.', {}, { handler: file('application/xml', '<?xml version="1.0"?><root><item>crawler</item></root>') });
r('/files/sample.docx', 'Word document', 'Linked .docx file.', '200 Word document content type.', {}, {
  handler: file('application/vnd.openxmlformats-officedocument.wordprocessingml.document', A.blob('PK\x03\x04', 512)),
});
r('/files/sample.mp4', 'Video file', 'Linked .mp4 file.', '200 video/mp4.', {}, { handler: file('video/mp4', A.blob('\x00\x00\x00\x18ftypmp42', 1024)) });
r('/files/wrong_content_type.pdf', 'PDF served as text/html', 'File extension says PDF, Content-Type says HTML.', 'Crawler should trust Content-Type and treat it as HTML.', {}, {
  handler: () => render({ title: 'Wrong Content-Type PDF', body: '<p>This URL ends in .pdf but is HTML.</p>' }),
});

// ---------------------------------------------------------------- API used by JS tests
r('/api/data.json', 'AJAX data endpoint', 'JSON fetched by /javascript/ajax-return-data.', '200 application/json (XHR resource).', {}, {
  listed: false,
  unlinkedReason: 'fetched by JavaScript',
  handler: file('application/json; charset=utf-8', JSON.stringify({ text: 'This paragraph was loaded with fetch() after page load.', link: '/javascript/ajax_link_target' })),
});

// ---------------------------------------------------------------- simulated external site
// Served on any host, but test pages link to it on ALT_ORIGIN so crawlers treat it as external.
const ext = group('links');
ext('/external/', 'Simulated external site', 'Responses for "external" links on the alternate host. /external/status/<code> returns that code.', 'External links are checked but not crawled further.', {}, {
  prefix: true,
  listed: false,
  unlinkedReason: `served on ${ALT_ORIGIN}`,
  handler: (ctx) => {
    const m = ctx.path.match(/^\/external\/status\/(\d{3})/);
    if (m) {
      const code = +m[1];
      if (code >= 300 && code < 400) return redirect(code, ALT_ORIGIN + '/external/page');
      return render({ status: code, title: `External ${code}`, body: `<p>External response ${code}</p>`, filler: false });
    }
    if (ctx.path.startsWith('/external/redirect')) return redirect(301, ALT_ORIGIN + '/external/page');
    return render({ title: `External page ${ctx.url}`, description: null, body: '<p>This is a page on "another domain".</p>', filler: false });
  },
});
