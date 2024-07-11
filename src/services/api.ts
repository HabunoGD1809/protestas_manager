import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getStoredToken, setStoredToken, removeStoredToken } from '../utils/tokenUtils';
import { Protesta, Cabecilla, Naturaleza, PaginatedResponse } from '../types';

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
          setStoredToken(response.access_token, response.refresh_token);
          api.defaults.headers.common['Authorization'] = `Bearer ${response.access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          removeStoredToken();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        removeStoredToken();
        window.location.href = '/login';
        return Promise.reject(new Error('No hay token de actualización disponible'));
      }
    }
    return Promise.reject(error);
  }
);

export const login = async (email: string, password: string) => {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const response = await api.post('/token', formData.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data;
};

export const register = async (userData: FormData) => {
  const response = await api.post('/registro', userData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const refreshToken = async (refreshToken: string) => {
  const response = await api.post('/token/renovar', { refresh_token: refreshToken });
  return response.data;
};

export const logout = () => {
  removeStoredToken();
};

export const obtenerUsuarioActual = async () => {
  const response = await api.get('/usuarios/me');
  return response.data;
};

export const protestaService = {
  getAll: (page: number = 1, pageSize: number = 10) => 
    api.get<PaginatedResponse<Protesta>>(`/protestas?page=${page}&page_size=${pageSize}`),
  getById: (id: string) => api.get<Protesta>(`/protestas/${id}`),
  create: (protesta: Omit<Protesta, 'id'>) => api.post<Protesta>('/protestas', protesta),
  update: (id: string, protesta: Omit<Protesta, 'id'>) => api.put<Protesta>(`/protestas/${id}`, protesta),
  delete: (id: string) => api.delete(`/protestas/${id}`),
};

export const cabecillaService = {
  getAll: () => api.get<Cabecilla[]>('/cabecillas'),
  getById: (id: string) => api.get<Cabecilla>(`/cabecillas/${id}`),
  create: (cabecilla: Omit<Cabecilla, 'id'>) => api.post<Cabecilla>('/cabecillas', cabecilla),
  update: (id: string, cabecilla: Omit<Cabecilla, 'id'>) => api.put<Cabecilla>(`/cabecillas/${id}`, cabecilla),
  delete: (id: string) => api.delete(`/cabecillas/${id}`),
};

export const naturalezaService = {
  getAll: () => api.get<Naturaleza[]>('/naturalezas'),
  getById: (id: string) => api.get<Naturaleza>(`/naturalezas/${id}`),
  create: (naturaleza: Omit<Naturaleza, 'id'>) => api.post<Naturaleza>('/naturalezas', naturaleza),
  update: (id: string, naturaleza: Omit<Naturaleza, 'id'>) => api.put<Naturaleza>(`/naturalezas/${id}`, naturaleza),
  delete: (id: string) => api.delete(`/naturalezas/${id}`),
};
