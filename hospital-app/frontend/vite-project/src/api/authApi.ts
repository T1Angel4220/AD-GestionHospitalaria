import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, User, ChangePasswordRequest } from '../types/auth';
import { config } from '../config/env';

const AUTH_BASE_URL = config.authUrl; // Usar auth-service directamente

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
    const url = `${AUTH_BASE_URL}${endpoint}`;
    
    // Construir headers correctamente
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Agregar token si existe
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Agregar headers adicionales si existen
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    console.log('🌐 [AUTH API REQUEST] URL:', url);
    console.log('🌐 [AUTH API REQUEST] Headers:', headers);
    console.log('🌐 [AUTH API REQUEST] Body:', options.body);
    console.log('🌐 [AUTH API REQUEST] Method:', options.method);

    const response = await fetch(url, {
      ...options,
      headers: headers,
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
    } catch {
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
      rol: decoded.rol as 'admin' | 'medico',
      id_centro: decoded.id_centro,
      id_medico: decoded.id_medico,
      centro: {
        id: decoded.id_centro,
        nombre: '',
        ciudad: ''
      }
    };
  }

  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  static async register(userData: RegisterRequest): Promise<RegisterResponse> {
    return this.request<RegisterResponse>('/register', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    });
  }

  static async getProfile(): Promise<User> {
    return this.request<User>('/profile', {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  static async changePassword(passwordData: ChangePasswordRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>('/change-password', {
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

  // =========================
  // CRUD DE USUARIOS
  // =========================
  
  static async getUsuarios(): Promise<User[]> {
    return this.request<User[]>('/usuarios');
  }

  static async getUsuarioById(id: number): Promise<User> {
    return this.request<User>(`/usuarios/${id}`);
  }

  static async createUsuario(usuario: {
    email: string;
    password: string;
    rol: 'admin' | 'medico';
    id_centro?: number;
    id_medico?: number;
  }): Promise<{ message: string; id: number }> {
    console.log('🔄 [AUTH API] Enviando datos al backend:', usuario)
    console.log('🔄 [AUTH API] JSON stringificado:', JSON.stringify(usuario))
    console.log('🔄 [AUTH API] URL completa:', `${AUTH_BASE_URL}/usuarios`)
    
    const requestOptions = {
      method: 'POST',
      body: JSON.stringify(usuario),
    };
    
    console.log('🔄 [AUTH API] Opciones de request:', requestOptions)
    
    return this.request<{ message: string; id: number }>('/usuarios', requestOptions);
  }

  static async updateUsuario(id: number, usuario: {
    email?: string;
    rol?: 'admin' | 'medico';
    id_centro?: number;
    id_medico?: number;
  }): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/usuarios/${id}`, {
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
