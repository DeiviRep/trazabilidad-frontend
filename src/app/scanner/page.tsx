'use client';

import React, { useState } from 'react';
import { Scan, QrCode, CheckCircle, AlertTriangle, Package } from 'lucide-react';

type EstadoEvento = 'REGISTRADO' | 'EMBARCADO' | 'DESEMBARCADO' | 'NACIONALIZADO' | 'EN_DISTRIBUCION' | 'PRODUCTO_ADQUIRIDO';

interface Lote {
  id: string;
  lote: string;
  marca: string;
  modelo: string;
  cantidadProductos: number;
  estado: EstadoEvento;
  url: string;
  fechaCreacion: string;
  eventos: Array<{
    tipo: EstadoEvento;
    fecha: string;
    punto: string;
    coordenadas: [number, number];
  }>;
}

interface ScanResult {
  codigo: string;
  producto: Lote;
  valido: boolean;
}

const fakeProducts: Lote[] = [
  {
    id: 'uuid-001',
    lote: 'LOT-2024-001',
    marca: 'Samsung',
    modelo: 'Galaxy S24',
    cantidadProductos: 6,
    estado: 'NACIONALIZADO',
    url: 'trazabilidad.io/lote/uuid-001',
    fechaCreacion: '2024-08-01T10:00:00Z',
    eventos: [
      { tipo: 'REGISTRADO', fecha: '2024-08-01T10:00:00Z', punto: 'Fábrica Samsung - Shenzhen', coordenadas: [22.5431, 114.0579] },
      { tipo: 'EMBARCADO', fecha: '2024-08-05T14:30:00Z', punto: 'Puerto Shanghai', coordenadas: [31.2304, 121.4737] },
      { tipo: 'DESEMBARCADO', fecha: '2024-08-25T09:15:00Z', punto: 'Puerto Arica', coordenadas: [-18.4746, -70.3133] },
      { tipo: 'NACIONALIZADO', fecha: '2024-08-28T16:45:00Z', punto: 'Aduana Tambo Quemado', coordenadas: [-18.1056, -69.2056] }
    ]
  },
  {
    id: 'uuid-002',
    lote: 'LOT-2024-002',
    marca: 'Samsung',
    modelo: 'Galaxy S24',
    cantidadProductos: 6,
    estado: 'REGISTRADO',
    url: 'trazabilidad.io/lote/uuid-002',
    fechaCreacion: '2024-08-01T10:00:00Z',
    eventos: [
      { tipo: 'REGISTRADO', fecha: '2024-08-01T10:00:00Z', punto: 'Fábrica Samsung - Shenzhen', coordenadas: [22.5431, 114.0579] },
    ]
  }
];

export default function ScannerPage() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [manualCode, setManualCode] = useState<string>('');

  const handleManualScan = (): void => {
    if (manualCode) {
      // Find matching product or simulate error
      const foundProduct = fakeProducts.find(p => p.id === manualCode || p.lote === manualCode);
      
      setScanResult({
        codigo: manualCode,
        producto: foundProduct || fakeProducts[0],
        valido: !!foundProduct
      });
    }
  };

  const simulateScan = (): void => {
    setScanResult({
      codigo: 'uuid-001',
      producto: fakeProducts[0],
      valido: true
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Escanear Código QR</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cámara QR</h3>
          
          <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <div className="text-center">
              <Scan className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Posiciona el código QR frente a la cámara</p>
              <button 
                onClick={simulateScan}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Simular Escaneo
              </button>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Ingreso Manual</h4>
            <div className="flex space-x-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ingresa el código UUID o número de lote"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button 
                onClick={handleManualScan}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Buscar
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Ejemplos válidos: uuid-001, LOT-2024-001
            </div>
          </div>
        </div>
        
        {/* Resultados */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultado del Escaneo</h3>
          
          {!scanResult ? (
            <div className="text-center py-12">
              <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Escanea un código QR para ver la información del producto</p>
            </div>
          ) : (
            <div className="space-y-4">
              {scanResult.valido ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-green-800 font-medium">Producto Válido</span>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-red-800 font-medium">Producto No Válido o No Encontrado</span>
                  </div>
                </div>
              )}
              
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {scanResult.producto.marca} {scanResult.producto.modelo}
                    </h4>
                    <p className="text-sm text-gray-500 font-mono">{scanResult.producto.lote}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Código buscado:</span>
                    <span className="font-medium font-mono">{scanResult.codigo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <span className="font-medium text-green-600">{scanResult.producto.estado}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lote:</span>
                    <span className="font-medium">{scanResult.producto.lote}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cantidad:</span>
                    <span className="font-medium">{scanResult.producto.cantidadProductos} unidades</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Última ubicación:</span>
                    <span className="font-medium">{scanResult.producto.eventos[scanResult.producto.eventos.length - 1].punto}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Ver Trazabilidad Completa
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}