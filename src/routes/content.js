// /content/*, /images/tests/*, /social_tags/*, /structured_data/*

const { group } = require('../registry');
const { para, words, esc } = require('../html');
const { ORIGIN, ALT_ORIGIN } = require('../config');

// ------------------------------------------------------------------ content & headings
const t = group('content');
const K = '/content';

t(`${K}/no_h1`, 'No H1s', 'Page without any <h1>.', '"Missing" H1.', { h1: null });
t(`${K}/mult_h1`, 'Mult H1s', 'Two <h1> elements.', '"Multiple" H1 (H1-1 and H1-2).', { h1Raw: '<h1>Mult H1s</h1>\n<h1>header number 2</h1>' });
t(`${K}/empty_h1`, 'Empty H1', '<h1></h1> with no text.', 'Missing/empty H1.', { h1Raw: '<h1></h1>' });
t(`${K}/h1_in_img`, 'H1 in img', 'The H1 only contains an <img> with alt text.', 'H1 text taken from the image alt ("Logo H1 alt text") or reported empty.', {
  h1Raw: '<h1><img src="/images/photo.jpg" alt="Logo H1 alt text" width="1" height="1"></h1>',
});
t(`${K}/h1_over_70_chars`, 'H1 over 70 characters', 'Very long H1 heading.', '"Over 70 characters" H1.', { h1: 'This H1 heading is intentionally much longer than seventy characters to trigger a length warning' });
t(`${K}/h1_hidden_css`, 'Hidden H1', 'H1 hidden with display:none.', 'H1 still extracted from HTML; hidden in rendering.', { h1Raw: '<h1 style="display:none">Hidden H1 heading</h1>' });
t(`${K}/h1_duplicate_a`, 'Duplicate H1 page A', 'Shares the H1 "Duplicate H1 Heading" with page B.', '"Duplicate" H1.', { h1: 'Duplicate H1 Heading' });
t(`${K}/h1_duplicate_b`, 'Duplicate H1 page B', 'Shares the H1 "Duplicate H1 Heading" with page A.', '"Duplicate" H1.', { h1: 'Duplicate H1 Heading' });
t(`${K}/no_h2`, 'No H2', 'Page without any <h2>.', '"Missing" H2.', { filler: false, body: `<p>${para(80, 'no_h2')}</p>` });
t(`${K}/multiple_h2`, 'Multiple H2', 'Several H2 headings.', '"Multiple" H2.', { body: '<h2>First H2</h2><p>Text.</p><h2>Second H2</h2><p>Text.</p><h2>Third H2</h2>' });
t(`${K}/non_sequential_headings`, 'Non-sequential headings', 'H1 followed directly by H4, skipping H2/H3.', 'Heading hierarchy / accessibility warning.', { filler: false, body: `<h4>Jumped to H4</h4><p>${para(60, 'nonseq')}</p>` });

const wc = (slug, title, test, expect, text) =>
  t(`${K}/${slug}`, title, test, expect, { chrome: false, filler: false, h1: null, body: `<p>${text}</p>` });
