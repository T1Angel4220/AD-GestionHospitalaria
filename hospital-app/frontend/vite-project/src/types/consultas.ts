export interface Consulta {
  id: number;
  id_centro: number;
  id_medico: number;
  paciente_nombre: string;
  paciente_apellido: string;
  fecha: string;
  motivo?: string;
  diagnostico?: string;
  tratamiento?: string;
  estado: 'pendiente' | 'programada' | 'completada' | 'cancelada';
  created_at: string;
}

export interface ConsultaCreate {
  id_centro: number;
  id_medico: number;
  paciente_nombre: string;
  paciente_apellido: string;
  fecha: string;
  motivo?: string;
  diagnostico?: string;
  tratamiento?: string;
  estado?: 'pendiente' | 'programada' | 'completada' | 'cancelada';
}

export interface ConsultaUpdate {
  paciente_nombre?: string;
  paciente_apellido?: string;
  fecha?: string;
  motivo?: string;
  diagnostico?: string;
  tratamiento?: string;
  estado?: 'pendiente' | 'programada' | 'completada' | 'cancelada';
}

export interface Medico {
  id: number;
  nombres: string;
  apellidos: string;
  id_especialidad: number;
  id_centro: number;
}

export interface CentroMedico {
  id: number;
  nombre: string;
  ciudad: string;
  direccion?: string;
}
