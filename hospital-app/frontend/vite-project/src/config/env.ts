// config/env.ts
export const config = {
  // URLs usando microservicios directamente (puertos según docker-compose)
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3002', // admin-service para CRUD
  authUrl: import.meta.env.VITE_AUTH_URL || 'http://localhost:3001', // auth-service para autenticación
  consultasUrl: import.meta.env.VITE_CONSULTAS_URL || 'http://localhost:3003', // consultas-service
  reportsUrl: import.meta.env.VITE_REPORTS_URL || 'http://localhost:3005', // reports-service
  usersUrl: import.meta.env.VITE_USERS_URL || 'http://localhost:3004', // users-service para gestión de usuarios
  appName: import.meta.env.VITE_APP_NAME || 'Sistema de Gestión Hospitalaria',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  debug: import.meta.env.VITE_DEBUG === 'true' || false,
  defaultCentroId: 1,
};

export default config;
