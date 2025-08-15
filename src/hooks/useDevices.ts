'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dispositivo } from '@/types/device';
import { ActualizarPayload, RegistrarPayload, TrazabilidadAPI } from '@/services/api';

export const useDevices = () => {
  const [devices, setDevices] = useState<Dispositivo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await TrazabilidadAPI.listar();
      setDevices(data);
    } catch (e:any) {
      setError(e?.message || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const register = async (payload: RegistrarPayload) => {
    const res = await TrazabilidadAPI.registrar(payload);
    await reload();
    return res;
  };

  const update = async (payload: ActualizarPayload) => {
    const res = await TrazabilidadAPI.actualizar(payload);
    await reload();
    return res;
  };

  const byId = useMemo(() => {
    const map = new Map<string, Dispositivo>();
    devices.forEach(d => map.set(d.id, d));
    return map;
  }, [devices]);

  return { devices, byId, loading, error, reload, register, update };
};
