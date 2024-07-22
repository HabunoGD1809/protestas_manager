import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { getStoredUser, setStoredUser, removeStoredUser, getStoredToken, setStoredToken, removeStoredToken } from '../utils/tokenUtils';
import { login, register, logout, refreshToken, obtenerUsuarioActual } from '../services/api';

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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser());

  useEffect(() => {
    if (user) {
      setStoredUser(user);
    } else {
      removeStoredUser();
    }
  }, [user]);

  useEffect(() => {
    const refreshTokenPeriodically = setInterval(async () => {
      const refreshTokenValue = getStoredToken('refreshToken');
      if (refreshTokenValue) {
        try {
          const newTokens = await refreshToken(refreshTokenValue);
          setStoredToken(newTokens.token_acceso, newTokens.token_actualizacion);
        } catch (error) {
          console.error('Error al refrescar el token:', error);
          setUser(null);
          removeStoredToken();
          removeStoredUser();
        }
      }
    }, 25 * 60 * 1000); // Refresca cada 25m

    return () => clearInterval(refreshTokenPeriodically);
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      const { token_acceso, token_actualizacion } = await login(email, password);
      setStoredToken(token_acceso, token_actualizacion);

      // Obtener información del usuario
      const userData = await obtenerUsuarioActual();
      setUser(userData);
    } catch (error) {
      console.error('Error durante el inicio de sesión:', error);
      throw error;
    }
  };

  const handleRegister = async (userData: FormData) => {
    try {
      const { user: newUser, token_acceso, token_actualizacion } = await register(userData);
      setUser(newUser);
      setStoredToken(token_acceso, token_actualizacion);
    } catch (error) {
      console.error('Error durante el registro:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    removeStoredToken();
    removeStoredUser();
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
