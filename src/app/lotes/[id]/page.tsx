'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Truck, Ship, CheckCircle, ChevronRight, MapPin, Box, Calendar } from 'lucide-react';
import { TrazabilidadAPI } from '@/services/api';
import { useMap } from '@/hooks/useMap';

type EstadoEvento = 'REGISTRADO' | 'EMBARCADO' | 'DESEMBARCADO' | 'NACIONALIZADO' | 'EN_DISTRIBUCION' | 'PRODUCTO_ADQUIRIDO';
type ColorName = 'blue' | 'orange' | 'cyan' | 'green' | 'purple' | 'pink';

interface Evento {
  tipo: EstadoEvento;
  fecha: string;
  punto: string;
  coordenadas: [number, number];
  contenedor?: string;
  dim?: string;
  valorCIF?: number;
  totalPagado?: number;
}

interface Lote {
  id: string;
  lote: string;
  marca: string;
  modelo: string;
  cantidadProductos: number;
  estado: EstadoEvento;
  url: string;
  fechaCreacion: string;
  eventos: Evento[];
}

interface EtapaConfig {
  titulo: string;
  estado: EstadoEvento;
  color: ColorName;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  descripcion: string;
}

interface EventFormData {
  punto: string;
  latitud: string;
  longitud: string;
  contenedor: string;
  tipoTransporte: string;
  dim: string;
  valorCIF: string;
  totalPagado: string;
}

interface Params {
  id: string
}

// Sample data
const fakeLotes: Lote[] = [
  {
    lote: 'LOT-2024-002',
    id: '70f60666-91c0-4b4e-95be-61a0348778b5',
    marca: 'Samsung',
    modelo: 'Galaxy S24',
    cantidadProductos: 150,
    estado: 'REGISTRADO',
    url: 'trazabilidad.io/lote/uuid-002',
    fechaCreacion: '2024-08-01T10:00:00Z',
    eventos: [
      { tipo: 'REGISTRADO', fecha: '2024-08-01T10:00:00Z', punto: 'Fábrica Samsung - Shenzhen', coordenadas: [22.5431, 114.0579] },
    ]
  },
  {
    lote: 'LOT-2024-001',
    id: 'uuid-001-Samsumg',
    marca: 'Samsung',
    modelo: 'Galaxy S24',
    cantidadProductos: 200,
    estado: 'NACIONALIZADO',
    url: 'trazabilidad.io/lote/uuid-001',
    fechaCreacion: '2024-08-01T10:00:00Z',
    eventos: [
      { tipo: 'REGISTRADO', fecha: '2024-08-01T10:00:00Z', punto: 'Fábrica Samsung - Shenzhen', coordenadas: [22.5431, 114.0579] },
      { tipo: 'EMBARCADO', fecha: '2024-08-05T14:30:00Z', punto: 'Puerto Shanghai', coordenadas: [31.2304, 121.4737], contenedor: 'MSKU7750050' },
      { tipo: 'DESEMBARCADO', fecha: '2024-08-25T09:15:00Z', punto: 'Puerto Arica', coordenadas: [-18.4746, -70.3133] },
      { tipo: 'NACIONALIZADO', fecha: '2024-08-28T16:45:00Z', punto: 'Aduana Tambo Quemado', coordenadas: [-18.1056, -69.2056], dim: '123-456-789', valorCIF: 69000, totalPagado: 30540 }
    ]
  }
];

