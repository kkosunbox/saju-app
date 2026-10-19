import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Stack, router, usePathname, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppProvider, useApp } from '@/context/AppContext';
import { queryClient } from '@/api/query';
import { PremiumProvider, usePremium } from '@/context/PremiumContext';
import { LogoMark } from '@/components/BrandMark';
import { colors, isDark } from '@/theme/colors';
import { FONT_FILES } from '@/theme/fontFiles';

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
  // 웹 랜딩(/onboarding)은 로그인하러 가면서 닫히므로 돌아갈 곳은 홈
  if (!isAuthPath(pathname)) lastPath.current = pathname === '/onboarding' ? '/' : pathname;
  useEffect(() => {
    if (!hadAccount.current && account && isAuthPath(pathname)) router.dismissTo((user ? lastPath.current : '/profile-setup') as Href);
    hadAccount.current = !!account;
  }, [account, pathname]);
}

function RootStack() {
  const { booting, onboarded, user, editingProfile } = useApp();
  const hasProfile = !!user && !editingProfile;
  const { setGoWallet } = usePremium();
  useEffect(() => setGoWallet(() => router.push('/wallet')), [setGoWallet]);
  useCloseAuthFlowOnSignIn();
  if (booting) {
    return (
      <View style={s.boot}>
        <LogoMark size={52} />
      </View>
    );
  }
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.cream } }}>
      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      {/* 첫 화면 결정 순서: 프로필이 없으면(또는 "다시 입력" 중이면) 프로필 입력이 로그인보다 먼저 */}
      <Stack.Protected guard={onboarded && !hasProfile}>
        <Stack.Screen name="profile-setup" />
      </Stack.Protected>
      {/* 프로필이 있어야 쓰는 화면 */}
      <Stack.Protected guard={onboarded && hasProfile}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="category/[category]" />
        <Stack.Screen name="analysis/[source]" />
        <Stack.Screen name="combined" />
        <Stack.Screen name="wallet" />
        <Stack.Screen name="charge" />
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
        <Stack.Screen name="consult" />
        <Stack.Screen name="past-life" />
        <Stack.Screen name="share" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack.Protected>
      {/* 로그인·약관: 프로필 입력 전(이미 계정이 있는 사람)과 후 모두 */}
      <Stack.Protected guard={onboarded}>
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
      {/* 웹 소셜 로그인 콜백: 온보딩·프로필 여부와 상관없이 받는다 */}
      <Stack.Screen name="oauth/[provider]/callback" />
      <Stack.Screen name="auth/callback/[provider]" />
    </Stack>
  );
}

export default function RootLayout() {
  // 네이티브: 굵기별 글꼴 파일 (src/theme/fontFiles.native.ts). 로드 전에는 시스템 글꼴로 먼저 보여준다. 웹은 +html.tsx 의 웹폰트.
  useFonts(FONT_FILES);
  const app = (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <PremiumProvider>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <RootStack />
          </PremiumProvider>
        </AppProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
  if (Platform.OS !== 'web') return app;
  // 웹: 데스크톱 브라우저에서도 폰 화면 폭으로 가운데 정렬
  return (
    <View style={s.webBg}>
      <View style={s.webFrame}>{app}</View>
    </View>
  );
}

const s = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  webBg: { flex: 1, alignItems: 'center', backgroundColor: colors.frame },
  webFrame: { flex: 1, width: '100%', maxWidth: 430, overflow: 'hidden', backgroundColor: colors.cream },
});
