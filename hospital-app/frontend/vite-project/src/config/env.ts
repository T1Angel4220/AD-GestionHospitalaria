// config/env.ts
export const config = {
  // URLs de servicios específicos (puertos actualizados de Docker)
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3002', // admin-service para CRUD (puerto 3002 según docker-compose)
  authUrl: import.meta.env.VITE_AUTH_URL || 'http://localhost:3001', // auth-service para autenticación
  consultasUrl: import.meta.env.VITE_CONSULTAS_URL || 'http://localhost:3003', // consultas-service (puerto 3003 según docker-compose)
  reportsUrl: import.meta.env.VITE_REPORTS_URL || 'http://localhost:3005', // reports-service
  appName: import.meta.env.VITE_APP_NAME || 'Sistema de Gestión Hospitalaria',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  debug: import.meta.env.VITE_DEBUG === 'true' || false,
  defaultCentroId: 1,
};

export default config;
