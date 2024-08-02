import { User } from '../types/index'; 

export const getStoredToken = (type: 'accessToken' | 'refreshToken' = 'accessToken'): string | null => {
  return localStorage.getItem(type);
};

export const setStoredToken = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
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