wc('word_count_100_words', 'Word Count - 100 Words', 'Exactly 100 words of body text (no site chrome).', 'Word Count = 100.', words(100, 'wc100'));
wc('word_count_hyphenated', 'Word Count - Hyphenated', '10 hyphenated words like "state-of-the-art".', 'Word Count = 10 (hyphenated words count once).', 'state-of-the-art well-known up-to-date long-term self-aware high-quality real-time user-friendly mother-in-law one-of-a-kind');
wc('word_count_number', 'Word Count - Number', '10 numbers, e.g. "1,000" and "3.14".', 'Word Count = 10.', '1 22 333 1,000 3.14 42 2026 7 100% 99');
wc('word_count_symbols', 'Word Count - Symbols', 'Only symbols separated by spaces.', 'Word Count = 0 (symbols are not words).', '& * # @ ! % ^ ( ) - + = | ~');
wc('word_count_script', 'Word Count - Script', '5 visible words plus a big <script> block.', 'Word Count = 5 (script text excluded).', 'five visible words only here</p><script>var lots = "of words inside a script tag that should never be counted as content at all";</script><p>');
wc('word_count_hidden_text', 'Word Count - Hidden text', '5 visible words plus 50 words in a display:none div.', 'Most crawlers count 55; rendered count is 5.', `five visible words only here</p><div style="display:none">${words(50, 'hidden')}</div><p>`);
wc('word_count_cjk', 'Word Count - CJK text', 'Japanese text without spaces.', 'Word count depends on tokenisation – usually very low.', 'すべての単語が高校程度の辞書に載っている日本語の文章です。');
t(`${K}/low_content`, 'Low content page', 'Fewer than 50 words in total.', '"Low content pages" (under 200 words).', { chrome: false, filler: false, body: '<p>Just a few words.</p>' });
t(`${K}/above_min_content_volume`, 'Above Min Content Volume', 'About 600 words of unique copy.', 'Not flagged for low content.', { body: `<p>${para(300, 'above1')}</p><p>${para(300, 'above2')}</p>` });
t(`${K}/page_content_size_n`, 'Page Content Size', 'Text content of ?n= KB (default 50).', 'Size grows with n; text ratio high.', {}, {
  page: (ctx) => ({ body: `<p>${words(Math.min(Number(ctx.query.get('n')) || 50, 5000) * 160, 'size')}</p>` }),
  href: `${K}/page_content_size_n?n=50`,
});
t(`${K}/page_html_size_n`, 'Page HTML Size', 'HTML padded with ?n= KB of comments/markup (default 3000 KB).', 'Large HTML size, low text-to-code ratio.', {}, {
  page: (ctx) => ({ body: `<!-- ${'x'.repeat(Math.min(Number(ctx.query.get('n')) || 3000, 20000) * 1024)} -->` }),
  href: `${K}/page_html_size_n?n=3000`,
});
t(`${K}/low_text_ratio`, 'Low text-to-HTML ratio', 'Tiny amount of text inside lots of nested markup.', '"Low text ratio".', {
  filler: false,
  body: '<div>'.repeat(300) + '<p>Little text.</p>' + '</div>'.repeat(300) + `<div class="${'c'.repeat(20000)}"></div>`,
});
t(`${K}/lorem_ipsum`, 'Lorem ipsum placeholder', 'Placeholder lorem ipsum copy left in production.', 'Placeholder content / custom search hit "lorem ipsum".', {
  body: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>',
});
t(`${K}/spelling_and_grammar_errors`, 'Spelling and grammar errors', 'Copy with obvious spelling and grammar mistakes.', 'Spelling/grammar checker reports errors.', {
  body: '<p>This sentense have many speling misteaks and it are not gramatically corect. Their going too the store tomorow becuase they needs some foods.</p>',
});
t(`${K}/readability_difficult`, 'Readability – very difficult', 'Long sentences of polysyllabic words.', 'Low Flesch reading ease (very difficult).', {
  filler: false,
  body: '<p>Notwithstanding the aforementioned considerations, institutionalised interdisciplinary methodologies necessitate comprehensive reconceptualisation of epistemological presuppositions underpinning contemporaneous organisational infrastructures, particularly regarding multidimensional characterisation of heterogeneous computational architectures and their incommensurable operationalisation.</p>'.repeat(3),
});
t(`${K}/readability_easy`, 'Readability – very easy', 'Short sentences of short words.', 'High Flesch reading ease (easy).', {
  filler: false,
  body: '<p>The cat sat. It was a fat cat. The cat ran to me. I like the cat. We had fun. The sun was hot. We sat in the sun.</p>'.repeat(5),
});
t(`${K}/custom_text`, 'Custom text', 'Contains the marker string "crawler-custom-search-string" for custom search tests.', 'Found by Custom Search "contains".', { body: '<p>Marker: crawler-custom-search-string</p>' });
t(`${K}/custom_extraction_text`, 'Custom extraction text', 'Elements for custom extraction: CSS .price, id #sku, XPath //span[@itemprop="author"], regex ISBN.', 'Extracted values: price 19.99, sku SKU-12345, author Jane Doe, ISBN 978-3-16-148410-0.', {
  body: '<p class="price">19.99</p><p id="sku">SKU-12345</p><p>By <span itemprop="author">Jane Doe</span></p><p>ISBN 978-3-16-148410-0</p>',
});
t(`${K}/soft_404`, 'Page Not Found', '200 OK response that says "page not found".', '"Soft 404" (200 status with not-found content).', { h1: 'Sorry, this page could not be found', filler: false, body: '<p>Error 404 – the page you requested does not exist or has been removed.</p>' });
t(`${K}/error_page`, 'Server error page', '500 status with an error page body.', 'Server Error (5xx).', { status: 500, title: 'Internal Server Error', filler: false });
t(`${K}/exact_duplicate_a`, 'Exact duplicate A', 'Identical HTML to page B (same title, same body).', '"Exact duplicate" (same hash).', {}, {
  handler: () => duplicatePage(),
});
t(`${K}/exact_duplicate_b`, 'Exact duplicate B', 'Identical HTML to page A.', '"Exact duplicate" (same hash).', {}, { handler: () => duplicatePage() });
const NEAR = para(400, 'near-duplicate');
t(`${K}/near_duplicate_a`, 'Near duplicate A', 'Shares ~95% of its 400-word body with page B.', '"Near duplicate" (similarity ≥ 90%).', { filler: false, body: `<p>${NEAR}</p><p>Unique ending for page A.</p>` });
t(`${K}/near_duplicate_b`, 'Near duplicate B', 'Shares ~95% of its 400-word body with page A.', '"Near duplicate" (similarity ≥ 90%).', { filler: false, body: `<p>${NEAR}</p><p>Different closing sentence on page B with extra words.</p>` });
t(`${K}/multiple_titles_and_descriptions`, 'title tag 1', 'Two titles and two meta descriptions.', 'Title 2 and Meta Description 2 populated.', {
  description: 'description tag 1',
  head: '<title>title tag 2</title>\n  <meta name="description" content="description tag 2">',
  h1: 'Multiple titles and descriptions',
});
t(`${K}/title_with_newline_quote_doublequote_and_comma_characters`, 'Title with newline, quotes and commas', 'Title containing a newline, \' " and , – breaks naive CSV export.', 'Exported correctly (quoted CSV field).', {
  titleTag: '<title>Title with \n \' " and , characters</title>',
  h1: 'Title with special CSV characters',
});
t(`${K}/header_content_type_malformed`, 'Malformed Content-Type header', 'Content-Type: abc/xyz; charset=UTF-8 for an HTML page.', 'Content type reported as abc/xyz; may not be parsed as HTML.', { headers: { 'Content-Type': 'abc/xyz; charset=UTF-8' } });
t(`${K}/no_content_type_header`, 'No Content-Type header', 'HTML page served without any Content-Type header.', 'Content type blank; crawler must sniff.', { headers: { 'Content-Type': null } });
t(`${K}/text_plain_html`, 'HTML served as text/plain', 'Valid HTML with Content-Type: text/plain.', 'Not parsed as HTML (no title/links).', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
t(`${K}/meta_content_type_malformed`, 'Meta content type - malformed', '<meta http-equiv="Content-Type" content="text/foo; charset=bar">.', 'Malformed meta content type reported.', { charset: null, headTop: '<meta http-equiv="Content-Type" content="text/foo; charset=bar">' });
t(`${K}/meta_content_type_text_html`, 'Meta content type - text/html', '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">.', 'Valid; no issue.', { charset: null, headTop: '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">' });
const XHTML = (body) => ({
  headers: { 'Content-Type': 'application/xhtml+xml; charset=utf-8' },
  body: `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml" lang="en">\n<head>\n  <meta charset="utf-8" />\n  <title>XHTML content type</title>\n  <meta name="description" content="Well-formed XHTML page served as application/xhtml+xml." />\n</head>\n<body>\n${body}\n</body>\n</html>\n`,
});
t(`${K}/xhtml_content_type`, 'XHTML content type', 'Well-formed XHTML served as application/xhtml+xml.', 'Parsed as XHTML; title, description, H1 and link extracted.', {}, {
  handler: () => XHTML('<h1>XHTML content type</h1>\n<p><a href="/tests/content">Back to content tests</a></p>'),
});
t(`${K}/xhtml_malformed`, 'Malformed XHTML', 'application/xhtml+xml page that is not well-formed XML (unclosed <br> and <p>).', 'Browsers show an XML parse error with no rendered DOM, so a rendering crawler must not crash.', {}, {
  handler: () => XHTML('<h1>Malformed XHTML</h1>\n<p>Unclosed paragraph<br>\n<a href="/tests/content">Back</a>'),
});
t(`${K}/broken_resources`, 'Page with broken CSS and JS', 'References /brokencss.css and /brokenjs.js which return 404.', 'Broken resources (4xx) on the page.', {
  head: '<link rel="stylesheet" href="/brokencss.css">\n  <script src="/brokenjs.js"></script>',
});

const FORM_TYPES = {
  email: '<input type="email" name="email">',
  number: '<input type="number" name="n">',
  password_and_cc: '<input type="password" name="pw"><input type="text" name="cc" autocomplete="cc-number">',
  search: '<input type="search" name="q">',
  tel: '<input type="tel" name="tel">',
  text: '<input type="text" name="name">',
  textarea: '<textarea name="msg"></textarea>',
  url: '<input type="url" name="site">',
};
for (const [k, field] of Object.entries(FORM_TYPES)) {
  t(`${K}/non_secure_form_fields_${k}`, `Non-secure Form Fields - ${k.replace(/_/g, ' ')}`, `Form with a ${k} field that posts to an http:// URL.`, '"Form on HTTP page" / insecure form action (security warning).', {
    body: `<form action="http://${ORIGIN.replace('http://', '')}/content/form_target" method="post">${field}<button type="submit">Send</button></form>`,
  });
}

function duplicatePage() {
  return {
    status: 200,
    headers: {},
    body: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Exact Duplicate Page</title><meta name="description" content="Exact duplicate page used for hash comparison tests."></head><body><h1>Exact Duplicate Page</h1><p>${para(150, 'exact-dup')}</p><p><a href="/tests/content">Back</a></p></body></html>`,
  };
}

// ------------------------------------------------------------------ images
const im = group('images');
const I = '/images/tests';
im(`${I}/missing_alt`, 'Image missing alt attribute', '<img> with no alt attribute.', '"Missing alt attribute".', { body: '<img src="/images/photo.jpg" width="200" height="100">' });
im(`${I}/empty_alt`, 'Image with empty alt', '<img alt=""> (decorative image).', '"Missing alt text" (attribute present but empty).', { body: '<img src="/images/photo.jpg" alt="" width="200" height="100">' });
im(`${I}/alt_over_100`, 'Alt text over 100 characters', 'Very long alt attribute.', '"Alt text over 100 characters".', {
  body: '<img src="/images/photo.jpg" width="200" height="100" alt="This alternative text is deliberately very long so that it exceeds the one hundred character recommendation used by crawlers">',
});
im(`${I}/good_alt`, 'Image with good alt', 'Descriptive alt text and explicit dimensions.', 'No image issues.', { body: '<img src="/images/photo.jpg" alt="Red coffee mug on a wooden desk" width="200" height="100">' });
im(`${I}/large_image`, 'Image over 100 KB', 'Embeds a ~360 KB BMP image.', '"Over 100 KB" image.', { body: '<img src="/images/large-photo.bmp" alt="Large uncompressed gradient image" width="400" height="300">' });
im(`${I}/broken_image`, 'Broken image', '<img> pointing to a 404 and to the wrong-case /images/logo_small.jpg.', 'Broken images (4xx).', {
  body: '<img src="/images/does-not-exist.png" alt="Missing image" width="10" height="10"><img src="/images/logo_small.jpg" alt="Wrong case logo" width="10" height="10">',
});
im(`${I}/missing_size_attributes`, 'Image missing width/height', '<img> without width and height attributes.', '"Missing size attributes" (CLS risk).', { body: '<img src="/images/photo.jpg" alt="Photo without dimensions">' });
im(`${I}/lazy_loaded_native`, 'Native lazy loading', '<img loading="lazy">.', 'Image discovered from src.', { body: '<img src="/images/photo.jpg" alt="Lazy loaded" loading="lazy" width="200" height="100">' });
im(`${I}/lazy_loaded_data_src`, 'JS lazy loading (data-src)', 'Image URL only in data-src; a script swaps it into src.', 'Without rendering only the placeholder is found; with JS rendering the real image appears.', {
  body: '<img src="/images/sample.gif" data-src="/images/large-photo.bmp" alt="JS lazy image" class="lazy" width="400" height="300">',
  bodyEnd: '<script>document.querySelectorAll("img.lazy").forEach(function(i){i.src=i.dataset.src;});</script>',
});
im(`${I}/srcset_and_picture`, 'srcset and <picture>', 'Responsive images via srcset and <picture><source>.', 'All candidate image URLs discovered.', {
  body: '<img src="/images/photo.jpg" srcset="/images/photo.jpg 1x, /images/large-photo.bmp 2x" alt="srcset image" width="200" height="100"><picture><source srcset="/images/sample.gif" type="image/gif"><img src="/images/photo.jpg" alt="picture fallback" width="200" height="100"></picture>',
});
im(`${I}/css_background_image`, 'CSS background image', 'Image only referenced in an inline style.', 'Not reported as <img>; found only if CSS is parsed.', { body: '<div style="width:200px;height:100px;background-image:url(/images/large-photo.bmp)"></div>' });
im(`${I}/inline_svg_and_data_uri`, 'Inline SVG and data: URI', 'Inline <svg> and an <img> with a base64 data URI.', 'data: URIs should not be crawled as URLs.', {
  body: '<svg width="40" height="40"><circle cx="20" cy="20" r="18" fill="#2457d6"/></svg><img alt="data uri" width="1" height="1" src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==">',
});
im(`${I}/external_image`, 'Image on another host', 'Image hosted on the alternate host.', 'External image link.', { body: `<img src="${ALT_ORIGIN}/external/image.jpg" alt="External image" width="10" height="10">` });

// ------------------------------------------------------------------ social tags
const s = group('social_tags');
const S = '/social_tags';
const og = (o) => Object.entries(o).map(([k, v]) => `<meta property="og:${k}" content="${esc(v)}">`).join('\n  ');
const tw = (o) => Object.entries(o).map(([k, v]) => `<meta name="twitter:${k}" content="${esc(v)}">`).join('\n  ');

s(`${S}/open_graph_tags`, 'Open Graph Tags', 'Complete og:title, og:type, og:url, og:image, og:description, og:site_name.', 'All OG properties extracted; no issues.', {
  head: og({ title: 'Open Graph Tags', type: 'website', url: `${ORIGIN}${S}/open_graph_tags`, image: `${ORIGIN}/images/photo.jpg`, description: 'A page with a complete set of Open Graph tags.', site_name: 'SEO Crawler Test Site' }),
});
s(`${S}/og_no_twitter`, 'OG Description, Title, Image, No Twitter', 'OG tags present, Twitter Card tags absent.', '"Missing Twitter Card" (Twitter falls back to OG).', {
  head: og({ title: 'OG only', description: 'OG description with no twitter tags.', image: `${ORIGIN}/images/photo.jpg` }),
});
s(`${S}/twitter_card_page/1`, 'Twitter Card Page 1', 'summary_large_image Twitter Card.', 'Twitter tags extracted.', {
  head: tw({ card: 'summary_large_image', site: '@crawlertest', title: 'Twitter Card Page 1', description: 'Twitter card description one.', image: `${ORIGIN}/images/photo.jpg` }),
});
s(`${S}/twitter_card_page/2`, 'Twitter Card Page 2', 'summary Twitter Card.', 'Twitter tags extracted.', {
  head: tw({ card: 'summary', title: 'Twitter Card Page 2', description: 'Twitter card description two.' }),
});
s(`${S}/max_twitter_card_description_length`, 'Max Twitter Card Description Length', 'twitter:description over 200 characters.', 'Twitter description too long.', {
  head: tw({ card: 'summary', title: 'Long twitter description', description: 'This Twitter card description is intentionally long. '.repeat(6).trim() }),
});
s(`${S}/missing_social_tags`, 'No social tags', 'No Open Graph and no Twitter Card tags.', '"Missing" OG and Twitter tags.');
s(`${S}/og_image_broken`, 'og:image is a 404', 'og:image points to a missing file.', 'Broken social image.', { head: og({ title: 'Broken OG image', image: `${ORIGIN}/images/og-missing.jpg` }) });
s(`${S}/og_image_relative`, 'Relative og:image', 'og:image uses a relative URL (must be absolute).', 'Invalid og:image.', { head: og({ title: 'Relative OG image', image: '/images/photo.jpg' }) });
s(`${S}/og_incomplete`, 'Incomplete Open Graph', 'Only og:title – missing og:image, og:url and og:type.', '"Missing required OG properties".', { head: og({ title: 'Incomplete OG' }) });
s(`${S}/og_name_instead_of_property`, 'OG with name= instead of property=', '<meta name="og:title"> (wrong attribute).', 'Often not detected as Open Graph.', { head: '<meta name="og:title" content="Wrong attribute OG title">' });
s(`${S}/twitter_invalid_card_type`, 'Invalid Twitter card type', 'twitter:card = "banner" (not a valid type).', 'Invalid Twitter card.', { head: tw({ card: 'banner', title: 'Invalid card' }) });
s(`${S}/duplicate_og_title`, 'Duplicate og:title', 'Two og:title tags with different values.', 'Multiple OG titles.', { head: og({ title: 'First OG title' }) + '\n  ' + '<meta property="og:title" content="Second OG title">' });

// ------------------------------------------------------------------ structured data
const sd = group('structured_data');
const SD = '/structured_data';
const ld = (o) => `<script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n</script>`;
const PRODUCT = { '@context': 'https://schema.org', '@type': 'Product', name: 'Test Coffee Mug', image: `${ORIGIN}/images/photo.jpg`, description: 'A mug for crawler tests.', sku: 'MUG-1', brand: { '@type': 'Brand', name: 'CrawlerCo' }, offers: { '@type': 'Offer', price: '12.99', priceCurrency: 'GBP', availability: 'https://schema.org/InStock', url: `${ORIGIN}${SD}/jsonld_product_valid` } };

sd(`${SD}/jsonld_product_valid`, 'JSON-LD Product (valid)', 'Valid schema.org Product with Offer.', 'Structured data valid; Product rich result eligible.', { head: ld(PRODUCT) });
sd(`${SD}/jsonld_invalid_syntax`, 'JSON-LD with syntax error', 'JSON-LD block with a trailing comma and missing brace.', '"Parse error" in structured data.', {
  head: '<script type="application/ld+json">{ "@context": "https://schema.org", "@type": "Organization", "name": "Broken JSON", </script>',
});
sd(`${SD}/jsonld_missing_required`, 'JSON-LD Product missing required name', 'Product without "name" and with an Offer missing price.', 'Validation errors: missing required properties.', {
  head: ld({ '@context': 'https://schema.org', '@type': 'Product', image: `${ORIGIN}/images/photo.jpg`, offers: { '@type': 'Offer', priceCurrency: 'GBP' } }),
});
sd(`${SD}/jsonld_unknown_type`, 'JSON-LD unknown @type', '@type "SuperProduct" does not exist in schema.org.', 'Validation error: unknown type.', { head: ld({ '@context': 'https://schema.org', '@type': 'SuperProduct', name: 'Not a real type' }) });
sd(`${SD}/jsonld_multiple_blocks`, 'Multiple JSON-LD blocks', 'Organization, WebSite (SearchAction) and BreadcrumbList in separate blocks.', 'Three structured data items detected.', {
  head: [
    ld({ '@context': 'https://schema.org', '@type': 'Organization', name: 'SEO Crawler Test Site', url: ORIGIN + '/', logo: `${ORIGIN}/images/photo.jpg` }),
    ld({ '@context': 'https://schema.org', '@type': 'WebSite', url: ORIGIN + '/', potentialAction: { '@type': 'SearchAction', target: `${ORIGIN}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' } }),
    ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: ORIGIN + '/' }, { '@type': 'ListItem', position: 2, name: 'Structured data', item: `${ORIGIN}/tests/structured_data` }] }),
  ].join('\n  '),
});
sd(`${SD}/jsonld_graph`, 'JSON-LD @graph', 'Article and Person linked through @graph and @id.', 'Graph items parsed and validated.', {
  head: ld({ '@context': 'https://schema.org', '@graph': [{ '@type': 'Article', '@id': '#article', headline: 'Graph article', datePublished: '2026-01-15', author: { '@id': '#jane' }, image: `${ORIGIN}/images/photo.jpg` }, { '@type': 'Person', '@id': '#jane', name: 'Jane Doe' }] }),
});
sd(`${SD}/jsonld_faq`, 'JSON-LD FAQPage', 'FAQPage with two questions.', 'FAQ structured data detected.', {
  head: ld({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: 'What is this?', acceptedAnswer: { '@type': 'Answer', text: 'A crawler test.' } }, { '@type': 'Question', name: 'Is it local?', acceptedAnswer: { '@type': 'Answer', text: 'Yes.' } }] }),
});
sd(`${SD}/jsonld_in_body`, 'JSON-LD in body', 'Valid JSON-LD placed at the end of <body>.', 'Detected (JSON-LD is valid anywhere).', { bodyEnd: ld({ '@context': 'https://schema.org', '@type': 'Event', name: 'Crawler Conference', startDate: '2026-11-20T09:00', location: { '@type': 'Place', name: 'Online', address: 'Online' } }) });
sd(`${SD}/jsonld_http_context`, 'JSON-LD with http:// context and wrong types', 'Uses http://schema.org and a string where a number is expected.', 'Warnings for value types.', { head: ld({ '@context': 'http://schema.org', '@type': 'Product', name: 'Mug', aggregateRating: { '@type': 'AggregateRating', ratingValue: 'five', reviewCount: 'many' } }) });
sd(`${SD}/microdata_valid`, 'Microdata Product', 'Product marked up with itemscope/itemprop.', 'Microdata detected and valid.', {
  body: `<div itemscope itemtype="https://schema.org/Product"><span itemprop="name">Microdata Mug</span><img itemprop="image" src="/images/photo.jpg" alt="mug" width="10" height="10"><div itemprop="offers" itemscope itemtype="https://schema.org/Offer"><span itemprop="price" content="9.99">£9.99</span><meta itemprop="priceCurrency" content="GBP"></div></div>`,
});
sd(`${SD}/microdata_invalid`, 'Microdata with invalid property', 'itemprop that does not belong to the item type.', 'Validation error (property not recognised).', {
  body: '<div itemscope itemtype="https://schema.org/Person"><span itemprop="name">Bob</span><span itemprop="horsepower">300</span></div>',
});
sd(`${SD}/rdfa_valid`, 'RDFa Person', 'Person marked up with vocab/typeof/property.', 'RDFa detected.', {
  body: '<div vocab="https://schema.org/" typeof="Person"><span property="name">Ada Lovelace</span>, <span property="jobTitle">Mathematician</span></div>',
});
sd(`${SD}/no_structured_data`, 'No structured data', 'Page without any structured data.', '"Missing structured data".');
