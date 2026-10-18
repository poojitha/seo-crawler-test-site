// /urls/*, /url/*, /encoding/*, hreflang, pagination and crawl depth tests.

const { group } = require('../registry');
const { render, linkList } = require('../html');
const { ORIGIN } = require('../config');

// ------------------------------------------------------------------ URL structure
const u = group('urls');
const U = '/urls';

// chrome:false keeps the per-variant "Test:" text out, so all variants are byte-identical (same hash).
const DUP = { title: 'Duplicated Page', h1: 'Duplicated Page', description: 'The same page reachable under many URL variants.', filler: false, chrome: false, body: '<p>This exact content is served at several URL variants.</p><p><a href="/tests/urls">Back to URL tests</a></p>' };
u(`${U}/duplication_types`, 'Duplicated Page', 'Original URL of a page also served under case, slash, parameter and index.html variants.', 'Exact duplicate across 6 URLs.', DUP, { label: 'Duplication types (original)' });
u(`${U}/DUPLICATION_TYPES`, 'Duplicated Page', 'Uppercase variant.', 'Exact duplicate; "Uppercase URL".', DUP, { label: 'Uppercase variant' });
u(`${U}/duplication_types/`, 'Duplicated Page', 'Trailing slash variant.', 'Exact duplicate.', DUP, { label: 'Trailing slash variant' });
u(`${U}/duplication_types/index.html`, 'Duplicated Page', 'index.html variant.', 'Exact duplicate.', DUP, { label: 'index.html variant' });
u(`${U}/duplication_types/duplication_types/`, 'Duplicated Page', 'Repeated folder variant.', 'Exact duplicate; "Repetitive path".', DUP, { label: 'Repeated folder variant' });
u(`${U}/duplication_types_param`, 'Duplicated Page', 'Linked as /urls/duplication_types?tracking=yes – the query string is ignored by the server.', 'Exact duplicate; "Contains parameters".', DUP, { href: `${U}/duplication_types?tracking=yes`, label: '?tracking=yes variant' });
const DUPPAGE = { title: 'Duplicate page', h1: 'Duplicate page', description: 'Duplicate page canonicalised to the main version.', filler: false, body: '<p>Duplicate page content.</p>', canonical: `${ORIGIN}${U}/duplicate_page` };
u(`${U}/duplicate_page`, 'Duplicate page', 'Main version (self canonical).', 'Indexable.', DUPPAGE);
for (const v of ['foo', 'bar', 'baz']) u(`${U}/duplicate_page/${v}`, 'Duplicate page', `Duplicate /${v} canonicalised to the main version.`, 'Canonicalised – correct handling of duplicates.', DUPPAGE, { label: `Duplicate page /${v}` });

