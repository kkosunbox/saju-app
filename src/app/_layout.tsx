import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View, type ViewInstance } from 'react-native';
import { Stack, router, usePathname, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useFonts } from 'expo-font';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppProvider, useApp } from '@/context/AppContext';
import { queryClient } from '@/api/query';
import { PremiumProvider, usePremium } from '@/context/PremiumContext';
import { StoreBillingProvider } from '@/context/StoreBillingContext';
import { LogoMark } from '@/components/BrandMark';
import LaunchSplash from '@/components/LaunchSplash';
import SiteHead from '@/components/SiteHead';
import LandingScreen from '@/screens/LandingScreen';
import GuideScreen from '@/screens/GuideScreen';
import { guideSlugOf } from '@/content/guides';
import { colors, isDark } from '@/theme/colors';
import { FONT_FILES } from '@/theme/fontFiles';
import { useWebSideScroll } from '@/utils/webSideScroll';

const AUTH_PATHS = ['/login', '/signup', '/find-password'];
const isAuthPath = (path: string) => AUTH_PATHS.some(p => path === p || path.startsWith(`${p}/`));

/**
 * 로그인은 필요한 순간(유료 콘텐츠·포인트·마이 탭)에 위로 띄운다.
 * 로그인에 성공하면 로그인 화면들을 닫고 들어오기 전 화면으로 돌아간다.
 * 프로필이 없는 계정(새로 가입 등)은 프로필 입력으로 — 들어오기 전 화면(웹 랜딩·홈)은 이제 열 수 없다.
 */
function useCloseAuthFlowOnSignIn() {
  const { account, user } = useApp();
  const pathname = usePathname();
  const lastPath = useRef('/');
  const hadAccount = useRef(!!account);
  // 웹 랜딩(/onboarding)은 로그인하러 가면서 닫히고, 프로필 입력(/profile-setup)은 프로필 있는 계정으로 로그인하면 막히므로 돌아갈 곳은 홈
  if (!isAuthPath(pathname)) lastPath.current = pathname === '/onboarding' || pathname === '/profile-setup' ? '/' : pathname;
  useEffect(() => {
    if (!hadAccount.current && account && isAuthPath(pathname)) router.dismissTo((user ? lastPath.current : '/profile-setup') as Href);
    hadAccount.current = !!account;
  }, [account, pathname]);
}

/**
 * hold: 네이티브 시작 화면의 연출이 끝날 때까지 첫 화면을 그리지 않는다 — 첫 화면을 한꺼번에 그리는 동안 메인 스레드가 멈춰
 * 마스코트가 말풍선으로 뛰어드는 연출이 끊기거나 건너뛰어진다. onShown: 첫 화면이 실제로 그려졌을 때 (시작 화면이 걷힐 신호)
 */
