'use client';

import React, { use, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Download, QrCode, Package, Ship, Truck, CheckCircle, MapPin, Navigation } from 'lucide-react';
import { TrazabilidadAPI } from '@/services/api';

// Carga dinámica de react-leaflet
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(m => m.Polyline), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(m => m.CircleMarker), { ssr: false });

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

// ✅ MAPEO DE COLORES POR ESTADO
const ESTADO_CONFIG = {
  REGISTRADO: {
    color: '#3B82F6',
    icon: Package,
    label: 'Registrado',
    bgClass: 'bg-blue-500'
  },
  EMBARCADO: {
    color: '#F97316',
    icon: Truck,
    label: 'Embarcado',
    bgClass: 'bg-orange-500'
  },
  DESEMBARCADO: {
    color: '#06B6D4',
    icon: Ship,
    label: 'Desembarcado',
    bgClass: 'bg-cyan-500'
  },
  NACIONALIZADO: {
    color: '#10B981',
    icon: CheckCircle,
    label: 'Nacionalizado',
    bgClass: 'bg-green-500'
  },
  EN_DISTRIBUCION: {
    color: '#A855F7',
    icon: MapPin,
    label: 'En Distribución',
    bgClass: 'bg-purple-500'
  },
  PRODUCTO_ADQUIRIDO: {
    color: '#EC4899',
    icon: Package,
    label: 'Adquirido',
    bgClass: 'bg-pink-500'
  }
};

