import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { AxiosError } from 'axios';
import { logError } from '../services/loggingService';
import { tabSyncService } from '../services/tabSyncService';

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

      const performRequest = async () => {
        switch (method) {
          case 'get':
            return await api.get<T>(url, config);
          case 'post':
            return await api.post<T>(url, data, config);
          case 'put':
            return await api.put<T>(url, data, config);
          case 'delete':
            return await api.delete<T>(url, config);
          default:
            throw new Error(`Método HTTP no soportado: ${method}`);
        }
      };

      if (method !== 'get') {
        response = await tabSyncService.withLock(url, performRequest);
        if (response === null) {
          throw new Error('No se pudo adquirir el bloqueo para realizar la operación');
        }
      } else {
        response = await performRequest();
      }

      setLoading(false);
      return response.data;
    } catch (err) {
      setLoading(false);
      if (err instanceof AxiosError) {
        const errorMessage = err.response?.data?.detail || err.message || 'Error en la solicitud';
        setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
        logError('Error de API', { error: err, url, method, data });
      } else if (err instanceof Error) {
        setError(err.message);
        logError('Error', { error: err, url, method, data });
      } else {
        setError('Ha ocurrido un error inesperado');
        logError('Error inesperado', { error: err, url, method, data });
      }
      throw err;
    }
  }, []);

  return { loading, error, request };
};