function RootStack({ hold, onShown }: { hold: boolean; onShown(): void }) {
  const { booting, onboarded, user, editingProfile } = useApp();
  const hasProfile = !!user && !editingProfile;
  const { setGoWallet } = usePremium();
  useEffect(() => setGoWallet(() => router.push('/wallet')), [setGoWallet]);
  useCloseAuthFlowOnSignIn();
  const pathname = usePathname();
  if (booting) {
    // 웹 첫 화면은 부팅(세션 확인)을 기다리지 않고 랜딩을 그린다 — 정적 HTML에 본문이 들어가 검색엔진·공유 미리보기가 읽는다.
    // 온보딩을 마친 사람에겐 +html.tsx 가 가리고, 부팅이 끝나면 아래 Stack이 대신한다.
    if (Platform.OS === 'web' && (pathname === '/' || pathname === '/onboarding')) {
      return (
        <View nativeID="boot-landing" pointerEvents="none" style={{ flex: 1 }}>
          <LandingScreen />
        </View>
      );
    }
    // 서비스 소개(/g/*)도 같은 이유로 부팅을 기다리지 않는다 — 온보딩을 마친 사람에게도 그대로 보인다
    const guide = Platform.OS === 'web' ? guideSlugOf(pathname) : undefined;
    if (guide) {
      return (
        <View pointerEvents="none" style={{ flex: 1 }}>
          <GuideScreen slug={guide} />
        </View>
      );
    }
    // 앱은 그 위의 LaunchSplash 가 가린다
    if (Platform.OS !== 'web') return null;
    return (
      <View style={s.boot}>
        <LogoMark size={52} />
      </View>
    );
  }
  if (hold) return null;
  // 막힌 화면을 열면 지금 상태의 첫 화면으로 — 지정하지 않으면 expo-router가 파일 이름순 첫 화면(예: /inquiry)으로 보낸다
  const home: Href = !onboarded ? '/onboarding' : hasProfile ? '/' : '/profile-setup';
  return (
    <>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.cream } }}>
        <Stack.Protected guard={!onboarded} redirectTo={home}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        {/* 첫 화면 결정 순서: 프로필이 없으면(또는 "다시 입력" 중이면) 프로필 입력이 로그인보다 먼저 */}
        <Stack.Protected guard={onboarded && !hasProfile} redirectTo={home}>
          <Stack.Screen name="profile-setup" />
        </Stack.Protected>
        {/* 프로필이 있어야 쓰는 화면 */}
        <Stack.Protected guard={onboarded && hasProfile} redirectTo={home}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="profile-edit" />
          <Stack.Screen name="category/[category]" />
          <Stack.Screen name="analysis/[source]" />
          <Stack.Screen name="combined" />
          <Stack.Screen name="wallet" />
          <Stack.Screen name="charge" />
          <Stack.Screen name="subscribe" />
          <Stack.Screen name="premium/saju" />
          <Stack.Screen name="premium/life" />
          <Stack.Screen name="premium/new-year" />
          <Stack.Screen name="premium/monthly" />
          <Stack.Screen name="premium/theme/[kind]" />
          <Stack.Screen name="premium/lucky" />
          <Stack.Screen name="mbti-match" />
          <Stack.Screen name="character" />
          <Stack.Screen name="talisman" />
          <Stack.Screen name="spouse" />
          <Stack.Screen name="fortune" />
          <Stack.Screen name="consult/history" />
          <Stack.Screen name="consult/[id]" />
          <Stack.Screen name="past-life" />
          <Stack.Screen name="share" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack.Protected>
        {/* 로그인·약관: 프로필 입력 전(이미 계정이 있는 사람)과 후 모두 */}
        <Stack.Protected guard={onboarded} redirectTo={home}>
          <Stack.Screen name="login/index" />
          <Stack.Screen name="login/email" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="signup-terms" options={{ gestureEnabled: false }} />
          <Stack.Screen name="find-password" />
          <Stack.Screen name="login/social/[provider]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack.Protected>
        {/* 친구 초대 링크는 온보딩·프로필 여부와 상관없이 연다.
            보호된 화면에서 밀려나면 목록의 첫 화면으로 가므로, 파라미터가 필요한 이 화면은 맨 뒤에 둔다. */}
        <Stack.Screen name="invite/[token]" />
        {/* 약관은 웹 랜딩(온보딩 전)에서도 연다 */}
        <Stack.Screen name="legal/[doc]" />
        {/* 서비스 소개는 누구나 (웹 검색 유입) */}
        <Stack.Screen name="g/[topic]" />
        {/* 웹 소셜 로그인 콜백: 온보딩·프로필 여부와 상관없이 받는다 */}
        <Stack.Screen name="oauth/[provider]/callback" />
        <Stack.Screen name="auth/callback/[provider]" />
      </Stack>
      {Platform.OS !== 'web' ? <View style={s.probe} onLayout={onShown} /> : null}
    </>
  );
}

export default function RootLayout() {
  // 네이티브: 굵기별 글꼴 파일 (src/theme/fontFiles.native.ts). 로드 전에는 시스템 글꼴로 먼저 보여준다. 웹은 +html.tsx 의 웹폰트.
  const [fontsLoaded, fontError] = useFonts(FONT_FILES);
  // 네이티브 시작 화면: 연출이 끝나면 첫 화면을 그리고, 첫 화면이 그려지면 걷힌다
  const [introDone, setIntroDone] = useState(Platform.OS === 'web');
  const [shown, setShown] = useState(Platform.OS === 'web');
  const bg = useRef<ViewInstance>(null);
  const frame = useRef<ViewInstance>(null);
  useWebSideScroll(bg, frame);
  const app = (
    <SafeAreaProvider>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <PremiumProvider>
              <StoreBillingProvider>
                <StatusBar style={isDark ? 'light' : 'dark'} />
                {Platform.OS === 'web' ? <SiteHead /> : null}
                <RootStack hold={!introDone} onShown={() => setShown(true)} />
                {Platform.OS !== 'web' ? <LaunchSplash ready={shown} settled={fontsLoaded || !!fontError} onIntroDone={() => setIntroDone(true)} /> : null}
              </StoreBillingProvider>
            </PremiumProvider>
          </AppProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
  if (Platform.OS !== 'web') return app;
  // 웹: 데스크톱 브라우저에서도 폰 화면 폭으로 가운데 정렬
  return (
    <View ref={bg} style={s.webBg}>
      <View ref={frame} style={s.webFrame}>{app}</View>
    </View>
  );
}

const s = StyleSheet.create({
  // 첫 화면과 같은 커밋에 붙는 빈 점 — 레이아웃 이벤트가 오면 첫 화면이 그려진 것
  probe: { position: 'absolute', width: 0, height: 0 },
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  webBg: { flex: 1, alignItems: 'center', backgroundColor: colors.frame },
  webFrame: { flex: 1, width: '100%', maxWidth: 430, overflow: 'hidden', backgroundColor: colors.cream },
});
