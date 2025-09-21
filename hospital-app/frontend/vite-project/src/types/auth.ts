export interface User {
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
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  rol: 'admin' | 'medico';
  id_centro: number;
  id_medico?: number;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
