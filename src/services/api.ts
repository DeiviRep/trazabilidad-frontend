// src/services/api.ts
'use client';

import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { delay } from '@/utils/formatters';
import { CreateDispositivoDto, CreateLoteDispositivosDto, EventoLotePayload, UpdateEventoDto} from './typesDto';

const MIN_DELAY_MS = 500;

export async function withLoadingDelay<T>(apiCall: Promise<T>) {
  const [result] = await Promise.all([apiCall, delay(MIN_DELAY_MS)]);
  return result;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.config.method !== 'get') {
      toast.success('Operación exitosa', {
        description: 'La acción se completó correctamente',
        position: 'bottom-right',
      });
    }
    return response;
  },
  (error: AxiosError) => {
    let errorMessage = 'Ocurrió un error inesperado';
    if (error.response) {
      errorMessage = (error.response.data as any)?.message || errorMessage;
      toast.error('Error', { description: errorMessage, position: 'bottom-right' });
    } else if (error.request) {
      toast.error('Error de conexión', {
        description: 'No se pudo conectar con el servidor',
        position: 'bottom-right',
      });
    } else {
      toast.error('Error', { description: 'Error al configurar la solicitud', position: 'bottom-right' });
    }
    return Promise.reject(error);
  }
);

export type ApiError = {
  message: string;
  statusCode?: number;
  details?: any;
};

function handleApiError(error: unknown, defaultMessage: string): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    return {
      message: (axiosError.response?.data as any)?.message || defaultMessage,
      statusCode: axiosError.response?.status,
      details: axiosError.response?.data,
    };
  }
  if (error instanceof Error) return { message: error.message || defaultMessage };
  return { message: defaultMessage };
}

/* ============ AUTH ============ */
export const AuthAPI = {
  login: async (email: string, password: string): Promise<{ access_token: string; user: any }> => {
    try {
      const response = await withLoadingDelay(api.post('/auth/login', { email, password }));
      toast.success('Bienvenido', { description: 'Inicio de sesión exitoso', position: 'bottom-right' });
      return { user: response.data.user, access_token: response.data.token };
    } catch (error) {
      throw handleApiError(error, 'Error durante el inicio de sesión');
    }
  },
  me: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};

