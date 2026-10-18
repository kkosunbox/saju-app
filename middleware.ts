import { next, rewrite } from '@vercel/functions';

/**
 * Vercel Routing Middleware, run on every path:
 * - /api/* → the API server of this deployment's environment.
 *   API_ORIGIN is set per environment in Vercel (Production = 운영 API, Preview = 개발 API).
 *   The web calls its own /api (EXPO_PUBLIC_API_URL=/api) so the httpOnly refresh cookie stays first-party.
 * - Every deployment but Production answers with X-Robots-Tag: noindex, so the 개발 site (even on its own domain)
 *   stays out of search engines.
 */
export default function middleware(request: Request): Response {
  const headers: HeadersInit =
    process.env.VERCEL_ENV === 'production' ? {} : { 'X-Robots-Tag': 'noindex, nofollow' };
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/')) {
    return next({ headers });
  }

  const origin = process.env.API_ORIGIN;
  if (!origin) {
    return new Response('API_ORIGIN is not set for this environment', { status: 503, headers });
  }
  return rewrite(new URL(url.pathname.replace(/^\/api/, '') + url.search, origin), { headers });
}
