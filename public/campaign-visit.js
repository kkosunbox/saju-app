(() => {
  const endpoint = document.currentScript.dataset.apiUrl + '/v1/campaign-visits';
  // Expo Router can replace the landing URL while the script downloads.
  const entry = performance.getEntriesByType('navigation')[0];
  const landing = new URL(entry?.name ?? window.location.href);

  function channelForVisit() {
    const { pathname, searchParams: params } = landing;
    const path = pathname.replace(/\/$/, '');
    if (path.startsWith('/auth/callback/') || /^\/oauth\/[^/]+\/callback$/.test(path)) return;
    if ((path === '/charge' || path === '/subscribe') && params.has('result')) return;
    if (path === '/subscription' && params.has('card')) return;

    const source = params.get('utm_source');
    const medium = params.get('utm_medium');
    const campaign = params.get('utm_campaign');
    const isInstagram = source === 'ig' || source === 'instagram';
    if (isInstagram && medium === 'paid_social') return 'instagram_ads';
    if (isInstagram && medium === 'social' &&
        (params.get('utm_content') === 'link_in_bio' || campaign === 'profile')) {
      return 'instagram_profile';
    }
    if (source === 'youtube' && medium === 'social' && campaign === 'profile') return 'youtube_profile';

    const paidSearch = medium === 'cpc' || medium === 'ppc' || medium === 'paid_search' || medium === 'paidsearch';
    if (params.has('gclid') || params.has('gbraid') || params.has('wbraid') ||
        (source === 'google' && paidSearch)) {
      return 'google_ads';
    }

    if (!document.referrer) return 'direct_unknown';
    const host = new URL(document.referrer).hostname.replace(/^www\./, '');
    if (host === landing.hostname.replace(/^www\./, '')) return;
    if (paidSearch || params.has('msclkid')) return 'other_referral';

    // Cross-site referrers typically contain only the origin.
    if (/^google\.(?:com|co\.kr|co\.jp|co\.uk|com\.au|co\.in|ca|de|fr)$/.test(host)) return 'google_search';
    if (host === 'search.naver.com' || host === 'm.search.naver.com') return 'naver_search';
    if (host === 'bing.com' || host === 'duckduckgo.com' ||
        host === 'search.daum.net' || host === 'm.search.daum.net' ||
        host === 'search.yahoo.com' || host.endsWith('.search.yahoo.com')) {
      return 'other_search';
    }
    return 'other_referral';
  }

  const channel = channelForVisit();
  if (!channel) return;

  function recordVisit() {
    const key = 'woonpick:campaign-visit:' + channel;
    const now = Date.now();
    const sessionLength = 30 * 60 * 1000;
    let previous;
    try {
      previous = JSON.parse(sessionStorage.getItem(key));
    } catch {
      // Tracking still works when browser storage is unavailable.
    }
    const activeVisit = previous?.id && now - previous.startedAt < sessionLength ? previous : null;
    if (activeVisit?.sent) return;
    if (!activeVisit && (entry?.type === 'reload' || entry?.type === 'back_forward')) return;
    const visit = activeVisit ?? { id: crypto.randomUUID(), startedAt: now };

    function saveVisit(sent) {
      try {
        sessionStorage.setItem(key, JSON.stringify({ ...visit, sent }));
      } catch {
        // Session storage only helps deduplicate repeated loads in this tab.
      }
    }

    saveVisit(false);
    fetch(endpoint, {
      method: 'POST',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: visit.id, channel }),
      keepalive: true,
    }).then((response) => {
      if (response.ok) saveVisit(true);
    }).catch(() => {});
  }

  if (document.prerendering) {
    document.addEventListener('prerenderingchange', recordVisit, { once: true });
  } else {
    recordVisit();
  }
})();
