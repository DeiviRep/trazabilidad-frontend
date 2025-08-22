'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Dispositivo, EventoTipo } from '@/types/device';
import { TrazabilidadAPI} from '@/services/api';
import { EventoLotePayload, EventoUnitarioPayload, RegistroLotePayload, RegistroUnitPayload } from '@/services/typesDto';

export const useDevices = () => {
  const [devices, setDevices] = useState<Dispositivo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  const fetchDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await TrazabilidadAPI.listar();
      setDevices(data || []);
    } catch (e:any) {
      setError(e?.message || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDevices(); }, []);

  const registerOne = async (payload: RegistroUnitPayload) => {
    const res = await TrazabilidadAPI.registroUnitario(payload);
    await fetchDevices();
    return res;
  };
  const registerBatch = async (payload: RegistroLotePayload) => {
    const res = await TrazabilidadAPI.registroLote(payload);
    await fetchDevices();
    return res;
  };

  const updateEventOne = async <E extends EventoTipo>(payload: EventoUnitarioPayload<E>) => {
    const res = await TrazabilidadAPI.eventoUnitario(payload);
    await fetchDevices();
    return res;
  };
  const updateEventBatch = async <E extends EventoTipo>(payload: EventoLotePayload<E>) => {
    const res = await TrazabilidadAPI.eventoLote(payload);
    await fetchDevices();
    return res;
  };

  const byId = useMemo(() => {
    const map = new Map<string, Dispositivo>();
    devices.forEach(d => map.set(d.id, d));
    return map;
  }, [devices]);

  return {
    devices, byId, loading, error, fetchDevices,
    registerOne, registerBatch, updateEventOne, updateEventBatch
  };
};
