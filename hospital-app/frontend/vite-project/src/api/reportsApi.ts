import type { EstadisticasGenerales, ConsultasPorMedico, ConsultasPorEspecialidad, ConsultasPorCentro } from '../types/reports';
import { config } from '../config/env';

const REPORTS_BASE_URL = config.reportsUrl; // Usar reports-service directamente

export class ReportsApi {
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    console.log('🔍 Debug ReportsApi getAuthHeaders:', {
      user,
      centroId: user?.centro?.id,
      id_centro: user?.id_centro,
      rol: user?.rol,
      token: token ? 'present' : 'missing'
    });
    
    // Si es admin, no enviar X-Centro-Id para que vea todos los datos
    // Si es médico, enviar su centro específico
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
    const url = `${REPORTS_BASE_URL}${endpoint}`;
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers,
    };
    
    console.log('🌐 ReportsApi Request:', {
      url,
      endpoint,
      headers,
      method: options.method || 'GET'
    });
    
    const response = await fetch(url, {
      headers,
      ...options,
    });

    console.log('📡 ReportsApi Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ReportsApi Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ ReportsApi Response data:', data);
    return data;
  }

  static async getEstadisticasGenerales(desde?: string, hasta?: string): Promise<EstadisticasGenerales> {
    const params = new URLSearchParams();
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/reports/estadisticas?${queryString}` : '/reports/estadisticas';
    
    return this.request<EstadisticasGenerales>(endpoint);
  }

  static async getConsultasPorMedico(desde?: string, hasta?: string): Promise<ConsultasPorMedico[]> {
    const params = new URLSearchParams();
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/reports/consultas-medico?${queryString}` : '/reports/consultas-medico';
    
    return this.request<ConsultasPorMedico[]>(endpoint);
  }

  static async getConsultasPorEspecialidad(desde?: string, hasta?: string): Promise<ConsultasPorEspecialidad[]> {
    const params = new URLSearchParams();
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/reports/consultas-especialidad?${queryString}` : '/reports/consultas-especialidad';
    
    return this.request<ConsultasPorEspecialidad[]>(endpoint);
  }

  static async getConsultasPorCentro(desde?: string, hasta?: string): Promise<ConsultasPorCentro[]> {
    const params = new URLSearchParams();
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/reports/consultas-centro?${queryString}` : '/reports/consultas-centro';
    
    return this.request<ConsultasPorCentro[]>(endpoint);
  }
}
