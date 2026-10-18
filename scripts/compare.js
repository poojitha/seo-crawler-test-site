// Compares a crawl export with expected-results.csv, row by row and column by column.
// Usage: npm run compare -- crawl.csv
// Writes coverage-report.md (summary + examples) and column-mismatches.csv (every mismatch).
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const file = process.argv[2];
const expFile = path.join(root, 'expected-results.csv');
if (!file) { console.error('Usage: npm run compare -- <crawl.csv>'); process.exit(1); }
if (!fs.existsSync(expFile)) { console.error('expected-results.csv missing – run: npm run expected'); process.exit(1); }

function parseCsv(s) {
  s = s.replace(/^﻿/, '');
  const rows = [];
  let r = [], f = '', q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"') { if (s[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { r.push(f); f = ''; }
    else if (c === '\n') { r.push(f); rows.push(r); r = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f || r.length) { r.push(f); rows.push(r); }
  const h = rows[0];
  return { header: h, rows: rows.slice(1).filter((x) => x.length > 1).map((x) => Object.fromEntries(h.map((k, i) => [k, x[i] ?? '']))) };
}
const dec = (s) => { try { return decodeURI(s); } catch { return s; } };
// spaces are encoded first so a trailing space in a path is not trimmed away by the URL parser
const normUrl = (u) => { if (!u) return ''; try { const x = new URL(String(u).replace(/ /g, '%20')); x.hash = ''; return dec(x.href); } catch { return u; } };
const ws = (s) => String(s ?? '').replace(/[ \t\n\r\f]+/g, ' ').trim();
const num = (s) => (s === '' || s == null ? null : Number(s));
const band = (f) => (f >= 90 ? 'Very Easy' : f >= 80 ? 'Easy' : f >= 70 ? 'Fairly Easy' : f >= 60 ? 'Normal' : f >= 50 ? 'Fairly Hard' : f >= 30 ? 'Hard' : 'Very Hard');

const exp = parseCsv(fs.readFileSync(expFile, 'utf8'));
const got = parseCsv(fs.readFileSync(file, 'utf8'));
const urlCol = got.header.includes('url') ? 'url' : 'Address';
const E = new Map(exp.rows.map((r) => [normUrl(r.urlEncoded || r.url), r]));
const G = new Map(got.rows.map((r) => [normUrl(r.urlEncoded || r[urlCol]), r]));

