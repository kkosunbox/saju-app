/**
 * Sign in with Apple on the web: Apple JS in a popup (no page leaves, so no form_post callback).
 * The Services ID and redirect URI come from the server (GET /auth/social/apple/web-config).
 * Apple only accepts https return URLs registered on the Services ID, so localhost cannot sign in.
 * Safari opens the popup only from the tap itself, so prepare() runs when the screen opens
 * and signIn() calls Apple right away.
 */
import { api, call } from '../../api/client';
import { appleDisplayName, finishAppleLogin, randomState, SocialLoginError } from './socialAuth';

const SCRIPT = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/ko_KR/appleid.auth.js';

interface AppleSignInResponse {
  authorization: { code: string; id_token: string; state?: string };
  user?: { email?: string; name?: { firstName?: string; lastName?: string } };
}
declare global {
  interface Window {
    AppleID?: { auth: { init(config: Record<string, unknown>): void; signIn(): Promise<AppleSignInResponse> } };
  }
}

let prepared: Promise<{ state: string; redirectUri: string }> | null = null;

function loadScript(): Promise<void> {
  if (window.AppleID) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const tag = document.createElement('script');
    tag.src = SCRIPT;
    tag.async = true;
    tag.onload = () => resolve();
    tag.onerror = () => reject(new Error('Apple JS did not load'));
    document.head.appendChild(tag);
  });
}

export const appleSignInAvailable = async (): Promise<boolean> => true;

/** Loads Apple JS and initialises it with this origin's settings. */
export function prepareAppleSignIn(): Promise<void> {
  prepared ??= (async () => {
    const [{ clientId, redirectUri }] = await Promise.all([
      call<{ clientId: string; redirectUri: string }>(
        api.GET('/v1/auth/social/apple/web-config', { params: { query: { origin: window.location.origin } } }),
      ),
      loadScript(),
    ]);
    const state = randomState();
    window.AppleID!.auth.init({ clientId, scope: 'name email', redirectURI: redirectUri, state, usePopup: true });
    return { state, redirectUri };
  })();
  prepared.catch(() => { prepared = null; });
  return prepared.then(() => undefined);
}

export async function signInWithApple(): Promise<{ needsTerms: boolean }> {
  if (!prepared) throw new SocialLoginError('server', 'Apple sign-in is not prepared');
  const { state, redirectUri } = await prepared;
  let response: AppleSignInResponse;
  try {
    response = await window.AppleID!.auth.signIn();
  } catch (e) {
    // closing the popup comes back as { error: 'popup_closed_by_user' }
    throw new SocialLoginError('denied', String((e as { error?: string })?.error ?? e));
  } finally {
    // a state is used once; the next tap gets a fresh one
    prepared = null;
    prepareAppleSignIn().catch(() => {});
  }
  if (response.authorization.state !== state) throw new SocialLoginError('state', 'login request does not match');
  return finishAppleLogin({
    identityToken: response.authorization.id_token,
    authorizationCode: response.authorization.code,
    redirectUri,
    name: appleDisplayName(response.user?.name?.firstName, response.user?.name?.lastName),
  });
}
