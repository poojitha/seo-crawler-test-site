# Action Plan: Local SEO Crawler Test Site

## 1. What the CSV is

`internal_all.csv` is a Screaming Frog **Internal → All** export of a crawl of
`crawler-test.com`, a public site built to test SEO crawlers. It holds 491 URLs and 80 columns.

| Signal in the CSV | Count | Covered here by |
|---|---|---|
| Status codes 200–599 (incl. non-standard 419/420/440/444/449/450/494–499/520/598/599) | 74 distinct codes | `/status_codes/status_NNN` |
| "Blocked by robots.txt" (status 0) | 24 | generated `robots.txt` + blocked pages |
| Redirected (HTTP, Meta Refresh, HTTP Refresh) | 25 | `/redirects/*` |
| Canonicalised | 70 | `/canonical_tags/*`, `/mobile/*`, `/urls/duplicate_page/*` |
| noindex (meta + X-Robots-Tag) | 20 | `/robots_protocol/*` |
| Client / Server errors | 54 / 16 | status pages, broken links, broken resources |
| Title 2, Meta Description 2, H1-2 (multiples) | several | `/titles/*`, `/content/*` |
| rel=next/prev, amphtml, mobile alternate | several | `/urls/paginated_*`, `/mobile/*` |
| Non-ASCII, double-encoded, spaces, `//` URLs | many | `/encoding/*`, `/urls/*`, `/url/*` |
| Content types: CSS, JS, JPEG, PDF, SWF, malformed `abc/xyz`, `charset=utf-6` | 10 types | `/resources`, `/content/header_content_type_malformed`, `/encoding/invalid_charset_header` |

Every URL pattern in the CSV is rebuilt locally. On top of that the site adds tests that
crawlers check today but the CSV does not cover: images, structured data, hreflang errors,
XML sitemaps, security headers, JS rendering differences and crawl traps.

## 2. Architecture decisions

| Decision | Why |
|---|---|
| **Node.js, zero dependencies** (plain `http` module) | Express and similar frameworks normalise URLs and block "invalid" responses. Plain `http` can send any status code, raw `//` paths, malformed Content-Type headers, missing headers, truncated bodies and dropped connections. |
| **Route registry** (`src/registry.js`) | Each test is declared once with *what it tests* and *what the crawler should report*. The hubs, the `/tests` catalog, the XML sitemaps, `PAGES.md` and `expected-results.csv` are all generated from it. |
| **Two hostnames on one server** | `localhost:3000` is the site being crawled. `127.0.0.1:3000` stands in for "another domain": external links, the m-dot mobile site, cross-host canonicals and redirects. No internet connection is needed, except for two links to example.com. |
| **Crawl depth by design** | Home (depth 0) → category hub (depth 1) → test page (depth 2). Deep chains (`/depth/1…15`) and orphan pages (sitemap only) are kept out of the hubs. |
| **Unique auto copy** | Every page gets a unique title, description and about 110 words of generated text, so only the intended issue shows up on each page. Tests that need exact control (word counts, duplicates) switch this off. |

## 3. Build phases

| # | Phase | Status |
|---|---|---|
| 1 | Analyse the CSV: group the URLs by folder and map each column to a test category | ✅ |
| 2 | Core server: raw URL parsing, gzip, any status/reason phrase, HEAD support, request log | ✅ |
| 3 | Site chrome: home, 21 category hubs, `/tests` catalog, `/tests.json`, custom 404 | ✅ |
| 4 | Status codes, redirects (chains, loops, meta/HTTP refresh) | ✅ |
| 5 | robots.txt (precedence, wildcards, `$`, UA groups), meta robots, X-Robots-Tag | ✅ |
| 6 | Canonicals (HTML/header, conflicts, chains, loops, normalisation) | ✅ |
| 7 | Titles, descriptions, headings, content, word counts, duplicates, forms | ✅ |
| 8 | Links, URL structure, encoding, hreflang, pagination | ✅ |
| 9 | Mobile/AMP (responsive, dynamic, m-dot, AMP), JavaScript rendering | ✅ |
| 10 | Images, social tags, structured data, headers/security/auth, speed | ✅ |
| 11 | XML sitemaps (index, images, hreflang, gzip, malformed, problem URLs) | ✅ |
| 12 | Self-test (`npm run check`) and page list export (`npm run pages`) | ✅ |
| 13 | **Your step:** crawl with Screaming Frog and compare with `expected-results.csv` | ⏳ |

## 4. Test categories (746 URLs)

