# Crawl comparison report

Crawl: `crawl.csv` (985 rows) vs `expected-results.csv` (1134 rows).

## Coverage

| | URLs |
|---|---|
| Expected URLs | 1134 |
| Found in crawl | 982 (86.6%) |
| Missing from crawl | 152 |
| In crawl but not expected | 1 |

<details><summary><b>Discovered via: link</b> (37)</summary>

- `/redirects/external_redirect_chain1` – Internal → internal → external chain
- `/urls/url_with_fragment/` 
- `/depth/10` – Click depth 11
- `/traps/calendar?m=9` – Calendar crawl trap (capped)
- `/traps/relative_loop/loop/loop/loop/loop/loop/loop/loop/loop/loop/` – Relative link loop
- `/depth/11` – Click depth 12
- `/traps/calendar?m=10` – Calendar crawl trap (capped)
- `/depth/12` – Click depth 13
- `/traps/calendar?m=11` – Calendar crawl trap (capped)
- `/depth/13` – Click depth 14
- `/traps/calendar?m=12` – Calendar crawl trap (capped)
- `/depth/14` – Click depth 15
- `/traps/calendar?m=13` – Calendar crawl trap (capped)
- `/depth/15` – Click depth 16
- `/traps/calendar?m=14` – Calendar crawl trap (capped)
- `/traps/calendar?m=15` – Calendar crawl trap (capped)
- `/traps/calendar?m=16` – Calendar crawl trap (capped)
- `/traps/calendar?m=17` – Calendar crawl trap (capped)
- `/traps/calendar?m=18` – Calendar crawl trap (capped)
- `/traps/calendar?m=19` – Calendar crawl trap (capped)
- `/traps/calendar?m=20` – Calendar crawl trap (capped)
- `/traps/calendar?m=21` – Calendar crawl trap (capped)
- `/traps/calendar?m=22` – Calendar crawl trap (capped)
- `/traps/calendar?m=23` – Calendar crawl trap (capped)
- `/traps/calendar?m=24` – Calendar crawl trap (capped)
- `/traps/calendar?m=25` – Calendar crawl trap (capped)
- `/traps/calendar?m=26` – Calendar crawl trap (capped)
- `/traps/calendar?m=27` – Calendar crawl trap (capped)
- `/traps/calendar?m=28` – Calendar crawl trap (capped)
- `/traps/calendar?m=29` – Calendar crawl trap (capped)
- `/traps/calendar?m=30` – Calendar crawl trap (capped)
- `/traps/calendar?m=31` – Calendar crawl trap (capped)
- `/traps/calendar?m=32` – Calendar crawl trap (capped)
- `/traps/calendar?m=33` – Calendar crawl trap (capped)
- `/traps/calendar?m=34` – Calendar crawl trap (capped)
- `/traps/calendar?m=35` – Calendar crawl trap (capped)
- `/traps/calendar?m=36` – Calendar crawl trap (capped)

</details>

<details><summary><b>Blocked by robots.txt (should be listed, non-indexable)</b> (34)</summary>

- `/redirects/disallowed_redirect` – Robots-blocked redirect
- `/redirects/disallowed_redirect_target_redirect` – Robots-blocked redirect (2)
- `/robots_protocol/robots_excluded_1/bar/baz` – Blocked by folder rule
- `/robots_protocol/robots_excluded_2/foo` – Blocked by prefix rule
- `/robots_protocol/robots_excluded_3` – Blocked exact path
- `/robots_protocol/robots_excluded_blank_line` – Blocked after blank line
- `/robots_protocol/robots_excluded_duplicate_description` – Blocked with duplicate description
- `/robots_protocol/robots_excluded_meta_noindex` – Robots.txt Disallowed With Meta Noindex
- `/robots_protocol/allowed_shorter` – Allow shorter than Disallow
- `/robots_protocol/wildcard/page.php` – Wildcard *.php blocked
- `/robots_protocol/end_anchor` – End-anchor $ blocked
- `/robots_protocol/case_sensitive/UPPER` – Case-sensitive rule (blocked)
- `/robots_protocol/print_version?print=1` – Query wildcard rule
- `/robots_protocol/robots_noindexed_and_robots_disallowed` – Noindex + Disallow in robots.txt
- `/urls/multiple_slashes///200_404` – Multiple slashes (blocked)
- `/urls/multiple_slashes///404_200` – Multiple slashes (blocked 2)
- `//urls/double_slash/disallowed_start` – Double slash at start
- `/urls/double_slash//one` – Double slash: //one
- `/urls/double_slash////two` – Double slash: ////two
- `/urls/double_slash//////three` – Double slash: //////three
- `/urls/double_slash//////four//` – Double slash: //////four//
- `/urls/double_slash//disallowed_middle` – Double slash: //disallowed_middle
- `/urls/double_slash/disallowed_end//` – Double slash: /disallowed_end//
- `/url/url_with:colon` – URL with colon
- `/infinite/` – Infinite space (blocked)
- `/redirects/redirect_chain_disallowed` – Blocked redirect target
- `/disallowed/page.html` – Disallowed resources folder
- `/canonical_tags/disallowed_canonical_url` – Disallowed canonical target
- `/urls/http//missing-colon.example/` 
- `/hreflang/blocked_alternate` – Blocked hreflang alternate
- `/disallowed/disallowedcss.css` – Disallowed resources folder
- `/disallowed/disallowedcss.css?par=2` – Disallowed resources folder
- `/disallowed/disallowedjs.js` – Disallowed resources folder
- `/disallowed/disallowedjs.js?par=2` – Disallowed resources folder

</details>

<details><summary><b>Discovered via: canonical</b> (17)</summary>

- `/canonical_tags/html1` 
- `/canonical_tags/html` 
- `/canonical_tags/unlinked/canonical` 
- `/canonical_tag_og_url_conflict` 
- `/canonical_tags/foobar` 
- `/foobar` 
- `/canonical_tags` 
- `/canonical_tags/does_not_exist` 
- `/canonical_tags/canonical_chain_b` – Canonical chain B
- `/canonical_tags/canonical_loop_b` – Canonical loop B
- `/Canonical_tags/canonical_path_is_case_sensitive` 
- `/canonical_tags/canonical_prameter_key_is_case_sensitive?Key=value` – Parameter key is case sensitive
- `/canonical_tags/canonical_prameter_value_is_case_sensitive?key=Value` – Parameter value is case sensitive
- `/canonical_tags/canonical_different_parameter_order?key=value&key2=value2` – Different parameter orders are canonicalised
- `/canonical_tags/canonical_url_with_slash/` 
- `/canonical_tags/canonical_with_tracking_params` – Parameter URL canonicalised to clean URL
- `/canonical_tags/canonical_chain_c` – Canonical chain C

