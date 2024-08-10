import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
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
  UserListResponse,
} from "../types";
import { cacheService } from "./cacheService";

const BASE_URL = "http://127.0.0.1:8000";

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
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
  (response) => {
    const newToken = response.headers["new-token"];
    if (newToken) {
      const refreshToken = getStoredToken("refreshToken");
      if (refreshToken) {
        setStoredToken(newToken, refreshToken);
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshTokenValue = getStoredToken("refreshToken");
        if (!refreshTokenValue) {
          throw new Error("No hay token de actualización disponible");
        }
        const newTokens = await refreshToken(refreshTokenValue);
        setStoredToken(newTokens.token_acceso, newTokens.token_actualizacion);
        api.defaults.headers.common["Authorization"] =
          "Bearer " + newTokens.token_acceso;
        processQueue(null, newTokens.token_acceso);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        removeStoredToken();
        window.dispatchEvent(
          new CustomEvent("auth-error", { detail: "Sesión expirada" })
        );
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export const login = async (email: string, password: string) => {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await api.post<Token>("/token", formData.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  return response.data;
};

export const register = async (userData: FormData): Promise<User> => {
  const response = await api.post<User>("/registro", userData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const refreshToken = async (refreshToken: string) => {
  console.log("Iniciando solicitud de renovación de token");
  try {
    const response = await axios.post<Token>(`${BASE_URL}/token/renovar`, {
      token_actualizacion: refreshToken,
    });
    const { token_acceso, token_actualizacion } = response.data;
    setStoredToken(token_acceso, token_actualizacion);
    return response.data;
  } catch (error) {
    console.error("Error en refreshToken:", error);
    if (axios.isAxiosError(error)) {
      console.error("Detalles del error:", error.response?.data);
    }
    removeStoredToken();
    window.dispatchEvent(
      new CustomEvent("auth-error", { detail: "Error al renovar el token" })
    );
    throw error;
  }
};

export const logout = () => {
  removeStoredToken();
};

export const obtenerUsuarioActual = async () => {
  const response = await api.get<User>("/usuarios/me");
  return response.data;
};

export const protestaService = {
  getAll: async (
    page: number = 1,
    pageSize: number = 10,
    filters?: Record<string, string>
  ) => {
    const cacheKey = `protestas_${JSON.stringify(filters)}`;
    const cachedData = cacheService.getPaginated<Protesta>(
      cacheKey,
      page,
      pageSize
    );

    if (cachedData) {
      return cachedData;
    }

    const response = await api.get<PaginatedResponse<Protesta>>("/protestas", {
      params: {
        page,
        page_size: pageSize,
        ...filters,
      },
    });
    cacheService.setPaginated(cacheKey, response.data, page, pageSize);
    return response.data;
  },
  getById: async (id: string) => {
    const cacheKey = `protesta_${id}`;
    const cachedData = cacheService.get<Protesta>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const response = await api.get<Protesta>(`/protestas/${id}`);
    cacheService.set(cacheKey, response.data);
    return response.data;
  },
  create: async (protesta: CrearProtesta) => {
    const response = await api.post<Protesta>("/protestas", protesta);
    cacheService.remove("protestas");
    return response.data;
  },
  update: async (id: string, protesta: CrearProtesta) => {
    const response = await api.put<Protesta>(`/protestas/${id}`, protesta);
    cacheService.remove("protestas");
    cacheService.remove(`protesta_${id}`);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/protestas/${id}`);
    cacheService.remove("protestas");
    cacheService.remove(`protesta_${id}`);
    return response.data;
  },
};

export const cabecillaService = {
  getAll: async (page: number = 1, pageSize: number = 10, filters?: Record<string, string>) => {
    const response = await api.get<PaginatedResponse<Cabecilla>>('/cabecillas', { 
      params: { 
        page, 
        page_size: pageSize, 
        ...filters 
      } 
    });
    return response.data;
  },
  getAllNoPagination: async () => {
    const response = await api.get<Cabecilla[]>('/cabecillas/all');
    return response.data;
  },
  getById: (id: string) => api.get<Cabecilla>(`/cabecillas/${id}`).then(res => res.data),
  create: (cabecilla: FormData) => api.post<Cabecilla>('/cabecillas', cabecilla, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(res => res.data),
  update: (id: string, cabecilla: FormData) => api.put<Cabecilla>(`/cabecillas/${id}`, cabecilla, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(res => res.data),
  delete: (id: string) => api.delete(`/cabecillas/${id}`).then(res => res.data),
  updateFoto: (id: string, foto: File) => {
    const formData = new FormData();
    formData.append('foto', foto);
    return api.post<Cabecilla>(`/cabecillas/${id}/foto`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data);
  },
};

export const naturalezaService = {
  getAll: async (
    page: number = 1,
    pageSize: number = 10,
    filters?: Record<string, string>
  ) => {
    const cacheKey = `naturalezas_${JSON.stringify(filters)}`;
    const cachedData = cacheService.getPaginated<Naturaleza>(
      cacheKey,
      page,
      pageSize
    );

    if (cachedData) {
      return cachedData;
    }

    const response = await api.get<PaginatedResponse<Naturaleza>>(
      "/naturalezas",
      {
        params: {
          page,
          page_size: pageSize,
          ...filters,
        },
      }
    );
    cacheService.setPaginated(cacheKey, response.data, page, pageSize);
    return response.data;
  },
  getById: async (id: string) => {
    const cacheKey = `naturaleza_${id}`;
    const cachedData = cacheService.get<Naturaleza>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const response = await api.get<Naturaleza>(`/naturalezas/${id}`);
    cacheService.set(cacheKey, response.data);
    return response.data;
  },
  create: async (naturaleza: CrearNaturaleza) => {
    const response = await api.post<Naturaleza>("/naturalezas", naturaleza);
    cacheService.remove("naturalezas");
    return response.data;
  },
  update: async (id: string, naturaleza: CrearNaturaleza) => {
    const response = await api.put<Naturaleza>(
      `/naturalezas/${id}`,
      naturaleza
    );
    cacheService.remove("naturalezas");
    cacheService.remove(`naturaleza_${id}`);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/naturalezas/${id}`);
    cacheService.remove("naturalezas");
    cacheService.remove(`naturaleza_${id}`);
    return response.data;
  },
};

export const provinciaService = {
  getAll: async () => {
    const cacheKey = "provincias";
    const cachedData = cacheService.get<Provincia[]>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const response = await api.get<Provincia[]>("/provincias");
    cacheService.set(cacheKey, response.data);
    return response.data;
  },
  getById: async (id: string) => {
    const cacheKey = `provincia_${id}`;
    const cachedData = cacheService.get<Provincia>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const response = await api.get<Provincia>(`/provincias/${id}`);
    cacheService.set(cacheKey, response.data);
    return response.data;
  },
};

export const resumenService = {
  getPaginaPrincipal: async () => {
    const cacheKey = "resumen_principal";
    const cachedData = cacheService.get<ResumenPrincipal>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await api.get<ResumenPrincipal>("/pagina-principal");
      cacheService.set(cacheKey, response.data);
      console.log("Respuesta de la API:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error al obtener el resumen principal:", error);
      throw error;
    }
  },
};

export const userService = {
  getAll: async (page: number = 1, pageSize: number = 10) => {
    const cacheKey = `usuarios_${page}_${pageSize}`;
    const cachedData = cacheService.get<UserListResponse>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const response = await api.get<UserListResponse>("/usuarios", {
      params: { page, page_size: pageSize },
    });
    cacheService.set(cacheKey, response.data);
    return response.data;
  },
  getById: async (id: string) => {
    const cacheKey = `usuario_${id}`;
    const cachedData = cacheService.get<User>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const response = await api.get<User>(`/usuarios/${id}`);
    cacheService.set(cacheKey, response.data);
    return response.data;
  },
  updateRole: async (id: string, role: "admin" | "usuario") => {
    const response = await api.put<User>(`/usuarios/${id}/rol`, null, {
      params: { nuevo_rol: role },
    });
    cacheService.remove("usuarios");
    cacheService.remove(`usuario_${id}`);
    return response.data;
  },
  create: async (userData: FormData) => {
  try {
    const response = await api.post<User>("/admin/usuarios", userData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    cacheService.remove("usuarios");
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorDetail = error.response.data.detail;
      if (Array.isArray(errorDetail)) {
        throw new Error(errorDetail.map(err => err.msg).join(', '));
      } else {
        throw new Error(errorDetail || "Error creating user");
      }
    }
    throw new Error("An unexpected error occurred");
  }
},
  delete: async (id: string) => {
    const response = await api.delete(`/admin/usuarios/${id}`);
    cacheService.remove("usuarios");
    cacheService.remove(`usuario_${id}`);
    return response.data;
  },
};
  