// ---------------------------------------------------------------- column rules
const exact = (e, g) => ws(e) === ws(g);
const nocase = (e, g) => ws(e).toLowerCase() === ws(g).toLowerCase();
const url = (e, g) => normUrl(e) === normUrl(g);
const tol = (abs, rel) => (e, g) => { const a = num(e), b = num(g); if (a == null || b == null) return a === b || (a === 0 && b == null) || (b === 0 && a == null); return Math.abs(a - b) <= Math.max(abs, Math.abs(a) * rel); };
const bool = (e, g) => (num(e) > 0) === (num(g) > 0);
const present = (e, g) => !!ws(e) === !!ws(g);
const RULES = {
  url: ['URL (normalised)', url], urlEncoded: ['URL (normalised)', url],
  depth: ['exact', exact], folderDepth: ['exact', exact],
  responseTimeMs: ['slow pages only: ≥ 80% of expected', (e, g) => num(e) < 1000 || num(g) >= num(e) * 0.8],
  redirectUrl: ['URL (normalised)', url], redirectType: ['exact', exact],
  status: ['exact', exact], statusText: ['exact', exact], contentType: ['exact', exact], httpVersion: ['exact', exact], lastModified: ['exact', exact],
  sizeBytes: ['exact', exact], transferredBytes: ['±2%', tol(20, 0.02)], totalTransferredBytes: ['±15% (depends on resources loaded)', tol(200, 0.15)],
  hash: ['duplicate grouping (same content ⇔ same hash)', null], cookies: ['exact', exact],
  title: ['exact (whitespace collapsed)', exact], titleLength: ['±1', tol(1, 0)], titlePixelWidth: ['±10% (Arial 20px; depends on installed font)', tol(5, 0.1)],
  metaDescription: ['exact (whitespace collapsed)', exact], metaDescriptionLength: ['±1', tol(1, 0)], metaDescriptionPixelWidth: ['±10% (Arial 14px; font-dependent)', tol(5, 0.1)],
  metaKeywords: ['exact', exact], metaKeywordsLength: ['exact', tol(0, 0)],
  h1: ['exact', exact], h1Length: ['±1', tol(1, 0)], h1Second: ['exact', exact], h1SecondLength: ['±1', tol(1, 0)], h1Count: ['exact', tol(0, 0)],
  h2: ['exact', exact], h2Length: ['±1', tol(1, 0)], h2Count: ['exact', tol(0, 0)],
  canonical: ['URL (normalised)', url], metaRobots: ['case-insensitive', nocase], metaRobots2: ['case-insensitive', nocase], xRobotsTag: ['case-insensitive', nocase], metaRefresh: ['exact', exact],
  relNext: ['URL', url], relPrev: ['URL', url], httpRelNext: ['URL', url], httpRelPrev: ['URL', url], amphtml: ['URL', url], mobileAlternate: ['URL', url],
  language: ['exact', exact], indexable: ['exact', exact], indexabilityReason: ['exact', exact],
  wordCount: ['±8% (min 6) – visible text; tokenisers differ', tol(6, 0.08)], sentenceCount: ['±15% (min 2)', tol(2, 0.15)], avgWordsPerSentence: ['±20%', tol(1, 0.2)],
  fleschReadingEase: ['±15 points, pages ≥30 words (syllable algorithms differ)', tol(15, 0)], readability: ["label = standard band for the crawler's own Flesch score", null], textRatio: ['±5 points', tol(5, 0)],
  internalLinks: ['exact', tol(0, 0)], uniqueInternalLinks: ['exact', tol(0, 0)], externalLinks: ['exact', tol(0, 0)], uniqueExternalLinks: ['exact', tol(0, 0)],
  imagesMissingAlt: ['exact', tol(0, 0)], uniqueJsOutlinks: ['exact', tol(0, 0)], uniqueExternalJsOutlinks: ['exact', tol(0, 0)],
  inlinks: ['exact, counted only from pages present in the crawl', tol(0, 0)], uniqueInlinks: ['exact, from crawled pages', tol(0, 0)], uniqueJsInlinks: ['exact, from crawled pages', tol(0, 0)],
  closestNearDuplicate: ['present/absent', present], closestNearDuplicateSimilarity: ['±10 points', tol(10, 0)], nearDuplicates: ['has near duplicates (yes/no)', bool],
  error: ['present/absent', present],
};
const SKIPPED = { crawlTimestamp: 'run-dependent', co2Mg: 'crawler carbon model', carbonRating: 'crawler carbon model', percentOfTotal: 'crawler link metric', linkScore: 'crawler link metric' };

// ---------------------------------------------------------------- compare rows
const both = [...E.keys()].filter((k) => G.has(k));

