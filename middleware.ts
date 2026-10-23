import { next, rewrite } from '@vercel/functions';

/**
 * Vercel Routing Middleware, run on every path:
 * - /api/* → the API server of this deployment's environment.
 *   API_ORIGIN is set per environment in Vercel (Production = 운영 API, Preview = 개발 API).
 *   The web calls its own /api (EXPO_PUBLIC_API_URL=/api) so the httpOnly refresh cookie stays first-party.
 *   With API_PROXY_SECRET set (the same value as the API's), the visitor's IP goes along in x-woonpick-client-ip:
 *   the API otherwise sees Vercel's address for every web user and their per-IP limits would be shared.
 * - Every deployment but Production answers with X-Robots-Tag: noindex and a robots.txt that disallows everything,
 *   so the 개발 site (even on its own domain) stays out of search engines and bots.
 *   Production serves public/robots.txt (open to every crawler but /api/ and the login callbacks).
 */
export default function middleware(request: Request): Response {
  const production = process.env.VERCEL_ENV === 'production';
  const headers: HeadersInit = production ? {} : { 'X-Robots-Tag': 'noindex, nofollow' };
  const url = new URL(request.url);
  if (!production && url.pathname === '/robots.txt') {
    return new Response('User-agent: *\nDisallow: /\n', { headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  if (!url.pathname.startsWith('/api/')) {
    return next({ headers });
  }

  const origin = process.env.API_ORIGIN;
  if (!origin) {
    return new Response('API_ORIGIN is not set for this environment', { status: 503, headers });
  }
  const secret = process.env.API_PROXY_SECRET;
  const upstream = new Headers(request.headers);
  // never pass on what the visitor sent in these
  upstream.delete('x-woonpick-client-ip');
  upstream.delete('x-woonpick-proxy-secret');
  const clientIp = request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (secret && clientIp) {
    upstream.set('x-woonpick-client-ip', clientIp);
    upstream.set('x-woonpick-proxy-secret', secret);
  }
  return rewrite(new URL(url.pathname.replace(/^\/api/, '') + url.search, origin), {
    headers,
    request: { headers: upstream },
  });
}
