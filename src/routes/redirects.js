// /redirects/* – HTTP redirects, chains, loops, meta refresh and Refresh headers.

const { group } = require('../registry');
const { redirect, linkList, esc } = require('../html');
const { ORIGIN, ALT_ORIGIN } = require('../config');

const t = group('redirects');
const TARGET = '/redirects/redirect_target';

// HTTP redirect test: path -> (status, location)
const http = (path, title, test, expect, status, location, extra = {}) =>
  t(path, title, test, expect, {}, { handler: () => redirect(status, location, extra.headers), ...extra });

// Meta refresh test page
const meta = (path, title, test, expect, content, extra = {}) =>
  t(path, title, test, expect, { head: `<meta http-equiv="refresh" content="${esc(content)}">`, ...(extra.page || {}) }, extra);

t(TARGET, 'Redirect Target', 'Final destination of most redirect tests.', '200, indexable; many redirect inlinks.');

http('/redirects/redirect_1', '301 to target', 'Single 301 redirect.', '301 → /redirects/redirect_target (1 hop).', 301, TARGET);
http('/redirects/redirect_2', '301 chain (2 hops)', '301 → redirect_1 → target.', 'Redirect chain of 2 hops.', 301, '/redirects/redirect_1');
http('/redirects/redirect_3_302', '302 chain (3 hops)', '302 → redirect_2 → redirect_1 → target.', 'Redirect chain of 3 hops with mixed 302/301.', 302, '/redirects/redirect_2');
http('/redirects/redirect_4_307', '307 Temporary Redirect', 'Single 307.', '307 → target (temporary redirect).', 307, TARGET);
http('/redirects/redirect_300', '300 Multiple Choices', '300 with a Location header.', '300 → target.', 300, TARGET);
http('/redirects/redirect_303', '303 See Other', 'Single 303.', '303 → target.', 303, TARGET);
t('/redirects/redirect_304', '304 Not Modified', '304 with no Location header.', '3xx without redirect target.', {}, { handler: () => ({ status: 304, body: '' }) });
http('/redirects/redirect_305', '305 Use Proxy', 'Deprecated 305 with Location.', '305 → target.', 305, TARGET);
http('/redirects/redirect_306', '306 Switch Proxy', 'Unused 306 with Location.', '306 → target.', 306, TARGET);
http('/redirects/redirect_308', '308 Permanent Redirect', 'Single 308.', '308 → target (permanent).', 308, TARGET);

for (let i = 1; i <= 6; i++) {
  http(`/redirects/chain_hop_${i}`, i === 6 ? 'Long redirect chain (6 hops)' : `Redirect chain hop ${i}`, `Hop ${i} of a 6-hop 301 chain.`,
    i === 6 ? 'Redirect chain of 6 hops (exceeds 5-hop limit of many crawlers/Google).' : 'Part of a long chain.',
    301, i === 1 ? TARGET : `/redirects/chain_hop_${i - 1}`, { listed: i === 6, unlinkedReason: 'reached via the redirect chain' });
}

http('/redirects/redirect_chain_allowed', 'Redirect to robots-blocked URL', 'Allowed URL 301s to a URL disallowed in robots.txt.', 'Redirect target "Blocked by robots.txt".', 301, '/redirects/redirect_chain_disallowed');
http('/redirects/redirect_chain_disallowed', 'Blocked redirect target', 'Disallowed by robots.txt; would 301 to target.', 'Blocked by robots.txt.', 301, TARGET, { listed: false, unlinkedReason: 'redirect target' });
http('/redirects/disallowed_redirect', 'Robots-blocked redirect', 'A redirecting URL that robots.txt blocks.', 'Blocked by robots.txt (redirect never seen).', 301, TARGET);
http('/redirects/disallowed_redirect_target_redirect', 'Robots-blocked redirect (2)', 'Second blocked redirect (matches the same Disallow prefix).', 'Blocked by robots.txt.', 301, '/redirects/redirect_1');

