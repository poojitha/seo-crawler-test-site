// /other/* – head parsing problems, HTTP headers, auth, cookies, crawler fingerprinting, speed.

const { group } = require('../registry');
const { render, esc, para } = require('../html');
const { ORIGIN, STARTED } = require('../config');

const t = group('other');
const O = '/other';

// ---- broken <head> parsing
t(`${O}/non_head_tag_in_head`, 'Non-head tag inside head tag', 'A <div> right after <title> closes <head>, so the description and canonical that follow are in the body.', 'Description/canonical reported as outside <head> or missing.', {
  description: null,
  head: `<div>Div inside head</div>\n  <meta name="description" content="Description after a div in the head">\n  <link rel="canonical" href="${ORIGIN}${O}/non_head_tag_in_head">`,
});
t(`${O}/typo_in_head`, 'Typo inside head tag', '<heda> typo plus <meta name="descripton"> misspelling.', 'Description missing (misspelt attribute).', {
  description: null,
  headTop: '<heda></heda>',
  head: '<meta name="descripton" content="Misspelt description attribute">',
});
t(`${O}/unfinished_tag_in_head`, 'Unfinished tag inside head tag', 'An unclosed <link rel="prev" … tag swallows the next element.', 'Following tag lost; odd rel=prev URL parsed.', {
  description: null,
  head: `<link rel="prev" href="${ORIGIN}/thats_an_unfinished_tag"\n  <meta name="description" content="This description is swallowed by the unfinished tag">`,
});
t(`${O}/script_tag_contents`, 'Script Tag Contents', 'A script containing "<a href>" and "</title>" inside strings.', 'No links/titles extracted from inside <script>.', {
  head: '<script>var fake = "<a href=\\"/other/script_fake_link\\">fake</a>"; var t = "<\\/title><title>Fake title";</script>',
});
t(`${O}/html_comments`, 'Content inside HTML comments', 'A link, H1 and canonical inside <!-- comments -->.', 'Nothing inside comments is extracted.', {
  head: `<!-- <link rel="canonical" href="${ORIGIN}/"> -->`,
  body: '<!-- <h1>Commented H1</h1> <a href="/other/commented_link">Commented link</a> -->',
});
t(`${O}/missing_doctype_and_head`, 'No doctype, no <head> tag', 'Tag soup: no DOCTYPE, no <html>, <head> or <body> tags.', 'Still parsed; quirks mode.', {}, {
  handler: () => ({ body: '<title>No doctype, no head</title><meta name="description" content="Tag soup page without html, head or body tags."><h1>No doctype</h1><p>Browsers and crawlers must infer the structure.</p>' }),
});
t(`${O}/multiple_head_and_body`, 'Multiple <head> and <body> tags', 'Two <head> elements and two <body> elements.', 'Second head ignored; tags may be counted as outside head.', {
  bodyEnd: '<head><title>Second head title</title><meta name="robots" content="noindex"></head><body><p>Second body.</p></body>',
});
t(`${O}/noodp_noydir_tags`, 'NoODP and NoYDir Tags', 'Obsolete noodp and noydir robots values.', 'Reported as obsolete directives.', { robots: 'noodp, noydir' });
t(`${O}/string_width/512/string`, 'Default title Wide WWW iii string pixel width test', 'Title designed to sit around 512 px wide.', 'Pixel width ≈ 512.');
t(`${O}/conflicting_language_tags`, 'Conflicting language tags', '<html lang="en">, <meta http-equiv="content-language" content="fr"> and header Content-Language: de.', '"Language mismatch".', {
  headers: { 'Content-Language': 'de' },
  head: '<meta http-equiv="content-language" content="fr">',
});
t(`${O}/missing_html_lang`, 'Missing html lang', '<html> without a lang attribute.', '"Missing lang attribute" (accessibility).', { htmlTag: '<html>' });
t(`${O}/invalid_html_lang`, 'Invalid html lang', '<html lang="english">.', 'Invalid language code.', { lang: 'english' });
t(`${O}/duplicated_body_content_1`, 'duplicated body content 1', 'Different title, identical body to page 2.', '"Near/exact duplicate" body content.', { filler: false, h1: 'Duplicated body content', body: `<p>${para(200, 'dup-body')}</p>` });
t(`${O}/duplicated_body_content_2`, 'duplicated body content 2', 'Different title, identical body to page 1.', '"Near/exact duplicate" body content.', { filler: false, h1: 'Duplicated body content', body: `<p>${para(200, 'dup-body')}</p>` });
t(`${O}/in_web_linking`, 'In Web Linking', 'Links to /other/in_web_linked.', 'Inlinks/outlinks recorded between the pair.', { body: `<p><a href="${O}/in_web_linked">Linked page</a></p>` });
t(`${O}/in_web_linked`, 'In Web Linked', 'Linked from /other/in_web_linking.', 'Has an inlink from in_web_linking.', {}, { listed: false, unlinkedReason: 'linked from in_web_linking' });

