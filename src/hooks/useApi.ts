import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { AxiosError } from 'axios';

type HttpMethod = 'get' | 'post' | 'put' | 'delete';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async <T>(method: HttpMethod, url: string, data?: any): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      let response;
      switch (method) {
        case 'get':
          response = await api.get<T>(url);
          break;
        case 'post':
          response = await api.post<T>(url, data);
          break;
        case 'put':
          response = await api.put<T>(url, data);
          break;
        case 'delete':
          response = await api.delete<T>(url);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
      setLoading(false);
      return response.data;
    } catch (err) {
      setLoading(false);
      if (err instanceof AxiosError) {
        setError(err.response?.data?.detail || err.message);
      } else {
        setError('An unexpected error occurred');
      }
      throw err;
    }
  }, []);

  return { loading, error, request };
};