// Componente del Mapa con la ruta trazada
function MapaTrazabilidad({ eventos }: { eventos: Evento[] }) {
  // Filtrar eventos con coordenadas válidas
  const eventosConCoordenadas = eventos.filter(e => 
    e.coordenadas && 
    e.coordenadas.length === 2 && 
    !isNaN(e.coordenadas[0]) && 
    !isNaN(e.coordenadas[1])
  );

  if (eventosConCoordenadas.length === 0) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No hay coordenadas disponibles para mostrar el mapa</p>
        </div>
      </div>
    );
  }

  // Centro del mapa (primera coordenada)
  const center: [number, number] = eventosConCoordenadas[0].coordenadas;

  // Crear array de posiciones para la línea
  const positions: [number, number][] = eventosConCoordenadas.map(e => e.coordenadas);

  return (
    <div className="h-96 w-full overflow-hidden rounded-lg border-2 border-gray-200 shadow-lg">
      <MapContainer 
        center={center} 
        zoom={4} 
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        {/* Línea de ruta con gradiente de colores */}
        {eventosConCoordenadas.map((evento, index) => {
          if (index === eventosConCoordenadas.length - 1) return null;
          
          const siguienteEvento = eventosConCoordenadas[index + 1];
          const config = ESTADO_CONFIG[evento.tipo];
          
          return (
            <Polyline
              key={`line-${index}`}
              positions={[evento.coordenadas, siguienteEvento.coordenadas]}
              color={config.color}
              weight={4}
              opacity={0.7}
              dashArray="10, 10"
              className="animate-dash"
            />
          );
        })}

        {/* Marcadores para cada evento */}
        {eventosConCoordenadas.map((evento, index) => {
          const config = ESTADO_CONFIG[evento.tipo];
          const Icon = config.icon;
          const isFirst = index === 0;
          const isLast = index === eventosConCoordenadas.length - 1;

          return (
            <CircleMarker
              key={`marker-${index}`}
              center={evento.coordenadas}
              radius={isLast ? 12 : isFirst ? 10 : 8}
              fillColor={config.color}
              color="white"
              weight={3}
              opacity={1}
              fillOpacity={0.9}
            >
              <Popup>
                <div className="text-sm p-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`p-1.5 rounded-full ${config.bgClass}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-gray-900">{config.label}</span>
                  </div>
                  
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="font-semibold">Ubicación:</span>
                      <p className="text-gray-700">{evento.puntoControl}</p>
                    </div>
                    
                    <div>
                      <span className="font-semibold">Fecha:</span>
                      <p className="text-gray-700">
                        {new Date(evento.fecha).toLocaleString('es-BO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    
                    <div>
                      <span className="font-semibold">Coordenadas:</span>
                      <p className="text-gray-600 font-mono">
                        {evento.coordenadas[0].toFixed(4)}, {evento.coordenadas[1].toFixed(4)}
                      </p>
                    </div>

                    {evento.contenedor && (
                      <div>
                        <span className="font-semibold">Contenedor:</span>
                        <p className="text-gray-700">{evento.contenedor}</p>
                      </div>
                    )}

                    {evento.dim && (
                      <div className="mt-2 p-2 bg-green-50 rounded">
                        <p className="font-semibold text-green-800">Nacionalización</p>
                        <p>DIM: {evento.dim}</p>
                        {evento.valorCIF && <p>CIF: ${evento.valorCIF.toLocaleString()}</p>}
                        {evento.totalPagado && <p>Pagado: ${evento.totalPagado.toLocaleString()}</p>}
                      </div>
                    )}
                  </div>

                  {isFirst && (
                    <div className="mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded text-center">
                      📍 ORIGEN
                    </div>
                  )}
                  
                  {isLast && (
                    <div className="mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded text-center">
                      🎯 UBICACIÓN ACTUAL
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Marcador especial para el punto actual (último evento) */}
        {eventosConCoordenadas.length > 0 && (
          <Marker position={eventosConCoordenadas[eventosConCoordenadas.length - 1].coordenadas}>
            <Popup>
              <div className="text-sm font-bold text-green-600">
                📍 Ubicación Actual
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      <style jsx global>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animate-dash {
          animation: dash 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default function TrazabilidadPage({ params }: { params: Promise<Params> }) {
  const { id: idProducto } = use(params);
  const [dataDispositivos, setDataDispositivos] = useState<DispositivoDataType>({} as DispositivoDataType);
  const [loading, setLoading] = useState(true);

  const getEventIcon = (tipo: EstadoEvento): React.ComponentType<{ className?: string }> => {
    return ESTADO_CONFIG[tipo]?.icon || Package;
  };

  const getEventColor = (tipo: EstadoEvento): string => {
    return ESTADO_CONFIG[tipo]?.bgClass || 'bg-gray-500';
  };

  const cargarDatos = async (id: string) => {
    try {
      setLoading(true);
      const data = await TrazabilidadAPI.consultar(id);
      setDataDispositivos(data);
    } catch (e: any) {
      console.error('Error al cargar datos:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos(idProducto);
  }, [idProducto]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">Cargando trazabilidad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Trazabilidad del Producto</h2>
          <p className="text-gray-600 text-sm mt-1">
            Recorrido completo desde el origen hasta la ubicación actual
          </p>
        </div>
        <div className="flex space-x-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Mapa de Trazabilidad */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Navigation className="w-5 h-5 text-blue-600" />
            <span>Mapa de Trazabilidad</span>
          </h3>
          <div className="text-sm text-gray-600">
            {dataDispositivos.eventos?.length || 0} puntos registrados
          </div>
        </div>
        
        {/* Leyenda del mapa */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-semibold text-gray-700 mb-2">Leyenda:</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(ESTADO_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <div key={key} className="flex items-center space-x-1">
                  <div className={`p-1 rounded-full ${config.bgClass}`}>
                    <Icon className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs text-gray-700">{config.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <MapaTrazabilidad eventos={dataDispositivos.eventos || []} />
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
                  <span className="text-sm text-gray-600">Lote:</span>
                  <span className="text-sm font-medium text-gray-900">{dataDispositivos.lote}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Estado:</span>
                  <span className={`text-sm font-medium px-2 py-1 rounded ${getEventColor(dataDispositivos.estado)} text-white`}>
                    {ESTADO_CONFIG[dataDispositivos.estado]?.label || dataDispositivos.estado}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Imei/Serial:</span>
                  <span className="text-sm font-medium text-gray-900">{dataDispositivos.imeiSerial}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-gray-600">URL Gestionar:</span>
                  <a 
                    href={dataDispositivos.urlLote} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 truncate"
                  >
                    {dataDispositivos.urlLote}
                  </a>
                </div>
              </div>

              {/* Estadísticas rápidas */}
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {dataDispositivos.eventos?.length || 0}
                    </div>
                    <div className="text-xs text-blue-600">Eventos</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {dataDispositivos.eventos?.filter(e => e.coordenadas).length || 0}
                    </div>
                    <div className="text-xs text-green-600">Ubicaciones</div>
                  </div>
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
                const config = ESTADO_CONFIG[evento.tipo];
                
                return (
                  <div key={index} className="relative pb-8">
                    {!isLast && (
                      <div className="absolute left-4 top-8 w-0.5 h-full bg-gray-200" />
                    )}
                    
                    <div className="flex items-start space-x-4">
                      <div className={`${getEventColor(evento.tipo)} w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${isLast ? 'animate-pulse' : ''}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-gray-900">{config?.label || evento.tipo.replace('_', ' ')}</h4>
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
                          <div className="flex items-center space-x-1 mt-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <p className="text-xs text-gray-500">
                              {evento.coordenadas[0].toFixed(4)}, {evento.coordenadas[1].toFixed(4)}
                            </p>
                          </div>
                        )}

                        {isLast && (
                          <div className="mt-2 inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                            📍 Ubicación Actual
                          </div>
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