'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package, Truck, Ship, CheckCircle, MapPin, Box, Calendar, ShoppingCart, ArrowLeft
} from 'lucide-react';
import { TrazabilidadAPI } from '@/services/api';
import { useMap } from '@/hooks/useMap';
import { EventoTipoDtoUrlApi, EventoPayload } from '@/services/typesDto';
import RoleGuard from '@/components/RoleGuard';

type EstadoEvento =
  | 'REGISTRADO' | 'EMBARCADO' | 'DESEMBARCADO'
  | 'NACIONALIZADO' | 'EN_DISTRIBUCION' | 'PRODUCTO_ADQUIRIDO';

interface ProductoBackend {
  lote: string; uuidLote: string; id: string; marca: string; modelo: string;
  imeiSerial: string; estado: EstadoEvento; urlLote: string; fechaCreacion: string;
  eventos: { tipo: EstadoEvento; fecha: string; puntoControl: string; coordenadas: [number, number] }[];
}

interface Lote {
  id: string; lote: string; marca: string; modelo: string;
  cantidadProductos: number; estado: EstadoEvento; url: string;
  fechaCreacion: string; eventos: any[]; productos: ProductoBackend[];
}

interface EtapaConfig {
  titulo: string; estado: EstadoEvento; bgColor: string; bgColorLight: string;
  borderColor: string; textColor: string; textColorDark: string; hoverBorderColor: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  descripcion: string; eventoUrlApi: EventoTipoDtoUrlApi; esDinamico?: boolean;
}

// Todos los campos posibles del formulario, incluyendo los nuevos
interface EventFormData {
  punto: string;
  latitud: string;
  longitud: string;
  // EMBARQUE
  contenedor: string;
  tipoTransporte: string;
  blAwb: string;             // NUEVO
  // DESEMBARQUE
  documentoTransito: string; // NUEVO
  integridad: boolean;              // NUEVO — antes hardcodeado true
  descripcionIntegridad: string;    // NUEVO — antes hardcodeado
  // NACIONALIZACION
  dim: string;
  dam: string;               // NUEVO
  valorCIF: string;
  totalPagado: string;
  arancel: string;           // NUEVO (antes hardcoded 0)
  iva: string;               // NUEVO (antes hardcoded 0)
  ice: string;               // NUEVO (antes hardcoded 0)
  // DISTRIBUCION
  comerciante: string;
  responsable: string;       // NUEVO
  // ADQUIRIDO
  tienda: string;            // NUEVO
  // Selección de productos
  productosSeleccionados: string[];
}

interface Params { id: string }

