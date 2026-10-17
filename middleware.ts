import { rewrite } from '@vercel/functions';

export const config = { matcher: '/api/:path*' };

/**
 * Vercel Routing Middleware: /api/* → the API server of this deployment's environment.
 * API_ORIGIN is set per environment in Vercel (Production = 운영 API, Preview = 개발 API).
 * The web calls its own /api (EXPO_PUBLIC_API_URL=/api) so the httpOnly refresh cookie stays first-party.
 */
export default function middleware(request: Request): Response {
  const origin = process.env.API_ORIGIN;
  if (!origin) {
    return new Response('API_ORIGIN is not set for this environment', { status: 503 });
  }
  const url = new URL(request.url);
  return rewrite(new URL(url.pathname.replace(/^\/api/, '') + url.search, origin));
}