u(`${U}/directory_index/`, 'Directory index - ', 'Folder URL with trailing slash.', '200.', { title: 'Directory index - ' }, { label: 'Directory index /' });
for (const f of ['index', 'index.htm', 'index.html', 'default.htm', 'index.php']) {
  u(`${U}/directory_index/${f}`, `Directory index - ${f}`, `Directory index file "${f}" served separately.`, 'Possible duplicate of the folder URL.');
}
u(`${U}/parameter`, 'Parameters', 'Repeated keys: ?parameter_1=foo&parameter_1=bar and ?parameter_1=foo&parameter_1=foo.', 'Two parameter URLs; duplicate content.', {}, {
  page: (ctx) => ({ title: `Parameters ${ctx.search.replace(/&/g, ' & ')}` }),
  href: `${U}/parameter?parameter_1=foo&parameter_1=bar`,
  label: 'Repeated parameter (foo & bar)',
});
u(`${U}/parameter_same`, 'Parameters same', 'Repeated identical parameter.', 'Parameter URL.', {}, { href: `${U}/parameter?parameter_1=foo&parameter_1=foo`, handler: (ctx) => render({ title: 'Parameters same' }), listed: true, label: 'Repeated parameter (foo & foo)' });
for (const n of [1, 2]) {
  for (const [i, q] of [[1, 'parameter_1=foo'], [2, 'parameter_x=x&parameter_1=foo'], [3, 'parameter_x=x&parameter_1=foo&parameter_y=y']]) {
    u(`${U}/parameter_${n}_${i}`, `Parameter_${n}_${i}`, `Query string ?${q}.`, 'Contains parameters.', {}, { href: `${U}/parameter_${n}_${i}?${q}` });
  }
}
u(`${U}/with_session_id`, 'Url With Session Id', 'URL with ?sessionID=… parameter.', 'Session ID parameter detected.', {}, { href: `${U}/with_session_id?sessionID=JIyd2BVisAwyl8g62PPl` });
u(`${U}/jsessionid`, 'URL with ;jsessionid', 'Path parameter ;jsessionid=… (matrix parameter).', 'Session ID in path.', {}, { href: `${U}/jsessionid;jsessionid=A1B2C3D4E5` });
u(`${U}/jsessionid;jsessionid=A1B2C3D4E5`, 'URL with ;jsessionid (target)', 'Target URL including ;jsessionid.', '200.', {}, { listed: false, unlinkedReason: 'linked from jsessionid test' });
u(`${U}/url_with_fragment`, 'URL With Fragment', 'Links to the same URL with #one and #two.', 'Fragments stripped – one URL crawled.', { body: `<p><a href="${U}/url_with_fragment#one">#one</a> <a href="${U}/url_with_fragment#two">#two</a> <a href="${U}/url_with_fragment/#!hashbang">#! hashbang</a></p>` });
u(`${U}/url_with_spaces/URL with spaces`, 'Url With Spaces', 'Path with %20-encoded spaces.', '"Contains whitespace" URL issue.');
u(`${U}/url_with_trailing_space/ `, 'Url With Trailing Space', 'Path ending in %20.', 'URL with trailing whitespace.');
u(`${U}/url_with_encoded_trailing_space/`, 'Url With Encoded Trailing Space', 'Clean folder URL; compare with /urls/url_with_trailing_space/%20.', '200.');
u(`${U}/Uppercase_Characters_In_URL`, 'Uppercase characters in URL', 'Mixed-case path.', '"Uppercase" URL issue.');
u(`${U}/underscores_in_url_path`, 'Underscores in URL', 'Path uses underscores instead of hyphens.', '"Underscores" URL issue.');
u(`${U}/non-ascii-ünïcödé`, 'Non-ASCII characters in URL', 'Path with accented characters.', '"Non ASCII characters" URL issue.');
const LONG = `${U}/page_url_length_n/` + 'very-long-url-segment-'.repeat(12) + 'end';
u(LONG, 'Page URL Length', `URL path of ${LONG.length} characters.`, '"Over 115 characters" URL.', {}, { label: 'Very long URL' });
u(`${U}/url_over_2000`, 'URL over 2,000 characters', 'Linked with a 2,100 character query string.', 'Extremely long URL.', {}, { href: `${U}/url_over_2000?q=${'x'.repeat(2100)}` });
u(`${U}/multiple_slashes///200_404`, 'Multiple slashes (blocked)', 'Path with ///. Blocked by robots.txt rule "Disallow: /*//".', 'Blocked by robots.txt; "Multiple slashes" URL issue.');
u(`${U}/multiple_slashes///404_200`, 'Multiple slashes (blocked 2)', 'Second multiple-slash URL.', 'Blocked by robots.txt.');
u('//urls/double_slash/disallowed_start', 'Double slash at start', 'URL beginning with //. Blocked by "Disallow: //".', 'Blocked by robots.txt; double slash.', {}, { href: `${ORIGIN}//urls/double_slash/disallowed_start` });
for (const p of ['//one', '////two', '//////three', '//////four//', '//disallowed_middle', '/disallowed_end//']) {
  u(`${U}/double_slash${p}`, `Double slash: ${p}`, `Path with repeated slashes: /urls/double_slash${p}.`, 'Blocked by robots.txt; multiple slashes.');
}
u(`${U}/links_to_malformed_urls`, 'Links to Malformed URLs', 'Links with broken schemes, bad encoding, spaces, brackets and empty hrefs.', 'Malformed URLs reported or skipped; must not crash the crawler.', {
  body: `<ul>
<li><a href="http//missing-colon.example/">http//missing-colon</a></li>
<li><a href="htp://typo-scheme.example/">htp:// typo</a></li>
<li><a href="http:/single-slash.example/">http:/ single slash</a></li>
<li><a href="http://[bad-ipv6/">bad IPv6</a></li>
<li><a href="/urls/bad%zzencoding">bad %zz encoding</a></li>
<li><a href="/urls/path with raw spaces">raw spaces</a></li>
<li><a href="/urls/&lt;script&gt;">encoded &lt;script&gt;</a></li>
<li><a href="">empty href</a></li>
<li><a>no href</a></li>
<li><a href="//">just //</a></li>
<li><a href="http://">just http://</a></li>
<li><a href="url_with:colon">relative path containing a colon</a></li>
</ul>`,
});
u(`${U}/links_to_non_html_filetypes`, 'Links to Non-HTML Filetypes', 'Links to PDF, images, SWF, txt, csv, zip, json, xml, docx, mp4 and uppercase/lowercase variants.', 'Each file reported with its content type; lowercase variants are 404.', {
  body: linkList([
    ['/pdf_open_parameters.pdf', 'PDF'], ['/pdf_open_parameters.PDF', 'PDF uppercase (404)'],
    ['/images/logo_small.JPG', 'JPG'], ['/images/logo_small.jpg', 'jpg lowercase (404)'],
    ['/Dashboard/Charts/FCF_Column2D.SWF', 'SWF'], ['/Dashboard/Charts/FCF_Column2D.swf', 'swf lowercase (404)'],
    ['/files/sample.txt', 'TXT'], ['/files/sample.csv', 'CSV'], ['/files/sample.zip', 'ZIP'], ['/files/sample.json', 'JSON'],
    ['/files/sample.xml', 'XML'], ['/files/sample.docx', 'DOCX'], ['/files/sample.mp4', 'MP4'], ['/files/noindex.pdf', 'PDF with X-Robots-Tag'],
    ['/files/wrong_content_type.pdf', '.pdf served as HTML'],
  ]),
});