</details>

<details><summary><b>Discovered via: resource</b> (14)</summary>

- `/images/sample.gif` – Small GIF image
- `/brokencss.css` 
- `/brokenjs.js` 
- `/images/does-not-exist.png` 
- `/css/app.css?v=0` – Site stylesheet
- `/css/app.css?v=1` – Site stylesheet
- `/css/app.css?v=2` – Site stylesheet
- `/css/app.css?v=3` – Site stylesheet
- `/css/app.css?v=4` – Site stylesheet
- `/js/app.js?v=0` – Site script
- `/js/app.js?v=1` – Site script
- `/js/app.js?v=2` – Site script
- `/js/app.js?v=3` – Site script
- `/js/app.js?v=4` – Site script

</details>

<details><summary><b>Discovered via: XML sitemap</b> (9)</summary>

- `/sitemaps/sitemap-missing.xml` 
- `/hreflang/sitemap_en` – Hreflang via XML sitemap (en)
- `/hreflang/sitemap_fr` – Hreflang via XML sitemap (fr)
- `/depth/orphan_page` – Orphan page
- `/depth/orphan_page_2` – Orphan page 2
- `/images/sitemap-missing.png` 
- `/sitemaps/this-url-is-404` 
- `/redirects/redirect_target?from=sitemap` – Redirect Target
- `/relative/url/in/sitemap` 

</details>

<details><summary><b>Discovered via: Link header | canonical</b> (4)</summary>

- `/pagination/http_header?page=2` – Header Paginated Page
- `/pagination/http_header?page=3` – Header Paginated Page
- `/pagination/http_header?page=4` – Header Paginated Page
- `/pagination/http_header?page=5` – Header Paginated Page

</details>

<details><summary><b>Discovered via: amphtml</b> (4)</summary>

- `/mobile/amp/separate_desktop` – AMP – separate_desktop
- `/mobile/amp/amp_with_separate_mobile` – AMP – amp_with_separate_mobile
- `/mobile/amp/no_mobile_with_amp` – AMP – no_mobile_with_amp
- `/mobile/amp/responsive_with_amp` – AMP – responsive_with_amp

</details>

<details><summary><b>Discovered via: link | XML sitemap</b> (3)</summary>

- `/content/xhtml_malformed` – Malformed XHTML
- `/urls/duplication_types/` – Duplicated Page
- `/other/expiring_page_for_removed_test/1792318747` – Expiring page (timestamped)

</details>

<details><summary><b>Discovered via: hreflang</b> (3)</summary>

- `/hreflang/es` – Hreflang Spanish page
- `/hreflang/zh-hant` – Hreflang Traditional Chinese page
- `/hreflang/does_not_exist` 

</details>

<details><summary><b>Discovered via: rel=next | canonical | rel=prev</b> (3)</summary>

- `/urls/unlinked_paginated_page?page=2` – Unlinked Paginated Page
- `/urls/unlinked_paginated_page?page=3` – Unlinked Paginated Page
- `/urls/unlinked_paginated_page?page=4` – Unlinked Paginated Page

</details>

<details><summary><b>Redirect to another host – row missing</b> (2)</summary>

- `/redirects/external_redirect` – Redirect to external site (example.com)
- `/redirects/external_redirect_local` – Redirect to another host

</details>

<details><summary><b>Discovered via: <link> in head</b> (2)</summary>

- `/links/feed.xml` – RSS feed
- `/links/author_page` – Author page

</details>

<details><summary><b>Discovered via: redirect</b> (2)</summary>

- `/redirects/redirect_target?utm_source=redirect&utm_medium=test` – Redirect Target
- `/redirects/trailing_slash/` – Trailing slash version

</details>

<details><summary><b>Discovered via: JavaScript link</b> (2)</summary>

- `/javascript/renderer_timeout_target_1` – Renderer timeout target 1
- `/javascript/renderer_timeout_target_2` – Renderer timeout target 2

</details>

<details><summary><b>Discovered via: rel=prev</b> (2)</summary>

- `/thats_an_unfinished_tag` 
- `/pagination/relative_urls?page=1` – Relative Paginated Page

</details>

<details><summary><b>Discovered via: resource | XML sitemap</b> (1)</summary>

- `/images/photo.jpg` – Photo JPEG

</details>

<details><summary><b>Discovered via: <area></b> (1)</summary>

- `/links/area_target` – Non-standard link target: area_target

</details>

<details><summary><b>Discovered via: <iframe></b> (1)</summary>

- `/links/iframe_target` – Non-standard link target: iframe_target

</details>

<details><summary><b>Redirect row missing (HTTP Redirect)</b> (1)</summary>

- `/redirects/external_redirect_chain2` – External chain step 2

</details>

<details><summary><b>Discovered via: canonical (HTTP)</b> (1)</summary>

- `/canonical_tags/header` 

</details>

<details><summary><b>Discovered via: canonical | canonical (HTTP)</b> (1)</summary>

- `/canonical_tags/unlinked/canonical_header` – Target of unlinked header canonical

</details>

<details><summary><b>Discovered via: hreflang | hreflang (HTTP)</b> (1)</summary>

- `/hreflang/fr` – Hreflang French page

</details>

<details><summary><b>Discovered via: hreflang (HTTP)</b> (1)</summary>

- `/hreflang/header_ok_de` – Hreflang header partner (de)

</details>

<details><summary><b>Discovered via: mobile alternate</b> (1)</summary>

- `/mobile/separate_mobile_with_mobile_not_subdomain` – Mobile page on same host

</details>

<details><summary><b>Discovered via: amphtml | canonical</b> (1)</summary>

- `/mobile/amp/desktop_with_self_canonical_mobile_and_amp` – AMP self canonical

