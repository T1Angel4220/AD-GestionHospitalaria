// Configuración de API para microservicios
export const API_CONFIG = {
  // API Gateway - Punto de entrada único
  GATEWAY_URL: process.env.VITE_API_GATEWAY_URL || 'http://localhost:3000',
  
  // Endpoints del API Gateway
  ENDPOINTS: {
    // Autenticación
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      VERIFY_TOKEN: '/api/auth/verify-token'
    },
    
    // Usuarios
    USERS: {
      LIST: '/api/users',
      CREATE: '/api/users',
      GET: (id) => `/api/users/${id}`,
      UPDATE: (id) => `/api/users/${id}`,
      DELETE: (id) => `/api/users/${id}`
    },
    
    // Pacientes
    PATIENTS: {
      LIST: '/api/patients',
      CREATE: '/api/patients',
      GET: (id) => `/api/patients/${id}`,
      UPDATE: (id) => `/api/patients/${id}`,
      DELETE: (id) => `/api/patients/${id}`,
      SEARCH: '/api/patients/search'
    },
    
    // Médicos
    DOCTORS: {
      LIST: '/api/doctors',
      CREATE: '/api/doctors',
      GET: (id) => `/api/doctors/${id}`,
      UPDATE: (id) => `/api/doctors/${id}`,
      DELETE: (id) => `/api/doctors/${id}`
    },
    
    // Centros
    CENTERS: {
      LIST: '/api/centers',
      CREATE: '/api/centers',
      GET: (id) => `/api/centers/${id}`,
      UPDATE: (id) => `/api/centers/${id}`,
      DELETE: (id) => `/api/centers/${id}`
    },
    
    // Especialidades
    SPECIALTIES: {
      LIST: '/api/specialties',
      CREATE: '/api/specialties',
      GET: (id) => `/api/specialties/${id}`,
      UPDATE: (id) => `/api/specialties/${id}`,
      DELETE: (id) => `/api/specialties/${id}`
    },
    
    // Empleados
    EMPLOYEES: {
      LIST: '/api/employees',
      CREATE: '/api/employees',
      GET: (id) => `/api/employees/${id}`,
      UPDATE: (id) => `/api/employees/${id}`,
      DELETE: (id) => `/api/employees/${id}`
    },
    
    // Consultas
    CONSULTATIONS: {
      LIST: '/api/consultations',
      CREATE: '/api/consultations',
      GET: (id) => `/api/consultations/${id}`,
      UPDATE: (id) => `/api/consultations/${id}`,
      DELETE: (id) => `/api/consultations/${id}`
    },
    
    // Reportes
    REPORTS: {
      LIST: '/api/reports',
      GENERATE: '/api/reports/generate',
      GET: (id) => `/api/reports/${id}`
    }
  }
};

// Función helper para construir URLs completas
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.GATEWAY_URL}${endpoint}`;
};

// Función helper para obtener headers de autenticación
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  };
};

export default API_CONFIG;
