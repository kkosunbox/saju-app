import { useState, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

export type InstallDevice = 'ios' | 'android' | 'desktop';
type InstallPrompt = Event & {
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>;
};
type InstallWindow = Window & {
  woonpickInstallPrompt?: InstallPrompt;
  woonpickWebInstalled?: boolean;
};
type InstallNavigator = Navigator & { install?(): Promise<unknown> };

// Enable once the Korean App Store listing is available to the public.
export const APP_STORE_LIVE = process.env.EXPO_PUBLIC_WOONPICK_APP_STORE_LIVE === 'true';

const DISPLAY_MODE = '(display-mode: standalone)';
const FORTUNE_PROMPT_KEY = 'woonpick:fortune-install:v1';
const FORTUNE_PROMPT_INTERVAL = 7 * 24 * 60 * 60 * 1000;
let lastFortunePrompt = 0;

export function isIosChrome(userAgent: string) {
  return /\bCriOS\//i.test(userAgent);
}

function getInstallDevice(): InstallDevice | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const browser = window as InstallWindow;
  const nav = browser.navigator as Navigator & { standalone?: boolean };
  if (browser.woonpickWebInstalled || nav.standalone || browser.matchMedia(DISPLAY_MODE).matches) return null;
  if (isIosChrome(nav.userAgent) || /iPhone|iPad|iPod/i.test(nav.userAgent)
    || (/Macintosh/i.test(nav.userAgent) && nav.maxTouchPoints > 1)) return 'ios';
  return /Android/i.test(nav.userAgent) ? 'android' : 'desktop';
}

function subscribeToInstall(onChange: () => void) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return () => {};
  const displayMode = window.matchMedia(DISPLAY_MODE);
  displayMode.addEventListener('change', onChange);
  window.addEventListener('appinstalled', onChange);
  return () => {
    displayMode.removeEventListener('change', onChange);
    window.removeEventListener('appinstalled', onChange);
  };
}

const getServerDevice = () => null;

export function useInstallDevice() {
  return useSyncExternalStore(subscribeToInstall, getInstallDevice, getServerDevice);
}

async function requestWebInstall() {
  const browser = window as InstallWindow;
  const navigator = browser.navigator as InstallNavigator;
  // This call must happen within the button gesture, before any await.
  if (typeof navigator.install === 'function') {
    try {
      await navigator.install();
      return 'handled';
    } catch (error) {
      return error instanceof DOMException && error.name === 'AbortError' ? 'cancelled' : 'unavailable';
    }
  }

  const event = browser.woonpickInstallPrompt;
  if (!event) return 'unavailable';
  delete browser.woonpickInstallPrompt;
  try {
    const choice = await event.prompt();
    return choice?.outcome === 'dismissed' ? 'cancelled' : 'handled';
  } catch {
    return 'unavailable';
  }
}

export function useWebInstallRequest(onUnavailable: () => void, onHandled?: () => void) {
  const [requesting, setRequesting] = useState(false);
  const install = async () => {
    setRequesting(true);
    const result = await requestWebInstall();
    setRequesting(false);
    if (result === 'unavailable') onUnavailable();
    if (result === 'handled') onHandled?.();
  };
  return { install, requesting };
}

export function reserveFortuneInstallPrompt(now = Date.now()) {
  if (now - lastFortunePrompt < FORTUNE_PROMPT_INTERVAL) return false;
  try {
    if (now - Number(window.localStorage.getItem(FORTUNE_PROMPT_KEY)) < FORTUNE_PROMPT_INTERVAL) return false;
    window.localStorage.setItem(FORTUNE_PROMPT_KEY, String(now));
  } catch {
    // Keep the cooldown for this page load when browser storage is disabled.
  }
  lastFortunePrompt = now;
  return true;
}
