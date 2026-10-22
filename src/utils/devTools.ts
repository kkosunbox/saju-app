import { Platform } from 'react-native';

/**
 * 테스트용 버튼을 보여도 되는 환경인지 — local(개발 서버)과 dev(dev.woonpick.com · 내부 배포 앱)에서만.
 * 모르는 곳(운영·미리보기 주소)에선 숨긴다.
 */
const DEV_HOSTS = ['localhost', '127.0.0.1', 'dev.woonpick.com'];
const DEV_WEB_URL = 'https://dev.woonpick.com';

export const DEV_TOOLS =
  __DEV__ ||
  (Platform.OS === 'web'
    ? typeof location !== 'undefined' && DEV_HOSTS.includes(location.hostname)
    : process.env.EXPO_PUBLIC_WEB_URL === DEV_WEB_URL);
