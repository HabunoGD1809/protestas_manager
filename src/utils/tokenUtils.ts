export const getStoredToken = (type: 'accessToken' | 'refreshToken' = 'accessToken') => {
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

export const getStoredUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const setStoredUser = (user: any) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const removeStoredUser = () => {
  localStorage.removeItem('user');
};
