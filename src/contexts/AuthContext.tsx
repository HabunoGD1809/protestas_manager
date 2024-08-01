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

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos
const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000; // 14 minutos

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [showInactivityDialog, setShowInactivityDialog] = useState(false);
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);
  const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(null);

  const handleLogout = useCallback(() => {
    apiLogout();
    setUser(null);
    removeStoredToken();
    removeStoredUser();
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }
  }, [inactivityTimer, refreshTimer]);

  const startInactivityTimer = useCallback(() => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
    const timer = setTimeout(() => {
      setShowInactivityDialog(true);
    }, INACTIVITY_TIMEOUT);
    setInactivityTimer(timer);
  }, [inactivityTimer]);

  const startRefreshTokenTimer = useCallback(() => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }
    const timer = setInterval(async () => {
      try {
        const refreshTokenValue = getStoredToken('refreshToken');
        if (refreshTokenValue) {
          const newTokens = await refreshToken(refreshTokenValue);
          setStoredToken(newTokens.token_acceso, newTokens.token_actualizacion);
        }
      } catch (error) {
        console.error('Error refreshing token:', error);
        handleLogout();
      }
    }, TOKEN_REFRESH_INTERVAL);
    setRefreshTimer(timer);
  }, [handleLogout]);

  useEffect(() => {
    if (user) {
      setStoredUser(user);
      startInactivityTimer();
      startRefreshTokenTimer();
    } else {
      removeStoredUser();
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    }
  }, [user, startInactivityTimer, startRefreshTokenTimer, inactivityTimer, refreshTimer]);

  useEffect(() => {
    const resetTimers = () => {
      startInactivityTimer();
    };

    window.addEventListener('mousemove', resetTimers);
    window.addEventListener('keypress', resetTimers);

    return () => {
      window.removeEventListener('mousemove', resetTimers);
      window.removeEventListener('keypress', resetTimers);
    };
  }, [startInactivityTimer]);

  const handleLogin = async (email: string, password: string) => {
    try {
      const { token_acceso, token_actualizacion } = await apiLogin(email, password);
      setStoredToken(token_acceso, token_actualizacion);

      const userData = await obtenerUsuarioActual();
      setUser(userData);
      startInactivityTimer();
      startRefreshTokenTimer();
    } catch (error) {
      console.error('Error durante el inicio de sesión:', error);
      throw error;
    }
  };

  const handleRegister = async (userData: FormData) => {
    try {
      const { user: newUser, token } = await apiRegister(userData);
      setUser(newUser);
      setStoredToken(token.token_acceso, token.token_actualizacion);
      startInactivityTimer();
      startRefreshTokenTimer();
    } catch (error) {
      console.error('Error durante el registro:', error);
      throw error;
    }
  };

  const isAdmin = () => {
    return user?.rol === 'admin';
  };

  const handleKeepSessionActive = async () => {
    setShowInactivityDialog(false);
    try {
      const refreshTokenValue = getStoredToken('refreshToken');
      if (refreshTokenValue) {
        const newTokens = await refreshToken(refreshTokenValue);
        setStoredToken(newTokens.token_acceso, newTokens.token_actualizacion);
        startInactivityTimer();
      } else {
        throw new Error('No refresh token available');
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      handleLogout();
    }
  };

  const handleEndSession = () => {
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
      <InactivityDialog
        open={showInactivityDialog}
        onKeepActive={handleKeepSessionActive}
        onLogout={handleEndSession}
      />
    </AuthContext.Provider>
  );
};
