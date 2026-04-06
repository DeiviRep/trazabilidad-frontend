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
  // CORREGIDO: era 'origenPais', el backend DTO usa 'paisOrigen'
  paisOrigen: string;
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
  blAwb?: string;             // NUEVO: Bill of Lading (maritimo) o Air Waybill (aereo)

  // DESEMBARQUE
  integridad?: boolean;
  descripcionIntegridad?: string;
  documentoTransito?: string; // NUEVO: numero DUS (Chile) o DTI (Peru)

  // NACIONALIZACION
  dim?: string;
  dam?: string;               // NUEVO: numero DAM
  valorCIF?: number;
  totalPagado?: number;
  arancel?: number;
  iva?: number;
  ice?: number;

  // DISTRIBUCION
  comerciante?: string;
  responsable?: string;       // NUEVO: responsable de recepcion

  // ADQUIRIDO
  tienda?: string;            // NUEVO: nombre de la tienda
  fechaCompra?: string;       // ISO
};

export type EventoLotePayload = {
  eventoUrlApi: EventoTipoDtoUrlApi;
  body: EventoPayload[];
};