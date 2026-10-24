// SEO crawler test site – zero-dependency Node.js server.
// The plain http module is used on purpose: it lets us send any status code,
// malformed headers, raw paths with double slashes, and so on.

const http = require('http');
const zlib = require('zlib');
const { PORT, ORIGIN, ALT_ORIGIN, ALT_HOST } = require('./src/config');
const registry = require('./src/registry');
require('./src/routes');

function parseUrl(raw) {
  const i = raw.indexOf('?');
  const rawPath = i < 0 ? raw : raw.slice(0, i);
  const search = i < 0 ? '' : raw.slice(i + 1);
  let path = rawPath;
  try {
    path = decodeURIComponent(rawPath);
  } catch {
    // malformed escape sequence – keep the raw path
  }
  return { rawPath, path, search, query: new URLSearchParams(search) };
}

const COMPRESSIBLE = /^(text\/|application\/(javascript|json|xml|xhtml))/;

function send(req, res, out) {
  const status = out.status || 200;
  const headers = { ...out.headers };
  // Content-Type: undefined -> default HTML, null -> send no Content-Type at all.
  if (!Object.keys(headers).some((h) => h.toLowerCase() === 'content-type')) {
    headers['Content-Type'] = 'text/html; charset=utf-8';
  }
  for (const k of Object.keys(headers)) if (headers[k] === null) delete headers[k];

  let body = status === 204 || status === 304 ? Buffer.alloc(0) : Buffer.from(out.body || '');
  const type = String(headers['Content-Type'] || '');
  const gzip =
    out.gzip !== false &&
    body.length > 512 &&
    COMPRESSIBLE.test(type) &&
    /\bgzip\b/.test(req.headers['accept-encoding'] || '');
  if (gzip) {
    body = zlib.gzipSync(body);
    headers['Content-Encoding'] = 'gzip';
    headers.Vary = headers.Vary ? headers.Vary + ', Accept-Encoding' : 'Accept-Encoding';
  }
  if (status !== 204 && status !== 304) headers['Content-Length'] = body.length;

  try {
    res.writeHead(status, out.reason || http.STATUS_CODES[status] || 'Unknown', headers);
  } catch (e) {
    console.error('Bad response headers for', req.url, e.message);
    res.writeHead(500);
    return res.end('Bad headers');
  }
  res.end(req.method === 'HEAD' ? undefined : body);
}

const server = http.createServer(async (req, res) => {
  const t0 = Date.now();
  const u = parseUrl(req.url);
  const hostname = String(req.headers.host || '').replace(/:\d+$/, '').toLowerCase();
  const ctx = { req, res, ...u, url: req.url, alt: hostname === ALT_HOST, origin: ORIGIN, altOrigin: ALT_ORIGIN };

  let out;
  try {
    const route = registry.match(u.rawPath, u.path);
    out = route ? await route.handler(ctx, route) : registry.match('/__404', '/__404').handler(ctx);
  } catch (e) {
    console.error(e);
    out = { status: 500, body: 'Internal server error' };
  }
  // A handler that wrote/destroyed the response itself returns undefined.
  if (out !== undefined && !res.headersSent && !res.destroyed) send(req, res, out);

  if (!process.env.QUIET && !req.headers['x-stats-scan']) {
    const ua = String(req.headers['user-agent'] || '-').slice(0, 40);
    console.log(`${res.statusCode} ${req.method} ${hostname} ${req.url}  ${Date.now() - t0}ms  [${ua}]`);
  }
});

server.listen(PORT, () => {
  const count = registry.tests().length;
  console.log(`\nSEO crawler test site running with ${count} test URLs`);
  console.log(`  Start crawl at:  ${ORIGIN}/`);
  console.log(`  Test catalog:    ${ORIGIN}/tests`);
  console.log(`  "Other domain":  ${ALT_ORIGIN}/ (external links, m-dot mobile site)\n`);
});
