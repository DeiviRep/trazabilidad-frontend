import { UserType } from '@/context/AuthContext';
import { delay } from '@/utils/formatters';
import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'sonner';

const MIN_DELAY_MS = 500;

export async function withLoadingDelay<T>(apiCall: Promise<T>){
  const [result] = await Promise.all([
    apiCall,
    delay(MIN_DELAY_MS)
  ]);
  return result;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
  withCredentials: false
});

// Adjunta JWT (si existe)
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  console.log('token: ',token)
  return config;
});

// Interceptor para manejar errores globales
api.interceptors.response.use(
  (response) => {
    // Mostrar notificación solo para métodos no-GET
    if (response.config.method !== 'get') {
      toast.success('Operación exitosa', {
        description: 'La acción se completó correctamente',
        position: 'top-right',
      });
    }
    return response;
  },
  (error: AxiosError) => {
    let errorMessage = 'Ocurrió un error inesperado';
    
    if (error.response) {
      errorMessage = (error.response.data as any)?.message || errorMessage;
      toast.error('Error', {
        description: errorMessage,
        position: 'top-right',
      });
    } else if (error.request) {
      toast.error('Error de conexión', {
        description: 'No se pudo conectar con el servidor',
        position: 'top-right',
      });
    } else {
      toast.error('Error', {
        description: 'Error al configurar la solicitud',
        position: 'top-right',
      });
    }
    
    return Promise.reject(error);
  }
);

export type ApiError = {
  message: string;
  statusCode?: number;
  details?: any;
};

export const AuthAPI = {
  login: async (correo: string, password: string): Promise<{ access_token: string; user: UserType }> => {
    try {
      const response = await api.post('/auth/login', { correo, password });
      toast.success('Bienvenido', {
        description: 'Inicio de sesión exitoso',
        position: 'top-right',
      });
      return {user: response.data.user, access_token: response.data.token};
    } catch (error) {
      throw handleApiError(error, 'Error durante el inicio de sesión');
    }
  },
};

export type RegistrarPayload = {
  id?: string;
  modelo: string;
  marca: string;
  origen: string;
  latitud: string;
  longitud: string;
  evento: string;
  loteId?: string;
  documentos?: any[];
  codigoDocumentos?: Record<string, string>;
  hashDocumentos?: any[];
  urlPublica?: string;
};

export type ActualizarPayload = {
  id: string;
  modelo?: string;
  marca?: string;
  origen?: string;
  latitud: string;
  longitud: string;
  evento: string;
  documentos?: any[];
  codigoDocumentos?: Record<string, string>;
  hashDocumentos?: any[];
  urlPublica?: string;
  forceUpdate?: boolean;
};

export const TrazabilidadAPI = {
  registrar: async (payload: RegistrarPayload): Promise<any> => {
    try {
      const response = await api.post('/trazabilidad/registrar', payload);
      toast.success('Registro creado', {
        description: 'Los datos se guardaron correctamente',
        position: 'top-right',
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Error al registrar trazabilidad');
    }
  },

  actualizar: async (payload: ActualizarPayload): Promise<any> => {
    try {
      const response = await api.post('/trazabilidad/actualizar', payload);
      toast.success('Actualización exitosa', {
        description: 'Los cambios se guardaron correctamente',
        position: 'top-right',
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Error al actualizar trazabilidad');
    }
  },

  // Métodos GET (no muestran toast por defecto)
  listar: async (): Promise<any> => {
    try {
      const { data } = await api.get('/trazabilidad/listar');
      return data;
    } catch (error) {
      throw handleApiError(error, 'Error al listar trazabilidades');
    }
  },

  consultar: async (id: string): Promise<any> => {
    try {
      const { data } = await api.get(`/trazabilidad/consultar/${id}`);
      return data;
    } catch (error) {
      throw handleApiError(error, `Error al consultar trazabilidad con ID ${id}`);
    }
  },

  historial: async (id: string): Promise<any> => {
    try {
      const { data } = await api.get(`/trazabilidad/historial/${id}`);
      return data;
    } catch (error) {
      throw handleApiError(error, `Error al obtener historial para ID ${id}`);
    }
  },

  listarPorLote: async (loteId: string): Promise<any> => {
    try {
      const { data } = await api.get(`/trazabilidad/por-lote/${loteId}`);
      return data;
    } catch (error) {
      throw handleApiError(error, `Error al listar trazabilidades por lote ${loteId}`);
    }
  },

  generarQR: async (id: string): Promise<{ qrUrl: string }> => {
    try {
      const { data } = await api.get(`/trazabilidad/qr/${id}`);
      toast.success('QR generado', {
        description: 'El código QR se creó exitosamente',
        position: 'top-right',
      });
      return data;
    } catch (error) {
      throw handleApiError(error, `Error al generar QR para ID ${id}`);
    }
  }
};

function handleApiError(error: unknown, defaultMessage: string): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    return {
      message: (axiosError.response?.data as any)?.message || defaultMessage,
      statusCode: axiosError.response?.status,
      details: axiosError.response?.data
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message || defaultMessage
    };
  }

  return {
    message: defaultMessage
  };
}

export default api;