// Recount expected inlinks using only source pages that this crawl actually contains,
// so a page the crawler skipped does not count as a missing inlink everywhere else.
const linksFile = path.join(root, 'expected-links.json');
if (fs.existsSync(linksFile)) {
  const edges = JSON.parse(fs.readFileSync(linksFile, 'utf8'));
  const acc = new Map();
  const bump = (k, f) => { const a = acc.get(k) || { inlinks: 0, uniqueInlinks: 0, uniqueJsInlinks: 0 }; a[f]++; acc.set(k, a); };
  for (const [src, { links, jsLinks }] of Object.entries(edges)) {
    if (!G.has(normUrl(src))) continue;
    // self-referencing links are not counted as inlinks
    const all = [...links, ...jsLinks].map(normUrl).filter((t) => t !== normUrl(src));
    all.forEach((t) => bump(t, 'inlinks'));
    new Set(all).forEach((t) => bump(t, 'uniqueInlinks'));
    new Set(jsLinks.map(normUrl).filter((t) => t !== normUrl(src))).forEach((t) => bump(t, 'uniqueJsInlinks'));
  }
  for (const k of E.keys()) Object.assign(E.get(k), acc.get(k) || { inlinks: 0, uniqueInlinks: 0, uniqueJsInlinks: 0 });
}
// Redirect (3xx) bodies are not content: crawlers differ on whether they download them at all.
const SKIP_FOR_3XX = new Set(['sizeBytes', 'transferredBytes', 'totalTransferredBytes', 'wordCount', 'sentenceCount', 'avgWordsPerSentence', 'fleschReadingEase', 'readability', 'textRatio', 'h1', 'h1Length', 'h1Count', 'language']);
const is3xx = (r) => /^3\d\d$/.test(r.status);
const stats = {};
const mismatches = [];
const note = (col, k, e, g) => mismatches.push({ col, url: k, e, g, cat: E.get(k).category, test: E.get(k).testTitle || '' });
for (const col of Object.keys(RULES)) {
  if (!got.header.includes(col)) { stats[col] = { missingColumn: true }; continue; }
  const [, fn] = RULES[col];
  const s = (stats[col] = { compared: 0, ok: 0 });
  for (const k of both) {
    let e = E.get(k)[col];
    const g = G.get(k)[col];
    if (E.get(k).statusText === 'Blocked by robots.txt' && col !== 'indexabilityReason') continue;
    if (e === '*' || (is3xx(E.get(k)) && SKIP_FOR_3XX.has(col))) continue;
    let ok;
    if (col === 'hash') continue;
    const fewWords = num(E.get(k).wordCount) < 30;
    if ((col === 'fleschReadingEase' || col === 'avgWordsPerSentence') && fewWords) continue; // unstable on tiny texts
    if (col === 'readability') {
      // the label must match the standard band for the crawler's OWN Flesch score
      const f = num(G.get(k).fleschReadingEase);
      if (f == null || G.get(k).fleschReadingEase === '') continue;
      ok = ws(g) === band(f);
      if (!ok) e = `${band(f)} (for Flesch ${f})`;
    } else ok = fn(e, g);
    s.compared++;
    if (ok) s.ok++;
    else note(col, k, e, g);
  }
}
// hash: rows with identical expected content must share a crawler hash, and vice versa
{
  const s = (stats.hash = { compared: 0, ok: 0 });
  const groups = new Map();
  const hashable = both.filter((k) => !is3xx(E.get(k)) && E.get(k).hash !== '*');
  for (const k of hashable) { const h = E.get(k).hash; if (h) (groups.get(h) || groups.set(h, []).get(h)).push(k); }
  const byGot = new Map();
  for (const k of hashable) { const h = G.get(k).hash; if (h) (byGot.get(h) || byGot.set(h, []).get(h)).push(k); }
  for (const [, ks] of groups) for (const k of ks) {
    s.compared++;
    const sameExp = new Set(ks);
    const sameGot = new Set(byGot.get(G.get(k).hash) || []);
    const ok = [...sameExp].every((x) => sameGot.has(x)) && [...sameGot].every((x) => sameExp.has(x));
    if (ok) s.ok++;
    else note('hash', k, `${ks.length} URL(s) with identical content`, `${sameGot.size} URL(s) share this hash`);
  }
}

// ---------------------------------------------------------------- coverage
const missing = [...E.keys()].filter((k) => !G.has(k));
const extra = [...G.keys()].filter((k) => !E.has(k));
const why = (r) => r.statusText === 'Blocked by robots.txt' ? 'Blocked by robots.txt (should be listed, non-indexable)'
  : /redirect/.test(r.discoveredVia) && r.redirectType ? `Redirect row missing (${r.redirectType})`
  : r.redirectUrl && !r.redirectUrl.startsWith('http://localhost') ? 'Redirect to another host – row missing'
  : `Discovered via: ${r.discoveredVia}`;
