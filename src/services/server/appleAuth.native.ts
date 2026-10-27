/** Sign in with Apple in the iOS app (the system sheet). Android has no native Apple sign-in. */
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { appleDisplayName, finishAppleLogin, SocialLoginError } from './socialAuth';

export const appleSignInAvailable = async (): Promise<boolean> =>
  Platform.OS === 'ios' && AppleAuthentication.isAvailableAsync();

export const prepareAppleSignIn = async (): Promise<void> => {};

export async function signInWithApple(): Promise<{ needsTerms: boolean }> {
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
    });
  } catch (e) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') throw new SocialLoginError('denied', 'canceled');
    throw new SocialLoginError('server', (e as Error).message);
  }
  if (!credential.identityToken) throw new SocialLoginError('server', 'Apple gave no identity token');
  return finishAppleLogin({
    identityToken: credential.identityToken,
    authorizationCode: credential.authorizationCode ?? undefined,
    name: appleDisplayName(credential.fullName?.givenName, credential.fullName?.familyName),
  });
}
