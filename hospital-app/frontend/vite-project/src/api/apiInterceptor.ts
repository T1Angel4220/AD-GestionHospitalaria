import { AuthApi } from './authApi';

// Interceptor para manejar respuestas de API
export class ApiInterceptor {
  private static instance: ApiInterceptor;
  private isIntercepting = false;

  private constructor() {}

  static getInstance(): ApiInterceptor {
    if (!ApiInterceptor.instance) {
      ApiInterceptor.instance = new ApiInterceptor();
    }
    return ApiInterceptor.instance;
  }

  // Interceptar respuestas de fetch
  intercept(): void {
    if (this.isIntercepting) return;
    
    this.isIntercepting = true;
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const [, options] = args;
      
      // Agregar token a las cabeceras si existe
      const token = AuthApi.getToken();
      if (token && options) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
        };
      }

      try {
        const response = await originalFetch(...args);
        
        // Si el token expiró, limpiar datos y redirigir
        if (response.status === 401 || response.status === 403) {
          AuthApi.logout();
          window.location.href = '/login';
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }

        return response;
      } catch (error) {
        throw error;
      }
    };
  }

  // Detener la interceptación
  stop(): void {
    this.isIntercepting = false;
  }
}

// Inicializar el interceptor
export const apiInterceptor = ApiInterceptor.getInstance();
