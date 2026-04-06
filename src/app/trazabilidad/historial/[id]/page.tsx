'use client';

import React, { use, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Download, Package, Ship, Truck, CheckCircle, MapPin,
  Navigation, Hash, ExternalLink, Calendar, Clock,
  ShieldCheck, Anchor, User, Store, FileText, DollarSign,
  Container, Globe, Tag
} from 'lucide-react';
import { TrazabilidadAPI } from '@/services/api';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer    = dynamic(() => import('react-leaflet').then(m => m.TileLayer),    { ssr: false });
const Marker       = dynamic(() => import('react-leaflet').then(m => m.Marker),       { ssr: false });
const Popup        = dynamic(() => import('react-leaflet').then(m => m.Popup),        { ssr: false });
const Polyline     = dynamic(() => import('react-leaflet').then(m => m.Polyline),     { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(m => m.CircleMarker), { ssr: false });

type EstadoEvento =
  | 'REGISTRADO' | 'EMBARCADO' | 'DESEMBARCADO'
  | 'NACIONALIZADO' | 'EN_DISTRIBUCION' | 'PRODUCTO_ADQUIRIDO';

interface Evento {
  tipo: EstadoEvento;
  fecha: string;
  puntoControl: string;
  coordenadas: [number, number];
  // Embarque
  contenedor?: string;
  tipoTransporte?: string;
  // Desembarque
  integridad?: boolean;
  descripcionIntegridad?: string;
  // Nacionalización
  dim?: string;
  valorCIF?: number;
  totalPagado?: number;
  // Distribución
  comerciante?: string;
  // Adquirido
  fechaCompra?: string;
  cliente?: string;
}

interface DispositivoDataType {
  lote: string;
  uuidLote: string;
  id: string;
  marca: string;
  modelo: string;
  imeiSerial: string;
  estado: EstadoEvento;
  urlLote: string;
  fechaCreacion: string;
  eventos: Evento[];
}

interface Params { id: string }

const ESTADO_CONFIG: Record<EstadoEvento, {
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  bgClass: string;
  lightClass: string;
  textClass: string;
  borderClass: string;
  step: number;
  description: string;
}> = {
  REGISTRADO:         { color: '#3B82F6', icon: Package,     label: 'Registrado',      bgClass: 'bg-blue-500',   lightClass: 'bg-blue-50',   textClass: 'text-blue-700',   borderClass: 'border-blue-200',   step: 1, description: 'Producto ingresado al sistema de trazabilidad' },
  EMBARCADO:          { color: '#F97316', icon: Truck,       label: 'Embarcado',       bgClass: 'bg-orange-500', lightClass: 'bg-orange-50', textClass: 'text-orange-700', borderClass: 'border-orange-200', step: 2, description: 'Cargado en transporte internacional' },
  DESEMBARCADO:       { color: '#06B6D4', icon: Ship,        label: 'Desembarcado',    bgClass: 'bg-cyan-500',   lightClass: 'bg-cyan-50',   textClass: 'text-cyan-700',   borderClass: 'border-cyan-200',   step: 3, description: 'Llegada al puerto de destino' },
  NACIONALIZADO:      { color: '#10B981', icon: CheckCircle, label: 'Nacionalizado',   bgClass: 'bg-green-500',  lightClass: 'bg-green-50',  textClass: 'text-green-700',  borderClass: 'border-green-200',  step: 4, description: 'Trámite aduanero completado' },
  EN_DISTRIBUCION:    { color: '#A855F7', icon: Store,       label: 'En Distribución', bgClass: 'bg-purple-500', lightClass: 'bg-purple-50', textClass: 'text-purple-700', borderClass: 'border-purple-200', step: 5, description: 'Entregado al punto de venta' },
  PRODUCTO_ADQUIRIDO: { color: '#EC4899', icon: User,        label: 'Adquirido',       bgClass: 'bg-pink-500',   lightClass: 'bg-pink-50',   textClass: 'text-pink-700',   borderClass: 'border-pink-200',   step: 6, description: 'Producto en manos del consumidor final' },
};

const ORDEN_ESTADOS = ['REGISTRADO','EMBARCADO','DESEMBARCADO','NACIONALIZADO','EN_DISTRIBUCION','PRODUCTO_ADQUIRIDO'] as EstadoEvento[];

// ── Helpers ──
function formatFecha(fecha: string) {
  const d = new Date(fecha);
  return {
    dia: d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }),
    hora: d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
  };
}

