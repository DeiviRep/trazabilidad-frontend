'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Truck, Ship, CheckCircle, ChevronRight, MapPin, Box, Calendar, ShoppingCart } from 'lucide-react';
import { TrazabilidadAPI } from '@/services/api';
import { useMap } from '@/hooks/useMap';
import { EventoTipoDtoUrlApi, EventoPayload } from '@/services/typesDto';

type EstadoEvento = 'REGISTRADO' | 'EMBARCADO' | 'DESEMBARCADO' | 'NACIONALIZADO' | 'EN_DISTRIBUCION' | 'PRODUCTO_ADQUIRIDO';

interface ProductoBackend {
  lote: string;
  uuidLote: string;
  id: string;
  marca: string;
  modelo: string;
  imeiSerial: string;
  estado: EstadoEvento;
  urlLote: string;
  fechaCreacion: string;
  eventos: {
    tipo: EstadoEvento;
    fecha: string;
    puntoControl: string;
    coordenadas: [number, number];
  }[];
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
  eventos: any[];
  productos: ProductoBackend[];
}

interface EtapaConfig {
  titulo: string;
  estado: EstadoEvento;
  bgColor: string;
  bgColorLight: string;
  borderColor: string;
  textColor: string;
  textColorDark: string;
  hoverBorderColor: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  descripcion: string;
  eventoUrlApi: EventoTipoDtoUrlApi;
  esDinamico?: boolean;
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
  comerciante: string;
  productosSeleccionados: string[];
}

interface Params {
  id: string
}

// ✅ COLORES FIJOS - No dinámicos
const ETAPAS_FLUJO: Record<string, EtapaConfig> = {
  REGISTRO: {
    titulo: "Registro",
    estado: 'REGISTRADO',
    bgColor: 'bg-indigo-600',
    bgColorLight: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-600',
    textColorDark: 'text-indigo-700',
    hoverBorderColor: 'hover:border-indigo-300',
    icon: Box,
    descripcion: "Productos registrados en el sistema",
    eventoUrlApi: 'REGISTRO'
  },
  EMBARQUE: {
    titulo: "Embarque",
    estado: 'EMBARCADO',
    bgColor: 'bg-orange-600',
    bgColorLight: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-600',
    textColorDark: 'text-orange-700',
    hoverBorderColor: 'hover:border-orange-300',
    icon: Truck,
    descripcion: "Registra información del transporte y contenedor para todo el lote",
    eventoUrlApi: 'EMBARQUE'
  },
  DESEMBARQUE: {
    titulo: "Desembarque",
    estado: 'DESEMBARCADO',
    bgColor: 'bg-cyan-600',
    bgColorLight: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    textColor: 'text-cyan-600',
    textColorDark: 'text-cyan-700',
    hoverBorderColor: 'hover:border-cyan-300',
    icon: Ship,
    descripcion: "Verifica llegada al puerto extranjero e integridad del lote completo",
    eventoUrlApi: 'DESEMBARQUE'
  },
  NACIONALIZACION: {
    titulo: "Nacionalización",
    estado: 'NACIONALIZADO',
    bgColor: 'bg-green-600',
    bgColorLight: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-600',
    textColorDark: 'text-green-700',
    hoverBorderColor: 'hover:border-green-300',
    icon: CheckCircle,
    descripcion: "Procesa documentos aduaneros y pago de impuestos para el lote",
    eventoUrlApi: 'NACIONALIZACION'
  },
  DISTRIBUCION: {
    titulo: "Distribución",
    estado: 'EN_DISTRIBUCION',
    bgColor: 'bg-purple-600',
    bgColorLight: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-600',
    textColorDark: 'text-purple-700',
    hoverBorderColor: 'hover:border-purple-300',
    icon: Package,
    descripcion: "Distribuye productos seleccionados a comerciantes específicos",
    eventoUrlApi: 'DISTRIBUCION',
    esDinamico: true
  },
  PRODUCTO_ADQUIRIDO: {
    titulo: "Producto Adquirido",
    estado: 'PRODUCTO_ADQUIRIDO',
    bgColor: 'bg-blue-600',
    bgColorLight: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-600',
    textColorDark: 'text-blue-700',
    hoverBorderColor: 'hover:border-blue-300',
    icon: ShoppingCart,
    descripcion: "Marca productos específicos como vendidos/adquiridos",
    eventoUrlApi: 'ADQUIRIDO',
    esDinamico: true
  }
};

