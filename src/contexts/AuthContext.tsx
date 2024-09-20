import React, { createContext, useState, useEffect, useCallback, useRef, ReactNode, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types/types';
import { getCookie, setCookie, removeCookie } from '../utils/cookieUtils';
import { authService, checkUserExists } from '../services/apiService';
import InactivityDialog from '../components/Common/InactivityDialog';
import { logError, logInfo } from '../services/loggingService';
import { AxiosError } from 'axios';
import { BroadcastChannel } from 'broadcast-channel';
import { cacheService } from '../services/cacheService';

interface AuthChannelMessage {
  type: 'logout';
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: FormData) => Promise<User>;
  logout: () => void;
  isAdmin: boolean;
  canEdit: (creatorId: string) => boolean;
  refreshUserToken: () => Promise<boolean>;
  checkUserExists: (email: string) => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false, error: 'Not implemented' }),
  register: async () => ({} as User),
  logout: () => { },
  isAdmin: false,
  canEdit: () => false,
  refreshUserToken: async () => false,
  checkUserExists: async () => false,
});

interface AuthProviderProps {
  children: ReactNode;
}


const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutos
const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000; // 14 minutos
const TOKEN_EXPIRY_BUFFER = 60 * 1000; // 1 minuto antes del vencimiento
const COUNTDOWN_DURATION = 60; // 60 segundos para el contador de inactividad

