import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { requestData } from '@/api/client';

const WEB_BROWSERS = [
  [/SamsungBrowser\//, 'Samsung Internet'],
  [/Edg(?:A|iOS)?\//, 'Edge'],
  [/OPR\/|OPT\//, 'Opera'],
  [/Firefox\/|FxiOS\//, 'Firefox'],
  [/Chrome\/|CriOS\//, 'Chrome'],
  [/Safari\//, 'Safari'],
] as const;

function deviceInfo() {
  const platform = Platform.OS;
  const device = {
    modelName: Device.modelName?.trim().slice(0, 120) || undefined,
    osVersion: Device.osVersion?.trim().slice(0, 40) || undefined,
  };
  if (platform === 'ios' || platform === 'android') {
    return {
      ...device,
      platform,
      osName: platform === 'ios' ? 'iOS' : 'Android',
      appVersion: Constants.expoConfig?.version?.slice(0, 40),
    };
  }

  if (platform !== 'web' || typeof window === 'undefined') return;
  const navigator = window.navigator as Navigator & { standalone?: boolean };
  const standalone = navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  return {
    ...device,
    platform: standalone ? 'pwa' : 'web',
    osName: Device.osName?.trim().slice(0, 40) || undefined,
    browser: WEB_BROWSERS.find(([pattern]) => pattern.test(navigator.userAgent))?.[1],
  };
}

export function useReportAppDevice(accountKey: string | undefined) {
  useEffect(() => {
    if (accountKey === undefined) return;
    const device = deviceInfo();
    if (!device) return;

    let pending = false;
    async function report() {
      if (pending) return;
      pending = true;
      try {
        await requestData('/v1/auth/user/app-device', device, 'PUT');
      } catch {
        // 접속 환경 기록 실패는 앱 이용에 영향을 주지 않는다. 다시 열면 재시도한다.
      } finally {
        pending = false;
      }
    }

    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void report();
    });
    if (AppState.currentState == null || AppState.currentState === 'active') void report();
    return () => subscription.remove();
  }, [accountKey]);
}
