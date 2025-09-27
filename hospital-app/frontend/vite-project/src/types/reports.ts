export interface EstadisticasGenerales {
  total_medicos: number
  total_pacientes: number
  total_empleados: number
  total_consultas: number
  pacientes_con_consultas: number
  consultas_pendientes: number
  consultas_programadas: number
  consultas_completadas: number
  consultas_canceladas: number
  duracion_promedio_minutos: number
}

export interface ConsultasPorMedico {
  id_medico: number
  medico_nombres: string
  medico_apellidos: string
  especialidad_nombre: string
  total_consultas: number
  consultas_pendientes: number
  consultas_programadas: number
  consultas_completadas: number
  consultas_canceladas: number
  duracion_promedio_minutos: number
}

export interface ConsultasPorEspecialidad {
  id_especialidad: number
  especialidad_nombre: string
  total_consultas: number
  consultas_pendientes: number
  consultas_programadas: number
  consultas_completadas: number
  consultas_canceladas: number
  duracion_promedio_minutos: number
}

export interface ConsultasPorCentro {
  id_centro: number
  centro_nombre: string
  centro_ciudad: string
  total_consultas: number
  consultas_pendientes: number
  consultas_programadas: number
  consultas_completadas: number
  consultas_canceladas: number
  duracion_promedio_minutos: number
}

// Los tipos ReporteFiltros y ConsultaResumen están definidos en api/reports.ts