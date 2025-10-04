'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Package, Plus, History, Scan, User, X, Menu, LogOut } from 'lucide-react';
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

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/' },
    { id: 'registro', label: 'Nuevo Pedido', icon: Plus, href: '/registro' },
    { id: 'lotes', label: 'Gestión de Lotes', icon: Package, href: '/lotes' },
    { id: 'productos', label: 'Productos', icon: Package, href: '/productos' },
    // { id: 'trazabilidad', label: 'Historial Producto', icon: History, href: '/trazabilidad' },
    { id: 'scanner', label: 'Escanear QR', icon: Scan, href: '/scanner' },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
    setSidebarOpen(false);
  };

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
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Trazabilidad</h1>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
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
        
        {/* User Info Section */}
        <div className="border-t border-slate-700">
          {user ? (
            <>
              <div className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.nombre}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-slate-800 transition-colors border-t border-slate-700"
              >
                <LogOut className="w-5 h-5" />
                <span>Cerrar Sesión</span>
              </button>
            </>
          ) : (
            <div className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center animate-pulse">
                  <User className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-700 rounded w-24 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-slate-700 rounded w-32 animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};