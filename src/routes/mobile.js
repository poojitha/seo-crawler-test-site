// /mobile/* – responsive, dynamic serving, separate mobile URLs (m-dot on ALT host) and AMP.
// The desktop page lives on ORIGIN; its "m-dot" twin is the same path on ALT_ORIGIN.

const { group } = require('../registry');
const { render, words } = require('../html');
const { ORIGIN, ALT_ORIGIN } = require('../config');

const t = group('mobile');
const M = '/mobile';
const MEDIA = 'only screen and (max-width: 640px)';
const desk = (slug) => `${ORIGIN}${M}/${slug}`;
const mob = (slug) => `${ALT_ORIGIN}${M}/${slug}`;
const amp = (slug) => `${ORIGIN}${M}/amp/${slug}`;
const altLink = (href, media = MEDIA) => `<link rel="alternate" media="${media}" href="${href}">`;
const ampLink = (href) => `<link rel="amphtml" href="${href}">`;

const AMP_BOILERPLATE =
  '<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;animation:none}</style></noscript>\n  <script async src="https://cdn.ampproject.org/v0.js"></script>';

function ampPage(title, canonical, { valid = true, extraHead = '' } = {}) {
  return render({
    title,
    htmlTag: '<html ⚡ lang="en">',
    css: false,
    canonical,
    head: (valid ? AMP_BOILERPLATE : '') + (extraHead ? '\n  ' + extraHead : ''),
    body: '<p>AMP version of the page.</p>',
    cat: 'mobile',
  });
}

/*
 * Desktop + mobile test.
 * desktop(ctx) / mobile(ctx) return render options; the mobile variant is used when the
 * request hits ALT_HOST (m-dot) or when `dynamic` and the UA looks mobile.
 */
function dm(slug, title, test, expect, { desktop = {}, mobile = null, dynamic = false } = {}, extra = {}) {
  t(`${M}/${slug}`, title, test, expect, {}, {
    ...extra,
    page: (ctx) => {
      const isMobileUA = /Mobile|Android|iPhone/i.test(ctx.req.headers['user-agent'] || '');
      if (mobile && (ctx.alt || (dynamic && isMobileUA))) return { ...mobile, headers: { ...(dynamic ? { Vary: 'User-Agent' } : {}), ...(mobile.headers || {}) } };
      return { ...desktop, headers: { ...(dynamic ? { Vary: 'User-Agent' } : {}), ...(desktop.headers || {}) } };
    },
  });
}

dm('responsive', 'Responsive only page', 'Single URL with a viewport meta tag.', 'Mobile-friendly; no alternate needed.', { desktop: {} });
dm('no_mobile_configuration', 'No mobile page only', 'No viewport meta tag and no mobile alternate.', '"Viewport not set" / not mobile-friendly.', { desktop: { viewport: false } });
dm('fixed_width_viewport', 'Fixed-width viewport', '<meta name="viewport" content="width=1024">.', 'Viewport not set to device-width.', { desktop: { viewport: false, head: '<meta name="viewport" content="width=1024">' } });
dm('dynamic', 'Dynamic only page', 'Same URL serves different HTML to mobile user agents (Vary: User-Agent).', 'Vary: User-Agent header; mobile UA receives the mobile HTML.', {
  dynamic: true,
  desktop: { canonical: desk('dynamic'), body: '<p>Desktop HTML.</p>' },
  mobile: { title: 'Dynamic only page (mobile HTML)', canonical: desk('dynamic'), body: '<p>Mobile HTML served dynamically.</p>' },
});

