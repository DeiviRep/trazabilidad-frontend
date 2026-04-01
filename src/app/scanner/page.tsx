'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, Search, CheckCircle, AlertTriangle, Package, Loader2, X, QrCode, ExternalLink, MapPin, Clock, Hash } from 'lucide-react';
import { TrazabilidadAPI } from '@/services/api';
import type { Dispositivo } from '@/types/device';
import Link from 'next/link';
import jsQR from 'jsqr';

interface ScanResult {
  codigo: string;
  producto: Dispositivo;
  valido: boolean;
}

const ESTADO_COLORES: Record<string, string> = {
  REGISTRADO:        'bg-slate-100 text-slate-700 border-slate-200',
  EMBARCADO:         'bg-blue-100 text-blue-700 border-blue-200',
  DESEMBARCADO:      'bg-amber-100 text-amber-700 border-amber-200',
  NACIONALIZADO:     'bg-emerald-100 text-emerald-700 border-emerald-200',
  EN_DISTRIBUCION:   'bg-violet-100 text-violet-700 border-violet-200',
  PRODUCTO_ADQUIRIDO:'bg-rose-100 text-rose-700 border-rose-200',
};

const ESTADO_LABELS: Record<string, string> = {
  REGISTRADO:        'Registrado',
  EMBARCADO:         'Embarcado',
  DESEMBARCADO:      'Desembarcado',
  NACIONALIZADO:     'Nacionalizado',
  EN_DISTRIBUCION:   'En Distribución',
  PRODUCTO_ADQUIRIDO:'Adquirido',
};

