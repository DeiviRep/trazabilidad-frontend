// src/hooks/useProductoSSE.ts
import { useEffect, useRef } from 'react';

export function useProductoSSE(
  productoId: string,
  onUpdate: (data: any) => void
) {
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!productoId) return;

    const connect = async () => {
      abortRef.current = new AbortController();
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/subscribe/${productoId}`;

      try {
        const response = await fetch(url, {
          signal: abortRef.current.signal,
          headers: {
            'ngrok-skip-browser-warning': 'true',  // ← esto soluciona ngrok
            'Accept': 'text/event-stream',
          },
        });

        if (!response.ok || !response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';  // guarda línea incompleta

          let eventType = '';
          let eventData = '';

for (const line of lines) {
  if (line.startsWith('event: ')) {
    eventType = line.slice(7).trim();
    console.log('SSE event type:', eventType); // ← LOG
  } else if (line.startsWith('data: ')) {
    eventData = line.slice(6).trim();
    console.log('SSE data:', eventData); // ← LOG
  } else if (line === '' && eventType === 'update' && eventData) {
    try {
      const parsed = JSON.parse(eventData);
      console.log('SSE update recibido:', parsed); // ← LOG
      onUpdate(parsed);
    } catch {}
    eventType = '';
    eventData = '';
  }
}
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;  // desconexión intencional
        // reconectar tras 3s si falla
        setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      abortRef.current?.abort();
    };
  }, [productoId]);
}