const ETAPAS_FLUJO: Record<string, EtapaConfig> = {
  EMBARQUE: {
    titulo: "Embarque",
    estado: 'EMBARCADO',
    color: 'orange',
    icon: Truck,
    descripcion: "Registra información del transporte y contenedor para todo el lote"
  },
  DESEMBARQUE: {
    titulo: "Desembarque",
    estado: 'DESEMBARCADO',
    color: 'cyan',
    icon: Ship,
    descripcion: "Verifica llegada al puerto extranjero e integridad del lote completo"
  },
  NACIONALIZACION: {
    titulo: "Nacionalización",
    estado: 'NACIONALIZADO',
    color: 'green',
    icon: CheckCircle,
    descripcion: "Procesa documentos aduaneros y pago de impuestos para el lote"
  },
  DISTRIBUCION: {
    titulo: "Distribución",
    estado: 'EN_DISTRIBUCION',
    color: 'purple',
    icon: Package,
    descripcion: "Distribuye productos del lote a comerciantes y tiendas"
  },
  PRODUCTO_ADQUIRIDO: {
    titulo: "Lote Completado",
    estado: 'PRODUCTO_ADQUIRIDO',
    color: 'pink',
    icon: Package,
    descripcion: "Marca el lote como completamente distribuido"
  }
};

