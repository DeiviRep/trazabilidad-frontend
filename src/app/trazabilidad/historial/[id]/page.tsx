'use client';

import React, { use, useEffect, useState } from 'react';
import { Download, QrCode, Package, Ship, Truck, CheckCircle, MapPin } from 'lucide-react';
import { TrazabilidadAPI } from '@/services/api';

type EstadoEvento = 'REGISTRADO' | 'EMBARCADO' | 'DESEMBARCADO' | 'NACIONALIZADO' | 'EN_DISTRIBUCION' | 'PRODUCTO_ADQUIRIDO';

interface Evento {
  tipo: EstadoEvento;
  fecha: string;
  puntoControl: string;
  coordenadas: [number, number];
  contenedor?: string;
  dim?: string;
  valorCIF?: number;
  totalPagado?: number;
}

interface DispositivoDataType {
  lote: string;
  id: string;
  marca: string;
  modelo: string;
  imeiSerial: number;
  estado: EstadoEvento;
  urlLote: string;
  fechaCreacion: string;
  eventos: Evento[];
}

interface Params {
  id: string
}

export default function TrazabilidadPage({ params }: { params: Promise<Params> }) {
  const { id: idProducto } = use(params);
  const [dataDispositivos, setDataDispositivos] = useState<DispositivoDataType>({} as DispositivoDataType);

  const getEventIcon = (tipo: EstadoEvento): React.ComponentType<{ className?: string }> => {
    switch (tipo) {
      case 'REGISTRADO': return Package;
      case 'EMBARCADO': return Ship;
      case 'DESEMBARCADO': return Truck;
      case 'NACIONALIZADO': return CheckCircle;
      case 'EN_DISTRIBUCION': return MapPin;
      default: return Package;
    }
  };

  const getEventColor = (tipo: EstadoEvento): string => {
    switch (tipo) {
      case 'REGISTRADO': return 'bg-gray-500';
      case 'EMBARCADO': return 'bg-blue-500';
      case 'DESEMBARCADO': return 'bg-yellow-500';
      case 'NACIONALIZADO': return 'bg-green-500';
      case 'EN_DISTRIBUCION': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const cargarDatos = async (id:string) => {
    try {
      const data = await TrazabilidadAPI.consultar(id);
      setDataDispositivos(data)
    } catch (e:any) {
    } finally {
    }
  };

  useEffect(() => {
    cargarDatos(idProducto);
  }, [idProducto]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Trazabilidad del Producto</h2>
        <div className="flex space-x-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            {/* <Download className="w-4 h-4" />
            <span>Exportar</span> */}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Información del Producto */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Producto</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center w-24 h-24 bg-blue-100 rounded-lg mx-auto mb-4">
                <Package className="w-12 h-12 text-blue-600" />
              </div>
              
              <div className="text-center">
                <h4 className="font-semibold text-gray-900">{dataDispositivos.marca} {dataDispositivos.modelo}</h4>
                <p className="text-sm text-gray-500 font-mono">{dataDispositivos.lote}</p>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">DispositivoDataType:</span>
                  <span className="text-sm font-medium text-gray-900">{dataDispositivos.lote}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Estado:</span>
                  <span className="text-sm font-medium text-green-600">{dataDispositivos.estado}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Imei/Serial:</span>
                  <span className="text-sm font-medium text-gray-900">{dataDispositivos.imeiSerial}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">URL Gestionar:</span>
                  <span className="text-xs text-blue-600 truncate">{dataDispositivos.urlLote}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Timeline de Eventos */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Historial de Trazabilidad</h3>
            
            <div className="relative">
              {dataDispositivos.eventos?.map((evento, index) => {
                const Icon = getEventIcon(evento.tipo);
                const isLast = index === dataDispositivos.eventos.length - 1;
                
                return (
                  <div key={index} className="relative pb-8">
                    {!isLast && (
                      <div className="absolute left-4 top-8 w-0.5 h-full bg-gray-200" />
                    )}
                    
                    <div className="flex items-start space-x-4">
                      <div className={`${getEventColor(evento.tipo)} w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-gray-900">{evento.tipo.replace('_', ' ')}</h4>
                          <span className="text-xs text-gray-500">
                            {new Date(evento.fecha).toLocaleDateString('es-BO', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">{evento.puntoControl}</p>
                        
                        {evento.contenedor && (
                          <p className="text-xs text-gray-500 mt-1">Contenedor: {evento.contenedor}</p>
                        )}
                        
                        {evento.dim && (
                          <div className="mt-2 p-3 bg-green-50 rounded-lg">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-600">DIM:</span>
                                <span className="ml-1 font-medium">{evento.dim}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Valor CIF:</span>
                                <span className="ml-1 font-medium">${evento.valorCIF?.toLocaleString()}</span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-gray-600">Total Pagado:</span>
                                <span className="ml-1 font-medium text-green-600">${evento.totalPagado?.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {evento.coordenadas && (
                          <p className="text-xs text-gray-500 mt-1">
                            📍 {evento.coordenadas[0].toFixed(4)}, {evento.coordenadas[1].toFixed(4)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}