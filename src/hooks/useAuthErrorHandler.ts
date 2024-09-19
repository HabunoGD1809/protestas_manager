import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCookie } from '../utils/cookieUtils';
import { authService } from '../services/apiService';
import { logError, logInfo } from '../services/loggingService';

export const useAuthErrorHandler = () => {
   const navigate = useNavigate();

   return useCallback((event: CustomEvent<string>) => {
      logError('Auth error:', event.detail);

      if (window.location.pathname !== '/login') {
         const refreshToken = getCookie('refreshToken');

         if (!refreshToken) {
            logInfo('No hay refresh token disponible, redirigiendo a login');
            navigate('/login');
            return;
         }

         authService.refreshToken(refreshToken)
            .then(() => {
               logInfo('Token renovado exitosamente');
            })
            .catch((error) => {
               logError('Error al intentar renovar el token:', error);
               authService.logout();
               navigate('/login');
            });
      }
   }, [navigate]);
};
