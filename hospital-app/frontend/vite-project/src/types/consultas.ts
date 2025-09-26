export interface Consulta {
  id: number;
  id_centro: number;
  id_medico: number;
  paciente_nombre: string;
  paciente_apellido: string;
  id_paciente?: number;
  fecha: string;
  motivo?: string;
  diagnostico?: string;
  tratamiento?: string;
  estado: 'pendiente' | 'programada' | 'completada' | 'cancelada';
  duracion_minutos?: number;
  created_at: string;
  // Datos relacionados
  medico_nombres?: string;
  medico_apellidos?: string;
  especialidad_nombre?: string;
  centro_nombre?: string;
  centro_ciudad?: string;
}

export interface ConsultaCreate {
  id_medico: number;
  paciente_nombre: string;
  paciente_apellido: string;
  id_paciente?: number;
  fecha: string;
  motivo?: string;
  diagnostico?: string;
  tratamiento?: string;
  estado?: 'pendiente' | 'programada' | 'completada' | 'cancelada';
  duracion_minutos?: number;
}

export interface ConsultaUpdate {
  paciente_nombre?: string;
  paciente_apellido?: string;
  id_paciente?: number;
  id_medico?: number;
  fecha?: string;
  motivo?: string;
  diagnostico?: string;
  tratamiento?: string;
  estado?: 'pendiente' | 'programada' | 'completada' | 'cancelada';
  duracion_minutos?: number;
}

export interface Medico {
  id: number;
  nombres: string;
  apellidos: string;
  id_especialidad: number;
  id_centro: number;
  especialidad_nombre?: string;
  centro_nombre?: string;
  // Campos para bases de datos distribuidas
  origen_bd?: string;
  id_unico?: string;
  id_frontend?: string;
}

export interface Especialidad {
  id: number;
  nombre: string;
}

export interface CentroMedico {
  id: number;
  nombre: string;
  ciudad: string;
  direccion?: string;
}

export interface Usuario {
  id: number;
  email: string;
  rol: 'admin' | 'medico';
  id_centro: number;
  id_medico?: number;
  centro_nombre?: string;
  medico_nombres?: string;
  medico_apellidos?: string;
}

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
  centro_nombre?: string;
  centro_ciudad?: string;
  consultas_activas?: number;
  medicos_activos?: string;
  // Campos para bases de datos distribuidas
  origen_bd?: string;
  id_unico?: string;
  id_frontend?: string;
}
