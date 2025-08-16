'use client';

import { useEffect } from 'react'; // 👈 Importa useEffect
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  id: z.string().optional(),
  modelo: z.string().min(1, 'El modelo es requerido'),
  marca: z.string().min(1, 'La marca es requerida'),
  origen: z.string().min(1, 'El origen es requerido'),
  latitud: z.string().min(1, 'La latitud es requerida'),
  longitud: z.string().min(1, 'La longitud es requerida'),
  evento: z.enum(['Registro', 'Embarque', 'Desembarque', 'Nacionalización', 'Distribución', 'Recepción', 'Entrega']),
});

export type DeviceFormValues = z.infer<typeof schema>;

type Props = {
  defaultValues?: Partial<DeviceFormValues>;
  onSubmit: (values: DeviceFormValues) => Promise<void> | void;
  onUseLocation?: () => void;
};

export default function DeviceForm({ defaultValues, onSubmit, onUseLocation }: Props) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<DeviceFormValues>({ // 👈 Obtenemos reset
    resolver: zodResolver(schema),
    defaultValues: {
      evento: 'Registro',
      ...defaultValues,
    },
  });

  // 👈 Usamos useEffect para actualizar el formulario si cambian los valores
  useEffect(() => {
    reset({
      evento: 'Registro',
      ...defaultValues,
    });
  }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-gray-500">ID (opcional)</label>
          <input className="w-full rounded-lg border px-3 py-2" {...register('id')} placeholder="uuid o personalizado" />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Modelo</label>
          <input className="w-full rounded-lg border px-3 py-2" {...register('modelo')} />
          {errors.modelo && <p className="text-xs text-red-600">{errors.modelo.message}</p>}
        </div>
        <div>
          <label className="block text-xs text-gray-500">Marca</label>
          <input className="w-full rounded-lg border px-3 py-2" {...register('marca')} />
          {errors.marca && <p className="text-xs text-red-600">{errors.marca.message}</p>}
        </div>
        <div>
          <label className="block text-xs text-gray-500">Origen</label>
          <input className="w-full rounded-lg border px-3 py-2" {...register('origen')} />
          {errors.origen && <p className="text-xs text-red-600">{errors.origen.message}</p>}
        </div>
        <div>
          <label className="block text-xs text-gray-500">Latitud</label>
          <input className="w-full rounded-lg border px-3 py-2" {...register('latitud')} />
          {errors.latitud && <p className="text-xs text-red-600">{errors.latitud.message}</p>}
        </div>
        <div>
          <label className="block text-xs text-gray-500">Longitud</label>
          <input className="w-full rounded-lg border px-3 py-2" {...register('longitud')} />
          {errors.longitud && <p className="text-xs text-red-600">{errors.longitud.message}</p>}
        </div>
        <div>
          <label className="block text-xs text-gray-500">Evento</label>
          <select className="w-full rounded-lg border px-3 py-2" {...register('evento')}>
            <option>Registro</option>
            <option>Embarque</option>
            <option>Desembarque</option>
            <option>Nacionalización</option>
            <option>Distribución</option>
            <option>Recepción</option>
            <option>Entrega</option>
          </select>
          {errors.evento && <p className="text-xs text-red-600">{errors.evento.message}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={onUseLocation} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
          Usar mi ubicación
        </button>
        <button type="submit" className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800">
          Guardar
        </button>
      </div>
    </form>
  );
}