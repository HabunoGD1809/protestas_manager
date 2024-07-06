import axios from 'axios';
import { getStoredToken, setStoredToken, removeStoredToken } from '../utils/tokenUtils';

const BASE_URL = 'http://localhost:8000'; 

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = getStoredToken('refreshToken');
        const response = await axios.post(`${BASE_URL}/token/renovar`, { refresh_token: refreshToken });
        const { access_token } = response.data;
        setStoredToken(access_token);
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        removeStoredToken();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const login = async (email: string, password: string) => {
  const response = await api.post('/token', { username: email, password });
  setStoredToken(response.data.access_token, response.data.refresh_token);
  return response.data.user;
};

export const register = async (userData: any) => {
  const response = await api.post('/registro', userData);
  setStoredToken(response.data.access_token, response.data.refresh_token);
  return response.data.user;
};

export const logout = () => {
  removeStoredToken();
};

export const getProtestas = () => api.get('/protestas');
export const createProtesta = (data: any) => api.post('/protestas', data);
export const updateProtesta = (id: string, data: any) => api.put(`/protestas/${id}`, data);
export const deleteProtesta = (id: string) => api.delete(`/protestas/${id}`);

export const getCabecillas = () => api.get('/cabecillas');
export const createCabecilla = (data: any) => api.post('/cabecillas', data);
export const updateCabecilla = (id: string, data: any) => api.put(`/cabecillas/${id}`, data);
export const deleteCabecilla = (id: string) => api.delete(`/cabecillas/${id}`);

export const getNaturalezas = () => api.get('/naturalezas');
export const createNaturaleza = (data: any) => api.post('/naturalezas', data);
export const updateNaturaleza = (id: string, data: any) => api.put(`/naturalezas/${id}`, data);
export const deleteNaturaleza = (id: string) => api.delete(`/naturalezas/${id}`);
