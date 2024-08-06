import React, { createContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { User } from '../types';
import { getStoredUser, setStoredUser, removeStoredUser, getStoredToken, setStoredToken, removeStoredToken } from '../utils/tokenUtils';
import { login as apiLogin, register as apiRegister, logout as apiLogout, refreshToken, obtenerUsuarioActual } from '../services/api';
import InactivityDialog from '../components/Common/InactivityDialog';
import axios from 'axios';

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: FormData) => Promise<User>;
  logout: () => void;
  isAdmin: () => boolean;
  refreshUserToken: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  register: async () => ({} as User),
  logout: () => {},
  isAdmin: () => false,
  refreshUserToken: async () => false,
});

interface AuthProviderProps {
  children: ReactNode;
}

const INACTIVITY_TIMEOUT = 1 * 60 * 1000; // 5 minutos
const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000; // 14 minutos

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [dialogState, setDialogState] = useState({
    open: false,
    onKeepActive: () => {},
    onLogout: () => {},
  });

  const COUNTDOWN_DURATION = 60; // Duración del contador en segundos

  const handleLogout = useCallback(() => {
    console.log('Cerrando sesión del usuario');
    apiLogout();
    setUser(null);
    setIsAuthenticated(false);
    removeStoredToken();
    removeStoredUser();
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
  }, []);

  const refreshUserToken = useCallback(async () => {
    if (isRefreshing) return false;
    setIsRefreshing(true);
    console.log('Iniciando proceso de renovación de token');
    
    const refreshTokenValue = getStoredToken('refreshToken');
    console.log('Token de actualización almacenado:', refreshTokenValue);
    
    if (refreshTokenValue) {
      try {
        console.log('Intentando renovar token');
        const newTokens = await refreshToken(refreshTokenValue);
        console.log('Respuesta de renovación de token:', newTokens);
        
        setStoredToken(newTokens.token_acceso, newTokens.token_actualizacion);
        console.log('Nuevos tokens almacenados');
        
        setIsRefreshing(false);
        return true;
      } catch (error) {
        console.error('Error al renovar el token:', error);
        if (axios.isAxiosError(error)) {
          console.error('Detalles del error:', error.response?.data);
        }
        handleLogout();
        setIsRefreshing(false);
        return false;
      }
    } else {
      console.error('No hay token de actualización disponible');
      handleLogout();
      setIsRefreshing(false);
      return false;
    }
  }, [handleLogout, isRefreshing]);

  const showInactivityDialog = useCallback(() => {
    setDialogState({
      open: true,
      onKeepActive: async () => {
        console.log('Manteniendo la sesión activa');
        setDialogState(prev => ({ ...prev, open: false }));
        const success = await refreshUserToken();
        if (success) {
          console.log('Sesión mantenida con éxito');
          startInactivityTimer();
        } else {
          console.log('No se pudo mantener la sesión activa');
          handleLogout();
        }
      },
      onLogout: () => {
        console.log('Finalizando sesión por inactividad');
        setDialogState(prev => ({ ...prev, open: false }));
        handleLogout();
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshUserToken, handleLogout]);

  const startInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      showInactivityDialog();
    }, INACTIVITY_TIMEOUT);
  }, [showInactivityDialog]);

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
      const token = getStoredToken();
      if (token) {
        try {
          const userData = await obtenerUsuarioActual();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error al inicializar la autenticación:', error);
          handleLogout();
        }
      }
    };

    initAuth();
  }, [handleLogout]);

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
      console.log('Intentando iniciar sesión');
      const { token_acceso, token_actualizacion } = await apiLogin(email, password);
      console.log('Tokens recibidos:', { token_acceso, token_actualizacion });
      setStoredToken(token_acceso, token_actualizacion);
      console.log('Tokens almacenados');

      const userData = await obtenerUsuarioActual();
      setUser(userData);
      setIsAuthenticated(true);
      setStoredUser(userData);
      console.log('Inicio de sesión exitoso');
      
      // Verificar que los tokens se hayan almacenado correctamente
      const storedAccessToken = getStoredToken('accessToken');
      const storedRefreshToken = getStoredToken('refreshToken');
      console.log('Tokens almacenados después del login:', { storedAccessToken, storedRefreshToken });
    } catch (error) {
      console.error('Error durante el inicio de sesión:', error);
      throw error;
    }
  };

  const handleRegister = async (userData: FormData) => {
    try {
      console.log('Intentando registrar');
      const user = await apiRegister(userData);
      console.log('Respuesta del registro:', user);

      if (user) {
        console.log('Registro exitoso');
        return user; // Retornamos el usuario registrado
      } else {
        throw new Error('Respuesta del registro incompleta');
      }
    } catch (error) {
      console.error('Error durante el registro:', error);
      if (error instanceof Error) {
        console.error('Mensaje de error:', error.message);
      }
      throw error;
    }
  };

  const isAdmin = () => {
    return user?.rol === 'admin';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        isAdmin,
        refreshUserToken,
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
