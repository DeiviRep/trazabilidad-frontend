'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { TrazabilidadAPI } from '@/services/api';

type EstadoEvento = 'REGISTRADO' | 'EMBARCADO' | 'DESEMBARCADO' | 'NACIONALIZADO' | 'EN_DISTRIBUCION' | 'PRODUCTO_ADQUIRIDO';

interface Evento {
  tipo: EstadoEvento;
  fecha: string;
  punto: string;
  coordenadas: [number, number];
  contenedor?: string;
  dim?: string;
  valorCIF?: number;
  totalPagado?: number;
}

interface Lote {
  id: string;
  lote: string;
  marca: string;
  modelo: string;
  cantidadProductos: number;
  estado: EstadoEvento;
  url: string;
  fechaCreacion: string;
  eventos: Evento[];
}

const estados: string[] = ['TODOS', 'REGISTRADO', 'EMBARCADO', 'DESEMBARCADO', 'NACIONALIZADO', 'EN_DISTRIBUCION', 'PRODUCTO_ADQUIRIDO'];

const estadoColors: Record<EstadoEvento, string> = {
  'REGISTRADO': 'bg-gray-100 text-gray-800',
  'EMBARCADO': 'bg-blue-100 text-blue-800',
  'DESEMBARCADO': 'bg-yellow-100 text-yellow-800',
  'NACIONALIZADO': 'bg-green-100 text-green-800',
  'EN_DISTRIBUCION': 'bg-purple-100 text-purple-800',
  'PRODUCTO_ADQUIRIDO': 'bg-red-100 text-red-800'
};

export default function LotesPage() {
  const [filtro, setFiltro] = useState<string>('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('TODOS');
  const [dataLotes, setDataLotes] = useState<Lote[]>([]);

  const cargarDatos = async () => {
    const data = await TrazabilidadAPI.listarResumenLotes();
    setDataLotes(data?.map((lote: any)=>{
      return {
        id: lote.id,
        lote: lote.lote,
        marca: lote.marca,
        modelo: lote.modelo,
        cantidadProductos: lote.cantidadProductos,
        estado: lote.estadoMinimo,
        url: lote.url,
        fechaCreacion: lote.fechaCreacion,
        eventos: lote.eventos
      }
    }))
  };
  useEffect(() => {
    cargarDatos();
  }, []);

  const lotesFiltrados = dataLotes?.filter(lote => {
    const coincideTexto = lote.marca.toLowerCase().includes(filtro.toLowerCase()) || 
                          lote.modelo.toLowerCase().includes(filtro.toLowerCase()) ||
                          lote.lote.toLowerCase().includes(filtro.toLowerCase());
    const coincideEstado = estadoFiltro === 'TODOS' || lote.estado === estadoFiltro;
    return coincideTexto && coincideEstado;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Lotes</h2>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <input
            type="text"
            placeholder="Buscar por marca, modelo o lote..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {estados.map(estado => (
              <option key={estado} value={estado}>{estado.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Lote</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Producto</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Cantidad</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Estado</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Fecha</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lotesFiltrados?.map((lote) => (
                <tr key={lote.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{lote.lote}</p>
                      <p className="text-sm text-gray-500 font-mono">{lote.id}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{lote.marca}</p>
                        <p className="text-sm text-gray-500">{lote.modelo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-blue-600">{lote.cantidadProductos}</span>
                      <span className="text-sm text-gray-500">unidades</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${estadoColors[lote.estado]}`}>
                      {lote.estado.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {new Date(lote.fechaCreacion).toLocaleDateString('es-BO')}
                  </td>
                  <td className="py-4 px-4">
                    <Link
                      href={`/lotes/${lote.id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Gestionar eventos
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}