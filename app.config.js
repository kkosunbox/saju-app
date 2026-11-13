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

/**
 * Android 릴리스 빌드는 R8(난독화 · 축소, full mode)을 켜는데, 카카오 · 네이버 SDK는 Retrofit + Gson/Moshi 로
 * 토큰 응답을 읽으면서 필요한 keep 규칙을 AAR에 넣어 두지 않는다. 규칙이 없으면 모델 필드 이름이 바뀌고
 * Retrofit 제네릭 정보가 지워져서, 카카오는 로그인 콜백에서 앱이 죽고 네이버는 토큰 교환이 실패한다.
 * (구글은 Play 서비스라 영향이 없다.) 카카오 개발자 문서의 ProGuard 규칙 + 네이버 SDK 패키지 유지.
 */
const SOCIAL_PROGUARD_RULES = `
# 카카오 SDK
-keep class com.kakao.sdk.**.model.* { <fields>; }
-keep class * extends com.google.gson.TypeAdapter
-dontwarn org.bouncycastle.jsse.**
-dontwarn org.conscrypt.*
-dontwarn org.openjsse.**

# 네이버 로그인 SDK
-keep class com.navercorp.nid.** { *; }

# Retrofit · Gson (R8 full mode)
-keepattributes Signature, InnerClasses, EnclosingMethod, RuntimeVisibleAnnotations, RuntimeVisibleParameterAnnotations, AnnotationDefault
-if interface * { @retrofit2.http.* <methods>; }
-keep,allowobfuscation interface <1>
-keep,allowobfuscation,allowshrinking class kotlin.coroutines.Continuation
-if interface * { @retrofit2.http.* public *** *(...); }
-keep,allowoptimization,allowshrinking,allowobfuscation class <3>
-keep,allowobfuscation,allowshrinking class retrofit2.Response
-keep,allowobfuscation,allowshrinking class com.google.gson.reflect.TypeToken
-keep,allowobfuscation,allowshrinking class * extends com.google.gson.reflect.TypeToken
`;

module.exports = ({ config }) => ({
  ...config,
  // Local UI testing does not need an SSR bundle and route graph for each URL.
  web: { ...config.web, ...(process.env.WOONPICK_LOCAL_WEB === '1' ? { output: 'single' } : {}) },
  plugins: [
    ...config.plugins.map((plugin) => {
      // SDK 58 defaults to a separate lazy bundle for each web route. Local
      // testing visits most screens, so bundle them together once and reuse the
      // graph on navigation. Production exports still use route splitting.
      if (process.env.WOONPICK_LOCAL_WEB !== '1') return plugin;
      const [name, options = {}] = Array.isArray(plugin) ? plugin : [plugin];
      return name === 'expo-router'
        ? [name, { ...options, asyncRoutes: { web: false } }]
        : plugin;
    }),
    // 카카오 Android SDK는 Maven Central에 없다. 릴리스 빌드의 R8 규칙은 SOCIAL_PROGUARD_RULES 참고
    [
      'expo-build-properties',
      { android: { extraMavenRepos: ['https://devrepo.kakao.com/nexus/content/groups/public/'], extraProguardRules: SOCIAL_PROGUARD_RULES } },
    ],
    // iOS 로그인 복귀 URL은 아래 SceneDelegate 플러그인이 받는다 (handleKakaoOpenUrl 은 AppDelegate 전용이라 쓰지 않음)
    ['@react-native-kakao/core', { nativeAppKey: KEYS.kakaoNativeAppKey, android: { authCodeHandlerActivity: true }, ios: {} }],
    './plugins/withKakaoAndroidCompileSdk',
    ['@react-native-seoul/naver-login', { urlScheme: NAVER_URL_SCHEME }],
    ['@react-native-google-signin/google-signin', { iosUrlScheme: GOOGLE.iosUrlScheme }],
    ['./plugins/withSocialLoginScene', { naverUrlScheme: NAVER_URL_SCHEME }],
    // 홈 화면 위젯 '오늘의 운세' (iOS). 화면은 src/widgets/FortuneWidget.ios.tsx, 데이터는 src/services/fortuneWidget.ios.ts
    // App Group(group.com.woonpick.ios)으로 앱과 위젯이 값을 나눈다 — 처음 넣은 뒤 첫 EAS iOS 빌드는 대화형으로 (프로파일 재발급)
    [
      'expo-widgets',
      {
        widgets: [
          {
            name: 'FortuneWidget',
            displayName: '오늘의 운세',
            description: '홈 화면에서 오늘의 운세를 뽑고 점수와 한 줄 요약을 봐요',
            ios: { supportedFamilies: ['systemSmall', 'systemMedium'], initialLayout: './src/widgets/FortuneWidget.ios.tsx' },
            android: null,
          },
        ],
      },
    ],
    // 홈 화면 위젯 '오늘의 운세' (Android). 화면은 src/widgets/FortuneWidget.android.tsx, 작업은 index.ts 에서 등록
    [
      'react-native-android-widget',
      {
        fonts: ['./assets/fonts/Pretendard-Medium.otf', './assets/fonts/Pretendard-SemiBold.otf', './assets/fonts/Pretendard-Bold.otf', './assets/fonts/Pretendard-ExtraBold.otf'],
        widgets: [
          {
            name: 'FortuneWidget',
            label: '오늘의 운세',
            description: '홈 화면에서 오늘의 운세를 뽑고 점수와 한 줄 요약을 봐요',
            minWidth: '180dp',
            minHeight: '110dp',
            targetCellWidth: 2,
            targetCellHeight: 2,
            maxResizeWidth: '420dp',
            maxResizeHeight: '220dp',
            resizeMode: 'horizontal|vertical',
            // 자정이 지나면 앱을 안 열어도 내일 운세(미리 받아 둔 것)로 바뀌게 30분마다 다시 그린다
            updatePeriodMillis: 1800000,
          },
        ],
      },
    ],
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
