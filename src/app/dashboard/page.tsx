'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Package, Truck, CheckCircle, MapPin } from 'lucide-react';
import { TrazabilidadAPI } from '@/services/api';
import { useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Carga dinámica de react-leaflet
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });

interface Stat {
  label: string;
  valor: string;
  icono: React.ComponentType<{ className?: string }>;
  color: string;
}

interface recienteType {
  id: string;
  uuidLote: string;
  urlLote?: string;
  modelo: string;
  marca: string;
  imeiSerial: string;
  estado: string;
  timestamp: string;
  coordenadas?: [number, number];
  puntoControl?: string;
}

interface dataEstadisticaType {
  registrados: string;
  distribuidos: string;
  enTransitos: string;
  nacionalizados: string;
  dispositivosRecientes: recienteType[];
}

interface DispositivoMapa {
  id: string;
  marca: string;
  modelo: string;
  estado: string;
  ubicacion: [number, number];
  puntoControl: string;
}

function MapaEnvios({ dispositivos }: { dispositivos: DispositivoMapa[] }) {
  const center: [number, number] = dispositivos.length > 0 && dispositivos[0].ubicacion
    ? dispositivos[0].ubicacion
    : [-16.5, -68.15];

  return (
    <div className="h-64 w-full overflow-hidden rounded-lg border border-gray-200">
      <MapContainer center={center} zoom={6} className="h-full w-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {dispositivos.map((d) => {
          if (!d.ubicacion || d.ubicacion.length !== 2) return null;
          const [lat, lon] = d.ubicacion;
          if (isNaN(lat) || isNaN(lon)) return null;
          
          return (
            <Marker key={`${d.id}-${lat}-${lon}`} position={[lat, lon]}>
              <Popup>
                <div className="text-xs">
                  <div className="font-semibold">{d.marca} {d.modelo}</div>
                  <div className="text-gray-600">IMEI: {d.id}</div>
                  <div className="text-blue-600 font-medium mt-1">{d.estado}</div>
                  {d.puntoControl && (
                    <div className="text-gray-500 mt-1">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      {d.puntoControl}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default function DashboardPage() {
  const [dataEstadistica, setDataEstadistica] = useState<dataEstadisticaType>();
  const [dispositivosMapa, setDispositivosMapa] = useState<DispositivoMapa[]>([]);

  const stats: Stat[] = [
    { label: 'Productos Registrados', valor: dataEstadistica?.registrados || '0', icono: Package, color: 'bg-blue-500' },
    { label: 'En Tránsito', valor: dataEstadistica?.enTransitos || '0', icono: Truck, color: 'bg-yellow-500' },
    { label: 'Nacionalizados', valor: dataEstadistica?.nacionalizados || '0', icono: CheckCircle, color: 'bg-green-500' },
    { label: 'Distribuidos', valor: dataEstadistica?.distribuidos || '0', icono: MapPin, color: 'bg-purple-500' }
  ];
  
  const cargarDatos = async () => {
    const data = await TrazabilidadAPI.listarPorEstado();
    console.log(data);
    
    const dispositivosRecientes = data.dispositivosRecientes.map((item: any) => {
      return {
        id: item.productoId,
        timestamp: item.fecha,
        imeiSerial: item.imeiSerial,
        uuidLote: item.lote,
        marca: item.marca,
        modelo: item.modelo,
        estado: item.tipo,
        coordenadas: item.coordenadas,
        puntoControl: item.puntoControl
      } as recienteType;
    });

    setDataEstadistica({
      dispositivosRecientes,
      distribuidos: data.estadisticas.enDistribucion,
      nacionalizados: data.estadisticas.nacionalizados,
      enTransitos: data.estadisticas.embarcados,
      registrados: data.estadisticas.registrados
    });

    // Preparar datos para el mapa
    const dispositivosConUbicacion = dispositivosRecientes
      .filter((d: recienteType) => d.coordenadas && d.coordenadas.length === 2)
      .map((d: recienteType) => ({
        id: d.imeiSerial,
        marca: d.marca,
        modelo: d.modelo,
        estado: d.estado,
        ubicacion: d.coordenadas as [number, number],
        puntoControl: d.puntoControl || 'Ubicación no especificada'
      }));

    setDispositivosMapa(dispositivosConUbicacion);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    (async () => {
      const L = await import('leaflet');

      delete (L.Icon.Default.prototype as any)._getIconUrl;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString(),
        iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString(),
        shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString(),
      });
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Mapa de Envíos
            {dispositivosMapa.length > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({dispositivosMapa.length} ubicaciones)
              </span>
            )}
          </h3>
          {dispositivosMapa.length > 0 ? (
            <MapaEnvios dispositivos={dispositivosMapa} />
          ) : (
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No hay ubicaciones disponibles</p>
                <p className="text-sm text-gray-400">Los dispositivos recientes no tienen coordenadas</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}