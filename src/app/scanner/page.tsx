'use client';

import React, { useState } from 'react';
import { Scan, QrCode, CheckCircle, AlertTriangle, Package, Loader2 } from 'lucide-react';
import { TrazabilidadAPI } from '@/services/api';
import type { Dispositivo } from '@/types/device';
import Link from 'next/link';

interface ScanResult {
  codigo: string;
  producto: Dispositivo;
  valido: boolean;
}

const ESTADO_COLORES = {
  Registro: 'bg-blue-100 text-blue-800 border-blue-200',
  Embarque: 'bg-purple-100 text-purple-800 border-purple-200',
  Desembarque: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Nacionalización: 'bg-green-100 text-green-800 border-green-200',
  Distribución: 'bg-orange-100 text-orange-800 border-orange-200',
  ConsumidorFinal: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function ScannerPage() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [manualCode, setManualCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (id: string): Promise<void> => {
    if (!id.trim()) {
      setError('Por favor ingresa un ID válido');
      return;
    }

    setLoading(true);
    setError(null);
    setScanResult(null);

    try {
      const producto = await TrazabilidadAPI.consultar(id.trim());
      
      setScanResult({
        codigo: id.trim(),
        producto,
        valido: true
      });
    } catch (err: any) {
      console.error('Error al consultar:', err);
      setError(err.message || 'No se encontró el producto con ese ID');
      setScanResult({
        codigo: id.trim(),
        producto: {} as Dispositivo,
        valido: false
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualScan = (): void => {
    handleSearch(manualCode);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleManualScan();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Escanear Código QR</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Verificación de Producto</h3>
          
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Búsqueda Manual</h4>
            <div className="flex space-x-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="UUID del dispositivo"
                disabled={loading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button 
                onClick={handleManualScan}
                disabled={loading || !manualCode.trim()}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  'Buscar'
                )}
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Ejemplo: 0c43df22-e8c5-4536-8415-a51dd1c6445e
            </div>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
            <div className="text-center">
              <Scan className="w-16 h-16 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 mb-4">Escanea el código QR del producto</p>
              <p className="text-sm text-gray-500 mb-4">
                El QR te redirigirá automáticamente a la página de historial
              </p>
              <Link 
                href="/productos"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Ver Lista de Productos
              </Link>
            </div>
          </div>
        </div>
        
        {/* Resultados */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultado de Verificación</h3>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-red-800 font-medium block">Error de búsqueda</span>
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              </div>
            </div>
          )}
          
          {!scanResult && !error ? (
            <div className="text-center py-12">
              <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Ingresa un ID para verificar la autenticidad del producto</p>
            </div>
          ) : scanResult && scanResult.valido ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">✓ Producto Verificado</span>
                </div>
                <p className="text-sm text-green-700 mt-1 ml-7">
                  Este producto está registrado en la blockchain
                </p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-200">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {scanResult.producto.marca} {scanResult.producto.modelo}
                    </h4>
                    <p className="text-sm text-gray-500 font-mono">{scanResult.producto.modelo}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID del dispositivo:</span>
                    <span className="font-mono text-xs">{scanResult.producto.id}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Estado actual:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${
                      ESTADO_COLORES[scanResult.producto.evento as keyof typeof ESTADO_COLORES] || 'bg-gray-100 text-gray-800'
                    }`}>
                      {scanResult.producto.evento}
                    </span>
                  </div>
                  
                  {scanResult.producto.uuidLote && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lote:</span>
                      <span className="font-medium">{scanResult.producto.uuidLote}</span>
                    </div>
                  )}
                  
                  {scanResult.producto.origen && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Origen:</span>
                      <span className="font-medium">{scanResult.producto.origen}</span>
                    </div>
                  )}
                  
                  {scanResult.producto.ubicacion && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Última ubicación:</span>
                      <span className="font-medium text-xs">
                        {scanResult.producto.ubicacion.lat.toFixed(4)}, {scanResult.producto.ubicacion.lon.toFixed(4)}
                      </span>
                    </div>
                  )}
                  
                  {scanResult.producto.timestamp && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Última actualización:</span>
                      <span className="font-medium text-xs">
                        {new Date(scanResult.producto.timestamp).toLocaleString('es-BO')}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                  <Link 
                    href={`/trazabilidad/historial/${scanResult.producto.id}`}
                    className="block w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-center"
                  >
                    Ver Historial Completo
                  </Link>
                </div>
              </div>
            </div>
          ) : scanResult && !scanResult.valido ? (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-red-800 font-medium block">⚠ Producto No Encontrado</span>
                    <p className="text-sm text-red-700 mt-1">
                      El ID <code className="bg-red-100 px-1 py-0.5 rounded font-mono text-xs">{scanResult.codigo}</code> no existe en el sistema
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">Posibles causas:</h4>
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                  <li>El producto aún no ha sido registrado</li>
                  <li>El ID ingresado es incorrecto</li>
                  <li>El QR puede estar dañado o falsificado</li>
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}