</details>

<details><summary><b>Discovered via: amphtml | mobile alternate</b> (1)</summary>

- `/mobile/amp/desktop_with_AMP_as_mobile` – AMP – desktop_with_AMP_as_mobile

</details>

<details><summary><b>Discovered via: JavaScript fetch | resource</b> (1)</summary>

- `/api/data.json` – AJAX data endpoint

</details>

<details><summary><b>Discovered via: rel=next</b> (1)</summary>

- `/pagination/broken_sequence?page=99` – Broken Paginated Page

</details>

<details><summary><b>Discovered via: rel=next | canonical</b> (1)</summary>

- `/urls/unlinked_paginated_page?page=5` – Unlinked Paginated Page

</details>

**In crawl but not expected:**

- `http://localhost:3000/other/expiring_page_for_removed_test/1792312692` (200)

## Columns

64322 of 64680 cell comparisons match (99.4%). Not compared: `crawlTimestamp` (run-dependent), `co2Mg` (crawler carbon model), `carbonRating` (crawler carbon model), `percentOfTotal` (crawler link metric), `linkScore` (crawler link metric).

| Column | Rule | Compared | Match | Mismatch | Match % |
|---|---|---|---|---|---|
| url | URL (normalised) | 982 | 982 | 0 | 100.0% |
| urlEncoded | URL (normalised) | 982 | 982 | 0 | 100.0% |
| depth | exact | 982 | 982 | 0 | 100.0% |
| folderDepth | exact | 982 | 982 | 0 | 100.0% |
| responseTimeMs | slow pages only: ≥ 80% of expected | 982 | 982 | 0 | 100.0% |
| redirectUrl | URL (normalised) | 982 | 971 | 11 | 98.9% |
| redirectType | exact | 982 | 971 | 11 | 98.9% |
| status | exact | 982 | 978 | 4 | 99.6% |
| statusText | exact | 982 | 952 | 30 | 96.9% |
| contentType | exact | 982 | 978 | 4 | 99.6% |
| httpVersion | exact | 982 | 974 | 8 | 99.2% |
| lastModified | exact | 982 | 982 | 0 | 100.0% |
| sizeBytes | exact | 931 | 907 | 24 | 97.4% |
| transferredBytes | ±2% | 931 | 918 | 13 | 98.6% |
| totalTransferredBytes | ±15% (depends on resources loaded) | 931 | 921 | 10 | 98.9% |
| hash | duplicate grouping (same content ⇔ same hash) | 928 | 920 | 8 | 99.1% |
| cookies | exact | 982 | 981 | 1 | 99.9% |
| title | exact (whitespace collapsed) | 979 | 970 | 9 | 99.1% |
| titleLength | ±1 | 979 | 970 | 9 | 99.1% |
| titlePixelWidth | ±10% (Arial 20px; depends on installed font) | 979 | 971 | 8 | 99.2% |
| metaDescription | exact (whitespace collapsed) | 979 | 973 | 6 | 99.4% |
| metaDescriptionLength | ±1 | 979 | 974 | 5 | 99.5% |
| metaDescriptionPixelWidth | ±10% (Arial 14px; font-dependent) | 979 | 974 | 5 | 99.5% |
| metaKeywords | exact | 982 | 982 | 0 | 100.0% |
| metaKeywordsLength | exact | 982 | 982 | 0 | 100.0% |
| h1 | exact | 934 | 928 | 6 | 99.4% |
| h1Length | ±1 | 934 | 929 | 5 | 99.5% |
| h1Second | exact | 982 | 980 | 2 | 99.8% |
| h1SecondLength | ±1 | 982 | 980 | 2 | 99.8% |
| h1Count | exact | 934 | 929 | 5 | 99.5% |
| h2 | exact | 982 | 981 | 1 | 99.9% |
| h2Length | ±1 | 982 | 981 | 1 | 99.9% |
| h2Count | exact | 982 | 980 | 2 | 99.8% |
| canonical | URL (normalised) | 982 | 982 | 0 | 100.0% |
| metaRobots | case-insensitive | 982 | 979 | 3 | 99.7% |
| metaRobots2 | case-insensitive | 982 | 982 | 0 | 100.0% |
| xRobotsTag | case-insensitive | 982 | 982 | 0 | 100.0% |
| metaRefresh | exact | 982 | 982 | 0 | 100.0% |
| relNext | URL | 982 | 982 | 0 | 100.0% |
| relPrev | URL | 982 | 982 | 0 | 100.0% |
| httpRelNext | URL | 982 | 982 | 0 | 100.0% |
| httpRelPrev | URL | 982 | 982 | 0 | 100.0% |
| amphtml | URL | 982 | 982 | 0 | 100.0% |
| mobileAlternate | URL | 982 | 981 | 1 | 99.9% |
| language | exact | 934 | 931 | 3 | 99.7% |
| indexable | exact | 982 | 974 | 8 | 99.2% |
| indexabilityReason | exact | 982 | 968 | 14 | 98.6% |
| wordCount | ±8% (min 6) – visible text; tokenisers differ | 931 | 918 | 13 | 98.6% |
| sentenceCount | ±15% (min 2) | 931 | 918 | 13 | 98.6% |
| avgWordsPerSentence | ±20% | 794 | 788 | 6 | 99.2% |
| fleschReadingEase | ±15 points, pages ≥30 words (syllable algorithms differ) | 794 | 783 | 11 | 98.6% |
| readability | label = standard band for the crawler's own Flesch score | 814 | 814 | 0 | 100.0% |
| textRatio | ±5 points | 931 | 919 | 12 | 98.7% |
| internalLinks | exact | 982 | 965 | 17 | 98.3% |
| uniqueInternalLinks | exact | 982 | 967 | 15 | 98.5% |
| externalLinks | exact | 982 | 982 | 0 | 100.0% |
| uniqueExternalLinks | exact | 982 | 982 | 0 | 100.0% |
| imagesMissingAlt | exact | 982 | 982 | 0 | 100.0% |
| uniqueJsOutlinks | exact | 982 | 979 | 3 | 99.7% |
| uniqueExternalJsOutlinks | exact | 982 | 982 | 0 | 100.0% |
| inlinks | exact, counted only from pages present in the crawl | 982 | 974 | 8 | 99.2% |
| uniqueInlinks | exact, from crawled pages | 982 | 975 | 7 | 99.3% |
| uniqueJsInlinks | exact, from crawled pages | 982 | 981 | 1 | 99.9% |
| closestNearDuplicate | present/absent | 982 | 972 | 10 | 99.0% |
| closestNearDuplicateSimilarity | ±10 points | 982 | 972 | 10 | 99.0% |
| nearDuplicates | has near duplicates (yes/no) | 982 | 972 | 10 | 99.0% |
| error | present/absent | 982 | 979 | 3 | 99.7% |

