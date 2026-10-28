/**
 * 앱의 카카오 · 네이버 · 구글 로그인: 각 회사 SDK로 로그인해 토큰을 받고, 서버(POST /auth/{provider}/app)가 확인한다.
 * 카카오는 카카오톡이 있으면 카카오톡으로, 네이버는 네이버 앱이 있으면 네이버 앱으로 로그인한다.
 * 키는 빌드 환경별로 app.config.js 가 extra.social 에 넣는다.
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { initializeKakaoSDK } from '@react-native-kakao/core';
import { login as kakaoLogin } from '@react-native-kakao/user';
import NaverLogin from '@react-native-seoul/naver-login';
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import { finishAppSocialLogin, SocialLoginError, WebSocialProvider } from './socialAuth';

interface SocialKeys {
  kakaoNativeAppKey: string;
  naver: { consumerKey: string; consumerSecret: string; urlScheme: string };
  google: { webClientId: string; iosClientId: string };
}
const keys = Constants.expoConfig?.extra?.social as SocialKeys;

export const nativeSocialAvailable = true;

/** 각 SDK는 처음 로그인할 때 한 번만 준비한다 */
let ready: Promise<void> | null = null;
function prepare(): Promise<void> {
  ready ??= (async () => {
    await initializeKakaoSDK(keys.kakaoNativeAppKey);
    NaverLogin.initialize({
      appName: Constants.expoConfig?.name ?? '운Pick',
      consumerKey: keys.naver.consumerKey,
      consumerSecret: keys.naver.consumerSecret,
      serviceUrlSchemeIOS: keys.naver.urlScheme,
    });
    GoogleSignin.configure({ webClientId: keys.google.webClientId, iosClientId: keys.google.iosClientId });
  })().catch(e => {
    ready = null;
    throw e;
  });
  return ready;
}

const canceled = () => new SocialLoginError('denied', 'canceled');

async function kakaoToken(): Promise<string> {
  try {
    return (await kakaoLogin()).accessToken;
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === 'Cancelled' || code === 'AccessDenied') throw canceled();
    throw new SocialLoginError('server', (e as Error).message);
  }
}

async function naverToken(): Promise<string> {
  const { isSuccess, successResponse, failureResponse } = await NaverLogin.login();
  if (isSuccess && successResponse) return successResponse.accessToken;
  if (failureResponse?.isCancel) throw canceled();
  throw new SocialLoginError('server', failureResponse?.message ?? 'Naver login failed');
}

async function googleToken(): Promise<string> {
  try {
    if (Platform.OS === 'android') await GoogleSignin.hasPlayServices();
    // 매번 계정을 고를 수 있게 (웹의 prompt=select_account 와 같이)
    await GoogleSignin.signOut().catch(() => {});
    const res = await GoogleSignin.signIn();
    if (res.type === 'cancelled') throw canceled();
    if (!res.data.idToken) throw new SocialLoginError('server', 'Google gave no ID token');
    return res.data.idToken;
  } catch (e) {
    if (e instanceof SocialLoginError) throw e;
    if (isErrorWithCode(e) && e.code === statusCodes.SIGN_IN_CANCELLED) throw canceled();
    throw new SocialLoginError('server', (e as Error).message);
  }
}

const TOKEN: Record<WebSocialProvider, () => Promise<string>> = { kakao: kakaoToken, naver: naverToken, google: googleToken };

export async function signInNative(provider: WebSocialProvider): Promise<{ needsTerms: boolean }> {
  try {
    await prepare();
  } catch (e) {
    throw new SocialLoginError('server', (e as Error).message);
  }
  return finishAppSocialLogin(provider, await TOKEN[provider]());
}
