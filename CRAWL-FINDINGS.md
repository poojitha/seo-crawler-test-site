# Crawl findings: `crawl.csv` vs the site

Every column of `crawl.csv` was checked against `expected-results.csv`, which was produced by
`npm run expected` (an independent reference crawler that implements browser parsing rules and the
SEO conventions listed at the end of this file). Rerun the check at any time with `npm run compare -- crawl.csv`.

**Result:** 64,322 of 64,680 compared cells match (**99.4%**) across the 982 URLs present in both files.
The 358 mismatches fall into three groups:

- **A. Crawler bugs and gaps:** fix these in the crawler.
- **B. Site changes made after this crawl:** they disappear on a re-crawl.
- **C. Convention differences:** neither side is wrong; the conventions are documented below.

## A. Crawler bugs and gaps

### Discovery and coverage

| # | Finding | Evidence |
|---|---|---|
| A1 | Robots-blocked URLs are dropped instead of being listed as non-indexable "Blocked by robots.txt" | 34 URLs, e.g. `/robots_protocol/robots_excluded_3`, `/urls/double_slash//one` |
| A2 | The **trailing slash is stripped**, so distinct URLs are never fetched | `/urls/duplication_types/`, `/redirects/trailing_slash/` (redirect target), `/urls/url_with_fragment/` |
| A3 | A redirect to another host loses the redirecting row | `/redirects/external_redirect`, `external_redirect_local`, `external_redirect_chain1/2` |
| A4 | Stops at click depth 10 (probably a setting) | `/depth/10`–`/depth/15`, `/traps/calendar?m=9…36` |
| A5 | Doesn't follow canonical, hreflang, AMP, mobile-alternate, rel=next/prev, `<link>` in head, `<area>`, `<iframe>` or XML sitemaps | ~55 URLs; see `coverage-report.md` → "Discovered via" |

### HTTP layer

| # | Finding | Evidence |
|---|---|---|
| A6 | `statusText` comes from a lookup table, not from the response | empty for 25 non-standard codes (419, 420, 440, 444, 449, 450, 494–499, 52x, 530, 598, 599) and 306; "I'm a Teapot" instead of "I'm a teapot"; "OK" instead of the custom "Everything Is Fine" |
| A7 | Synthetic browser codes replace real responses | `status_407` → `597 Auth Failed` (34 bytes, text/plain); `no_response` → `595` with a fake text/plain body instead of an error |
| A8 | 3xx without a usable Location is reported as "Redirected" | `status_304`, `redirect_304`, `redirect_no_location`, `redirect_empty_location` should be `Status 30x` |
| A9 | `sizeBytes` is the decoded text re-encoded as UTF-8, not the bytes on the wire | `latin1_page` 435 vs 428, `utf8_bom` 1590 vs 1593 (BOM dropped), `invalid_charset_header` 1939 vs 1926 |
| A10 | Cookies set on redirect responses aren't recorded | `/redirects/redirect_with_cookie` |
| A11 | `httpVersion` is empty on redirect-loop rows | `two_step_redirect_loop_1/2`, `infinite_redirect`, `case_redirect_loop` |
| A12 | An HTML page without a Content-Type header isn't parsed (browsers sniff it as HTML) | `/content/no_content_type_header`: no title, H1 or links |

### Directives and indexability

| # | Finding | Evidence |
|---|---|---|
| A13 | `X-Robots-Tag: otherbot: noindex` is applied, although it targets another bot | `/robots_protocol/x_robots_otherbot_prefix` reported noindex |
| A14 | Meta tags outside `<head>` are honoured | description in body, description after a `<div>` that closes head, robots noindex in body, noindex in a second `<head>` inside body |
| A15 | Only the rendered DOM is used, so a raw `noindex` that JS removes is missed (Google keeps the raw noindex) | `/javascript/noindex_removed_by_js` reported indexable |
| A16 | Self-refresh after 5 s is reported as a redirect, but a 0 s self meta-refresh loop isn't | `/links/meta_refresh`, `/links/header_refresh` vs `/redirects/infinite_meta_redirect` |
| A17 | A mobile alternate sent in the HTTP Link header isn't read | `/mobile/separate_desktop_response_header_alt` |

### Rendering