The full list of URLs with expected results is in [PAGES.md](PAGES.md), and at `/tests` while the server runs.

| Category | URLs | Highlights |
|---|---|---|
| HTTP Status Codes | 88 | every code from the CSV + 52x Cloudflare codes, no-response, mid-body reset, 65 s timeout, empty 200 |
| Redirects | 61 | 300–308, 2/3/6-hop chains, loops (self, 2-step, case), to 404/500/PDF/noindex, relative/protocol-relative Location, no Location, meta refresh chains, Refresh header |
| Robots Directives | 54 | robots.txt longest-match and tie rules, `*` and `$`, case sensitivity, UA-specific groups, unsupported `Noindex:`, meta and X-Robots-Tag variants and conflicts |
| Canonicals | 77 | 24 pages canonicalised to `/`, HTML vs header conflict, multiple canonicals, outside head, relative, external, to blocked/redirect/404/noindex, chains, loops, case/port/trailing dot/encoding normalisation, PDF canonical |
| Page Titles | 28 | missing, empty, duplicate (+noindex), long/wide/narrow, whitespace, nbsp, SVG-only, in body, multiple, entities, emoji |
| Meta Descriptions | 18 | missing, empty, long, short, duplicate (+noindex), whitespace, http-equiv, multiple, in body, uppercase |
| Content & Headings | 52 | no/multiple/empty/long H1, H2s, word counts (hyphen/number/symbols/script/hidden/CJK), low content, soft 404, exact and near duplicates, readability, spelling, custom search/extraction, malformed content types, insecure forms |
| Images | 13 | missing/empty/long alt, >100 KB, broken, missing dimensions, lazy loading, srcset/picture, CSS background, data URI |
| Links | 47 | broken internal/external, nofollow/ugc/sponsored, relative/base/protocol-relative, quote variations, whitespace, image links, anchor text issues, non-standard links (area/iframe/data-href/onclick), mailto/tel/js, 150 external and 250 internal outlinks |
| URL Structure | 52 | duplicate variants (case, slash, index.html, params), parameters, session IDs, fragments, spaces, uppercase, underscores, very long URLs, `//`, malformed links, non-HTML file types |
| Encoding | 17 | 9 scripts of non-ASCII URLs, double encoding, `%23`, charset conflicts, invalid charset, Latin-1 body, BOM |
| Hreflang | 24 | valid reciprocal set, missing return links, invalid codes, missing self/x-default, HTTP header, sitemap hreflang, relative URLs, outside head, to non-200/non-canonical |
| Pagination | 8 | rel next/prev in HTML and headers, noindexed series, unlinked series, canonical to page 1, broken sequence |
| Mobile & AMP | 32 | responsive, no viewport, dynamic serving (Vary), m-dot with title/H1/word-count/link mismatches, header alternate, AMP pairings, invalid AMP |
| JavaScript Rendering | 56 | JS-inserted text/links/canonical/noindex, title changes, AJAX, pushState, render timeouts 1–12 s, JS redirects, dialogs, blocked JS/CSS, CSR app, shadow DOM, console errors |
| Social Tags | 12 | complete OG, OG-only, Twitter cards, too long, missing, broken/relative og:image, wrong attribute |
| Structured Data | 13 | valid Product, syntax error, missing required, unknown type, @graph, FAQ, in body, Microdata, RDFa |
| Other | 38 | broken head parsing, comments, tag soup, language conflicts, security headers, cookies, cache headers, gzip off, basic auth, UA/IP/header echo, cloaking, slow pages, expiring page |
| Crawl Depth | 26 | folder depth 4–7, 15-step click chain, orphan pages, infinite space (blocked), calendar trap, relative link loop |
| Resources | 21 | CSS/JS, case-sensitive JPG/PDF/SWF, large BMP, PDF with link + noindex PDF, txt/csv/zip/json/xml/docx/mp4, wrong content type |
| XML Sitemaps | 9 | index, pages, images, hreflang, problem URLs, gzip, malformed, missing child, text sitemap |

## 5. Next steps

1. `npm start`, then crawl `http://localhost:3000/` in Screaming Frog with default settings.
2. Crawl again with **JavaScript rendering** on, then compare the JavaScript tab with the first crawl.
3. Turn on **Crawl Linked XML Sitemaps** to surface orphan pages and the sitemap issues.
4. Open `expected-results.csv` next to the Screaming Frog export and tick off each category.
5. To add a test, add one line in the matching `src/routes/*.js` file, then run `npm run pages`.
