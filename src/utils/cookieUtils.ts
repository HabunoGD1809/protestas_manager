import Cookies from 'js-cookie';
import { User } from '../types/types';

const isProduction = process.env.NODE_ENV === 'production';

export const getCookie = (name: string): string | undefined => {
  return Cookies.get(name);
};

export const setCookie = (name: string, value: string, options?: Cookies.CookieAttributes): void => {
  Cookies.set(name, value, {
    ...options,
    secure: isProduction,
    sameSite: 'lax',
    domain: window.location.hostname
  });
};

export const removeCookie = (name: string): void => {
  Cookies.remove(name, {
    path: '/',
    domain: window.location.hostname,
    secure: isProduction,
    sameSite: 'lax'
  });
};

export const getStoredUser = (): User | null => {
  const userStr = Cookies.get('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const setStoredUser = (user: User): void => {
  Cookies.set('user', JSON.stringify(user), {
    secure: isProduction,
    sameSite: 'lax',
    domain: window.location.hostname
  });
};

export const removeStoredUser = (): void => {
  Cookies.remove('user', {
    path: '/',
    domain: window.location.hostname,
    secure: isProduction,
    sameSite: 'lax'
  });
};
