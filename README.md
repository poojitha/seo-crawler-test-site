# SEO Crawler Test Site (local)

A local website with **746 technical SEO test URLs**, modelled on the crawler-test.com crawl in
`internal_all.csv`. Use it to test Screaming Frog, Sitebulb or your own crawler. It needs Node.js only: no dependencies and no database.

- [ACTION_PLAN.md](ACTION_PLAN.md): analysis, architecture and test categories
- [PAGES.md](PAGES.md): every URL with what it tests and the expected crawler result
- `expected-results.csv`: the expected value of **every column** for every URL, in the same column layout as `crawl.csv`
- [CRAWL-FINDINGS.md](CRAWL-FINDINGS.md): column-by-column review of the last crawl

## Run it

Requires Node.js 18 or newer (`node -v`).

```bash
npm start            # http://localhost:3000/
npm run dev          # same, restarts automatically when files change
npm run check        # self-test: requests every URL and reports crashes
npm run pages        # regenerate PAGES.md
npm run expected     # reference crawl -> expected-results.csv (+ expected-links.json)
npm run compare -- crawl.csv   # check a crawl export column by column
```

### Checking a crawl

1. `npm run expected` runs an independent reference crawler (no dependencies) and writes
   `expected-results.csv`: one row per URL a complete crawler should discover, with the 72 columns of
   `crawl.csv` in the same order, plus `category`, `testTitle`, `test`, `expect`, `discoveredVia` and
   `linkedFromHub`. A `*` value means "any value" (pages that echo the crawler's user agent or IP).
2. Crawl the site with your crawler and export the CSV.
3. `npm run compare -- crawl.csv` writes:
   - `coverage-report.md`: missing URLs grouped by how they should have been found, then a match rate per column with the rule used and mismatch examples.
   - `column-mismatches.csv`: every mismatching cell (column, URL, test, expected, actual).

Regenerate `expected-results.csv` whenever you change the site. The rules the reference crawler
follows are listed at the end of [CRAWL-FINDINGS.md](CRAWL-FINDINGS.md).

To use another port, set `PORT` before starting:

```powershell
$env:PORT=8080; npm start          # PowerShell
```
```bash
PORT=8080 npm start                # bash / Git Bash
```

The console logs every request with status, host, URL, time and user agent, so you can watch the crawler work.

| URL | What it is |
|---|---|
| `http://localhost:3000/` | Start URL for the crawl |
| `http://localhost:3000/tests` | Catalog of all tests with expected results |
| `http://localhost:3000/tests/<category>` | One hub per category |
| `http://localhost:3000/robots.txt` | Generated robots.txt |
| `http://localhost:3000/sitemap.xml` | Sitemap index |
| `http://127.0.0.1:3000/` | The same server under a different host, standing in for an external domain and the m-dot mobile site |

## Crawling it with Screaming Frog

1. **Mode: Spider**. Enter `http://localhost:3000/` and press Start.
2. Suggested passes, each showing a different set of tests:

| Pass | Configuration change | What it reveals |
|---|---|---|
| A. Default | none | status codes, redirects, robots.txt blocks, canonicals, titles, descriptions, H1/H2, directives, hreflang, pagination, AMP, mobile alternates |
| B. Sitemaps | *Config → Spider → Crawl → Crawl Linked XML Sitemaps* + auto-discover via robots.txt | orphan pages, non-indexable URLs in sitemaps, sitemap hreflang, malformed and missing sitemaps |
| C. JavaScript | *Config → Spider → Rendering → JavaScript* (try AJAX timeout 5 s, then 15 s) | `/javascript/*`: JS-only links, titles, canonicals, noindex, render timeouts, blocked resources |
| D. Ignore robots | *Config → robots.txt → Ignore robots.txt* | contents of the blocked pages (e.g. noindex hidden behind Disallow) |
| E. Googlebot UA | *Config → User-Agent → Googlebot (Smartphone)* | Googlebot-only robots group, cloaking page, dynamic serving at `/mobile/dynamic` |
| F. Auth | *Config → Authentication → Standards Based*, user `test`, password `test` | `/other/basic_auth` and the page behind it |
| G. Nofollow | *Config → Spider → Crawl → Follow internal "nofollow"* on/off | `/links/nofollow_target`, `/robots_protocol/only_linked_from_nofollow_page` |
| H. Extras | *Config → Spider → Extraction*: Structured Data (JSON-LD/Microdata/RDFa + validation), Spelling & Grammar; *Custom Search* `crawler-custom-search-string`; *Custom Extraction* `.price`, `#sku` | structured data, spelling, custom search and extraction tests |

3. Export **Internal → All** and compare it with `expected-results.csv` (both list one URL per row).

**Crawl traps:** `/infinite/` is blocked by robots.txt and stays safe unless you ignore robots.txt.
`/traps/calendar` (36 pages) and `/traps/relative_loop/` (10 levels) are capped, so even an
unrestricted crawl finishes.

## Known local limitations

- **No HTTPS.** HTTP→HTTPS redirects, mixed content and real HSTS cannot be tested over plain
  `http://localhost`. The HSTS header and `https://` canonical tests are still present.
- **Ports.** The port-80 canonical tests point at `:80` and `:8080`, which differ from the `:3000` origin.
- **Subdomains.** `m.` subdomains would need hosts-file edits, so the "m-dot" site uses
  `127.0.0.1` instead. To change the host names, set `HOST` and `ALT_HOST`, e.g. after adding `m.test.local` to your hosts file.
- Two links go to the real internet (`example.com` and a `.invalid` domain) to test true external and DNS failures.

## Project layout

```
server.js               HTTP server: raw URL parsing, gzip, any status code
src/config.js           PORT / HOST / ALT_HOST
src/registry.js         test registry + categories (drives hubs, catalog, sitemaps, exports)
src/html.js             page builder and helpers
src/assets.js           generated binaries (JPEG, GIF, BMP, PDF)
src/routes/*.js         one file per area: status, redirects, robots, canonical, titles,
                        content (+images/social/structured data), links, urls (+encoding,
                        hreflang, pagination, depth), mobile, javascript, other, sitemaps
scripts/selftest.js     npm run check
scripts/export.js       npm run pages (PAGES.md)
scripts/expected.js     npm run expected (reference crawler → expected-results.csv)
scripts/compare.js      npm run compare -- crawl.csv
scripts/lib/parse.js    HTML5-style parser, text stats, pixel widths, robots.txt matcher
```

### Adding a test

```js
// in src/routes/titles.js
t('/titles/my_new_case', 'My Title', 'What this tests.', 'What the crawler should report.', {
  description: null,           // render options: title, description, h1, robots, canonical,
  head: '<meta name="x" content="y">', // head, body, headers, status, chrome, filler…
});
```

Restart the server (or use `npm run dev`). The new page appears in its hub, the catalog and the sitemap automatically.
