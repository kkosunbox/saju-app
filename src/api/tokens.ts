/**
 * Login tokens.
 * - Native: access + refresh token in SecureStore (Keychain/Keystore).
 * - Web: the refresh token is an httpOnly cookie the server sets (scripts cannot read it); the access
 *   token stays in memory and is renewed from the cookie after a reload. localStorage only keeps a
 *   marker that a session exists (and whether it is a guest).
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export interface Tokens {
  /** Empty on the web right after a reload, until the cookie renews it. */
  accessToken: string;
  /** Native only (the web keeps it in the cookie). */
  refreshToken: string;
  /** true while the account is a guest (no login yet). */
  isGuest: boolean;
}

export const IS_WEB = Platform.OS === 'web';
const KEY = 'woonpick.tokens';
const WEB_SESSION = 'woonpick.session';
let cache: Tokens | null | undefined;

const local = {
  get: (k: string) => { try { return globalThis.localStorage?.getItem(k) ?? null; } catch { return null; } },
  set: (k: string, v: string) => { try { globalThis.localStorage?.setItem(k, v); } catch { /* private mode */ } },
  remove: (k: string) => { try { globalThis.localStorage?.removeItem(k); } catch { /* private mode */ } },
};

function readWeb(): Tokens | null {
  // before cookies the web kept both tokens here: renew once with it, then it is removed
  const legacy = local.get(KEY);
  if (legacy) {
    // empty access token: the first request renews right away and the server sets the cookie
    try { const t = JSON.parse(legacy) as Tokens; return { ...t, accessToken: '' }; } catch { local.remove(KEY); }
  }
  const session = local.get(WEB_SESSION);
  if (!session) return null;
  try { return { accessToken: '', refreshToken: '', isGuest: !!(JSON.parse(session) as { isGuest?: boolean }).isGuest }; } catch { return null; }
}

export async function getTokens(): Promise<Tokens | null> {
  if (cache !== undefined) return cache;
  if (IS_WEB) {
    cache = readWeb();
  } else {
    try { cache = JSON.parse((await SecureStore.getItemAsync(KEY)) ?? 'null'); } catch { cache = null; }
  }
  return cache ?? null;
}

export async function setTokens(tokens: Tokens | null): Promise<void> {
  cache = tokens;
  if (IS_WEB) {
    local.remove(KEY);
    if (tokens) local.set(WEB_SESSION, JSON.stringify({ isGuest: tokens.isGuest }));
    else local.remove(WEB_SESSION);
    return;
  }
  if (tokens) await SecureStore.setItemAsync(KEY, JSON.stringify(tokens));
  else await SecureStore.deleteItemAsync(KEY);
}
