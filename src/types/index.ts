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

export interface ResumenPrincipal {
  total_protestas: number;
  protestas_recientes: Protesta[];
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
