import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, User, ChangePasswordRequest } from '../types/auth';
import { config } from '../config/env';

const API_BASE_URL = config.apiUrl;

// Interfaz para el token decodificado
interface DecodedToken {
  id: number;
  email: string;
  rol: string;
  id_centro: number;
  id_medico?: number;
  exp: number;
  iat: number;
}

export class AuthApi {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Agregar token a las cabeceras si existe
    const token = this.getToken();
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    // Si el token expiró, limpiar datos y redirigir
    if (response.status === 401 || response.status === 403) {
      this.logout();
      window.location.href = '/login';
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private static getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  // Función para decodificar JWT sin verificar (solo para obtener datos)
  private static decodeToken(token: string): DecodedToken | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  }

  // Verificar si el token es válido y no ha expirado
  static isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const decoded = this.decodeToken(token);
    if (!decoded) return false;

    // Verificar si el token ha expirado
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      this.logout();
      return false;
    }

    return true;
  }

  // Obtener información del usuario desde el token
  static getUserFromToken(): User | null {
    const token = this.getToken();
    if (!token) return null;

    const decoded = this.decodeToken(token);
    if (!decoded || decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: decoded.id,
      email: decoded.email,
      rol: decoded.rol,
      id_centro: decoded.id_centro,
      id_medico: decoded.id_medico,
      nombres: '', // Estos campos no están en el token
      apellidos: '',
      activo: true
    };
  }

  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  static async register(userData: RegisterRequest): Promise<RegisterResponse> {
    return this.request<RegisterResponse>('/auth/register', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    });
  }

  static async getProfile(): Promise<User> {
    return this.request<User>('/auth/profile', {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  static async changePassword(passwordData: ChangePasswordRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(passwordData),
    });
  }

  static logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  static getToken(): string | null {
    return localStorage.getItem('token');
  }

  static getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  static isAuthenticated(): boolean {
    return this.isTokenValid();
  }

  // Verificar si el usuario tiene un rol específico
  static hasRole(role: string): boolean {
    const user = this.getUser();
    return user?.rol === role;
  }

  // Verificar si el usuario tiene alguno de los roles especificados
  static hasAnyRole(roles: string[]): boolean {
    const user = this.getUser();
    return user ? roles.includes(user.rol) : false;
  }
}
