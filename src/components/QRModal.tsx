'use client';

import { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  imageUrl?: string; // backend devuelve { qrUrl }
};

export default function QRModal({ open, onClose, imageUrl }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Código QR</h3>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-sm hover:bg-gray-100">Cerrar</button>
        </div>
        {imageUrl ? (
          <div className="flex flex-col items-center">
            <img src={imageUrl} alt="QR" className="h-64 w-64 rounded-md border object-contain" />
            <a
              href={imageUrl}
              className="mt-3 text-sm text-blue-600 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Abrir/descargar
            </a>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Generando…</p>
        )}
      </div>
    </div>
  );
}
