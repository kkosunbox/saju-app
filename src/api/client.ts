/**
 * Typed API client (types generated from the server Swagger: `npm run api:fetch && npm run api:types`).
 * Every response is `{ result, data }` or `{ result: false, code, message }`; `call` unwraps it.
 * A 401 refreshes the tokens once (shared by concurrent requests) and retries.
 * Web requests say `X-Woonpick-Client: web` and carry cookies: the server keeps the refresh token
 * in an httpOnly cookie instead of the response (src/api/tokens.ts).
 */
import createClient from 'openapi-fetch';
import { API_URL } from './config';
import { IS_WEB, getTokens, setTokens } from './tokens';

import type { paths } from './schema';

/** Headers and cookie mode for every request from this platform. */
const WEB_HEADERS: Record<string, string> = IS_WEB ? { 'X-Woonpick-Client': 'web' } : {};
const CREDENTIALS: RequestCredentials | undefined = IS_WEB ? 'include' : undefined;

/** Server error with its code (INSUFFICIENT_POINTS, CONTENT_LOCKED …). */
export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

let refreshing: Promise<boolean> | null = null;
/** Called when the session cannot be refreshed (tokens cleared). */
let onSessionLost: () => void = () => {};
export const setOnSessionLost = (fn: () => void) => { onSessionLost = fn; };

async function refresh(): Promise<boolean> {
  const tokens = await getTokens();
  if (!tokens) return false;
  const response = await fetch(`${API_URL}/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...WEB_HEADERS },
    credentials: CREDENTIALS,
    // web: the cookie (a refresh token is sent only once, to move an old localStorage session into the cookie)
    body: JSON.stringify(tokens.refreshToken ? { refreshToken: tokens.refreshToken } : {}),
  }).catch(() => null);
  if (!response?.ok) {
    if (response && response.status < 500) {
      await setTokens(null);
      onSessionLost();
    }
    return false;
  }
  const body = await response.json();
  await setTokens({ ...tokens, accessToken: body.data.accessToken, refreshToken: IS_WEB ? '' : body.data.refreshToken ?? tokens.refreshToken });
  return true;
}

/** Shared refresh (concurrent 401s wait for one). */
const refreshOnce = () => (refreshing ??= refresh().finally(() => { refreshing = null; }));

async function authFetch(request: Request): Promise<Response> {
  const retry = request.clone();
  const withToken = async (req: Request) => {
    const tokens = await getTokens();
    if (tokens?.accessToken && !req.headers.has('Authorization')) req.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
    Object.entries(WEB_HEADERS).forEach(([k, v]) => req.headers.set(k, v));
    return fetch(CREDENTIALS ? new Request(req, { credentials: CREDENTIALS }) : req);
  };
  // web after a reload: the access token is only in memory, so renew it from the cookie first
  const tokens = await getTokens();
  if (tokens && !tokens.accessToken && !/\/auth\/(refresh|logout)/.test(request.url)) await refreshOnce();
  const response = await withToken(request);
  if (response.status !== 401 || request.url.includes('/auth/refresh')) return response;
  return (await refreshOnce()) ? withToken(retry) : response;
}

export const api = createClient<paths>({ baseUrl: API_URL, fetch: authFetch });

/** Authenticated JSON request for newly introduced endpoints before OpenAPI regeneration. */
export async function requestData<T>(path: string, body?: unknown): Promise<T> {
  return call<T>(authFetch(new Request(`${API_URL}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })).then(async response => {
    const payload = await response.json();
    return { response, data: response.ok ? payload : undefined, error: response.ok ? undefined : payload };
  }));
}

/** Unwraps `{ data }` or throws ApiError. */
export async function call<T>(promise: Promise<{ data?: unknown; error?: unknown; response: Response }>): Promise<T> {
  const { data, error, response } = await promise.catch((err: Error) => {
    throw new ApiError(0, 'NETWORK', err.message);
  });
  if (error || !response.ok) {
    const body = (error ?? {}) as { code?: string; message?: string };
    throw new ApiError(response.status, body.code ?? 'UNKNOWN', body.message ?? response.statusText);
  }
  return (data as { data: T }).data;
}
