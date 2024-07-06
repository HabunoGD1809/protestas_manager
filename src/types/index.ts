export interface User {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
}

export interface Protesta {
  id: string;
  nombre: string;
  resumen: string;
  fecha_evento: string;
  naturaleza: Naturaleza;
  provincia: Provincia;
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
