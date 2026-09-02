import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BYPASS_TOKEN = process.env.MAINTENANCE_BYPASS_TOKEN || 'sahlnaha_bypass_2025';
const MAINTENANCE_COOKIE = 'maintenance_bypass';
const MAINTENANCE_ON_COOKIE = 'maintenance_on';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const maintenanceMode = request.cookies.get(MAINTENANCE_ON_COOKIE)?.value === '1';

  if (maintenanceMode) {
    const allowed = ['/maintenance', '/maint-mohasa', '/api/maintenance', '/api/admin/login', '/api/admin/logout'];
    const isAllowed = allowed.some(p => pathname.startsWith(p));
    const isStatic = pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/site.webmanifest');

    if (!isAllowed && !isStatic) {
      const bypassCookie = request.cookies.get(MAINTENANCE_COOKIE)?.value;
      if (bypassCookie !== BYPASS_TOKEN) {
        const maintenanceUrl = new URL('/maintenance', request.url);
        const response = NextResponse.redirect(maintenanceUrl);
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        return response;
      }
    }
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  
  const isDev = process.env.NODE_ENV === 'development';

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://maps.googleapis.com https://js.sentry-cdn.com https://www.google-analytics.com https://www.googletagmanager.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https: http://localhost:5000;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' http://localhost:5000 https://*.railway.app https://*.render.com https://*.onrender.com https://sentry.io https://www.google-analytics.com https://maps.googleapis.com https://nominatim.openstreetmap.org;
    frame-src 'self' https://www.google.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
