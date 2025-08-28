export type EstadoEvento = 'REGISTRADO' | 'EMBARCADO' | 'DESEMBARCADO' | 'NACIONALIZADO' | 'EN_DISTRIBUCION' | 'PRODUCTO_ADQUIRIDO';
export type RolUsuario = 'proveedor' | 'transportista' | 'aduana_extranjera' | 'aduana_bolivia' | 'importador' | 'comerciante';
export type ColorVariant = 'bg' | 'text' | 'border' | 'hover' | 'ring';
export type ColorName = 'blue' | 'orange' | 'cyan' | 'green' | 'purple' | 'pink';

export interface Producto {
  id: number;
  imei: string;
  serie: string;
}

export interface Evento {
  tipo: EstadoEvento;
  fecha: string;
  punto: string;
  coordenadas: [number, number];
  contenedor?: string;
  dim?: string;
  valorCIF?: number;
  totalPagado?: number;
}

export interface Lote {
  id: string;
  lote: string;
  marca: string;
  modelo: string;
  cantidadProductos: number;
  estado: EstadoEvento;
  url: string;
  fechaCreacion: string;
  productos: Producto[];
  eventos: Evento[];
}

export interface EtapaConfig {
  titulo: string;
  estado: EstadoEvento;
  color: ColorName;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  descripcion: string;
}

export interface Usuario {
  nombre: string;
  rol: string;
  empresa: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

export interface Stat {
  label: string;
  valor: string;
  icono: React.ComponentType<{ className?: string }>;
  color: string;
}

export interface ScanResult {
  codigo: string;
  producto: Lote;
  valido: boolean;
}

export interface FormData {
  marca: string;
  modelo: string;
  cantidadProductos: number;
  puntoControl: string;
  proveedor: string;
  paisOrigen: string;
  coordenadas: { lat: string; lon: string };
}

export interface EventFormData {
  punto: string;
  latitud: string;
  longitud: string;
  contenedor: string;
  tipoTransporte: string;
  dim: string;
  valorCIF: string;
  totalPagado: string;
}