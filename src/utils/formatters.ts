export const formatCoords = (ubicacion: string) => {
  if (!ubicacion) return { lat: 0, lon: 0, label: '-' };
  const [lat, lon] = ubicacion.split(',').map(Number);
  return { lat, lon, label: `${lat.toFixed(4)}, ${lon.toFixed(4)}` };
};

export const cls = (...args: (string | false | null | undefined)[]) =>
  args.filter(Boolean).join(' ');
