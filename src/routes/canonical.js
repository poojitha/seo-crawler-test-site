// /canonical_tags/* – rel=canonical in HTML and HTTP headers.

const { group } = require('../registry');
const { ORIGIN, ALT_ORIGIN, HOST, PORT } = require('../config');

const t = group('canonical_tags');
const C = '/canonical_tags';
const self = (path) => ORIGIN + path;
const link = (href) => `<link rel="canonical" href="${href}">`;

t(`${C}/canonical_tag`, 'Canonical Tag', 'Canonical points to the home page.', 'Canonicalised → /.', { canonical: ORIGIN + '/' });
for (let i = 2; i <= 25; i++) {
  t(`${C}/canonical_tag/${i}`, `Canonical Tag ${i}`, `One of 24 pages all canonicalised to the home page.`, 'Canonicalised → /.', { canonical: ORIGIN + '/' });
}
t(`${C}/canonical_tag_with_self_reference`, 'Canonical Tag with Self Reference', 'Self-referencing canonical.', 'Indexable; canonical = self.', { canonical: self(`${C}/canonical_tag_with_self_reference`) });
t(`${C}/page_without_canonical_tag`, 'Page Without Canonical Tags', 'No canonical in HTML or headers.', 'Indexable; "Missing canonical".');
t(`${C}/canonical_tag_uppercase`, 'Canonical Tag Uppercase', '<LINK REL="CANONICAL" HREF="…"> in uppercase.', 'Canonicalised → / (HTML is case-insensitive).', {
  head: `<LINK REL="CANONICAL" HREF="${ORIGIN}/">`,
});
t(`${C}/canonical_unquoted_attributes`, 'Canonical with unquoted attributes', '<link rel=canonical href=…> without quotes, href before rel.', 'Canonicalised → /.', { head: `<link href=${ORIGIN}/ rel=canonical>` });
t(`${C}/canonical_tag_html_conflict`, 'Canonical Tag HTML Conflict', 'Two canonical tags in the head pointing to different URLs.', '"Multiple conflicting canonicals" – Google ignores both.', {
  head: link(self(`${C}/html1`)) + '\n  ' + link(self(`${C}/html2`)),
});
t(`${C}/canonical_multiple_same`, 'Two identical canonicals', 'Two canonical tags with the same URL.', '"Multiple canonicals" (not conflicting).', {
  head: link(self(`${C}/canonical_multiple_same`)) + '\n  ' + link(self(`${C}/canonical_multiple_same`)),
});
t(`${C}/canonical_tag_in_header`, 'Canonical Tag In Header', 'Canonical sent only in the HTTP Link header (self).', 'HTTP canonical detected; indexable.', {
  headers: { Link: `<${self(`${C}/canonical_tag_in_header`)}>; rel="canonical"` },
});
t(`${C}/canonical_header_to_other`, 'HTTP header canonical to other page', 'Link header canonical to /canonical_tags/page_without_canonical_tag.', 'Canonicalised via HTTP header.', {
  headers: { Link: `<${self(`${C}/page_without_canonical_tag`)}>; rel="canonical"` },
});
t(`${C}/canonical_tag_html_header_conflict`, 'Canonical Tag HTML/Header Conflict', 'HTML canonical → /canonical_tags/html, HTTP header canonical → /canonical_tags/header.', '"Canonical mismatch" between HTML and HTTP.', {
  canonical: self(`${C}/html`),
  headers: { Link: `<${self(`${C}/header`)}>; rel="canonical"` },
});
t(`${C}/canonical_html_header_match`, 'HTML and header canonical match', 'Same canonical in HTML and HTTP header.', 'Indexable; no conflict.', {
  canonical: self(`${C}/canonical_html_header_match`),
  headers: { Link: `<${self(`${C}/canonical_html_header_match`)}>; rel="canonical"` },
});
t(`${C}/unlinked_canonical`, 'Unlinked Canonical', 'Canonical to a URL that is not linked anywhere (and returns 404).', 'Canonicalised; canonical target discovered only via canonical and is 404 ("Non-indexable canonical").', {
  canonical: self(`${C}/unlinked/canonical`),
});
t(`${C}/unlinked_canonical_header`, 'Unlinked Canonical Header', 'HTTP header canonical to a page that is not linked anywhere (200).', 'Canonical target discovered only from the HTTP header.', {
  headers: { Link: `<${self(`${C}/unlinked/canonical_header`)}>; rel="canonical"` },
});
t(`${C}/unlinked/canonical_header`, 'Target of unlinked header canonical', 'Exists only as an HTTP canonical target.', '200; found via canonical.', {}, { listed: false, unlinkedReason: 'HTTP canonical target' });
t(`${C}/canonical_tag_og_url_conflict`, 'Canonical Tag/OG:URL Conflict', 'Canonical and og:url point to different URLs.', 'Canonicalised; og:url mismatch.', {
  canonical: ORIGIN + '/canonical_tag_og_url_conflict',
  head: `<meta property="og:url" content="${self(`${C}/canonical_tag_og_url_conflict`)}">`,
});
t(`${C}/canonical_tag_outside_head`, 'Canonical Tag Outside Head', 'Canonical link element inside <body>.', '"Canonical outside <head>" – ignored by Google.', { body: link(ORIGIN + '/') });
t(`${C}/non_head_canonical`, 'Non-head canonical (after <img>)', 'An <img> in the head implicitly closes it, so the following canonical is in the body.', 'Canonical treated as outside head.', {
  head: `<img src="/images/sample.gif" alt="">\n  ${link(ORIGIN + '/')}`,
});
t(`${C}/non_head_canonical_link`, 'Non-head canonical (after <a>)', 'An <a> in the head closes it before the canonical.', 'Canonical treated as outside head.', {
  head: `<a href="/">home</a>\n  ${link(ORIGIN + '/')}`,
});
t(`${C}/non_head_canonical_link_2`, 'Non-head canonical (after text)', 'Stray text in the head closes it before the canonical.', 'Canonical treated as outside head.', {
  head: `stray text\n  ${link(ORIGIN + '/')}`,
});
t(`${C}/relative_canonical_tag`, 'Canonical Tag With Relative Url', 'href="foobar" (relative).', 'Resolved to /canonical_tags/foobar (404) – "Canonical is relative".', { canonical: 'foobar' });
t(`${C}/relative_root_canonical_tag`, 'Canonical Tag With Relative Root', 'href="/foobar" (root-relative).', 'Resolved to /foobar (404).', { canonical: '/foobar' });
t(`${C}/canonical_empty_href`, 'Canonical with empty href', 'href="".', 'Invalid canonical (resolves to self in some crawlers).', { head: '<link rel="canonical" href="">' });
t(`${C}/page_with_external_canonical`, 'Page With External Canonical', 'Canonical to another domain.', 'Canonicalised to an external URL.', { canonical: ALT_ORIGIN + '/external/page' });
t(`${C}/canonicalised_to_disallowed_url`, 'Canonicalised to Disallowed URL', 'Canonical target is blocked by robots.txt.', 'Canonicalised; canonical target "Blocked by robots.txt".', { canonical: self(`${C}/disallowed_canonical_url`) });
t(`${C}/disallowed_canonical_url`, 'Disallowed canonical target', 'Blocked by robots.txt.', 'Blocked.', {}, { listed: false, unlinkedReason: 'canonical target' });
t(`${C}/canonical_duplicate_description`, 'Canonical And Duplicate Description', 'Canonicalised page with a description that duplicates another page.', 'Canonicalised; duplicate description only counted among indexable pages.', {
  canonical: ORIGIN + C,
  description: 'Description Tag Duplicate',
});
t(`${C}/canonical_to_redirect`, 'Canonical to a redirect', 'Canonical points to a 301.', '"Non-indexable canonical" (redirect).', { canonical: self('/redirects/redirect_1') });
t(`${C}/canonical_to_404`, 'Canonical to a 404', 'Canonical points to a missing page.', '"Non-indexable canonical" (4xx).', { canonical: self(`${C}/does_not_exist`) });
t(`${C}/canonical_to_noindex`, 'Canonical to a noindex page', 'Canonical target has meta noindex.', 'Mixed signals: canonical to non-indexable URL.', { canonical: self('/robots_protocol/meta_noindex') });
t(`${C}/canonical_to_pdf`, 'Canonical to a PDF', 'Canonical points to a PDF.', 'Canonicalised to non-HTML.', { canonical: self('/pdf_open_parameters.pdf') });
t(`${C}/canonical_chain_a`, 'Canonical chain A → B → C', 'A canonicalises to B, B to C.', '"Canonical chain".', { canonical: self(`${C}/canonical_chain_b`) });
t(`${C}/canonical_chain_b`, 'Canonical chain B', 'B canonicalises to C.', 'Canonicalised.', { canonical: self(`${C}/canonical_chain_c`) }, { listed: false, unlinkedReason: 'canonical target' });
t(`${C}/canonical_chain_c`, 'Canonical chain C', 'End of the canonical chain (self canonical).', 'Indexable.', { canonical: self(`${C}/canonical_chain_c`) }, { listed: false, unlinkedReason: 'canonical target' });
t(`${C}/canonical_loop_a`, 'Canonical loop A ↔ B', 'A canonicalises to B and B back to A.', '"Canonical loop".', { canonical: self(`${C}/canonical_loop_b`) });
t(`${C}/canonical_loop_b`, 'Canonical loop B', 'B canonicalises back to A.', 'Canonical loop.', { canonical: self(`${C}/canonical_loop_a`) }, { listed: false, unlinkedReason: 'canonical target' });
t(`${C}/canonical_tag_like_page`, 'Canonical Tag Like Page', 'Look-alike tags: <meta property="canonical">, rel="shortlink", rel="canonical-url" – plus one real self canonical.', 'Only the real rel=canonical is used.', {
  head: `<meta property="canonical" content="${ORIGIN}/">\n  <link rel="shortlink" href="${ORIGIN}/?p=1">\n  <link rel="canonical-url" href="${ORIGIN}/">\n  ${link(self(`${C}/canonical_tag_like_page`))}`,
});

