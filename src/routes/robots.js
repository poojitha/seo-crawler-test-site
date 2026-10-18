// robots.txt, meta robots and X-Robots-Tag tests.

const { group, add } = require('../registry');
const { linkList } = require('../html');
const { ORIGIN } = require('../config');

const t = group('robots_protocol');
const P = '/robots_protocol';

// Rules shared by every user-agent group. A crawler obeys ONLY the most specific
// group that matches its UA, so the shared rules are repeated in each group.
const COMMON = [
  '# --- robots.txt Disallow basics',
  `Disallow: ${P}/robots_excluded_1/`,
  `Disallow: ${P}/robots_excluded_2`,
  `Disallow: ${P}/robots_excluded_3`,
  '',
  '# A blank line inside a group: Google keeps reading the same group',
  `Disallow: ${P}/robots_excluded_blank_line`,
  `Disallow: ${P}/robots_excluded_duplicate_description`,
  `Disallow: ${P}/robots_excluded_meta_noindex`,
  `Disallow: ${P}/robots_noindexed_and_robots_disallowed`,
  '# --- Allow vs Disallow precedence (longest match wins, ties go to Allow)',
  `Disallow: ${P}/allowed_l`,
  `Allow: ${P}/allowed_longer`,
  `Disallow: ${P}/allowed_same_length`,
  `Allow: ${P}/allowed_same_length`,
  `Allow: ${P}/allowed_s`,
  `Disallow: ${P}/allowed_shorter`,
  '# --- Wildcards, end anchors and case sensitivity',
  `Disallow: ${P}/wildcard/*.php`,
  `Disallow: ${P}/end_anchor$`,
  `Disallow: ${P}/case_sensitive/UPPER`,
  `Disallow: ${P}/*?print=`,
  '# --- Other folders',
  'Disallow: /disallowed/',
  'Disallow: /infinite/',
  'Disallow: /redirects/disallowed_redirect',
  'Disallow: /redirects/redirect_chain_disallowed',
  'Disallow: /canonical_tags/disallowed_canonical_url',
  'Disallow: /hreflang/blocked_alternate',
  'Disallow: /url/url_with:colon',
  '# Any path containing a double slash',
  'Disallow: //',
  'Disallow: /*//',
  '# Unsupported directive (Google dropped support in 2019) – must be ignored',
  `Noindex: ${P}/robots_noindexed`,
  `Noindex: ${P}/robots_noindexed_and_robots_disallowed`,
];

function robotsTxt() {
  return [
    '# robots.txt for the SEO crawler test site',
    '# Every rule below is exercised by a page under /robots_protocol/ or elsewhere.',
    '',
    'User-agent: *',
    ...COMMON,
    '',
    '# Screaming Frog matches this group instead of "*" (same rules + one extra)',
    'User-agent: Screaming Frog SEO Spider',
    ...COMMON,
    `Disallow: ${P}/ua_specific_disallow/`,
    '',
    'User-agent: Googlebot',
    ...COMMON,
    `Disallow: ${P}/googlebot_only_disallow/`,
    '',
    'User-agent: BadBot',
    'Disallow: /',
    '',
    `Sitemap: ${ORIGIN}/sitemap.xml`,
    `Sitemap: ${ORIGIN}/sitemaps/sitemap-hreflang.xml`,
    '',
  ].join('\n');
}

add({
  cat: 'robots_protocol',
  path: '/robots.txt',
  title: 'robots.txt',
  test: 'robots.txt with Allow/Disallow precedence, wildcards, $ anchors, UA-specific groups, an unsupported Noindex directive and Sitemap lines.',
  expect: 'Parsed; URLs matching Disallow show "Blocked by robots.txt".',
  handler: () => ({ headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: robotsTxt() }),
});

