/** 웹은 로그인 페이지로 이동하는 방식이라(socialAuth.ts) 네이티브 SDK 로그인이 없다. 앱은 nativeSocialAuth.native.ts */
import { SocialLoginError, WebSocialProvider } from './socialAuth';

export const nativeSocialAvailable = false;

export async function signInNative(provider: WebSocialProvider): Promise<{ needsTerms: boolean }> {
  throw new SocialLoginError('server', `${provider} native login is app only`);
}
