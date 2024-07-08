export interface User {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  foto?: string;
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
  icono?: string;
}

export interface Provincia {
  id: string;
  nombre: string;
}

export interface Cabecilla {
  id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  telefono?: string;
  direccion?: string;
}
