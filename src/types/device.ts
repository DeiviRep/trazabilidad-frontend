export type Dispositivo = {
  id: string;
  modelo: string;
  marca: string;
  origen: string;
  ubicacion: string;  // "-17.6,-63.1"
  evento: string;
  loteId?: string;
  actor?: string;
  rol?: string;
  documentos?: any[];
  codigoDocumentos?: Record<string, string>;
  hashDocumentos?: any[];
  urlPublica?: string;
  timestamp: string;  // ISO
  qrCodeId?: string;
};

export type HistorialItem = Dispositivo;
