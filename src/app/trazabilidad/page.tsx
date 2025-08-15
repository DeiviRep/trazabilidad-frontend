'use client';

import { useDevices } from '@/hooks/useDevices';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorAlert from '@/components/ErrorAlert';
import DeviceTable from '@/components/DeviceTable';
import DeviceForm, { DeviceFormValues } from '@/components/DeviceForm';
import DeviceMap from '@/components/DeviceMap.client';
import QRModal from '@/components/QRModal';
import { useMap } from '@/hooks/useMap';
import { useEffect, useState } from 'react';
import { TrazabilidadAPI } from '@/services/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function TrazabilidadPage() {
  const { token } = useAuth();
  const router = useRouter();
  const { devices, loading, error, register, update } = useDevices();
  const { coords, setCoords, captureBrowserLocation } = useMap();
  const [qrOpen, setQrOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | undefined>(undefined);
  const [selected, setSelected] = useState<any>(null);

  const onSubmit = async (values: DeviceFormValues) => {
    const payload = {
      ...values,
      // Si id no existe, backend generará UUID
      id: values.id?.trim() || undefined
    };
    if (selected?.id) {
      await update({ ...payload, id: selected.id });
      setSelected(null);
    } else {
      await register(payload);
    }
  };

  const handleUseLocation = async () => {
    try {
      const c = await captureBrowserLocation();
      // set in form: lo hacemos rellenando selected temporal
      setSelected((prev:any) => ({
        ...prev,
        latitud: String(c.lat),
        longitud: String(c.lon)
      }));
    } catch (e) {
      alert('No se pudo obtener ubicación');
    }
  };

  const handlePickFromMap = (lat:number, lon:number) => {
    setCoords({ lat, lon });
    setSelected((prev:any) => ({
      ...prev,
      latitud: String(lat),
      longitud: String(lon)
    }));
  };

  const handleGenerateQR = async (id:string) => {
    const res = await TrazabilidadAPI.generarQR(id);
    setQrUrl(res.qrUrl);
    setQrOpen(true);
  };

  useEffect(() => {
    if (!token) {
      router.replace('/login');
    }
  }, [token, router]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border p-4">
        <h2 className="mb-3 text-lg font-semibold">Registrar / Actualizar</h2>
        <DeviceForm
          defaultValues={{
            id: selected?.id,
            modelo: selected?.modelo || '',
            marca: selected?.marca || '',
            origen: selected?.origen || '',
            latitud: selected?.latitud || '',
            longitud: selected?.longitud || '',
            evento: selected?.evento || 'Registro'
          }}
          onSubmit={onSubmit}
          onUseLocation={handleUseLocation}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border p-4">
          <h2 className="mb-3 text-lg font-semibold">Mapa</h2>
          <DeviceMap devices={devices} onPick={handlePickFromMap} />
          <p className="mt-2 text-xs text-gray-500">
            Haz click en el mapa para llenar lat/long en el formulario.
          </p>
        </div>

        <div className="rounded-2xl border p-4">
          <h2 className="mb-3 text-lg font-semibold">Dispositivos</h2>
          {loading && <LoadingSpinner />}
          <ErrorAlert message={error || undefined} />
          <DeviceTable
            data={devices}
            onSelect={(d) => {
              const [lat, lon] = d.ubicacion.split(',');
              setSelected({
                id: d.id,
                modelo: d.modelo,
                marca: d.marca,
                origen: d.origen,
                latitud: lat,
                longitud: lon,
                evento: d.evento
              });
            }}
            onGenerateQR={handleGenerateQR}
          />
        </div>
      </section>

      <QRModal open={qrOpen} onClose={() => setQrOpen(false)} imageUrl={qrUrl} />
    </div>
  );
}
