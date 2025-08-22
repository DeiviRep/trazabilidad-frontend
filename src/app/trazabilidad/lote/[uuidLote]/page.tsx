// src/app/trazabilidad/lote/[uuidLote]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { TrazabilidadAPI } from '@/services/api';
import type { Dispositivo } from '@/types/device';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorAlert from '@/components/ErrorAlert';
import DeviceTable from '@/components/DeviceTable';
import QRModal from '@/components/QRModal';

export default function LotePage({ params }: { params: { uuidLote: string } }) {
  const { uuidLote } = params;
  const [items, setItems] = useState<Dispositivo[]>([]);
  const [err, setErr] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  const [qrOpen, setQrOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await TrazabilidadAPI.listarPorLote(uuidLote);
        setItems(data || []);
      } catch (e:any) {
        setErr(e?.message || 'Error al cargar lote');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [uuidLote]);

  const urlLote = items.find(x => x.urlLote)?.urlLote || `${window?.location?.origin || ''}/trazabilidad/lote/${uuidLote}`;

  const handleGenerateQRLote = async () => {
    const res = await TrazabilidadAPI.generarQRLote(uuidLote);
    setQrUrl(res.qrUrl);
    setQrOpen(true);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Lote: {uuidLote}</h1>
      {loading && <LoadingSpinner />}
      <ErrorAlert message={err || undefined} />

      <div className="rounded-lg border p-3 text-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-gray-500">URL del lote</div>
            <a className="text-blue-600 hover:underline break-all" href={urlLote} target="_blank">
              {urlLote}
            </a>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleGenerateQRLote}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            >
              QR del lote
            </button>
          </div>
        </div>
      </div>

      <DeviceTable data={items} onGenerateQR={(id)=>{ /* opcional desde aquí */ }} />

      <QRModal open={qrOpen} onClose={() => setQrOpen(false)} imageUrl={qrUrl} />
    </div>
  );
}
