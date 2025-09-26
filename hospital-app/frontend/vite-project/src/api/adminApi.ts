import { config } from '../config/env';

const API_BASE_URL = config.apiUrl;

// Tipos específicos para la API de administración
export interface AdminMedico {
  id: number;
  nombres: string;
  apellidos: string;
  id_especialidad: number;
  id_centro: number;
  especialidad_nombre?: string;
  centro_nombre?: string;
  centro_ciudad?: string;
  origen_bd?: string;
  id_unico?: string;
  id_frontend?: string;
}

export interface AdminMedicoCreate {
  nombres: string;
  apellidos: string;
  id_especialidad: number;
  id_centro: number;
}

export interface AdminMedicoUpdate {
  nombres: string;
  apellidos: string;
  id_especialidad: number;
  id_centro: number;
}

export interface AdminEmpleado {
  id: number;
  nombres: string;
  apellidos: string;
  cargo: string;
  id_centro: number;
  centro_nombre?: string;
  centro_ciudad?: string;
}

export interface AdminEmpleadoCreate {
  nombres: string;
  apellidos: string;
  cargo: string;
  id_centro: number;
}

export interface AdminEmpleadoUpdate {
  nombres?: string;
  apellidos?: string;
  cargo?: string;
  id_centro?: number;
}

export interface AdminCentro {
  id: number;
  nombre: string;
  ciudad: string;
  direccion?: string;
}

export interface AdminCentroCreate {
  nombre: string;
  ciudad: string;
  direccion?: string;
}

export interface AdminCentroUpdate {
  nombre?: string;
  ciudad?: string;
  direccion?: string;
}

export interface AdminEspecialidad {
  id: number;
  nombre: string;
}

export interface AdminEspecialidadCreate {
  nombre: string;
}

export interface AdminEspecialidadUpdate {
  nombre: string;
}

export interface AdminUsuario {
  id: number;
  email: string;
  rol: 'admin' | 'medico';
  id_centro: number;
  id_medico?: number;
  centro_nombre?: string;
  centro_ciudad?: string;
  medico_nombres?: string;
  medico_apellidos?: string;
}

export interface AdminUsuarioCreate {
  email: string;
  password: string;
  rol: 'admin' | 'medico';
  id_centro: number;
  id_medico?: number;
}

export interface AdminUsuarioUpdate {
  email?: string;
  password?: string;
  rol?: 'admin' | 'medico';
  id_centro?: number;
  id_medico?: number;
}

