import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/apiService';
import { AxiosError } from 'axios';
import { logError } from '../services/loggingService';
import { cacheService } from '../services/cacheService';
import { useAuth } from './useAuth'; 

type HttpMethod = 'get' | 'post' | 'put' | 'delete';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshUserToken } = useAuth(); 

  useEffect(() => {
    const handlePotentialDataUpdate = () => {
      cacheService.markAllAsStale();
    };

    window.addEventListener('potentialDataUpdate', handlePotentialDataUpdate);

    return () => {
      window.removeEventListener('potentialDataUpdate', handlePotentialDataUpdate);
    };
  }, []);

  const request = useCallback(async <T, D = unknown>(
    method: HttpMethod,
    url: string,
    data?: D,
    useCache: boolean = true
  ): Promise<T> => {
    setLoading(true);
    setError(null);

    const cacheKey = `${method}_${url}`;

    if (method === 'get' && useCache) {
      const cachedData = cacheService.get<T>(cacheKey);
      if (cachedData) {
        setLoading(false);
        return cachedData;
      }
    }

    try {
      let response;
      const config = {
        headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
      };

      const executeRequest = async () => {
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

      try {
        response = await executeRequest();
      } catch (err) {
        if (err instanceof AxiosError && err.response?.status === 401) {
          const refreshSuccess = await refreshUserToken();
          if (refreshSuccess) {
            response = await executeRequest();
          } else {
            throw new Error('No se pudo renovar la sesión');
          }
        } else {
          throw err;
        }
      }

      if (method === 'get' && useCache) {
        cacheService.set(cacheKey, response.data);
      } else {
        cacheService.markAllAsStale();
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
  }, [refreshUserToken]);

  const invalidateCache = useCallback((url: string) => {
    cacheService.remove(`get_${url}`);
  }, []);

  return { loading, error, request, invalidateCache };
};
