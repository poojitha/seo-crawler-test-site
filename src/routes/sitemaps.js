// XML sitemaps, generated from the route registry.

const zlib = require('zlib');
const { group, tests } = require('../registry');
const { ORIGIN, ALT_ORIGIN } = require('../config');

const t = group('sitemaps');
const xml = (body) => ({ headers: { 'Content-Type': 'application/xml; charset=utf-8' }, body: '<?xml version="1.0" encoding="UTF-8"?>\n' + body });
const x = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const urlset = (urls, extraNs = '') =>
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${extraNs}>\n${urls.join('\n')}\n</urlset>\n`;
const entry = (loc, inner = '') => `  <url><loc>${x(loc)}</loc>${inner}</url>`;

// Regular HTML test pages that should be in a normal sitemap.
const SKIP = new Set(['status_codes', 'redirects', 'resources', 'sitemaps']);
function pageUrls() {
  return tests()
    .filter((r) => (r.listed || r.sitemap === true) && r.sitemap !== false && !r.prefix && !SKIP.has(r.cat))
    .map((r) => ORIGIN + r.href);
}

t('/sitemap.xml', 'Sitemap index', 'Sitemap index referencing six child sitemaps (one is 404, one gzipped).', 'All child sitemaps fetched; missing one reported.', {}, {
  handler: () =>
    xml(`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${['sitemap-pages.xml', 'sitemap-images.xml', 'sitemap-hreflang.xml', 'sitemap-problems.xml', 'sitemap-compressed.xml.gz', 'sitemap-missing.xml', 'sitemap-malformed.xml']
  .map((s) => `  <sitemap><loc>${ORIGIN}/sitemaps/${s}</loc><lastmod>2026-10-01</lastmod></sitemap>`)
  .join('\n')}
</sitemapindex>
`),
});
t('/sitemaps/sitemap-pages.xml', 'Pages sitemap', 'Every linked HTML test page plus orphan pages (some are noindex/canonicalised on purpose).', '"Orphan URLs", "Non-indexable URLs in sitemap" reports.', {}, {
  handler: () => xml(urlset(pageUrls().map((u, i) => entry(u, `<lastmod>2026-${String((i % 9) + 1).padStart(2, '0')}-15</lastmod><changefreq>weekly</changefreq><priority>0.5</priority>`)))),
});
t('/sitemaps/sitemap-images.xml', 'Image sitemap', 'Image sitemap with image:image entries (one image is a 404).', 'Images discovered from sitemap.', {}, {
  handler: () =>
    xml(
      urlset(
        [
          entry(ORIGIN + '/images/tests/good_alt', `<image:image><image:loc>${ORIGIN}/images/photo.jpg</image:loc></image:image>`),
          entry(ORIGIN + '/images/tests/large_image', `<image:image><image:loc>${ORIGIN}/images/large-photo.bmp</image:loc></image:image><image:image><image:loc>${ORIGIN}/images/sitemap-missing.png</image:loc></image:image>`),
        ],
        ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'
      )
    ),
});
t('/sitemaps/sitemap-hreflang.xml', 'Hreflang sitemap', 'hreflang annotations declared with xhtml:link inside the sitemap.', 'Sitemap hreflang parsed for /hreflang/sitemap_en and _fr.', {}, {
  handler: () => {
    const links = `<xhtml:link rel="alternate" hreflang="en" href="${ORIGIN}/hreflang/sitemap_en"/><xhtml:link rel="alternate" hreflang="fr" href="${ORIGIN}/hreflang/sitemap_fr"/><xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}/hreflang/sitemap_en"/>`;
    return xml(urlset([entry(`${ORIGIN}/hreflang/sitemap_en`, links), entry(`${ORIGIN}/hreflang/sitemap_fr`, links)], ' xmlns:xhtml="http://www.w3.org/1999/xhtml"'));
  },
});
t('/sitemaps/sitemap-problems.xml', 'Problem URLs sitemap', 'Redirects, 404, 500, robots-blocked, noindex, canonicalised URLs, a URL on another host and a bad lastmod.', '"Non-indexable URLs in sitemap", "URL not on sitemap host", invalid lastmod.', {}, {
  handler: () =>
    xml(
      urlset([
        entry(ORIGIN + '/redirects/redirect_1'),
        entry(ORIGIN + '/redirects/meta_redirect_1'),
        entry(ORIGIN + '/sitemaps/this-url-is-404'),
        entry(ORIGIN + '/status_codes/status_500'),
        entry(ORIGIN + '/robots_protocol/robots_excluded_3'),
        entry(ORIGIN + '/robots_protocol/meta_noindex'),
        entry(ORIGIN + '/canonical_tags/canonical_tag'),
        entry(ALT_ORIGIN + '/external/page'),
        entry(ORIGIN + '/redirects/redirect_target', '<lastmod>not-a-date</lastmod><priority>5.0</priority>'),
        entry(ORIGIN + '/redirects/redirect_target?from=sitemap'),
        entry('/relative/url/in/sitemap'),
      ])
    ),
});
t('/sitemaps/sitemap-compressed.xml.gz', 'Gzipped sitemap', 'Sitemap served gzip-compressed (.xml.gz).', 'Decompressed and parsed.', {}, {
  handler: () => ({
    headers: { 'Content-Type': 'application/gzip' },
    body: zlib.gzipSync('<?xml version="1.0" encoding="UTF-8"?>\n' + urlset([entry(ORIGIN + '/'), entry(ORIGIN + '/depth/orphan_page_2')])),
    gzip: false,
  }),
});
t('/sitemaps/sitemap-malformed.xml', 'Malformed sitemap', 'Broken XML (unclosed tags).', 'Sitemap parse error.', {}, {
  handler: () => xml(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${ORIGIN}/</loc><url><loc>`),
});
t('/sitemaps/sitemap-wrong-namespace.xml', 'Sitemap with wrong namespace', 'Valid XML but the urlset namespace is wrong.', 'Sitemap not recognised / error.', {}, {
  listed: false,
  unlinkedReason: 'test by uploading manually in list mode',
  handler: () => xml(`<urlset xmlns="http://www.example.com/not-sitemaps"><url><loc>${ORIGIN}/</loc></url></urlset>`),
});
t('/sitemaps/sitemap.txt', 'Text sitemap', 'Plain-text sitemap: one URL per line.', 'Parsed as a list of URLs.', {}, {
  handler: () => ({ headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: [ORIGIN + '/', ORIGIN + '/depth/orphan_page', ORIGIN + '/redirects/redirect_target'].join('\n') + '\n' }),
});