// /url/* (singular folder, from the original crawl)
u('/url/URL_with_encoded_unreserved_character', 'Url with encoded unreserved character', 'Linked as URL%5Fwith… (%5F is "_" which should not be encoded).', 'Normalised to the unencoded URL.', {}, { href: '/url/URL%5Fwith_encoded_unreserved_character' });
u('/url/URL,_with_encoded_reserved_character', 'Url, with encoded reserved character', 'Linked with %2C (encoded comma).', '200.', {}, { href: '/url/URL%2C_with_encoded_reserved_character' });
u('/url/with_encoded_ó_character', 'With encoded ó character', 'Linked with %C3%B3.', '200.');
u('/url/with_encoded_space ', 'With encoded space', 'Linked with a trailing %20.', '200; whitespace in URL.');
u('/url/url_with:colon', 'URL with colon', 'Path containing ":" – blocked by robots.txt.', 'Blocked by robots.txt.');

// ------------------------------------------------------------------ encoding
const e = group('encoding');
const E = '/encoding';
const FOREIGN = [
  'pchnąć-w-tę-łódź-jeża-lub-ośm-skrzyń-fig',
  'Zwölf-große-Boxkämpfer-jagen-Viktor-quer-über-den-Sylter-Deich',
  'Fabio-me-exige-sin-tapujos-que-añada-cerveza-al-whisky',
  'asød-æada-ådjghf-gägfd-asödsads',
  'γράμματα-του-ισπανικού-αλφαβήτου-καθώς',
  'Шеф-взъярён-тчк-щипцы-с-эхом-гудбай-Жюль',
  'בלהבלה',
  '﴿محمد-رسول-الله-والذين-معه-أشداء',
  'すべての単語が高校程度の辞書に載っている',
];
for (const f of FOREIGN) {
  e(`${E}/url_with_foreign_characters/${f}`, `URL with Foreign Characters - ${f}`, 'Non-ASCII path, linked percent-encoded (UTF-8).', 'Decoded and displayed correctly; "Non ASCII" URL.', {}, { label: f });
}
const DE = 'Zw%C3%B6lf-gro%C3%9Fe-Boxk%C3%A4mpfer-jagen-Viktor-quer-%C3%BCber-den-Sylter-Deich';
e(`${E}/double_encoded_url/${DE}`, `Double Encoded URL - ${DE}`, 'Path is percent-encoded twice (%25C3%25B6…).', 'Distinct URL from the single-encoded version.', {}, { label: 'Double encoded URL' });
e(`${E}/url/encoded_hashbang#abc`, 'Encoded hashbang#abc', 'Path contains %23 (an encoded "#"), which must NOT be treated as a fragment.', '200 – %23 kept in the path.', {}, { href: `${E}/url/encoded_hashbang%23abc` });
e(`${E}/page_titles_character_encoded`, 'Some title with & encoded & characters %26', 'Title with &amp;amp;, &amp;#38; and %26.', 'Title decoded to "&" (but %26 stays literal).', { titleTag: '<title>Some title with &amp; encoded &#38; characters %26</title>' });
e(`${E}/inconsistent_character_encoding`, 'Inconsistent Charater Encoding', 'HTTP header says UTF-8, <meta charset> says ISO-8859-1.', 'Charset conflict reported; header wins.', {
  charset: 'iso-8859-1',
  headers: { 'Content-Type': 'text/html; charset=utf-8' },
  body: '<p>Café, naïve, Zürich.</p>',
});
e(`${E}/invalid_charset_header`, 'Invalid charset in header', 'Content-Type: text/html; charset=utf-6 (no such charset).', 'Unknown charset; crawler falls back.', { headers: { 'Content-Type': 'text/html; charset=utf-6' } });
e(`${E}/latin1_page`, 'Latin-1 encoded page', 'Body bytes are actually ISO-8859-1 and declared as such.', 'Characters decoded correctly as "Café".', {}, {
  handler: () => {
    const page = render({ title: 'Latin-1 encoded page – Café', charset: 'iso-8859-1', body: '<p>Café crème brûlée.</p>', chrome: false, filler: false });
    return { ...page, headers: { 'Content-Type': 'text/html; charset=iso-8859-1' }, body: Buffer.from(page.body, 'latin1') };
  },
});
e(`${E}/no_charset_declared`, 'No charset declared', 'No charset in header or meta; body contains UTF-8 characters.', '"Missing charset"; may render as mojibake.', { charset: null, headers: { 'Content-Type': 'text/html' }, body: '<p>Ünïcödé text without a declared charset.</p>' });
e(`${E}/utf8_bom`, 'UTF-8 BOM', 'Response starts with a UTF-8 byte order mark.', 'Parsed correctly; BOM ignored.', {}, {
  handler: () => {
    const page = render({ title: 'UTF-8 BOM', cat: 'encoding', path: `${E}/utf8_bom` });
    return { ...page, body: '﻿' + page.body };
  },
});

