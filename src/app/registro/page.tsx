'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, MapPin, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMap } from '@/hooks/useMap';
import { TrazabilidadAPI } from '@/services/api';
import RoleGuard from '@/components/RoleGuard';

interface Producto {
  id: number;
  modelo: string;
  marca: string;
  imeiSerial: string;
}

interface FormData {
  cantidadProductos: number;
  puntoControl: string;
  proveedor: string;
  paisOrigen: string;
  coordenadas: { lat: string; lon: string };
}

export default function RegistroPage() {
  const { captureBrowserLocation, coords } = useMap();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    cantidadProductos: 1,
    puntoControl: '',
    proveedor: '',
    paisOrigen: 'China',
    coordenadas: { lat: '', lon: '' },
  });
  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [step, setStep] = useState<number>(1);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    let value: string | number = e.target.value;
    if (e.target.name === 'cantidadProductos') {
      value = parseInt(value as string);
      if (isNaN(value) || value < 1) value = 1;
      if (value > 50) value = 50;

      const newProductos: Producto[] = Array.from({ length: value }, (_, i) => ({
        id: i + 1, modelo: '', marca: '', imeiSerial: '',
      }));
      setProductos(newProductos);
    }
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const handleProductChange = (index: number, field: keyof Producto, value: string | number): void => {
    setProductos(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      await TrazabilidadAPI.registroLote({
        dispositivos: productos.map(producto => ({
          marca:        producto.marca,
          modelo:       producto.modelo,
          imeiSerial:   producto.imeiSerial,
          latitud:      formData.coordenadas.lat,
          longitud:     formData.coordenadas.lon,
          // CORREGIDO: era 'origenPais', el campo correcto es 'paisOrigen'
          paisOrigen:   formData.paisOrigen,
          puntoControl: formData.puntoControl,
        })),
      });
      router.push('/lotes');
      router.refresh();
    } catch (error) {
      console.error('Error registrando lote:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (coords?.lat && coords?.lon) {
      setFormData(prev => ({
        ...prev,
        coordenadas: { lat: coords.lat.toString(), lon: coords.lon.toString() },
      }));
    }
  }, [coords]);

  useEffect(() => {
    if (productos.length === 0) {
      setProductos(
        Array.from({ length: formData.cantidadProductos }, (_, i) => ({
          id: i + 1, modelo: '', marca: '', imeiSerial: '',
        }))
      );
    }
  }, [productos.length, formData.cantidadProductos]);

  return (
    <RoleGuard allowedRoles={['ADMIN', 'PROVEEDOR']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Registro de Nuevo Producto</h2>
          <div className="text-sm text-gray-500">Paso {step} de 3</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Barra de progreso */}
          <div className="flex items-center mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= i ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>{i}</div>
                {i < 3 && <div className={`w-16 h-1 ${step > i ? 'bg-blue-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>

            {/* ── Paso 1: Lote y punto de control ── */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Información del Lote de Productos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad de Productos *</label>
                    <input
                      type="number" name="cantidadProductos"
                      value={formData.cantidadProductos} onChange={handleInputChange}
                      min={1} max={50}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Punto de Control *</label>
                    <input
                      type="text" name="puntoControl"
                      value={formData.puntoControl} onChange={handleInputChange}
                      placeholder="ej: Fábrica Samsung - Shenzhen"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Productos a registrar: {formData.cantidadProductos}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Array.from({ length: formData.cantidadProductos }).map((_, i) => (
                      <div key={i} className="bg-white p-3 rounded border border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Producto #{i + 1}</div>
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center mx-auto">
                          <Package className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Paso 2: Datos por dispositivo ── */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">IMEI/Serial de Cada Producto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {productos.map((producto, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="w-4 h-4 text-blue-600" />
                        </div>
                        <h4 className="font-medium text-gray-900">Producto #{producto.id}</h4>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Marca *</label>
                          <input type="text" value={producto.marca}
                            onChange={(e) => handleProductChange(index, 'marca', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="Samsung" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label>
                          <input type="text" value={producto.modelo}
                            onChange={(e) => handleProductChange(index, 'modelo', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="Galaxy S24" required />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">IMEI/Serial *</label>
                          <input type="text" value={producto.imeiSerial}
                            onChange={(e) => handleProductChange(index, 'imeiSerial', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 font-mono"
                            placeholder="356789012345678" required />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Paso 3: Proveedor, país origen y coordenadas ── */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Información del Proveedor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Proveedor *</label>
                    <input type="text" name="proveedor"
                      value={formData.proveedor} onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="ej: Fábrica Apple — Shenzhen, China"
                      required />
                  </div>
                  <div>
                    {/* CORREGIDO: name="paisOrigen" (antes era paisOrigen pero value venía de formData.paisOrigen) */}
                    <label className="block text-sm font-medium text-gray-700 mb-2">País de Origen *</label>
                    <select name="paisOrigen" value={formData.paisOrigen} onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="China">China</option>
                      {/* NUEVOS: Vietnam (Huawei) y Corea del Sur (Samsung) cubren los lotes de la tesis */}
                      <option value="Vietnam">Vietnam</option>
                      <option value="Corea del Sur">Corea del Sur</option>
                      <option value="Estados Unidos">Estados Unidos</option>
                      <option value="México">México</option>
                      <option value="Brasil">Brasil</option>
                      <option value="Japón">Japón</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Coordenadas GPS del punto de origen
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" name="lat"
                      placeholder="Latitud (ej: 22.5431)"
                      value={formData.coordenadas.lat}
                      onChange={(e) => setFormData(prev => ({
                        ...prev, coordenadas: { ...prev.coordenadas, lat: e.target.value },
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input type="text" name="lon"
                      placeholder="Longitud (ej: 114.0579)"
                      value={formData.coordenadas.lon}
                      onChange={(e) => setFormData(prev => ({
                        ...prev, coordenadas: { ...prev.coordenadas, lon: e.target.value },
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Navegación ── */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              {step > 1 ? (
                <button type="button" onClick={() => setStep(step - 1)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Anterior
                </button>
              ) : <div />}

              {step < 3 ? (
                <button type="button" onClick={() => setStep(step + 1)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Siguiente
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => captureBrowserLocation()}
                    className="flex items-center gap-2 px-4 py-2 text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors">
                    <MapPin size={16} />
                    <span>Usar ubicación actual</span>
                  </button>
                  <button type="submit" disabled={loading}
                    className={`px-6 py-2 rounded-lg flex items-center gap-2 ${
                      loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                    } text-white transition-colors`}>
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      {loading
                        ? 'Registrando...'
                        : `Registrar Lote de ${formData.cantidadProductos} Productos`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </RoleGuard>
  );
}