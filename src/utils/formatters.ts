import { UbicacionTipo } from "@/types/device";

export const formatCoords = (ubicacion: UbicacionTipo) => {
  if (!ubicacion) return { lat: 0, lon: 0, label: '-' };
  const lat = ubicacion.lat;
  const lon = ubicacion.lon;
  return { lat, lon, label: `${lat.toFixed(4)}, ${lon.toFixed(4)}` };
};

export const cls = (...args: (string | false | null | undefined)[]) =>
  args.filter(Boolean).join(' ');

export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
