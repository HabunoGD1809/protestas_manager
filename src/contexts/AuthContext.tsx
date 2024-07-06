import React, { createContext, useState, useEffect } from 'react';
import { User } from '../types';
import { getStoredUser, setStoredUser, removeStoredUser } from '../utils/tokenUtils';
import { login, register, logout } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser());

  useEffect(() => {
    if (user) {
      setStoredUser(user);
    } else {
      removeStoredUser();
    }
  }, [user]);

  const handleLogin = async (email: string, password: string) => {
    const userData = await login(email, password);
    setUser(userData);
  };

  const handleRegister = async (userData: any) => {
    const newUser = await register(userData);
    setUser(newUser);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
