import Cookies from 'js-cookie';
import { User } from '../types/index';

export const getCookie = (name: string): string | undefined => {
  return Cookies.get(name);
};

export const setCookie = (name: string, value: string, options?: Cookies.CookieAttributes): void => {
  Cookies.set(name, value, { ...options, secure: true, sameSite: 'strict' });
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
