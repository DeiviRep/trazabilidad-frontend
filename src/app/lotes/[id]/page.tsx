'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Truck, Ship, CheckCircle, ChevronRight, MapPin, Box, Calendar, User, ShoppingCart } from 'lucide-react';
import { TrazabilidadAPI } from '@/services/api';
import { useMap } from '@/hooks/useMap';
import { EventoTipoDtoUrlApi, EventoPayload } from '@/services/typesDto';

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

// Nueva interface para los datos del backend
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
  eventos: Evento[];
  productos: ProductoBackend[];
}

interface EtapaConfig {
  titulo: string;
  estado: EstadoEvento;
  color: ColorName;
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

const ETAPAS_FLUJO: Record<string, EtapaConfig> = {
  EMBARQUE: {
    titulo: "Embarque",
    estado: 'EMBARCADO',
    color: 'orange',
    icon: Truck,
    descripcion: "Registra información del transporte y contenedor para todo el lote",
    eventoUrlApi: 'EMBARQUE'
  },
  DESEMBARQUE: {
    titulo: "Desembarque",
    estado: 'DESEMBARCADO',
    color: 'cyan',
    icon: Ship,
    descripcion: "Verifica llegada al puerto extranjero e integridad del lote completo",
    eventoUrlApi: 'DESEMBARQUE'
  },
  NACIONALIZACION: {
    titulo: "Nacionalización",
    estado: 'NACIONALIZADO',
    color: 'green',
    icon: CheckCircle,
    descripcion: "Procesa documentos aduaneros y pago de impuestos para el lote",
    eventoUrlApi: 'NACIONALIZACION'
  },
  DISTRIBUCION: {
    titulo: "Distribución",
    estado: 'EN_DISTRIBUCION',
    color: 'purple',
    icon: Package,
    descripcion: "Distribuye productos seleccionados a comerciantes específicos",
    eventoUrlApi: 'DISTRIBUCION',
    esDinamico: true
  },
  PRODUCTO_ADQUIRIDO: {
    titulo: "Producto Adquirido",
    estado: 'PRODUCTO_ADQUIRIDO',
    color: 'pink',
    icon: ShoppingCart,
    descripcion: "Marca productos específicos como vendidos/adquiridos",
    eventoUrlApi: 'ADQUIRIDO',
    esDinamico: true
  }
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

  // Función para transformar los datos del backend a la estructura del lote
  const transformarDatosBackend = (productos: ProductoBackend[]): Lote | null => {
    if (!productos || productos.length === 0) return null;

    const primerProducto = productos[0];
    
    // Obtener todas las marcas y modelos únicos
    const marcasUnicas = [...new Set(productos.map(p => p.marca))];
    const modelosUnicos = [...new Set(productos.map(p => p.modelo))];
    
    // Determinar el estado más avanzado de todos los productos
    const ordenEstados: EstadoEvento[] = ['REGISTRADO', 'EMBARCADO', 'DESEMBARCADO', 'NACIONALIZADO', 'EN_DISTRIBUCION', 'PRODUCTO_ADQUIRIDO'];
    const estadoMasAvanzado = productos.reduce((estadoMax, producto) => {
      const indiceActual = ordenEstados.indexOf(producto.estado);
      const indiceMax = ordenEstados.indexOf(estadoMax);
      return indiceActual > indiceMax ? producto.estado : estadoMax;
    }, 'REGISTRADO' as EstadoEvento);

    // Combinar todos los eventos únicos de todos los productos
    const eventosUnicos = new Map<string, Evento>();
    productos.forEach(producto => {
      producto.eventos.forEach(evento => {
        const key = `${evento.tipo}-${evento.fecha}-${evento.puntoControl}`;
        if (!eventosUnicos.has(key)) {
          eventosUnicos.set(key, {
            tipo: evento.tipo,
            fecha: evento.fecha,
            punto: evento.puntoControl,
            coordenadas: evento.coordenadas
          });
        }
      });
    });

    return {
      id: primerProducto.uuidLote,
      lote: primerProducto.lote,
      marca: marcasUnicas.length === 1 ? marcasUnicas[0] : `${marcasUnicas[0]} y otros`,
      modelo: modelosUnicos.length === 1 ? modelosUnicos[0] : `${modelosUnicos[0]} y otros`,
      cantidadProductos: productos.length,
      estado: estadoMasAvanzado,
      url: primerProducto.urlLote,
      fechaCreacion: primerProducto.fechaCreacion,
      eventos: Array.from(eventosUnicos.values()).sort((a, b) => 
        new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      ),
      productos: productos
    };
  };

  const run = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await TrazabilidadAPI.listarPorLote(idLote);
      console.log('Datos del backend:', data);
      
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
    
    // Para las etapas dinámicas, verificamos si hay productos disponibles para esa etapa
    const productosNacionalizados = lote.productos.filter(p => p.estado === 'NACIONALIZADO');
    const productosEnDistribucion = lote.productos.filter(p => p.estado === 'EN_DISTRIBUCION');
    
    // Si hay productos nacionalizados, permitir distribución
    if (productosNacionalizados.length > 0) {
      return 'DISTRIBUCION';
    }
    
    // Si hay productos en distribución, permitir venta
    if (productosEnDistribucion.length > 0) {
      return 'PRODUCTO_ADQUIRIDO';
    }
    
    // Para etapas no dinámicas, seguir el flujo normal
    const currentIndex = etapas.findIndex(etapa => ETAPAS_FLUJO[etapa].estado === lote.estado);
    return etapas[currentIndex + 1] || etapas[etapas.length - 1];
  };