// ------------------------------------------------------------------ hreflang
const h = group('hreflang');
const HL = [['pl', `${U}/page_with_hreflang/0`], ['de', `${U}/page_with_hreflang/1`], ['en', `${U}/page_with_hreflang/2`], ['x-default', `${U}/pages_with_hreflang`]];
const alt = (list) => list.map(([l, p]) => `<link rel="alternate" hreflang="${l}" href="${p.startsWith('http') ? p : ORIGIN + p}">`).join('\n  ');
h(`${U}/pages_with_hreflang`, 'Pages with HREFLANG', 'x-default page of a valid pl/de/en set; links to all members.', 'Valid hreflang set with return links.', {
  head: alt(HL),
  body: linkList(HL.slice(0, 3).map(([l, p]) => [p, `Version ${l}`])),
});
HL.slice(0, 3).forEach(([l, p], i) => {
  h(p, `Page with HREFLANG - ${l}`, `"${l}" member of a reciprocal hreflang set (pl, de, en, x-default).`, 'Valid; self-reference and return links present.', { lang: l, head: alt(HL) }, { listed: false, unlinkedReason: 'linked from pages_with_hreflang' });
});
h(`${U}/page_with_hreflang/multiple`, 'Page with HREFLANG - multiple', 'Ten hreflang annotations including region codes.', 'All annotations parsed; most lack return links.', {
  head: alt([['en', `${U}/page_with_hreflang/multiple`], ['en-gb', `${U}/page_with_hreflang/2`], ['en-us', `${U}/page_with_hreflang/2`], ['de-de', `${U}/page_with_hreflang/1`], ['de-at', `${U}/page_with_hreflang/1`], ['pl-pl', `${U}/page_with_hreflang/0`], ['fr', '/hreflang/fr'], ['es', '/hreflang/es'], ['zh-Hant', '/hreflang/zh-hant'], ['x-default', '/']]),
});
const H = '/hreflang';
h(`${H}/fr`, 'Hreflang French page', 'French alternate referenced by the multiple test (no return link).', 'Missing return link.', { lang: 'fr' }, { listed: false, unlinkedReason: 'hreflang target' });
h(`${H}/es`, 'Hreflang Spanish page', 'Spanish alternate (no return link).', 'Missing return link.', { lang: 'es' }, { listed: false, unlinkedReason: 'hreflang target' });
h(`${H}/zh-hant`, 'Hreflang Traditional Chinese page', 'zh-Hant alternate (no return link).', 'Missing return link.', { lang: 'zh-Hant' }, { listed: false, unlinkedReason: 'hreflang target' });
h(`${U}/page_with_broken_hreflang`, 'Page with broken HREFLANG', 'hreflang targets: 404, redirect, noindex, canonicalised and robots-blocked URLs.', 'Non-200 / non-indexable hreflang URLs reported.', {
  head: alt([['en', `${U}/page_with_broken_hreflang`], ['de', '/hreflang/does_not_exist'], ['fr', '/redirects/redirect_1'], ['es', '/robots_protocol/meta_noindex'], ['it', '/canonical_tags/canonical_tag'], ['nl', '/hreflang/blocked_alternate']]),
});
h(`${H}/blocked_alternate`, 'Blocked hreflang alternate', 'Blocked by robots.txt.', 'Blocked.', {}, { listed: false, unlinkedReason: 'hreflang target' });
h(`${U}/page_with_hreflang_header_ok`, 'Hreflang via HTTP header (ok)', 'hreflang sent in Link headers; the partner page returns the annotation.', 'Valid HTTP-header hreflang.', {
  headers: { Link: [`<${ORIGIN}${U}/page_with_hreflang_header_ok>; rel="alternate"; hreflang="en"`, `<${ORIGIN}${H}/header_ok_de>; rel="alternate"; hreflang="de"`] },
});
h(`${H}/header_ok_de`, 'Hreflang header partner (de)', 'German partner that returns the header annotation.', 'Valid.', {
  lang: 'de',
  headers: { Link: [`<${ORIGIN}${U}/page_with_hreflang_header_ok>; rel="alternate"; hreflang="en"`, `<${ORIGIN}${H}/header_ok_de>; rel="alternate"; hreflang="de"`] },
}, { listed: false, unlinkedReason: 'HTTP header hreflang target' });
h(`${U}/page_with_hreflang_header_not_ok`, 'Hreflang via HTTP header (not ok)', 'Header hreflang to a page that does not link back.', 'Missing return link.', {
  headers: { Link: [`<${ORIGIN}${U}/page_with_hreflang_header_not_ok>; rel="alternate"; hreflang="en"`, `<${ORIGIN}${H}/fr>; rel="alternate"; hreflang="fr"`] },
});
h(`${H}/missing_return_link`, 'Hreflang missing return link', 'Points to /urls/page_with_hreflang/1 which does not reference this page.', '"Missing return links".', { head: alt([['en', `${H}/missing_return_link`], ['de', `${U}/page_with_hreflang/1`]]) });
h(`${H}/invalid_codes`, 'Hreflang invalid codes', 'Codes en-UK, english, es_ES, xx and "en-gb-london".', '"Invalid language/region codes".', {
  head: alt([['en-UK', `${H}/invalid_codes`], ['english', `${H}/fr`], ['es_ES', `${H}/es`], ['xx', '/'], ['en-gb-london', '/']]),
});
h(`${H}/missing_self_reference`, 'Hreflang missing self reference', 'Annotations for other languages but not for itself.', '"Missing self reference".', { head: alt([['fr', `${H}/fr`], ['es', `${H}/es`]]) });
h(`${H}/missing_x_default`, 'Hreflang missing x-default', 'Self + one alternate, no x-default.', '"Missing x-default".', { head: alt([['en', `${H}/missing_x_default`], ['fr', `${H}/fr`]]) });
h(`${H}/inconsistent_language`, 'Hreflang inconsistent with html lang', 'Declares itself hreflang="en" but <html lang="fr">.', '"Inconsistent language" warning.', { lang: 'fr', head: alt([['en', `${H}/inconsistent_language`], ['x-default', '/']]) });
h(`${H}/duplicate_codes`, 'Hreflang duplicate codes', 'Two different URLs for hreflang="de".', '"Multiple entries" for the same language.', { head: alt([['en', `${H}/duplicate_codes`], ['de', `${U}/page_with_hreflang/1`], ['de', `${H}/fr`]]) });
h(`${H}/relative_urls`, 'Hreflang relative URLs', 'hreflang href values are relative.', '"Not using absolute URLs" (invalid per spec).', { head: '<link rel="alternate" hreflang="en" href="relative_urls">\n  <link rel="alternate" hreflang="fr" href="fr">' });
h(`${H}/outside_head`, 'Hreflang outside head', 'hreflang <link> tags in the body.', '"Outside <head>" – ignored by Google.', { body: alt([['en', `${H}/outside_head`], ['fr', `${H}/fr`]]) });
h(`${H}/to_non_canonical`, 'Hreflang to non-canonical', 'Alternate points to a canonicalised URL.', '"Non-canonical hreflang URL".', { head: alt([['en', `${H}/to_non_canonical`], ['de', `${U}/duplicate_page/foo`]]) });
h(`${H}/sitemap_en`, 'Hreflang via XML sitemap (en)', 'hreflang declared only in /sitemaps/sitemap-hreflang.xml.', 'Annotations found when the sitemap is crawled.', {}, { listed: false, sitemap: true, unlinkedReason: 'declared in sitemap-hreflang.xml' });
h(`${H}/sitemap_fr`, 'Hreflang via XML sitemap (fr)', 'French partner declared only in the sitemap.', 'Annotations found when the sitemap is crawled.', { lang: 'fr' }, { listed: false, sitemap: true, unlinkedReason: 'declared in sitemap-hreflang.xml' });