## Mismatch examples (up to 12 per column; all in column-mismatches.csv)

### redirectUrl (11)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/status_codes/status_300` | Status 300 Multiple Choices | http://localhost:3000/redirects/redirect_target | ∅ |
| `/status_codes/status_301` | Status 301 Moved Permanently | http://localhost:3000/redirects/redirect_target | ∅ |
| `/status_codes/status_302` | Status 302 Found | http://localhost:3000/redirects/redirect_target | ∅ |
| `/status_codes/status_303` | Status 303 See Other | http://localhost:3000/redirects/redirect_target | ∅ |
| `/status_codes/status_305` | Status 305 Use Proxy | http://localhost:3000/redirects/redirect_target | ∅ |
| `/status_codes/status_306` | Status 306 Switch Proxy | http://localhost:3000/redirects/redirect_target | ∅ |
| `/status_codes/status_307` | Status 307 Temporary Redirect | http://localhost:3000/redirects/redirect_target | ∅ |
| `/status_codes/status_308` | Status 308 Permanent Redirect | http://localhost:3000/redirects/redirect_target | ∅ |
| `/links/meta_refresh` | Meta refresh (self, 5 s) | ∅ | http://localhost:3000/links/meta_refresh |
| `/links/header_refresh` | Header Refresh (self) | ∅ | http://localhost:3000/links/header_refresh |
| `/javascript/window-location-delayed` | Delayed JS redirect (2 s) | http://localhost:3000/redirects/redirect_target | ∅ |

### redirectType (11)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/status_codes/status_300` | Status 300 Multiple Choices | HTTP Redirect | ∅ |
| `/status_codes/status_301` | Status 301 Moved Permanently | HTTP Redirect | ∅ |
| `/status_codes/status_302` | Status 302 Found | HTTP Redirect | ∅ |
| `/status_codes/status_303` | Status 303 See Other | HTTP Redirect | ∅ |
| `/status_codes/status_305` | Status 305 Use Proxy | HTTP Redirect | ∅ |
| `/status_codes/status_306` | Status 306 Switch Proxy | HTTP Redirect | ∅ |
| `/status_codes/status_307` | Status 307 Temporary Redirect | HTTP Redirect | ∅ |
| `/status_codes/status_308` | Status 308 Permanent Redirect | HTTP Redirect | ∅ |
| `/links/meta_refresh` | Meta refresh (self, 5 s) | ∅ | Meta Refresh Redirect |
| `/links/header_refresh` | Header Refresh (self) | ∅ | HTTP Refresh Redirect |
| `/javascript/window-location-delayed` | Delayed JS redirect (2 s) | JavaScript Redirect | ∅ |

### status (4)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/status_codes/status_407` | Status 407 Proxy Authentication Required | 407 | 597 |
| `/status_codes/no_response` | No response (connection closed) | ∅ | 595 |
| `/content/low_text_ratio` | Low text-to-HTML ratio | 200 | ∅ |
| `/content/xhtml_content_type` | XHTML content type | 200 | ∅ |

### statusText (30)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/status_codes/status_306` | Status 306 Switch Proxy | Switch Proxy | ∅ |
| `/status_codes/status_407` | Status 407 Proxy Authentication Required | Proxy Authentication Required | Auth Failed |
| `/status_codes/status_418` | Status 418 I'm a teapot | I'm a teapot | I'm a Teapot |
| `/status_codes/status_419` | Status 419 Page Expired | Page Expired | ∅ |
| `/status_codes/status_420` | Status 420 Enhance Your Calm | Enhance Your Calm | ∅ |
| `/status_codes/status_440` | Status 440 Login Time-out | Login Time-out | ∅ |
| `/status_codes/status_444` | Status 444 No Response | No Response | ∅ |
| `/status_codes/status_449` | Status 449 Retry With | Retry With | ∅ |
| `/status_codes/status_450` | Status 450 Blocked by Windows Parental Controls | Blocked by Windows Parental Controls | ∅ |
| `/status_codes/status_494` | Status 494 Request Header Too Large | Request Header Too Large | ∅ |
| `/status_codes/status_495` | Status 495 SSL Certificate Error | SSL Certificate Error | ∅ |
| `/status_codes/status_496` | Status 496 SSL Certificate Required | SSL Certificate Required | ∅ |

### contentType (4)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/status_codes/status_407` | Status 407 Proxy Authentication Required | text/html; charset=utf-8 | text/plain; charset=utf-8 |
| `/status_codes/no_response` | No response (connection closed) | ∅ | text/plain; charset=utf-8 |
| `/content/low_text_ratio` | Low text-to-HTML ratio | text/html; charset=utf-8 | ∅ |
| `/content/xhtml_content_type` | XHTML content type | application/xhtml+xml; charset=utf-8 | ∅ |

### httpVersion (8)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/status_codes/no_response` | No response (connection closed) | ∅ | 1.1 |
| `/redirects/two_step_redirect_loop_1` | Redirect loop (2 steps) | 1.1 | ∅ |
| `/redirects/infinite_redirect` | Redirect to itself | 1.1 | ∅ |
| `/redirects/case_redirect_loop` | Case-changing redirect loop | 1.1 | ∅ |
| `/content/low_text_ratio` | Low text-to-HTML ratio | 1.1 | ∅ |
| `/content/xhtml_content_type` | XHTML content type | 1.1 | ∅ |
| `/redirects/two_step_redirect_loop_2` | Redirect loop step 2 | 1.1 | ∅ |
| `/redirects/CASE_REDIRECT_LOOP` | Case loop (uppercase) | 1.1 | ∅ |