const ETAPAS_FLUJO: Record<string, EtapaConfig> = {
  REGISTRO:           { titulo: 'Registro',       estado: 'REGISTRADO',         bgColor: 'bg-indigo-600', bgColorLight: 'bg-indigo-50', borderColor: 'border-indigo-200', textColor: 'text-indigo-600', textColorDark: 'text-indigo-700', hoverBorderColor: 'hover:border-indigo-300', icon: Box,          descripcion: 'Productos registrados en el sistema',                             eventoUrlApi: 'REGISTRO' },
  EMBARQUE:           { titulo: 'Embarque',        estado: 'EMBARCADO',          bgColor: 'bg-orange-600', bgColorLight: 'bg-orange-50', borderColor: 'border-orange-200', textColor: 'text-orange-600', textColorDark: 'text-orange-700', hoverBorderColor: 'hover:border-orange-300', icon: Truck,        descripcion: 'Registra transporte, contenedor y documento B/L o AWB',           eventoUrlApi: 'EMBARQUE' },
  DESEMBARQUE:        { titulo: 'Desembarque',     estado: 'DESEMBARCADO',       bgColor: 'bg-cyan-600',   bgColorLight: 'bg-cyan-50',   borderColor: 'border-cyan-200',   textColor: 'text-cyan-600',   textColorDark: 'text-cyan-700',   hoverBorderColor: 'hover:border-cyan-300',   icon: Ship,         descripcion: 'Puerto de llegada, integridad y documento DUS/DTI',               eventoUrlApi: 'DESEMBARQUE' },
  NACIONALIZACION:    { titulo: 'Nacionalización', estado: 'NACIONALIZADO',      bgColor: 'bg-green-600',  bgColorLight: 'bg-green-50',  borderColor: 'border-green-200',  textColor: 'text-green-600',  textColorDark: 'text-green-700',  hoverBorderColor: 'hover:border-green-300',  icon: CheckCircle,  descripcion: 'Documentos aduaneros (DIM, DAM) y liquidación de impuestos',      eventoUrlApi: 'NACIONALIZACION' },
  DISTRIBUCION:       { titulo: 'Distribución',    estado: 'EN_DISTRIBUCION',    bgColor: 'bg-purple-600', bgColorLight: 'bg-purple-50', borderColor: 'border-purple-200', textColor: 'text-purple-600', textColorDark: 'text-purple-700', hoverBorderColor: 'hover:border-purple-300', icon: Package,      descripcion: 'Distribuye productos a comerciantes específicos',                  eventoUrlApi: 'DISTRIBUCION',   esDinamico: true },
  PRODUCTO_ADQUIRIDO: { titulo: 'Adquirido',       estado: 'PRODUCTO_ADQUIRIDO', bgColor: 'bg-blue-600',   bgColorLight: 'bg-blue-50',   borderColor: 'border-blue-200',   textColor: 'text-blue-600',   textColorDark: 'text-blue-700',   hoverBorderColor: 'hover:border-blue-300',   icon: ShoppingCart, descripcion: 'Confirma compra y registra nombre de la tienda',                  eventoUrlApi: 'ADQUIRIDO',      esDinamico: true },
};

const COLOR_MAP: Record<EstadoEvento, { bg: string; text: string; textBold: string }> = {
  REGISTRADO:         { bg: 'bg-indigo-50', text: 'text-indigo-600', textBold: 'text-indigo-800' },
  EMBARCADO:          { bg: 'bg-orange-50', text: 'text-orange-600', textBold: 'text-orange-800' },
  DESEMBARCADO:       { bg: 'bg-cyan-50',   text: 'text-cyan-600',   textBold: 'text-cyan-800' },
  NACIONALIZADO:      { bg: 'bg-green-50',  text: 'text-green-600',  textBold: 'text-green-800' },
  EN_DISTRIBUCION:    { bg: 'bg-purple-50', text: 'text-purple-600', textBold: 'text-purple-800' },
  PRODUCTO_ADQUIRIDO: { bg: 'bg-blue-50',   text: 'text-blue-600',   textBold: 'text-blue-800' },
};

