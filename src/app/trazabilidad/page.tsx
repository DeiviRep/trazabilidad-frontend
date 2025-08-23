// src/app/trazabilidad/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, Package, Truck, Ship, FileCheck, Store, ShoppingCart, MapPin, User, Check, Clock, AlertCircle, Upload } from 'lucide-react';
import { useMap } from '@/hooks/useMap';

// Tipos corregidos y alineados con el backend
type EstadoEvento = 'REGISTRADO' | 'EMBARCADO' | 'DESEMBARCADO' | 'NACIONALIZADO' | 'EN_DISTRIBUCION' | 'PRODUCTO_ADQUIRIDO';
type EventoTipo = 'REGISTRO' | 'EMBARQUE' | 'DESEMBARQUE' | 'NACIONALIZACION' | 'DISTRIBUCION' | 'PRODUCTO_ADQUIRIDO';
type RolUsuario = 'proveedor' | 'transportista' | 'aduana_extranjera' | 'aduana_bolivia' | 'importador' | 'comerciante';

// Mock del contexto de auth - reemplazar con tu useAuth real
const useAuth = () => ({
  user: { nombre: "Juan Pérez", rol: "proveedor", email: "juan@empresa.com" },
  token: "fake-token"
});

// Configuración de etapas según tu diagrama
const ETAPAS_FLUJO = {
  REGISTRO: {
    titulo: "Registro de Datos",
    estado: 'REGISTRADO' as EstadoEvento,
    evento: 'REGISTRO' as EventoTipo,
    actores: ['proveedor'] as RolUsuario[],
    color: 'blue',
    icon: Package,
    siguienteEtapa: 'EMBARQUE',
    descripcion: "Registra los datos básicos del producto y genera QR único"
  },
  EMBARQUE: {
    titulo: "Embarque",
    estado: 'EMBARCADO' as EstadoEvento,
    evento: 'EMBARQUE' as EventoTipo,
    actores: ['transportista'] as RolUsuario[],
    color: 'orange',
    icon: Truck,
    siguienteEtapa: 'DESEMBARQUE',
    descripcion: "Registra información del transporte y contenedor"
  },
  DESEMBARQUE: {
    titulo: "Desembarque",
    estado: 'DESEMBARCADO' as EstadoEvento,
    evento: 'DESEMBARQUE' as EventoTipo,
    actores: ['aduana_extranjera', 'transportista'] as RolUsuario[],
    color: 'cyan',
    icon: Ship,
    siguienteEtapa: 'NACIONALIZACION',
    descripcion: "Verifica llegada al puerto extranjero e integridad"
  },
  NACIONALIZACION: {
    titulo: "Nacionalización",
    estado: 'NACIONALIZADO' as EstadoEvento,
    evento: 'NACIONALIZACION' as EventoTipo,
    actores: ['aduana_bolivia', 'importador'] as RolUsuario[],
    color: 'green',
    icon: FileCheck,
    siguienteEtapa: 'DISTRIBUCION',
    descripcion: "Procesa documentos aduaneros y pago de impuestos"
  },
  DISTRIBUCION: {
    titulo: "Distribución",
    estado: 'EN_DISTRIBUCION' as EstadoEvento,
    evento: 'DISTRIBUCION' as EventoTipo,
    actores: ['importador', 'comerciante'] as RolUsuario[],
    color: 'purple',
    icon: Store,
    siguienteEtapa: 'PRODUCTO_ADQUIRIDO',
    descripcion: "Distribuye productos a comerciantes y tiendas"
  },
  PRODUCTO_ADQUIRIDO: {
    titulo: "Producto Adquirido",
    estado: 'PRODUCTO_ADQUIRIDO' as EstadoEvento,
    evento: 'PRODUCTO_ADQUIRIDO' as EventoTipo,
    actores: ['comerciante'] as RolUsuario[],
    color: 'pink',
    icon: ShoppingCart,
    siguienteEtapa: null,
    descripcion: "Registra venta final al consumidor"
  }
};

