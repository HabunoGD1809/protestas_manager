import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getStoredToken, setStoredToken, removeStoredToken } from '../utils/tokenUtils';
import { Protesta, Naturaleza, Provincia, PaginatedResponse, CrearProtesta, Cabecilla, CrearNaturaleza, ResumenPrincipal, User, Token, UserListResponse } from '../types';

const BASE_URL = 'http://127.0.0.1:8000'; 

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

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    const newToken = response.headers['new-token'];
    if (newToken) {
      const refreshToken = getStoredToken('refreshToken');
      if (refreshToken) {
        setStoredToken(newToken, refreshToken);
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({resolve, reject});
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshTokenValue = getStoredToken('refreshToken');
        if (!refreshTokenValue) {
          throw new Error('No hay token de actualización disponible');
        }
        const newTokens = await refreshToken(refreshTokenValue);
        setStoredToken(newTokens.token_acceso, newTokens.token_actualizacion);
        api.defaults.headers.common['Authorization'] = 'Bearer ' + newTokens.token_acceso;
        processQueue(null, newTokens.token_acceso);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        removeStoredToken();
        window.dispatchEvent(new CustomEvent('auth-error', { detail: 'Sesión expirada' }));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
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

export const register = async (userData: FormData): Promise<User> => {
  const response = await api.post<User>('/registro', userData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const refreshToken = async (refreshToken: string) => {
  console.log('Iniciando solicitud de renovación de token');
  try {
    const response = await axios.post<Token>(`${BASE_URL}/token/renovar`, { token_actualizacion: refreshToken });
    const { token_acceso, token_actualizacion } = response.data;
    setStoredToken(token_acceso, token_actualizacion);
    return response.data;
  } catch (error) {
    console.error('Error en refreshToken:', error);
    if (axios.isAxiosError(error)) {
      console.error('Detalles del error:', error.response?.data);
    }
    removeStoredToken();
    window.dispatchEvent(new CustomEvent('auth-error', { detail: 'Error al renovar el token' }));
    throw error;
  }
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
  create: (cabecilla: FormData) => api.post<Cabecilla>('/cabecillas', cabecilla, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(res => res.data),
  update: (id: string, cabecilla: FormData) => api.put<Cabecilla>(`/cabecillas/${id}`, cabecilla, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(res => res.data),
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
  create: (userData: FormData) => api.post<User>('/admin/usuarios', userData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(res => res.data),
  delete: (id: string) => api.delete(`/admin/usuarios/${id}`).then(res => res.data),
};
