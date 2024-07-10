import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { getStoredToken, setStoredToken, removeStoredToken } from '../utils/tokenUtils';
import { Protesta, Cabecilla, Naturaleza, CreateProtestaData, UpdateProtestaData } from '../types';

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

// Protesta API calls
export const getProtestas = (): Promise<AxiosResponse<Protesta[]>> => api.get('/protestas');
export const getProtesta = (id: string): Promise<AxiosResponse<Protesta>> => api.get(`/protestas/${id}`);
export const createProtesta = (data: CreateProtestaData): Promise<AxiosResponse<Protesta>> => api.post('/protestas', data);
export const updateProtesta = (id: string, data: UpdateProtestaData): Promise<AxiosResponse<Protesta>> => api.put(`/protestas/${id}`, data);
export const deleteProtesta = (id: string): Promise<AxiosResponse<void>> => api.delete(`/protestas/${id}`);

// Cabecilla API calls
export const getCabecillas = (): Promise<AxiosResponse<Cabecilla[]>> => api.get('/cabecillas');
export const createCabecilla = (data: Omit<Cabecilla, 'id' | 'creado_por' | 'fecha_creacion' | 'soft_delete'>): Promise<AxiosResponse<Cabecilla>> => api.post('/cabecillas', data);
export const updateCabecilla = (id: string, data: Partial<Omit<Cabecilla, 'id' | 'creado_por' | 'fecha_creacion' | 'soft_delete'>>): Promise<AxiosResponse<Cabecilla>> => api.put(`/cabecillas/${id}`, data);
export const deleteCabecilla = (id: string): Promise<AxiosResponse<void>> => api.delete(`/cabecillas/${id}`);

// Naturaleza API calls
export const getNaturalezas = (): Promise<AxiosResponse<Naturaleza[]>> => api.get('/naturalezas');
export const createNaturaleza = (data: Omit<Naturaleza, 'id' | 'creado_por' | 'fecha_creacion' | 'soft_delete'>): Promise<AxiosResponse<Naturaleza>> => api.post('/naturalezas', data);
export const updateNaturaleza = (id: string, data: Partial<Omit<Naturaleza, 'id' | 'creado_por' | 'fecha_creacion' | 'soft_delete'>>): Promise<AxiosResponse<Naturaleza>> => api.put(`/naturalezas/${id}`, data);
export const deleteNaturaleza = (id: string): Promise<AxiosResponse<void>> => api.delete(`/naturalezas/${id}`);