export default function LoteIndividualPage({ params }: { params: Promise<Params> }) {
  const router = useRouter();
  const {captureBrowserLocation, coords}= useMap()
  const { id: idLote } = use(params);
  const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(null);
  const [etapaActual, setEtapaActual] = useState<keyof typeof ETAPAS_FLUJO>('EMBARQUE');

  useEffect(() => {
    const lote = fakeLotes.find(l => l.id === idLote);
    if (lote) {
      setLoteSeleccionado(lote);
      const nextEtapa = getNextEtapa(lote.estado);
      setEtapaActual(nextEtapa);
    }
  }, []);

  const run = async () => {
      const data = await TrazabilidadAPI.listarPorLote(idLote);
      console.log(data);
  };

  useEffect(() => {
    if (!idLote) return;
    run();
  }, [idLote]);

  const getNextEtapa = (estadoActual: string): keyof typeof ETAPAS_FLUJO => {
    const etapas = Object.keys(ETAPAS_FLUJO) as Array<keyof typeof ETAPAS_FLUJO>;
    const currentIndex = etapas.findIndex(etapa => ETAPAS_FLUJO[etapa].estado === estadoActual);
    return etapas[currentIndex + 1] || etapas[etapas.length - 1];
  };

  const handleSubmit = (formData: Partial<EventFormData>): void => {
    alert('Evento registrado exitosamente para el lote completo');
    router.push('/lotes');
  };


  if (!loteSeleccionado) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Box className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Cargando información del lote...</p>
        </div>
      </div>
    );
  }

  const etapaConfig = ETAPAS_FLUJO[etapaActual];

  const ProgressIndicator: React.FC = () => {
    const etapas = Object.keys(ETAPAS_FLUJO) as Array<keyof typeof ETAPAS_FLUJO>;
    const currentEventIndex = etapas.findIndex(etapa => ETAPAS_FLUJO[etapa].estado === loteSeleccionado.estado);

    return (
      <div className="mb-8 overflow-x-auto">
        <div className="flex items-center space-x-2 min-w-max pb-4">
          {etapas.map((etapa, index) => {
            const config = ETAPAS_FLUJO[etapa];
            const Icon = config.icon;
            const isActive = index === currentEventIndex + 1;
            const isCompleted = index <= currentEventIndex;

            return (
              <div key={etapa} className="flex items-center">
                <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                  isActive 
                    ? `bg-${config.color}-50 border-${config.color}-200 shadow-md` 
                    : isCompleted 
                      ? 'bg-gray-100 border-gray-300 shadow-sm' 
                      : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`p-2 rounded-lg transition-all ${
                    isActive 
                      ? `bg-white text-${config.color}-600 shadow-sm` 
                      : isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-400'
                  }`}>
                    {isCompleted ? <CheckCircle size={18} /> : <Icon size={18} />}
                  </div>
                  <div>
                    <span className={`font-semibold text-sm block ${
                      isActive ? `text-${config.color}-700` : isCompleted ? 'text-gray-700' : 'text-gray-400'
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

  const EventForm: React.FC = () => {
    const handleUseLocation = async () => {
      await captureBrowserLocation()
    };
    const [formData, setFormData] = useState<EventFormData>({
      punto: '',
      latitud: '',
      longitud: '',
      contenedor: '',
      tipoTransporte: '',
      dim: '',
      valorCIF: '',
      totalPagado: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    };

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
      e.preventDefault();
      handleSubmit(formData);
    };

    useEffect(() => {
      if (coords) {
        setFormData(prev => ({
          ...prev,
          latitud: coords.lat.toString(),
          longitud: coords.lon.toString()
        }));
      }
    }, [coords]);

    return (
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Punto/Ubicación *
            </label>
            <input
              type="text"
              name="punto"
              value={formData.punto}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Puerto Shanghai, Aduana Tambo Quemado"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Latitud *</label>
            <input
              type="text"
              name="latitud"
              value={formData.latitud}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Longitud *</label>
            <input
              type="text"
              name="longitud"
              value={formData.longitud}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {etapaActual === 'EMBARQUE' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Transporte</label>
                <select
                  name="tipoTransporte"
                  value={formData.tipoTransporte}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar</option>
                  <option value="Marítimo">Marítimo</option>
                  <option value="Aéreo">Aéreo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número de Contenedor</label>
                <input
                  type="text"
                  name="contenedor"
                  value={formData.contenedor}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="ABCD1234567"
                />
              </div>
            </>
          )}

          {etapaActual === 'NACIONALIZACION' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">DIM</label>
                <input
                  type="text"
                  name="dim"
                  value={formData.dim}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="123-456-789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Valor CIF Total del Lote (USD)</label>
                <input
                  type="number"
                  name="valorCIF"
                  value={formData.valorCIF}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Pagado en Aduana (USD)</label>
                <input
                  type="number"
                  name="totalPagado"
                  value={formData.totalPagado}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-gray-200 space-y-4 sm:space-y-0">
          <button
            type="button"
            onClick={() => router.push('/lotes')}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Volver a Lotes
          </button>
          <button
            type="button"
            onClick={handleUseLocation}
            className="flex items-center space-x-2 px-4 py-3 text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
          >
            <MapPin size={18} />
            <span>Usar ubicación actual</span>
          </button>
          <button
            type="submit"
            className={`px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-${etapaConfig.color}-700 transition-colors flex items-center space-x-2`}
          >
            <etapaConfig.icon className="w-4 h-4" />
            <span>Registrar {etapaConfig.titulo}</span>
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header del lote */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Box className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Lote</h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-lg font-semibold text-blue-600">{loteSeleccionado.lote}</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-700">{loteSeleccionado.marca} {loteSeleccionado.modelo}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">ID: {loteSeleccionado.id}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 text-center lg:text-right">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-center lg:justify-end space-x-2 mb-1">
                <Package className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">Productos en Lote</span>
              </div>
              <div className="text-2xl font-bold text-blue-800">{loteSeleccionado.cantidadProductos}</div>
              <div className="text-xs text-blue-600">unidades</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-center lg:justify-end space-x-2 mb-1">
                <Calendar className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-600 font-medium">Estado Actual</span>
              </div>
              <div className="text-lg font-semibold text-green-800">{loteSeleccionado.estado.replace('_', ' ')}</div>
              <div className="text-xs text-green-600">
                {new Date(loteSeleccionado.fechaCreacion).toLocaleDateString('es-BO')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de progreso */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg text-gray-900 mb-4">Progreso del Proceso</h3>
        <ProgressIndicator />
      </div>

      {/* Formulario de siguiente evento */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl bg-${etapaConfig.color}-50 shadow-sm`}>
              <etapaConfig.icon size={32} className={`text-${etapaConfig.color}-600`} />
            </div>
            <div>
              <h2 className="text-2xl text-gray-900">Registrar {etapaConfig.titulo}</h2>
              <p className="text-gray-600 mt-1">{etapaConfig.descripcion}</p>
              <div className="text-sm text-blue-600 font-medium mt-2">
                Este evento se aplicará a las {loteSeleccionado.cantidadProductos} unidades del lote
              </div>
            </div>
          </div>
        </div>
        <EventForm />
      </div>
    </div>
  );
}