t('/redirects/redirect_content', '301 with a full HTML body', '301 to / that still sends a large HTML page with links.', '301 → /; links in the body should be ignored.', {}, {
  handler: () => ({
    status: 301,
    headers: { Location: '/' },
    body: `<!DOCTYPE html><html><head><title>Redirect With Content</title></head><body><h1>You should never see this</h1><p><a href="/redirects/link_in_redirect_body">Link inside redirect body</a></p>${'<p>Body text. </p>'.repeat(50)}</body></html>`,
  }),
});
http('/redirects/redirect_to_404', 'Redirect to 404', '302 to a URL that returns 404.', 'Redirect chain ending in a 4xx (broken redirect).', 302, '/redirects/redirect_to_404_target');
http('/redirects/redirect_to_500', 'Redirect to 500', '301 to a URL that returns 500.', 'Redirect chain ending in a 5xx.', 301, '/status_codes/status_500');
http('/redirects/two_step_redirect_loop_1', 'Redirect loop (2 steps)', 'loop_1 → loop_2 → loop_1.', 'Redirect loop detected.', 301, '/redirects/two_step_redirect_loop_2');
http('/redirects/two_step_redirect_loop_2', 'Redirect loop step 2', 'loop_2 → loop_1.', 'Redirect loop detected.', 301, '/redirects/two_step_redirect_loop_1', { listed: false, unlinkedReason: 'redirect target' });
http('/redirects/infinite_redirect', 'Redirect to itself', '302 whose Location is its own URL.', 'Redirect loop (self).', 302, '/redirects/infinite_redirect');
http('/redirects/case_redirect_loop', 'Case-changing redirect loop', 'Lowercase URL redirects to uppercase, which redirects back to lowercase.', 'Redirect loop through case variants.', 301, '/redirects/CASE_REDIRECT_LOOP');
http('/redirects/CASE_REDIRECT_LOOP', 'Case loop (uppercase)', 'Uppercase half of the case loop.', 'Redirect loop.', 301, '/redirects/case_redirect_loop', { listed: false, unlinkedReason: 'redirect target' });
http('/redirects/external_redirect', 'Redirect to external site (example.com)', '302 to https://example.com/ (needs internet).', 'External redirect.', 302, 'https://example.com/');
http('/redirects/external_redirect_local', 'Redirect to another host', `301 to ${ALT_ORIGIN}/external/page.`, 'External redirect (different host).', 301, ALT_ORIGIN + '/external/page');
http('/redirects/external_redirect_chain1', 'Internal → internal → external chain', 'chain1 → chain2 → external host.', 'Redirect chain ending externally.', 301, '/redirects/external_redirect_chain2');
http('/redirects/external_redirect_chain2', 'External chain step 2', 'chain2 → external host.', 'Redirect.', 301, ALT_ORIGIN + '/external/redirect-again', { listed: false, unlinkedReason: 'redirect target' });
http('/redirects/invalid_redirect', 'Redirect to missing image', '303 to /images/foo.jpg which does not exist.', 'Redirect to 404.', 303, '/images/foo.jpg');
http('/redirects/relative_location', 'Relative Location header', 'Location: redirect_target (relative, no leading slash).', 'Resolved to /redirects/redirect_target.', 301, 'redirect_target');
http('/redirects/protocol_relative_location', 'Protocol-relative Location', `Location: //${ORIGIN.replace('http://', '')}${TARGET}`, 'Resolved to the target on the same scheme.', 301, '//' + ORIGIN.replace('http://', '') + TARGET);
http('/redirects/absolute_location', 'Absolute Location header', 'Location uses the full absolute URL.', '301 → target.', 301, ORIGIN + TARGET);
t('/redirects/redirect_no_location', '301 without Location', '301 status with no Location header.', '3xx with no redirect URL (broken redirect).', {}, { handler: () => redirect(301, null) });
t('/redirects/redirect_empty_location', '301 with empty Location', 'Location header present but empty.', 'Broken redirect / redirect to self.', {}, { handler: () => ({ status: 301, headers: { Location: '' }, body: '' }) });
http('/redirects/redirect_to_pdf', 'Redirect to PDF', '301 to a PDF file.', 'Redirect to non-HTML resource.', 301, '/pdf_open_parameters.pdf');
http('/redirects/redirect_to_canonicalised', 'Redirect to canonicalised page', '301 to a page whose canonical points elsewhere.', 'Redirect target is non-indexable (canonicalised).', 301, '/canonical_tags/canonical_tag');
http('/redirects/redirect_to_noindex', 'Redirect to noindex page', '301 to a meta noindex page.', 'Redirect target is non-indexable (noindex).', 301, '/robots_protocol/meta_noindex');
http('/redirects/redirect_adds_parameters', 'Redirect adds tracking parameters', '301 to the target with ?utm_source=redirect appended.', 'Redirect to parameterised URL.', 301, TARGET + '?utm_source=redirect&utm_medium=test');
http('/redirects/trailing_slash', 'Trailing-slash redirect', '301 from /redirects/trailing_slash to /redirects/trailing_slash/.', 'Redirect → URL with slash (200).', 301, '/redirects/trailing_slash/');
t('/redirects/trailing_slash/', 'Trailing slash version', 'Target of the trailing slash redirect.', '200.', {}, { listed: false, unlinkedReason: 'redirect target' });
http('/redirects/Uppercase_Redirect', 'Uppercase → lowercase redirect', 'URL with capitals 301s to the lowercase version.', 'Redirect for URL normalisation.', 301, '/redirects/uppercase_redirect');
t('/redirects/uppercase_redirect', 'Lowercase destination', 'Lowercase destination of the case redirect.', '200.', {}, { listed: false, unlinkedReason: 'redirect target' });
http('/redirects/mixed_chain', 'Mixed chain: 301 → meta refresh → target', 'HTTP 301 to a page that meta-refreshes to the target.', 'Chain with mixed redirect types.', 301, '/redirects/meta_redirect_1');
t('/redirects/redirect_with_cookie', 'Redirect that sets a cookie', '302 that sets a session cookie, then lands on the target.', 'Redirect; cookie reported on the redirect URL.', {}, {
  handler: () => redirect(302, TARGET, { 'Set-Cookie': 'session=abc123; Path=/; HttpOnly' }),
});

