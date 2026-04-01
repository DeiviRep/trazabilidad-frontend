// Roles disponibles según el manual
export type Rol =
  | 'ADMIN'
  | 'PROVEEDOR'
  | 'TRANSPORTISTA'
  | 'ADUANA'
  | 'DISTRIBUIDOR'
  | 'CONSUMIDOR';

// Qué rutas puede ver cada rol
export const ROLE_ROUTES: Record<Rol, string[]> = {
  ADMIN:        ['/', '/lotes', '/registro', '/productos', '/scanner'],
  PROVEEDOR:    ['/', '/lotes', '/registro', '/productos', '/scanner'],
  TRANSPORTISTA:['/', '/lotes', '/scanner'],
  ADUANA:       ['/', '/lotes', '/scanner'],
  DISTRIBUIDOR: ['/', '/lotes', '/scanner'],
  CONSUMIDOR:   ['/', '/scanner'],
};

// Qué menú mostrar en Sidebar por rol
export const SIDEBAR_ITEMS: Record<Rol, { label: string; href: string; icon: string }[]> = {
  ADMIN: [
    { label: 'Dashboard',     href: '/',  icon: 'home' },
    { label: 'Nuevo Pedido',  href: '/registro',   icon: 'plus' },
    { label: 'Gestión Lotes', href: '/lotes',      icon: 'settings' },
    { label: 'Productos',     href: '/productos',  icon: 'package' },
    { label: 'Escanear QR',   href: '/scanner',    icon: 'qr' },
  ],
  PROVEEDOR: [
    { label: 'Dashboard',     href: '/',  icon: 'home' },
    { label: 'Nuevo Pedido',  href: '/registro',   icon: 'plus' },
    { label: 'Mis Lotes',     href: '/lotes',      icon: 'package' },
    { label: 'Escanear QR',   href: '/scanner',    icon: 'qr' },
  ],
  TRANSPORTISTA: [
    { label: 'Dashboard',     href: '/',  icon: 'home' },
    { label: 'Lotes Activos', href: '/lotes',      icon: 'truck' },
    { label: 'Escanear QR',   href: '/scanner',    icon: 'qr' },
  ],
  ADUANA: [
    { label: 'Dashboard',     href: '/',  icon: 'home' },
    { label: 'Lotes Aduana',  href: '/lotes',      icon: 'shield' },
    { label: 'Escanear QR',   href: '/scanner',    icon: 'qr' },
  ],
  DISTRIBUIDOR: [
    { label: 'Dashboard',     href: '/',  icon: 'home' },
    { label: 'Lotes',         href: '/lotes',      icon: 'package' },
    { label: 'Escanear QR',   href: '/scanner',    icon: 'qr' },
  ],
  CONSUMIDOR: [
    { label: 'Dashboard',     href: '/',  icon: 'home' },
    { label: 'Verificar QR',  href: '/scanner',    icon: 'qr' },
  ],
};

export function canAccessRoute(rol: Rol, pathname: string): boolean {
  const allowed = ROLE_ROUTES[rol] ?? [];
  return allowed.some((r) => pathname === r || pathname.startsWith(r + '/'));
}