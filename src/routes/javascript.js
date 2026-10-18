// /javascript/* – things that only exist after JavaScript runs.
// Crawl once in text-only mode and once with JavaScript rendering, then compare.

const { group } = require('../registry');
const { ALT_ORIGIN, ORIGIN } = require('../config');

const t = group('javascript');
const J = '/javascript';
const js = (code) => `<script>\n${code}\n</script>`;
const onReady = (code) => js(`document.addEventListener('DOMContentLoaded', function () {\n${code}\n});`);
const TARGET = (n) => `${J}/js_link_target_${n}`;

t(`${J}/dynamically-inserted-text`, 'javascript:dynamically inserted text', 'A paragraph of ~60 words is added with JS.', 'Word count higher in the rendered HTML than in the raw HTML.', {
  body: '<div id="dyn"></div>',
  bodyEnd: onReady("document.getElementById('dyn').innerHTML = '<p id=\"js-text\">' + 'This text was inserted by JavaScript after the page loaded. '.repeat(6) + '</p>';"),
});
t(`${J}/dynamically-inserted-text-meta-data`, 'javascript:dynamically inserted text meta data', 'JS replaces the meta description and adds an H1.', 'Rendered description differs from the raw description.', {
  h1: null,
  bodyEnd: onReady("document.querySelector('meta[name=description]').setAttribute('content','Meta description replaced by JavaScript');var h=document.createElement('h1');h.textContent='H1 added by JavaScript';document.querySelector('main').prepend(h);"),
});
t(`${J}/onload-added-title`, 'onload added title', 'No <title> in raw HTML; JS sets document.title on load.', 'Missing title in raw HTML; "Title added by JavaScript" when rendered.', {
  title: null,
  h1: 'Onload added title',
  description: 'The title of this page is set by JavaScript.',
  bodyEnd: js("window.addEventListener('load', function () { document.title = 'Title added by JavaScript'; });"),
});
t(`${J}/title_changed_by_js`, 'Original raw HTML title', 'Raw title is replaced by JS.', '"Page title updated by JavaScript".', { bodyEnd: onReady("document.title = 'Title changed by JavaScript';") });
t(`${J}/onload-inserted-canonical`, 'On load added canonical', 'Canonical link element inserted by JS.', 'No canonical in raw HTML; canonical present after rendering ("Canonical only in rendered HTML").', {
  bodyEnd: onReady(`var l=document.createElement('link');l.rel='canonical';l.href='${ORIGIN}/';document.head.appendChild(l);`),
});
t(`${J}/canonical_changed_by_js`, 'Canonical changed by JS', 'Raw canonical is self; JS rewrites it to the home page.', '"Canonical mismatch" between raw and rendered HTML.', {
  canonical: `${ORIGIN}${J}/canonical_changed_by_js`,
  bodyEnd: onReady(`document.querySelector('link[rel=canonical]').href='${ORIGIN}/';`),
});
t(`${J}/noindex_added_by_js`, 'Noindex added by JS', 'Raw HTML is indexable; JS adds meta robots noindex.', 'Indexable raw, noindex rendered – "Noindex only in rendered HTML".', {
  bodyEnd: onReady("var m=document.createElement('meta');m.name='robots';m.content='noindex';document.head.appendChild(m);"),
});
t(`${J}/noindex_removed_by_js`, 'Noindex removed by JS', 'Raw HTML has noindex; JS removes it.', 'Google keeps the raw noindex – page is not indexed.', {
  robots: 'noindex',
  bodyEnd: onReady("document.querySelector('meta[name=robots]').remove();"),
});
t(`${J}/dynamically-inserted-nofollow`, 'javascript:dynamically inserted nofollow', 'JS adds rel=nofollow to an existing link and adds meta nofollow.', 'Link followed in raw HTML, nofollow after rendering.', {
  body: `<p><a id="lnk" href="${TARGET(1)}">Link that becomes nofollow</a></p>`,
  bodyEnd: onReady("document.getElementById('lnk').rel='nofollow';var m=document.createElement('meta');m.name='robots';m.content='nofollow';document.head.appendChild(m);"),
});
t(`${J}/js_inserted_links`, 'Links inserted by JavaScript', 'Three <a href> links created with document.createElement.', 'Links discovered only with JS rendering.', {
  body: '<ul id="js-links"></ul>',
  bodyEnd: onReady(`[2,3,4].forEach(function(n){var li=document.createElement('li');var a=document.createElement('a');a.href='${J}/js_link_target_'+n;a.textContent='JS link '+n;li.appendChild(a);document.getElementById('js-links').appendChild(li);});`),
});
t(`${J}/concatenatedlink`, 'javascript:concatenated link', 'URL built by string concatenation in JS and assigned to an <a>.', 'Link found only after rendering.', {
  body: '<p><a id="cat" href="#">Concatenated link</a></p>',
  bodyEnd: onReady(`var p1='${J}/js_link',p2='_target_5';document.getElementById('cat').href=p1+p2;`),
});
t(`${J}/data-hreflink`, 'javascript:data-href link', 'Element with data-href that JS turns into navigation on click.', 'Not a crawlable link (no href) even when rendered.', {
  body: `<p><span data-href="${TARGET(6)}" class="js-nav" style="cursor:pointer;text-decoration:underline">data-href pseudo link</span></p>`,
  bodyEnd: onReady("document.querySelectorAll('.js-nav').forEach(function(e){e.onclick=function(){location.href=e.dataset.href;};});"),
});
t(`${J}/onmousedown`, 'javascript:onmousedown', 'Link whose href is swapped on mousedown (tracking pattern).', 'Crawler sees the original href only.', {
  body: `<p><a href="${TARGET(7)}" onmousedown="this.href='${TARGET(8)}'">onmousedown link</a></p>`,
});
t(`${J}/onclick-reveals-element-programmatically-added-onclick`, 'javascript:onclick reveals new element with programmatically added onclick', 'Clicking a button reveals a hidden link.', 'Hidden link requires interaction – not found by crawlers (no clicks).', {
  body: '<button id="reveal">Reveal</button><div id="hidden"></div>',
  bodyEnd: onReady(`document.getElementById('reveal').addEventListener('click',function(){document.getElementById('hidden').innerHTML='<a href="${TARGET(9)}">Revealed link</a>';});`),
});
t(`${J}/ajax-return-data`, 'javascript:make AJAX call and return data in page', 'fetch("/api/data.json") inserts a paragraph and a link.', 'XHR resource listed; text and link only in rendered HTML.', {
  body: '<div id="ajax">Loading…</div>',
  bodyEnd: onReady("fetch('/api/data.json').then(function(r){return r.json();}).then(function(d){document.getElementById('ajax').innerHTML='<p>'+d.text+'</p><a href=\"'+d.link+'\">AJAX link</a>';});"),
});
t(`${J}/ajax_link_target`, 'AJAX link target', 'Linked from data returned by fetch().', 'Found only with JS rendering.', {}, { listed: false, unlinkedReason: 'link returned by AJAX' });
for (let n = 1; n <= 9; n++) {
  t(TARGET(n), `JS link target ${n}`, 'Target of a JavaScript link test.', 'Discovered depending on the JS test.', {}, { listed: false, unlinkedReason: 'JavaScript link target' });
}
t(`${J}/push_state`, 'Document', 'history.pushState changes the URL to /javascript/push_state/new-url and swaps the content.', 'Rendered URL differs from the requested URL.', {
  bodyEnd: onReady(`history.pushState({}, '', '${J}/push_state/new-url');document.title='Pushed state page';document.querySelector('main').insertAdjacentHTML('beforeend','<p>Content after pushState.</p>');`),
});
t(`${J}/push_state/new-url`, 'Pushed state URL', 'URL produced by pushState.', '200 if requested directly.', {}, { listed: false, unlinkedReason: 'created by history.pushState' });
for (let n = 1; n <= 5; n++) {
  const secs = [1, 3, 5, 8, 12][n - 1];
  t(`${J}/renderer_timeout/${n}`, 'Unrendered', `Title, H1 and a link change after ${secs} s (setTimeout).`, secs <= 5 ? `Rendered with the default 5 s AJAX timeout.` : `Not rendered with a 5 s timeout – raise the timeout to see "Rendered after ${secs}s".`, {
    h1: 'Unrendered',
    bodyEnd: js(`setTimeout(function(){document.title='Rendered after ${secs}s';document.querySelector('h1').textContent='Rendered after ${secs}s';document.querySelector('main').insertAdjacentHTML('beforeend','<a href="${J}/renderer_timeout_target_${n}">Delayed link</a>');}, ${secs * 1000});`),
  }, { label: `Renderer timeout ${secs}s` });
  t(`${J}/renderer_timeout_target_${n}`, `Renderer timeout target ${n}`, `Link appears after ${secs} s.`, 'Discovered only if rendering waits long enough.', {}, { listed: false, unlinkedReason: 'delayed JS link' });
}
const loc = (slug, title, test, expect, code, body = '') =>
  t(`${J}/${slug}`, title, test, expect, { body, bodyEnd: js(code) });