dm('separate_desktop', 'Separate desktop, mobile and AMP', 'Desktop with rel=alternate media to m-dot and rel=amphtml; both point back.', 'Valid separate-mobile + AMP configuration.', {
  desktop: { canonical: desk('separate_desktop'), head: altLink(mob('separate_desktop')) + '\n  ' + ampLink(amp('separate_desktop')) },
  mobile: { canonical: desk('separate_desktop'), head: ampLink(amp('separate_desktop')) },
});
dm('separate_desktop_with_different_title', 'Separate Desktop with different title', 'm-dot version has a different title.', '"Mobile/desktop title mismatch".', {
  desktop: { canonical: desk('separate_desktop_with_different_title'), head: altLink(mob('separate_desktop_with_different_title')) },
  mobile: { title: 'A Completely Different Mobile Title', canonical: desk('separate_desktop_with_different_title') },
});
dm('separate_desktop_with_different_h1', 'Desktop and Mobile pages with different H1 tags', 'm-dot version has a different H1.', '"Mobile/desktop H1 mismatch".', {
  desktop: { canonical: desk('separate_desktop_with_different_h1'), head: altLink(mob('separate_desktop_with_different_h1')) },
  mobile: { h1: 'Different Mobile H1', canonical: desk('separate_desktop_with_different_h1') },
});
dm('separate_desktop_with_different_wordcount', 'Desktop and Mobile pages with different wordcounts', 'Desktop has ~600 words, mobile ~50.', '"Content mismatch" between desktop and mobile (mobile-first indexing risk).', {
  desktop: { canonical: desk('separate_desktop_with_different_wordcount'), head: altLink(mob('separate_desktop_with_different_wordcount')), body: `<p>${words(500, 'desk-wc')}</p>` },
  mobile: { canonical: desk('separate_desktop_with_different_wordcount'), filler: false, body: '<p>Short mobile copy.</p>' },
});
dm('separate_desktop_with_different_links_out', 'Desktop and Mobile pages with different links out', 'Mobile version is missing links that desktop has.', '"Outlink mismatch" between desktop and mobile.', {
  desktop: { canonical: desk('separate_desktop_with_different_links_out'), head: altLink(mob('separate_desktop_with_different_links_out')), body: '<p><a href="/mobile/responsive">Responsive</a> <a href="/mobile/dynamic">Dynamic</a> <a href="/redirects/redirect_target">Target</a></p>' },
  mobile: { canonical: desk('separate_desktop_with_different_links_out'), body: '<p><a href="/mobile/responsive">Responsive</a></p>' },
});
dm('separate_desktop_with_different_links_in', 'Desktop and Mobile pages with different links in', 'Pair whose inlinks differ: only the desktop version is linked internally.', 'Inlink mismatch.', {
  desktop: { canonical: desk('separate_desktop_with_different_links_in'), head: altLink(mob('separate_desktop_with_different_links_in')) },
  mobile: { canonical: desk('separate_desktop_with_different_links_in') },
});
dm('separate_desktop_irregular_media', 'Separate Desktop with Meta Irregular Media Pixel Size', 'rel=alternate media="only screen and (max-width: 1280px)" (unusual breakpoint) and media="handheld".', 'Mobile alternate detected with an irregular media query.', {
  desktop: { head: altLink(mob('separate_desktop_irregular_media'), 'only screen and (max-width: 1280px)') + '\n  ' + altLink(mob('separate_desktop_irregular_media'), 'handheld') },
  mobile: { canonical: desk('separate_desktop_irregular_media') },
});
dm('separate_desktop_response_header_alt', 'Separate Desktop with Response Header Alt', 'Mobile alternate declared in the HTTP Link header.', 'HTTP mobile alternate detected.', {
  desktop: { headers: { Link: `<${mob('separate_desktop_response_header_alt')}>; rel="alternate"; media="${MEDIA}"` } },
  mobile: { canonical: desk('separate_desktop_response_header_alt') },
});
dm('separate_desktop_with_mobile_not_subdomain', 'Desktop with Mobile Page not on the subdomain', 'Mobile alternate is a different path on the SAME host.', 'Mobile alternate on same host.', {
  desktop: { canonical: desk('separate_desktop_with_mobile_not_subdomain'), head: altLink(desk('separate_mobile_with_mobile_not_subdomain')) },
});
dm('separate_mobile_with_mobile_not_subdomain', 'Mobile page on same host', 'Mobile page at /mobile/separate_mobile_with_mobile_not_subdomain canonicalising to desktop.', 'Canonicalised to the desktop URL.', {
  desktop: { canonical: desk('separate_desktop_with_mobile_not_subdomain') },
}, { listed: false, unlinkedReason: 'rel=alternate media target' });
dm('other_desktop_that_links_to_the_same_mobile_pages', 'Separate desktop that links to the same mobile', 'A second desktop page claims the same m-dot URL as /mobile/separate_desktop.', '"Multiple desktop URLs share one mobile URL".', {
  desktop: { canonical: desk('other_desktop_that_links_to_the_same_mobile_pages'), head: altLink(mob('separate_desktop')) },
});
dm('mobile_without_canonical_back', 'Mobile page without canonical back', 'Desktop points to m-dot, but the m-dot page has no canonical.', '"Missing canonical on mobile page".', {
  desktop: { head: altLink(mob('mobile_without_canonical_back')) },
  mobile: { canonical: undefined },
});
dm('desktop_with_self_canonical_mobile_and_amp', 'Desktop page, with mobile and AMP pages that self-canonicalise', 'The m-dot and AMP pages canonicalise to themselves instead of the desktop.', '"Mobile/AMP not canonicalised to desktop".', {
  desktop: { canonical: desk('desktop_with_self_canonical_mobile_and_amp'), head: altLink(mob('desktop_with_self_canonical_mobile_and_amp')) + '\n  ' + ampLink(amp('desktop_with_self_canonical_mobile_and_amp')) },
  mobile: { canonical: mob('desktop_with_self_canonical_mobile_and_amp') },
});
dm('desktop_with_AMP_as_mobile', 'Separate desktop and AMP, with AMP as mobile', 'rel=alternate media points to the AMP URL.', 'AMP page used as the mobile alternate.', {
  desktop: { canonical: desk('desktop_with_AMP_as_mobile'), head: altLink(amp('desktop_with_AMP_as_mobile')) + '\n  ' + ampLink(amp('desktop_with_AMP_as_mobile')) },
});
dm('amp_with_separate_mobile', 'AMP page with separate mobile', 'Desktop + m-dot + AMP where AMP canonicalises to desktop.', 'Valid three-way configuration.', {
  desktop: { canonical: desk('amp_with_separate_mobile'), head: altLink(mob('amp_with_separate_mobile')) + '\n  ' + ampLink(amp('amp_with_separate_mobile')) },
  mobile: { canonical: desk('amp_with_separate_mobile'), head: ampLink(amp('amp_with_separate_mobile')) },
});
dm('no_mobile_with_amp', 'Page with AMP not separate mobile', 'Non-responsive desktop page with an AMP version.', 'AMP detected; viewport missing on desktop.', {
  desktop: { viewport: false, canonical: desk('no_mobile_with_amp'), head: ampLink(amp('no_mobile_with_amp')) },
});
dm('responsive_with_amp', 'Responsive Page with AMP not separate mobile', 'Responsive page with an AMP version.', 'Valid responsive + AMP.', {
  desktop: { canonical: desk('responsive_with_amp'), head: ampLink(amp('responsive_with_amp')) },
});
dm('amp_with_no_mobile', 'Page with AMP (canonical elsewhere)', 'Canonicalises to /mobile/no_mobile_with_amp.', 'Canonicalised.', { desktop: { canonical: desk('no_mobile_with_amp') } });
dm('amp_with_responsive', 'Responsive Page with AMP (canonical elsewhere)', 'Canonicalises to /mobile/responsive_with_amp.', 'Canonicalised.', { desktop: { canonical: desk('responsive_with_amp') } });

