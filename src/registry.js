// Route registry. Every test page registers itself here with metadata
// (category, what it tests, what a crawler should report). The hubs, the
// catalog, the sitemaps and the exported page list are all generated from it.

const CATS = [
  ['status_codes', 'HTTP Status Codes', 'Every 2xx/3xx/4xx/5xx response code, plus no-response and timeouts.'],
  ['redirects', 'Redirects', '301/302/307/308 chains, loops, meta refresh, HTTP Refresh header, external and broken redirects.'],
  ['robots_protocol', 'Robots Directives', 'robots.txt Allow/Disallow precedence, meta robots, X-Robots-Tag and conflicts.'],
  ['canonical_tags', 'Canonicals', 'rel=canonical in HTML and HTTP headers, conflicts, relative URLs, normalisation edge cases.'],
  ['titles', 'Page Titles', 'Missing, empty, duplicate, too long, too wide, whitespace and multiple titles.'],
  ['description_tags', 'Meta Descriptions', 'Missing, duplicate, too long/short, whitespace, http-equiv and multiple descriptions.'],
  ['content', 'Content & Headings', 'H1/H2 issues, word counts, duplicates, soft 404s, content types, insecure forms.'],
  ['images', 'Images', 'Missing/empty/long alt text, large images, broken images, missing dimensions, lazy loading.'],
  ['links', 'Links', 'Broken links, nofollow, relative/base links, quote variations, anchors, non-standard links.'],
  ['urls', 'URL Structure', 'Parameters, duplicates, case, slashes, spaces, session IDs, malformed and long URLs.'],
  ['encoding', 'Encoding', 'Non-ASCII URLs, double encoding, inconsistent charsets, encoded characters in titles.'],
  ['hreflang', 'Hreflang', 'Reciprocal sets, missing return links, invalid codes, header/sitemap hreflang.'],
  ['pagination', 'Pagination', 'rel=next/prev in HTML and headers, noindexed and unlinked paginated series.'],
  ['mobile', 'Mobile & AMP', 'Responsive, dynamic serving, separate m-dot URLs, AMP pairings and mismatches.'],
  ['javascript', 'JavaScript Rendering', 'Content, links, titles and directives that only exist after JS runs.'],
  ['social_tags', 'Social Tags', 'Open Graph and Twitter Card tags: complete, missing, too long, broken images.'],
  ['structured_data', 'Structured Data', 'JSON-LD, Microdata and RDFa: valid, invalid syntax, missing required properties.'],
  ['other', 'Other / Head & Headers', 'Broken <head> parsing, security headers, cookies, auth, crawler fingerprinting, slow pages.'],
  ['depth', 'Crawl Depth & Architecture', 'Deep folders, long click paths, orphan pages and crawl traps.'],
  ['resources', 'Resources & Files', 'CSS/JS/images/PDF/SWF, case-sensitive files, broken and blocked resources.'],
  ['sitemaps', 'XML Sitemaps', 'Sitemap index, image/hreflang sitemaps, gzip, non-indexable and orphan URLs in sitemaps.'],
];
const CAT_LABEL = Object.fromEntries(CATS.map(([k, v]) => [k, v]));

const routes = new Map();
const prefixes = [];
const all = [];

// Encode a decoded path into an href (unicode -> %XX, % -> %25, space -> %20).
function encodePath(p) {
  return encodeURI(p).replace(/#/g, '%23');
}

function add(def) {
  if (!def.path) throw new Error('route without path');
  if (!def.cat) throw new Error('route without category: ' + def.path);
  def.listed = def.listed !== false;
  def.href = def.href || encodePath(def.path);
  if (def.page && !def.handler) {
    const p = def.page;
    def.handler = (ctx) => {
      const { render } = require('./html');
      const opts = typeof p === 'function' ? p(ctx) : p;
      return render({ cat: def.cat, path: def.path, title: def.title, test: def.test, expect: def.expect, ...opts });
    };
  }
  if (!def.handler) throw new Error('route without handler: ' + def.path);
  if (def.prefix) {
    prefixes.push(def);
    prefixes.sort((a, b) => b.path.length - a.path.length);
  } else {
    if (routes.has(def.path)) throw new Error('duplicate route: ' + def.path);
    routes.set(def.path, def);
  }
  all.push(def);
  return def;
}

// group('titles') -> t(path, title, test, expect, pageOptions, extraRouteFields)
function group(cat) {
  return (path, title, test, expect, page = {}, extra = {}) =>
    add({ cat, path, title, test, expect, page, ...extra });
}

function match(rawPath, path) {
  const exact = routes.get(path) || routes.get(rawPath);
  if (exact) return exact;
  return prefixes.find((r) => path.startsWith(r.path)) || null;
}

// Tests shown in hubs/catalog (site chrome pages have cat "_site").
function tests() {
  return all.filter((r) => r.cat !== '_site');
}

module.exports = { CATS, CAT_LABEL, add, group, match, tests, all, encodePath };
