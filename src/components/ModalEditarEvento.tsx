// src/components/ModalEditarEvento.tsx
'use client';

import { useState } from 'react';
import { X, AlertTriangle, Save, Shield, Lock } from 'lucide-react';
import { TrazabilidadAPI } from '@/services/api';
import { useHasRole } from '@/context/AuthContext';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Evento {
  tipo: string;
  fecha: string;
  puntoControl: string;
  coordenadas?: [number, number];
  contenedor?: string;
  tipoTransporte?: string;
  blAwb?: string;
  integridad?: boolean;
  descripcionIntegridad?: string;
  documentoTransito?: string;
  dim?: string;
  dam?: string;
  valorCIF?: number;
  totalPagado?: number;
  arancel?: number;
  iva?: number;
  ice?: number;
  comerciante?: string;
  responsable?: string;
  deposito?: string;
  tienda?: string;
  cliente?: string;
  fechaCompra?: string;
}

interface ModalEditarEventoProps {
  productoId: string;
  indexEvento: number;
  evento: Evento;
  onClose: () => void;
  onSuccess: (productoActualizado: any) => void;
}

// ── Campos editables por tipo de evento ──────────────────────────────────────
// tipo, fecha y coordenadas son SIEMPRE protegidos (el chaincode los bloquea)
const CAMPOS_POR_TIPO: Record<string, {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'textarea';
}[]> = {
  REGISTRADO: [
    { key: 'puntoControl', label: 'Punto de control', type: 'text' },
  ],
  EMBARCADO: [
    { key: 'puntoControl',   label: 'Punto de control',    type: 'text'   },
    { key: 'contenedor',     label: 'Contenedor',           type: 'text'   },
    { key: 'tipoTransporte', label: 'Tipo de transporte',   type: 'text'   },
    { key: 'blAwb',          label: 'BL / AWB',             type: 'text'   },
  ],
  DESEMBARCADO: [
    { key: 'puntoControl',          label: 'Punto de control',       type: 'text'     },
    { key: 'integridad',            label: 'Integridad verificada',   type: 'boolean'  },
    { key: 'descripcionIntegridad', label: 'Descripción de integridad', type: 'textarea' },
    { key: 'documentoTransito',     label: 'Documento de tránsito',   type: 'text'     },
  ],
  NACIONALIZADO: [
    { key: 'puntoControl', label: 'Punto de control', type: 'text'   },
    { key: 'dim',          label: 'DIM',               type: 'text'   },
    { key: 'dam',          label: 'DAM',               type: 'text'   },
    { key: 'valorCIF',     label: 'Valor CIF (USD)',    type: 'number' },
    { key: 'totalPagado',  label: 'Total pagado (USD)', type: 'number' },
    { key: 'arancel',      label: 'Arancel (%)',        type: 'number' },
    { key: 'iva',          label: 'IVA (%)',            type: 'number' },
    { key: 'ice',          label: 'ICE (%)',            type: 'number' },
  ],
  EN_DISTRIBUCION: [
    { key: 'puntoControl', label: 'Punto de control',      type: 'text' },
    { key: 'comerciante',  label: 'Comerciante / Distribuidor', type: 'text' },
    { key: 'responsable',  label: 'Responsable',           type: 'text' },
    { key: 'deposito',     label: 'Depósito',              type: 'text' },
  ],
  PRODUCTO_ADQUIRIDO: [
    { key: 'puntoControl', label: 'Punto de control', type: 'text'   },
    { key: 'tienda',       label: 'Tienda',           type: 'text'   },
    { key: 'cliente',      label: 'Cliente',          type: 'text'   },
    { key: 'fechaCompra',  label: 'Fecha de compra',  type: 'text'   },
  ],
};

