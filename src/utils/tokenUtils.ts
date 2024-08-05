import { User } from '../types/index'; 

export const getStoredToken = (type: 'accessToken' | 'refreshToken' = 'accessToken'): string | null => {
  return localStorage.getItem(type);
};

export const setStoredToken = (accessToken: string, refreshToken: string) => {
  console.log('Almacenando tokens:', { accessToken, refreshToken });
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  console.log('Tokens almacenados en localStorage');
};

export const removeStoredToken = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const setStoredUser = (user: User) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const removeStoredUser = () => {
  localStorage.removeItem('user');
};

// Añade esta función en tokenUtils.ts

export const debugTokens = () => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  console.log('Access Token:', accessToken);
  console.log('Refresh Token:', refreshToken);
  
  if (refreshToken) {
    const parts = refreshToken.split('.');
    console.log('Refresh Token parts:', parts.length);
    parts.forEach((part, index) => {
      console.log(`Part ${index + 1}:`, part);
    });
  } else {
    console.log('No refresh token found');
  }
};