function DataRow({ icon: Icon, label, value, mono = false, highlight = false }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: React.ReactNode;
  mono?: boolean; highlight?: boolean;
}) {
  return (
    <div className={`flex items-start gap-2 py-1.5 ${highlight ? 'rounded-lg px-2 -mx-2 bg-white/60' : ''}`}>
      <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <span className="text-xs text-gray-500 block leading-tight">{label}</span>
        <span className={`text-xs font-semibold text-gray-800 ${mono ? 'font-mono' : ''} break-words`}>{value}</span>
      </div>
    </div>
  );
}

// ── Contenido extra por tipo de evento ──
function EventoDetalle({ evento }: { evento: Evento }) {
  switch (evento.tipo) {
    case 'EMBARCADO':
      return (
        <div className="mt-3 space-y-1 pt-3 border-t border-orange-200/60">
          {evento.tipoTransporte && <DataRow icon={Globe} label="Tipo de transporte" value={evento.tipoTransporte} />}
          {evento.contenedor && <DataRow icon={Container} label="Nº Contenedor" value={evento.contenedor} mono />}
        </div>
      );

    case 'DESEMBARCADO':
      return (
        <div className="mt-3 pt-3 border-t border-cyan-200/60">
          <DataRow
            icon={ShieldCheck}
            label="Integridad del lote"
            value={
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${evento.integridad ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {evento.integridad ? '✓ Verificada' : '✗ Observaciones'}
              </span>
            }
          />
          {evento.descripcionIntegridad && (
            <p className="text-xs text-gray-500 mt-1 italic">"{evento.descripcionIntegridad}"</p>
          )}
        </div>
      );

    case 'NACIONALIZADO':
      return (
        <div className="mt-3 pt-3 border-t border-green-200/60 space-y-1">
          {evento.dim && <DataRow icon={FileText} label="DIM" value={evento.dim} mono />}
          {evento.valorCIF != null && (
            <DataRow icon={DollarSign} label="Valor CIF" value={`$${evento.valorCIF.toLocaleString()} USD`} highlight />
          )}
          {evento.totalPagado != null && (
            <DataRow icon={DollarSign} label="Total pagado en Aduana" value={`$${evento.totalPagado.toLocaleString()} USD`} highlight />
          )}
        </div>
      );

    case 'EN_DISTRIBUCION':
      return (
        <div className="mt-3 pt-3 border-t border-purple-200/60">
          {evento.comerciante && <DataRow icon={Store} label="Comerciante / Distribuidor" value={evento.comerciante} />}
        </div>
      );

    case 'PRODUCTO_ADQUIRIDO':
      return (
        <div className="mt-3 pt-3 border-t border-pink-200/60 space-y-1">
          {evento.cliente && <DataRow icon={User} label="Adquirido por" value={evento.cliente} />}
          {evento.fechaCompra && (
            <DataRow
              icon={Calendar}
              label="Fecha de compra"
              value={new Date(evento.fechaCompra).toLocaleString('es-BO', {
                day: '2-digit', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            />
          )}
        </div>
      );

    default:
      return null;
  }
}

function MapaTrazabilidad({ eventos }: { eventos: Evento[] }) {
  const validos = eventos.filter(
    e => e.coordenadas?.length === 2 && !isNaN(e.coordenadas[0]) && !isNaN(e.coordenadas[1])
  );
  if (!validos.length) return (
    <div className="flex-1 bg-gray-50 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-400 text-sm">Sin coordenadas disponibles</p>
      </div>
    </div>
  );
  const center: [number, number] = validos[0].coordenadas;
  return (
    <div className="flex-1 overflow-hidden rounded-xl border border-gray-200 min-h-0">
      <MapContainer center={center} zoom={3} className="h-full w-full" scrollWheelZoom>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
        {validos.map((e, i) => i < validos.length - 1 && (
          <Polyline key={`l${i}`}
            positions={[e.coordenadas, validos[i + 1].coordenadas]}
            color={ESTADO_CONFIG[e.tipo].color} weight={3} opacity={0.7} dashArray="8 8" />
        ))}
        {validos.map((e, i) => {
          const cfg = ESTADO_CONFIG[e.tipo];
          const Icon = cfg.icon;
          const isLast = i === validos.length - 1;
          return (
            <CircleMarker key={`m${i}`} center={e.coordenadas}
              radius={isLast ? 11 : 8} fillColor={cfg.color}
              color="white" weight={2} fillOpacity={0.9}>
              <Popup>
                <div className="text-xs space-y-1 min-w-40">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className={`p-1 rounded-full ${cfg.bgClass}`}><Icon className="w-3 h-3 text-white" /></div>
                    <span className="font-bold text-gray-900">{cfg.label}</span>
                  </div>
                  <p className="text-gray-700 font-medium">{e.puntoControl}</p>
                  <p className="text-gray-400 font-mono">{e.coordenadas[0].toFixed(4)}, {e.coordenadas[1].toFixed(4)}</p>
                  <p className="text-gray-500">{new Date(e.fecha).toLocaleString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  {isLast && <div className="px-2 py-0.5 bg-green-100 text-green-700 font-semibold rounded text-center mt-1">📍 Ubicación actual</div>}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
        {validos.length > 0 && (
          <Marker position={validos[validos.length - 1].coordenadas}>
            <Popup><span className="text-xs font-bold text-green-600">📍 Ubicación Actual</span></Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

export default function TrazabilidadPage({ params }: { params: Promise<Params> }) {
  const { id: idProducto } = use(params);
  const [data, setData] = useState<DispositivoDataType>({} as DispositivoDataType);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setLoading(true); setData(await TrazabilidadAPI.consultar(idProducto)); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [idProducto]);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <Package className="w-10 h-10 text-gray-300 mx-auto mb-3 animate-pulse" />
        <p className="text-gray-400 text-sm">Cargando trazabilidad...</p>
      </div>
    </div>
  );

  const estadoCfg = data.estado ? ESTADO_CONFIG[data.estado] : null;
  const eventosValidos = data.eventos?.filter(e => e.coordenadas?.length === 2) || [];
  const stepActual = estadoCfg?.step ?? 0;
  const totalSteps = ORDEN_ESTADOS.length;
  const estadosPresentes = new Set(data.eventos?.map(e => e.tipo) || []);

  // Duración total del recorrido
  const primerEvento = data.eventos?.[0];
  const ultimoEvento = data.eventos?.[data.eventos.length - 1];
  const duracionMs = primerEvento && ultimoEvento
    ? new Date(ultimoEvento.fecha).getTime() - new Date(primerEvento.fecha).getTime()
    : 0;
  const duracionMin = Math.round(duracionMs / 60000);
  const duracionStr = duracionMin < 60
    ? `${duracionMin} min`
    : `${Math.round(duracionMin / 60)} h ${duracionMin % 60} min`;

  return (
    <>
      <style>{`
        @keyframes sonar-ring {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(3); opacity: 0; }
        }
        .sonar-ring  { animation: sonar-ring 1.8s ease-out infinite; }
        .sonar-ring2 { animation: sonar-ring 1.8s ease-out 0.7s infinite; }
      `}</style>

      <div className="flex flex-col h-full gap-4">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-3 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm font-bold text-gray-900">{data.marca} {data.modelo}</h1>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-500 font-mono">{data.lote}</span>
                {estadoCfg && (
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${estadoCfg.lightClass} ${estadoCfg.textClass}`}>
                    {estadoCfg.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                <span className="text-xs text-gray-400 flex items-center gap-1"><Hash className="w-3 h-3" />IMEI: {data.imeiSerial}</span>
                <span className="text-xs text-gray-400 flex items-center gap-1"><Navigation className="w-3 h-3" />{data.eventos?.length || 0} eventos</span>
                <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{eventosValidos.length} ubicaciones</span>
                {duracionMin > 0 && (
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />Recorrido: {duracionStr}</span>
                )}
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(data.fechaCreacion).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data.urlLote && (
              <a href={data.urlLote} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-xs font-medium transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /> Ver lote
              </a>
            )}
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium">
              <Download className="w-4 h-4" /> Exportar
            </button>
          </div>
        </div>

        {/* ── Cuerpo ── */}
        <div className="flex gap-4 flex-1 min-h-0">

          {/* ── Historial — panel izquierdo ── */}
          <div className="w-96 flex-shrink-0 flex flex-col min-h-0">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">

              {/* Header del panel */}
              <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Historial de Trazabilidad</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{data.eventos?.length || 0} registros · cadena de bloques inmutable</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-xs font-semibold text-green-700">Verificado</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="flex-1 overflow-y-auto px-5 py-4"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}>
                {data.eventos?.map((evento, index) => {
                  const cfg = ESTADO_CONFIG[evento.tipo];
                  const Icon = cfg.icon;
                  const isLast = index === data.eventos.length - 1;
                  const isFirst = index === 0;
                  const { dia, hora } = formatFecha(evento.fecha);

                  return (
                    <div key={index} className="relative flex gap-4 pb-6">

                      {/* Línea vertical conectora */}
                      {!isLast && (
                        <div className="absolute left-5 top-10 bottom-0 w-px bg-gradient-to-b from-gray-300 to-gray-100" />
                      )}

                      {/* Icono con sonar */}
                      <div className="relative flex-shrink-0 w-10 h-10 mt-0.5">
                        {isLast && (
                          <>
                            <span className={`sonar-ring  absolute inset-0 rounded-full ${cfg.bgClass}`} style={{ opacity: 0.35 }} />
                            <span className={`sonar-ring2 absolute inset-0 rounded-full ${cfg.bgClass}`} style={{ opacity: 0.2 }} />
                          </>
                        )}
                        <div className={`relative w-10 h-10 rounded-full ${cfg.bgClass} flex items-center justify-center shadow-md z-10`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        {/* Número de paso */}
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white border border-gray-200 rounded-full flex items-center justify-center z-20 shadow-sm">
                          <span className="text-gray-500 font-bold leading-none" style={{ fontSize: '8px' }}>{index + 1}</span>
                        </div>
                      </div>

                      {/* Card del evento */}
                      <div className={`flex-1 min-w-0 rounded-xl border overflow-hidden ${isLast ? `${cfg.borderClass}` : 'border-gray-200'}`}>

                        {/* Header de la card */}
                        <div className={`px-4 py-3 ${isLast ? cfg.lightClass : 'bg-gray-50'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className={`text-sm font-bold ${isLast ? cfg.textClass : 'text-gray-800'}`}>
                                {cfg.label}
                              </span>
                              <p className="text-xs text-gray-500 mt-0.5 leading-tight">{cfg.description}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs font-semibold text-gray-700">{dia}</p>
                              <p className="text-xs text-gray-400 flex items-center gap-1 justify-end mt-0.5">
                                <Clock className="w-3 h-3" />{hora}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Cuerpo de la card */}
                        <div className="px-4 py-3 bg-white space-y-1">

                          {/* Punto de control */}
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="text-xs text-gray-400 block">Punto de control</span>
                              <span className="text-xs font-semibold text-gray-800">{evento.puntoControl}</span>
                            </div>
                          </div>

                          {/* Coordenadas */}
                          {evento.coordenadas && (
                            <div className="flex items-center gap-2">
                              <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-xs font-mono text-gray-500">
                                {evento.coordenadas[0].toFixed(4)}, {evento.coordenadas[1].toFixed(4)}
                              </span>
                            </div>
                          )}

                          {/* Detalle específico por tipo */}
                          <EventoDetalle evento={evento} />

                          {/* Badge de origen / destino final */}
                          {(isFirst || isLast) && (
                            <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              isLast
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}>
                              {isLast
                                ? <><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" /></span> Ubicación actual</>
                                : <><Tag className="w-3 h-3" /> Origen del producto</>
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Mapa — panel derecho ── */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex-1 flex flex-col min-h-0">

              <div className="flex-shrink-0 mb-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-bold text-gray-900">Mapa de Trazabilidad</span>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
                    {eventosValidos.length} puntos registrados
                  </span>
                </div>

                {/* Stepper de progreso */}
                <div className="relative flex items-start pt-1 pb-3">
                  {ORDEN_ESTADOS.map((estado) => {
                    const cfg = ESTADO_CONFIG[estado];
                    const Icon = cfg.icon;
                    const presente = estadosPresentes.has(estado);
                    const esActual = data.estado === estado;
                    return (
                      <div key={estado} className="relative z-10 flex flex-col items-center flex-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all shadow-sm ${
                          presente ? `${cfg.bgClass} border-white shadow-md` : 'bg-white border-gray-300'
                        }`}>
                          <Icon className={`w-3.5 h-3.5 ${presente ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        <span className={`mt-1.5 text-center leading-tight font-medium ${presente ? cfg.textClass : 'text-gray-400'}`}
                          style={{ fontSize: '9px', maxWidth: '54px' }}>
                          {cfg.label}
                        </span>
                        {esActual && (
                        <span className={`absolute top-1/2 -translate-y-5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full ${cfg.bgClass} border-2 border-white`}
                          style={{ animation: 'sonar-ring 1.6s ease-out infinite' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <MapaTrazabilidad eventos={data.eventos || []} />
            </div>
          </div>

        </div>
      </div>
    </>
  );
}