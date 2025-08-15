import { UserType } from '@/context/AuthContext';
import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
  withCredentials: false
});

// Adjunta JWT (si existe)
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const AuthAPI = {
  login: async (correo: string, password: string) => {
    // Ajusta si tu backend usa otro campo (email vs correo)
    const { data } = await api.post('/auth/login', { correo, password });
    return data as { access_token: string; user: UserType };
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
  codigoDocumentos?: Record<string,string>;
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
  codigoDocumentos?: Record<string,string>;
  hashDocumentos?: any[];
  urlPublica?: string;
  forceUpdate?: boolean;
};

export const TrazabilidadAPI = {
  registrar: async (payload: RegistrarPayload) => {
    const { data } = await api.post('/trazabilidad/registrar', payload);
    return data;
  },
  actualizar: async (payload: ActualizarPayload) => {
    const { data } = await api.post('/trazabilidad/actualizar', payload);
    return data;
  },
  listar: async () => {
    const { data } = await api.get('/trazabilidad/listar');
    return data;
  },
  consultar: async (id: string) => {
    const { data } = await api.get(`/trazabilidad/consultar/${id}`);
    return data;
  },
  historial: async (id: string) => {
    const { data } = await api.get(`/trazabilidad/historial/${id}`);
    return data;
  },
  listarPorLote: async (loteId: string) => {
    const { data } = await api.get(`/trazabilidad/por-lote/${loteId}`);
    return data;
  },
  generarQR: async (id: string) => {
    const { data } = await api.get(`/trazabilidad/qr/${id}`);
    return data as { qrUrl: string };
  }
};

export default api;