const isProduction = process.env.NODE_ENV === 'production';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const [dialogState, setDialogState] = useState({
    open: false,
    onKeepActive: () => { },
    onLogout: () => { },
  });

  const authChannel = useRef<BroadcastChannel<AuthChannelMessage> | null>(null);

  const handleLogout = useRef((reason?: 'inactivity' | 'manual' | 'error' | 'sync') => {
    logInfo('Cerrando sesión del usuario', { reason });

    removeCookie('token');
    removeCookie('refreshToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');

    setUser(null);
    setIsAuthenticated(false);

    cacheService.clear();

    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    if (reason !== 'sync' && authChannel.current) {
      authChannel.current.postMessage({ type: 'logout' }).catch(error => {
        logError('Error al enviar mensaje de cierre de sesión', error);
      });
    }

    navigate(reason === 'inactivity' ? '/login?inactivity=true' : '/login');
  }).current;

  useEffect(() => {
    authChannel.current = new BroadcastChannel<AuthChannelMessage>('auth_channel');
    const channel = authChannel.current;

    channel.onmessage = (msg: AuthChannelMessage) => {
      if (msg.type === 'logout') {
        handleLogout('sync');
      }
    };

    return () => {
      if (authChannel.current) {
        authChannel.current.close();
        authChannel.current = null;
      }
    };
  }, [handleLogout]);

  const refreshUserToken = useRef(async () => {
    if (isRefreshing) return false;
    setIsRefreshing(true);
    logInfo('Iniciando proceso de renovación de token');

    try {
      const refreshTokenValue = getCookie('refreshToken');
      if (!refreshTokenValue) throw new Error('No refresh token available');

      const newTokens = await authService.refreshToken(refreshTokenValue);
      setCookie('token', newTokens.token_acceso, { path: '/', secure: isProduction, sameSite: 'lax' });
      setCookie('refreshToken', newTokens.token_actualizacion, { path: '/', secure: isProduction, sameSite: 'lax' });

      logInfo('Token renovado exitosamente');
      cacheService.markAllAsStale();
      return true;
    } catch (error) {
      logError('Error al renovar el token', error);
      handleLogout('error');
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }).current;

  const checkAuthStatus = useCallback(async () => {
    setLoading(true);
    const token = getCookie('token');
    if (!token) {
      setLoading(false);
      return;
    }

    const cachedUser = cacheService.get<User>('current_user');
    if (cachedUser) {
      setUser(cachedUser);
      setIsAuthenticated(true);
      setLoading(false);
      return;
    }

    try {
      const userData = await authService.obtenerUsuarioActual();
      setUser(userData);
      setIsAuthenticated(true);
      cacheService.set('current_user', userData);
      logInfo('Autenticación inicializada exitosamente');
    } catch (error) {
      logError('Error al inicializar la autenticación', error);
      if (error instanceof AxiosError && error.response?.status === 401) {
        const refreshSuccess = await refreshUserToken();
        if (!refreshSuccess) {
          handleLogout('error');
        }
      } else {
        handleLogout('error');
      }
    } finally {
      setLoading(false);
    }
  }, [refreshUserToken, handleLogout]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const scheduleTokenRefresh = useCallback((tokenExpiryTime: number) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    const timeUntilExpiry = tokenExpiryTime - Date.now() - TOKEN_EXPIRY_BUFFER;

    if (timeUntilExpiry > 0) {
      refreshTimerRef.current = setTimeout(async () => {
        const success = await refreshUserToken();
        if (success) {
          logInfo('Token renovado correctamente');
          scheduleTokenRefresh(Date.now() + TOKEN_REFRESH_INTERVAL);
        } else {
          logInfo('Fallo en la renovación del token');
          handleLogout('error');
        }
      }, timeUntilExpiry);
    }
  }, [refreshUserToken, handleLogout]);

  const startInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);

    inactivityTimerRef.current = setTimeout(() => {
      setDialogState({
        open: true,
        onKeepActive: async () => {
          logInfo('Manteniendo la sesión activa');
          setDialogState(prev => ({ ...prev, open: false }));

          const success = await refreshUserToken();
          if (success) {
            logInfo('Sesión mantenida con éxito');
            startInactivityTimer();
          } else {
            handleLogout('inactivity');
          }
        },
        onLogout: () => {
          logInfo('Finalizando sesión por inactividad');
          setDialogState(prev => ({ ...prev, open: false }));
          handleLogout('inactivity');
        },
      });
    }, INACTIVITY_TIMEOUT);
  }, [refreshUserToken, handleLogout]);

  useEffect(() => {
    if (isAuthenticated) {
      startInactivityTimer();
      const tokenExpiryTime = Date.now() + TOKEN_REFRESH_INTERVAL;
      scheduleTokenRefresh(tokenExpiryTime);
    } else {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    }

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [isAuthenticated, startInactivityTimer, scheduleTokenRefresh]);

  useEffect(() => {
    const resetInactivityTimer = throttle(() => {
      if (isAuthenticated) {
        startInactivityTimer();
      }
    }, 60000); // Throttle de 1 minuto para evitar demasiados reinicios

    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('keypress', resetInactivityTimer);

    return () => {
      window.removeEventListener('mousemove', resetInactivityTimer);
      window.removeEventListener('keypress', resetInactivityTimer);
    };
  }, [isAuthenticated, startInactivityTimer]);
  // dsdsdsads

  const handleLogin = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { token_acceso, token_actualizacion } = await authService.login(email, password);
      setCookie('token', token_acceso, { path: '/', secure: isProduction, sameSite: 'lax' });
      setCookie('refreshToken', token_actualizacion, { path: '/', secure: isProduction, sameSite: 'lax' });

      const userData = await authService.obtenerUsuarioActual();
      setUser(userData);
      setIsAuthenticated(true);
      cacheService.set('current_user', userData);
      return { success: true };
    } catch (error) {
      logError('Error durante el inicio de sesión', error);
      if (error instanceof Error) {
        switch (error.message) {
          case 'INVALID_CREDENTIALS':
          case 'USER_NOT_FOUND':
          case 'CONNECTION_TIMEOUT':
          case 'NO_SERVER_RESPONSE':
            return { success: false, error: error.message };
          default:
            console.error('Error inesperado:', error);
            return { success: false, error: 'UNEXPECTED_ERROR' };
        }
      }
      console.error('Error no manejado:', error);
      return { success: false, error: 'UNEXPECTED_ERROR' };
    }
  }, []);

  const handleRegister = useCallback(async (userData: FormData) => {
    try {
      logInfo('Intentando registrar usuario');
      const user = await authService.register(userData);
      logInfo('Respuesta del registro recibida', { userId: user.id });

      if (user) {
        logInfo('Registro exitoso');
        return user;
      } else {
        throw new Error('Respuesta del registro incompleta');
      }
    } catch (error) {
      logError('Error durante el registro', error);
      throw error;
    }
  }, []);

  const isAdmin = useMemo(() => user?.rol === 'admin', [user]);

  const canEdit = useCallback((creatorId: string) => {
    if (!user) return false;
    return user.rol === 'admin' || user.id === creatorId;
  }, [user]);

  const authContextValue = useMemo<AuthContextType>(() => ({
    user,
    loading,
    login: handleLogin,
    register: handleRegister,
    logout: () => handleLogout('manual'),
    isAdmin,
    canEdit,
    refreshUserToken,
    checkUserExists,
  }), [user, loading, handleLogin, handleRegister, handleLogout, isAdmin, canEdit, refreshUserToken]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
      <InactivityDialog
        open={dialogState.open}
        onKeepActive={dialogState.onKeepActive}
        onLogout={dialogState.onLogout}
        countdownDuration={COUNTDOWN_DURATION}
      />
    </AuthContext.Provider>
  );
};

function throttle<T extends unknown[]>(func: (...args: T) => void, limit: number): (...args: T) => void {
  let inThrottle = false;

  return (...args: T) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

export default AuthProvider;