// ------------------------------------------------------------------ pagination
const pg = group('pagination');
function paginated(path, title, test, expect, { pages = 5, robots, linked = true, header = false, canonicalFirst = false, broken = false, relative = false } = {}, extra = {}) {
  pg(path, title, test, expect, {}, {
    ...extra,
    page: (ctx) => {
      const n = Math.max(1, Number(ctx.query.get('page')) || 1);
      if (n > pages) return { status: 404, title: 'Page out of range', filler: false };
      const url = (k) => (relative ? `?page=${k}` : `${ORIGIN}${path}${k > 1 ? `?page=${k}` : ''}`);
      const next = n < pages ? (broken && n === 3 ? `${ORIGIN}${path}?page=99` : url(n + 1)) : null;
      const prev = n > 1 ? url(n - 1) : null;
      const rel = [next && `<link rel="next" href="${next}">`, prev && `<link rel="prev" href="${prev}">`].filter(Boolean).join('\n  ');
      const headers = header ? { Link: [next && `<${next}>; rel="next"`, prev && `<${prev}>; rel="prev"`].filter(Boolean) } : {};
      return {
        title: `${title} ${n}`,
        robots,
        headers,
        head: header ? '' : rel,
        canonical: canonicalFirst ? `${ORIGIN}${path}` : `${ORIGIN}${path}${n > 1 ? `?page=${n}` : ''}`,
        body: linked ? `<nav class="pager">${Array.from({ length: pages }, (_, i) => `<a href="${path}${i ? `?page=${i + 1}` : ''}">${i + 1}</a>`).join(' ')}</nav>` : '<p>Page links are not in the HTML – only rel=next/prev.</p>',
      };
    },
  });
}
paginated(`${U}/paginated_page`, 'Paginated Page', '5-page series with rel=next/prev and linked page numbers.', 'Pagination detected; ?page=2..5 crawled.');
paginated(`${U}/paginated_and_noindex_page`, 'Paginated and Noindex Page', 'Paginated series where every page is noindex.', 'Non-indexable paginated pages.', { robots: 'noindex' });
paginated(`${U}/unlinked_paginated_page`, 'Unlinked Paginated Page', 'Series discoverable only through rel=next (no <a> links).', 'Pages 2..5 found only via rel=next ("Pagination URL not in anchor tag").', { linked: false });
paginated('/pagination/http_header', 'Header Paginated Page', 'rel=next/prev sent in HTTP Link headers.', 'HTTP rel=next/prev detected.', { header: true, linked: false });
paginated('/pagination/canonical_to_first', 'Canonical-to-first Paginated Page', 'Pages 2..5 canonicalise to page 1 (bad practice).', 'Paginated pages canonicalised – "Pagination canonical to first page".', { canonicalFirst: true });
paginated('/pagination/broken_sequence', 'Broken Paginated Page', "Page 3's rel=next points to ?page=99 (404).", '"Non-200 pagination URL".', { broken: true });
paginated('/pagination/relative_urls', 'Relative Paginated Page', 'rel=next/prev use relative "?page=N" URLs.', 'Resolved correctly.', { relative: true });
pg('/other/link_tag_in_body', 'Rel-next tag inside <body>', 'rel=next <link> placed in the body.', 'rel=next outside head – may be ignored.', { body: `<link rel="next" href="${ORIGIN}${U}/paginated_page?page=2">` });

