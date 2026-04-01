'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Package, Plus, Scan, User, X, Menu, LogOut, Truck, Shield, Settings, Box } from 'lucide-react';
import { SIDEBAR_ITEMS, type Rol } from '@/lib/roleConfig';
import { useAuth } from '@/context/AuthContext';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

export const Sidebar: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    home:     Home,
    plus:     Plus,
    package:  Package,
    settings: Settings,
    truck:    Truck,
    shield:   Shield,
    qr:       Scan,
  };

  const rol = (user?.rol ?? 'CONSUMIDOR') as Rol;
  const sidebarItems = SIDEBAR_ITEMS[rol] ?? SIDEBAR_ITEMS['CONSUMIDOR'];
  const menuItems: MenuItem[] = sidebarItems.map((item) => ({
    id:    item.href,
    label: item.label,
    icon:  ICON_MAP[item.icon] ?? Home,
    href:  item.href,
  }));

  const handleLogout = () => {
    logout();
    router.push('/login');
    setSidebarOpen(false);
  };

  // Inicial del usuario para el avatar
  const inicial = user?.nombre?.charAt(0).toUpperCase() ?? 'U';

  const ROL_COLORS: Record<string, string> = {
    ADMIN:         'bg-rose-500/20 text-rose-300 border-rose-500/30',
    PROVEEDOR:     'bg-amber-500/20 text-amber-300 border-amber-500/30',
    TRANSPORTISTA: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    ADUANA:        'bg-violet-500/20 text-violet-300 border-violet-500/30',
    DISTRIBUIDOR:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    CONSUMIDOR:    'bg-slate-500/20 text-slate-300 border-slate-500/30',
  };
  const rolColor = ROL_COLORS[user?.rol ?? ''] ?? ROL_COLORS['CONSUMIDOR'];

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 text-gray-500 hover:text-gray-700 bg-white p-2 rounded-lg shadow-md"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 z-50 h-full w-64 bg-slate-900 text-white transition-transform duration-300 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:z-auto`}>

        {/* ── Header mejorado ── */}
        <div className="relative px-5 pt-6 pb-5 overflow-hidden">
          {/* Fondo decorativo */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-transparent pointer-events-none" />
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-500/10 rounded-full pointer-events-none" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-600/10 rounded-full pointer-events-none" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo icon */}
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 flex-shrink-0">
                <Box className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white leading-tight">Trazabilidad</h1>
                <p className="text-xs text-slate-400 leading-tight">TechImport Bolivia</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Divider con línea sutil */}
        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />

        {/* ── User section mejorada ── */}
        <div className="p-3">
          {user ? (
            <>
              {/* Card de usuario */}
              <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/60 mb-1">
                {/* Avatar con inicial */}
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-600/20">
                  <span className="text-sm font-bold text-white">{inicial}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate leading-tight">{user.nombre}</p>
                  <p className="text-xs text-slate-400 truncate leading-tight">{user.email}</p>
                </div>
              </div>

              {/* Rol badge */}
              <div className="px-3 mb-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${rolColor}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                  {user.rol}
                </span>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all duration-150 text-sm"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">Cerrar sesión</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/60">
              <div className="w-9 h-9 bg-slate-700 rounded-xl flex items-center justify-center animate-pulse flex-shrink-0">
                <User className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-700 rounded w-24 animate-pulse" />
                <div className="h-2.5 bg-slate-700 rounded w-32 animate-pulse" />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};