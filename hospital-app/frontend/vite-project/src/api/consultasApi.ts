import type { Consulta, ConsultaCreate, ConsultaUpdate, Medico, Especialidad, CentroMedico, Paciente } from '../types/consultas';
import { config } from '../config/env';

const API_BASE_URL = config.apiUrl;

export class ConsultasApi {
  private static getAuthHeaders(centroId?: number): HeadersInit {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    console.log('🔍 Debug getAuthHeaders:', {
      user,
      centroId: user?.centro?.id,
      id_centro: user?.id_centro,
      rol: user?.rol,
      token: token ? 'present' : 'missing',
      centroIdParam: centroId
    });
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
    
    // Si es admin y se proporciona centroId específico, usar ese centro
    // Si es admin sin centroId específico, NO enviar X-Centro-Id para ver todos los centros
    // Si es médico, usar su centro específico
    if (user?.rol === 'admin') {
      if (centroId) {
        headers['X-Centro-Id'] = centroId.toString();
      }
      // Si no se especifica centroId, no enviar el header para que el backend devuelva datos de todos los centros
    } else {
      headers['X-Centro-Id'] = user?.id_centro?.toString() || '1';
    }
    
    return headers;
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}, centroId?: number): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      ...this.getAuthHeaders(centroId),
      ...options.headers,
    };
    
    console.log('🌐 Request:', {
      url,
      endpoint,
      headers,
      method: options.method || 'GET',
      centroId
    });
    
    const response = await fetch(url, {
      headers,
      ...options,
    });

    console.log('📡 Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    // Verificar si la respuesta tiene contenido antes de parsear JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('✅ Response data:', data);
      return data;
    } else {
      // Si no es JSON, devolver la respuesta como texto o undefined
      const text = await response.text();
      console.log('✅ Response text:', text || 'Empty response');
      return (text || undefined) as T;
    }
  }

  static async getConsultas(): Promise<Consulta[]> {
    return this.request<Consulta[]>('/consultas');
  }

  static async getConsultaById(id: number): Promise<Consulta> {
    return this.request<Consulta>(`/consultas/${id}`);
  }

  static async createConsulta(consulta: ConsultaCreate, centroId?: number): Promise<Consulta> {
    return this.request<Consulta>('/consultas', {
      method: 'POST',
      body: JSON.stringify(consulta),
    }, centroId);
  }

  static async updateConsulta(id: number, consulta: ConsultaUpdate, centroId?: number): Promise<Consulta> {
    return this.request<Consulta>(`/consultas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(consulta),
    }, centroId);
  }

  static async deleteConsulta(id: number, centroId?: number): Promise<void> {
    return this.request<void>(`/consultas/${id}`, {
      method: 'DELETE',
    }, centroId);
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

  static async getPacientes(): Promise<Paciente[]> {
    return this.request<Paciente[]>('/consultas/pacientes');
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

  static async getUsuarios(): Promise<unknown[]> {
    return this.request<unknown[]>('/consultas/usuarios');
  }

  static async getMedicosDisponibles(): Promise<Medico[]> {
    return this.request<Medico[]>('/consultas/medicos-disponibles');
  }

  static async getMedicosPorCentro(centroId: number): Promise<Medico[]> {
    return this.request<Medico[]>(`/consultas/medicos-por-centro/${centroId}`);
  }

  static async getMedicosPorCentroEspecifico(centroId: number, origenBd: string): Promise<Medico[]> {
    return this.request<Medico[]>(`/consultas/medicos-por-centro/${centroId}/${origenBd}`);
  }

  static async createUsuario(usuario: {
    email: string;
    password: string;
    rol: 'admin' | 'medico';
    id_centro: number;
    id_medico?: number;
  }): Promise<unknown> {
    return this.request<unknown>('/consultas/usuarios', {
      method: 'POST',
      body: JSON.stringify(usuario),
    });
  }
}