### sizeBytes (24)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/tests/robots_protocol` | /tests/robots_protocol | 13264 | 13250 |
| `/tests/titles` | /tests/titles | 6636 | 6528 |
| `/tests/content` | /tests/content | 11387 | 11056 |
| `/tests/links` | /tests/links | 10208 | 10200 |
| `/tests/urls` | /tests/urls | 13175 | 13161 |
| `/tests/javascript` | /tests/javascript | 12771 | 12747 |
| `/tests` | /tests | 134017 | 133535 |
| `/status_codes/status_407` | Status 407 Proxy Authentication Required | 271 | 34 |
| `/status_codes/no_response` | No response (connection closed) | ∅ | 16 |
| `/titles/title_in_body` | Title in body only | 1958 | 1850 |
| `/content/low_text_ratio` | Low text-to-HTML ratio | 24264 | ∅ |
| `/content/xhtml_content_type` | XHTML content type | 392 | ∅ |

### transferredBytes (13)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/tests/titles` | /tests/titles | 1943 | 1893 |
| `/tests/content` | /tests/content | 3200 | 3090 |
| `/status_codes/status_407` | Status 407 Proxy Authentication Required | 271 | 34 |
| `/status_codes/no_response` | No response (connection closed) | ∅ | 16 |
| `/titles/title_in_body` | Title in body only | 923 | 875 |
| `/content/low_text_ratio` | Low text-to-HTML ratio | 608 | ∅ |
| `/content/xhtml_content_type` | XHTML content type | 392 | ∅ |
| `/urls/duplication_types` | Duplicated Page | 484 | 542 |
| `/urls/DUPLICATION_TYPES` | Duplicated Page | 484 | 513 |
| `/urls/duplication_types/duplication_types/` | Duplicated Page | 484 | 519 |
| `/urls/duplication_types?tracking=yes` | Duplicated Page | 484 | 542 |
| `/other/slow_ttfb_then_fast` | Slow first byte, streamed body | 157 | 198 |

### totalTransferredBytes (10)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/status_codes/status_407` | Status 407 Proxy Authentication Required | 973 | 34 |
| `/status_codes/no_response` | No response (connection closed) | ∅ | 16 |
| `/links/non_standard_links` | Non Standard Links | 1883 | 2745 |
| `/content/low_text_ratio` | Low text-to-HTML ratio | 1310 | ∅ |
| `/content/xhtml_content_type` | XHTML content type | 392 | ∅ |
| `/images/tests/broken_image` | Broken image | 1638 | 2414 |
| `/mobile/amp_no_references` | AMP only, no mobile self reference | 974 | 75170 |
| `/mobile/amp_as_desktop_amp_and_mobile` | AMP page as self referencing mobile | 1031 | 74223 |
| `/javascript/ad_script` | javascript:ad script | 1686 | 2734 |
| `/javascript/blocked_resource_content` | Content from robots-blocked JS | 1675 | 2209 |

### hash (8)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/content/low_text_ratio` | Low text-to-HTML ratio | 1 URL(s) with identical content | 0 URL(s) share this hash |
| `/content/xhtml_content_type` | XHTML content type | 1 URL(s) with identical content | 0 URL(s) share this hash |
| `/urls/duplication_types` | Duplicated Page | 5 URL(s) with identical content | 2 URL(s) share this hash |
| `/urls/DUPLICATION_TYPES` | Duplicated Page | 5 URL(s) with identical content | 1 URL(s) share this hash |
| `/urls/duplication_types/index.html` | Duplicated Page | 5 URL(s) with identical content | 1 URL(s) share this hash |
| `/urls/duplication_types/duplication_types/` | Duplicated Page | 5 URL(s) with identical content | 1 URL(s) share this hash |
| `/urls/duplication_types?tracking=yes` | Duplicated Page | 5 URL(s) with identical content | 2 URL(s) share this hash |
| `/files/sample.mp4` | Video file | 1 URL(s) with identical content | 0 URL(s) share this hash |

### cookies (1)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/redirects/redirect_with_cookie` | Redirect that sets a cookie | session | ∅ |

### title (9)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/redirects/redirect_no_location` | 301 without Location | ∅ | 301 Redirect |
| `/titles/forced_double_triple_quadruple_spaces` | Forced Double Triple Quadruple Spaces | Forced Double  Triple   Quadruple    Spaces | Forced Double Triple Quadruple Spaces |
| `/titles/title_in_body` | Title in body only | Title Placed In The Body | ∅ |
| `/content/low_text_ratio` | Low text-to-HTML ratio | Low text-to-HTML ratio | ∅ |
| `/content/no_content_type_header` | No Content-Type header | No Content-Type header | ∅ |
| `/content/xhtml_content_type` | XHTML content type | XHTML content type | ∅ |
| `/javascript/renderer_timeout/1` | Unrendered | Rendered after 1s | Unrendered |
| `/javascript/renderer_timeout/2` | Unrendered | Rendered after 3s | Unrendered |
| `/other/typo_in_head` | Typo inside head tag | Typo inside head tag | ∅ |

### titleLength (9)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/redirects/redirect_no_location` | 301 without Location | ∅ | 12 |
| `/titles/forced_double_triple_quadruple_spaces` | Forced Double Triple Quadruple Spaces | 43 | 37 |
| `/titles/title_in_body` | Title in body only | 24 | 0 |
| `/content/low_text_ratio` | Low text-to-HTML ratio | 22 | 0 |
| `/content/no_content_type_header` | No Content-Type header | 22 | 0 |
| `/content/xhtml_content_type` | XHTML content type | 18 | 0 |
| `/javascript/renderer_timeout/1` | Unrendered | 17 | 10 |
| `/javascript/renderer_timeout/2` | Unrendered | 17 | 10 |
| `/other/typo_in_head` | Typo inside head tag | 20 | 0 |

### titlePixelWidth (8)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/redirects/redirect_no_location` | 301 without Location | ∅ | 113 |
| `/titles/title_in_body` | Title in body only | 218 | 0 |
| `/content/low_text_ratio` | Low text-to-HTML ratio | 203 | 0 |
| `/content/no_content_type_header` | No Content-Type header | 220 | 0 |
| `/content/xhtml_content_type` | XHTML content type | 182 | 0 |
| `/javascript/renderer_timeout/1` | Unrendered | 160 | 105 |
| `/javascript/renderer_timeout/2` | Unrendered | 160 | 105 |
| `/other/typo_in_head` | Typo inside head tag | 186 | 0 |

