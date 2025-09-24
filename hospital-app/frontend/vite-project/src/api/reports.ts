// api/reports.ts - API calls para reportes
import { config } from '../config/env';

const API_BASE_URL = config.apiUrl;

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
  estado: 'pendiente' | 'programada' | 'completada' | 'cancelada';
}

export interface ReporteFiltros {
  desde?: string;
  hasta?: string;
  q?: string;
  centroId: number;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    centroId?: number
  ): Promise<ApiResponse<T>> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (centroId) {
        (headers as any)["X-Centro-Id"] = centroId.toString();
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
    const endpoint = `/reports/consultas${queryString ? `?${queryString}` : ''}`;

    return this.request<ConsultaResumen[]>(endpoint, { method: 'GET' }, filtros.centroId);
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
    const endpoint = `/reports/consultas/${medicoId}/detalle${queryString ? `?${queryString}` : ''}`;

    return this.request<ConsultaDetalle[]>(endpoint, { method: 'GET' }, centroId);
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ ok: boolean; module: string }>> {
    return this.request<{ ok: boolean; module: string }>('/reports/health', { method: 'GET' });
  }
}

export const apiService = new ApiService();




