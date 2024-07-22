import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getStoredToken, setStoredToken, removeStoredToken } from '../utils/tokenUtils';
import { Protesta, Cabecilla, Naturaleza, Provincia, PaginatedResponse, CrearProtesta, CrearCabecilla, CrearNaturaleza, ResumenPrincipal, User, Token, UserListResponse } from '../types';

const BASE_URL = 'http://localhost:8000'; 

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshTokenValue = getStoredToken('refreshToken');
      if (refreshTokenValue) {
        try {
          const response = await refreshToken(refreshTokenValue);
          setStoredToken(response.token_acceso, response.token_actualizacion);
          api.defaults.headers.common['Authorization'] = `Bearer ${response.token_acceso}`;
          return api(originalRequest);
        } catch (refreshError) {
          removeStoredToken();
          window.dispatchEvent(new CustomEvent('auth-error', { detail: 'Session expired' }));
          return Promise.reject(new Error('Session expired'));
        }
      } else {
        removeStoredToken();
        window.dispatchEvent(new CustomEvent('auth-error', { detail: 'No refresh token available' }));
        return Promise.reject(new Error('No refresh token available'));
      }
    }
    return Promise.reject(error);
  }
);

export const login = async (email: string, password: string) => {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const response = await api.post<Token>('/token', formData.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data;
};

export const register = async (userData: FormData) => {
  const response = await api.post<User>('/registro', userData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const refreshToken = async (refreshToken: string) => {
  const response = await api.post<Token>('/token/renovar', { refresh_token: refreshToken });
  return response.data;
};

export const logout = () => {
  removeStoredToken();
};

export const obtenerUsuarioActual = async () => {
  const response = await api.get<User>('/usuarios/me');
  return response.data;
};

export const protestaService = {
  getAll: async (page: number = 1, pageSize: number = 10, filters?: Record<string, string>) => {
    const response = await api.get<PaginatedResponse<Protesta>>('/protestas', { 
      params: { 
        page, 
        page_size: pageSize, 
        ...filters 
      } 
    });
    return response.data;
  },
  getById: (id: string) => api.get<Protesta>(`/protestas/${id}`).then(res => res.data),
  create: (protesta: CrearProtesta) => api.post<Protesta>('/protestas', protesta).then(res => res.data),
  update: (id: string, protesta: CrearProtesta) => api.put<Protesta>(`/protestas/${id}`, protesta).then(res => res.data),
  delete: (id: string) => api.delete(`/protestas/${id}`).then(res => res.data),
};

export const cabecillaService = {
  getAll: async (page: number = 1, pageSize: number = 10, filters?: Record<string, string>) => {
    const response = await api.get<PaginatedResponse<Cabecilla>>('/cabecillas', { 
      params: { 
        page, 
        page_size: pageSize, 
        ...filters 
      } 
    });
    return response.data;
  },
  getById: (id: string) => api.get<Cabecilla>(`/cabecillas/${id}`).then(res => res.data),
  create: (cabecilla: CrearCabecilla) => api.post<Cabecilla>('/cabecillas', cabecilla).then(res => res.data),
  update: (id: string, cabecilla: CrearCabecilla) => api.put<Cabecilla>(`/cabecillas/${id}`, cabecilla).then(res => res.data),
  delete: (id: string) => api.delete(`/cabecillas/${id}`).then(res => res.data),
  updateFoto: (id: string, foto: File) => {
    const formData = new FormData();
    formData.append('foto', foto);
    return api.post<Cabecilla>(`/cabecillas/${id}/foto`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data);
  },
};

export const naturalezaService = {
  getAll: async (page: number = 1, pageSize: number = 10, filters?: Record<string, string>) => {
    const response = await api.get<PaginatedResponse<Naturaleza>>('/naturalezas', { 
      params: { 
        page, 
        page_size: pageSize, 
        ...filters 
      } 
    });
    return response.data;
  },
  getById: (id: string) => api.get<Naturaleza>(`/naturalezas/${id}`).then(res => res.data),
  create: (naturaleza: CrearNaturaleza) => api.post<Naturaleza>('/naturalezas', naturaleza).then(res => res.data),
  update: (id: string, naturaleza: CrearNaturaleza) => api.put<Naturaleza>(`/naturalezas/${id}`, naturaleza).then(res => res.data),
  delete: (id: string) => api.delete(`/naturalezas/${id}`).then(res => res.data),
};

export const provinciaService = {
  getAll: () => api.get<Provincia[]>('/provincias').then(res => res.data),
  getById: (id: string) => api.get<Provincia>(`/provincias/${id}`).then(res => res.data),
};

export const resumenService = {
  getPaginaPrincipal: async () => {
    try {
      const response = await api.get<ResumenPrincipal>('/pagina-principal');
      console.log('Respuesta de la API:', response.data); 
      return response.data;
    } catch (error) {
      console.error('Error al obtener el resumen principal:', error);
      throw error;
    } 
  },
};

export const userService = {
  getAll: async (page: number = 1, pageSize: number = 10) => {
    const response = await api.get<UserListResponse>('/usuarios', { 
      params: { page, page_size: pageSize } 
    });
    return response.data;
  },
  getById: (id: string) => api.get<User>(`/usuarios/${id}`).then(res => res.data),
  updateRole: (id: string, role: 'admin' | 'usuario') => 
    api.put<User>(`/usuarios/${id}/rol`, { nuevo_rol: role }).then(res => res.data),
};
