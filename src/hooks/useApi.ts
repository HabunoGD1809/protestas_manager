import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { AxiosError } from 'axios';
import { logError } from '../services/loggingService'; // Nuevo import

type HttpMethod = 'get' | 'post' | 'put' | 'delete';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async <T, D = unknown>(method: HttpMethod, url: string, data?: D): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      let response;
      const config = {
        headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
      };
      switch (method) {
        case 'get':
          response = await api.get<T>(url, config);
          break;
        case 'post':
          response = await api.post<T>(url, data, config);
          break;
        case 'put':
          response = await api.put<T>(url, data, config);
          break;
        case 'delete':
          response = await api.delete<T>(url, config);
          break;
        default:
          throw new Error(`Método HTTP no soportado: ${method}`);
      }
      setLoading(false);
      return response.data;
    } catch (err) {
      setLoading(false);
      if (err instanceof AxiosError) {
        const errorMessage = err.response?.data?.detail || err.message || 'Error en la solicitud';
        setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
        logError('Error de API', { error: err, url, method, data }); // Nuevo
      } else if (err instanceof Error) {
        setError(err.message);
        logError('Error', { error: err, url, method, data }); // Nuevo
      } else {
        setError('Ha ocurrido un error inesperado');
        logError('Error inesperado', { error: err, url, method, data }); // Nuevo
      }
      throw err;
    }
  }, []);

  return { loading, error, request };
};