### metaDescription (6)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/description_tags/description_in_body` | Description in body | ∅ | This description is in the body, which is invalid. |
| `/content/low_text_ratio` | Low text-to-HTML ratio | Low text-to-HTML ratio – Tiny amount of text inside lots of nested … | ∅ |
| `/content/no_content_type_header` | No Content-Type header | No Content-Type header – HTML page served without any Content-Type … | ∅ |
| `/content/xhtml_content_type` | XHTML content type | Well-formed XHTML page served as application/xhtml+xml. | ∅ |
| `/encoding/no_charset_declared` | No charset declared | No charset declared â No charset in header or meta; body contains… | No charset declared â€“ No charset in header or meta; body contains… |
| `/other/non_head_tag_in_head` | Non-head tag inside head tag | ∅ | Description after a div in the head |

### metaDescriptionLength (5)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/description_tags/description_in_body` | Description in body | 0 | 50 |
| `/content/low_text_ratio` | Low text-to-HTML ratio | 74 | 0 |
| `/content/no_content_type_header` | No Content-Type header | 74 | 0 |
| `/content/xhtml_content_type` | XHTML content type | 55 | 0 |
| `/other/non_head_tag_in_head` | Non-head tag inside head tag | 0 | 35 |

### metaDescriptionPixelWidth (5)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/description_tags/description_in_body` | Description in body | 0 | 294 |
| `/content/low_text_ratio` | Low text-to-HTML ratio | 459 | 0 |
| `/content/no_content_type_header` | No Content-Type header | 503 | 0 |
| `/content/xhtml_content_type` | XHTML content type | 368 | 0 |
| `/other/non_head_tag_in_head` | Non-head tag inside head tag | 0 | 213 |

### h1 (6)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/tests` | /tests | Test catalog (747 URLs) | Test catalog (746 URLs) |
| `/content/low_text_ratio` | Low text-to-HTML ratio | Low text-to-HTML ratio | ∅ |
| `/content/no_content_type_header` | No Content-Type header | No Content-Type header | ∅ |
| `/content/xhtml_content_type` | XHTML content type | XHTML content type | ∅ |
| `/javascript/renderer_timeout/1` | Unrendered | Rendered after 1s | Unrendered |
| `/javascript/renderer_timeout/2` | Unrendered | Rendered after 3s | Unrendered |

### h1Length (5)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/content/low_text_ratio` | Low text-to-HTML ratio | 22 | 0 |
| `/content/no_content_type_header` | No Content-Type header | 22 | 0 |
| `/content/xhtml_content_type` | XHTML content type | 18 | 0 |
| `/javascript/renderer_timeout/1` | Unrendered | 17 | 10 |
| `/javascript/renderer_timeout/2` | Unrendered | 17 | 10 |

### h1Second (2)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/links/non_standard_links` | Non Standard Links | ∅ | Non-standard link target: iframe_target |
| `/javascript/ad_script` | javascript:ad script | ∅ | External page /external/ad.html |

### h1SecondLength (2)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/links/non_standard_links` | Non Standard Links | 0 | 39 |
| `/javascript/ad_script` | javascript:ad script | 0 | 31 |

### h1Count (5)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/links/non_standard_links` | Non Standard Links | 1 | 2 |
| `/content/low_text_ratio` | Low text-to-HTML ratio | 1 | 0 |
| `/content/no_content_type_header` | No Content-Type header | 1 | 0 |
| `/content/xhtml_content_type` | XHTML content type | 1 | 0 |
| `/javascript/ad_script` | javascript:ad script | 1 | 2 |

### h2 (1)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/content/no_content_type_header` | No Content-Type header | About this test page | ∅ |

### h2Length (1)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/content/no_content_type_header` | No Content-Type header | 20 | 0 |

### h2Count (2)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/links/non_standard_links` | Non Standard Links | 1 | 2 |
| `/content/no_content_type_header` | No Content-Type header | 1 | 0 |

### metaRobots (3)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/robots_protocol/meta_robots_in_body` | Meta robots noindex in <body> | ∅ | noindex |
| `/javascript/noindex_removed_by_js` | Noindex removed by JS | noindex | ∅ |
| `/other/multiple_head_and_body` | Multiple <head> and <body> tags | ∅ | noindex |

### mobileAlternate (1)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/mobile/separate_desktop_response_header_alt` | Separate Desktop with Response Header Alt | http://127.0.0.1:3000/mobile/separate_desktop_response_header_alt | ∅ |

### language (3)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/content/low_text_ratio` | Low text-to-HTML ratio | en | ∅ |
| `/content/no_content_type_header` | No Content-Type header | en | ∅ |
| `/content/xhtml_content_type` | XHTML content type | en | ∅ |

### indexable (8)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/redirects/infinite_meta_redirect` | Meta refresh to itself | false | true |
| `/robots_protocol/meta_robots_in_body` | Meta robots noindex in <body> | true | false |
| `/robots_protocol/x_robots_otherbot_prefix` | X-Robots-Tag for another bot | true | false |
| `/content/low_text_ratio` | Low text-to-HTML ratio | true | false |
| `/content/xhtml_content_type` | XHTML content type | true | false |
| `/javascript/noindex_removed_by_js` | Noindex removed by JS | false | true |
| `/javascript/window-location-delayed` | Delayed JS redirect (2 s) | false | true |
| `/other/multiple_head_and_body` | Multiple <head> and <body> tags | true | false |

