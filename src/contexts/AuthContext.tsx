import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types';
import { getStoredUser, setStoredUser, removeStoredUser, getStoredToken, setStoredToken, removeStoredToken } from '../utils/tokenUtils';
import { login as apiLogin, register as apiRegister, logout as apiLogout, refreshToken, obtenerUsuarioActual } from '../services/api';
import InactivityDialog from '../components/Common/InactivityDialog';

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: FormData) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  isAdmin: () => false,
});

interface AuthProviderProps {
  children: ReactNode;
}

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minuto
const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000; // 14 minutos

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [showInactivityDialog, setShowInactivityDialog] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
  }, []);

  const handleLogout = useCallback(() => {
    console.log('Cerrando sesión del usuario');
    apiLogout();
    setUser(null);
    setIsAuthenticated(false);
    removeStoredToken();
    removeStoredUser();
  }, []);

  const refreshUserToken = useCallback(async () => {
    const refreshTokenValue = getStoredToken('refreshToken');
    if (refreshTokenValue) {
      try {
        console.log('Renovando token');
        const newTokens = await refreshToken(refreshTokenValue);
        setStoredToken(newTokens.token_acceso, newTokens.token_actualizacion);
        return true;
      } catch (error) {
        console.error('Error al renovar el token:', error);
        handleLogout();
      }
    }
    return false;
  }, [handleLogout]);

  const startInactivityTimer = useCallback(() => {
    return setTimeout(() => {
      setShowInactivityDialog(true);
    }, INACTIVITY_TIMEOUT);
  }, []);

  const startRefreshTokenTimer = useCallback(() => {
    return setInterval(async () => {
      await refreshUserToken();
    }, TOKEN_REFRESH_INTERVAL);
  }, [refreshUserToken]);

  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout | null = null;
    let refreshTimer: NodeJS.Timeout | null = null;

    if (isAuthenticated) {
      inactivityTimer = startInactivityTimer();
      refreshTimer = startRefreshTokenTimer();
    }

    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      if (refreshTimer) clearInterval(refreshTimer);
    };
  }, [isAuthenticated, startInactivityTimer, startRefreshTokenTimer]);

  useEffect(() => {
    const resetInactivityTimer = () => {
      if (isAuthenticated) {
        if (inactivityTimer) clearTimeout(inactivityTimer);
        inactivityTimer = startInactivityTimer();
      }
    };

    let inactivityTimer: NodeJS.Timeout | null = null;

    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('keypress', resetInactivityTimer);

    return () => {
      window.removeEventListener('mousemove', resetInactivityTimer);
      window.removeEventListener('keypress', resetInactivityTimer);
      if (inactivityTimer) clearTimeout(inactivityTimer);
    };
  }, [isAuthenticated, startInactivityTimer]);

  const handleLogin = async (email: string, password: string) => {
    try {
      console.log('Intentando iniciar sesión');
      const { token_acceso, token_actualizacion } = await apiLogin(email, password);
      setStoredToken(token_acceso, token_actualizacion);

      const userData = await obtenerUsuarioActual();
      setUser(userData);
      setIsAuthenticated(true);
      setStoredUser(userData);
      console.log('Inicio de sesión exitoso');
    } catch (error) {
      console.error('Error durante el inicio de sesión:', error);
      throw error;
    }
  };

  const handleRegister = async (userData: FormData) => {
    try {
      console.log('Intentando registrar');
      const { user: newUser, token } = await apiRegister(userData);
      setUser(newUser);
      setIsAuthenticated(true);
      setStoredToken(token.token_acceso, token.token_actualizacion);
      setStoredUser(newUser);
      console.log('Registro exitoso');
    } catch (error) {
      console.error('Error durante el registro:', error);
      throw error;
    }
  };

  const isAdmin = () => {
    return user?.rol === 'admin';
  };

  const handleKeepSessionActive = async () => {
    console.log('Manteniendo la sesión activa');
    setShowInactivityDialog(false);
    await refreshUserToken();
  };

  const handleEndSession = () => {
    console.log('Finalizando sesión por inactividad');
    setShowInactivityDialog(false);
    handleLogout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        isAdmin,
      }}
    >
      {children}
      {isAuthenticated && (
        <InactivityDialog
          open={showInactivityDialog}
          onKeepActive={handleKeepSessionActive}
          onLogout={handleEndSession}
        />
      )}
    </AuthContext.Provider>
  );
};