const missGroups = {};
for (const k of missing) { const r = E.get(k); (missGroups[why(r)] = missGroups[why(r)] || []).push(r); }

// ---------------------------------------------------------------- report
const pct = (a, b) => (b ? ((a / b) * 100).toFixed(1) + '%' : '–');
let out = `# Crawl comparison report\n\nCrawl: \`${path.basename(file)}\` (${got.rows.length} rows) vs \`expected-results.csv\` (${exp.rows.length} rows).\n\n`;
out += `## Coverage\n\n| | URLs |\n|---|---|\n| Expected URLs | ${E.size} |\n| Found in crawl | ${both.length} (${pct(both.length, E.size)}) |\n| Missing from crawl | ${missing.length} |\n| In crawl but not expected | ${extra.length} |\n\n`;
for (const [g, list] of Object.entries(missGroups).sort((a, b) => b[1].length - a[1].length)) {
  out += `<details><summary><b>${g}</b> (${list.length})</summary>\n\n` + list.map((r) => `- \`${dec(r.urlEncoded).replace('http://localhost:3000', '').slice(0, 110)}\` ${r.testTitle ? '– ' + r.testTitle : ''}`).join('\n') + '\n\n</details>\n\n';
}
if (extra.length) out += `**In crawl but not expected:**\n\n` + extra.map((k) => `- \`${k}\` (${G.get(k).status})`).join('\n') + '\n\n';
const totalCmp = Object.values(stats).reduce((a, s) => a + (s.compared || 0), 0);
const totalOk = Object.values(stats).reduce((a, s) => a + (s.ok || 0), 0);
out += `## Columns\n\n${totalOk} of ${totalCmp} cell comparisons match (${pct(totalOk, totalCmp)}). Not compared: ${Object.entries(SKIPPED).map(([c, w]) => `\`${c}\` (${w})`).join(', ')}.\n\n| Column | Rule | Compared | Match | Mismatch | Match % |\n|---|---|---|---|---|---|\n`;
for (const col of Object.keys(RULES)) {
  const s = stats[col];
  out += s.missingColumn ? `| ${col} | ${RULES[col][0]} | column missing in crawl | | | |\n` : `| ${col} | ${RULES[col][0]} | ${s.compared} | ${s.ok} | ${s.compared - s.ok} | ${pct(s.ok, s.compared)} |\n`;
}
out += '\n## Mismatch examples (up to 12 per column; all in column-mismatches.csv)\n\n';
const short = (v) => { const s = ws(v); return s === '' ? '∅' : s.length > 70 ? s.slice(0, 67) + '…' : s; };
for (const col of Object.keys(RULES)) {
  const list = mismatches.filter((m) => m.col === col);
  if (!list.length) continue;
  out += `### ${col} (${list.length})\n\n| URL | Test | Expected | Crawl |\n|---|---|---|---|\n`;
  out += list.slice(0, 12).map((m) => `| \`${m.url.replace('http://localhost:3000', '').slice(0, 60)}\` | ${short(m.test).replace(/\|/g, '/')} | ${short(m.e).replace(/\|/g, '/')} | ${short(m.g).replace(/\|/g, '/')} |`).join('\n') + '\n\n';
}
fs.writeFileSync(path.join(root, 'coverage-report.md'), out);
const csv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
fs.writeFileSync(path.join(root, 'column-mismatches.csv'), '﻿' + ['column,url,category,test,expected,crawl', ...mismatches.map((m) => [m.col, m.url, m.cat, m.test, m.e, m.g].map(csv).join(','))].join('\r\n') + '\r\n');
console.log(out.split('## Mismatch examples')[0].replace(/<details>[\s\S]*?<\/details>\n\n/g, (m) => m.match(/<b>(.*)<\/b> \((\d+)\)/).slice(1).join(': ') + '\n'));
console.log(`Wrote coverage-report.md and column-mismatches.csv (${mismatches.length} mismatches)`);