### indexabilityReason (14)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/status_codes/status_304` | Status 304 Not Modified | Status 304 | Redirected |
| `/status_codes/status_407` | Status 407 Proxy Authentication Required | Status 407 | Status 597 |
| `/status_codes/no_response` | No response (connection closed) | Error | Status 595 |
| `/redirects/redirect_304` | 304 Not Modified | Status 304 | Redirected |
| `/redirects/redirect_no_location` | 301 without Location | Status 301 | Redirected |
| `/redirects/redirect_empty_location` | 301 with empty Location | Status 301 | Redirected |
| `/redirects/infinite_meta_redirect` | Meta refresh to itself | Redirected | ∅ |
| `/robots_protocol/meta_robots_in_body` | Meta robots noindex in <body> | ∅ | noindex (meta) |
| `/robots_protocol/x_robots_otherbot_prefix` | X-Robots-Tag for another bot | ∅ | noindex (X-Robots-Tag) |
| `/content/low_text_ratio` | Low text-to-HTML ratio | ∅ | Error |
| `/content/xhtml_content_type` | XHTML content type | ∅ | Error |
| `/javascript/noindex_removed_by_js` | Noindex removed by JS | noindex (meta) | ∅ |

### wordCount (13)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/links/non_standard_links` | Non Standard Links | 163 | 313 |
| `/content/word_count_symbols` | Word Count - Symbols | 0 | 14 |
| `/content/word_count_hidden_text` | Word Count - Hidden text | 5 | 55 |
| `/content/low_text_ratio` | Low text-to-HTML ratio | 37 | 0 |
| `/content/no_content_type_header` | No Content-Type header | 150 | 0 |
| `/content/xhtml_content_type` | XHTML content type | 7 | 0 |
| `/urls/duplication_types` | Duplicated Page | 15 | 53 |
| `/urls/DUPLICATION_TYPES` | Duplicated Page | 15 | 40 |
| `/urls/duplication_types/index.html` | Duplicated Page | 15 | 38 |
| `/urls/duplication_types/duplication_types/` | Duplicated Page | 15 | 41 |
| `/urls/duplication_types?tracking=yes` | Duplicated Page | 15 | 53 |
| `/javascript/ad_script` | javascript:ad script | 152 | 180 |

### sentenceCount (13)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/` | / | 65 | 23 |
| `/?parameter-on-hostname-root=parameter-value` | / | 65 | 23 |
| `/?removed_parameter=1&retained_parameter=1` | / | 65 | 23 |
| `/links/non_standard_links` | Non Standard Links | 19 | 35 |
| `/content/low_text_ratio` | Low text-to-HTML ratio | 7 | 0 |
| `/content/no_content_type_header` | No Content-Type header | 16 | 0 |
| `/urls/duplication_types` | Duplicated Page | 3 | 7 |
| `/urls/DUPLICATION_TYPES` | Duplicated Page | 3 | 7 |
| `/urls/duplication_types/index.html` | Duplicated Page | 3 | 7 |
| `/urls/duplication_types/duplication_types/` | Duplicated Page | 3 | 7 |
| `/urls/duplication_types?tracking=yes` | Duplicated Page | 3 | 7 |
| `/javascript/ad_script` | javascript:ad script | 16 | 20 |

### avgWordsPerSentence (6)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/` | / | 7.446 | 19.565 |
| `/?parameter-on-hostname-root=parameter-value` | / | 7.446 | 19.565 |
| `/?removed_parameter=1&retained_parameter=1` | / | 7.446 | 19.565 |
| `/content/low_text_ratio` | Low text-to-HTML ratio | 5.286 | ∅ |
| `/content/no_content_type_header` | No Content-Type header | 9.375 | ∅ |
| `/javascript/client_side_rendered_app` | Client-side rendered app | ∅ | 7.615 |

### fleschReadingEase (11)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/` | / | 44.235 | 16.79 |
| `/tests/status_codes` | /tests/status_codes | 63.329 | 47.147 |
| `/tests/redirects` | /tests/redirects | 59.002 | 43.872 |
| `/?parameter-on-hostname-root=parameter-value` | / | 44.235 | 16.79 |
| `/?removed_parameter=1&retained_parameter=1` | / | 44.235 | 16.79 |
| `/links/max_external_links` | Max External Links | 73.406 | 29.972 |
| `/links/max_internal_links` | Max Internal Links | 80.842 | 33.991 |
| `/content/low_text_ratio` | Low text-to-HTML ratio | 75.713 | ∅ |
| `/content/no_content_type_header` | No Content-Type header | 25.299 | ∅ |
| `/javascript/dynamically-inserted-text` | javascript:dynamically inserted text | 17.974 | 33.861 |
| `/javascript/client_side_rendered_app` | Client-side rendered app | ∅ | 59.715 |

### textRatio (12)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/links/non_standard_links` | Non Standard Links | 49.523 | 93.591 |
| `/content/word_count_hidden_text` | Word Count - Hidden text | 3.306 | 48.639 |
| `/content/no_content_type_header` | No Content-Type header | 60.139 | 0 |
| `/content/xhtml_content_type` | XHTML content type | 10.204 | 0 |
| `/urls/duplication_types` | Duplicated Page | 17.975 | 32.714 |
| `/urls/DUPLICATION_TYPES` | Duplicated Page | 17.975 | 27.412 |
| `/urls/duplication_types/index.html` | Duplicated Page | 17.975 | 26.411 |
| `/urls/duplication_types/duplication_types/` | Duplicated Page | 17.975 | 28.043 |
| `/urls/duplication_types?tracking=yes` | Duplicated Page | 17.975 | 32.714 |
| `/javascript/ad_script` | javascript:ad script | 53.632 | 60.978 |
| `/javascript/blocked_resource_content` | Content from robots-blocked JS | 54.569 | 59.835 |
| `/javascript/client_side_rendered_app` | Client-side rendered app | 107.538 | 99.497 |

### internalLinks (17)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/tests/content` | /tests/content | 58 | 57 |
| `/links/non_standard_links` | Non Standard Links | 5 | 10 |
| `/links/special_scheme_links` | mailto:, tel:, javascript: and fragment links | 5 | 7 |
| `/content/low_text_ratio` | Low text-to-HTML ratio | 5 | 0 |
| `/content/no_content_type_header` | No Content-Type header | 5 | 0 |
| `/content/xhtml_content_type` | XHTML content type | 1 | 0 |
| `/urls/duplication_types` | Duplicated Page | 1 | 5 |
| `/urls/DUPLICATION_TYPES` | Duplicated Page | 1 | 5 |
| `/urls/duplication_types/index.html` | Duplicated Page | 1 | 5 |
| `/urls/duplication_types/duplication_types/` | Duplicated Page | 1 | 5 |
| `/urls/duplication_types?tracking=yes` | Duplicated Page | 1 | 5 |
| `/urls/links_to_malformed_urls` | Links to Malformed URLs | 11 | 12 |