// ---- HTTP headers
t(`${O}/page_with_hsts_headers`, 'Page with HSTS Headers', 'Strict-Transport-Security header (has no effect over plain http).', 'HSTS header reported.', { headers: { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload' } });
t(`${O}/security_headers_all`, 'All security headers', 'CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.', 'No missing security headers.', {
  headers: {
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data:",
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=()',
  },
});
t(`${O}/security_headers_none`, 'No security headers', 'Normal page with no security headers (like most pages on this site).', '"Missing security headers" (CSP, X-Frame-Options, …).');
t(`${O}/unsafe_cross_origin_links`, 'Unsafe cross-origin links', 'target="_blank" links to another host without rel="noopener".', '"Unsafe cross-origin links".', {
  body: '<p><a href="http://127.0.0.1:3000/external/page" target="_blank">Opens in a new tab without noopener</a></p>',
});
t(`${O}/cookies`, 'Page that sets cookies', 'Sets three cookies (session, tracking, consent).', 'Cookies reported for this URL.', {
  headers: { 'Set-Cookie': ['session=abc123; Path=/; HttpOnly', 'tracking=xyz; Path=/; Max-Age=31536000', 'consent=yes; Path=/; SameSite=Lax'] },
});
t(`${O}/cache_headers`, 'Cache headers', 'Cache-Control, ETag, Last-Modified and Expires.', 'Last-Modified populated; cache headers reported.', {
  headers: { 'Cache-Control': 'public, max-age=86400', ETag: '"crawler-test-etag-1"', 'Last-Modified': 'Wed, 01 Jan 2025 10:00:00 GMT', Expires: 'Thu, 01 Jan 2099 00:00:00 GMT' },
});
t(`${O}/no_cache`, 'No-store cache headers', 'Cache-Control: no-store, no-cache.', 'Uncacheable page.', { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate', Pragma: 'no-cache' } });
t(`${O}/uncompressed`, 'Uncompressed response', 'Large HTML sent without gzip even when the client accepts it.', '"Text compression not enabled"; transferred size = size.', {}, {
  handler: () => ({ ...render({ title: 'Uncompressed response', cat: 'other', body: `<p>${para(800, 'uncompressed')}</p>` }), gzip: false }),
});
t(`${O}/vary_user_agent`, 'Vary: User-Agent', 'Same content but announces Vary: User-Agent.', 'Vary header reported (dynamic serving signal).', { headers: { Vary: 'User-Agent' } });
t(`${O}/link_header_preload`, 'Link header preload/preconnect', 'HTTP Link headers for preload and preconnect (not canonical).', 'Should not be mistaken for canonical/hreflang.', {
  headers: { Link: ['</css/app.css>; rel=preload; as=style', `<${ORIGIN}>; rel=preconnect`] },
});
t(`${O}/x_powered_by`, 'Server fingerprint headers', 'Server and X-Powered-By headers reveal software versions.', 'Information disclosure headers.', { headers: { Server: 'Apache/2.2.15 (CentOS)', 'X-Powered-By': 'PHP/5.3.3' } });

// ---- auth
t(`${O}/basic_auth`, 'Basic Auth Page', 'HTTP Basic auth. Username: test  Password: test.', '401 without credentials; 200 with credentials configured in the crawler.', {}, {
  handler: (ctx) => {
    const ok = ctx.req.headers.authorization === 'Basic ' + Buffer.from('test:test').toString('base64');
    if (!ok) return { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Crawler Test (test/test)"' }, body: '<h1>401 Authorization Required</h1>' };
    return render({ title: 'Basic Auth Page', cat: 'other', body: `<p>Authenticated. <a href="${O}/behind_auth">Page behind auth</a></p>` });
  },
});
t(`${O}/behind_auth`, 'Behind auth', 'Linked only from the authenticated page.', 'Found only when crawling with credentials.', {}, { listed: false, unlinkedReason: 'linked from the basic-auth page' });

// ---- crawler fingerprinting
t(`${O}/crawler_user_agent`, 'Crawler user agent echo', 'The <title> is your crawler\'s User-Agent.', 'Title shows the UA string that was sent.', {}, {
  page: (ctx) => ({ title: String(ctx.req.headers['user-agent'] || '(no user agent)'), h1: 'Your user agent' }),
});
t(`${O}/crawler_ip_address`, 'Crawler IP address echo', 'The <title> is the client IP address.', 'Title shows the crawler IP (127.0.0.1 / ::1 locally).', {}, {
  page: (ctx) => ({ title: String(ctx.req.socket.remoteAddress), h1: 'Your IP address' }),
});
t(`${O}/crawler_request_headers`, 'Crawler Request Headers', 'Echoes every request header the crawler sent.', 'Shows Accept, Accept-Encoding, UA, cookies etc.', {}, {
  page: (ctx) => ({
    body: `<table class="tests">${Object.entries(ctx.req.headers).map(([k, v]) => `<tr><td>${esc(k)}</td><td><code>${esc(v)}</code></td></tr>`).join('')}</table>`,
  }),
});
t(`${O}/googlebot_only_content`, 'Cloaking: different content for Googlebot', 'Googlebot UA receives a different title and text (cloaking).', 'Crawl with Googlebot UA vs default UA to compare.', {}, {
  page: (ctx) => (/googlebot/i.test(ctx.req.headers['user-agent'] || '') ? { title: 'Cloaked title for Googlebot', body: '<p>Only Googlebot sees this.</p>' } : {}),
});

// ---- speed
t(`${O}/page_load_time_n`, 'Page load time', 'Response delayed by ?n= seconds (default 3).', 'Response time ≈ n seconds.', {}, {
  href: `${O}/page_load_time_n?n=3`,
  handler: (ctx) => {
    const n = Math.min(Number(ctx.query.get('n')) || 3, 60);
    return new Promise((r) => setTimeout(() => r(render({ title: `Page load time ${n}s`, cat: 'other', path: `${O}/page_load_time_n` })), n * 1000));
  },
});
t(`${O}/slow_ttfb_then_fast`, 'Slow first byte, streamed body', 'Headers after 2 s, then the body streamed in chunks.', 'High response time.', {}, {
  handler: (ctx) => {
    setTimeout(() => {
      ctx.res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      ctx.res.write('<!DOCTYPE html><html><head><title>Slow TTFB Streamed</title></head><body>');
      let i = 0;
      const iv = setInterval(() => {
        ctx.res.write(`<p>Chunk ${++i}</p>`);
        if (i === 5) {
          clearInterval(iv);
          ctx.res.end('</body></html>');
        }
      }, 300);
    }, 2000);
  },
});
t(`${O}/render_blocking_resources`, 'Render-blocking resources', 'Five synchronous scripts and stylesheets in the head.', 'Render-blocking resources (PageSpeed-style audit).', {
  head: Array.from({ length: 5 }, (_, i) => `<link rel="stylesheet" href="/css/app.css?v=${i}">\n  <script src="/js/app.js?v=${i}"></script>`).join('\n  '),
});

// ---- expiring page
const EXPIRES = Math.floor(STARTED / 1000) + 600;
t(`${O}/expiring_page_for_removed_test`, 'Expiring page', 'Linked URL contains a timestamp 10 minutes after server start; after that it returns 410.', '200 if crawled soon after start, 410 Gone later (tests re-crawl/compare).', {}, {
  href: `${O}/expiring_page_for_removed_test/${EXPIRES}`,
  matchPrefix: true, // timestamp changes on every server start
});
t(`${O}/expiring_page_for_removed_test/`, 'Expiring page (timestamped)', 'Returns 200 until the timestamp in the URL, then 410.', 'Time-dependent status.', {}, {
  prefix: true,
  listed: false,
  unlinkedReason: 'timestamped URL',
  handler: (ctx) => {
    const ts = Number(ctx.path.split('/').pop());
    if (!ts || Date.now() / 1000 > ts) return render({ status: 410, title: 'Gone', description: null, filler: false });
    return render({ title: `Expiring page (until ${new Date(ts * 1000).toISOString()})`, cat: 'other' });
  },
});
