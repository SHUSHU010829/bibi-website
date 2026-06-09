import { NextResponse, type NextRequest } from 'next/server';

const DOCS_HOST = 'docs.bibi.shushu.tw';
const MAIN_HOST = 'bibi.shushu.tw';

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const hostname = (
    req.headers.get('x-forwarded-host') ??
    req.headers.get('host') ??
    req.nextUrl.hostname
  ).split(':')[0];

  if (hostname === DOCS_HOST) {
    if (pathname === '/') {
      return NextResponse.redirect(`https://${DOCS_HOST}/docs`, 308);
    }
    if (pathname.startsWith('/docs') || pathname.startsWith('/api/search')) {
      return NextResponse.next();
    }
    return NextResponse.redirect(`https://${MAIN_HOST}${pathname}${search}`, 308);
  }

  if (hostname === MAIN_HOST && pathname.startsWith('/docs')) {
    return NextResponse.redirect(`https://${DOCS_HOST}${pathname}${search}`, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!_next/|.*\\.).*)',
};
