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
      
      // Solo agregar token si no hay cabeceras de autorización ya presentes
      const token = AuthApi.getToken();
      if (token && options) {
        const existingHeaders = options.headers || {};
        const hasAuth = (existingHeaders as any)['Authorization'] || (existingHeaders as any)['authorization'];
        
        // Solo agregar token si no está presente Y si no es una petición al auth-service
        const url = args[0];
        const isAuthService = typeof url === 'string' && url.includes('localhost:3001');
        
        if (!hasAuth && !isAuthService) {
          options.headers = {
            'Content-Type': 'application/json',
            ...existingHeaders,
            'Authorization': `Bearer ${token}`,
          };
        }
      }

      try {
        const response = await originalFetch(...args);
        
        // Solo redirigir en casos específicos de autenticación/autorización
        if (response.status === 401) {
          // 401 siempre significa token inválido o expirado
          AuthApi.logout();
          window.location.href = '/login';
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        
        if (response.status === 403) {
          // Para 403, verificar si es un problema de autenticación o permisos
          const url = args[0];
          const isAuthEndpoint = typeof url === 'string' && (
            url.includes('/login') || 
            url.includes('/auth') ||
            url.includes('/register')
          );
          
          // Solo redirigir si es un endpoint de autenticación
          if (isAuthEndpoint) {
            AuthApi.logout();
            window.location.href = '/login';
            throw new Error('Acceso denegado. Por favor, inicia sesión nuevamente.');
          }
          
          // Para otros endpoints 403, dejar que la aplicación maneje el error
          console.warn('Error 403 en endpoint:', url, '- Dejando que la aplicación maneje el error');
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