| # | Finding | Evidence |
|---|---|---|
| A18 | **Doesn't wait after the load event**, so timers never run | `renderer_timeout/1` (1 s) and `/2` (3 s) still "Unrendered"; the 2 s JS redirect `window-location-delayed` is missed; the AJAX link isn't recorded as a JS outlink or inlink |
| A19 | **Iframe content is merged into the parent page** | `/links/non_standard_links` and `/javascript/ad_script`: a second H1 from the iframe, words ×2, extra links |
| A20 | **JS blocked by robots.txt is executed anyway** | `/javascript/blocked_resource_content`: injected text counted (+25 words) |
| A21 | Crashes and timeouts | `/content/low_text_ratio` "Target crashed" (300 nested divs); `/files/sample.mp4` opened in the browser until timeout (non-HTML shouldn't be rendered); XHTML page → `querySelectorAll` on null |

### Content

| # | Finding | Evidence |
|---|---|---|
| A22 | Word count uses textContent, not visible text | `word_count_hidden_text` 55 (expected 5); SVG and body `<title>` text counted |
| A23 | Symbol-only tokens are counted as words | `word_count_symbols` 14 (expected 0) |
| A24 | Non-breaking spaces in titles are collapsed (`document.title` keeps them) | `/titles/forced_double_triple_quadruple_spaces` length 37 vs 43 |
| A25 | Near duplicates missed | the designed pair `/content/near_duplicate_a`/`_b` (93% similar), parameter copies of `/redirects/redirect_target`, `word_count_script` vs `word_count_hidden_text` |

## B. Site changes made after this crawl (they clear on re-crawl)

| Change | Rows affected |
|---|---|
| `/status_codes/status_30x` now actually send `Location` (bug fixed in `src/routes/status.js`) | 8 status pages: redirectUrl/redirectType |
| Duplicate URL variants made byte-identical | 5 `/urls/duplication_types*` rows: size, hash, word count, links, near duplicates |
| `/content/xhtml_content_type` made well-formed; `/content/xhtml_malformed` added | xhtml row; `/tests/content` and catalog sizes and links |
| Test descriptions edited (shadow DOM, title in body, robots, double slash) | small `sizeBytes` differences on hubs, `/tests`, `/tests.json`, the sitemap |

## C. Convention differences (documented, not bugs)

| Topic | Convention used in `expected-results.csv` | Crawler behaviour |
|---|---|---|
| Fragment-only (`#`, `#!/…`) and empty `href=""` links | not counted as internal links | counted as self links (`special_scheme_links`, `hash_routing_links`, `links_to_malformed_urls`) |
| `<title>` outside `<head>` | `document.title` (the browser value) | head-only (`title_in_body`, `typo_in_head`) |
| Sentence count / Flesch | `.!?` and block-element boundaries; standard syllable heuristic; clamped 0–100 | close on normal pages; differs on the home page and link-list pages |
| Total transferred bytes | first-party resources that loaded with 2xx | also counts third-party AMP JS and failed (404) resources |
| `transferredBytes` of a chunked response | body bytes only | includes chunk framing (`slow_ttfb_then_fast`) |

Not compared: `crawlTimestamp`, `co2Mg`, `carbonRating`, `percentOfTotal` and `linkScore`, because these come from the crawler's own models.

### Reference rules used by `npm run expected`

- **Crawl permission:** robots.txt `*` group, Google longest-match rules (ties go to Allow; `*` and `$` supported).
- **Indexing directives (Google's view):** `meta robots` + `meta googlebot`; `X-Robots-Tag` without a prefix or with `googlebot:`.
- **Precedence:** blocked → error → redirect → non-2xx status → meta noindex → X-Robots noindex → canonicalised.
- **Head elements:** only count while `<head>` is open, using HTML5 implicit closing (any body element or text closes it).
- **JavaScript:** effects are declared per test in `src/routes/javascript.js` (`JS_EFFECTS`), based on a renderer with about a 5 s wait that respects robots.txt.
- **Text and links:**
  - Word count: visible text (no `display:none`, script, style or template).
  - Pixel widths: Arial 20 px for titles, 14 px for descriptions.
  - Inlinks: only from pages present in the crawl, excluding self-links.
- **Click depth:** links, JavaScript links and redirects only; URLs found any other way take the depth of that edge.
