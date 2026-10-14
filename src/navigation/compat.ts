/**
 * React Navigation → Expo Router 호환 계층.
 * 프로토타입 화면들이 쓰던 useNavigation().navigate('화면이름', params) / useRoute() 를 그대로 쓰게 하고,
 * 실제 이동은 Expo Router 경로(URL)로 한다. 웹에서는 화면마다 주소가 생긴다.
 * - 경로 세그먼트([category] 등)는 params에서 채운다.
 * - 객체 params(공유 카드 spec, 궁합 상대)는 개인정보가 URL에 남지 않도록 메모리에 두고 id만 넘긴다.
 *   (웹에서 새로고침하면 사라지므로 화면은 params가 없을 때도 동작해야 한다)
 */
import { useMemo } from 'react';
import { router, useLocalSearchParams, type Href } from 'expo-router';

export { useFocusEffect } from 'expo-router';

/** 화면 이름 → 경로. 탭 화면은 (tabs) 그룹이라 경로에 그룹 이름이 없다. */
export const ROUTES: Record<string, string> = {
  Home: '/',
  Fortune: '/fortune',
  Content: '/content',
  Compatibility: '/compatibility',
  MyPage: '/my',
  Onboarding: '/onboarding',
  Login: '/login',
  EmailLogin: '/login/email',
  SignUp: '/signup',
  FindPassword: '/find-password',
  SocialLogin: '/login/social/[provider]',
  ProfileSetup: '/profile-setup',
  CategoryDetail: '/category/[category]',
  AnalysisDetail: '/analysis/[source]',
  CombinedAnalysis: '/combined',
  Share: '/share',
  Wallet: '/wallet',
  SajuDeep: '/premium/saju',
  Life: '/premium/life',
  NewYear: '/premium/new-year',
  Monthly: '/premium/monthly',
  Theme: '/premium/theme/[kind]',
  Lucky: '/premium/lucky',
  MbtiMatch: '/mbti-match',
  Character: '/character',
  Talisman: '/talisman',
  Spouse: '/spouse',
  Consult: '/consult',
  PastLife: '/past-life',
  Legal: '/legal/[doc]',
};

/** 숫자로 되돌릴 쿼리 파라미터 */
const NUMERIC_PARAMS = new Set(['year', 'y', 'm']);
const OBJECT_PREFIX = '@obj:';
const objectParams = new Map<string, unknown>();
let objectSeq = 0;

type Params = Record<string, unknown> | undefined;

/** 화면 이름과 params로 경로를 만든다. 'Tabs'는 { screen, params }를 풀어서 해당 탭으로. */
export function toHref(name: string, params?: Params): Href {
  if (name === 'Tabs') {
    const tab = params as { screen?: string; params?: Params } | undefined;
    return toHref(tab?.screen ?? 'Home', tab?.params);
  }
  const pattern = ROUTES[name];
  if (!pattern) throw new Error(`Unknown screen: ${name}`);
  let path = pattern;
  const query: string[] = [];
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (path.includes(`[${key}]`)) {
      path = path.replace(`[${key}]`, encodeURIComponent(String(value)));
    } else if (typeof value === 'object') {
      const id = `${++objectSeq}`;
      objectParams.set(id, value);
      query.push(`${key}=${encodeURIComponent(OBJECT_PREFIX + id)}`);
    } else {
      query.push(`${key}=${encodeURIComponent(String(value))}`);
    }
  });
  return (query.length ? `${path}?${query.join('&')}` : path) as Href;
}

/** 프로토타입 화면들이 쓰는 네비게이션 객체 */
export interface AppNavigation {
  navigate(name: string, params?: Params): void;
  push(name: string, params?: Params): void;
  replace(name: string, params?: Params): void;
  goBack(): void;
  canGoBack(): boolean;
}

const navigation: AppNavigation = {
  navigate: (name, params) => router.navigate(toHref(name, params)),
  push: (name, params) => router.push(toHref(name, params)),
  replace: (name, params) => router.replace(toHref(name, params)),
  goBack: () => (router.canGoBack() ? router.back() : router.replace('/')),
  canGoBack: () => router.canGoBack(),
};

/** useNavigation() — 타입 인자는 호환을 위해 받기만 한다 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useNavigation<T = AppNavigation>(): AppNavigation {
  return navigation;
}

/** useRoute() — 경로·쿼리 params를 원래 타입(숫자·객체)으로 되돌려 준다 */
export function useRoute<T extends { params?: unknown } = { params: Record<string, unknown> }>(): T {
  const raw = useLocalSearchParams();
  return useMemo(() => {
    const params: Record<string, unknown> = {};
    Object.entries(raw).forEach(([key, value]) => {
      const text = Array.isArray(value) ? value[0] : value;
      if (text === undefined) return;
      if (text.startsWith(OBJECT_PREFIX)) params[key] = objectParams.get(text.slice(OBJECT_PREFIX.length));
      else if (NUMERIC_PARAMS.has(key) && /^\d+$/.test(text)) params[key] = Number(text);
      else params[key] = text;
    });
    return { params } as unknown as T;
  }, [raw]);
}

/** React Navigation 타입 호환 */
export type RouteProp<L extends Record<string, unknown>, K extends keyof L> = { params: L[K] };
export type NavigationProp<_L = unknown> = AppNavigation;
export type NativeStackNavigationProp<_L = unknown> = AppNavigation;
export type ParamListBase = Record<string, unknown>;
export type NavigatorScreenParams<L> = { screen?: keyof L; params?: unknown };
