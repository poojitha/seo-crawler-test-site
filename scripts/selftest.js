// Starts the server on a spare port, requests every test URL and reports crashes,
// bad headers and unexpected status classes. Usage: npm run check
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const PORT = 3999;
process.env.PORT = PORT;
require('../src/routes');
const { tests } = require('../src/registry');

const SLOW = /timeout|slow_5s|page_load_time|slow_ttfb|no_response|connection_reset|renderer/;

function get(href) {
  return new Promise((resolve) => {
    const p = href.startsWith('http') ? href.replace(/^http:\/\/[^/]+/, '') : href;
    const req = http.request({ host: 'localhost', port: PORT, path: p, method: 'GET', headers: { 'User-Agent': 'selftest' } }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', (e) => resolve({ status: 0, error: e.message }));
    req.setTimeout(10000, () => req.destroy(new Error('timeout')));
    req.end();
  });
}

(async () => {
  const server = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], { env: { ...process.env, PORT, QUIET: '1' }, stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((r) => server.stdout.once('data', r));
  const problems = [];
  const counts = {};
  for (const r of tests().filter((r) => !SLOW.test(r.path))) {
    const res = await get(r.href);
    counts[res.status] = (counts[res.status] || 0) + 1;
    if (res.error) problems.push(`${r.href} -> ${res.error}`);
    else if (res.body === 'Internal server error' || res.body === 'Bad headers') problems.push(`${r.href} -> server crashed (${res.body})`);
    else if (res.status === 404 && r.listed && !/404|does_not_exist|non_200|status_404|canonicalised_with_non_200/.test(r.path + r.expect)) problems.push(`${r.href} -> unexpected 404`);
  }
  server.kill();
  console.log('Status code counts:', counts);
  if (problems.length) {
    console.log(`\n${problems.length} problem(s):\n` + problems.join('\n'));
    process.exit(1);
  }
  console.log('\nAll URLs responded without crashes.');
})();
