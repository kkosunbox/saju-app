import { GLOBAL_CSS, PRETENDARD_STYLESHEET } from './webDocumentStyles';

// SPA development does not render +html.tsx. Install the same typography before
// React mounts. Static production HTML already contains these styles.
if (typeof document !== 'undefined' && !document.getElementById('woonpick-global-css')) {
  document.documentElement.lang = 'ko';
  const style = document.createElement('style');
  style.id = 'woonpick-global-css';
  style.textContent = GLOBAL_CSS;
  document.head.appendChild(style);
  const font = document.createElement('link');
  font.rel = 'stylesheet';
  font.href = PRETENDARD_STYLESHEET;
  document.head.appendChild(font);
  const viewport = document.querySelector('meta[name="viewport"]');
  viewport?.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no, viewport-fit=cover');
  try {
    if (localStorage.getItem('onulna:onboarded') === '1') {
      document.documentElement.setAttribute('data-returning', '');
    }
  } catch {
    // Storage may be disabled in the browser.
  }
}
