export interface Paciente {
  id: number;
  nombres: string;
  apellidos: string;
  cedula?: string;
  telefono?: string;
  email?: string;
  fecha_nacimiento?: string;
  genero?: 'M' | 'F' | 'O';
  direccion?: string;
  id_centro: number;
  created_at: string;
  updated_at: string;
  // Datos relacionados
  centro_nombre?: string;
  centro_ciudad?: string;
}

export interface PacienteCreate {
  nombres: string;
  apellidos: string;
  cedula?: string;
  telefono?: string;
  email?: string;
  fecha_nacimiento?: string;
  genero?: 'M' | 'F' | 'O';
  direccion?: string;
  id_centro: number;
}

export interface PacienteUpdate {
  nombres?: string;
  apellidos?: string;
  cedula?: string;
  telefono?: string;
  email?: string;
  fecha_nacimiento?: string;
  genero?: 'M' | 'F' | 'O';
  direccion?: string;
  id_centro?: number;
}

export interface CentroMedico {
  id: number;
  nombre: string;
  ciudad: string;
  direccion?: string;
}
