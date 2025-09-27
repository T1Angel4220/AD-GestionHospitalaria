// config/env.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  appName: import.meta.env.VITE_APP_NAME || 'Sistema de Gestión Hospitalaria',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  debug: import.meta.env.VITE_DEBUG === 'true' || false,
  defaultCentroId: 1,
};

export default config;
