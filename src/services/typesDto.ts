/* ============ TRAZABILIDAD DTOs ============ */

import { EventoTipo } from "@/types/device";

/** Registro (unitario y lote) */
export type RegistroUnitPayload = {
  id?: string;
  modelo: string;
  marca: string;
  imeiSerial: string;
  origenPais: string;
  latitud: string;
  longitud: string;
  uuidLote?: string; // uuidLote
};

export type RegistroLotePayload = {
  uuidLote: string;
  urlLote?: string; // se puede mandar desde FE si lo generas acá; backend también puede generarlo
  dispositivos: Array<{
    id?: string;
    modelo: string;
    marca: string;
    imeiSerial: string;
    origenPais: string;
    latitud: string;
    longitud: string;
  }>;
};

/** Eventos (unitario y lote) */
export type EventoUnitarioPayload<E extends EventoTipo> = {
  id: string;
  tipo: E;
  latitud: string;
  longitud: string;
  // Campos específicos por evento (opcionalmente presentes según E)
  tipoTransporte?: string;
  nroContenedor?: string;
  puertoSalida?: string;

  puertoExtranjero?: string;
  integridad?: boolean;
  descripcionIntegridad?: string;

  dim?: string;            // Nacionalización
  valorCif?: number;
  arancel?: number;
  iva?: number;
  ice?: number;
  totalPagado?: number;

  comerciante?: string;    // Distribución
  deposito?: string;

  tienda?: string;         // Producto Adquirido
  fechaCompra?: string;    // ISO
};

export type EventoLotePayload<E extends EventoTipo> = {
  uuidLote: string;
  tipo: E;
  latitud: string;
  longitud: string;
  // mismos específicos que unitario (aplican al lote completo)
  tipoTransporte?: string;
  nroContenedor?: string;
  puertoSalida?: string;
  puertoExtranjero?: string;
  integridad?: boolean;
  descripcionIntegridad?: string;
  dim?: string;
  valorCif?: number;
  arancel?: number;
  iva?: number;
  ice?: number;
  totalPagado?: number;
  comerciante?: string;
  deposito?: string;
  tienda?: string;
  fechaCompra?: string;
};