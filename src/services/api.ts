// src/services/api.ts
'use client';

import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { delay } from '@/utils/formatters';
import { EventoLotePayload, EventoUnitarioPayload, RegistroLotePayload, RegistroUnitPayload } from './typesDto';
import { Dispositivo, EventoTipo } from '@/types/device';

const MIN_DELAY_MS = 500;

export async function withLoadingDelay<T>(apiCall: Promise<T>) {
  const [result] = await Promise.all([apiCall, delay(MIN_DELAY_MS)]);
  return result;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
  withCredentials: false,
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
  registroUnitario: async (payload: RegistroUnitPayload) => {
    try {
      
      const { data } = await withLoadingDelay(api.post('/trazabilidad/registro', payload));
      return data;
    } catch (error) {
      throw handleApiError(error, 'Error al registrar');
    }
  },
  registroLote: async (payload: RegistroLotePayload) => {
    console.log(payload)
    try {
      const { data } = await withLoadingDelay(api.post('/trazabilidad/registro/lote', payload));
      return data;
    } catch (error) {
      throw handleApiError(error, 'Error al registrar lote');
    }
  },

  /* Eventos unitarios (todos llaman a actualizar en backend/chaincode) */
  eventoUnitario: async <E extends EventoTipo>(payload: EventoUnitarioPayload<E>) => {
    try {
      const { data } = await withLoadingDelay(api.post(`/trazabilidad/${payload.tipo.toLowerCase()}`, payload));
      return data;
    } catch (error) {
      throw handleApiError(error, `Error en evento ${payload.tipo}`);
    }
  },

  /* Eventos por lote */
  eventoLote: async <E extends EventoTipo>(payload: EventoLotePayload<E>) => {
    console.log(payload)
    try {
      const { data } = await withLoadingDelay(api.post(`/trazabilidad/${payload.tipo.toLowerCase()}/lote`, payload));
      return data;
    } catch (error) {
      throw handleApiError(error, `Error en evento por lote ${payload.tipo}`);
    }
  },

  /* Consultas */
  listar: async (): Promise<Dispositivo[]> => {
    try {
      const { data } = await api.get('/trazabilidad/listar');
      return data;
    } catch (error) {
      throw handleApiError(error, 'Error al listar trazabilidades');
    }
  },
  consultar: async (id: string): Promise<Dispositivo> => {
    try {
      const { data } = await api.get(`/trazabilidad/consultar/${id}`);
      return data;
    } catch (error) {
      throw handleApiError(error, `Error al consultar ${id}`);
    }
  },
  historial: async (id: string) => {
    try {
      const { data } = await api.get(`/trazabilidad/historial/${id}`);
      return data;
    } catch (error) {
      throw handleApiError(error, `Error al historial ${id}`);
    }
  },
  listarPorLote: async (uuidLote: string): Promise<Dispositivo[]> => {
    try {
      const { data } = await api.get(`/trazabilidad/lote/${uuidLote}`);
      return data;
    } catch (error) {
      throw handleApiError(error, `Error al listar por lote ${uuidLote}`);
    }
  },

  /* QR (se mantienen como están) */
  generarQR: async (id: string): Promise<{ qrUrl: string }> => {
    try {
      const { data } = await api.get(`/trazabilidad/qr/${id}`);
      toast.success('QR generado', {
        description: 'El código QR se creó exitosamente',
        position: 'bottom-right',
      });
      return data;
    } catch (error) {
      throw handleApiError(error, `Error al generar QR para ID ${id}`);
    }
  },
  generarQRLote: async (uuidLote: string): Promise<{ qrUrl: string }> => {
    try {
      const { data } = await withLoadingDelay(api.get(`/trazabilidad/qr/lote/${uuidLote}`));
      return data;
    } catch (error) {
      throw handleApiError(error, `Error al generar QR de lote ${uuidLote}`);
    }
  },
};

export default api;
