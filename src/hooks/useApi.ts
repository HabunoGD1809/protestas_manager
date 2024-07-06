import { useState, useCallback } from 'react';
import { api } from '../services/api';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async (method: string, url: string, data?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api[method](url, data);
      setLoading(false);
      return response.data;
    } catch (err) {
      setLoading(false);
      setError(err.message || 'An error occurred');
      throw err;
    }
  }, []);

  return { loading, error, request };
};