// ---- Blocked by robots.txt
const blocked = (path, title, test) => t(path, title, test, 'Blocked by robots.txt (not crawled).', { robots: undefined });
blocked(`${P}/robots_excluded_1/bar/baz`, 'Blocked by folder rule', 'Matches "Disallow: /robots_protocol/robots_excluded_1/".');
blocked(`${P}/robots_excluded_2/foo`, 'Blocked by prefix rule', 'Matches the prefix "Disallow: /robots_protocol/robots_excluded_2".');
blocked(`${P}/robots_excluded_3`, 'Blocked exact path', 'Matches "Disallow: /robots_protocol/robots_excluded_3".');
blocked(`${P}/robots_excluded_blank_line`, 'Blocked after blank line', 'Disallow rule that appears after a blank line in the group.');
t(`${P}/robots_excluded_duplicate_description`, 'Blocked with duplicate description', 'Blocked URL whose description duplicates another page.', 'Blocked by robots.txt; duplicate description not reported because never crawled.', {
  description: 'Robots excluded description duplicate of /robots_protocol/robots_excluded.',
});
t(`${P}/robots_excluded_meta_noindex`, 'Robots.txt Disallowed With Meta Noindex', 'Disallowed AND meta noindex. Because it is blocked, the noindex can never be seen by search engines.', 'Blocked by robots.txt (noindex invisible) – classic conflict.', { robots: 'noindex' });
blocked(`${P}/allowed_shorter`, 'Allow shorter than Disallow', '"Allow: /robots_protocol/allowed_s" vs longer "Disallow: /robots_protocol/allowed_shorter".');
t(`${P}/allowed_longer`, 'Allowed Longer', '"Allow: …/allowed_longer" is longer than "Disallow: …/allowed_l" so it wins.', 'Crawled (allowed).');
t(`${P}/allowed_same_length`, 'Allowed Same Length', 'Allow and Disallow rules of identical length – the least restrictive (Allow) wins.', 'Crawled (allowed).');
blocked(`${P}/wildcard/page.php`, 'Wildcard *.php blocked', 'Matches "Disallow: /robots_protocol/wildcard/*.php".');
t(`${P}/wildcard/page.html`, 'Wildcard non-match (.html)', 'Same folder as the *.php rule but a different extension.', 'Crawled (allowed).');
blocked(`${P}/end_anchor`, 'End-anchor $ blocked', 'Matches "Disallow: /robots_protocol/end_anchor$" exactly.');
t(`${P}/end_anchor/child`, 'End-anchor $ child allowed', 'Starts with the anchored path but is longer, so "$" does not match.', 'Crawled (allowed).');
blocked(`${P}/case_sensitive/UPPER`, 'Case-sensitive rule (blocked)', 'Matches "Disallow: /robots_protocol/case_sensitive/UPPER".');
t(`${P}/case_sensitive/upper`, 'Case-sensitive rule (allowed)', 'Lowercase version of a blocked path – robots.txt paths are case-sensitive.', 'Crawled (allowed).');
t(`${P}/print_version`, 'Query wildcard rule', 'Linked as ?print=1, which matches "Disallow: /robots_protocol/*?print=".', 'Blocked by robots.txt.', {}, { href: `${P}/print_version?print=1` });
t(`${P}/ua_specific_disallow/page`, 'Screaming Frog-only Disallow', 'Disallowed only in the "Screaming Frog SEO Spider" group.', 'Blocked for Screaming Frog UA; allowed for other UAs.');
t(`${P}/googlebot_only_disallow/page`, 'Googlebot-only Disallow', 'Disallowed only in the Googlebot group.', 'Blocked when crawling with a Googlebot UA; allowed with the default UA.');
t(`${P}/page_allowed_with_robots`, 'Page allowed with robots.txt', 'Plain page not matched by any rule.', 'Crawled, indexable.');
t(`${P}/robots_noindexed`, 'Robots noindexed', 'Listed under the unsupported "Noindex:" robots.txt directive.', 'Indexable – the robots.txt Noindex directive is ignored.');
t(`${P}/robots_noindexed_and_robots_disallowed`, 'Noindex + Disallow in robots.txt', 'Has both Noindex: and Disallow: in robots.txt.', 'Blocked by robots.txt.');
t(`${P}/robots_excluded`, 'Robots.txt Disallowed (hub)', 'Lists every URL blocked by robots.txt.', 'Each linked URL shows "Blocked by robots.txt".', {
  body: linkList([
    [`${P}/robots_excluded_1/bar/baz`, 'Folder rule'],
    [`${P}/robots_excluded_2/foo`, 'Prefix rule'],
    [`${P}/robots_excluded_3`, 'Exact rule'],
    [`${P}/robots_excluded_blank_line`, 'After blank line'],
    [`${P}/allowed_shorter`, 'Allow shorter'],
    [`${P}/wildcard/page.php`, 'Wildcard'],
    ['/disallowed/page.html', 'Disallowed folder page'],
    ['/infinite/', 'Infinite space (blocked)'],
  ]),
});
t(`${P}/user_excluded`, 'User Excluded', 'Use this page to test your crawler\'s "Exclude" configuration (e.g. exclude regex .*user_excluded.*).', 'Not crawled when excluded in crawler config; otherwise indexable.');

