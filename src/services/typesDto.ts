import { UbicacionTipo } from "@/types/device";

export type EventoTipoDtoUrlApi =
  | 'REGISTRO'
  | 'EMBARQUE'
  | 'DESEMBARQUE'
  | 'NACIONALIZACION'
  | 'DISTRIBUCION'
  | 'ADQUIRIDO';

export type CreateDispositivoDto = {
  id?: string;
  modelo: string;
  marca: string;
  imeiSerial: string;
  origenPais: string;
  latitud: string;
  longitud: string;
  uuidLote?: string;
  puntoControl: string;
};

export type CreateLoteDispositivosDto = {
  uuidLote?: string;
  dispositivos: CreateDispositivoDto[];
};

export type UpdateEventoDto = {
  eventoUrlApi: EventoTipoDtoUrlApi;
  body: EventoPayload;
};

export type EventoPayload = {
  id: string;
  latitud: string;
  longitud: string;
  puntoControl: string;

  // EMBARQUE
  nroContenedor?: string;
  tipoTransporte?: string;

  // DESEMBARQUE
  integridad?: boolean;
  descripcionIntegridad?: string;

  // NACIONALIZACION
  dim?: string;
  valorCIF?: number;   // compatibilidad con chaincode
  totalPagado?: number;
  arancel?: number;
  iva?: number;
  ice?: number;

  // DISTRIBUCION
  comerciante?: string;

  // ADQUIRIDO
  fechaCompra?: string; // ISO
};

export type EventoLotePayload = {
  eventoUrlApi: EventoTipoDtoUrlApi;
  body: EventoPayload[];
};