export class AdminApi {
  private static getAuthHeaders(centroId?: number): HeadersInit {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    console.log('🔍 Debug AdminApi getAuthHeaders:', {
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
    
    // Si es admin y se proporciona centroId, usar ese centro
    // Si es admin sin centroId, usar centro por defecto
    // Si es médico, usar su centro específico
    if (user?.rol === 'admin') {
      headers['X-Centro-Id'] = (centroId || user?.id_centro || 1).toString();
    } else {
      headers['X-Centro-Id'] = user?.id_centro?.toString() || '1';
    }
    
    return headers;
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}, centroId?: number): Promise<T> {
    const url = `${API_BASE_URL}/admin${endpoint}`;
    const response = await fetch(url, {
      headers: {
        ...this.getAuthHeaders(centroId),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    // Si la respuesta es 204 (No Content), no intentar parsear JSON
    if (response.status === 204) {
      return null as T;
    }

    // Verificar si hay contenido para parsear
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    // Si no es JSON, devolver el texto
    return response.text() as T;
  }

  // =========================
  // MÉDICOS
  // =========================
  static async getMedicos(): Promise<AdminMedico[]> {
    return this.request<AdminMedico[]>('/medicos');
  }

  static async getMedicoById(id: number): Promise<AdminMedico> {
    return this.request<AdminMedico>(`/medicos/${id}`);
  }

  static async createMedico(medico: AdminMedicoCreate, centroId?: number): Promise<AdminMedico> {
    return this.request<AdminMedico>('/medicos', {
      method: 'POST',
      body: JSON.stringify(medico),
    }, centroId);
  }

  static async updateMedico(id: number, medico: AdminMedicoUpdate, centroId?: number): Promise<AdminMedico> {
    return this.request<AdminMedico>(`/medicos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(medico),
    }, centroId);
  }

  static async deleteMedico(id: number, origenBd?: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/medicos/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ origen_bd: origenBd }),
    });
  }

  // =========================
  // EMPLEADOS
  // =========================
  static async getEmpleados(): Promise<AdminEmpleado[]> {
    return this.request<AdminEmpleado[]>('/empleados');
  }

  static async getEmpleadoById(id: number): Promise<AdminEmpleado> {
    return this.request<AdminEmpleado>(`/empleados/${id}`);
  }

  static async createEmpleado(empleado: AdminEmpleadoCreate): Promise<AdminEmpleado> {
    return this.request<AdminEmpleado>('/empleados', {
      method: 'POST',
      body: JSON.stringify(empleado),
    });
  }

  static async updateEmpleado(id: number, empleado: AdminEmpleadoUpdate): Promise<AdminEmpleado> {
    return this.request<AdminEmpleado>(`/empleados/${id}`, {
      method: 'PUT',
      body: JSON.stringify(empleado),
    });
  }

  static async deleteEmpleado(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/empleados/${id}`, {
      method: 'DELETE',
    });
  }

  // =========================
  // CENTROS MÉDICOS
  // =========================
  static async getCentros(): Promise<AdminCentro[]> {
    return this.request<AdminCentro[]>('/centros');
  }

  static async getCentroById(id: number): Promise<AdminCentro> {
    return this.request<AdminCentro>(`/centros/${id}`);
  }

  static async createCentro(centro: AdminCentroCreate): Promise<AdminCentro> {
    return this.request<AdminCentro>('/centros', {
      method: 'POST',
      body: JSON.stringify(centro),
    });
  }

  static async updateCentro(id: number, centro: AdminCentroUpdate): Promise<AdminCentro> {
    return this.request<AdminCentro>(`/centros/${id}`, {
      method: 'PUT',
      body: JSON.stringify(centro),
    });
  }

  static async deleteCentro(id: number): Promise<void> {
    return this.request<void>(`/centros/${id}`, {
      method: 'DELETE',
    });
  }

  // =========================
  // ESPECIALIDADES
  // =========================
  static async getEspecialidades(): Promise<AdminEspecialidad[]> {
    return this.request<AdminEspecialidad[]>('/especialidades');
  }

  static async getEspecialidadById(id: number): Promise<AdminEspecialidad> {
    return this.request<AdminEspecialidad>(`/especialidades/${id}`);
  }

  static async createEspecialidad(especialidad: AdminEspecialidadCreate): Promise<AdminEspecialidad> {
    return this.request<AdminEspecialidad>('/especialidades', {
      method: 'POST',
      body: JSON.stringify(especialidad),
    });
  }

  static async updateEspecialidad(id: number, especialidad: AdminEspecialidadUpdate): Promise<AdminEspecialidad> {
    return this.request<AdminEspecialidad>(`/especialidades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(especialidad),
    });
  }

  static async deleteEspecialidad(id: number): Promise<void> {
    return this.request<void>(`/especialidades/${id}`, {
      method: 'DELETE',
    });
  }

  // =========================
  // USUARIOS
  // =========================
  static async getUsuarios(): Promise<AdminUsuario[]> {
    return this.request<AdminUsuario[]>('/usuarios');
  }

  static async getUsuarioById(id: number): Promise<AdminUsuario> {
    return this.request<AdminUsuario>(`/usuarios/${id}`);
  }

  static async createUsuario(usuario: AdminUsuarioCreate): Promise<AdminUsuario> {
    return this.request<AdminUsuario>('/usuarios', {
      method: 'POST',
      body: JSON.stringify(usuario),
    });
  }

  static async updateUsuario(id: number, usuario: AdminUsuarioUpdate): Promise<AdminUsuario> {
    return this.request<AdminUsuario>(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(usuario),
    });
  }

  static async deleteUsuario(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/usuarios/${id}`, {
      method: 'DELETE',
    });
  }
}