// ---- Meta robots
const mr = (slug, title, robots, expect, test) => t(`${P}/${slug}`, title, test || `<meta name="robots" content="${robots}">`, expect, { robots });
mr('meta_noindex', 'Meta Noindex', 'noindex', 'Non-indexable: noindex.');
mr('meta_noindex_uppercase', 'Meta Noindex Uppercase', 'NOINDEX', 'Non-indexable: noindex (directives are case-insensitive).');
mr('meta_nofollow', 'Meta Nofollow', 'nofollow', 'Indexable; outlinks not followed (nofollow).');
mr('meta_noarchive', 'Meta Noarchive', 'noarchive', 'Indexable; noarchive reported.');
mr('meta_nosnippet', 'Meta Nosnippet', 'nosnippet', 'Indexable; nosnippet reported.');
mr('robots_meta_none', 'Robots Meta None', 'none', 'Non-indexable: none = noindex, nofollow.');
mr('robots_meta_noodp_noydir_none_noindex', 'Robots Meta Noodp + Noydir + None + Noindex', 'noodp, noydir, none, noindex', 'Non-indexable; obsolete noodp/noydir reported.');
mr('multiple_robots_directive_meta_tag', 'Multiple Robots directives meta tag', 'noodp, noydir, noindex, nofollow, noarchive, nosnippet', 'Non-indexable; all six directives parsed.');
mr('meta_index_follow', 'Meta index, follow', 'index, follow', 'Indexable (explicit default directives).');
mr('max_snippet_and_image_preview', 'max-snippet / max-image-preview', 'max-snippet:0, max-image-preview:none, max-video-preview:0', 'Indexable; snippet controls reported.');
mr('unavailable_after_past', 'unavailable_after in the past', 'unavailable_after: 2016-06-25T15:00:00+00:00', 'Treated as expired/noindex by Google.');
mr('noimageindex', 'Meta noimageindex', 'noimageindex', 'Indexable; images on the page should not be indexed.');
t(`${P}/multiple_googlebot_directive_meta_tag`, 'Multiple Googlebot directives meta tag', '<meta name="googlebot" content="noodp, noydir, noindex, nofollow, noarchive, nosnippet">', 'Non-indexable for Googlebot (bot-specific meta).', {
  head: '<meta name="googlebot" content="noodp, noydir, noindex, nofollow, noarchive, nosnippet">',
});
t(`${P}/googlebot_news_noindex`, 'googlebot-news noindex only', '<meta name="googlebot-news" content="noindex">.', 'Indexable for normal search; noindex only for Google News.', {
  head: '<meta name="googlebot-news" content="noindex">',
});
t(`${P}/robots_meta_multiple_tags_noindex_nofollow`, 'Robots Meta Multiple Tags: noindex + nofollow', 'Two separate robots meta tags: one noindex, one nofollow.', 'Non-indexable; both tags reported (Meta Robots 1 and 2).', {
  head: '<meta name="robots" content="noindex">\n  <meta name="robots" content="nofollow">',
});
t(`${P}/meta_robots_in_body`, 'Meta robots noindex in <body>', 'noindex meta tag placed in the body.', 'Google still honours it; some crawlers miss it.', { body: '<meta name="robots" content="noindex">' });
t(`${P}/meta_robots_empty_content`, 'Meta robots with empty content', '<meta name="robots" content="">.', 'Indexable; empty directive.', { head: '<meta name="robots" content="">' });
t(`${P}/meta_robots_typo`, 'Meta robots typo', '<meta name="robots" content="no-index">  (invalid value).', 'Indexable – "no-index" is not a valid directive.', { robots: 'no-index' });

