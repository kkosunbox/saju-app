/**
 * Access/refresh tokens. Native: SecureStore (Keychain/Keystore). Web: localStorage for now;
 * step 11 moves the web refresh token to an httpOnly cookie.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  /** true while the account is a guest (no login yet). */
  isGuest: boolean;
}

const KEY = 'woonpick.tokens';
let cache: Tokens | null | undefined;

async function read(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try { return globalThis.localStorage?.getItem(KEY) ?? null; } catch { return null; }
  }
  return SecureStore.getItemAsync(KEY);
}

async function write(value: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (value === null) globalThis.localStorage?.removeItem(KEY);
      else globalThis.localStorage?.setItem(KEY, value);
    } catch { /* private mode: tokens live in memory only */ }
    return;
  }
  if (value === null) await SecureStore.deleteItemAsync(KEY);
  else await SecureStore.setItemAsync(KEY, value);
}

export async function getTokens(): Promise<Tokens | null> {
  if (cache !== undefined) return cache;
  try { cache = JSON.parse((await read()) ?? 'null'); } catch { cache = null; }
  return cache ?? null;
}

export async function setTokens(tokens: Tokens | null): Promise<void> {
  cache = tokens;
  await write(tokens ? JSON.stringify(tokens) : null);
}