// AMP documents
const AMPS = ['separate_desktop', 'amp_with_separate_mobile', 'no_mobile_with_amp', 'responsive_with_amp', 'desktop_with_AMP_as_mobile'];
for (const s of AMPS) {
  t(`${M}/amp/${s}`, `AMP – ${s}`, 'AMP document canonicalising to its desktop page.', 'Valid AMP; canonicalised to desktop.', {}, {
    listed: false,
    unlinkedReason: 'rel=amphtml target',
    handler: () => ampPage(`AMP – ${s}`, desk(s)),
  });
}
t(`${M}/amp/desktop_with_self_canonical_mobile_and_amp`, 'AMP self canonical', 'AMP page canonicalises to itself.', 'AMP not canonicalised to desktop.', {}, {
  listed: false,
  unlinkedReason: 'rel=amphtml target',
  handler: () => ampPage('AMP self canonical', amp('desktop_with_self_canonical_mobile_and_amp')),
});
t(`${M}/amp_no_references`, 'AMP only, no mobile self reference', 'AMP document with no canonical at all.', '"AMP missing canonical" (invalid AMP).', {}, { handler: () => ampPage('AMP only, no mobile self reference', undefined) });
t(`${M}/amp_as_desktop_amp_and_mobile`, 'AMP page as self referencing mobile', 'Standalone AMP page that is its own canonical (AMP-only site).', 'Valid AMP-first page.', {}, {
  handler: () => ampPage('AMP page as self referencing mobile', desk('amp_as_desktop_amp_and_mobile')),
});
t(`${M}/amp_invalid`, 'Invalid AMP page', 'Has the ⚡ attribute but lacks the AMP runtime and boilerplate.', 'AMP validation errors.', {}, {
  handler: () => ampPage('Invalid AMP page', desk('responsive'), { valid: false, extraHead: '<script src="/js/app.js"></script>' }),
});
