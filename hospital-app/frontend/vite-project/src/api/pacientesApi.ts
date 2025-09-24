import type { Paciente, PacienteCreate, PacienteUpdate, CentroMedico } from '../types/pacientes';
import { config } from '../config/env';

const API_BASE_URL = config.apiUrl;

export class PacientesApi {
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    return {
      'Content-Type': 'application/json',
      'X-Centro-Id': user?.id_centro?.toString() || '1',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    return response.json();
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
