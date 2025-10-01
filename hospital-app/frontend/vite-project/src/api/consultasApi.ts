import type { Consulta, ConsultaCreate, ConsultaUpdate, Medico, Especialidad, CentroMedico, Paciente } from '../types/consultas';
import { config } from '../config/env';

const CONSULTAS_BASE_URL = config.consultasUrl; // Usar consultas-service directamente
const ADMIN_BASE_URL = config.apiUrl;

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
    const url = `${CONSULTAS_BASE_URL}${endpoint}`;
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

  // Método separado para requests al admin-service
  private static async requestAdmin<T>(endpoint: string, options: RequestInit = {}, centroId?: number): Promise<T> {
    const url = `${ADMIN_BASE_URL}${endpoint}`;
    const headers = {
      ...this.getAuthHeaders(centroId),
      ...options.headers,
    };
    
    console.log('🌐 Admin Request:', {
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

    console.log('📡 Admin Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Admin Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    // Verificar si la respuesta tiene contenido antes de parsear JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('✅ Admin Response data:', data);
      return data;
    } else {
      // Si no es JSON, devolver la respuesta como texto o undefined
      const text = await response.text();
      console.log('✅ Admin Response text:', text || 'Empty response');
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

  static async getMedicos(centroId?: number): Promise<Medico[]> {
    // Si no se proporciona centroId, usar el centro del usuario autenticado
    if (!centroId) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        centroId = user.id_centro || 1; // Usar el centro del usuario o 1 por defecto
      } else {
        centroId = 1; // Centro por defecto si no hay usuario autenticado
      }
    }
    return this.request<Medico[]>(`/medicos-por-centro/${centroId}`);
  }

  static async getEspecialidades(): Promise<Especialidad[]> {
    // Las especialidades se obtienen del admin-service, no del consultas-service
    return this.requestAdmin<Especialidad[]>('/especialidades');
  }

  static async getCentros(): Promise<CentroMedico[]> {
    // Los centros se obtienen del admin-service, no del consultas-service
    return this.requestAdmin<CentroMedico[]>('/centros');
  }

  static async getPacientes(): Promise<Paciente[]> {
    return this.request<Paciente[]>('/pacientes');
  }

  static async createMedico(medico: {
    nombres: string;
    apellidos: string;
    cedula: string;
    telefono?: string;
    email?: string;
    id_especialidad: number;
    id_centro: number;
  }): Promise<Medico> {
    // Los médicos se crean en el admin-service, no en el consultas-service
    return this.requestAdmin<Medico>('/medicos', {
      method: 'POST',
      body: JSON.stringify(medico),
    });
  }

  static async getUsuarios(): Promise<unknown[]> {
    // Los usuarios se obtienen del admin-service como empleados
    return this.requestAdmin<unknown[]>('/empleados');
  }

  static async getMedicosDisponibles(centroId?: number): Promise<Medico[]> {
    // Si no se proporciona centroId, usar el centro del usuario autenticado
    if (!centroId) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        centroId = user.id_centro || 1; // Usar el centro del usuario o 1 por defecto
      } else {
        centroId = 1; // Centro por defecto si no hay usuario autenticado
      }
    }
    return this.request<Medico[]>(`/medicos-por-centro/${centroId}`);
  }

  static async getMedicosPorCentro(centroId: number): Promise<Medico[]> {
    return this.request<Medico[]>(`/medicos-por-centro/${centroId}`);
  }

  static async getMedicosPorCentroEspecifico(centroId: number, origenBd: string): Promise<Medico[]> {
    // El consultas-service no tiene endpoint específico por origen de BD
    return this.request<Medico[]>(`/medicos-por-centro/${centroId}`);
  }

  static async createUsuario(usuario: {
    email: string;
    password: string;
    rol: 'admin' | 'medico';
    id_centro: number;
    id_medico?: number;
  }): Promise<unknown> {
    // Los usuarios se crean en el admin-service como empleados
    return this.requestAdmin<unknown>('/empleados', {
      method: 'POST',
      body: JSON.stringify(usuario),
    });
  }
}
