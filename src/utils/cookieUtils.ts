import Cookies from 'js-cookie';
import { User } from '../types/types';

export const getCookie = (name: string): string | undefined => {
  return Cookies.get(name);
};

const isProduction = process.env.NODE_ENV === 'production';

export const setCookie = (name: string, value: string, options?: Cookies.CookieAttributes): void => {
  Cookies.set(name, value, {
    ...options,
    secure: isProduction,
    sameSite: 'lax',
    domain: window.location.hostname
  });
};

export const removeCookie = (name: string): void => {
  Cookies.remove(name, { path: '/', secure: true, sameSite: 'strict' });
};

export const getStoredUser = (): User | null => {
  const userStr = Cookies.get('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const setStoredUser = (user: User): void => {
  Cookies.set('user', JSON.stringify(user), { secure: true, sameSite: 'strict' });
};

export const removeStoredUser = (): void => {
  Cookies.remove('user', { path: '/', secure: true, sameSite: 'strict' });
};
