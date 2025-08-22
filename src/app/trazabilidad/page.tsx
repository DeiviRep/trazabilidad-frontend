// src/app/trazabilidad/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, Package, Truck, Ship, FileCheck, Store, ShoppingCart, MapPin, User, Check, Clock, AlertCircle } from 'lucide-react';

// Simulando el contexto de autenticación
const useAuth = () => ({
  user: { nombre: "Juan Pérez", rol: "proveedor", email: "juan@empresa.com" },
  token: "fake-token"
});

// Tipos corregidos según tu diagrama
type EstadoEvento = 'REGISTRADO' | 'EMBARCADO' | 'DESEMBARCADO' | 'NACIONALIZADO' | 'EN_DISTRIBUCION' | 'PRODUCTO_ADQUIRIDO';

type RolUsuario = 'proveedor' | 'transportista' | 'aduana_extranjera' | 'aduana_bolivia' | 'importador' | 'comerciante';

// Configuración de etapas según tu diagrama
const ETAPAS_FLUJO = {
  REGISTRO: {
    titulo: "Registro de Datos",
    estado: 'REGISTRADO' as EstadoEvento,
    actores: ['proveedor'],
    color: 'blue',
    icon: Package,
    siguienteEtapa: 'EMBARQUE'
  },
  EMBARQUE: {
    titulo: "Embarque",
    estado: 'EMBARCADO' as EstadoEvento,
    actores: ['transportista'],
    color: 'orange',
    icon: Truck,
    siguienteEtapa: 'DESEMBARQUE'
  },
  DESEMBARQUE: {
    titulo: "Desembarque",
    estado: 'DESEMBARCADO' as EstadoEvento,
    actores: ['aduana_extranjera', 'transportista'],
    color: 'cyan',
    icon: Ship,
    siguienteEtapa: 'NACIONALIZACION'
  },
  NACIONALIZACION: {
    titulo: "Nacionalización",
    estado: 'NACIONALIZADO' as EstadoEvento,
    actores: ['aduana_bolivia', 'importador'],
    color: 'green',
    icon: FileCheck,
    siguienteEtapa: 'DISTRIBUCION'
  },
  DISTRIBUCION: {
    titulo: "Distribución",
    estado: 'EN_DISTRIBUCION' as EstadoEvento,
    actores: ['importador', 'comerciante'],
    color: 'purple',
    icon: Store,
    siguienteEtapa: 'CONSUMIDOR_FINAL'
  },
  CONSUMIDOR_FINAL: {
    titulo: "Producto Adquirido",
    estado: 'PRODUCTO_ADQUIRIDO' as EstadoEvento,
    actores: ['comerciante'],
    color: 'pink',
    icon: ShoppingCart,
    siguienteEtapa: null
  }
};

// Mapeo de colores
const getColorClasses = (color: string, variant: 'bg' | 'text' | 'border' | 'hover' = 'bg') => {
  const colors = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', hover: 'hover:bg-blue-50' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', hover: 'hover:bg-orange-50' },
    cyan: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200', hover: 'hover:bg-cyan-50' },
    green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', hover: 'hover:bg-green-50' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', hover: 'hover:bg-purple-50' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200', hover: 'hover:bg-pink-50' }
  };
  return colors[color as keyof typeof colors]?.[variant] || colors.blue[variant];
};