export default function ScannerPage() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(async (id: string) => {
    if (!id.trim()) { setError('Ingresa un ID válido'); return; }
    setLoading(true);
    setError(null);
    setScanResult(null);
    try {
      const producto = await TrazabilidadAPI.consultar(id.trim());
      setScanResult({ codigo: id.trim(), producto, valido: true });
    } catch (err: any) {
      setError(err.message || 'Producto no encontrado');
      setScanResult({ codigo: id.trim(), producto: {} as Dispositivo, valido: false });
    } finally {
      setLoading(false);
    }
  }, []);

  const decodeQRFromImage = useCallback((file: File) => {
    setDecodeError(null);
    setUploadedImage(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setUploadedImage(dataUrl);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          // El QR puede contener una URL completa o solo el UUID
          const raw = code.data;
          // Intentar extraer UUID del final de la URL si es una URL
          const uuidMatch = raw.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
          const id = uuidMatch ? uuidMatch[0] : raw;
          setManualCode(id);
          handleSearch(id);
        } else {
          setDecodeError('No se encontró ningún código QR en la imagen. Intenta con otra foto.');
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, [handleSearch]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) decodeQRFromImage(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) decodeQRFromImage(file);
  };

  const clearResult = () => {
    setScanResult(null);
    setError(null);
    setManualCode('');
    setUploadedImage(null);
    setDecodeError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-0">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verificar Producto</h1>
          <p className="text-sm text-gray-500 mt-1">Escanea un QR o ingresa el ID del dispositivo para verificar su autenticidad</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Panel izquierdo: input ── */}
          <div className="space-y-4">

            {/* Búsqueda manual */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Búsqueda por ID</h3>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(manualCode)}
                    placeholder="UUID del dispositivo..."
                    disabled={loading}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 font-mono"
                  />
                </div>
                <button
                  onClick={() => handleSearch(manualCode)}
                  disabled={loading || !manualCode.trim()}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Search className="w-4 h-4" />
                  }
                  {loading ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 font-mono">ej: 0c43df22-e8c5-4536-8415-a51dd1c6445e</p>
            </div>

            {/* Upload QR */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Subir imagen QR</h3>

              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 ${
                  dragOver
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                {uploadedImage ? (
                  <div className="relative p-3">
                    <img
                      src={uploadedImage}
                      alt="QR subido"
                      className="w-full max-h-48 object-contain rounded-lg"
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); setUploadedImage(null); setDecodeError(null); }}
                      className="absolute top-4 right-4 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                    >
                      <X className="w-3 h-3 text-gray-600" />
                    </button>
                    {loading && (
                      <div className="absolute inset-0 bg-white/70 rounded-lg flex items-center justify-center">
                        <div className="flex items-center gap-2 text-blue-600">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="text-sm font-medium">Procesando...</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-10 flex flex-col items-center gap-3">
                    <div className={`p-3 rounded-full transition-colors ${dragOver ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <Upload className={`w-6 h-6 ${dragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">
                        {dragOver ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz clic'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP</p>
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {decodeError && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">{decodeError}</p>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
              <QrCode className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">¿Tienes el QR físico?</p>
                <p className="text-xs text-blue-600 mt-1">Escanéalo con la cámara de tu celular. Se abrirá el historial directamente sin necesidad de ingresar al sistema.</p>
              </div>
            </div>
          </div>

          {/* ── Panel derecho: resultado ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Resultado</h3>
            </div>

            <div className="p-5">
              {/* Estado vacío */}
              {!scanResult && !error && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <QrCode className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-400 text-sm">Ingresa un ID o sube una imagen QR<br />para verificar un producto</p>
                </div>
              )}

              {/* Producto válido */}
              {scanResult?.valido && (
                <div className="space-y-4">
                  {/* Badge éxito */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">Producto verificado</p>
                      <p className="text-xs text-emerald-600">Registrado en blockchain</p>
                    </div>
                  </div>

                  {/* Info producto */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 flex items-center gap-3 border-b border-gray-200">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{scanResult.producto.marca} {scanResult.producto.modelo}</p>
                        <p className="text-xs text-gray-500 font-mono">{scanResult.producto.id}</p>
                      </div>
                      {scanResult.producto.evento && (
                        <span className={`ml-auto px-2 py-1 rounded-lg text-xs font-medium border ${ESTADO_COLORES[scanResult.producto.evento] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                          {ESTADO_LABELS[scanResult.producto.evento] ?? scanResult.producto.evento}
                        </span>
                      )}
                    </div>

                    <div className="divide-y divide-gray-100">
                      {scanResult.producto.uuidLote && (
                        <div className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-xs text-gray-500 flex items-center gap-1.5"><Hash className="w-3 h-3" />Lote</span>
                          <span className="text-xs font-mono text-gray-700">{scanResult.producto.uuidLote}</span>
                        </div>
                      )}
                      {scanResult.producto.origen && (
                        <div className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-xs text-gray-500 flex items-center gap-1.5"><MapPin className="w-3 h-3" />Origen</span>
                          <span className="text-xs font-medium text-gray-700">{scanResult.producto.origen}</span>
                        </div>
                      )}
                      {scanResult.producto.ubicacion && (
                        <div className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-xs text-gray-500 flex items-center gap-1.5"><MapPin className="w-3 h-3" />Última ubicación</span>
                          <span className="text-xs font-mono text-gray-700">
                            {scanResult.producto.ubicacion.lat.toFixed(4)}, {scanResult.producto.ubicacion.lon.toFixed(4)}
                          </span>
                        </div>
                      )}
                      {scanResult.producto.timestamp && (
                        <div className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-xs text-gray-500 flex items-center gap-1.5"><Clock className="w-3 h-3" />Actualizado</span>
                          <span className="text-xs text-gray-700">{new Date(scanResult.producto.timestamp).toLocaleString('es-BO')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/trazabilidad/historial/${scanResult.producto.id}`}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Ver historial completo
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={clearResult}
                      className="px-3 py-2.5 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                      title="Nueva búsqueda"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Producto no encontrado */}
              {scanResult && !scanResult.valido && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-800">Producto no encontrado</p>
                      <p className="text-xs text-red-600 mt-1 font-mono break-all">{scanResult.codigo}</p>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-amber-800 mb-2">Posibles causas</p>
                    <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                      <li>El producto no ha sido registrado</li>
                      <li>El ID ingresado es incorrecto</li>
                      <li>El QR puede estar dañado o falsificado</li>
                    </ul>
                    <p className="text-xs text-amber-800 font-semibold mt-3">⚠ No adquieras este producto</p>
                  </div>
                  <button onClick={clearResult} className="w-full py-2.5 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                    Nueva búsqueda
                  </button>
                </div>
              )}

              {/* Error genérico sin scanResult */}
              {error && !scanResult && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Error de búsqueda</p>
                    <p className="text-xs text-red-600 mt-1">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}