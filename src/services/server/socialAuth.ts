/**
 * Web social login (카카오 · 네이버 · 구글; Apple is a popup, see appleAuth.ts): redirect to the provider, come back to the callback
 * (/oauth/{provider}/callback or /auth/callback/{provider}, per the server config) with a code,
 * and let the server finish (POST /auth/{provider}).
 * The login page address (client id) comes from the server, so new keys are a server change only.
 * A guest session rides along, so the guest becomes this member (or merges into an existing one).
 */
import { api, call } from '../../api/client';
import { keep, LoginPayload } from './authApi';

export type WebSocialProvider = 'kakao' | 'naver' | 'google';
export const WEB_SOCIAL: readonly WebSocialProvider[] = ['kakao', 'naver', 'google'];
export const isWebSocial = (p: string): p is WebSocialProvider => (WEB_SOCIAL as readonly string[]).includes(p);

const PENDING = 'woonpick.oauth';
interface Pending { provider: WebSocialProvider; state: string; redirectUri: string; returnTo: string }

export function randomState(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Leaves the app for the provider's login page. */
export async function startWebSocialLogin(provider: WebSocialProvider, returnTo = '/'): Promise<void> {
  const state = randomState();
  // the server puts its configured callback path on our origin (the path differs per console)
  const { url, redirectUri } = await call<{ url: string; redirectUri: string }>(
    api.GET('/v1/auth/social/{provider}/authorize-url', {
      params: { path: { provider }, query: { origin: window.location.origin, state } as never },
    }),
  );
  const pending: Pending = { provider, state, redirectUri, returnTo };
  sessionStorage.setItem(PENDING, JSON.stringify(pending));
  window.location.assign(url);
}

export class SocialLoginError extends Error {
  constructor(readonly reason: 'state' | 'denied' | 'two-factor' | 'server', message: string) {
    super(message);
  }
}

/** What Apple gave us (app: expo-apple-authentication, web: Apple JS), sent to POST /auth/apple. */
export interface AppleCredential { identityToken: string; authorizationCode?: string; redirectUri?: string; name?: string }

/** Korean names read family name first; Latin ones given name first. */
export function appleDisplayName(given?: string | null, family?: string | null): string | undefined {
  const parts = [given, family].filter(Boolean) as string[];
  if (!parts.length) return undefined;
  return parts.every(p => /^[\x00-\x7F]*$/.test(p)) ? parts.join(' ') : [family, given].filter(Boolean).join('');
}

/** Signs in with Apple's identity token (the guest session rides along, like the others). */
export async function finishAppleLogin(credential: AppleCredential): Promise<{ needsTerms: boolean }> {
  const data = await call<LoginPayload & { twoFactorToken?: string; user?: { isAllowTerms: boolean } }>(
    api.POST('/v1/auth/apple', { body: credential }),
  ).catch(e => {
    throw new SocialLoginError('server', (e as Error).message);
  });
  if (data.twoFactorToken) throw new SocialLoginError('two-factor', '2FA is not supported for Apple login yet');
  await keep(data, false);
  return { needsTerms: data.user?.isAllowTerms === false };
}

/**
 * Called on the callback page. Checks the state we sent (CSRF), exchanges the code on the server
 * with the same redirect URI, and keeps the session. Returns where to go next, and whether the
 * account still has to agree to our terms (a new social signup, or one that left before agreeing).
 */
export async function finishWebSocialLogin(provider: string, query: { code?: string; state?: string; error?: string }): Promise<{ returnTo: string; needsTerms: boolean }> {
  const raw = sessionStorage.getItem(PENDING);
  sessionStorage.removeItem(PENDING);
  const pending = raw ? (JSON.parse(raw) as Pending) : null;
  if (query.error) throw new SocialLoginError('denied', query.error);
  if (!pending || pending.provider !== provider || !query.state || pending.state !== query.state || !query.code) {
    throw new SocialLoginError('state', 'login request does not match');
  }
  const body = { code: query.code, callbackUrl: pending.redirectUri };
  const path = ({ kakao: '/v1/auth/kakao', naver: '/v1/auth/naver', google: '/v1/auth/google' } as const)[pending.provider];
  const data = await call<LoginPayload & { twoFactorToken?: string; user?: { isAllowTerms: boolean } }>(api.POST(path, { body } as never)).catch(e => {
    throw new SocialLoginError('server', (e as Error).message);
  });
  if (data.twoFactorToken) throw new SocialLoginError('two-factor', '2FA is not supported on the web yet');
  await keep(data, false);
  return { returnTo: pending.returnTo, needsTerms: data.user?.isAllowTerms === false };
}
