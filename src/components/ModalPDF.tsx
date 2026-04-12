// src/components/ModalPDF.tsx
'use client';

import { useEffect, useRef } from 'react';
import { X, Download, FileText, Shield } from 'lucide-react';

interface ModalPDFProps {
  url: string;
  filename: string;
  onClose: () => void;
}

export function ModalPDF({ url, filename, onClose }: ModalPDFProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Limpiar blob URL al desmontar
  useEffect(() => {
    return () => { URL.revokeObjectURL(url); };
  }, [url]);

  function descargar() {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',zIndex: 9999 }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: '90vw', maxWidth: '960px', height: '90vh' }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0 bg-white">
          <div className="flex items-center gap-3">
            {/* <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-4.5 h-4.5 text-blue-600" />
            </div> */}
            <div>
              <h2 className="text-sm font-bold text-gray-900">Reporte de Auditoría</h2>
              <p className="text-xs text-gray-400 font-mono">{filename}</p>
            </div>
            {/* Badge verificado */}
            {/* <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-lg ml-2">
              <Shield className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs font-semibold text-green-700">Blockchain verificado</span>
            </div> */}
          </div>

          {/* <div className="flex items-center gap-2">
            <button
              onClick={descargar}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Descargar PDF
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div> */}
        </div>

        {/* ── Visor PDF ── */}
        <div className="flex-1 min-h-0 bg-gray-100 p-3">
          <iframe
            src={url}
            className="w-full h-full rounded-xl border border-gray-200 shadow-inner"
            title="Reporte de Auditoría PDF"
          />
        </div>

      </div>
    </div>
  );
}