  const getProductosDisponiblesPorEtapa = (etapa: keyof typeof ETAPAS_FLUJO): ProductoBackend[] => {
    if (!loteSeleccionado) return [];
    
    switch (etapa) {
      case 'DISTRIBUCION':
        return loteSeleccionado.productos.filter(p => p.estado === 'NACIONALIZADO');
      case 'PRODUCTO_ADQUIRIDO':
        return loteSeleccionado.productos.filter(p => p.estado === 'EN_DISTRIBUCION');
      default:
        return loteSeleccionado.productos;
    }
  };

  const handleSubmit = async (formData: Partial<EventFormData>): Promise<void> => {
    if (!loteSeleccionado || !loteSeleccionado.productos) return;

    try {
      setSubmitting(true);
      const etapaConfig = ETAPAS_FLUJO[etapaActual];
      
      // Crear el payload base
      const basePayload: Omit<EventoPayload, 'id'> = {
        latitud: formData.latitud || '',
        longitud: formData.longitud || '',
        puntoControl: formData.punto || '',
      };

      // Agregar campos específicos según la etapa
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

      // Determinar qué productos procesar
      let productosAProcesar: ProductoBackend[];
      
      if (etapaConfig.esDinamico && formData.productosSeleccionados) {
        // Para etapas dinámicas, usar solo los productos seleccionados
        productosAProcesar = loteSeleccionado.productos.filter(p => 
          formData.productosSeleccionados!.includes(p.id)
        );
      } else {
        // Para etapas no dinámicas, procesar todos los productos del lote
        productosAProcesar = loteSeleccionado.productos;
      }

      // Crear payloads para cada producto seleccionado
      const eventosPayload: EventoPayload[] = productosAProcesar.map(producto => ({
        ...basePayload,
        id: producto.id
      }));

      console.log('Procesando productos:', eventosPayload);
      
      // Llamar a la API para eventos por lote
      await TrazabilidadAPI.eventoLote({
        eventoUrlApi: etapaConfig.eventoUrlApi,
        body: eventosPayload 
      });

      // Recargar los datos del lote
      await run();

    } catch (error) {
      console.error('Error al registrar evento:', error);
      setError('Error al registrar el evento. Por favor, intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
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

  // Error state
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

  // No data state
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

  const ProgressIndicator: React.FC = () => {
    const etapas = Object.keys(ETAPAS_FLUJO) as Array<keyof typeof ETAPAS_FLUJO>;
    const estadosProductos = loteSeleccionado.productos.reduce((acc, producto) => {
      acc[producto.estado] = (acc[producto.estado] || 0) + 1;
      return acc;
    }, {} as Record<EstadoEvento, number>);

    return (
      <div className="mb-8 overflow-x-auto">
        <div className="flex items-center space-x-2 min-w-max pb-4">
          {etapas.map((etapa, index) => {
            const config = ETAPAS_FLUJO[etapa];
            const Icon = config.icon;
            const cantidadEnEsteEstado = estadosProductos[config.estado] || 0;
            const hayProductosEnEsteEstado = cantidadEnEsteEstado > 0;
            const esEtapaActiva = etapa === etapaActual;

            return (
              <div key={etapa} className="flex items-center">
                <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                  esEtapaActiva 
                    ? `bg-${config.color}-50 border-${config.color}-200 shadow-md` 
                    : hayProductosEnEsteEstado 
                      ? 'bg-gray-100 border-gray-300 shadow-sm' 
                      : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`p-2 rounded-lg transition-all ${
                    esEtapaActiva 
                      ? `bg-white text-${config.color}-600 shadow-sm` 
                      : hayProductosEnEsteEstado 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-400'
                  }`}>
                    {hayProductosEnEsteEstado && !esEtapaActiva ? <CheckCircle size={18} /> : <Icon size={18} />}
                  </div>
                  <div>
                    <span className={`font-semibold text-sm block ${
                      esEtapaActiva ? `text-${config.color}-700` : hayProductosEnEsteEstado ? 'text-gray-700' : 'text-gray-400'
                    }`}>
                      {config.titulo}
                    </span>
                    <span className={`text-xs ${
                      esEtapaActiva ? 'text-gray-600' : hayProductosEnEsteEstado ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {config.esDinamico && cantidadEnEsteEstado > 0 
                        ? `${cantidadEnEsteEstado} productos` 
                        : config.descripcion
                      }
                    </span>
                  </div>
                </div>
                {index < etapas.length - 1 && (
                  <div className="flex items-center mx-3">
                    <ChevronRight 
                      className={`${hayProductosEnEsteEstado ? 'text-green-400' : 'text-gray-300'} transition-colors`} 
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
        {/* Selector de productos para etapas dinámicas */}
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
            className={`px-4 py-3 bg-${etapaConfig.color}-600 text-white rounded-lg hover:bg-${etapaConfig.color}-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed`}
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

    const estadosOrdenados: { estado: EstadoEvento; label: string; color: string }[] = [
      { estado: 'REGISTRADO', label: 'Registrados', color: 'blue' },
      { estado: 'EMBARCADO', label: 'Embarcados', color: 'orange' },
      { estado: 'DESEMBARCADO', label: 'Desembarcados', color: 'cyan' },
      { estado: 'NACIONALIZADO', label: 'Nacionalizados', color: 'green' },
      { estado: 'EN_DISTRIBUCION', label: 'En Distribución', color: 'purple' },
      { estado: 'PRODUCTO_ADQUIRIDO', label: 'Vendidos', color: 'pink' }
    ];

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de los Productos</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {estadosOrdenados.map(({ estado, label, color }) => {
            const cantidad = estadosProductos[estado] || 0;
            return (
              <div key={estado} className={`bg-${color}-50 p-4 rounded-lg text-center`}>
                <div className={`text-2xl font-bold text-${color}-800`}>
                  {cantidad}
                </div>
                <div className={`text-sm text-${color}-600 font-medium`}>
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

      {/* Estadísticas de productos */}
      <EstadisticasLote />

      {/* Indicador de progreso */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Progreso del Proceso</h3>
        <ProgressIndicator />
      </div>

      {/* Formulario de siguiente evento */}
      {productosDisponibles.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl bg-${etapaConfig.color}-50 shadow-sm`}>
                <etapaConfig.icon size={32} className={`text-${etapaConfig.color}-600`} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Registrar {etapaConfig.titulo}</h2>
                <p className="text-gray-600 mt-1">{etapaConfig.descripcion}</p>
                <div className="text-sm text-blue-600 font-medium mt-2">
                  {etapaConfig.esDinamico 
                    ? `${productosDisponibles.length} productos disponibles para esta etapa`
                    : `Este evento se aplicará a las ${loteSeleccionado.cantidadProductos} unidades del lote`
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
              No hay productos disponibles para procesar en la etapa actual.
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