// ── Componente ────────────────────────────────────────────────────────────────
export function ModalEditarEvento({
  productoId,
  indexEvento,
  evento,
  onClose,
  onSuccess,
}: ModalEditarEventoProps) {
  const esAdmin = useHasRole('ADMIN');

  // Inicializar form con valores actuales del evento
  const campos = CAMPOS_POR_TIPO[evento.tipo] ?? [];
  const [form, setForm] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    campos.forEach(c => {
      initial[c.key] = (evento as any)[c.key] ?? '';
    });
    return initial;
  });

  const [confirmado, setConfirmado]   = useState(false);
  const [guardando,  setGuardando]    = useState(false);
  const [error,      setError]        = useState<string | null>(null);

  // Solo ADMIN puede usar este modal
  if (!esAdmin) return null;

  function handleChange(key: string, value: any) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleGuardar() {
    if (!confirmado) return;
    setGuardando(true);
    setError(null);

    try {
      // Filtrar solo campos que cambiaron y tienen valor
      const cambios: Record<string, any> = {};
      campos.forEach(c => {
        const valorActual = (evento as any)[c.key];
        const valorNuevo  = form[c.key];

        // Convertir tipos
        let valorFinal = valorNuevo;
        if (c.type === 'number')  valorFinal = valorNuevo !== '' ? Number(valorNuevo) : undefined;
        if (c.type === 'boolean') valorFinal = valorNuevo === true || valorNuevo === 'true';

        if (valorFinal !== undefined && valorFinal !== '' && valorFinal !== valorActual) {
          cambios[c.key] = valorFinal;
        }
      });

      if (Object.keys(cambios).length === 0) {
        setError('No se realizaron cambios.');
        setGuardando(false);
        return;
      }

      const resultado = await TrazabilidadAPI.actualizarCampoEvento(
        productoId,
        indexEvento,
        cambios,
      );

      onSuccess(resultado);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'Error al guardar los cambios');
    } finally {
      setGuardando(false);
    }
  }

  const ESTADO_LABELS: Record<string, string> = {
    REGISTRADO:         'Registrado',
    EMBARCADO:          'Embarcado',
    DESEMBARCADO:       'Desembarcado',
    NACIONALIZADO:      'Nacionalizado',
    EN_DISTRIBUCION:    'En Distribución',
    PRODUCTO_ADQUIRIDO: 'Adquirido',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',zIndex: 9999  }}
      onClick={(e) => { if (e.currentTarget === e.target) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full max-w-xl max-h-[90vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                Editar evento — {ESTADO_LABELS[evento.tipo] ?? evento.tipo}
              </h2>
              <p className="text-xs text-gray-400">Evento #{indexEvento + 1} · Solo ADMIN</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Advertencia blockchain ── */}
        <div className="mx-5 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-800">
                Advertencia — Edición irreversible con registro completo en blockchain 
              </p>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                (Hyperledger Fabric)
              </p>
            </div>
          </div>
        </div>

        {/* ── Campos protegidos (solo lectura) ── */}
        <div className="mx-5 mt-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
          <div className="flex items-center gap-1.5 mb-2">
            <Lock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500">Campos inmutables (no editables)</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div>
              <span className="text-xs text-gray-400">Tipo de evento</span>
              <p className="text-xs font-semibold text-gray-700">{ESTADO_LABELS[evento.tipo]}</p>
            </div>
            <div>
              <span className="text-xs text-gray-400">Fecha del evento</span>
              <p className="text-xs font-semibold text-gray-700">
                {new Date(evento.fecha).toLocaleString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {evento.coordenadas && (
              <div className="col-span-2">
                <span className="text-xs text-gray-400">Coordenadas</span>
                <p className="text-xs font-semibold text-gray-700 font-mono">
                  {evento.coordenadas[0].toFixed(6)}, {evento.coordenadas[1].toFixed(6)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Campos editables ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {campos.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              No hay campos editables para este tipo de evento.
            </p>
          )}

          {campos.map(campo => (
            <div key={campo.key}>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {campo.label}
              </label>

              {campo.type === 'textarea' ? (
                <textarea
                  rows={3}
                  value={form[campo.key] ?? ''}
                  onChange={e => handleChange(campo.key, e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder={`Ingresa ${campo.label.toLowerCase()}`}
                />
              ) : campo.type === 'boolean' ? (
                <div className="flex gap-3">
                  {[
                    { val: true,  label: 'Verificada ✓' },
                    { val: false, label: 'Con observaciones ✗' },
                  ].map(opt => (
                    <button
                      key={String(opt.val)}
                      onClick={() => handleChange(campo.key, opt.val)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                        form[campo.key] === opt.val
                          ? opt.val
                            ? 'bg-green-100 border-green-400 text-green-700'
                            : 'bg-red-100 border-red-400 text-red-700'
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type={campo.type === 'number' ? 'number' : 'text'}
                  value={form[campo.key] ?? ''}
                  onChange={e => handleChange(campo.key, e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Ingresa ${campo.label.toLowerCase()}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* ── Confirmación ── */}
        <div className="px-5 pb-2">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmado}
              onChange={e => setConfirmado(e.target.checked)}
              className="mt-0.5 accent-amber-500"
            />
            <span className="text-xs text-gray-600 leading-relaxed">
              Entiendo que esta acción generará una transacción irreversible en la
              blockchain y quedará registrada en el historial de auditoría.
            </span>
          </label>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mx-5 mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={!confirmado || guardando || campos.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {guardando ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
            ) : (
              <><Save className="w-4 h-4" /> Guardar en blockchain</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}