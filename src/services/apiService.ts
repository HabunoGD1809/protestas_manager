import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { getCookie, setCookie, removeCookie } from '../utils/cookieUtils';
import {
  Protesta,
  Naturaleza,
  Provincia,
  PaginatedResponse,
  CrearProtesta,
  Cabecilla,
  CrearNaturaleza,
  ResumenPrincipal,
  User,
  Token,
} from "../types/types";
import { FilterValues } from "../components/Protesta/ProtestaFilter";
import { NaturalezaFilters } from "../components/Naturaleza/NaturalezaFilter";
import { cacheService } from "./cacheService";
import { versionCheckService } from "./versionCheckService";
import { logError, logInfo } from './loggingService';

// const BASE_URL = import.meta.env.VITE_API_URL || "http://10.5.5.18:8000";

const BASE_URL = "http://localhost:8000";

// API instance configuration
export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getCookie('token');
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// Response interceptor
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshTokenValue = getCookie("refreshToken");
        if (!refreshTokenValue) {
          throw new Error("No hay token de actualización disponible");
        }
        const newTokens = await authService.refreshToken(refreshTokenValue);
        setCookie('token', newTokens.token_acceso, { path: '/', secure: true, sameSite: 'strict' });
        setCookie('refreshToken', newTokens.token_actualizacion, { path: '/', secure: true, sameSite: 'strict' });
        api.defaults.headers.common["Authorization"] = "Bearer " + newTokens.token_acceso;
        processQueue(null, newTokens.token_acceso);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        removeCookie('token');
        removeCookie('refreshToken');
        logError('Error al renovar el token', refreshError as Error);
        window.dispatchEvent(new CustomEvent("auth-error", { detail: "Sesión expirada" }));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// Utility functions
export const getFullImageUrl = (path: string | undefined) => {
  if (path) {
    return path.startsWith('http://') || path.startsWith('https://') ? path : `${BASE_URL}${path}`;
  }
  return undefined;
};

// Generic service class
class BaseService<T, CreateT = T> {
  protected endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async getAll(page: number = 1, pageSize: number = 10, filters?: Record<string, unknown>): Promise<PaginatedResponse<T>> {
    const cacheKey = `${this.endpoint}_${JSON.stringify(filters)}`;
    const cachedData = cacheService.getPaginated<T>(cacheKey, page, pageSize);

    if (cachedData) {
      this.backgroundRefresh(cacheKey, page, pageSize, filters);
      return cachedData;
    }

    try {
      const response = await api.get<PaginatedResponse<T>>(this.endpoint, {
        params: { page, page_size: pageSize, ...filters },
      });
      cacheService.setPaginated(cacheKey, response.data, page, pageSize);
      return response.data;
    } catch (error) {
      logError(`Error al obtener datos de ${this.endpoint}`, error as Error);
      throw error;
    }
  }

  async getById(id: string): Promise<T> {
    const cacheKey = `${this.endpoint}_${id}`;
    const cachedData = cacheService.get<T>(cacheKey);

    if (cachedData) {
      this.backgroundRefreshSingle(cacheKey, id);
      return cachedData;
    }

    try {
      const response = await api.get<T>(`${this.endpoint}/${id}`);
      cacheService.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      logError(`Error al obtener ${this.endpoint} por ID`, error as Error);
      throw error;
    }
  }

  async create(data: CreateT): Promise<T> {
    try {
      const response = await api.post<T>(this.endpoint, data);
      cacheService.invalidateRelatedCache(this.endpoint);
      versionCheckService.forceVersionCheck();
      logInfo(`${this.endpoint} creado exitosamente`, { data: response.data });
      return response.data;
    } catch (error) {
      logError(`Error al crear ${this.endpoint}`, error as Error);
      throw error;
    }
  }

  async update(id: string, data: Partial<CreateT>): Promise<T> {
    try {
      const response = await api.put<T>(`${this.endpoint}/${id}`, data);
      cacheService.invalidateRelatedCache(this.endpoint);
      versionCheckService.forceVersionCheck();
      logInfo(`${this.endpoint} actualizado exitosamente`, { id });
      return response.data;
    } catch (error) {
      logError(`Error al actualizar ${this.endpoint}`, error as Error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`${this.endpoint}/${id}`);
      cacheService.invalidateRelatedCache(this.endpoint);
      versionCheckService.forceVersionCheck();
      logInfo(`${this.endpoint} eliminado exitosamente`, { id });
    } catch (error) {
      logError(`Error al eliminar ${this.endpoint}`, error as Error);
      throw error;
    }
  }