loc('window-location-internal', 'javascript:window.location internal', 'window.location = "/redirects/redirect_target" on load.', 'JavaScript redirect (internal).', "window.location = '/redirects/redirect_target';");
loc('window-location-external', 'javascript:window.location external', 'window.location to another host.', 'JavaScript redirect (external).', `window.location = '${ALT_ORIGIN}/external/js-redirect';`);
loc('window-location-function-absolute', 'javascript:window.location function absolute', 'location.replace() with an absolute URL inside a function.', 'JavaScript redirect.', `function go(){ location.replace('${ORIGIN}/redirects/redirect_target'); } go();`);
loc('window-location-function-relative', 'javascript:window.location function relative', 'location.assign() with a relative URL.', 'JavaScript redirect.', "function go(){ location.assign('../redirects/redirect_target'); } go();");
loc('window-location-delayed', 'Delayed JS redirect (2 s)', 'setTimeout redirect after 2 seconds.', 'JavaScript redirect if rendering waits ≥2 s.', "setTimeout(function(){ location.href = '/redirects/redirect_target'; }, 2000);");
loc('window-location-onclick', 'javascript:window.location onclick', 'Redirect only happens when a button is clicked.', 'No redirect detected (requires interaction).', "document.addEventListener('DOMContentLoaded',function(){document.getElementById('b').onclick=function(){location.href='/redirects/redirect_target';};});", '<button id="b">Go</button>');
loc('window-location-onchange', 'javascript:window.location onchange', 'Select box navigates on change.', 'Option URLs are not links – not crawled.', "document.addEventListener('DOMContentLoaded',function(){document.getElementById('s').onchange=function(e){location.href=e.target.value;};});", `<select id="s"><option>Choose</option><option value="${TARGET(4)}">Option A</option></select>`);
loc('window-open', 'javascript:window.open', 'window.open() popup on click.', 'URL not discovered (not a link).', "function pop(){ window.open('/redirects/redirect_target','_blank'); }", '<button onclick="pop()">Open window</button>');
loc('alert_box', 'javascript:alert box', 'alert() on load.', 'Renderer must dismiss the dialog and continue.', "alert('Crawler alert box test');");
loc('dialog_window', 'javascript:dialog window', 'confirm() and prompt() on load.', 'Renderer must not hang on dialogs.', "confirm('Confirm dialog test'); prompt('Prompt dialog test');");
t(`${J}/analytics_script`, 'javascript:analytics script', 'A typical analytics snippet loading an external script.', 'External JS resource reported; may be blocked/slow.', {
  bodyEnd: `<script async src="${ALT_ORIGIN}/external/analytics.js"></script>\n${js("window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-TEST123');")}`,
});
t(`${J}/ad_script`, 'javascript:ad script', 'Ad-style script that writes an iframe with document.write.', 'Iframe and its URL appear only after rendering.', {
  body: '<div id="ad"></div>',
  bodyEnd: js(`document.getElementById('ad').innerHTML='<iframe src="${ALT_ORIGIN}/external/ad.html" width="300" height="250" title="ad"></iframe>';`),
});
t(`${J}/blocked_resource_content`, 'Content from robots-blocked JS', 'Text is injected by /disallowed/disallowedjs.js, which robots.txt blocks; CSS is also blocked.', 'Blocked resources reported; injected text missing when rendering respects robots.txt.', {
  head: '<link rel="stylesheet" href="/disallowed/disallowedcss.css">\n  <link rel="stylesheet" href="/disallowed/disallowedcss.css?par=2">',
  bodyEnd: '<script src="/disallowed/disallowedjs.js"></script>\n<script src="/disallowed/disallowedjs.js?par=2"></script>',
});
t(`${J}/client_side_rendered_app`, 'Client-side rendered app', 'Raw HTML is an empty <div id="app">; everything (H1, text, links) is rendered by JS.', 'Raw: no H1, ~0 words, no links. Rendered: full page.', {}, {
  handler: () => ({
    status: 200,
    headers: {},
    body: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Client-side rendered app</title><link rel="stylesheet" href="/css/app.css"></head><body><div id="app"></div>
<script>
var app = document.getElementById('app');
app.innerHTML = '<main><h1>Rendered by JavaScript</h1><p>' + 'All of this content exists only after JavaScript runs. '.repeat(10) + '</p><ul><li><a href="${J}/js_link_target_1">CSR link 1</a></li><li><a href="${J}/js_link_target_2">CSR link 2</a></li></ul></main>';
</script></body></html>`,
  }),
});
t(`${J}/hash_routing_links`, 'Hash-bang SPA links', 'Navigation uses #!/page and #/page URLs.', 'Fragment URLs are not separate pages.', {
  body: '<p><a href="#!/products">#!/products</a> <a href="#/about">#/about</a></p>',
});
t(`${J}/javascript_href`, 'href="javascript:…" links', 'Links with javascript: URLs that navigate.', 'Not crawlable links.', {
  body: `<p><a href="javascript:location.href='${TARGET(3)}'">javascript: link</a></p>`,
});
t(`${J}/document_write`, 'document.write content', 'Content and a link written with document.write during parsing.', 'Found only after rendering.', {
  body: js(`document.write('<p>Written by document.write.</p><a href="${TARGET(2)}">document.write link</a>');`),
});
t(`${J}/shadow_dom`, 'Content in shadow DOM', 'Text and a link inside an open shadow root.', 'Google flattens shadow DOM when rendering, so the text and link should be found with JS rendering on.', {
  body: '<div id="host"></div>',
  bodyEnd: onReady(`var s=document.getElementById('host').attachShadow({mode:'open'});s.innerHTML='<p>Shadow DOM text</p><a href="${TARGET(5)}">Shadow link</a>';`),
});
t(`${J}/console_errors`, 'JavaScript errors', 'Throws an uncaught error and logs console errors.', 'JS console errors reported by the renderer.', {
  bodyEnd: js("console.error('Deliberate console error for crawler tests'); undefinedFunctionCall();"),
});

// ------------------------------------------------------------------ rendered-DOM effects
// What a JS-rendering crawler should see after the scripts above have run (default
// timeout ~5 s, robots.txt respected). Used by scripts/expected.js, which cannot run JS.
//   title/h1/metaDescription/metaRobots/canonical: value after rendering (null = removed)
//   links: hrefs that exist only in the rendered DOM; addWords: approx. extra visible words
//   redirect: JavaScript redirect target; resources: extra URLs fetched by scripts
const { all } = require('../registry');
const JS_EFFECTS = {
  [`${J}/dynamically-inserted-text`]: { addWords: 66 },
  [`${J}/dynamically-inserted-text-meta-data`]: { metaDescription: 'Meta description replaced by JavaScript', h1: 'H1 added by JavaScript', addWords: 4 },
  [`${J}/onload-added-title`]: { title: 'Title added by JavaScript' },
  [`${J}/title_changed_by_js`]: { title: 'Title changed by JavaScript' },
  [`${J}/onload-inserted-canonical`]: { canonical: `${ORIGIN}/` },
  [`${J}/canonical_changed_by_js`]: { canonical: `${ORIGIN}/` },
  [`${J}/noindex_added_by_js`]: { metaRobots: 'noindex' },
  // noindex_removed_by_js: Google honours the raw noindex and never renders, so no effect is declared.
  [`${J}/dynamically-inserted-nofollow`]: { metaRobots: 'nofollow' },
  [`${J}/js_inserted_links`]: { links: [TARGET(2), TARGET(3), TARGET(4)], addWords: 9 },
  [`${J}/concatenatedlink`]: { links: [TARGET(5)] },
  [`${J}/ajax-return-data`]: { links: [`${J}/ajax_link_target`], resources: ['/api/data.json'], addWords: 13 },
  [`${J}/push_state`]: { title: 'Pushed state page', addWords: 3 },
  [`${J}/renderer_timeout/1`]: { title: 'Rendered after 1s', h1: 'Rendered after 1s', links: [`${J}/renderer_timeout_target_1`], addWords: 2 },
  [`${J}/renderer_timeout/2`]: { title: 'Rendered after 3s', h1: 'Rendered after 3s', links: [`${J}/renderer_timeout_target_2`], addWords: 2 },
  [`${J}/window-location-internal`]: { redirect: '/redirects/redirect_target' },
  [`${J}/window-location-external`]: { redirect: `${ALT_ORIGIN}/external/js-redirect` },
  [`${J}/window-location-function-absolute`]: { redirect: `${ORIGIN}/redirects/redirect_target` },
  [`${J}/window-location-function-relative`]: { redirect: '/redirects/redirect_target' },
  [`${J}/window-location-delayed`]: { redirect: '/redirects/redirect_target' },
  [`${J}/client_side_rendered_app`]: { h1: 'Rendered by JavaScript', links: [TARGET(1), TARGET(2)], addWords: 107 },
  [`${J}/document_write`]: { links: [TARGET(2)], addWords: 6 },
  [`${J}/shadow_dom`]: { links: [TARGET(5)], addWords: 5 },
  // lazy loader swaps data-src into src, so the browser downloads the large image
  '/images/tests/lazy_loaded_data_src': { resources: ['/images/large-photo.bmp'] },
};
for (const def of all) if (JS_EFFECTS[def.path]) def.js = JS_EFFECTS[def.path];
