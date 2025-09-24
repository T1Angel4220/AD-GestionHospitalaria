import type { Paciente, PacienteCreate, PacienteUpdate, CentroMedico } from '../types/pacientes';
import { config } from '../config/env';

const API_BASE_URL = config.apiUrl;

export class PacientesApi {
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    console.log('🔍 Debug PacientesApi getAuthHeaders:', {
      user,
      centroId: user?.centro?.id,
      id_centro: user?.id_centro,
      token: token ? 'present' : 'missing'
    });
    
    return {
      'Content-Type': 'application/json',
      'X-Centro-Id': user?.centro?.id?.toString() || '1',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers,
    };
    
    console.log('🌐 PacientesApi Request:', {
      url,
      endpoint,
      headers,
      method: options.method || 'GET'
    });
    
    const response = await fetch(url, {
      headers,
      ...options,
    });

    console.log('📡 PacientesApi Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ PacientesApi Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ PacientesApi Response data:', data);
    return data;
  }

  static async getPacientes(): Promise<Paciente[]> {
    return this.request<Paciente[]>('/pacientes');
  }

  static async getPacienteById(id: number): Promise<Paciente> {
    return this.request<Paciente>(`/pacientes/${id}`);
  }

  static async createPaciente(paciente: PacienteCreate): Promise<Paciente> {
    return this.request<Paciente>('/pacientes', {
      method: 'POST',
      body: JSON.stringify(paciente),
    });
  }

  static async updatePaciente(id: number, paciente: PacienteUpdate): Promise<Paciente> {
    return this.request<Paciente>(`/pacientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(paciente),
    });
  }

  static async deletePaciente(id: number): Promise<void> {
    return this.request<void>(`/pacientes/${id}`, {
      method: 'DELETE',
    });
  }

  static async searchPacientes(query: string, centro?: number): Promise<Paciente[]> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (centro) {
      params.append('centro', centro.toString());
    }
    return this.request<Paciente[]>(`/pacientes/search?${params.toString()}`);
  }

  static async getCentros(): Promise<CentroMedico[]> {
    return this.request<CentroMedico[]>('/admin/centros');
  }
}
