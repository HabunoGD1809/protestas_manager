export interface User {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  foto?: string;
  rol: 'admin' | 'usuario';
}

export interface Protesta {
  id: string;
  nombre: string;
  naturaleza_id: string;
  provincia_id: string;
  resumen: string;
  fecha_evento: string;
  creado_por: string;
  fecha_creacion: string;
  soft_delete: boolean;
  cabecillas: Cabecilla[];
}

export interface Naturaleza {
  id: string;
  nombre: string;
  color: string;
  icono: string;
}

export interface Provincia {
  id: string;
  nombre: string;
}

export interface Cabecilla {
  id: string;
  foto?: string;
  nombre: string;
  apellido: string;
  cedula: string;
  telefono?: string;
  direccion?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}
export interface CrearProtesta {
  nombre: string;
  naturaleza_id: string;
  provincia_id: string;
  resumen: string;
  fecha_evento: string;
  cabecillas: string[];
}

export interface CrearNaturaleza {
  nombre: string;
  color: string;
  icono?: string;
}

// export interface CrearCabecilla {
//   nombre: string;
//   apellido: string;
//   cedula: string;
//   telefono?: string;
//   direccion?: string;
// }

export interface Token {
  token_acceso: string;
  token_actualizacion: string;
  tipo_token: string;
}

export interface UserListResponse {
  items: User[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// cambios en resumen principal
// Existing interfaces...
export interface ResumenPrincipal {
  totales: {
    protestas: number;
    usuarios: number;
    naturalezas: number;
    cabecillas: number;
  };
  protestas_recientes: ProtestasRecientes[];
  protestas_por_naturaleza: Record<string, number>;
  protestas_por_provincia: Record<string, number>;
  protestas_ultimos_30_dias: Record<string, string>;
  top_cabecillas: TopCabecilla[];
  usuarios_activos: UsuarioActivo[];
}

export interface ProtestasRecientes {
  id: string;
  nombre: string;
  fecha_evento: string;
  fecha_creacion: string;
}

export interface TopCabecilla {
  nombre: string;
  total_protestas: number;
}

export interface UsuarioActivo {
  nombre: string;
  protestas_creadas: number;
}
