import { config } from '../config/env';

const USERS_BASE_URL = config.usersUrl;

export interface Usuario {
  id: number;
  email: string;
  rol: 'admin' | 'medico';
  id_centro: number;
  id_medico?: number;
  centro: {
    id: number;
    nombre: string;
    ciudad: string;
  };
  medico?: {
    id: number;
    nombres: string;
    apellidos: string;
    especialidad: string;
  };
  // Propiedades adicionales para compatibilidad con UsuarioAdmin
  origen_bd?: string;
  id_frontend?: string;
  centro_nombre?: string;
  medico_nombres?: string;
  medico_apellidos?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UsuarioCreate {
  email: string;
  password: string;
  rol: 'admin' | 'medico';
  id_centro: number;
  id_medico?: number;
}

export interface UsuarioUpdate {
  email?: string;
  rol?: 'admin' | 'medico';
  id_centro?: number;
  id_medico?: number;
}

export class UsersApi {
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
    
    return headers;
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${USERS_BASE_URL}${endpoint}`;
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers,
    };
    
    console.log('🌐 UsersApi Request:', {
      url,
      endpoint,
      headers,
      method: options.method || 'GET',
    });
    
    const response = await fetch(url, {
      headers,
      ...options,
    });

    console.log('📡 UsersApi Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ UsersApi Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ UsersApi Response data:', data);
    return data;
  }

  // Obtener todos los usuarios
  static async getUsuarios(): Promise<Usuario[]> {
    return this.request<Usuario[]>('/usuarios');
  }

  // Crear usuario
  static async createUsuario(usuario: UsuarioCreate): Promise<{ message: string; usuario: Usuario }> {
    return this.request<{ message: string; usuario: Usuario }>('/usuarios', {
      method: 'POST',
      body: JSON.stringify(usuario),
    });
  }

  // Actualizar usuario
  static async updateUsuario(id: number, usuario: UsuarioUpdate): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(usuario),
    });
  }

  // Eliminar usuario
  static async deleteUsuario(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/usuarios/${id}`, {
      method: 'DELETE',
    });
  }

  // Obtener médicos por centro (para asociar con usuarios)
  static async getMedicosByCentro(centroId: number): Promise<any[]> {
    return this.request<any[]>(`/medicos/centro/${centroId}`);
  }
}