// ---- X-Robots-Tag
const xr = (slug, title, value, expect, page = {}) =>
  t(`${P}/${slug}`, title, `HTTP header X-Robots-Tag: ${[].concat(value).join(' | ')}`, expect, { ...page, headers: { 'X-Robots-Tag': value } });
xr('x_robots_tag_noindex', 'X-robots Noindex', 'noindex', 'Non-indexable: noindex via X-Robots-Tag.');
xr('x_robots_multiple_directives', 'X-Robots Multiple Directives', 'noindex, nofollow, noarchive, nosnippet, noodp, notranslate, noimageindex, unavailable_after: 25 Jun 2016 15:00:00 UTC', 'Non-indexable; all directives parsed.');
xr('x_robots_multiple_headers', 'Two X-Robots-Tag headers', ['noindex', 'nofollow'], 'Non-indexable; both headers combined.');
xr('x_robots_googlebot_prefix', 'X-Robots-Tag with UA prefix', 'googlebot: noindex', 'Non-indexable for Googlebot only.');
xr('x_robots_otherbot_prefix', 'X-Robots-Tag for another bot', 'otherbot: noindex', 'Indexable for Screaming Frog / Googlebot.');
xr('robots_noindex_conflict', 'Robots noindex conflict', 'noindex', 'Non-indexable – the most restrictive directive (header noindex) wins over meta "index".', { robots: 'index' });
xr('meta_robots_and_x_robots_conflict', 'Meta robots and X-Robots conflict', 'noarchive', 'Both sources reported: meta nosnippet + header noarchive.', { robots: 'nosnippet' });

// ---- Robots combined with other signals
t(`${P}/canonicalised_with_noindex`, 'Canonicalised with Noindex', 'noindex AND canonical to the home page – mixed signals.', 'Non-indexable: "Canonicalised, noindex".', { robots: 'noindex', canonical: ORIGIN + '/' });
t(`${P}/canonicalised_with_non_200`, '404 with canonical', '404 response that still contains a canonical tag.', 'Client Error; canonical ignored.', { status: 404, canonical: ORIGIN + '/' });
t(`${P}/non_200_with_noindex`, '404 with noindex', '404 response that also has meta noindex.', 'Client Error (4xx).', { status: 404, robots: 'noindex' });
t(`${P}/nofollow_page_links`, 'Nofollow page with links', 'Page with meta nofollow that links to a page only reachable from here.', 'The linked page should not be crawled when respecting nofollow.', {
  robots: 'nofollow',
  body: linkList([[`${P}/only_linked_from_nofollow_page`, 'Only linked from a nofollow page']]),
});
t(`${P}/only_linked_from_nofollow_page`, 'Only linked from nofollow page', 'Discoverable only through a meta-nofollow page.', 'Not found when the crawler respects nofollow.', {}, { listed: false, unlinkedReason: 'linked only from a meta nofollow page' });