/* ============ TRAZABILIDAD API ============ */
export const TrazabilidadAPI = {
  /* Registro */
  registroUnitario: async (payload: CreateDispositivoDto)=> {
    try {
      const rutaApi = '/trazabilidad/registro'
      const { data } = await withLoadingDelay(api.post(rutaApi, payload));
      console.log(rutaApi)
      console.log(`Datos Registro: ${data}`)
      return data;
    } catch (error) {
      throw handleApiError(error, 'Error al registrar');
    }
  },
  registroLote: async (payload: CreateLoteDispositivosDto) => {
    try {
      const rutaApi = '/trazabilidad/registro/lote'
      const { data } = await withLoadingDelay(api.post(rutaApi, payload));
      console.log(rutaApi)
      console.log(`Datos Registro Lote: ${data}`)
      return data;
    } catch (error) {
      throw handleApiError(error, 'Error al registrar lote');
    }
  },

  /* Eventos unitarios (todos llaman a actualizar en backend/chaincode) */
  eventoUnitario: async (payload: UpdateEventoDto) => {
    try {
      const rutaApi = `/trazabilidad/${payload.eventoUrlApi.toLowerCase()}`
      const { data } = await withLoadingDelay(api.post(rutaApi, payload.body));
      console.log(rutaApi)
      console.log(`Datos evento unitario ${payload.eventoUrlApi}: ${data}`)
      return data;
    } catch (error) {
      throw handleApiError(error, `Error en evento ${payload.eventoUrlApi}`);
    }
  },

  /* Eventos por lote */
  eventoLote: async (payload: EventoLotePayload) => {
    try {
      const rutaApi = `/trazabilidad/${payload.eventoUrlApi.toLowerCase()}/lote`
      const { data } = await withLoadingDelay(api.post(rutaApi, {dispositivos: payload.body}));
      console.log(rutaApi)
      console.log(`Datos evento lote ${payload.eventoUrlApi}: ${data}`)
      return data;
    } catch (error) {
      throw handleApiError(error, `Error en evento por lote ${payload.eventoUrlApi}`);
    }
  },

  /* Consultas */
  listarProductos: async () => {
    try {
      const rutaApi = '/trazabilidad/listar'
      const { data } = await api.get(rutaApi);
      console.log(rutaApi)
      console.log(`Listar: ${data}`)
      return data;
    } catch (error) {
      throw handleApiError(error, 'Error al listar trazabilidades');
    }
  },
  consultar: async (id: string) => {
    try {
      const rutaApi = `/trazabilidad/consultar/${id}`
      const { data } = await api.get(rutaApi);
      console.log(rutaApi)
      console.log(`Consultar: ${data}`)
      return data;
    } catch (error) {
      throw handleApiError(error, `Error al consultar ${id}`);
    }
  },
  historial: async (id: string) => {
    try {
      const rutaApi = `/trazabilidad/historial/${id}`
      const { data } = await api.get(rutaApi);
      console.log(rutaApi)
      console.log(`Historial: ${data}`)
      return data;
    } catch (error) {
      throw handleApiError(error, `Error al historial ${id}`);
    }
  },
  listarPorLote: async (uuidLote: string) => {
    try {
      const rutaApi = `/trazabilidad/lote/${uuidLote}`
      const { data } = await api.get(rutaApi);
      console.log(rutaApi)
      console.log(`Listar Por Lote: ${data}`)
      return data;
    } catch (error) {
      throw handleApiError(error, `Error al listar por lote ${uuidLote}`);
    }
  },

  listarResumenLotes: async () => {
    try {
      const rutaApi = `/trazabilidad/resumen-lotes`
      const { data } = await api.get(rutaApi);
      console.log(rutaApi)
      console.log(`Listar Por Lote: ${data}`)
      return data;
    } catch (error) {
      throw handleApiError(error, `Error al listar por lotes`);
    }
  },

  listarPorEstado: async () => {
    try {
      const rutaApi = '/trazabilidad/listar/estadistica'
      const { data } = await api.get(rutaApi);
      console.log(rutaApi)
      console.log(`Listar Por estados: ${data}`)
      return data;
    } catch (error) {
      throw handleApiError(error, 'Error al listar trazabilidades');
    }
  },

  /* QR (se mantienen como están) */
  generarQR: async (id: string) => {
    try {
      const rutaApi = `/trazabilidad/qr/${id}`
      const { data } = await api.get(rutaApi);
      console.log(rutaApi)
      console.log(`Genero QR: ${data}`)
      toast.success('QR generado', {
        description: 'El código QR se creó exitosamente',
        position: 'bottom-right',
      });
      return data;
    } catch (error) {
      throw handleApiError(error, `Error al generar QR para ID ${id}`);
    }
  },

//TODO: NUEVOS METODOS
  buscar: async (params: Record<string, string | undefined>) => {
    const query = new URLSearchParams(params as any).toString();
    const { data } = await api.get(`/trazabilidad/buscar?${query}`);
    return data;
  },

  buscarPorQR: async (codigo: string) => {
    const { data } = await api.get(`/trazabilidad/buscar-qr/${codigo}`);
    return data;
  },

  obtenerEstadisticas: async () => {
    const { data } = await api.get('/trazabilidad/estadisticas');
    return data;
  },

  verificarIntegridad: async (productoId: string) => {
    const { data } = await api.get(`/trazabilidad/integridad/${productoId}`);
    return data;
  },

  auditarLote: async (uuidLote: string) => {
    const { data } = await api.get(`/trazabilidad/auditoria/lote/${uuidLote}`);
    return data;
  },

  descargarQRImagen: async (id: string) => {
    const { data } = await api.get(`/trazabilidad/qr-image/${id}`, { responseType: 'blob' });
    return URL.createObjectURL(data); // útil para <img src="..." />
  },

  obtenerQRBase64: async (id: string) => {
    const { data } = await api.get(`/trazabilidad/qr-base64/${id}`);
    return data;
  },
  actualizarCampoEvento: async (
    productoId: string,
    indexEvento: number,
    campos: Record<string, any>,
  ) => {
    try {
      const { data } = await withLoadingDelay(
        api.patch('/trazabilidad/evento/campo', { productoId, indexEvento, campos })
      );
      return data;
    } catch (error) {
      throw handleApiError(error, 'Error al actualizar campo del evento');
    }
  },
};

export default api;