// ------------------------------------------------------------------ depth & architecture
const d = group('depth');
const segs = ['one', 'two', 'three', 'four', 'five', 'six', 'seven'];
const names = ['', '', '', 'Four Paths', 'Five Paths', 'Six Paths', 'Seven Paths'];
for (let i = 3; i < segs.length; i++) {
  d('/' + segs.slice(0, i + 1).join('/'), names[i], `Folder depth ${i + 1}.`, `Folder depth ${i + 1}; crawl depth 2.`);
}
d('/path/1/path/2', 'Double', 'Repeating path pattern (/path/1/path/2).', 'Folder depth 4.');
d('/path/1/path/2/path/3', 'Triple Path', 'Repeating path pattern three times.', 'Folder depth 6.');
for (let n = 1; n <= 15; n++) {
  d(`/depth/${n}`, `Click depth ${n + 1}`, `Page ${n} of a 15-step chain; each page links only to the next.`, n === 1 ? 'Start of a long click path (crawl depth 2).' : `Crawl depth ${n + 1}.`, {
    body: n < 15 ? linkList([[`/depth/${n + 1}`, `Go deeper (step ${n + 1})`]]) : '<p>End of the chain.</p>',
  }, { listed: n === 1, unlinkedReason: 'reached by following the depth chain' });
}
d('/depth/orphan_page', 'Orphan page', 'Not linked from any page – listed only in the XML sitemap.', '"Orphan URL" (found in sitemap only).', {}, { listed: false, sitemap: true, unlinkedReason: 'only in sitemap.xml' });
d('/depth/orphan_page_2', 'Orphan page 2', 'Second orphan page, also only in the sitemap.', '"Orphan URL".', {}, { listed: false, sitemap: true, unlinkedReason: 'only in sitemap.xml' });
d('/infinite/', 'Infinite space (blocked)', 'Each page links to a deeper /infinite/N/ URL forever. Blocked by robots.txt.', 'Blocked by robots.txt – protects against a crawler trap.', {}, {
  prefix: true,
  page: (ctx) => {
    const n = (ctx.path.match(/\d+/g) || []).length;
    return { title: `Infinite ${n}`, body: `<a href="${ctx.path.replace(/\/?$/, '/')}${n + 1}/">Next level</a>`, filler: false };
  },
});
d('/traps/calendar', 'Calendar crawl trap (capped)', 'Calendar with next/previous month links generating parameter URLs; capped at 36 months.', 'Many near-duplicate parameter URLs ("crawl trap").', {}, {
  page: (ctx) => {
    const m = Math.max(0, Math.min(36, Number(ctx.query.get('m')) || 0));
    return {
      title: `Calendar month ${m}`,
      body: [m > 0 && `<a href="/traps/calendar?m=${m - 1}">Previous month</a>`, m < 36 && `<a href="/traps/calendar?m=${m + 1}">Next month</a>`].filter(Boolean).join(' · '),
      filler: false,
    };
  },
});
d('/traps/relative_loop/', 'Relative link loop', 'A relative link "loop/" creates ever-deeper URLs: /traps/relative_loop/loop/loop/…', '"Repetitive path" / crawl trap; capped at 10 levels.', {}, {
  prefix: true,
  page: (ctx) => {
    const depth = (ctx.path.match(/loop\//g) || []).length;
    return { title: `Relative loop depth ${depth}`, body: depth < 10 ? '<a href="loop/">loop</a>' : '<p>Capped.</p>', filler: false };
  },
});
