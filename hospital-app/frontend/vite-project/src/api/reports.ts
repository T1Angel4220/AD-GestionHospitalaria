// api/reports.ts - API calls para reportes
import { config } from '../config/env';

const API_BASE_URL = config.reportsUrl;

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface ConsultaResumen {
  id: number;
  medico_id: number;
  nombres: string;
  apellidos: string;
  especialidad: string;
  total_consultas: number;
  pacientes_unicos: number;
  primera_consulta: string | null;
  ultima_consulta: string | null;
}

export interface ConsultaDetalle {
  id: number;
  fecha: string;
  paciente_nombre: string;
  paciente_apellido: string;
  id_paciente: number | null;
  cedula: string | null;
  telefono: string | null;
  email: string | null;
  fecha_nacimiento: string | null;
  genero: 'M' | 'F' | 'O' | null;
  motivo: string | null;
  diagnostico: string | null;
  tratamiento: string | null;
  estado: 'pendiente' | 'programada' | 'completada' | 'cancelada';
  duracion_minutos: number;
}

export interface ReporteFiltros {
  desde?: string;
  hasta?: string;
  q?: string;
  centroId?: number;
}

export interface EstadisticasGenerales {
  total_medicos: number;
  total_pacientes: number;
  total_empleados: number;
  total_consultas: number;
  pacientes_con_consultas: number;
  consultas_pendientes: number;
  consultas_programadas: number;
  consultas_completadas: number;
  consultas_canceladas: number;
  duracion_promedio_minutos: number | null;
}

export interface PacienteFrecuente {
  id: number;
  nombres: string;
  apellidos: string;
  cedula: string | null;
  telefono: string | null;
  email: string | null;
  fecha_nacimiento: string | null;
  genero: 'M' | 'F' | 'O' | null;
  total_consultas: number;
  primera_consulta: string;
  ultima_consulta: string;
  medicos_atendidos: string | null;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    centroId?: number
  ): Promise<ApiResponse<T>> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }

      if (centroId) {
        (headers as Record<string, string>)["X-Centro-Id"] = centroId.toString();
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('API Error:', error);
      return { 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  // Reportes
  async getResumenConsultas(filtros: ReporteFiltros): Promise<ApiResponse<ConsultaResumen[]>> {
    const params = new URLSearchParams();
    
    if (filtros.desde) params.append('desde', filtros.desde);
    if (filtros.hasta) params.append('hasta', filtros.hasta);
    if (filtros.q) params.append('q', filtros.q);

    const queryString = params.toString();
    const endpoint = `/consultas/resumen${queryString ? `?${queryString}` : ''}`;

    return this.request<ConsultaResumen[]>(endpoint, { method: 'GET' }, filtros.centroId || 1);
  }

  async getDetalleConsultasMedico(
    medicoId: number,
    filtros: Omit<ReporteFiltros, 'centroId'>,
    centroId: number = 1
  ): Promise<ApiResponse<ConsultaDetalle[]>> {
    const params = new URLSearchParams();
    
    if (filtros.desde) params.append('desde', filtros.desde);
    if (filtros.hasta) params.append('hasta', filtros.hasta);
    if (filtros.q) params.append('q', filtros.q);

    const queryString = params.toString();
    const endpoint = `/consultas/medico/${medicoId}${queryString ? `?${queryString}` : ''}`;

    return this.request<ConsultaDetalle[]>(endpoint, { method: 'GET' }, centroId);
  }

  // Estadísticas generales
  async getEstadisticasGenerales(filtros: Omit<ReporteFiltros, 'q'>): Promise<ApiResponse<EstadisticasGenerales>> {
    const params = new URLSearchParams();
    
    if (filtros.desde) params.append('desde', filtros.desde);
    if (filtros.hasta) params.append('hasta', filtros.hasta);

    const queryString = params.toString();
    const endpoint = `/estadisticas${queryString ? `?${queryString}` : ''}`;

    return this.request<EstadisticasGenerales>(endpoint, { method: 'GET' }, filtros.centroId || 1);
  }

  // Pacientes más frecuentes
  async getPacientesFrecuentes(
    filtros: Omit<ReporteFiltros, 'q'>,
    limite: number = 10
  ): Promise<ApiResponse<PacienteFrecuente[]>> {
    const params = new URLSearchParams();
    
    if (filtros.desde) params.append('desde', filtros.desde);
    if (filtros.hasta) params.append('hasta', filtros.hasta);
    params.append('limite', limite.toString());

    const queryString = params.toString();
    const endpoint = `/pacientes/frecuentes${queryString ? `?${queryString}` : ''}`;

    return this.request<PacienteFrecuente[]>(endpoint, { method: 'GET' }, filtros.centroId || 1);
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ ok: boolean; module: string }>> {
    return this.request<{ ok: boolean; module: string }>('/health', { method: 'GET' });
  }
}

export const apiService = new ApiService();




