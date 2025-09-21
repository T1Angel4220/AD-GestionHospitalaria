import type { Consulta, ConsultaCreate, ConsultaUpdate, Medico, Especialidad, CentroMedico } from '../types/consultas';

const API_BASE_URL = 'http://localhost:3000/api';

export class ConsultasApi {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Centro-Id': '1', // Por ahora usamos centro 1, en una app real esto vendría del contexto del usuario
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

  static async getConsultas(): Promise<Consulta[]> {
    return this.request<Consulta[]>('/consultas');
  }

  static async getConsultaById(id: number): Promise<Consulta> {
    return this.request<Consulta>(`/consultas/${id}`);
  }

  static async createConsulta(consulta: ConsultaCreate): Promise<Consulta> {
    return this.request<Consulta>('/consultas', {
      method: 'POST',
      body: JSON.stringify(consulta),
    });
  }

  static async updateConsulta(id: number, consulta: ConsultaUpdate): Promise<Consulta> {
    return this.request<Consulta>(`/consultas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(consulta),
    });
  }

  static async deleteConsulta(id: number): Promise<void> {
    return this.request<void>(`/consultas/${id}`, {
      method: 'DELETE',
    });
  }

  static async getMedicos(): Promise<Medico[]> {
    return this.request<Medico[]>('/consultas/medicos');
  }

  static async getEspecialidades(): Promise<Especialidad[]> {
    return this.request<Especialidad[]>('/consultas/especialidades');
  }

  static async getCentros(): Promise<CentroMedico[]> {
    return this.request<CentroMedico[]>('/consultas/centros');
  }

  static async createMedico(medico: {
    nombres: string;
    apellidos: string;
    id_especialidad: number;
    id_centro: number;
  }): Promise<Medico> {
    return this.request<Medico>('/consultas/medicos', {
      method: 'POST',
      body: JSON.stringify(medico),
    });
  }
}
