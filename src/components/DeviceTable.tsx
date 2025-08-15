'use client';

import { Dispositivo } from '@/types/device';
import { formatCoords } from '@/utils/formatters';

type Props = {
  data: Dispositivo[];
  onSelect?: (d: Dispositivo) => void;
  onGenerateQR?: (id: string) => void;
};

export default function DeviceTable({ data, onSelect, onGenerateQR }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="px-4 py-2">ID</th>
            <th className="px-4 py-2">Modelo</th>
            <th className="px-4 py-2">Marca</th>
            <th className="px-4 py-2">Evento</th>
            <th className="px-4 py-2">Ubicación</th>
            <th className="px-4 py-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => {
            const c = formatCoords(d.ubicacion);
            return (
              <tr key={d.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 font-mono">{d.id}</td>
                <td className="px-4 py-2">{d.modelo}</td>
                <td className="px-4 py-2">{d.marca}</td>
                <td className="px-4 py-2">{d.evento}</td>
                <td className="px-4 py-2">{c.label}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      className="rounded-lg border px-3 py-1 text-xs hover:bg-gray-100"
                      onClick={() => onSelect?.(d)}
                    >
                      Ver / Editar
                    </button>
                    <button
                      className="rounded-lg border px-3 py-1 text-xs hover:bg-gray-100"
                      onClick={() => onGenerateQR?.(d.id)}
                    >
                      QR
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {data.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>Sin dispositivos</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
