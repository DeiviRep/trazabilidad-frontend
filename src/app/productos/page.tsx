'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Package, Eye, QrCode } from 'lucide-react';
import { TrazabilidadAPI } from '@/services/api';
import QRModal from '@/components/QRModal';

export interface DataProductType {
  lote: string
  uuidLote: string
  id: string
  marca: string
  modelo: string
  imeiSerial: string
  estado: string
  urlLote: string
  fechaCreacion: string
  eventos: Evento[]
}

export interface Evento {
  tipo: EstadoEvento
  fecha: string
  puntoControl: string
  coordenadas: number[]
}


type EstadoEvento = 'REGISTRADO' | 'EMBARCADO' | 'DESEMBARCADO' | 'NACIONALIZADO' | 'EN_DISTRIBUCION' | 'PRODUCTO_ADQUIRIDO';

interface ProductosType {
  id: string;
  lote: string;
  marca: string;
  modelo: string;
  imeiSerial: number;
  estado: EstadoEvento;
  url: string;
  fechaCreacion: string;
  eventos: Array<{
    tipo: EstadoEvento;
    fecha: string;
    puntoControl: string;
    coordenadas: [number, number];
  }>;
}

export default function ProductosPage() {
  const [filtro, setFiltro] = useState<string>('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('TODOS');
  const [dataProductos, setDataProductos] = useState<ProductosType[]>([]);
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);
  const [selectedProducto, setSelectedProducto] = useState<string>('');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const estados: string[] = ['TODOS', 'REGISTRADO', 'EMBARCADO', 'DESEMBARCADO', 'NACIONALIZADO', 'EN_DISTRIBUCION', 'PRODUCTO_ADQUIRIDO'];
  const estadoColors: Record<EstadoEvento, string> = {
    'REGISTRADO': 'bg-gray-100 text-gray-800',
    'EMBARCADO': 'bg-blue-100 text-blue-800',
    'DESEMBARCADO': 'bg-yellow-100 text-yellow-800',
    'NACIONALIZADO': 'bg-green-100 text-green-800',
    'EN_DISTRIBUCION': 'bg-purple-100 text-purple-800',
    'PRODUCTO_ADQUIRIDO': 'bg-red-100 text-red-800'
  };

  const productosFiltrados = dataProductos.filter(producto => {
    const coincideTexto = producto.marca.toLowerCase().includes(filtro.toLowerCase()) || 
                          producto.modelo.toLowerCase().includes(filtro.toLowerCase()) ||
                          producto.lote.includes(filtro);
    const coincideEstado = estadoFiltro === 'TODOS' || producto.estado === estadoFiltro;
    return coincideTexto && coincideEstado;
  });
  const handleOpenQrModal = async (id: string) => {
    await TrazabilidadAPI.generarQR(id);
    setSelectedProducto(id);
    setQrModalOpen(true);
  };

  const cargarDatos = async () => {
    const data = await TrazabilidadAPI.listarProductos();
    setDataProductos(data.map((item: DataProductType) => {
      return {
        id: item.id,
        lote: item.lote,
        marca: item.marca,
        modelo: item.modelo,
        imeiSerial: item.imeiSerial,
        estado: item.estado,
        url: item.urlLote,
        fechaCreacion: item.fechaCreacion,
        eventos: item.eventos,
      }
    }));
  };
  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <div className="space-y-6">
      <QRModal onClose={ () => setQrModalOpen(false)} open={qrModalOpen} imageUrl={`${API_BASE_URL}/trazabilidad/qr-image/${selectedProducto}`} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold text-gray-900">Lista de Productos</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Nuevo Producto</span>
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <input
            type="text"
            placeholder="Buscar por marca, modelo o IMEI..."
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
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Producto</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Lote</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">IMEI/Serial</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Estado</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Última Ubicación</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((lote) => (
                <tr key={lote.id} className="border-b border-gray-100 hover:bg-gray-50">
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
                    <div>
                      <p className="font-medium text-gray-900">{lote.lote}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">{lote.imeiSerial}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${estadoColors[lote.estado]}`}>
                      {lote.estado.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {lote.eventos[lote.eventos.length - 1]?.puntoControl || 'No disponible'}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex space-x-2">
                      <button onClick={() => handleOpenQrModal(lote.id)} className="text-green-600 hover:text-green-800 p-1" title="Ver todos los QR">
                        <QrCode className="w-4 h-4" />
                      </button>
                    </div>
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