// Componente de indicador de progreso
const ProgressIndicator = ({ etapaActual }: { etapaActual: keyof typeof ETAPAS_FLUJO }) => {
  const etapas = Object.keys(ETAPAS_FLUJO) as (keyof typeof ETAPAS_FLUJO)[];
  const currentIndex = etapas.indexOf(etapaActual);

  return (
    <div className="mb-8 overflow-x-auto">
      <div className="flex items-center space-x-4 min-w-max">
        {etapas.map((etapa, index) => {
          const config = ETAPAS_FLUJO[etapa];
          const Icon = config.icon;
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={etapa} className="flex items-center">
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all ${
                isActive 
                  ? `${getColorClasses(config.color, 'bg')} ${getColorClasses(config.color, 'border')}` 
                  : isCompleted 
                    ? 'bg-gray-100 border-gray-300' 
                    : 'bg-gray-50 border-gray-200'
              }`}>
                <div className={`p-2 rounded-lg ${
                  isActive 
                    ? `bg-white ${getColorClasses(config.color, 'text')}` 
                    : isCompleted 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-400'
                }`}>
                  {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                </div>
                <span className={`font-medium text-sm ${
                  isActive ? getColorClasses(config.color, 'text') : isCompleted ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {config.titulo}
                </span>
              </div>
              {index < etapas.length - 1 && (
                <ChevronRight className="text-gray-300 mx-2" size={20} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Formulario de Registro
const RegistroForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    id: '',
    modelo: '',
    marca: '',
    imeiSerial: '',
    origenPais: '',
    latitud: '',
    longitud: '',
    uuidLote: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID del Dispositivo</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.id}
            onChange={(e) => setFormData({...formData, id: e.target.value})}
            placeholder="Se generará automáticamente si se deja vacío"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">UUID del Lote</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.uuidLote}
            onChange={(e) => setFormData({...formData, uuidLote: e.target.value})}
            placeholder="Se generará automáticamente si se deja vacío"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.modelo}
            onChange={(e) => setFormData({...formData, modelo: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Marca *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.marca}
            onChange={(e) => setFormData({...formData, marca: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">IMEI/Serial *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.imeiSerial}
            onChange={(e) => setFormData({...formData, imeiSerial: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">País de Origen *</label>
          <select
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.origenPais}
            onChange={(e) => setFormData({...formData, origenPais: e.target.value})}
          >
            <option value="">Seleccionar país</option>
            <option value="China">China</option>
            <option value="Estados Unidos">Estados Unidos</option>
            <option value="México">México</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Latitud *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.latitud}
            onChange={(e) => setFormData({...formData, latitud: e.target.value})}
            placeholder="-17.783"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Longitud *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.longitud}
            onChange={(e) => setFormData({...formData, longitud: e.target.value})}
            placeholder="-63.182"
          />
        </div>
      </div>
      
      <div className="flex justify-between items-center pt-4">
        <button
          type="button"
          className="flex items-center space-x-2 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
        >
          <MapPin size={16} />
          <span>Usar mi ubicación</span>
        </button>
        
        <button
          onClick={() => handleSubmit({} as React.FormEvent)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Registrar Dispositivo
        </button>
      </div>
    </div>
  );
};

// Formulario de Embarque
const EmbarqueForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    id: '',
    tipoTransporte: '',
    nroContenedor: '',
    puertoSalida: '',
    latitud: '',
    longitud: ''
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID del Dispositivo *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={formData.id}
            onChange={(e) => setFormData({...formData, id: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Transporte *</label>
          <select
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={formData.tipoTransporte}
            onChange={(e) => setFormData({...formData, tipoTransporte: e.target.value})}
          >
            <option value="">Seleccionar</option>
            <option value="Marítimo">Marítimo</option>
            <option value="Aéreo">Aéreo</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Número de Contenedor *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={formData.nroContenedor}
            onChange={(e) => setFormData({...formData, nroContenedor: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Puerto de Salida *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={formData.puertoSalida}
            onChange={(e) => setFormData({...formData, puertoSalida: e.target.value})}
            placeholder="ej: Shanghai"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Latitud *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={formData.latitud}
            onChange={(e) => setFormData({...formData, latitud: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Longitud *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={formData.longitud}
            onChange={(e) => setFormData({...formData, longitud: e.target.value})}
          />
        </div>
      </div>
      
      <div className="flex justify-end pt-4">
        <button
          onClick={() => onSubmit(formData)}
          className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          Registrar Embarque
        </button>
      </div>
    </div>
  );
};

// Componente principal
const TrazabilidadRediseñada = () => {
  const { user } = useAuth();
  const [etapaActual, setEtapaActual] = useState<keyof typeof ETAPAS_FLUJO>('REGISTRO');
  const [modoOperacion, setModoOperacion] = useState<'unitario' | 'lote'>('unitario');

  // Obtener etapas disponibles para el usuario actual
  const etapasDisponibles = Object.entries(ETAPAS_FLUJO).filter(([_, config]) => 
    config.actores.includes(user?.rol as RolUsuario)
  );

  const etapaConfig = ETAPAS_FLUJO[etapaActual];

  const handleSubmit = (data: any) => {
    console.log('Enviando datos:', { etapa: etapaActual, modo: modoOperacion, data });
    // Aquí iría la lógica de envío al backend
  };

  const renderFormulario = () => {
    switch (etapaActual) {
      case 'REGISTRO':
        return <RegistroForm onSubmit={handleSubmit} />;
      case 'EMBARQUE':
        return <EmbarqueForm onSubmit={handleSubmit} />;
      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle size={48} className="mx-auto mb-4" />
            <p>Formulario para {etapaConfig.titulo} en desarrollo</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-stone-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sistema de Trazabilidad</h1>
            <p className="text-gray-600 mt-1">Seguimiento de productos electrónicos importados</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.nombre}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.rol}</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <User size={20} className="text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de progreso */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Progreso del Proceso</h2>
        <ProgressIndicator etapaActual={etapaActual} />
      </div>

      {/* Navegación de etapas disponibles */}
      {etapasDisponibles.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Etapas Disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {etapasDisponibles.map(([etapa, config]) => {
              const Icon = config.icon;
              const isActive = etapa === etapaActual;
              
              return (
                <button
                  key={etapa}
                  onClick={() => setEtapaActual(etapa as keyof typeof ETAPAS_FLUJO)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isActive
                      ? `${getColorClasses(config.color, 'bg')} ${getColorClasses(config.color, 'border')}`
                      : `bg-gray-50 border-gray-200 ${getColorClasses(config.color, 'hover')}`
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      isActive 
                        ? `bg-white ${getColorClasses(config.color, 'text')}` 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className={`font-medium ${
                        isActive ? getColorClasses(config.color, 'text') : 'text-gray-700'
                      }`}>
                        {config.titulo}
                      </p>
                      <p className="text-xs text-gray-500">
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${getColorClasses(etapaConfig.color, 'bg')}`}>
                <etapaConfig.icon size={24} className={getColorClasses(etapaConfig.color, 'text')} />
              </div>
              <span>{etapaConfig.titulo}</span>
            </h2>
            <p className="text-gray-600 mt-1">Complete la información requerida para esta etapa</p>
          </div>
          
          {/* Selector de modo de operación */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setModoOperacion('unitario')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                modoOperacion === 'unitario'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Unitario
            </button>
            <button
              onClick={() => setModoOperacion('lote')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                modoOperacion === 'lote'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Por Lote
            </button>
          </div>
        </div>

        {renderFormulario()}
      </div>
    </div>
  );
};

export default TrazabilidadRediseñada;