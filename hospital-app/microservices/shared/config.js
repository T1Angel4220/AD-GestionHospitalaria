// Configuración compartida para todos los microservicios
module.exports = {
  // Configuración de bases de datos
  databases: {
    central: {
      host: process.env.CENTRAL_DB_HOST || 'localhost',
      user: process.env.CENTRAL_DB_USER || 'root',
      password: process.env.CENTRAL_DB_PASSWORD || '',
      database: process.env.CENTRAL_DB_NAME || 'hospital_central',
      port: process.env.CENTRAL_DB_PORT || 3306
    },
    guayaquil: {
      host: process.env.GUAYAQUIL_DB_HOST || 'localhost',
      user: process.env.GUAYAQUIL_DB_USER || 'root',
      password: process.env.GUAYAQUIL_DB_PASSWORD || '',
      database: process.env.GUAYAQUIL_DB_NAME || 'hospital_guayaquil',
      port: process.env.GUAYAQUIL_DB_PORT || 3306
    },
    cuenca: {
      host: process.env.CUENCA_DB_HOST || 'localhost',
      user: process.env.CUENCA_DB_USER || 'root',
      password: process.env.CUENCA_DB_PASSWORD || '',
      database: process.env.CUENCA_DB_NAME || 'hospital_cuenca',
      port: process.env.CUENCA_DB_PORT || 3306
    }
  },

  // Configuración de logging
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'combined'
  },

  // Configuración de JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'secret',
    expiresIn: '24h'
  },

  // Configuración de rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // máximo 100 requests por IP por ventana
  },

  // Configuración de CORS
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }
};
