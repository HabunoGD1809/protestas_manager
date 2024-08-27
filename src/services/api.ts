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
} from "../types";
import { FilterValues } from "../components/Protesta/ProtestaFilter";
import { NaturalezaFilters } from "../components/Naturaleza/NaturalezaFilter";
import { cacheService } from "./cacheService";
import { versionCheckService } from "./versionCheckService";
import { logError, logInfo } from './loggingService';

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

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
      logError('Error en el inicio de sesión', error as Error);
      throw error;
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
    return super.getAll(page, pageSize, cleanFilters);
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

  async getAll(page: number = 1, pageSize: number = 10, filters?: NaturalezaFilters): Promise<PaginatedResponse<Naturaleza>> {
    return super.getAll(page, pageSize, filters as Record<string, unknown>);
  }
}

export const naturalezaService = new NaturalezaService();

// Provincia service
class ProvinciaService extends BaseService<Provincia> {
  constructor() {
    super("/provincias");
  }

  // Sobrescribimos el método getAll de la clase base
  async getAll(): Promise<Provincia[]>;
  async getAll(page?: number, pageSize?: number, filters?: Record<string, unknown>): Promise<PaginatedResponse<Provincia>>;
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
      return super.getAll(page, pageSize, filters);
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
  getPaginaPrincipal: async (): Promise<ResumenPrincipal> => {
    const cacheKey = "resumen_principal";
    const cachedData = cacheService.get<ResumenPrincipal>(cacheKey);

    if (cachedData) {
      resumenService.backgroundRefresh();
      return cachedData;
    }

    try {
      const response = await api.get<ResumenPrincipal>("/pagina-principal");
      cacheService.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      logError("Error al obtener el resumen principal", error as Error);
      throw error;
    }
  },

  backgroundRefresh: async (): Promise<void> => {
    try {
      const response = await api.get<ResumenPrincipal>("/pagina-principal");
      cacheService.set("resumen_principal", response.data);
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