// ✅ MAPEO DE COLORES PARA ESTADÍSTICAS
const COLOR_MAP: Record<EstadoEvento, { bg: string; text: string; textBold: string }> = {
  REGISTRADO: { bg: 'bg-indigo-50', text: 'text-indigo-600', textBold: 'text-indigo-800' },
  EMBARCADO: { bg: 'bg-orange-50', text: 'text-orange-600', textBold: 'text-orange-800' },
  DESEMBARCADO: { bg: 'bg-cyan-50', text: 'text-cyan-600', textBold: 'text-cyan-800' },
  NACIONALIZADO: { bg: 'bg-green-50', text: 'text-green-600', textBold: 'text-green-800' },
  EN_DISTRIBUCION: { bg: 'bg-purple-50', text: 'text-purple-600', textBold: 'text-purple-800' },
  PRODUCTO_ADQUIRIDO: { bg: 'bg-blue-50', text: 'text-blue-600', textBold: 'text-blue-800' }
};

export default function LoteIndividualPage({ params }: { params: Promise<Params> }) {
  const router = useRouter();
  const { captureBrowserLocation, coords } = useMap();
  const { id: idLote } = use(params);
  const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(null);
  const [etapaActual, setEtapaActual] = useState<keyof typeof ETAPAS_FLUJO>('EMBARQUE');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const transformarDatosBackend = (productos: ProductoBackend[]): Lote | null => {
    if (!productos || productos.length === 0) return null;

    const primerProducto = productos[0];
    const marcasUnicas = [...new Set(productos.map(p => p.marca))];
    const modelosUnicos = [...new Set(productos.map(p => p.modelo))];
    
    const ordenEstados: EstadoEvento[] = ['REGISTRADO', 'EMBARCADO', 'DESEMBARCADO', 'NACIONALIZADO', 'EN_DISTRIBUCION', 'PRODUCTO_ADQUIRIDO'];
    const estadoMasAvanzado = productos.reduce((estadoMax, producto) => {
      const indiceActual = ordenEstados.indexOf(producto.estado);
      const indiceMax = ordenEstados.indexOf(estadoMax);
      return indiceActual > indiceMax ? producto.estado : estadoMax;
    }, 'REGISTRADO' as EstadoEvento);

    return {
      id: primerProducto.uuidLote,
      lote: primerProducto.lote,
      marca: marcasUnicas.length === 1 ? marcasUnicas[0] : `${marcasUnicas[0]} y otros`,
      modelo: modelosUnicos.length === 1 ? modelosUnicos[0] : `${modelosUnicos[0]} y otros`,
      cantidadProductos: productos.length,
      estado: estadoMasAvanzado,
      url: primerProducto.urlLote,
      fechaCreacion: primerProducto.fechaCreacion,
      eventos: [],
      productos: productos
    };
  };

  const run = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await TrazabilidadAPI.listarPorLote(idLote);
      
      const loteTransformado = transformarDatosBackend(data);
      if (loteTransformado) {
        setLoteSeleccionado(loteTransformado);
        const nextEtapa = getNextEtapa(loteTransformado);
        setEtapaActual(nextEtapa);
      } else {
        setError('No se encontraron productos para este lote');
      }
    } catch (err) {
      console.error('Error al cargar el lote:', err);
      setError('Error al cargar la información del lote');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!idLote) return;
    run();
  }, [idLote]);

  const getNextEtapa = (lote: Lote): keyof typeof ETAPAS_FLUJO => {
    const etapas = Object.keys(ETAPAS_FLUJO) as Array<keyof typeof ETAPAS_FLUJO>;
    
    for (const etapa of etapas) {
      const productosDisponibles = getProductosDisponiblesParaEtapa(etapa, lote);
      if (productosDisponibles.length > 0) {
        return etapa;
      }
    }
    
    return etapas[etapas.length - 1];
  };

  const getProductosDisponiblesParaEtapa = (
    etapa: keyof typeof ETAPAS_FLUJO,
    lote: Lote
  ): ProductoBackend[] => {
    const config = ETAPAS_FLUJO[etapa];
    const estadoAnterior = getEstadoAnterior(config.estado);
    if (!estadoAnterior) {
      // Primera etapa: solo mostrar si aún no se ha registrado nada
      return lote.productos.filter(p => p.estado === 'REGISTRADO');
    }
    return lote.productos.filter(p => p.estado === estadoAnterior);
  };

  const getEstadoAnterior = (estado: EstadoEvento): EstadoEvento | null => {
    const flujoEstados: Partial<Record<EstadoEvento, EstadoEvento>> = {
      'EMBARCADO': 'REGISTRADO',
      'DESEMBARCADO': 'EMBARCADO',
      'NACIONALIZADO': 'DESEMBARCADO',
      'EN_DISTRIBUCION': 'NACIONALIZADO',
      'PRODUCTO_ADQUIRIDO': 'EN_DISTRIBUCION'
    };
    return flujoEstados[estado] || null;
  };

  const getProductosDisponiblesPorEtapa = (etapa: keyof typeof ETAPAS_FLUJO): ProductoBackend[] => {
    if (!loteSeleccionado) return [];
    return getProductosDisponiblesParaEtapa(etapa, loteSeleccionado);
  };

  const handleSubmit = async (formData: Partial<EventFormData>): Promise<void> => {
    if (!loteSeleccionado || !loteSeleccionado.productos) return;

    try {
      setSubmitting(true);
      const etapaConfig = ETAPAS_FLUJO[etapaActual];
      
      const basePayload: Omit<EventoPayload, 'id'> = {
        latitud: formData.latitud || '',
        longitud: formData.longitud || '',
        puntoControl: formData.punto || '',
      };

      switch (etapaActual) {
        case 'EMBARQUE':
          basePayload.nroContenedor = formData.contenedor;
          basePayload.tipoTransporte = formData.tipoTransporte;
          break;
        case 'DESEMBARQUE':
          basePayload.integridad = true;
          basePayload.descripcionIntegridad = 'Lote recibido en buen estado';
          break;
        case 'NACIONALIZACION':
          basePayload.dim = formData.dim;
          if (formData.valorCIF) basePayload.valorCIF = parseFloat(formData.valorCIF);
          if (formData.totalPagado) basePayload.totalPagado = parseFloat(formData.totalPagado);
          break;
        case 'DISTRIBUCION':
          basePayload.comerciante = formData.comerciante || 'Distribuidor General';
          break;
        case 'PRODUCTO_ADQUIRIDO':
          basePayload.fechaCompra = new Date().toISOString();
          break;
      }

      let productosAProcesar: ProductoBackend[];
      
      if (etapaConfig.esDinamico && formData.productosSeleccionados) {
        productosAProcesar = loteSeleccionado.productos.filter(p => 
          formData.productosSeleccionados!.includes(p.id)
        );
      } else {
        productosAProcesar = loteSeleccionado.productos;
      }

      const eventosPayload: EventoPayload[] = productosAProcesar.map(producto => ({
        ...basePayload,
        id: producto.id
      }));
      
      await TrazabilidadAPI.eventoLote({
        eventoUrlApi: etapaConfig.eventoUrlApi,
        body: eventosPayload 
      });

      await run();

    } catch (error) {
      console.error('Error al registrar evento:', error);
      setError('Error al registrar el evento. Por favor, intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Box className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">Cargando información del lote...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Box className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              run();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-4"
          >
            Reintentar
          </button>
          <button
            onClick={() => router.push('/lotes')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Volver a Lotes
          </button>
        </div>
      </div>
    );
  }

  if (!loteSeleccionado) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Box className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No se encontró información del lote</p>
          <button
            onClick={() => router.push('/lotes')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver a Lotes
          </button>
        </div>
      </div>
    );
  }

  const etapaConfig = ETAPAS_FLUJO[etapaActual];
  const productosDisponibles = getProductosDisponiblesPorEtapa(etapaActual);

  // ✅ NUEVA LÓGICA DE ESTADO VISUAL DE CADA ETAPA
const getEstadoEtapaVisual = (
  etapa: keyof typeof ETAPAS_FLUJO,
  lote: Lote
): 'COMPLETADA' | 'ACTIVA' | 'FUTURA' => {
  const config = ETAPAS_FLUJO[etapa];
  const estadoActual = config.estado;
  const estadoAnterior = getEstadoAnterior(estadoActual);

  const productos = lote.productos;
  const total = productos.length;

  // Orden de flujo para comparar progresión
  const orden = [
    'REGISTRADO',
    'EMBARCADO',
    'DESEMBARCADO',
    'NACIONALIZADO',
    'EN_DISTRIBUCION',
    'PRODUCTO_ADQUIRIDO'
  ];

  // Productos que ya alcanzaron o superaron esta etapa
  const completados = productos.filter(p =>
    orden.indexOf(p.estado) >= orden.indexOf(estadoActual)
  ).length;

  // Si todos los productos ya superaron o alcanzaron esta etapa
  if (completados === total) return 'COMPLETADA';

  // Productos listos para esta etapa (en estado anterior)
  const disponibles = estadoAnterior
    ? productos.filter(p => p.estado === estadoAnterior).length
    : 0;

  // Si hay productos listos para procesar
  if (disponibles > 0) return 'ACTIVA';

  // Si aún no hay productos en el estado anterior → futura
  return 'FUTURA';
};
  // ✅ COMPONENTE PROGRESO CON CLICK
const ProgressIndicator: React.FC = () => {
  const etapas = Object.keys(ETAPAS_FLUJO) as Array<keyof typeof ETAPAS_FLUJO>;

  return (
    <div className="mb-8 overflow-x-auto">
      <div className="flex items-center space-x-2 min-w-max pb-4">
        {etapas.map((etapa, index) => {
          const config = ETAPAS_FLUJO[etapa];
          const Icon = config.icon;
          const estadoVisual = getEstadoEtapaVisual(etapa, loteSeleccionado);

          const isActiva = estadoVisual === 'ACTIVA';
          const isCompletada = estadoVisual === 'COMPLETADA';
          const isFutura = estadoVisual === 'FUTURA';

          return (
            <div key={etapa} className="flex items-center">
              <button
                onClick={() => { if (isActiva) setEtapaActual(etapa); }}
                disabled={!isActiva}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                  isActiva
                    ? `${config.bgColorLight} ${config.borderColor} shadow-md cursor-pointer`
                    : isCompletada
                      ? 'bg-green-50 border-green-200 shadow-sm cursor-default'
                      : 'bg-gray-50 border-gray-200 opacity-70 cursor-not-allowed'
                }`}
              >
                <div className={`p-2 rounded-lg transition-all ${
                  isCompletada
                    ? 'bg-green-500 text-white'
                    : isActiva
                      ? `${config.bgColor} text-white`
                      : 'bg-gray-300 text-gray-600'
                }`}>
                  {isCompletada ? <CheckCircle size={18} /> : <Icon size={18} />}
                </div>

                <div>
                  <span className={`font-semibold text-sm block ${
                    isCompletada
                      ? 'text-green-700'
                      : isActiva
                        ? config.textColorDark
                        : 'text-gray-500'
                  }`}>
                    {config.titulo}
                  </span>
                  <span className={`text-xs ${
                    isCompletada
                      ? 'text-green-600 font-medium'
                      : isActiva
                        ? 'text-yellow-700'
                        : 'text-gray-400'
                  }`}>
                    {isCompletada
                      ? '✓ Completado'
                      : isActiva
                        ? 'En proceso'
                        : 'Pendiente'}
                  </span>
                </div>
              </button>

              {index < etapas.length - 1 && (
                <div className="flex items-center mx-3">
                  <ChevronRight
                    className={isCompletada ? 'text-green-400' : 'text-gray-300'}
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
  const ProductSelector: React.FC<{ 
    productos: ProductoBackend[], 
    productosSeleccionados: string[], 
    onSelectionChange: (seleccionados: string[]) => void 
  }> = ({ productos, productosSeleccionados, onSelectionChange }) => {
    const toggleProducto = (productoId: string) => {
      if (productosSeleccionados.includes(productoId)) {
        onSelectionChange(productosSeleccionados.filter(id => id !== productoId));
      } else {
        onSelectionChange([...productosSeleccionados, productoId]);
      }
    };

    const toggleTodos = () => {
      if (productosSeleccionados.length === productos.length) {
        onSelectionChange([]);
      } else {
        onSelectionChange(productos.map(p => p.id));
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">
            Seleccionar productos ({productosSeleccionados.length}/{productos.length})
          </h4>
          <button
            type="button"
            onClick={toggleTodos}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {productosSeleccionados.length === productos.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
          {productos.map((producto) => (
            <div
              key={producto.id}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                productosSeleccionados.includes(producto.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => toggleProducto(producto.id)}
            >
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={productosSeleccionados.includes(producto.id)}
                  onChange={() => toggleProducto(producto.id)}
                  className="rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {producto.marca} {producto.modelo}
                  </div>
                  <div className="text-xs text-gray-500">
                    IMEI: {producto.imeiSerial}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const EventForm: React.FC = () => {
    const handleUseLocation = async () => {
      await captureBrowserLocation();
    };
    
    const [formData, setFormData] = useState<EventFormData>({
      punto: '',
      latitud: '',
      longitud: '',
      contenedor: '',
      tipoTransporte: '',
      dim: '',
      valorCIF: '',
      totalPagado: '',
      comerciante: '',
      productosSeleccionados: []
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    };

    const handleProductSelectionChange = (seleccionados: string[]) => {
      setFormData({
        ...formData,
        productosSeleccionados: seleccionados
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
        {etapaConfig.esDinamico && productosDisponibles.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <ProductSelector
              productos={productosDisponibles}
              productosSeleccionados={formData.productosSeleccionados}
              onSelectionChange={handleProductSelectionChange}
            />
          </div>
        )}

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
              disabled={submitting}
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
              disabled={submitting}
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
              disabled={submitting}
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
                  disabled={submitting}
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
                  disabled={submitting}
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
                  disabled={submitting}
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
                  disabled={submitting}
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
                  disabled={submitting}
                />
              </div>
            </>
          )}

          {etapaActual === 'DISTRIBUCION' && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Comerciante/Distribuidor *</label>
              <input
                type="text"
                name="comerciante"
                value={formData.comerciante}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre del comerciante o tienda"
                required
                disabled={submitting}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-gray-200 space-y-4 sm:space-y-0">
          <button
            type="button"
            onClick={() => router.push('/lotes')}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={submitting}
          >
            Volver a Lotes
          </button>
          <button
            type="button"
            onClick={handleUseLocation}
            className="flex items-center space-x-2 px-4 py-3 text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
            disabled={submitting}
          >
            <MapPin size={18} />
            <span>Usar ubicación actual</span>
          </button>
          <button
            type="submit"
            className={`px-4 py-3 ${etapaConfig.bgColor} text-white rounded-lg hover:opacity-90 transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={submitting || (etapaConfig.esDinamico && formData.productosSeleccionados.length === 0)}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <etapaConfig.icon className="w-4 h-4" />
                <span>
                  Registrar {etapaConfig.titulo}
                  {etapaConfig.esDinamico && formData.productosSeleccionados.length > 0 && 
                    ` (${formData.productosSeleccionados.length} productos)`
                  }
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    );
  };

  const EstadisticasLote: React.FC = () => {
    const estadosProductos = loteSeleccionado.productos.reduce((acc, producto) => {
      acc[producto.estado] = (acc[producto.estado] || 0) + 1;
      return acc;
    }, {} as Record<EstadoEvento, number>);

    const estadosOrdenados: { estado: EstadoEvento; label: string }[] = [
      { estado: 'REGISTRADO', label: 'Registrados' },
      { estado: 'EMBARCADO', label: 'Embarcados' },
      { estado: 'DESEMBARCADO', label: 'Desembarcados' },
      { estado: 'NACIONALIZADO', label: 'Nacionalizados' },
      { estado: 'EN_DISTRIBUCION', label: 'En Distribución' },
      { estado: 'PRODUCTO_ADQUIRIDO', label: 'Vendidos' }
    ];

    const estadosConProductos = estadosOrdenados.filter(({ estado }) => {
      const cantidad = estadosProductos[estado] || 0;
      return cantidad > 0;
    });

    if (estadosConProductos.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de los Productos</h3>
          <p className="text-gray-500 text-center py-8">No hay productos en este lote</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de los Productos</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {estadosConProductos.map(({ estado, label }) => {
            const cantidad = estadosProductos[estado] || 0;
            const colors = COLOR_MAP[estado];
            return (
              <div key={estado} className={`${colors.bg} p-4 rounded-lg text-center`}>
                <div className={`text-2xl font-bold ${colors.textBold}`}>
                  {cantidad}
                </div>
                <div className={`text-sm ${colors.text} font-medium`}>
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
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
                <span className="text-sm text-green-600 font-medium">Creado</span>
              </div>
              <div className="text-lg font-semibold text-green-800">
                {new Date(loteSeleccionado.fechaCreacion).toLocaleDateString('es-BO')}
              </div>
              <div className="text-xs text-green-600">fecha de registro</div>
            </div>
          </div>
        </div>
      </div>

      <EstadisticasLote />

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Progreso del Proceso</h3>
        <p className="text-sm text-gray-600 mb-4">Haz clic en una etapa con productos pendientes para procesarla</p>
        <ProgressIndicator />
      </div>

      {productosDisponibles.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${etapaConfig.bgColorLight} shadow-sm`}>
                <etapaConfig.icon size={32} className={etapaConfig.textColor} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Registrar {etapaConfig.titulo}</h2>
                <p className="text-gray-600 mt-1">{etapaConfig.descripcion}</p>
                <div className="text-sm text-blue-600 font-medium mt-2">
                  {etapaConfig.esDinamico 
                    ? `${productosDisponibles.length} productos disponibles para esta etapa`
                    : `Este evento se aplicará a todos los productos del lote`
                  }
                </div>
              </div>
            </div>
          </div>
          <EventForm />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Lote Procesado</h2>
            <p className="text-gray-600 mb-6">
              Todos los productos han completado su proceso correspondiente.
            </p>
            <button
              onClick={() => router.push('/lotes')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver a Lotes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}