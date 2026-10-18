// /links/* – link extraction, nofollow, relative URLs, broken links, anchors.

const { group } = require('../registry');
const { linkList } = require('../html');
const { ORIGIN, ALT_ORIGIN } = require('../config');

const t = group('links');
const L = '/links';
const EXT = ALT_ORIGIN + '/external';

t(`${L}/broken_links_internal`, 'Broken Links Internal', 'Links to internal URLs returning 404, 410 and 500.', 'Three broken internal outlinks.', {
  body: linkList([
    [`${L}/this_page_does_not_exist`, 'Internal 404'],
    ['/status_codes/status_410', 'Internal 410'],
    ['/status_codes/status_500', 'Internal 500'],
  ]),
});
t(`${L}/broken_links_external`, 'Broken Links External', 'Links to external URLs returning 404/500 and to a domain that does not resolve.', 'Broken external links: 404, 500, DNS failure.', {
  body: linkList([
    [`${EXT}/status/404`, 'External 404'],
    [`${EXT}/status/500`, 'External 500'],
    ['http://this-domain-does-not-exist.invalid/', 'DNS lookup fails (.invalid TLD)'],
  ]),
});
t(`${L}/page_with_external_links`, 'Page with External Links', 'Links to a few external pages.', 'External outlinks reported (not crawled).', {
  body: linkList([
    [`${EXT}/page`, 'External page'],
    [`${EXT}/page-two`, 'External page two'],
    ['https://example.com/', 'example.com (real internet)'],
  ]),
});
t(`${L}/external_links_to_disallwed_urls`, 'External Links to Disallowed URLs', 'External links to URLs blocked by the other host\'s robots.txt.', 'External URLs "Blocked by robots.txt".', {
  body: linkList([[`${ALT_ORIGIN}/disallowed/page.html`, 'External disallowed page']]),
});
t(`${L}/max_external_links`, 'Max External Links', '150 unique external links.', '"High external outlinks".', {
  body: linkList(Array.from({ length: 150 }, (_, i) => [`${EXT}/page?n=${i + 1}`, `External link ${i + 1}`])),
});
t(`${L}/max_internal_links`, 'Max Internal Links', '250 unique internal links (to parameterised URLs).', '"High internal outlinks" (over 100).', {
  body: linkList(Array.from({ length: 250 }, (_, i) => [`${L}/max_internal_links_target?n=${i + 1}`, `Internal link ${i + 1}`])),
});
t(`${L}/max_internal_links_target`, 'Internal link target', 'Target of the 250 links (?n=1..250).', '250 parameter URLs with the same content.', {}, { listed: false, href: `${L}/max_internal_links_target?n=1`, unlinkedReason: 'linked from max_internal_links' });
t(`${L}/repeated_internal_links`, 'Repeated internal links', 'The same internal URL linked 10 times.', 'Outlinks 10, unique outlinks 1.', {
  body: linkList(Array.from({ length: 10 }, (_, i) => ['/redirects/redirect_target', `Repeated link ${i + 1}`])),
});
t(`${L}/repeated_external_links`, 'Repeated external links', 'The same external URL linked 10 times.', 'External outlinks 10, unique 1.', {
  body: linkList(Array.from({ length: 10 }, (_, i) => [`${EXT}/page`, `Repeated external link ${i + 1}`])),
});
t(`${L}/nofollow_and_follow_link`, 'Nofollow & Followed Link', 'One followed link and one rel="nofollow" link to different pages.', 'Nofollowed target not crawled (when respecting nofollow).', {
  body: `<p><a href="${L}/followed_target">Followed link</a></p><p><a href="${L}/nofollow_target" rel="nofollow">Nofollow link</a></p>`,
});
t(`${L}/followed_target`, 'Followed target', 'Linked with a normal link.', 'Crawled.', {}, { listed: false, unlinkedReason: 'linked from nofollow_and_follow_link' });
t(`${L}/nofollow_target`, 'Nofollow target', 'Only linked with rel=nofollow.', 'Not crawled when nofollow is respected.', {}, { listed: false, unlinkedReason: 'only linked via rel=nofollow' });
t(`${L}/rel_ugc_sponsored`, 'rel=ugc / rel=sponsored / combined', 'Links with rel="ugc", rel="sponsored", rel="nofollow noopener", rel="NOFOLLOW".', 'Link rel attributes reported per link.', {
  body: `<p><a href="${EXT}/ugc" rel="ugc">UGC link</a></p><p><a href="${EXT}/sponsored" rel="sponsored">Sponsored</a></p><p><a href="${EXT}/combo" rel="nofollow noopener noreferrer">Combined rel</a></p><p><a href="${L}/followed_target" rel="NOFOLLOW">Uppercase NOFOLLOW</a></p>`,
});
t(`${L}/relative_link/a/b`, 'Relative Link', 'href="../c" and href="d" resolved from /links/relative_link/a/b.', 'Resolved to /links/relative_link/c and /links/relative_link/a/d.', {
  body: '<p><a href="../c">../c</a></p><p><a href="d">d</a></p><p><a href="./e?x=1">./e?x=1</a></p>',
});
t(`${L}/relative_link/c`, 'Relative link target c', 'Target of ../c.', '200.', {}, { listed: false, unlinkedReason: 'relative link target' });
t(`${L}/relative_link/a/d`, 'Relative link target d', 'Target of d.', '200.', {}, { listed: false, unlinkedReason: 'relative link target' });
t(`${L}/relative_link/a/e`, 'Relative link target e', 'Target of ./e?x=1.', '200.', {}, { listed: false, href: `${L}/relative_link/a/e?x=1`, unlinkedReason: 'relative link target' });
t(`${L}/relative_link_with_base/a/b`, 'Relative Link With Base', '<base href="/links/base_folder/"> changes how "x" resolves.', 'href="x" resolves to /links/base_folder/x.', {
  head: '<base href="/links/base_folder/">',
  body: '<p><a href="x">x (relative to base)</a></p>',
});
t(`${L}/base_folder/x`, 'Base href target', 'Target resolved via <base>.', '200.', {}, { listed: false, unlinkedReason: 'resolved through <base href>' });
t(`${L}/relative_protocol_page`, 'Relative Protocol Page', 'Protocol-relative link //host:port/path.', 'Resolved using the current scheme.', {
  body: `<p><a href="//${ORIGIN.replace('http://', '')}/redirects/redirect_target">Protocol-relative internal</a></p><p><a href="//${ALT_ORIGIN.replace('http://', '')}/external/page">Protocol-relative external</a></p>`,
});
t(`${L}/links_with_quote_variations`, 'Links with Quote Variations', 'href with double quotes, single quotes and no quotes.', 'All three links extracted.', {
  body: `<p><a href="${L}/quote/double">Double</a></p><p><a href='${L}/quote/single'>Single</a></p><p><a href=${L}/quote/none>None</a></p>`,
});
for (const q of ['double', 'single', 'none']) t(`${L}/quote/${q}`, `Quote target ${q}`, `Linked with ${q} quotes.`, '200.', {}, { listed: false, unlinkedReason: 'link quote test target' });
t(`${L}/whitespace_in_links`, 'Whitespace in Links', 'href values with leading/trailing spaces, newlines and tabs.', 'Whitespace trimmed – resolves to /links/whitespace_target.', {
  body: `<p><a href="  ${L}/whitespace_target  ">Spaces</a></p><p><a href="\n${L}/whitespace_target\n">Newlines</a></p><p><a href="\t${L}/whitespace_target">Tab</a></p>`,
});
t(`${L}/whitespace_target`, 'Whitespace target', 'Target of whitespace links.', '200.', {}, { listed: false, unlinkedReason: 'whitespace link target' });
t(`${L}/image_links`, 'Image Links', 'Links whose only content is an <img> (with and without alt).', 'Anchor text taken from alt; one image link has no anchor text.', {
  body: `<p><a href="/redirects/redirect_target"><img src="/images/photo.jpg" alt="Image link alt text" width="20" height="20"></a></p><p><a href="${L}/followed_target"><img src="/images/sample.gif" width="20" height="20"></a></p>`,
});
t(`${L}/anchor_text_issues`, 'Anchor text issues', 'Empty anchor, "click here", "read more", and an anchor with only whitespace.', '"Non-descriptive anchor text" and "No anchor text".', {
  body: `<p><a href="${L}/followed_target"></a></p><p><a href="${L}/followed_target">click here</a></p><p><a href="${L}/followed_target">read more</a></p><p><a href="${L}/followed_target">   </a></p>`,
});
t(`${L}/non_standard_links`, 'Non Standard Links', 'Links in <area>, <iframe>, <link rel=alternate>, <form action>, data-href and onclick.', '<area> and <iframe> URLs are crawled; data-href/onclick are not (without JS).', {
  body: `<img src="/images/sample.gif" usemap="#m" alt="map" width="50" height="50"><map name="m"><area shape="rect" coords="0,0,50,50" href="${L}/area_target" alt="Area link"></map>
<iframe src="${L}/iframe_target" width="300" height="80" title="iframe"></iframe>
<form action="${L}/form_target" method="get"><button>Form</button></form>
<span data-href="${L}/data_href_target">data-href span</span>
<span onclick="location.href='${L}/onclick_target'">onclick span</span>`,
});
for (const x of ['area_target', 'iframe_target', 'form_target', 'data_href_target', 'onclick_target']) {
  t(`${L}/${x}`, `Non-standard link target: ${x}`, `Linked only via ${x.replace('_target', '')}.`, '200 if discovered.', {}, { listed: false, unlinkedReason: `non-standard link (${x.replace('_target', '')})` });
}
t(`${L}/special_scheme_links`, 'mailto:, tel:, javascript: and fragment links', 'Links that are not crawlable HTTP URLs.', 'Not crawled; may be listed as non-HTTP links.', {
  body: `<p><a href="mailto:test@example.com">mailto</a> <a href="tel:+441234567890">tel</a> <a href="javascript:void(0)">javascript</a> <a href="#">#</a> <a href="#section">#section</a> <a href="ftp://example.com/file">ftp</a> <a href="sms:+441234567890">sms</a></p>`,
});
t(`${L}/link_to_redirect`, 'Internal link to a redirect', 'Internal link pointing at a 301.', '"Internal redirect" outlink – should link to the final URL.', { body: linkList([['/redirects/redirect_1', 'Link to 301']]) });
t(`${L}/links_in_head_only`, 'Links declared only in <head>', '<link rel="alternate">, rel="prev"/"next", rel="author" pointing to unlinked pages.', 'Discovered only if the crawler follows head links.', {
  head: `<link rel="alternate" type="application/rss+xml" href="${L}/feed.xml">\n  <link rel="author" href="${L}/author_page">`,
});
t(`${L}/feed.xml`, 'RSS feed', 'RSS feed linked from <head>.', '200 application/rss+xml.', {}, {
  listed: false,
  unlinkedReason: '<link rel=alternate> in head',
  handler: () => ({
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
    body: `<?xml version="1.0"?><rss version="2.0"><channel><title>Test feed</title><link>${ORIGIN}/</link><description>Feed</description><item><title>Item</title><link>${ORIGIN}/redirects/redirect_target</link></item></channel></rss>`,
  }),
});
t(`${L}/author_page`, 'Author page', 'Linked only from rel=author.', '200.', {}, { listed: false, unlinkedReason: '<link rel=author> in head' });
t(`${L}/meta_refresh`, 'Meta refresh (self, 5 s)', 'Meta refresh to itself after 5 seconds (auto-reload).', 'Meta refresh reported (self-referencing, 5 s).', {
  head: `<meta http-equiv="refresh" content="5;url=${L}/meta_refresh">`,
});
t(`${L}/header_refresh`, 'Header Refresh (self)', 'HTTP Refresh header pointing to itself.', 'HTTP refresh to self.', { headers: { Refresh: `5; url=${ORIGIN}${L}/header_refresh` } });
t(`${L}/non_default_language`, 'Non Default Language', 'Links with hreflang attributes on <a> tags.', '<a hreflang> is not an hreflang annotation – links only.', {
  body: '<p><a href="/urls/page_with_hreflang/0" hreflang="pl">Polish version</a></p><p><a href="/urls/page_with_hreflang/1" hreflang="de">German version</a></p>',
});
t(`${L}/link_to_uppercase_url`, 'Link to uppercase URL variant', 'Links to /urls/DUPLICATION_TYPES vs /urls/duplication_types.', 'Two different URLs with duplicate content.', {
  body: linkList([['/urls/DUPLICATION_TYPES', 'Uppercase'], ['/urls/duplication_types', 'Lowercase']]),
});
t(`${L}/links_inside_noscript`, 'Links inside <noscript>', 'A link that only exists in <noscript>.', 'Extracted from raw HTML; absent after rendering.', {
  body: `<noscript><a href="${L}/noscript_target">Noscript link</a></noscript>`,
});
t(`${L}/noscript_target`, 'Noscript target', 'Linked only inside <noscript>.', '200 if raw HTML links are used.', {}, { listed: false, unlinkedReason: 'linked inside <noscript>' });
t(`${L}/link_to_other_host_same_site`, 'Link to the alternate host', `Internal-looking path on ${ALT_ORIGIN}.`, 'Treated as external (different host).', { body: linkList([[`${ALT_ORIGIN}/redirects/redirect_target`, 'Same path on other host']]) });