// ---- URL normalisation edge cases
const P = (slug) => `${C}/${slug}`;
t(P('canonical_hostname_case_insensitive'), 'Hostname is case insensitive', `Canonical uses http://${HOST.toUpperCase()}:${PORT}/… for its own URL.`, 'Should be treated as self-referencing.', {
  canonical: `http://${HOST.toUpperCase()}:${PORT}${P('canonical_hostname_case_insensitive')}`,
});
t(P('canonical_protocol_case_insensitive'), 'Protocol is case insensitive', 'Canonical uses HTTP:// in uppercase for its own URL.', 'Should be treated as self-referencing.', {
  canonical: `HTTP://${HOST}:${PORT}${P('canonical_protocol_case_insensitive')}`,
});
t(P('canonical_path_is_case_sensitive'), 'Path is case sensitive', 'Canonical is the same URL with "Canonical_tags" capitalised.', 'Canonicalised to a DIFFERENT URL (paths are case-sensitive).', {
  canonical: `${ORIGIN}/Canonical_tags/canonical_path_is_case_sensitive`,
});
t(P('canonical_prameter_key_is_case_sensitive'), 'Parameter key is case sensitive', '?key=value with canonical ?Key=value.', 'Canonicalised to a different URL.', { canonical: self(P('canonical_prameter_key_is_case_sensitive') + '?Key=value') }, { href: P('canonical_prameter_key_is_case_sensitive') + '?key=value' });
t(P('canonical_prameter_value_is_case_sensitive'), 'Parameter value is case sensitive', '?key=value with canonical ?key=Value.', 'Canonicalised to a different URL.', { canonical: self(P('canonical_prameter_value_is_case_sensitive') + '?key=Value') }, { href: P('canonical_prameter_value_is_case_sensitive') + '?key=value' });
t(P('canonical_different_parameter_order'), 'Different parameter orders are canonicalised', '?key2=value2&key=value with canonical ?key=value&key2=value2.', 'Canonicalised (parameter order differs).', { canonical: self(P('canonical_different_parameter_order') + '?key=value&key2=value2') }, { href: P('canonical_different_parameter_order') + '?key2=value2&key=value' });
t(P('canonical_port_80'), 'Port :80 in canonical', `Canonical names port :80 instead of :${PORT}.`, 'Canonicalised to a different origin.', { canonical: `http://${HOST}:80${P('canonical_port_80')}` });
t(P('canonical_port_8080'), 'Port :8080 in canonical', 'Canonical names port :8080.', 'Canonicalised to a different origin.', { canonical: `http://${HOST}:8080${P('canonical_port_8080')}` });
t(P('canonical_explicit_port_self'), 'Explicit current port', `Canonical includes :${PORT}, matching the request.`, 'Self-referencing.', { canonical: self(P('canonical_explicit_port_self')) });
t(P('canonical_https_version'), 'Canonical to https://', 'Canonical points to the https:// version (not served locally).', 'Canonicalised to a URL with no response.', { canonical: `https://${HOST}:${PORT}${P('canonical_https_version')}` });
t(P('canonical_trailing_dot'), 'Trailing dot in hostname', `Canonical uses "${HOST}." (FQDN trailing dot).`, 'Technically the same host; most tools treat it as different.', { canonical: `http://${HOST}.:${PORT}${P('canonical_trailing_dot')}` });
t(P('canonical_url_with_slash'), 'Canonical adds a trailing slash', 'Canonical is the same path plus "/".', 'Canonicalised to the slash version (404).', { canonical: self(P('canonical_url_with_slash') + '/') });
t(P('canonical_url_fragments'), 'URL Fragments are not canonicalised', 'Canonical is self + #fragment.', 'Self-referencing (fragments ignored).', { canonical: self(P('canonical_url_fragments') + '#fragment') });
t(P('canonical_url_encoded_vs_non_encoded/café'), 'Encoded vs non-encoded (café)', 'Canonical uses caf%C3%A9 while the link uses café.', 'Same URL – self-referencing.', { canonical: self(encodeURI(P('canonical_url_encoded_vs_non_encoded/café'))) });
t(P('canonical_url_encoded_vs_non_encoded/🍺/ist'), 'Encoded vs non-encoded (emoji)', 'Canonical uses the percent-encoded emoji.', 'Same URL – self-referencing.', { canonical: self(encodeURI(P('canonical_url_encoded_vs_non_encoded/🍺/ist'))) });
t(P('canonical_with_tracking_params'), 'Parameter URL canonicalised to clean URL', 'Linked with ?utm_source=x; canonical is the clean URL.', 'Canonicalised (correct parameter handling).', { canonical: self(P('canonical_with_tracking_params')) }, { href: P('canonical_with_tracking_params') + '?utm_source=newsletter&utm_medium=email' });

t(`${C}/document.pdf`, 'PDF with HTTP canonical', 'PDF that declares an HTML page as canonical via Link header.', 'PDF canonicalised to /canonical_tags/page_without_canonical_tag.', {}, {
  handler: () => {
    const { pdf } = require('../assets');
    return {
      headers: { 'Content-Type': 'application/pdf', Link: `<${self(`${C}/page_without_canonical_tag`)}>; rel="canonical"` },
      body: pdf('Canonical PDF', 'PDF canonicalised to an HTML page', ORIGIN + '/'),
    };
  },
});
