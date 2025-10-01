import { config } from '../config/env';

const USERS_API_BASE_URL = 'http://localhost:3004'; // users-service

// Tipos para la API de usuarios
export interface User {
  id: number;
  email: string;
  rol: 'admin' | 'medico';
  id_centro?: number;
  id_medico?: number;
  created_at: string;
  // Datos relacionados
  medico_nombres?: string;
  medico_apellidos?: string;
  centro_nombre?: string;
  centro_ciudad?: string;
}

export interface UserCreate {
  email: string;
  password: string;
  rol: 'admin' | 'medico';
  id_centro?: number;
  id_medico?: number;
}

export interface UserUpdate {
  email?: string;
  rol?: 'admin' | 'medico';
  id_centro?: number;
  id_medico?: number;
}

export class UsersApi {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch(`${USERS_API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    return response.json();
  }

  // Obtener todos los usuarios
  static async getUsuarios(): Promise<User[]> {
    return this.request<User[]>('/usuarios');
  }

  // Obtener usuario por ID
  static async getUsuarioById(id: number): Promise<User> {
    return this.request<User>(`/usuarios/${id}`);
  }

  // Crear usuario
  static async createUsuario(usuario: UserCreate): Promise<{ message: string; id: number }> {
    return this.request<{ message: string; id: number }>('/usuarios', {
      method: 'POST',
      body: JSON.stringify(usuario),
    });
  }

  // Actualizar usuario
  static async updateUsuario(id: number, usuario: UserUpdate): Promise<{ message: string }> {
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
}

export default UsersApi;
