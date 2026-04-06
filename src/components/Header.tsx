'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ChevronRight, Clock, Wifi, Activity, Bell } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  dashboard:   'Dashboard',
  lotes:       'Gestión de Lotes',
  registro:    'Nuevo Pedido',
  productos:   'Productos',
  scanner:     'Verificar QR',
  trazabilidad:'Trazabilidad',
  historial:   'Historial',
};

function getSaludo(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

const ROL_BADGE: Record<string, string> = {
  ADMIN:         'bg-rose-100 text-rose-700 border-rose-200',
  PROVEEDOR:     'bg-amber-100 text-amber-700 border-amber-200',
  TRANSPORTISTA: 'bg-sky-100 text-sky-700 border-sky-200',
  ADUANA:        'bg-violet-100 text-violet-700 border-violet-200',
  DISTRIBUIDOR:  'bg-emerald-100 text-emerald-700 border-emerald-200',
  CONSUMIDOR:    'bg-slate-100 text-slate-700 border-slate-200',
};

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const [hora, setHora] = useState('');
  const [fecha, setFecha] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setHora(now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setFecha(now.toLocaleDateString('es-BO', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((seg, i) => {
    const isUUID = /^[0-9a-f-]{36}$/i.test(seg);
    return {
      label: isUUID ? seg.slice(0, 8) + '…' : (ROUTE_LABELS[seg] ?? seg),
      isLast: i === segments.length - 1,
    };
  });

  const rolBadgeClass = ROL_BADGE[user?.rol ?? ''] ?? ROL_BADGE['CONSUMIDOR'];
  const inicial = user?.nombre?.charAt(0).toUpperCase() ?? 'U';

  return (
    <header className="bg-white border-b border-gray-200 px-5 flex-shrink-0 h-12 flex items-center justify-between gap-4">
      <div className="flex items-center gap-1.5 min-w-0">
        {crumbs.length === 0 ? (
          <span className="text-sm font-semibold text-gray-700">
            {getSaludo()}{user?.nombre ? `, ${user.nombre.split(' ')[0]}` : ''}
          </span>
        ) : (
          <>
            <span className="text-xs text-gray-400 hidden sm:block">
              {getSaludo()}{user?.nombre ? `, ${user.nombre.split(' ')[0]}` : ''}&nbsp;·&nbsp;
            </span>
            {crumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />}
                <span className={`text-xs truncate ${crumb.isLast ? 'font-semibold text-gray-800' : 'text-gray-400'}`}>
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </>
        )}
      </div>

      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs font-mono text-gray-600 tabular-nums">{hora}</span>
          <span className="text-xs text-gray-400 hidden lg:block">&nbsp;{fecha}</span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <Activity className="w-3.5 h-3.5 text-green-600" />
          <span className="text-xs font-medium text-green-700">Blockchain activo</span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
          <Wifi className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs font-medium text-blue-700">Hyperledger Fabric</span>
        </div>

        <div className="w-px h-5 bg-gray-200" />

        {user?.rol && (
          <span className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${rolBadgeClass}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
            {user.rol}
          </span>
        )}

        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-xs font-bold text-white">{inicial}</span>
        </div>
      </div>
    </header>
  );
};