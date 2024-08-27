import React, { createContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types/types';
import { getCookie, setCookie, removeCookie, getStoredUser, setStoredUser, removeStoredUser } from '../utils/cookieUtils';
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
  login: (email: string, password: string) => Promise<void>;
  register: (userData: FormData) => Promise<User>;
  logout: () => void;
  isAdmin: () => boolean;
  refreshUserToken: () => Promise<boolean>;
  checkUserExists: (email: string) => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => { },
  register: async () => ({} as User),
  logout: () => { },
  isAdmin: () => false,
  refreshUserToken: async () => false,
  checkUserExists: async () => false,
});

interface AuthProviderProps {
  children: ReactNode;
}

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutos
const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000; // 14 minutos
const COUNTDOWN_DURATION = 60; // 60 segundos para el contador de inactividad

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser());
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

  const handleLogout = useCallback((reason?: 'inactivity' | 'manual' | 'error' | 'sync') => {
    logInfo('Cerrando sesión del usuario', { reason });
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    removeCookie('token');
    removeCookie('refreshToken');
    removeStoredUser();
    cacheService.clear(); // Limpiar todo el caché al cerrar sesión
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);

    if (reason !== 'sync' && authChannel.current) {
      authChannel.current.postMessage({ type: 'logout' }).catch(error => {
        logError('Error al enviar mensaje de cierre de sesión', error);
      });
    }

    navigate(reason === 'inactivity' ? '/login?inactivity=true' : '/login');
  }, [navigate]);

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

  const refreshUserToken = useCallback(async () => {
    if (isRefreshing) return false;
    setIsRefreshing(true);
    logInfo('Iniciando proceso de renovación de token');

    const refreshTokenValue = getCookie('refreshToken');

    if (refreshTokenValue) {
      try {
        const newTokens = await authService.refreshToken(refreshTokenValue);
        setCookie('token', newTokens.token_acceso, { path: '/', secure: true, sameSite: 'strict' });
        setCookie('refreshToken', newTokens.token_actualizacion, { path: '/', secure: true, sameSite: 'strict' });
        logInfo('Token renovado exitosamente');
        cacheService.markAllAsStale(); // Invalidar todo el caché después de renovar el token
        return true;
      } catch (error) {
        logError('Error al renovar el token', error);
        return false;
      } finally {
        setIsRefreshing(false);
      }
    } else {
      logError('No hay token de actualización disponible', new Error('No refresh token'));
      setIsRefreshing(false);
      return false;
    }
  }, [isRefreshing]);

  const startInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      showInactivityDialog();
    }, INACTIVITY_TIMEOUT);
  }, []);

  const showInactivityDialog = useCallback(() => {
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
          logInfo('No se pudo mantener la sesión activa');
          handleLogout('inactivity');
        }
      },
      onLogout: () => {
        logInfo('Finalizando sesión por inactividad');
        setDialogState(prev => ({ ...prev, open: false }));
        handleLogout('inactivity');
      },
    });
  }, [refreshUserToken, handleLogout, startInactivityTimer]);

  const startRefreshTokenTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }
    refreshTimerRef.current = setInterval(async () => {
      await refreshUserToken();
    }, TOKEN_REFRESH_INTERVAL);
  }, [refreshUserToken]);

  useEffect(() => {
    const initAuth = async () => {
      const token = getCookie('token');
      if (token) {
        try {
          let userData = cacheService.get<User>('current_user');
          if (!userData) {
            userData = await authService.obtenerUsuarioActual();
            cacheService.set('current_user', userData);
          }
          setUser(userData);
          setIsAuthenticated(true);
          logInfo('Autenticación inicializada exitosamente');
        } catch (error) {
          logError('Error al inicializar la autenticación', error);
          if (error instanceof AxiosError && error.response?.status === 401) {
            const refreshSuccess = await refreshUserToken();
            if (refreshSuccess) {
              try {
                const userData = await authService.obtenerUsuarioActual();
                setUser(userData);
                setIsAuthenticated(true);
                cacheService.set('current_user', userData);
                logInfo('Autenticación recuperada después de refrescar token');
              } catch (secondError) {
                logError('Error al obtener usuario después de refrescar token', secondError);
                handleLogout('error');
              }
            } else {
              handleLogout('error');
            }
          } else {
            handleLogout('error');
          }
        }
      }
    };

    initAuth();
  }, [handleLogout, refreshUserToken]);

  useEffect(() => {
    if (isAuthenticated) {
      startInactivityTimer();
      startRefreshTokenTimer();
    } else {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    }

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [isAuthenticated, startInactivityTimer, startRefreshTokenTimer]);

  useEffect(() => {
    const resetInactivityTimer = () => {
      if (isAuthenticated) {
        startInactivityTimer();
      }
    };

    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('keypress', resetInactivityTimer);

    return () => {
      window.removeEventListener('mousemove', resetInactivityTimer);
      window.removeEventListener('keypress', resetInactivityTimer);
    };
  }, [isAuthenticated, startInactivityTimer]);

  const handleLogin = async (email: string, password: string) => {
    try {
      logInfo('Verificando si el usuario existe');
      const userExists = await checkUserExists(email);
      if (!userExists) {
        throw new Error('USER_NOT_REGISTERED');
      }

      logInfo('Intentando iniciar sesión');
      const { token_acceso, token_actualizacion } = await authService.login(email, password);
      setCookie('token', token_acceso, { path: '/', secure: true, sameSite: 'strict' });
      setCookie('refreshToken', token_actualizacion, { path: '/', secure: true, sameSite: 'strict' });
      logInfo('Tokens almacenados');

      const userData = await authService.obtenerUsuarioActual();
      setUser(userData);
      setIsAuthenticated(true);
      setStoredUser(userData);
      cacheService.set('current_user', userData); // Cachear el usuario actual
      logInfo('Inicio de sesión exitoso');
    } catch (error) {
      logError('Error durante el inicio de sesión', error);
      if (error instanceof AxiosError) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('CONNECTION_TIMEOUT');
        } else if (!error.response) {
          throw new Error('NO_SERVER_RESPONSE');
        } else if (error.response.status === 401) {
          throw new Error('INVALID_CREDENTIALS');
        }
      }
      throw error;
    }
  };

  const handleRegister = async (userData: FormData) => {
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
  };

  const isAdmin = useCallback(() => {
    return user?.rol === 'admin';
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login: handleLogin,
        register: handleRegister,
        logout: () => handleLogout('manual'),
        isAdmin,
        refreshUserToken,
        checkUserExists,
      }}
    >
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