  invalidateCache(): void {
    cacheService.invalidateRelatedCache(this.endpoint);
  }

  forceVersionCheck(): void {
    versionCheckService.forceVersionCheck();
  }

  private async backgroundRefresh(cacheKey: string, page: number, pageSize: number, filters?: Record<string, unknown>): Promise<void> {
    try {
      const response = await api.get<PaginatedResponse<T>>(this.endpoint, {
        params: { page, page_size: pageSize, ...filters },
      });
      cacheService.setPaginated(cacheKey, response.data, page, pageSize);
      logInfo(`Actualización en segundo plano completada para ${this.endpoint}`, { cacheKey });
    } catch (error) {
      logError(`Error en la actualización en segundo plano para ${this.endpoint}`, error as Error);
    }
  }

  private async backgroundRefreshSingle(cacheKey: string, id: string): Promise<void> {
    try {
      const response = await api.get<T>(`${this.endpoint}/${id}`);
      cacheService.set(cacheKey, response.data);
      logInfo(`Actualización en segundo plano completada para ${this.endpoint}/${id}`, { cacheKey });
    } catch (error) {
      logError(`Error en la actualización en segundo plano para ${this.endpoint}/${id}`, error as Error);
    }
  }
}

// Auth service
export const authService = {
  login: async (email: string, password: string): Promise<Token> => {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    try {
      const response = await api.post<Token>("/token", formData.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      logInfo('Inicio de sesión exitoso', { email });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('INVALID_CREDENTIALS');
        } else if (error.response?.status === 404) {
          throw new Error('USER_NOT_FOUND');
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('CONNECTION_TIMEOUT');
        } else if (!error.response) {
          throw new Error('NO_SERVER_RESPONSE');
        }
      }
      logError('Error en el inicio de sesión', error as Error);
      throw new Error('UNEXPECTED_ERROR');
    }
  },

  register: async (userData: FormData): Promise<User> => {
    try {
      const response = await api.post<User>("/registro", userData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      logInfo('Registro exitoso', { id: response.data.id });
      return response.data;
    } catch (error) {
      logError('Error en el registro', error as Error);
      throw error;
    }
  },

  refreshToken: async (refreshToken: string): Promise<Token> => {
    try {
      const response = await api.post<Token>(`${BASE_URL}/token/renovar`, {
        token_actualizacion: refreshToken,
      });
      const { token_acceso, token_actualizacion } = response.data;
      setCookie('token', token_acceso, { path: '/', secure: true, sameSite: 'strict' });
      setCookie('refreshToken', token_actualizacion, { path: '/', secure: true, sameSite: 'strict' });
      logInfo('Token renovado exitosamente');
      return response.data;
    } catch (error) {
      logError('Error al renovar el token', error as Error);
      removeCookie('token');
      removeCookie('refreshToken');
      throw error;
    }
  },

  logout: () => {
    removeCookie('token');
    removeCookie('refreshToken');
    logInfo('Cierre de sesión exitoso');
  },

  obtenerUsuarioActual: async (): Promise<User> => {
    try {
      const response = await api.get<User>("/usuarios/me");
      return {
        ...response.data,
        foto: getFullImageUrl(response.data.foto)
      };
    } catch (error) {
      logError('Error al obtener usuario actual', error as Error);
      throw error;
    }
  },

  actualizarFotoUsuario: async (foto: File): Promise<User> => {
    try {
      const formData = new FormData();
      formData.append('foto', foto);
      const response = await api.post<User>('/usuarios/foto', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      logInfo('Foto de usuario actualizada exitosamente');
      return response.data;
    } catch (error) {
      logError('Error al actualizar la foto del usuario', error as Error);
      throw error;
    }
  },
};

// Protesta service
class ProtestaService extends BaseService<Protesta, CrearProtesta> {
  constructor() {
    super("/protestas");
  }

  async getAll(page: number = 1, pageSize: number = 10, filters?: FilterValues): Promise<PaginatedResponse<Protesta>> {
    const cleanFilters = filters ? Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
    ) : {};

    // Manejar el filtro de cabecillas
    if (cleanFilters.cabecilla_ids && Array.isArray(cleanFilters.cabecilla_ids)) {
      cleanFilters.cabecilla_ids = cleanFilters.cabecilla_ids.join(',');
    }
    return super.getAll(page, pageSize, cleanFilters);
  }

  async fetchProtestas(page: number, pageSize: number, filters: FilterValues): Promise<PaginatedResponse<Protesta>> {
    try {
      const data = await this.getAll(page, pageSize, filters);
      return data;
    } catch (err) {
      console.error('Error fetching protestas:', err);
      throw new Error('Error al cargar la lista de protestas');
    }
  }

  async fetchNaturalezasYProvinciasYCabecillas(): Promise<[Naturaleza[], Provincia[], Cabecilla[]]> {
    try {
      const naturalezas = await naturalezaService.getAll();
      const provincias = await provinciaService.getAll();
      const cabecillas = await cabecillaService.getAllNoPagination();

      if (naturalezas.length === 0) {
        console.warn('No se obtuvieron naturalezas');
      }
      if (provincias.length === 0) {
        console.warn('No se obtuvieron provincias');
      }
      if (cabecillas.length === 0) {
        console.warn('No se obtuvieron cabecillas');
      }

      return [naturalezas, provincias, cabecillas];
    } catch (error) {
      console.error('Error general en fetchNaturalezasYProvinciasYCabecillas:', error);
      throw new Error('Error al cargar naturalezas, provincias y cabecillas');
    }
  }

  async getProvincias(): Promise<Provincia[]> {
    try {
      return await provinciaService.getAll();
    } catch (error) {
      console.error('Error al obtener provincias:', error);
      throw new Error('Error al cargar provincias');
    }
  }

  async getNaturalezas(): Promise<Naturaleza[]> {
    try {
      const response = await naturalezaService.getAll();
      return response;
    } catch (error) {
      console.error('Error al obtener naturalezas:', error);
      throw new Error('Error al cargar naturalezas');
    }
  }

  async getCabecillas(): Promise<Cabecilla[]> {
    try {
      return await cabecillaService.getAllNoPagination();
    } catch (error) {
      console.error('Error al obtener cabecillas:', error);
      throw new Error('Error al cargar cabecillas');
    }
  }
}

