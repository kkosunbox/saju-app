(() => {
  const endpoint = document.currentScript.dataset.apiUrl + '/v1/campaign-visits';
  // Expo Router can replace the landing URL while the script downloads.
  const entry = performance.getEntriesByType('navigation')[0];
  const params = new URL(entry?.name ?? window.location.href).searchParams;
  const source = params.get('utm_source');
  const medium = params.get('utm_medium');
  const campaign = params.get('utm_campaign');
  const isInstagram = source === 'ig' || source === 'instagram';
  let channel;
  if (isInstagram && medium === 'paid_social') {
    channel = 'instagram_ads';
  } else if (isInstagram && medium === 'social' &&
      (params.get('utm_content') === 'link_in_bio' || campaign === 'profile')) {
    channel = 'instagram_profile';
  } else if (source === 'youtube' && medium === 'social' && campaign === 'profile') {
    channel = 'youtube_profile';
  } else {
    return;
  }

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
    if (previous?.sent && now - previous.startedAt < sessionLength) return;
    const visit = previous?.id && now - previous.startedAt < sessionLength
      ? previous
      : { id: crypto.randomUUID(), startedAt: now };

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
