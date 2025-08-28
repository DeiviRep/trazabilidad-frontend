'use client';

import React, { useEffect, useState } from 'react';
import { Package, Truck, CheckCircle, MapPin, Globe } from 'lucide-react';
import { TrazabilidadAPI } from '@/services/api';

interface Stat {
  label: string;
  valor: string;
  icono: React.ComponentType<{ className?: string }>;
  color: string;
}

interface Lote {
  id: string;
  lote: string;
  marca: string;
  modelo: string;
  cantidadProductos: number;
  estado: string;
  url: string;
  fechaCreacion: string;
  eventos: Array<{
    tipo: string;
    fecha: string;
    punto: string;
    coordenadas: [number, number];
  }>;
}

interface recienteType {
  id: string,
  uuidLote: string,
  urlLote?: string,
  modelo: string,
  marca: string,
  imeiSerial: string,
  estado: string,
  timestamp: string;
}
interface dataEstadisticaType {
  registrados: string,
  distribuidos: string,
  enTransitos: string,
  nacionalizados: string,
  dispositivosRecientes: recienteType[]
}

export default function DashboardPage() {

  const [dataEstadistica, setDataEstadistica] = useState<dataEstadisticaType>();
  const stats: Stat[] = [
    { label: 'Productos Registrados', valor: dataEstadistica?.registrados || '0', icono: Package, color: 'bg-blue-500' },
    { label: 'En Tránsito', valor: dataEstadistica?.enTransitos || '0', icono: Truck, color: 'bg-yellow-500' },
    { label: 'Nacionalizados', valor: dataEstadistica?.nacionalizados || '0', icono: CheckCircle, color: 'bg-green-500' },
    { label: 'Distribuidos', valor: dataEstadistica?.distribuidos || '0', icono: MapPin, color: 'bg-purple-500' }
  ];
  
  const cargarDatos = async () => {
    const data = await TrazabilidadAPI.listarPorEstado();
    console.log(data);
    setDataEstadistica({
      dispositivosRecientes: data.dispositivosRecientes.map((item: any) => {
        return {
          id: item.productoId,
          timestamp: item.fecha,
          imeiSerial: item.imeiSerial,
          uuidLote: item.lote,
          marca: item.marca,
          modelo: item.modelo,
          estado: item.tipo,
        } as recienteType
      }),
      distribuidos: data.estadisticas.enDistribucion,
      nacionalizados: data.estadisticas.nacionalizados,
      enTransitos: data.estadisticas.embarcados,
      registrados: data.estadisticas.registrados
    })
  };
  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        {/* <div className="text-sm text-gray-500">Última actualización: {new Date().toLocaleString('es-BO')}</div> */}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icono;
          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.valor}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
          <div className="space-y-4">
            {dataEstadistica?.dispositivosRecientes.map((producto: recienteType, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{producto.marca} {producto.modelo}</p>
                  <p className="text-xs text-gray-500">Estado: {producto.estado.toUpperCase()}</p>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(producto.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mapa de Envíos</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Globe className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Mapa interactivo</p>
              <p className="text-sm text-gray-400">Visualización de rutas y ubicaciones</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



