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
  estado: string;
  observaciones: string | null;
}

export interface PacienteFrecuente {
  id: number;
  nombres: string;
  apellidos: string;
  cedula: string;
  telefono: string | null;
  email: string | null;
  total_consultas: number;
  primera_consulta: string;
  ultima_consulta: string;
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
  duracion_promedio_minutos: number;
}

export interface ReporteFiltros {
  centroId?: number;
  desde?: string;
  hasta?: string;
  q?: string;
}

class ReportsService {
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
    
    if (user?.rol !== 'admin') {
      headers['X-Centro-Id'] = user?.id_centro?.toString() || '1';
    }
    
    return headers;
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers,
    };
    
    const response = await fetch(url, {
      headers,
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    return await response.json();
  }

  static async getResumenConsultas(filtros: ReporteFiltros): Promise<ConsultaResumen[]> {
    const params = new URLSearchParams();
    if (filtros.desde) params.append('desde', filtros.desde);
    if (filtros.hasta) params.append('hasta', filtros.hasta);
    if (filtros.q) params.append('q', filtros.q);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/consultas?${queryString}` : '/consultas';
    
    return this.request<ConsultaResumen[]>(endpoint);
  }

  static async getEstadisticasGenerales(filtros: ReporteFiltros): Promise<EstadisticasGenerales> {
    const params = new URLSearchParams();
    if (filtros.desde) params.append('desde', filtros.desde);
    if (filtros.hasta) params.append('hasta', filtros.hasta);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/estadisticas?${queryString}` : '/estadisticas';
    
    return this.request<EstadisticasGenerales>(endpoint);
  }

  static async getPacientesFrecuentes(filtros: ReporteFiltros, limit: number = 10): Promise<PacienteFrecuente[]> {
    const params = new URLSearchParams();
    if (filtros.desde) params.append('desde', filtros.desde);
    if (filtros.hasta) params.append('hasta', filtros.hasta);
    params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `/pacientes-frecuentes?${queryString}` : `/pacientes-frecuentes?limit=${limit}`;
    
    return this.request<PacienteFrecuente[]>(endpoint);
  }

  static async getDetalleConsultasMedico(medicoId: number, filtros: ReporteFiltros): Promise<ConsultaDetalle[]> {
    const params = new URLSearchParams();
    if (filtros.desde) params.append('desde', filtros.desde);
    if (filtros.hasta) params.append('hasta', filtros.hasta);
    if (filtros.q) params.append('q', filtros.q);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/consultas/${medicoId}/detalle?${queryString}` : `/consultas/${medicoId}/detalle`;
    
    return this.request<ConsultaDetalle[]>(endpoint);
  }
}

export const apiService = ReportsService;
