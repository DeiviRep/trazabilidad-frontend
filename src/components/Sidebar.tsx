'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Plus, History, Scan, User, X, Menu } from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

interface Usuario {
  nombre: string;
  rol: string;
  empresa: string;
}

const fakeUser: Usuario = {
  nombre: 'Juan Pérez',
  rol: 'IMPORTADOR',
  empresa: 'TechImport Bolivia'
};

export const Sidebar: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/' },
    { id: 'registro', label: 'Nuevo Pedido', icon: Plus, href: '/registro' },
    { id: 'lotes', label: 'Gestión de Lotes', icon: Package, href: '/lotes' },
    { id: 'productos', label: 'Productos', icon: Package, href: '/productos' },
    // { id: 'trazabilidad', label: 'Historial Producto', icon: History, href: '/trazabilidad' },
    { id: 'scanner', label: 'Escanear QR', icon: Scan, href: '/scanner' },
  ];

  return (
    <>
      {/* Mobile menu button - placed in header through context or global state */}
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
      <div className={`fixed left-0 top-0 z-50 h-full w-64 bg-slate-900 text-white transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:z-auto`}>
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Trazabilidad</h1>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <nav className="p-4">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  isActive ? 'bg-blue-600' : 'hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fakeUser.nombre}</p>
              <p className="text-xs text-slate-400 truncate">{fakeUser.rol}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};