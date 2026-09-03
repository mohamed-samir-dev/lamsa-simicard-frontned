import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BACKEND = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://lamsa-simicard-backend-production.up.railway.app';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV === 'development';
  const cspHeader = buildCsp(nonce, isDev);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const isStatic =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/site.webmanifest');

  const isExempt =
    pathname.startsWith('/maintenance') ||
    pathname.startsWith('/maint-mohasa') ||
    pathname.startsWith('/api/');

  if (!isStatic && !isExempt) {
    // الأدمن المسجّل يعدي دايماً
    const adminToken = request.cookies.get('admin_token')?.value;
    if (!adminToken) {
      try {
        const r = await fetch(`${BACKEND}/api/admin/maintenance/public`, {
          next: { revalidate: 30 },
        } as RequestInit);
        if (r.ok) {
          const data = await r.json();
          if (data.maintenance === true) {
            const url = new URL('/maintenance', request.url);
            const res = NextResponse.redirect(url);
            res.headers.set('Cache-Control', 'no-store');
            return res;
          }
        }
      } catch {
        // لو الباكند مش شغال، يعدي عادي
      }
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  setSecurityHeaders(response, cspHeader);
  return response;
}

function buildCsp(nonce: string, isDev: boolean): string {
  return `
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
}

function setSecurityHeaders(response: ReturnType<typeof NextResponse.next>, csp: string) {
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
