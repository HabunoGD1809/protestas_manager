import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { AxiosError } from 'axios';

type HttpMethod = 'get' | 'post' | 'put' | 'delete';
type RequestData = Record<string, unknown> | FormData | undefined;

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async <T>(method: HttpMethod, url: string, data?: RequestData): Promise<T> => {
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
        setError(err.response?.data?.detail || err.message);
      } else {
        setError('Ha ocurrido un error inesperado');
      }
      throw err;
    }
  }, []);

  return { loading, error, request };
};
