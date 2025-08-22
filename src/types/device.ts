// src/types/device.ts

export type EventoTipo =
  | 'REGISTRO'
  | 'EMBARQUE'
  | 'DESEMBARQUE'
  | 'NACIONALIZACION'
  | 'DISTRIBUCION'
  | 'PRODUCTO_ADQUIRIDO';

export type Dispositivo = {
  id: string;
  modelo: string;
  marca: string;

  // Campos base
  origen: string;                 // mapea a origenPais en backend
  ubicacion: UbicacionTipo;              // "-17.6,-63.1"
  evento: EventoTipo;
  timestamp: string;              // ISO

  // Lote
  uuidLote?: string;                // mapea a uuidLote
  urlLote?: string;

  // Auditoría opcional
  actor?: string;
  rol?: string;

  // Documentos (mostrar pero no usar salvo DIM en Nacionalización)
  documentos?: any[];             // (comentado en UI; placeholder)
  codigoDocumentos?: Record<string, string>;
  hashDocumentos?: any[];

  // QR
  qrCodeId?: string;
};

export type UbicacionTipo = {
  lat: number;
  lon: number;
}

export type HistorialItem = Dispositivo;
