const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/gateway.log' })
  ]
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Configuración de microservicios
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3002',
  admin: process.env.ADMIN_SERVICE_URL || 'http://localhost:3003',
  consultas: process.env.CONSULTAS_SERVICE_URL || 'http://localhost:3004',
  users: process.env.USERS_SERVICE_URL || 'http://localhost:3005',
  reports: process.env.REPORTS_SERVICE_URL || 'http://localhost:3006'
};

// Middleware de autenticación
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
}

// Middleware para verificar rol admin
function requireAdmin(req, res, next) {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador' });
  }
  next();
}

// Ruta de salud del API Gateway
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    services: Object.keys(services)
  });
});

// Ruta de información del sistema
app.get('/info', (req, res) => {
  res.json({
    name: 'Hospital Management System - API Gateway',
    version: '1.0.0',
    description: 'Gateway para microservicios del sistema hospitalario',
    services: services,
    timestamp: new Date().toISOString()
  });
});

// ===== RUTAS DE AUTENTICACIÓN =====
app.use('/api/auth', createProxyMiddleware({
  target: services.auth,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': ''
  },
  onError: (err, req, res) => {
    logger.error('Error en Auth Service:', err);
    res.status(503).json({ error: 'Auth Service no disponible' });
  }
}));

// ===== RUTAS DE ADMINISTRACIÓN =====
app.use('/api/admin', authenticateToken, requireAdmin, createProxyMiddleware({
  target: services.admin,
  changeOrigin: true,
  pathRewrite: {
    '^/api/admin': ''
  },
  onError: (err, req, res) => {
    logger.error('Error en Admin Service:', err);
    res.status(503).json({ error: 'Admin Service no disponible' });
  }
}));

// ===== RUTAS DE CONSULTAS =====
app.use('/api/consultas', authenticateToken, createProxyMiddleware({
  target: services.consultas,
  changeOrigin: true,
  pathRewrite: {
    '^/api/consultas': ''
  },
  onError: (err, req, res) => {
    logger.error('Error en Consultas Service:', err);
    res.status(503).json({ error: 'Consultas Service no disponible' });
  }
}));

// ===== RUTAS DE USUARIOS =====
app.use('/api/users', authenticateToken, requireAdmin, createProxyMiddleware({
  target: services.users,
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': ''
  },
  onError: (err, req, res) => {
    logger.error('Error en Users Service:', err);
    res.status(503).json({ error: 'Users Service no disponible' });
  }
}));

// ===== RUTAS DE REPORTES =====
app.use('/api/reports', authenticateToken, createProxyMiddleware({
  target: services.reports,
  changeOrigin: true,
  pathRewrite: {
    '^/api/reports': ''
  },
  onError: (err, req, res) => {
    logger.error('Error en Reports Service:', err);
    res.status(503).json({ error: 'Reports Service no disponible' });
  }
}));

// Ruta de prueba para verificar conectividad con microservicios
app.get('/api/test-services', async (req, res) => {
  const results = {};
  
  for (const [serviceName, serviceUrl] of Object.entries(services)) {
    try {
      const response = await fetch(`${serviceUrl}/health`);
      const data = await response.json();
      results[serviceName] = {
        status: 'OK',
        url: serviceUrl,
        data: data
      };
    } catch (error) {
      results[serviceName] = {
        status: 'ERROR',
        url: serviceUrl,
        error: error.message
      };
    }
  }
  
  res.json({
    gateway: 'OK',
    timestamp: new Date().toISOString(),
    services: results
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  logger.error('Error en API Gateway:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: 'El endpoint solicitado no existe',
    availableRoutes: [
      'GET /health',
      'GET /info',
      'GET /api/test-services',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/admin/medicos',
      'GET /api/admin/pacientes',
      'GET /api/admin/centros'
    ]
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`🌐 API Gateway iniciado en puerto ${PORT}`);
  logger.info(`🔗 Servicios configurados: ${Object.keys(services).join(', ')}`);
  logger.info(`📡 Frontend URL: ${process.env.FRONTEND_URL}`);
});

module.exports = app;