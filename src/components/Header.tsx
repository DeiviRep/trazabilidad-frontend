'use client';

import React from 'react';
import { Clock, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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

export const Header: React.FC = () => {
  const { user } = useAuth();
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="ml-12 md:ml-0"> {/* Add left margin on mobile to account for menu button */}
            <h1 className="text-xl font-semibold text-gray-900">Sistema de Trazabilidad</h1>
            <p className="text-sm text-gray-500">{fakeUser.empresa}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* <div className="text-sm text-gray-500">
            <Clock className="w-4 h-4 inline mr-1" />
            {new Date().toLocaleTimeString('es-BO', { 
              hour: '2-digit', 
              minute: '2-digit',
              timeZoneName: 'short'
            })}
          </div> */}
          
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
                {user?.rol && (
                  <div className="mb-3">
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-400 text-white-600 rounded">
                      {user.rol}
                    </span>
                  </div>
                )}
        </div>
      </div>
    </header>
  );
};