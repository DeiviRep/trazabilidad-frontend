'use client';

import { useState } from 'react';

export const useMap = () => {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  const captureBrowserLocation = () =>
    new Promise<{ lat: number; lon: number }>((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolocalización no soportada'));
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setCoords({ lat, lon });
          resolve({ lat, lon });
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });

  return { coords, setCoords, captureBrowserLocation };
};