// Mapeo de colores con más variedad
const getColorClasses = (color: string, variant: 'bg' | 'text' | 'border' | 'hover' | 'ring' = 'bg') => {
  const colors = {
    blue: { 
      bg: 'bg-blue-50', 
      text: 'text-blue-700', 
      border: 'border-blue-200', 
      hover: 'hover:bg-blue-100',
      ring: 'focus:ring-blue-500'
    },
    orange: { 
      bg: 'bg-orange-50', 
      text: 'text-orange-700', 
      border: 'border-orange-200', 
      hover: 'hover:bg-orange-100',
      ring: 'focus:ring-orange-500'
    },
    cyan: { 
      bg: 'bg-cyan-50', 
      text: 'text-cyan-700', 
      border: 'border-cyan-200', 
      hover: 'hover:bg-cyan-100',
      ring: 'focus:ring-cyan-500'
    },
    green: { 
      bg: 'bg-green-50', 
      text: 'text-green-700', 
      border: 'border-green-200', 
      hover: 'hover:bg-green-100',
      ring: 'focus:ring-green-500'
    },
    purple: { 
      bg: 'bg-purple-50', 
      text: 'text-purple-700', 
      border: 'border-purple-200', 
      hover: 'hover:bg-purple-100',
      ring: 'focus:ring-purple-500'
    },
    pink: { 
      bg: 'bg-pink-50', 
      text: 'text-pink-700', 
      border: 'border-pink-200', 
      hover: 'hover:bg-pink-100',
      ring: 'focus:ring-pink-500'
    }
  };
  return colors[color as keyof typeof colors]?.[variant] || colors.blue[variant];
};

// Componente de indicador de progreso mejorado
const ProgressIndicator = ({ 
  etapaActual,
}: { 
  etapaActual: keyof typeof ETAPAS_FLUJO;
}) => {
  const etapas = Object.keys(ETAPAS_FLUJO) as (keyof typeof ETAPAS_FLUJO)[];
  const currentIndex = etapas.indexOf(etapaActual);

  return (
    <div className="mb-8 overflow-x-auto">
      <div className="flex items-center space-x-2 min-w-max pb-4">
        {etapas.map((etapa, index) => {
          const config = ETAPAS_FLUJO[etapa];
          const Icon = config.icon;
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={etapa} className="flex items-center">
              <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                isActive 
                  ? `${getColorClasses(config.color, 'bg')} ${getColorClasses(config.color, 'border')} shadow-md` 
                  : isCompleted 
                    ? 'bg-gray-100 border-gray-300 shadow-sm' 
                    : 'bg-gray-50 border-gray-200'
              }`}>
                <div className={`p-2 rounded-lg transition-all ${
                  isActive 
                    ? `bg-white ${getColorClasses(config.color, 'text')} shadow-sm` 
                    : isCompleted 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-400'
                }`}>
                  {isCompleted ? <Check size={18} /> : <Icon size={18} />}
                </div>
                <div>
                  <span className={`font-semibold text-sm block ${
                    isActive ? getColorClasses(config.color, 'text') : isCompleted ? 'text-gray-700' : 'text-gray-400'
                  }`}>
                    {config.titulo}
                  </span>
                  <span className={`text-xs ${
                    isActive ? 'text-gray-600' : isCompleted ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {config.descripcion}
                  </span>
                </div>
              </div>
              {index < etapas.length - 1 && (
                <div className="flex items-center mx-3">
                  <ChevronRight 
                    className={`${isCompleted ? 'text-green-400' : 'text-gray-300'} transition-colors`} 
                    size={20} 
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Formulario de Registro (corregido)
const RegistroForm = ({ 
  onSubmit, 
  coords, 
  onUseLocation 
}: { 
  onSubmit: (data: any) => void;
  coords: {lat: number, lon: number} | null;
  onUseLocation: () => void;
}) => {
  const [formData, setFormData] = useState({
    id: '',
    modelo: '',
    marca: '',
    imeiSerial: '',
    origenPais: '',
    latitud: coords?.lat.toString() || '',
    longitud: coords?.lon.toString() || '',
    uuidLote: ''
  });

  // Actualizar coords cuando cambien
  useEffect(() => {
    if (coords) {
      setFormData(prev => ({
        ...prev,
        latitud: coords.lat.toString(),
        longitud: coords.lon.toString()
      }));
    }
  }, [coords]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ tipo: 'REGISTRO', ...formData });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ID del Dispositivo
            <span className="text-gray-400 text-xs ml-2">(opcional)</span>
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.id}
            onChange={(e) => setFormData({...formData, id: e.target.value})}
            placeholder="Se generará automáticamente"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            UUID del Lote
            <span className="text-gray-400 text-xs ml-2">(opcional)</span>
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.uuidLote}
            onChange={(e) => setFormData({...formData, uuidLote: e.target.value})}
            placeholder="Se generará automáticamente"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Modelo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.modelo}
            onChange={(e) => setFormData({...formData, modelo: e.target.value})}
            placeholder="iPhone 15, Galaxy S24, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Marca <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.marca}
            onChange={(e) => setFormData({...formData, marca: e.target.value})}
            placeholder="Apple, Samsung, Huawei, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            IMEI/Serial <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.imeiSerial}
            onChange={(e) => setFormData({...formData, imeiSerial: e.target.value})}
            placeholder="123456789012345"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            País de Origen <span className="text-red-500">*</span>
          </label>
          <select
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.origenPais}
            onChange={(e) => setFormData({...formData, origenPais: e.target.value})}
          >
            <option value="">Seleccionar país</option>
            <option value="China">China</option>
            <option value="Estados Unidos">Estados Unidos</option>
            <option value="México">México</option>
            <option value="Corea del Sur">Corea del Sur</option>
            <option value="Japón">Japón</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Latitud <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.latitud}
            onChange={(e) => setFormData({...formData, latitud: e.target.value})}
            placeholder="-17.783"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Longitud <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.longitud}
            onChange={(e) => setFormData({...formData, longitud: e.target.value})}
            placeholder="-63.182"
          />
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-gray-100">
        <button
          type="button"
          onClick={onUseLocation}
          className="flex items-center space-x-2 px-4 py-3 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <MapPin size={18} />
          <span>Usar mi ubicación</span>
        </button>
        
        <button
          type="submit"
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-medium"
        >
          Registrar Dispositivo
        </button>
      </div>
    </form>
  );
};

