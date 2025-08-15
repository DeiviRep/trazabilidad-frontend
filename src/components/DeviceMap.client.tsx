'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo } from 'react';
import { Dispositivo } from '@/types/device';
import { formatCoords } from '@/utils/formatters';
import type { Map as LeafletMap } from 'leaflet';

// Carga dinámica de react-leaflet (cliente)
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });

type Props = {
  devices: Dispositivo[];
  onPick?: (lat: number, lon: number) => void;
};

export default function DeviceMap({ devices, onPick }: Props) {
  const center = useMemo(() => {
    if (devices.length > 0) {
      const c = formatCoords(devices[0].ubicacion);
      return [c.lat || -16.5, c.lon || -68.15] as [number, number];
    }
    return [-16.5, -68.15] as [number, number]; // La Paz por defecto
  }, [devices]);

  // Opcional: se puede arreglar iconos de marker si los images no se muestran.
  useEffect(() => {
    // nada crítico aquí
  }, []);

  const handleMapReady = (mapInstance: LeafletMap | any) => {
    // mapInstance es el objeto L.Map; registramos click para retornar coords
    // @ts-ignore
    mapInstance.on('click', (e: any) => {
      const lat = e?.latlng?.lat;
      const lon = e?.latlng?.lng;
      if (lat && lon) onPick?.(lat, lon);
    });
  };

  return (
    <div className="h-[360px] w-full overflow-hidden rounded-xl border">
      <MapContainer center={center} zoom={6} className="h-full w-full" whenReady={handleMapReady}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {devices.map((d) => {
          const c = formatCoords(d.ubicacion);
          if (!c || isNaN(c.lat) || isNaN(c.lon)) return null;
          return (
            <Marker key={d.id} position={[c.lat, c.lon]}>
              <Popup>
                <div className="text-xs">
                  <div className="font-semibold">{d.id}</div>
                  <div>{d.modelo} / {d.marca}</div>
                  <div>{d.evento}</div>
                  <div className="text-gray-500">{c.label}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