// ---- Refresh header and meta refresh
t('/redirects/header_refresh_redirect', 'HTTP Refresh header redirect', 'Response header "Refresh: 0; url=/redirects/redirect_target".', 'HTTP Refresh redirect to target.', {}, {
  handler: () => ({ status: 200, headers: { Refresh: `0; url=${TARGET}` }, body: '<!DOCTYPE html><html><head><title>Header Refresh Redirect</title></head><body><p>Refreshing…</p></body></html>' }),
});
meta('/redirects/meta_redirect_1', 'Meta refresh (0 s) to target', '<meta http-equiv="refresh" content="0;url=/redirects/redirect_target">.', 'Meta refresh redirect → target; non-indexable.', `0;url=${TARGET}`);
meta('/redirects/meta_redirect_2', 'Meta refresh chain (2)', 'Meta refresh to meta_redirect_1.', 'Meta refresh chain of 2.', '0;url=/redirects/meta_redirect_1');
meta('/redirects/meta_redirect_3', 'Meta refresh chain (3)', 'Meta refresh to meta_redirect_2.', 'Meta refresh chain of 3.', '0;url=/redirects/meta_redirect_2');
meta('/redirects/meta_redirect_delayed', 'Delayed meta refresh (10 s)', 'content="10;url=…": refresh after 10 seconds.', 'Meta refresh redirect (with delay).', `10;url=${TARGET}`);
meta('/redirects/meta_redirect_quoted_url', "Meta refresh with quoted URL", `content="0; URL='${TARGET}'" – uppercase URL= and quotes.`, 'Parsed as meta refresh → target.', `0; URL='${TARGET}'`);
meta('/redirects/meta_redirect_absolute', 'Meta refresh to absolute URL', 'Meta refresh with full absolute URL.', 'Meta refresh → target.', `0;url=${ORIGIN}${TARGET}`);
meta('/redirects/infinite_meta_redirect', 'Meta refresh to itself', 'Meta refresh whose url is its own URL.', 'Meta refresh loop.', '0;url=/redirects/infinite_meta_redirect');
meta('/redirects/invalid_meta_redirect', 'Meta refresh to 404', 'Meta refresh to /images/foo.jpg (404).', 'Meta refresh to broken URL.', '0;url=/images/foo.jpg');
meta('/redirects/external_meta_redirect', 'Meta refresh to external site', 'Meta refresh to the alternate host.', 'External meta refresh redirect.', `0;url=${ALT_ORIGIN}/external/page`);
t('/redirects/meta_refresh_in_body', 'Meta refresh inside <body>', 'Meta refresh tag placed in the body instead of the head.', 'Some crawlers ignore it; browsers still follow it.', {
  body: `<meta http-equiv="refresh" content="0;url=${TARGET}">`,
});

t('/redirects/url_redirect_chains', 'URL Redirect Chains (hub)', 'Page that links to several chains so they are discovered together.', 'Redirect chains report lists each chain with all hops.', {
  body: linkList([
    ['/redirects/redirect_3_302', '3-hop chain'],
    ['/redirects/chain_hop_6', '6-hop chain'],
    ['/redirects/mixed_chain', 'HTTP + meta chain'],
    ['/redirects/meta_redirect_3', 'Meta refresh chain'],
    ['/redirects/external_redirect_chain1', 'Chain ending on another host'],
    ['/redirects/two_step_redirect_loop_1', 'Redirect loop'],
  ]),
});
