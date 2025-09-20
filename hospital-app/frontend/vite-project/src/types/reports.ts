// types/reports.ts
export interface ConsultaResumen {
  medico_id: number;
  nombres: string;
  apellidos: string;
  especialidad: string;
  total_consultas: number;
  primera_consulta: string | null;
  ultima_consulta: string | null;
}

export interface ConsultaDetalle {
  id: number;
  fecha: string;
  paciente_nombre: string;
  paciente_apellido: string;
  motivo: string | null;
  diagnostico: string | null;
  tratamiento: string | null;
}

export interface ReporteFiltros {
  desde?: string;
  hasta?: string;
  q?: string;
  centroId: number;
}

export interface EstadisticasReporte {
  totalConsultas: number;
  totalMedicos: number;
  promedioConsultasPorMedico: number;
  especialidadMasComun: string;
}

export interface GraficoData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
  }[];
}


