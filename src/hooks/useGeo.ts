'use client';

import { useEffect, useState } from 'react';

export function useGeo(auto = false) {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [error, setError] = useState<string|null>(null);

  const request = () => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setError(null);
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    if (auto) request();
  }, [auto]);

  return { coords, error, request };
}
