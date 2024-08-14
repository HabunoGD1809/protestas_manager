import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import {
  getStoredToken,
  setStoredToken,
  removeStoredToken,
} from "../utils/tokenUtils";
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
import { FilterValues } from "../components/Protesta/ProtestaList";
import { NaturalezaFilters } from "../components/Naturaleza/NaturalezaFilter";
import { cacheService } from "./cacheService";

const BASE_URL = "http://127.0.0.1:8000";

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken();
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
  (response: AxiosResponse) => {
    const newToken = response.headers["new-token"];
    if (newToken) {
      const refreshToken = getStoredToken("refreshToken");
      if (refreshToken) {
        setStoredToken(newToken, refreshToken);
      }
    }
    return response;
  },
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
        const refreshTokenValue = getStoredToken("refreshToken");
        if (!refreshTokenValue) {
          throw new Error("No hay token de actualización disponible");
        }
        const newTokens = await authService.refreshToken(refreshTokenValue);
        setStoredToken(newTokens.token_acceso, newTokens.token_actualizacion);
        api.defaults.headers.common["Authorization"] = "Bearer " + newTokens.token_acceso;
        processQueue(null, newTokens.token_acceso);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        removeStoredToken();
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

    if (cachedData) return cachedData;

    const response = await api.get<PaginatedResponse<T>>(this.endpoint, {
      params: { page, page_size: pageSize, ...filters },
    });
    cacheService.setPaginated(cacheKey, response.data, page, pageSize);
    return response.data;
  }

  async getById(id: string): Promise<T> {
    const cacheKey = `${this.endpoint}_${id}`;
    const cachedData = cacheService.get<T>(cacheKey);

    if (cachedData) return cachedData;

    const response = await api.get<T>(`${this.endpoint}/${id}`);
    cacheService.set(cacheKey, response.data);
    return response.data;
  }

  async create(data: CreateT): Promise<T> {
    const response = await api.post<T>(this.endpoint, data);
    cacheService.remove(this.endpoint);
    return response.data;
  }

  async update(id: string, data: Partial<CreateT>): Promise<T> {
    const response = await api.put<T>(`${this.endpoint}/${id}`, data);
    cacheService.remove(this.endpoint);
    cacheService.remove(`${this.endpoint}_${id}`);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.endpoint}/${id}`);
    cacheService.remove(this.endpoint);
    cacheService.remove(`${this.endpoint}_${id}`);
  }
}

// Auth service
export const authService = {
  login: async (email: string, password: string): Promise<Token> => {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const response = await api.post<Token>("/token", formData.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return response.data;
  },

  register: async (userData: FormData): Promise<User> => {
    const response = await api.post<User>("/registro", userData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<Token> => {
    try {
      const response = await api.post<Token>(`${BASE_URL}/token/renovar`, {
        token_actualizacion: refreshToken,
      });
      const { token_acceso, token_actualizacion } = response.data;
      setStoredToken(token_acceso, token_actualizacion);
      return response.data;
    } catch (error) {
      console.error("Error en refreshToken:", error);
      removeStoredToken();
      window.dispatchEvent(new CustomEvent("auth-error", { detail: "Error al renovar el token" }));
      throw error;
    }
  },

  logout: () => {
    removeStoredToken();
  },

  obtenerUsuarioActual: async (): Promise<User> => {
    const response = await api.get<User>("/usuarios/me");
    return {
      ...response.data,
      foto: getFullImageUrl(response.data.foto)
    };
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
    const response = await api.get<Cabecilla[]>(`${this.endpoint}/all`);
    return response.data.map(this.addFullImageUrl);
  }

  async getById(id: string): Promise<Cabecilla> {
    const cabecilla = await super.getById(id);
    return this.addFullImageUrl(cabecilla);
  }

  async create(cabecilla: FormData): Promise<Cabecilla> {
    const response = await api.post<Cabecilla>(this.endpoint, cabecilla, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return this.addFullImageUrl(response.data);
  }

  async update(id: string, cabecilla: FormData): Promise<Cabecilla> {
    const response = await api.put<Cabecilla>(`${this.endpoint}/${id}`, cabecilla, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return this.addFullImageUrl(response.data);
  }

  async updateFoto(id: string, foto: File): Promise<Cabecilla> {
    const formData = new FormData();
    formData.append('foto', foto);
    const response = await api.post<Cabecilla>(`${this.endpoint}/${id}/foto`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return this.addFullImageUrl(response.data);
  }

  async getSuggestions(field: string, value: string): Promise<string[]> {
    const response = await api.get<string[]>(`${this.endpoint}/suggestions`, {
      params: { field, value }
    });
    return response.data;
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

  async getAllNoPagination(): Promise<Provincia[]> {
    const cacheKey = `${this.endpoint}_all`;
    const cachedData = cacheService.get<Provincia[]>(cacheKey);

    if (cachedData) return cachedData;

    const response = await api.get<Provincia[]>(`${this.endpoint}/all`);
    cacheService.set(cacheKey, response.data);
    return response.data;
  }

  async getAll(page: number = 1, pageSize: number = 10, filters?: Record<string, unknown>): Promise<PaginatedResponse<Provincia>> {
    return super.getAll(page, pageSize, filters);
  }
}

export const provinciaService = new ProvinciaService();

// Resumen service
export const resumenService = {
  getPaginaPrincipal: async (): Promise<ResumenPrincipal> => {
    const cacheKey = "resumen_principal";
    const cachedData = cacheService.get<ResumenPrincipal>(cacheKey);

    if (cachedData) return cachedData;

    try {
      const response = await api.get<ResumenPrincipal>("/pagina-principal");
      cacheService.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error("Error al obtener el resumen principal:", error);
      throw error;
    }
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
      cacheService.remove(this.endpoint);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorDetail = error.response.data.detail;
        throw new Error(Array.isArray(errorDetail) ? errorDetail.map(err => err.msg).join(', ') : errorDetail || "Error creating user");
      }
      throw new Error("An unexpected error occurred");
    }
  }

  async updateRole(id: string, role: "admin" | "usuario"): Promise<User> {
    const response = await api.put<User>(`${this.endpoint}/${id}/rol`, null, {
      params: { nuevo_rol: role },
    });
    cacheService.remove(this.endpoint);
    cacheService.remove(`${this.endpoint}_${id}`);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/admin/usuarios/${id}`);
    cacheService.remove(this.endpoint);
    cacheService.remove(`${this.endpoint}_${id}`);
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
    console.error('Error checking user existence:', error);
    return false;
  }
};
