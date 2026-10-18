// /titles/* and /description_tags/*

const { group } = require('../registry');


const t = group('titles');
const T = '/titles';

t(`${T}/missing_title`, 'Missing title', 'No <title> element at all.', '"Missing" page title.', { title: null, h1: 'Missing title', description: 'This page has no title element.' }, { label: 'Missing title' });
t(`${T}/empty_title`, 'Empty title', '<title></title> with no text.', '"Missing"/empty page title.', { titleTag: '<title></title>', h1: 'Empty title', description: 'This page has an empty title element.' });
t(`${T}/whitespace_only_title`, 'Whitespace-only title', '<title>   </title>.', 'Treated as missing/empty title.', { titleTag: '<title>   \n  </title>', h1: 'Whitespace-only title', description: 'Title contains only whitespace.' });
for (const slug of ['duplicate_title', 'duplicate_title/foo', 'duplicate_title/bar', 'duplicate_title/baz']) {
  t(`${T}/${slug}`, 'Duplicate title', 'Four pages share the exact title "Duplicate title".', '"Duplicate" page titles (4 URLs).', { h1: `Duplicate title – ${slug}` }, { label: `Duplicate title (${slug})` });
}
for (const slug of ['duplicate_title_and_noindex/bak', 'duplicate_title_and_noindex/bat']) {
  t(`${T}/${slug}`, 'Duplicate title', 'Same duplicate title but the page is noindex.', 'Non-indexable; should be excluded from duplicate-title counts.', { robots: 'noindex', h1: `Duplicate title (noindex) – ${slug}` }, { label: `Duplicate title + noindex (${slug})` });
}
t(`${T}/title_over_max`, 'x'.repeat(80), 'Title of 80 characters.', '"Over 60 characters" and "Over 561 pixels".', { h1: 'Title over maximum length' }, { label: 'Title over max (80 chars)' });
t(`${T}/title_wide_characters`, 'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW', 'Only 43 characters but very wide glyphs.', 'Under 60 chars yet "Over 561 pixels" – pixel width matters.', { h1: 'Wide character title' }, { label: 'Title with wide characters' });
t(`${T}/title_narrow_characters`, 'iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiil', '71 characters of narrow glyphs.', '"Over 60 characters" but under the pixel limit.', { h1: 'Narrow character title' }, { label: 'Title with narrow characters' });
t(`${T}/title_warning`, 'Some page title that is between 480 and 512 pixel wide', 'Title close to the pixel truncation limit.', 'Within limits but close to truncation.', { h1: 'Title near the pixel limit' }, { label: 'Title near pixel limit' });
t(`${T}/title_below_min`, 'Hi', 'Title of two characters.', '"Below 30 characters" / "Below 200 pixels".', { h1: 'Short title page' }, { label: 'Title too short' });
t(`${T}/page_title_length_n`, 'Page Title Length', 'Title length set by ?n= (default 70). Try ?n=10, ?n=200.', 'Length reported equals n.', {}, {
  handler: undefined,
  page: (ctx) => {
    const n = Math.min(Number(ctx.query.get('n')) || 70, 5000);
    return { title: 'a'.repeat(n), h1: `Title with ${n} characters` };
  },
  href: `${T}/page_title_length_n?n=70`,
});
t(`${T}/page_title_width_n`, 'Page Title width', 'Title of n "W" characters set by ?n= (default 30).', 'Pixel width scales with n.', {}, {
  page: (ctx) => {
    const n = Math.min(Number(ctx.query.get('n')) || 30, 1000);
    return { title: 'W'.repeat(n), h1: `Title with ${n} W characters` };
  },
  href: `${T}/page_title_width_n?n=30`,
});
t(`${T}/page_title_leading_trailing_spaces`, 'Page Title Leading/Trailing Spaces', '<title>   text   </title>.', 'Title trimmed; whitespace issue may be flagged.', { titleTag: '<title>   Page Title Leading/Trailing Spaces   </title>' });
t(`${T}/title_with_whitespace`, 'Title with whitespace', 'Title containing newlines, tabs and runs of spaces.', 'Whitespace collapsed when reported.', {
  titleTag: '<title>Title\n\nwith    extra   whitespace\n\n  randomstring</title>',
  h1: 'Title with extra whitespace',
});
t(`${T}/double_triple_quadruple_spaces`, 'Double  Triple   Quadruple    Spaces', 'Multiple consecutive spaces in the title.', 'Reported with collapsed or preserved spaces depending on the tool.');
t(`${T}/forced_double_triple_quadruple_spaces`, 'Forced Double  Triple   Quadruple    Spaces', 'Spaces forced with &amp;nbsp; entities.', 'Non-breaking spaces preserved.', {
  titleTag: '<title>Forced Double&nbsp; Triple&nbsp;&nbsp; Quadruple&nbsp;&nbsp;&nbsp; Spaces</title>',
});
t(`${T}/svg_title`, 'SVG title only', 'No <title> in the head – only a <title> inside an inline <svg>.', 'Missing page title (SVG title must not be used).', {
  title: null,
  h1: 'SVG title only',
  description: 'The only title element on this page is inside an SVG.',
  body: '<svg width="120" height="40" xmlns="http://www.w3.org/2000/svg"><title>SVG Title Should Not Count</title><rect width="120" height="40" fill="#2457d6"/></svg>',
});
t(`${T}/title_in_body`, 'Title in body only', 'The <title> element is placed in the body.', 'document.title still returns "Title Placed In The Body", so the title is reported; flag it as "title outside <head>".', {
  title: null,
  h1: 'Title in body',
  description: 'The title element on this page is inside the body.',
  body: '<title>Title Placed In The Body</title>',
});
t(`${T}/multiple_titles`, 'First title', 'Two <title> elements in the head.', '"Multiple" titles (Title 1 and Title 2).', { head: '<title>Second title</title>', h1: 'Multiple titles' });
t(`${T}/title_same_as_h1`, 'Title Same As H1', 'Title text identical to H1.', '"Same as H1" reported.', { h1: 'Title Same As H1' });
t(`${T}/title_with_entities`, 'Fish & Chips – “Quotes” © 2026', 'Title with HTML entities and typographic characters.', 'Entities decoded: Fish & Chips – “Quotes” © 2026.', {
  titleTag: '<title>Fish &amp; Chips &ndash; &ldquo;Quotes&rdquo; &copy; 2026</title>',
  h1: 'Title with entities',
});
t(`${T}/title_with_emoji`, '🚀 Rocket Launch Title 🚀', 'Title containing emoji.', 'Emoji preserved; pixel width estimated.', { h1: 'Title with emoji' });
t(`${T}/title_with_html_tags`, 'Title with HTML tags', 'Raw <b> tags inside <title> (title is RCDATA, so tags are text).', 'Title reported literally including "<b>".', { titleTag: '<title>Title with <b>bold</b> tags</title>' });
t(`${T}/pipe_separated_brand_title`, 'Keyword Phrase | Category | Brand Name | Another Brand Segment Here', 'Long branded title with separators.', 'Over 60 characters.', { h1: 'Branded title' });

