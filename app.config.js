/**
 * app.json + 소셜 로그인 키. 키는 빌드가 바라보는 서버(EXPO_PUBLIC_API_URL, eas.json의 빌드 프로필)로 고른다:
 * 운영 서버(production)는 운영 앱 키, 그 밖(preview · store-test · 로컬)은 dev 앱 키.
 * 앱 코드는 extra.social 을 읽는다 (src/services/server/nativeSocialAuth.native.ts).
 * 네이버 키는 저장소에 두지 않고 EAS 환경변수 NAVER_CONSUMER_KEY · NAVER_CONSUMER_SECRET 에서 읽는다
 * (eas.json 프로필의 environment: production 은 운영 앱, preview 는 dev 앱 값). 웹(Vercel)은 쓰지 않는다.
 */
const PROD = process.env.EXPO_PUBLIC_API_URL === 'https://api.woonpick.com';

const KEYS = {
  prod: {
    kakaoNativeAppKey: '2506a57680585b4a68e9bb7ff43c5987', // 카카오 앱 '운Pick' (1612820)
  },
  dev: {
    kakaoNativeAppKey: 'b7e6f6f3cb763483af8b91a10b6dc517', // 카카오 앱 '운Pick-TEST' (1612825)
  },
}[PROD ? 'prod' : 'dev'];

const NAVER = { consumerKey: process.env.NAVER_CONSUMER_KEY ?? '', consumerSecret: process.env.NAVER_CONSUMER_SECRET ?? '' };
// EAS 빌드에서 빠지면 네이버 로그인이 앱에서 조용히 실패하니 빌드를 멈춘다
if (process.env.EAS_BUILD && !(NAVER.consumerKey && NAVER.consumerSecret)) {
  throw new Error('NAVER_CONSUMER_KEY / NAVER_CONSUMER_SECRET are missing from this EAS environment');
}

// 구글은 모든 빌드가 운영 GCP 프로젝트(saju-512803)의 클라이언트를 쓴다.
// Android 클라이언트(패키지명 + SHA-1)는 GCP 프로젝트 하나에만 만들 수 있어서, dev 서버도 이 클라이언트를 받는다.
const GOOGLE = {
  webClientId: '648499572638-ra041qfdmnn7slqa0a895gkbnkfc1vfs.apps.googleusercontent.com',
  iosClientId: '648499572638-3lpm4dl9tvqscpvfcut4g1a5qgp6973m.apps.googleusercontent.com',
  iosUrlScheme: 'com.googleusercontent.apps.648499572638-3lpm4dl9tvqscpvfcut4g1a5qgp6973m',
};

/** 네이버 개발자센터 iOS 환경에 등록한 URL Scheme */
const NAVER_URL_SCHEME = 'woonpicknaverlogin';

module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...config.plugins,
    // 카카오 Android SDK는 Maven Central에 없다
    ['expo-build-properties', { android: { extraMavenRepos: ['https://devrepo.kakao.com/nexus/content/groups/public/'] } }],
    // iOS 로그인 복귀 URL은 아래 SceneDelegate 플러그인이 받는다 (handleKakaoOpenUrl 은 AppDelegate 전용이라 쓰지 않음)
    ['@react-native-kakao/core', { nativeAppKey: KEYS.kakaoNativeAppKey, android: { authCodeHandlerActivity: true }, ios: {} }],
    './plugins/withKakaoAndroidCompileSdk',
    ['@react-native-seoul/naver-login', { urlScheme: NAVER_URL_SCHEME }],
    ['@react-native-google-signin/google-signin', { iosUrlScheme: GOOGLE.iosUrlScheme }],
    ['./plugins/withSocialLoginScene', { naverUrlScheme: NAVER_URL_SCHEME }],
  ],
  extra: {
    ...config.extra,
    social: {
      kakaoNativeAppKey: KEYS.kakaoNativeAppKey,
      naver: { ...NAVER, urlScheme: NAVER_URL_SCHEME },
      google: { webClientId: GOOGLE.webClientId, iosClientId: GOOGLE.iosClientId },
    },
  },
});
