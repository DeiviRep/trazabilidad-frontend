// Roles disponibles según el manual
export type Rol =
  | 'ADMIN'
  | 'PROVEEDOR'
  | 'TRANSPORTISTA'
  | 'ADUANA_EXTRANJERA'
  | 'ADUANA_BOLIVIA'
  | 'ADUANA'
  | 'DISTRIBUIDOR'
  | 'COMERCIANTE'
  | 'CONSUMIDOR'
  | 'IMPORTADOR';

// Qué rutas puede ver cada rol
export const ROLE_ROUTES: Record<Rol, string[]> = {
  ADMIN:        ['/dashboard', '/lotes', '/registro', '/productos', '/scanner'],
  PROVEEDOR:    ['/dashboard', '/lotes', '/registro', '/productos', '/scanner'],
  IMPORTADOR:   ['/dashboard', '/lotes', '/registro', '/productos', '/scanner'],
  TRANSPORTISTA:['/dashboard', '/lotes', '/scanner'],
  ADUANA:       ['/dashboard', '/lotes', '/scanner'],
  ADUANA_EXTRANJERA:['/dashboard', '/lotes', '/scanner'],
  ADUANA_BOLIVIA:['/dashboard', '/lotes', '/scanner'],
  DISTRIBUIDOR: ['/dashboard', '/lotes', '/scanner'],
  COMERCIANTE: ['/dashboard', '/lotes', '/scanner', '/productos'],
  CONSUMIDOR:   ['/dashboard', '/scanner'],
};

// Qué menú mostrar en Sidebar por rol
export const SIDEBAR_ITEMS: Record<Rol, { label: string; href: string; icon: string }[]> = {
  ADMIN: [
    { label: 'Dashboard',     href: '/dashboard',  icon: 'home' },
    { label: 'Nuevo Pedido',  href: '/registro',   icon: 'plus' },
    { label: 'Gestión Lotes', href: '/lotes',      icon: 'settings' },
    { label: 'Productos',     href: '/productos',  icon: 'package' },
    { label: 'Escanear QR',   href: '/scanner',    icon: 'qr' },
  ],
  PROVEEDOR: [
    { label: 'Dashboard',     href: '/dashboard',  icon: 'home' },
    { label: 'Nuevo Pedido',  href: '/registro',   icon: 'plus' },
    { label: 'Mis Lotes',     href: '/lotes',      icon: 'package' },
    { label: 'Escanear QR',   href: '/scanner',    icon: 'qr' },
  ],
  IMPORTADOR:[
    { label: 'Dashboard',     href: '/dashboard',  icon: 'home' },
    { label: 'Nuevo Pedido',  href: '/registro',   icon: 'plus' },
    { label: 'Mis Lotes',     href: '/lotes',      icon: 'package' },
    { label: 'Escanear QR',   href: '/scanner',    icon: 'qr' },
  ],
  TRANSPORTISTA: [
    { label: 'Dashboard',     href: '/dashboard',  icon: 'home' },
    { label: 'Lotes Activos', href: '/lotes',      icon: 'truck' },
    { label: 'Escanear QR',   href: '/scanner',    icon: 'qr' },
  ],
  ADUANA: [
    { label: 'Dashboard',     href: '/dashboard',  icon: 'home' },
    { label: 'Lotes Aduana',  href: '/lotes',      icon: 'shield' },
    { label: 'Escanear QR',   href: '/scanner',    icon: 'qr' },
  ],
  ADUANA_EXTRANJERA: [
    { label: 'Dashboard',     href: '/dashboard',  icon: 'home' },
    { label: 'Lotes Aduana',  href: '/lotes',      icon: 'shield' },
    { label: 'Escanear QR',   href: '/scanner',    icon: 'qr' },
  ],
  ADUANA_BOLIVIA: [
    { label: 'Dashboard',     href: '/dashboard',  icon: 'home' },
    { label: 'Lotes Aduana',  href: '/lotes',      icon: 'shield' },
    { label: 'Escanear QR',   href: '/scanner',    icon: 'qr' },
  ],
  DISTRIBUIDOR: [
    { label: 'Dashboard',     href: '/dashboard',  icon: 'home' },
    { label: 'Lotes',         href: '/lotes',      icon: 'package' },
    { label: 'Escanear QR',   href: '/scanner',    icon: 'qr' },
  ],
  COMERCIANTE: [
    { label: 'Dashboard',     href: '/dashboard',  icon: 'home' },
    { label: 'Lotes',         href: '/lotes',      icon: 'package' },
    { label: 'Escanear QR',   href: '/scanner',    icon: 'qr' },
  ],
  CONSUMIDOR: [
    { label: 'Dashboard',     href: '/dashboard',  icon: 'home' },
    { label: 'Verificar QR',  href: '/scanner',    icon: 'qr' },
  ],
};

export function canAccessRoute(rol: Rol, pathname: string): boolean {
  const allowed = ROLE_ROUTES[rol] ?? [];
  return allowed.some((r) => pathname === r || pathname.startsWith(r + '/'));
}