// ------------------------------------------------------------------ descriptions
const d = group('description_tags');
const D = '/description_tags';
d(`${D}/missing_description`, 'Description Tag Missing', 'No meta description.', '"Missing" meta description.', { description: null });
d(`${D}/empty_description`, 'Description Tag Empty', '<meta name="description" content="">.', 'Missing/empty meta description.', { description: '' });
d(`${D}/no_description_nosnippet`, 'Description Tag Missing With Meta Nosnippet', 'No description, but nosnippet is set.', 'Missing description (but snippets are disabled anyway).', { description: null, robots: 'nosnippet' });
d(`${D}/description_over_max`, 'Description Tag Too Long', 'Meta description of ~320 characters.', '"Over 155 characters" / "Over 985 pixels".', {
  description: 'This meta description is deliberately far too long so that crawlers flag it as exceeding the recommended length. '.repeat(3).trim(),
});
d(`${D}/short_meta_description`, 'Short Meta Description', 'Meta description of 9 characters.', '"Below 70 characters".', { description: 'Too short' });
d(`${D}/duplicate_description`, 'Description Tag Duplicate', 'Shares its description with /duplicate_description/foo.', '"Duplicate" meta description.', { description: 'Description Tag Duplicate' });
d(`${D}/duplicate_description/foo`, 'Description Tag Duplicate foo', 'Same description as /duplicate_description.', '"Duplicate" meta description.', { description: 'Description Tag Duplicate' });
d(`${D}/duplicate_description_and_noindex`, 'Description Tag Duplicate (noindex)', 'Duplicate description on a noindex page.', 'Non-indexable; excluded from duplicate counts.', { description: 'Duplicate description on noindex pages', robots: 'noindex' });
d(`${D}/duplicate_description_and_noindex/foo`, 'Description Tag Duplicate foo (noindex)', 'Duplicate description on a second noindex page.', 'Non-indexable.', { description: 'Duplicate description on noindex pages', robots: 'noindex' });
d(`${D}/description_with_whitespace`, 'Description Tag With Whitespace', 'Description with newlines and runs of spaces.', 'Whitespace collapsed when reported.', { description: '\n   Description    with\n\n  lots   of\twhitespace   inside   it  \n' });
d(`${D}/description_http_equiv`, 'HTTP-equiv description', '<meta http-equiv="description" content="…"> instead of name="description".', 'Missing description (http-equiv is not valid for descriptions).', {
  description: null,
  head: '<meta http-equiv="description" content="This description uses http-equiv instead of name">',
});
d(`${D}/multiple_descriptions`, 'Multiple Description Tags', 'Two meta description tags.', '"Multiple" descriptions (Description 1 and 2).', {
  description: 'First description tag on this page with enough characters to be in range.',
  head: '<meta name="description" content="Second description tag on this page – crawlers should flag multiples.">',
});
d(`${D}/description_in_body`, 'Description in body', 'Meta description placed inside <body>.', 'Description outside head.', {
  description: null,
  body: '<meta name="description" content="This description is in the body, which is invalid.">',
});
d(`${D}/description_same_as_title`, 'Description Same As Title', 'Description text equals the title.', 'Short / same-as-title description.', { description: 'Description Same As Title' });
d(`${D}/description_uppercase_name`, 'Description NAME uppercase', '<META NAME="DESCRIPTION" CONTENT="…">.', 'Description detected (attribute names/values are case-insensitive).', {
  description: null,
  head: '<META NAME="DESCRIPTION" CONTENT="Uppercase meta description tag that should still be detected by crawlers.">',
});
d(`${D}/description_with_html`, 'Description with HTML entities', 'Description containing &amp;, &quot; and an emoji.', 'Entities decoded in the report.', { description: 'Tom & Jerry "quoted" text 🚀 – entities and emoji inside a meta description.' });
d(`${D}/description_meta_keywords`, 'Meta Keywords tag', 'Page with a legacy meta keywords tag.', 'Meta keywords reported (ignored by Google).', { head: '<meta name="keywords" content="seo, crawler, test, keywords">' });
d(`${D}/description_variable_n`, 'Description length n', 'Description length set by ?n= (default 160).', 'Length reported equals n.', {}, {
  page: (ctx) => ({ description: 'd'.repeat(Math.min(Number(ctx.query.get('n')) || 160, 5000)) }),
  href: `${D}/description_variable_n?n=160`,
});