export const protestaService = new ProtestaService();

// Cabecilla service
class CabecillaService extends BaseService<Cabecilla, FormData> {
  constructor() {
    super("/cabecillas");
  }

  async getAll(page: number = 1, pageSize: number = 10, filters?: Record<string, string>): Promise<PaginatedResponse<Cabecilla>> {
    const response = await super.getAll(page, pageSize, filters);
    response.items = response.items.map(this.addFullImageUrl);
    return response;
  }

  async getAllNoPagination(): Promise<Cabecilla[]> {
    try {
      const response = await api.get<Cabecilla[]>(`${this.endpoint}/all`);
      return response.data.map(this.addFullImageUrl);
    } catch (error) {
      logError('Error al obtener todos los cabecillas', error as Error);
      throw error;
    }
  }

  async getById(id: string): Promise<Cabecilla> {
    const cabecilla = await super.getById(id);
    return this.addFullImageUrl(cabecilla);
  }

  async create(cabecilla: FormData): Promise<Cabecilla> {
    try {
      const response = await api.post<Cabecilla>(this.endpoint, cabecilla, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      cacheService.invalidateRelatedCache(this.endpoint);
      versionCheckService.forceVersionCheck();
      logInfo('Cabecilla creado exitosamente', { id: response.data.id });
      return this.addFullImageUrl(response.data);
    } catch (error) {
      logError('Error al crear cabecilla', error as Error);
      throw error;
    }
  }

  async update(id: string, cabecilla: FormData): Promise<Cabecilla> {
    try {
      const response = await api.put<Cabecilla>(`${this.endpoint}/${id}`, cabecilla, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      cacheService.invalidateRelatedCache(this.endpoint);
      versionCheckService.forceVersionCheck();
      logInfo('Cabecilla actualizado exitosamente', { id });
      return this.addFullImageUrl(response.data);
    } catch (error) {
      logError('Error al actualizar cabecilla', error as Error);
      throw error;
    }
  }

  async updateFoto(id: string, foto: File): Promise<Cabecilla> {
    try {
      const formData = new FormData();
      formData.append('foto', foto);
      const response = await api.post<Cabecilla>(`${this.endpoint}/${id}/foto`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      cacheService.invalidateRelatedCache(this.endpoint);
      versionCheckService.forceVersionCheck();
      logInfo('Foto de cabecilla actualizada exitosamente', { id });
      return this.addFullImageUrl(response.data);
    } catch (error) {
      logError('Error al actualizar foto de cabecilla', error as Error);
      throw error;
    }
  }

  async getSuggestions(field: string, value: string): Promise<string[]> {
    try {
      const response = await api.get<string[]>(`${this.endpoint}/suggestions`, {
        params: { field, value }
      });
      return response.data;
    } catch (error) {
      logError('Error al obtener sugerencias', error as Error);
      throw error;
    }
  }

  private addFullImageUrl(cabecilla: Cabecilla): Cabecilla {
    return {
      ...cabecilla,
      foto: getFullImageUrl(cabecilla.foto)
    };
  }
}

export const cabecillaService = new CabecillaService();

// Naturaleza service
class NaturalezaService extends BaseService<Naturaleza, CrearNaturaleza> {
  constructor() {
    super("/naturalezas");
  }

  async getAll(): Promise<Naturaleza[]>;
  async getAll(page: number, pageSize: number, filters?: NaturalezaFilters): Promise<PaginatedResponse<Naturaleza>>;
  async getAll(page?: number, pageSize?: number, filters?: NaturalezaFilters): Promise<Naturaleza[] | PaginatedResponse<Naturaleza>> {
    if (page === undefined && pageSize === undefined) {
      try {
        const response = await api.get<PaginatedResponse<Naturaleza>>(this.endpoint);
        return response.data.items;
      } catch (error) {
        console.error('Error en NaturalezaService.getAll:', error);
        throw error;
      }
    } else {
      return super.getAll(page!, pageSize!, filters as Record<string, unknown>);
    }
  }
}

export const naturalezaService = new NaturalezaService();

// Provincia service
class ProvinciaService extends BaseService<Provincia> {
  constructor() {
    super("/provincias");
  }

  async getAll(): Promise<Provincia[]>;
  async getAll(page: number, pageSize: number, filters?: Record<string, unknown>): Promise<PaginatedResponse<Provincia>>;
  async getAll(page?: number, pageSize?: number, filters?: Record<string, unknown>): Promise<Provincia[] | PaginatedResponse<Provincia>> {
    if (page === undefined && pageSize === undefined && filters === undefined) {
      const cacheKey = `${this.endpoint}_all`;
      const cachedData = cacheService.get<Provincia[]>(cacheKey);

      if (cachedData) {
        this.backgroundRefreshAll(cacheKey);
        return cachedData;
      }

      try {
        const response = await api.get<Provincia[]>(this.endpoint);
        cacheService.set(cacheKey, response.data);
        return response.data;
      } catch (error) {
        logError('Error al obtener todas las provincias', error as Error);
        throw error;
      }
    } else {
      return super.getAll(page!, pageSize!, filters);
    }
  }

  private async backgroundRefreshAll(cacheKey: string): Promise<void> {
    try {
      const response = await api.get<Provincia[]>(this.endpoint);
      cacheService.set(cacheKey, response.data);
      logInfo('Actualización en segundo plano completada para todas las provincias');
    } catch (error) {
      logError('Error en la actualización en segundo plano de todas las provincias', error as Error);
    }
  }
}

export const provinciaService = new ProvinciaService();

// Resumen service
export const resumenService = {
  getPaginaPrincipal: async (fechaInicio?: string, fechaFin?: string): Promise<ResumenPrincipal> => {
    const cacheKey = `resumen_principal_${fechaInicio || 'default'}_${fechaFin || 'default'}`;
    const cachedData = cacheService.get<ResumenPrincipal>(cacheKey);

    if (cachedData) {
      resumenService.backgroundRefresh(fechaInicio, fechaFin);
      return cachedData;
    }

    try {
      const params = new URLSearchParams();
      if (fechaInicio) params.append('fecha_inicio', fechaInicio);
      if (fechaFin) params.append('fecha_fin', fechaFin);

      const response = await api.get<ResumenPrincipal>("/pagina-principal", { params });
      cacheService.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      logError("Error al obtener el resumen principal", error as Error);
      throw error;
    }
  },

  backgroundRefresh: async (fechaInicio?: string, fechaFin?: string): Promise<void> => {
    try {
      const params = new URLSearchParams();
      if (fechaInicio) params.append('fecha_inicio', fechaInicio);
      if (fechaFin) params.append('fecha_fin', fechaFin);

      const response = await api.get<ResumenPrincipal>("/pagina-principal", { params });
      const cacheKey = `resumen_principal_${fechaInicio || 'default'}_${fechaFin || 'default'}`;
      cacheService.set(cacheKey, response.data);
      logInfo("Actualización en segundo plano completada para el resumen principal");
    } catch (error) {
      logError("Error en la actualización en segundo plano del resumen principal", error as Error);
    }
  },

  invalidateCache: (): void => {
    cacheService.remove("resumen_principal");
  },
};

// User service
class UserService extends BaseService<User, FormData> {
  constructor() {
    super("/usuarios");
  }

  async create(userData: FormData): Promise<User> {
    try {
      const response = await api.post<User>("/admin/usuarios", userData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      cacheService.invalidateRelatedCache(this.endpoint);
      versionCheckService.forceVersionCheck();
      logInfo('Usuario creado exitosamente', { id: response.data.id });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorDetail = error.response.data.detail;
        const errorMessage = Array.isArray(errorDetail) ? errorDetail.map(err => err.msg).join(', ') : errorDetail || "Error creating user";
        logError('Error al crear usuario', new Error(errorMessage));
        throw new Error(errorMessage);
      }
      logError('Error inesperado al crear usuario', error as Error);
      throw new Error("An unexpected error occurred");
    }
  }

  async updateRole(id: string, role: "admin" | "usuario"): Promise<User> {
    try {
      const response = await api.put<User>(`${this.endpoint}/${id}/rol`, null, {
        params: { nuevo_rol: role },
      });
      cacheService.invalidateRelatedCache(this.endpoint);
      versionCheckService.forceVersionCheck();
      logInfo('Rol de usuario actualizado exitosamente', { id, newRole: role });
      return response.data;
    } catch (error) {
      logError('Error al actualizar el rol del usuario', error as Error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/admin/usuarios/${id}`);
      cacheService.invalidateRelatedCache(this.endpoint);
      versionCheckService.forceVersionCheck();
      logInfo('Usuario eliminado exitosamente', { id });
    } catch (error) {
      logError('Error al eliminar usuario', error as Error);
      throw error;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      await api.put(`/usuarios/${userId}/cambiar-contrasena`, {
        contrasena_actual: currentPassword,
        nueva_contrasena: newPassword,
        confirmar_contrasena: newPassword
      });
      logInfo('Contraseña cambiada exitosamente', { userId });
    } catch (error) {
      logError('Error al cambiar la contraseña', error as Error);
      throw error;
    }
  }

  async resetPassword(userId: string, newPassword: string): Promise<void> {
    try {
      await api.put(`/admin/usuarios/${userId}/restablecer-contrasena`, {
        nueva_contrasena: newPassword
      });
      logInfo('Contraseña restablecida exitosamente por admin', { userId });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorDetail = error.response.data.detail;
        const errorMessage = Array.isArray(errorDetail) ? errorDetail.map(err => err.msg).join(', ') : errorDetail || "Error al restablecer la contraseña";
        logError('Error al restablecer la contraseña', new Error(errorMessage));
        throw new Error(errorMessage);
      }
      logError('Error inesperado al restablecer la contraseña', error as Error);
      throw new Error("Ocurrió un error inesperado al restablecer la contraseña");
    }
  }

  getCurrentUser = authService.obtenerUsuarioActual;
}

export const userService = new UserService();

export const checkUserExists = async (email: string): Promise<boolean> => {
  try {
    const response = await api.get<{ exists: boolean }>('/check-user', {
      params: { email }
    });
    return response.data.exists;
  } catch (error) {
    logError('Error al verificar la existencia del usuario', error as Error);
    return false;
  }
};

// Manejador global para potentialDataUpdate
window.addEventListener('potentialDataUpdate', () => {
  cacheService.markAllAsStale();
  [protestaService, cabecillaService, naturalezaService, provinciaService, userService].forEach(service => {
    service.invalidateCache();
  });
  resumenService.invalidateCache();
});