const EMPTY_FORM: EventFormData = {
  punto: '', latitud: '', longitud: '',
  contenedor: '', tipoTransporte: '', blAwb: '',
  documentoTransito: '',integridad: true,
  descripcionIntegridad: '',
  dim: '', dam: '', valorCIF: '', totalPagado: '', arancel: '', iva: '', ice: '',
  comerciante: '', responsable: '',
  tienda: '',
  productosSeleccionados: [],
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

  const getEstadoAnterior = (estado: EstadoEvento): EstadoEvento | null =>
    ({ EMBARCADO: 'REGISTRADO', DESEMBARCADO: 'EMBARCADO', NACIONALIZADO: 'DESEMBARCADO',
       EN_DISTRIBUCION: 'NACIONALIZADO', PRODUCTO_ADQUIRIDO: 'EN_DISTRIBUCION' } as any)[estado] ?? null;

  const getProductosParaEtapa = (etapa: keyof typeof ETAPAS_FLUJO, lote: Lote): ProductoBackend[] => {
    const anterior = getEstadoAnterior(ETAPAS_FLUJO[etapa].estado);
    return anterior
      ? lote.productos.filter(p => p.estado === anterior)
      : lote.productos.filter(p => p.estado === 'REGISTRADO');
  };

  const getNextEtapa = (lote: Lote): keyof typeof ETAPAS_FLUJO => {
    const etapas = Object.keys(ETAPAS_FLUJO) as Array<keyof typeof ETAPAS_FLUJO>;
    return etapas.find(e => getProductosParaEtapa(e, lote).length > 0) ?? etapas[etapas.length - 1];
  };

  const transformar = (productos: ProductoBackend[]): Lote | null => {
    if (!productos?.length) return null;
    const p0 = productos[0];
    const orden: EstadoEvento[] = ['REGISTRADO','EMBARCADO','DESEMBARCADO','NACIONALIZADO','EN_DISTRIBUCION','PRODUCTO_ADQUIRIDO'];
    const estado = productos.reduce(
      (max, p) => orden.indexOf(p.estado) > orden.indexOf(max) ? p.estado : max,
      'REGISTRADO' as EstadoEvento
    );
    const marcas  = [...new Set(productos.map(p => p.marca))];
    const modelos = [...new Set(productos.map(p => p.modelo))];
    return {
      id: p0.uuidLote, lote: p0.lote,
      marca:  marcas.length  === 1 ? marcas[0]  : `${marcas[0]} y otros`,
      modelo: modelos.length === 1 ? modelos[0] : `${modelos[0]} y otros`,
      cantidadProductos: productos.length, estado,
      url: p0.urlLote, fechaCreacion: p0.fechaCreacion,
      eventos: [], productos,
    };
  };

  const run = async () => {
    try {
      setLoading(true); setError(null);
      const data = await TrazabilidadAPI.listarPorLote(idLote);
      const lote = transformar(data);
      if (lote) { setLoteSeleccionado(lote); setEtapaActual(getNextEtapa(lote)); }
      else setError('No se encontraron productos para este lote');
    } catch { setError('Error al cargar la información del lote'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { if (idLote) run(); }, [idLote]);

  // ── handleSubmit: construye el payload con todos los campos nuevos ──
  const handleSubmit = async (fd: Partial<EventFormData>) => {
    if (!loteSeleccionado) return;
    try {
      setSubmitting(true);
      const cfg = ETAPAS_FLUJO[etapaActual];
      const base: Omit<EventoPayload, 'id'> = {
        latitud:      fd.latitud  || '',
        longitud:     fd.longitud || '',
        puntoControl: fd.punto    || '',
      };

      if (etapaActual === 'EMBARQUE') {
        base.nroContenedor = fd.contenedor    || '';
        base.tipoTransporte = fd.tipoTransporte || '';
        base.blAwb          = fd.blAwb         || '';   // NUEVO
      }

      if (etapaActual === 'DESEMBARQUE') {
        // base.integridad            = true;
        // base.descripcionIntegridad = 'Lote recibido en buen estado';
        base.integridad            = fd.integridad;
        base.descripcionIntegridad = fd.descripcionIntegridad || '';
        base.documentoTransito     = fd.documentoTransito || '';  // NUEVO
      }

      if (etapaActual === 'NACIONALIZACION') {
        base.dim        = fd.dim        || '';
        base.dam        = fd.dam        || '';           // NUEVO
        base.valorCIF    = fd.valorCIF   ? parseFloat(fd.valorCIF)   : undefined;
        base.totalPagado = fd.totalPagado ? parseFloat(fd.totalPagado) : undefined;
        base.arancel     = fd.arancel    ? parseFloat(fd.arancel)    : undefined;  // NUEVO
        base.iva         = fd.iva        ? parseFloat(fd.iva)        : undefined;  // NUEVO
        base.ice         = fd.ice        ? parseFloat(fd.ice)        : undefined;  // NUEVO
      }

      if (etapaActual === 'DISTRIBUCION') {
        base.comerciante = fd.comerciante || 'Distribuidor General';
        base.responsable = fd.responsable || '';    // NUEVO
      }

      if (etapaActual === 'PRODUCTO_ADQUIRIDO') {
        base.tienda     = fd.tienda || '';          // NUEVO
        base.fechaCompra = new Date().toISOString();
      }

      const prods = cfg.esDinamico && fd.productosSeleccionados?.length
        ? loteSeleccionado.productos.filter(p => fd.productosSeleccionados!.includes(p.id))
        : loteSeleccionado.productos;

      await TrazabilidadAPI.eventoLote({
        eventoUrlApi: cfg.eventoUrlApi,
        body: prods.map(p => ({ ...base, id: p.id })),
      });

      await run();
    } catch { setError('Error al registrar el evento.'); }
    finally { setSubmitting(false); }
  };

  // ── Pantallas de carga/error ──
  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <Box className="w-10 h-10 text-gray-300 mx-auto mb-3 animate-pulse" />
        <p className="text-gray-400 text-sm">Cargando lote...</p>
      </div>
    </div>
  );

  if (error && !loteSeleccionado) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-3">
        <Box className="w-10 h-10 text-red-300 mx-auto" />
        <p className="text-red-500 text-sm">{error}</p>
        <div className="flex gap-2 justify-center">
          <button onClick={() => { setError(null); run(); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Reintentar</button>
          <button onClick={() => router.push('/lotes')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">Volver</button>
        </div>
      </div>
    </div>
  );

  if (!loteSeleccionado) return null;

  const etapaConfig         = ETAPAS_FLUJO[etapaActual];
  const productosDisponibles = getProductosParaEtapa(etapaActual, loteSeleccionado);

  const getEstadoVisual = (etapa: keyof typeof ETAPAS_FLUJO): 'COMPLETADA' | 'ACTIVA' | 'FUTURA' => {
    const orden = ['REGISTRADO','EMBARCADO','DESEMBARCADO','NACIONALIZADO','EN_DISTRIBUCION','PRODUCTO_ADQUIRIDO'];
    const total       = loteSeleccionado.productos.length;
    const completados = loteSeleccionado.productos.filter(
      p => orden.indexOf(p.estado) >= orden.indexOf(ETAPAS_FLUJO[etapa].estado)
    ).length;
    if (completados === total) return 'COMPLETADA';
    const anterior = getEstadoAnterior(ETAPAS_FLUJO[etapa].estado);
    if (anterior && loteSeleccionado.productos.some(p => p.estado === anterior)) return 'ACTIVA';
    return 'FUTURA';
  };

  const estadosProductos = loteSeleccionado.productos.reduce(
    (acc, p) => { acc[p.estado] = (acc[p.estado] || 0) + 1; return acc; },
    {} as Record<EstadoEvento, number>
  );
  const estadosBadges = (
    ['REGISTRADO','EMBARCADO','DESEMBARCADO','NACIONALIZADO','EN_DISTRIBUCION','PRODUCTO_ADQUIRIDO'] as EstadoEvento[]
  ).filter(e => estadosProductos[e] > 0).map(e => ({
    estado: e,
    label: { REGISTRADO:'Registrados', EMBARCADO:'Embarcados', DESEMBARCADO:'Desembarcados',
             NACIONALIZADO:'Nacionalizados', EN_DISTRIBUCION:'En Distribución', PRODUCTO_ADQUIRIDO:'Vendidos' }[e],
    count: estadosProductos[e],
  }));

  // ── ProductSelector ──
  const ProductSelector: React.FC<{
    productos: ProductoBackend[]; seleccionados: string[]; onChange: (s: string[]) => void;
  }> = ({ productos, seleccionados, onChange }) => {
    const toggle = (id: string) =>
      onChange(seleccionados.includes(id) ? seleccionados.filter(x => x !== id) : [...seleccionados, id]);
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Seleccionar ({seleccionados.length}/{productos.length})
          </span>
          <button type="button"
            onClick={() => onChange(seleccionados.length === productos.length ? [] : productos.map(p => p.id))}
            className="cursor-pointer text-xs text-blue-600 hover:text-blue-800 font-medium">
            {seleccionados.length === productos.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
          {productos.map(p => (
            <div key={p.id} onClick={() => toggle(p.id)}
              className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer transition-all ${
                seleccionados.includes(p.id) ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
              <input type="checkbox" checked={seleccionados.includes(p.id)}
                onChange={() => toggle(p.id)} className="rounded accent-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{p.marca} {p.modelo}</p>
                <p className="text-xs text-gray-400">IMEI: {p.imeiSerial}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── EventForm ──
  const EventForm: React.FC = () => {
    const [fd, setFd] = useState<EventFormData>({ ...EMPTY_FORM });
    const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setFd(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const inp = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50";

    useEffect(() => {
      if (coords) setFd(prev => ({ ...prev, latitud: coords.lat.toString(), longitud: coords.lon.toString() }));
    }, []);

    return (
      <form onSubmit={e => { e.preventDefault(); handleSubmit(fd); }} className="flex flex-col h-full">
        <div className="flex-1 space-y-3 overflow-y-auto">

          {/* Selector de productos (etapas dinámicas) */}
          {etapaConfig.esDinamico && productosDisponibles.length > 0 && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <ProductSelector
                productos={productosDisponibles}
                seleccionados={fd.productosSeleccionados}
                onChange={s => setFd(prev => ({ ...prev, productosSeleccionados: s }))}
              />
            </div>
          )}

          {/* Punto de control */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Punto / Ubicación *</label>
            <input name="punto" value={fd.punto} onChange={set} className={inp}
              placeholder="Ej: Puerto Shanghai, Aduana Tambo Quemado" required disabled={submitting} />
          </div>

          {/* Coordenadas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Latitud *</label>
              <input name="latitud" value={fd.latitud} onChange={set} className={inp} required disabled={submitting} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Longitud *</label>
              <input name="longitud" value={fd.longitud} onChange={set} className={inp} required disabled={submitting} />
            </div>
          </div>

          {/* ── EMBARQUE ── */}
          {etapaActual === 'EMBARQUE' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de transporte</label>
                  <select name="tipoTransporte" value={fd.tipoTransporte} onChange={set} className={inp} disabled={submitting}>
                    <option value="">Seleccionar</option>
                    <option value="Marítimo">Marítimo</option>
                    <option value="Aéreo">Aéreo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nº Contenedor</label>
                  <input name="contenedor" value={fd.contenedor} onChange={set}
                    className={inp} placeholder="ABCD1234567" disabled={submitting} />
                </div>
              </div>
              {/* NUEVO */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  B/L o AWB <span className="text-gray-400 font-normal">(Bill of Lading / Air Waybill)</span>
                </label>
                <input name="blAwb" value={fd.blAwb} onChange={set}
                  className={inp} placeholder="Ej: MAEUWH1234567" disabled={submitting} />
              </div>
            </>
          )}

          {/* ── DESEMBARQUE ── */}
          {etapaActual === 'DESEMBARQUE' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Documento DUS / DTI <span className="text-gray-400 font-normal">(Chile / Perú)</span>
                </label>
                <input name="documentoTransito" value={fd.documentoTransito} onChange={set}
                  className={inp} placeholder="Ej: DUS-2025-00123" disabled={submitting} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Estado de la mercancía</label>
                <select
                  name="integridad"
                  value={fd.integridad ? 'true' : 'false'}
                  onChange={e => setFd(prev => ({ ...prev, integridad: e.target.value === 'true' }))}
                  className={inp}
                  disabled={submitting}
                >
                  <option value="true">Conforme</option>
                  <option value="false">No conforme</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Descripción <span className="text-gray-400 font-normal">(observaciones)</span>
                </label>
                <input name="descripcionIntegridad" value={fd.descripcionIntegridad} onChange={set}
                  className={inp} placeholder="Ej: Lote recibido en buen estado" disabled={submitting} />
              </div>
            </div>
          )}
          
          {/* ── NACIONALIZACION ── */}
          {etapaActual === 'NACIONALIZACION' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nº DIM *</label>
                  <input name="dim" value={fd.dim} onChange={set}
                    className={inp} placeholder="123-456-789" disabled={submitting} />
                </div>
                {/* NUEVO */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nº DAM</label>
                  <input name="dam" value={fd.dam} onChange={set}
                    className={inp} placeholder="DAM-2025-001" disabled={submitting} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Valor CIF (USD)</label>
                  <input type="number" name="valorCIF" value={fd.valorCIF} onChange={set}
                    className={inp} placeholder="0.00" disabled={submitting} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Total Pagado (USD)</label>
                  <input type="number" name="totalPagado" value={fd.totalPagado} onChange={set}
                    className={inp} placeholder="0.00" disabled={submitting} />
                </div>
              </div>
              {/* NUEVOS: arancel, IVA, ICE */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Arancel (%)</label>
                  <input type="number" name="arancel" value={fd.arancel} onChange={set}
                    className={inp} placeholder="10" disabled={submitting} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">IVA (%)</label>
                  <input type="number" name="iva" value={fd.iva} onChange={set}
                    className={inp} placeholder="13" disabled={submitting} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">ICE (%)</label>
                  <input type="number" name="ice" value={fd.ice} onChange={set}
                    className={inp} placeholder="0" disabled={submitting} />
                </div>
              </div>
            </div>
          )}

          {/* ── DISTRIBUCION ── */}
          {etapaActual === 'DISTRIBUCION' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Comerciante / Tienda *</label>
                <input name="comerciante" value={fd.comerciante} onChange={set}
                  className={inp} placeholder="Ej: Garita Galería La Paz" required disabled={submitting} />
              </div>
              {/* NUEVO */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Responsable de recepción</label>
                <input name="responsable" value={fd.responsable} onChange={set}
                  className={inp} placeholder="Nombre del responsable" disabled={submitting} />
              </div>
            </>
          )}

          {/* ── ADQUIRIDO ── */}
          {etapaActual === 'PRODUCTO_ADQUIRIDO' && (
            /* NUEVO */
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre de la tienda</label>
              <input name="tienda" value={fd.tienda} onChange={set}
                className={inp} placeholder="Ej: iShop Mall Megacenter" disabled={submitting} />
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="pt-4 mt-2 border-t border-gray-100 flex items-center gap-2 flex-shrink-0">
          <button type="button" onClick={() => captureBrowserLocation()}
            className="cursor-pointer flex items-center gap-1.5 px-3 py-2 text-xs text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors flex-shrink-0"
            disabled={submitting}>
            <MapPin size={13} /> Ubicación actual
          </button>
          <button type="submit"
            className={`cursor-pointer flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${etapaConfig.bgColor} hover:opacity-90`}
            disabled={submitting || (etapaConfig.esDinamico && fd.productosSeleccionados.length === 0)}>
            {submitting
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Procesando...</span></>
              : <><etapaConfig.icon className="w-4 h-4" /><span>Registrar {etapaConfig.titulo}{etapaConfig.esDinamico && fd.productosSeleccionados.length > 0 && ` (${fd.productosSeleccionados.length})`}</span></>
            }
          </button>
        </div>
      </form>
    );
  };

  return (
    <RoleGuard allowedRoles={['ADMIN', 'PROVEEDOR', 'TRANSPORTISTA', 'ADUANA', 'DISTRIBUIDOR']}>
      <div className="flex flex-col h-full gap-4">

        {/* Top bar */}
        <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm flex-shrink-0 flex-wrap gap-y-2">
          <button onClick={() => router.push('/lotes')}
            className="cursor-pointer p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="w-px h-7 bg-gray-200 flex-shrink-0" />
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Box className="w-6 h-6 text-blue-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">{loteSeleccionado.lote}</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600 truncate">{loteSeleccionado.marca} {loteSeleccionado.modelo}</span>
              </div>
              <p className="text-xs text-gray-400 font-mono truncate">{loteSeleccionado.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 rounded-lg">
              <Package className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700">{loteSeleccionado.cantidadProductos} Unidades</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-200">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">
                {new Date(loteSeleccionado.fechaCreacion).toLocaleDateString('es-BO')}
              </span>
            </div>
            {estadosBadges.map(({ estado, label, count }) => {
              const c = COLOR_MAP[estado];
              return (
                <div key={estado} className={`px-2.5 py-1 rounded-lg ${c.bg} flex items-center gap-1`}>
                  <span className={`text-sm font-bold ${c.textBold}`}>{count}</span>
                  <span className={`text-sm ${c.text}`}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cuerpo 2 columnas */}
        <div className="flex gap-4 flex-1 min-h-0">

          {/* Columna izquierda: progreso */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 h-full">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Etapas del proceso</p>
              <div className="space-y-1">
                {(Object.keys(ETAPAS_FLUJO) as Array<keyof typeof ETAPAS_FLUJO>).map((etapa, i, arr) => {
                  const cfg       = ETAPAS_FLUJO[etapa];
                  const Icon      = cfg.icon;
                  const visual    = getEstadoVisual(etapa);
                  const isActiva   = visual === 'ACTIVA';
                  const isCompletada = visual === 'COMPLETADA';
                  const isSelected  = etapaActual === etapa;

                  return (
                    <div key={etapa}>
                      <button type="button"
                        onClick={() => { if (isActiva) setEtapaActual(etapa); }}
                        disabled={!isActiva}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                          isSelected && isActiva    ? `${cfg.bgColorLight} border ${cfg.borderColor} shadow-sm`
                          : isCompletada            ? 'bg-green-50 border border-green-200'
                          : isActiva                ? `${cfg.bgColorLight} border ${cfg.borderColor} hover:shadow-sm cursor-pointer`
                          :                           'bg-gray-50 border border-transparent opacity-50 cursor-not-allowed'
                        }`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isCompletada ? 'bg-green-500' : isActiva ? cfg.bgColor : 'bg-gray-300'
                        }`}>
                          {isCompletada
                            ? <CheckCircle size={13} className="text-white" />
                            : <Icon size={13} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${
                            isCompletada ? 'text-green-700' : isActiva ? cfg.textColorDark : 'text-gray-400'
                          }`}>{cfg.titulo}</p>
                          <p className={`text-sm ${
                            isCompletada ? 'text-green-500' : isActiva ? 'text-amber-600' : 'text-gray-400'
                          }`}>
                            {isCompletada ? '✓ Completado' : isActiva ? 'Pendiente' : 'Esperando'}
                          </p>
                        </div>
                        {isSelected && isActiva && (
                          <div className={`w-1.5 h-1.5 rounded-full bg-current ${cfg.textColor} flex-shrink-0`} />
                        )}
                      </button>
                      {i < arr.length - 1 && (
                        <div className={`ml-6 w-px h-2 my-0.5 ${isCompletada ? 'bg-green-300' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Columna derecha: formulario */}
          <div className="flex-1 min-w-0">
            {productosDisponibles.length > 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                  <div className={`w-10 h-10 rounded-xl ${etapaConfig.bgColorLight} flex items-center justify-center flex-shrink-0`}>
                    <etapaConfig.icon size={30} className={etapaConfig.textColor} />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">Registrar {etapaConfig.titulo}</h2>
                    <p className="text-xs text-gray-500">{etapaConfig.descripcion}</p>
                    <p className={`text-xs font-medium mt-0.5 ${etapaConfig.textColor}`}>
                      {etapaConfig.esDinamico
                        ? `${productosDisponibles.length} productos disponibles`
                        : 'Se aplica a todos los productos del lote'}
                    </p>
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <EventForm />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-7 h-7 text-green-500" />
                  </div>
                  <h2 className="text-base font-bold text-gray-900 mb-1">Lote Procesado</h2>
                  <p className="text-sm text-gray-400 mb-4">Todos los productos completaron su proceso.</p>
                  <button onClick={() => router.push('/lotes')}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    Volver a Lotes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}