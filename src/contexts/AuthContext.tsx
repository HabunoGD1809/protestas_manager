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

const INACTIVITY_TIMEOUT = 1 * 60 * 1000; // 10 minutes
const TOKEN_REFRESH_INTERVAL = 1 * 60 * 1000; // 14 minutes

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [showInactivityDialog, setShowInactivityDialog] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!getStoredToken());

  const handleLogout = useCallback(() => {
    console.log('Logging out user');
    apiLogout();
    setUser(null);
    setIsAuthenticated(false);
    removeStoredToken();
    removeStoredUser();
  }, []);

  const refreshUserToken = useCallback(async () => {
    try {
      const refreshTokenValue = getStoredToken('refreshToken');
      if (refreshTokenValue) {
        console.log('Refreshing token');
        const newTokens = await refreshToken(refreshTokenValue);
        setStoredToken(newTokens.token_acceso, newTokens.token_actualizacion);
        return true;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      handleLogout();
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
    const resetTimers = () => {
      if (isAuthenticated) {
        startInactivityTimer();
      }
    };

    window.addEventListener('mousemove', resetTimers);
    window.addEventListener('keypress', resetTimers);

    return () => {
      window.removeEventListener('mousemove', resetTimers);
      window.removeEventListener('keypress', resetTimers);
    };
  }, [isAuthenticated, startInactivityTimer]);

  const handleLogin = async (email: string, password: string) => {
    try {
      console.log('Attempting login');
      const { token_acceso, token_actualizacion } = await apiLogin(email, password);
      setStoredToken(token_acceso, token_actualizacion);

      const userData = await obtenerUsuarioActual();
      setUser(userData);
      setIsAuthenticated(true);
      setStoredUser(userData);
      console.log('Login successful');
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const handleRegister = async (userData: FormData) => {
    try {
      console.log('Attempting registration');
      const { user: newUser, token } = await apiRegister(userData);
      setUser(newUser);
      setIsAuthenticated(true);
      setStoredToken(token.token_acceso, token.token_actualizacion);
      setStoredUser(newUser);
      console.log('Registration successful');
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  };

  const isAdmin = () => {
    return user?.rol === 'admin';
  };

  const handleKeepSessionActive = async () => {
    console.log('Keeping session active');
    setShowInactivityDialog(false);
    await refreshUserToken();
  };

  const handleEndSession = () => {
    console.log('Ending session due to inactivity');
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