### uniqueInternalLinks (15)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/tests/content` | /tests/content | 57 | 56 |
| `/links/special_scheme_links` | mailto:, tel:, javascript: and fragment links | 4 | 5 |
| `/content/low_text_ratio` | Low text-to-HTML ratio | 4 | 0 |
| `/content/no_content_type_header` | No Content-Type header | 4 | 0 |
| `/content/xhtml_content_type` | XHTML content type | 1 | 0 |
| `/urls/duplication_types` | Duplicated Page | 1 | 4 |
| `/urls/DUPLICATION_TYPES` | Duplicated Page | 1 | 4 |
| `/urls/duplication_types/index.html` | Duplicated Page | 1 | 4 |
| `/urls/duplication_types/duplication_types/` | Duplicated Page | 1 | 4 |
| `/urls/duplication_types?tracking=yes` | Duplicated Page | 1 | 4 |
| `/urls/links_to_malformed_urls` | Links to Malformed URLs | 10 | 11 |
| `/javascript/ajax-return-data` | javascript:make AJAX call and return data in page | 5 | 4 |

### uniqueJsOutlinks (3)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/javascript/ajax-return-data` | javascript:make AJAX call and return data in page | 1 | 0 |
| `/javascript/renderer_timeout/1` | Unrendered | 1 | 0 |
| `/javascript/renderer_timeout/2` | Unrendered | 1 | 0 |

### inlinks (8)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/` | / | 1579 | 1590 |
| `/tests/content` | /tests/content | 45 | 42 |
| `/tests/links` | /tests/links | 291 | 292 |
| `/tests/other` | /tests/other | 36 | 37 |
| `/tests` | /tests | 795 | 801 |
| `/sitemap.xml` | Sitemap index | 797 | 803 |
| `/links/base_folder/x` | Base href target | 1 | 0 |
| `/javascript/ajax_link_target` | AJAX link target | 1 | 0 |

### uniqueInlinks (7)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/` | / | 792 | 796 |
| `/tests/content` | /tests/content | 45 | 42 |
| `/tests/other` | /tests/other | 36 | 37 |
| `/tests` | /tests | 792 | 796 |
| `/sitemap.xml` | Sitemap index | 793 | 797 |
| `/links/base_folder/x` | Base href target | 1 | 0 |
| `/javascript/ajax_link_target` | AJAX link target | 1 | 0 |

### uniqueJsInlinks (1)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/javascript/ajax_link_target` | AJAX link target | 1 | 0 |

### closestNearDuplicate (10)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/redirects/redirect_target` | Redirect Target | http://localhost:3000/redirects/redirect_target?utm_source=redirect… | ∅ |
| `/content/word_count_script` | Word Count - Script | http://localhost:3000/content/word_count_hidden_text | ∅ |
| `/content/word_count_hidden_text` | Word Count - Hidden text | http://localhost:3000/content/word_count_script | ∅ |
| `/content/near_duplicate_a` | Near duplicate A | http://localhost:3000/content/near_duplicate_b | ∅ |
| `/content/near_duplicate_b` | Near duplicate B | http://localhost:3000/content/near_duplicate_a | ∅ |
| `/urls/DUPLICATION_TYPES` | Duplicated Page | http://localhost:3000/urls/duplication_types | ∅ |
| `/urls/duplication_types/index.html` | Duplicated Page | http://localhost:3000/urls/duplication_types | ∅ |
| `/urls/duplication_types/duplication_types/` | Duplicated Page | http://localhost:3000/urls/duplication_types | ∅ |
| `/urls/unlinked_paginated_page` | Unlinked Paginated Page | http://localhost:3000/urls/unlinked_paginated_page?page=2 | ∅ |
| `/pagination/http_header` | Header Paginated Page | http://localhost:3000/pagination/http_header?page=2 | ∅ |

### closestNearDuplicateSimilarity (10)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/redirects/redirect_target` | Redirect Target | 100 | ∅ |
| `/content/word_count_script` | Word Count - Script | 100 | ∅ |
| `/content/word_count_hidden_text` | Word Count - Hidden text | 100 | ∅ |
| `/content/near_duplicate_a` | Near duplicate A | 93.392 | ∅ |
| `/content/near_duplicate_b` | Near duplicate B | 93.392 | ∅ |
| `/urls/DUPLICATION_TYPES` | Duplicated Page | 100 | ∅ |
| `/urls/duplication_types/index.html` | Duplicated Page | 100 | ∅ |
| `/urls/duplication_types/duplication_types/` | Duplicated Page | 100 | ∅ |
| `/urls/unlinked_paginated_page` | Unlinked Paginated Page | 96.364 | ∅ |
| `/pagination/http_header` | Header Paginated Page | 96.104 | ∅ |

### nearDuplicates (10)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/redirects/redirect_target` | Redirect Target | 2 | 0 |
| `/content/word_count_script` | Word Count - Script | 1 | 0 |
| `/content/word_count_hidden_text` | Word Count - Hidden text | 1 | 0 |
| `/content/near_duplicate_a` | Near duplicate A | 1 | 0 |
| `/content/near_duplicate_b` | Near duplicate B | 1 | 0 |
| `/urls/DUPLICATION_TYPES` | Duplicated Page | 5 | 0 |
| `/urls/duplication_types/index.html` | Duplicated Page | 5 | 0 |
| `/urls/duplication_types/duplication_types/` | Duplicated Page | 5 | 0 |
| `/urls/unlinked_paginated_page` | Unlinked Paginated Page | 4 | 0 |
| `/pagination/http_header` | Header Paginated Page | 4 | 0 |

### error (3)

| URL | Test | Expected | Crawl |
|---|---|---|---|
| `/status_codes/no_response` | No response (connection closed) | No response | ∅ |
| `/content/low_text_ratio` | Low text-to-HTML ratio | ∅ | page.evaluate: Target crashed |
| `/content/xhtml_content_type` | XHTML content type | ∅ | page.evaluate: TypeError: Cannot read properties of null (reading '… |

