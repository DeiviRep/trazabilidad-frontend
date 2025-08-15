'use client';

import { useEffect, useState } from 'react';
import { TrazabilidadAPI } from '@/services/api';
import { HistorialItem } from '@/types/device';

export default function HistorialPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [items, setItems] = useState<HistorialItem[]>([]);
  const [err, setErr] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await TrazabilidadAPI.historial(id);
        setItems(data);
      } catch (e:any) {
        setErr(e?.message || 'Error al cargar historial');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Historial: {id}</h1>
      {loading && <p className="text-sm text-gray-500">Cargando…</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}
      <ol className="relative border-l">
        {items.map((it, idx) => (
          <li key={idx} className="mb-6 ml-4">
            <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full border border-white bg-gray-300"></div>
            <time className="mb-1 block text-xs text-gray-500">{new Date(it.timestamp).toLocaleString()}</time>
            <h3 className="text-sm font-semibold">{it.evento}</h3>
            <p className="text-sm text-gray-700">
              {it.marca} {it.modelo} — {it.origen} — <span className="text-gray-500">{it.ubicacion}</span>
            </p>
          </li>
        ))}
        {items.length === 0 && !loading && <p className="text-sm text-gray-500">Sin eventos</p>}
      </ol>
    </div>
  );
}
