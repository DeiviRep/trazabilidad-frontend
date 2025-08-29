// src/components/EventForm.tsx
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

export type EventFormValues = {
  id?: string;
  tipo: 'REGISTRO' | 'EMBARQUE' | 'DESEMBARQUE' | 'NACIONALIZACION' | 'DISTRIBUCION' | 'PRODUCTO_ADQUIRIDO';
  // comunes
  latitud: string;
  longitud: string;

  // Registro
  modelo?: string;
  marca?: string;
  imeiSerial?: string;
  origen?: string;
  uuidLote?: string;

  // Embarque
  tipoTransporte?: string;
  nroContenedor?: string;
  puertoSalida?: string;

  // Desembarque
  puertoExtranjero?: string;
  integridad?: string; // UI string -> backend boolean
  descripcionIntegridad?: string;

  // Nacionalización
  dim?: string;
  valorCIF?: string;
  arancel?: string;
  iva?: string;
  ice?: string;
  totalPagado?: string;

  // Distribución
  comerciante?: string;
  deposito?: string;

  // Producto Adquirido
  tienda?: string;
  fechaCompra?: string; // ISO

  // // Documentos (comentado)
  // documentos?: any[];
  // codigoDocumentos?: Record<string, string>;
  // hashDocumentos?: any[];
};

type Props = {
  defaultValues?: Partial<EventFormValues>;
  onSubmit: (v: EventFormValues) => Promise<void> | void;
  onUseLocation?: () => void;
  mode: 'unitario' | 'lote';
};

export default function EventForm({ defaultValues, onSubmit, onUseLocation, mode }: Props) {
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<EventFormValues>({
    defaultValues: {
      tipo: 'REGISTRO',
      ...defaultValues,
    },
  });

  const tipo = watch('tipo');

  useEffect(() => {
    reset({ tipo: 'REGISTRO', ...defaultValues });
  }, [defaultValues, reset]);

  const labelId = mode === 'unitario' ? 'ID Dispositivo' : 'UUID de Lote';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {/* Selector de evento */}
      <div>
        <label className="block text-xs text-gray-500">Evento</label>
        <select className="w-full rounded-lg border px-3 py-2" {...register('tipo')}>
          <option value="REGISTRO">Registro</option>
          <option value="EMBARQUE">Embarque</option>
          <option value="DESEMBARQUE">Desembarque</option>
          <option value="NACIONALIZACION">Nacionalización</option>
          <option value="DISTRIBUCION">Distribución</option>
          <option value="PRODUCTO_ADQUIRIDO">Producto Adquirido</option>
        </select>
      </div>

      {/* ID / Lote */}
      <div>
        <label className="block text-xs text-gray-500">{labelId}</label>
        <input className="w-full rounded-lg border px-3 py-2" {...register(mode === 'unitario' ? 'id' : 'uuidLote')} />
      </div>

      {/* Campos para REGISTRO */}
      {tipo === 'REGISTRO' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-gray-500">Modelo</label>
            <input className="w-full rounded-lg border px-3 py-2" {...register('modelo')} />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Marca</label>
            <input className="w-full rounded-lg border px-3 py-2" {...register('marca')} />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Imei/Serial</label>
            <input className="w-full rounded-lg border px-3 py-2" {...register('imeiSerial')} />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Origen</label>
            <input className="w-full rounded-lg border px-3 py-2" {...register('origen')} />
          </div>
          {mode === 'unitario' && (
            <div>
              <label className="block text-xs text-gray-500">Lote (opcional)</label>
              <input className="w-full rounded-lg border px-3 py-2" {...register('uuidLote')} placeholder="uuidLote" />
            </div>
          )}
        </div>
      )}

      {/* Campos para EMBARQUE */}
      {tipo === 'EMBARQUE' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs text-gray-500">Tipo de transporte</label>
            <input className="w-full rounded-lg border px-3 py-2" {...register('tipoTransporte')} />
          </div>
          <div>
            <label className="block text-xs text-gray-500">N° Contenedor</label>
            <input className="w-full rounded-lg border px-3 py-2" {...register('nroContenedor')} />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Puerto de salida</label>
            <input className="w-full rounded-lg border px-3 py-2" {...register('puertoSalida')} />
          </div>
        </div>
      )}

      {/* Campos para DESEMBARQUE */}
      {tipo === 'DESEMBARQUE' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs text-gray-500">Puerto extranjero</label>
            <input className="w-full rounded-lg border px-3 py-2" {...register('puertoExtranjero')} />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Integridad (sí/no)</label>
            <input className="w-full rounded-lg border px-3 py-2" {...register('integridad')} placeholder="sí / no" />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Descripción de integridad</label>
            <input className="w-full rounded-lg border px-3 py-2" {...register('descripcionIntegridad')} />
          </div>
        </div>
      )}

      {/* Campos para NACIONALIZACION */}
      {tipo === 'NACIONALIZACION' && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-gray-500">Código DIM (requerido)</label>
              <input className="w-full rounded-lg border px-3 py-2" {...register('dim')} />
            </div>
            <div className="text-xs text-gray-500 pt-6">
              {/* Relacionado con documentos: dejamos el recordatorio sin inputs extras */}
              {/* Ej: cargar PDFs, hashes, etc. (comentado por ahora) */}
              * Relacionado con documentos (solo DIM por ahora).
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            <div>
              <label className="block text-xs text-gray-500">Valor CIF</label>
              <input className="w-full rounded-lg border px-3 py-2" type="number" step="0.01" {...register('valorCIF')} />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Arancel</label>
              <input className="w-full rounded-lg border px-3 py-2" type="number" step="0.01" {...register('arancel')} />
            </div>
            <div>
              <label className="block text-xs text-gray-500">IVA</label>
              <input className="w-full rounded-lg border px-3 py-2" type="number" step="0.01" {...register('iva')} />
            </div>
            <div>
              <label className="block text-xs text-gray-500">ICE</label>
              <input className="w-full rounded-lg border px-3 py-2" type="number" step="0.01" {...register('ice')} />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Total pagado</label>
              <input className="w-full rounded-lg border px-3 py-2" type="number" step="0.01" {...register('totalPagado')} />
            </div>
          </div>
        </>
      )}

      {/* Campos para DISTRIBUCION */}
      {tipo === 'DISTRIBUCION' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-gray-500">Comerciante</label>
            <input className="w-full rounded-lg border px-3 py-2" {...register('comerciante')} />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Depósito</label>
            <input className="w-full rounded-lg border px-3 py-2" {...register('deposito')} />
          </div>
        </div>
      )}

      {/* Campos para PRODUCTO_ADQUIRIDO */}
      {tipo === 'PRODUCTO_ADQUIRIDO' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-gray-500">Tienda</label>
            <input className="w-full rounded-lg border px-3 py-2" {...register('tienda')} />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Fecha de compra (ISO)</label>
            <input className="w-full rounded-lg border px-3 py-2" type="datetime-local" {...register('fechaCompra')} />
          </div>
        </div>
      )}

      {/* Ubicación */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-xs text-gray-500">Latitud</label>
          <input className="w-full rounded-lg border px-3 py-2" {...register('latitud')} />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Longitud</label>
          <input className="w-full rounded-lg border px-3 py-2" {...register('longitud')} />
        </div>
        <div className="flex items-end">
          <button type="button" onClick={onUseLocation} className="w-full rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
            Usar mi ubicación
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800">
          Guardar
        </button>
      </div>
    </form>
  );
}
