import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { canAccessRoute, type Rol } from '@/lib/roleConfig';

const PUBLIC_PATHS = ['/login', '/trazabilidad/historial', '/scanner'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rutas públicas: dejar pasar siempre
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get('token')?.value;
  const userRaw = req.cookies.get('user')?.value;

  // Sin token → login
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Sin user en cookie (raro, pero defensivo)
  if (!userRaw) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    const user = JSON.parse(userRaw) as { rol: Rol };
    // Ruta raíz → dashboard
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    // Verificar permiso de rol
    if (!canAccessRoute(user.rol, pathname)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};