// Formulario de Embarque (corregido)
const EmbarqueForm = ({ 
  onSubmit, 
  coords, 
  onUseLocation 
}: { 
  onSubmit: (data: any) => void;
  coords: {lat: number, lon: number} | null;
  onUseLocation: () => void;
}) => {
  const [formData, setFormData] = useState({
    id: '',
    tipoTransporte: '',
    nroContenedor: '',
    puertoSalida: '',
    latitud: coords?.lat.toString() || '',
    longitud: coords?.lon.toString() || ''
  });

  useEffect(() => {
    if (coords) {
      setFormData(prev => ({
        ...prev,
        latitud: coords.lat.toString(),
        longitud: coords.lon.toString()
      }));
    }
  }, [coords]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ tipo: 'EMBARQUE', ...formData });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ID del Dispositivo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            value={formData.id}
            onChange={(e) => setFormData({...formData, id: e.target.value})}
            placeholder="Ingrese el ID del dispositivo a embarcar"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Transporte <span className="text-red-500">*</span>
          </label>
          <select
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            value={formData.tipoTransporte}
            onChange={(e) => setFormData({...formData, tipoTransporte: e.target.value})}
          >
            <option value="">Seleccionar tipo</option>
            <option value="Marítimo">Marítimo</option>
            <option value="Aéreo">Aéreo</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número de Contenedor <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            value={formData.nroContenedor}
            onChange={(e) => setFormData({...formData, nroContenedor: e.target.value})}
            placeholder="ABCD1234567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Puerto de Salida <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            value={formData.puertoSalida}
            onChange={(e) => setFormData({...formData, puertoSalida: e.target.value})}
            placeholder="Shanghai, Los Angeles, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Latitud <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            value={formData.latitud}
            onChange={(e) => setFormData({...formData, latitud: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Longitud <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            value={formData.longitud}
            onChange={(e) => setFormData({...formData, longitud: e.target.value})}
          />
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-gray-100">
        <button
          type="button"
          onClick={onUseLocation}
          className="flex items-center space-x-2 px-4 py-3 text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
        >
          <MapPin size={18} />
          <span>Usar ubicación actual</span>
        </button>
        
        <button
          type="submit"
          className="px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors font-medium"
        >
          Registrar Embarque
        </button>
      </div>
    </form>
  );
};

// Componente principal refactorizado
const SistemaTrazabilidad = () => {
  const { user } = useAuth();
  const { coords, captureBrowserLocation } = useMap();
  const [etapaActual, setEtapaActual] = useState<keyof typeof ETAPAS_FLUJO>('REGISTRO');
  const [modoOperacion, setModoOperacion] = useState<'unitario' | 'lote'>('unitario');
  const [loading, setLoading] = useState(false);

  // Obtener etapas disponibles para el usuario actual
  const etapasDisponibles = Object.entries(ETAPAS_FLUJO).filter(([_, config]) => 
    config.actores.includes(user?.rol as RolUsuario)
  );

  const etapaConfig = ETAPAS_FLUJO[etapaActual];

  const handleUseLocation = async () => {
    try {
      setLoading(true);
      await captureBrowserLocation();
    } catch (error) {
      alert('No se pudo obtener la ubicación. Verifica los permisos del navegador.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    console.log('Enviando datos:', { etapa: etapaActual, modo: modoOperacion, data });
    
    setLoading(true);
    try {
      // Aquí integrarás con tu TrazabilidadAPI existente
      if (data.tipo === 'REGISTRO') {
        // await TrazabilidadAPI.registroUnitario(data);
      } else {
        // await TrazabilidadAPI.eventoUnitario(data);
      }
      
      alert('Operación completada exitosamente');
    } catch (error) {
      alert('Error al procesar la operación');
    } finally {
      setLoading(false);
    }
  };

  const renderFormulario = () => {
    const commonProps = {
      onSubmit: handleSubmit,
      coords,
      onUseLocation: handleUseLocation
    };

    switch (etapaActual) {
      case 'REGISTRO':
        return <RegistroForm {...commonProps} />;
      case 'EMBARQUE':
        return <EmbarqueForm {...commonProps} />;
      default:
        return (
          <div className="text-center py-12 text-gray-500">
            <AlertCircle size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Formulario en desarrollo</p>
            <p>El formulario para {etapaConfig.titulo} se implementará próximamente</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-stone-50 min-h-screen">
      {/* Header mejorado */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sistema de Trazabilidad</h1>
            <p className="text-gray-600 mt-2">Seguimiento completo de productos electrónicos importados</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900">{user?.nombre}</p>
              <p className="text-sm text-gray-500 capitalize bg-gray-100 px-3 py-1 rounded-full">
                {user?.rol?.replace('_', ' ')}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-xl">
              <User size={24} className="text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de progreso */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Progreso del Proceso</h2>
        <ProgressIndicator etapaActual={etapaActual} />
      </div>

      {/* Navegación de etapas disponibles */}
      {etapasDisponibles.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Etapas Disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {etapasDisponibles.map(([etapa, config]) => {
              const Icon = config.icon;
              const isActive = etapa === etapaActual;
              
              return (
                <button
                  key={etapa}
                  onClick={() => setEtapaActual(etapa as keyof typeof ETAPAS_FLUJO)}
                  className={`p-5 rounded-xl border-2 transition-all text-left ${
                    isActive
                      ? `${getColorClasses(config.color, 'bg')} ${getColorClasses(config.color, 'border')} shadow-md`
                      : `bg-gray-50 border-gray-200 ${getColorClasses(config.color, 'hover')}`
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${
                      isActive 
                        ? `bg-white ${getColorClasses(config.color, 'text')} shadow-sm` 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      <Icon size={24} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold text-lg ${
                        isActive ? getColorClasses(config.color, 'text') : 'text-gray-700'
                      }`}>
                        {config.titulo}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {config.descripcion}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Estado: {config.estado.replace('_', ' ').toLowerCase()}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Formulario principal */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${getColorClasses(etapaConfig.color, 'bg')} shadow-sm`}>
              <etapaConfig.icon size={32} className={`${getColorClasses(etapaConfig.color, 'text')}`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{etapaConfig.titulo}</h2>
              <p className="text-gray-600 mt-1">{etapaConfig.descripcion}</p>
            </div>
          </div>
          
          {/* Selector de modo de operación */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setModoOperacion('unitario')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                modoOperacion === 'unitario'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Unitario
            </button>
            <button
              onClick={() => setModoOperacion('lote')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                modoOperacion === 'lote'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Por Lote
            </button>
          </div>
        </div>

        {/* Formulario */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <span className="ml-4 text-gray-600">Procesando...</span>
          </div>
        ) : (
          renderFormulario()
        )}
      </div>

      {/* Panel de estadísticas (opcional) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <Package size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-600">Productos Registrados</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-green-50 text-green-600">
              <Check size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-600">Procesos Completados</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-orange-50 text-orange-600">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-600">En Proceso</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SistemaTrazabilidad;