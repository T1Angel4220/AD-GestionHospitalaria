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

// Configuración para Docker/proxy
app.set('trust proxy', true);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuración de microservicios
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:3002',
  admin: process.env.ADMIN_SERVICE_URL || 'http://admin-service:3003',
  consultas: process.env.CONSULTAS_SERVICE_URL || 'http://consultas-service:3004',
  users: process.env.USERS_SERVICE_URL || 'http://users-service:3005',
  reports: process.env.REPORTS_SERVICE_URL || 'http://reports-service:3006'
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
// Ruta directa para login sin proxy
app.post('/api/auth/login', async (req, res) => {
  try {
    const response = await fetch(`${services.auth}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    logger.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Proxy para otras rutas de auth
app.use('/api/auth', createProxyMiddleware({
  target: services.auth,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': ''
  },
  timeout: 10000,
  proxyTimeout: 10000
}));

// ===== RUTAS DE ADMINISTRACIÓN =====
// Ruta específica para usuarios que debe ir al users-service
app.use('/api/admin/usuarios', authenticateToken, requireAdmin, createProxyMiddleware({
  target: services.users,
  changeOrigin: true,
  pathRewrite: {
    '^/api/admin/usuarios': '/usuarios'
  },
  onError: (err, req, res) => {
    logger.error('Error en Users Service (usuarios):', err);
    res.status(503).json({ error: 'Users Service no disponible' });
  }
}));

// Ruta específica para especialidades que debe ir al admin-service
app.use('/api/admin/especialidades', authenticateToken, requireAdmin, createProxyMiddleware({
  target: services.admin,
  changeOrigin: true,
  pathRewrite: {
    '^/api/admin/especialidades': '/especialidades'
  },
  onError: (err, req, res) => {
    logger.error('Error en Admin Service (especialidades):', err);
    res.status(503).json({ error: 'Admin Service no disponible' });
  }
}));


// Ruta específica para médicos que debe ir al admin-service
app.use('/api/admin/medicos', authenticateToken, requireAdmin, createProxyMiddleware({
  target: services.admin,
  changeOrigin: true,
  pathRewrite: {
    '^/api/admin/medicos': '/medicos'
  },
  onError: (err, req, res) => {
    logger.error('Error en Admin Service (medicos):', err);
    res.status(503).json({ error: 'Admin Service no disponible' });
  }
}));

// Ruta específica para pacientes que debe ir al admin-service
app.use('/api/admin/pacientes', authenticateToken, requireAdmin, createProxyMiddleware({
  target: services.admin,
  changeOrigin: true,
  pathRewrite: {
    '^/api/admin/pacientes': '/pacientes'
  },
  onError: (err, req, res) => {
    logger.error('Error en Admin Service (pacientes):', err);
    res.status(503).json({ error: 'Admin Service no disponible' });
  }
}));

// Ruta específica para pacientes sin /admin (para compatibilidad con frontend)
app.use('/api/pacientes', authenticateToken, requireAdmin, createProxyMiddleware({
  target: services.admin,
  changeOrigin: true,
  pathRewrite: {
    '^/api/pacientes': '/pacientes'
  },
  onError: (err, req, res) => {
    logger.error('Error en Admin Service (pacientes):', err);
    res.status(503).json({ error: 'Admin Service no disponible' });
  }
}));

// Otras rutas de admin van al admin-service
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
// Ruta específica para pacientes de consultas
app.use('/api/consultas/pacientes', authenticateToken, createProxyMiddleware({
  target: services.consultas,
  changeOrigin: true,
  pathRewrite: {
    '^/api/consultas/pacientes': '/pacientes-por-centro/1' // Centro por defecto para admin
  },
  onError: (err, req, res) => {
    logger.error('Error en Consultas Service (pacientes):', err);
    res.status(503).json({ error: 'Consultas Service no disponible' });
  }
}));

// Ruta específica para médicos de consultas
app.use('/api/consultas/medicos', authenticateToken, createProxyMiddleware({
  target: services.consultas,
  changeOrigin: true,
  pathRewrite: {
    '^/api/consultas/medicos': '/medicos-por-centro/1' // Centro por defecto para admin
  },
  onError: (err, req, res) => {
    logger.error('Error en Consultas Service (medicos):', err);
    res.status(503).json({ error: 'Consultas Service no disponible' });
  }
}));

// Otras rutas de consultas
app.use('/api/consultas', authenticateToken, createProxyMiddleware({
  target: services.consultas,
  changeOrigin: true,
  pathRewrite: {
    '^/api/consultas': '/consultas'
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
// Ruta específica para detalle de consultas por médico (DEBE IR ANTES que la ruta general)
app.use('/api/reports/consultas/:medicoId/detalle', authenticateToken, createProxyMiddleware({
  target: services.reports,
  changeOrigin: true,
  pathRewrite: (path, req) => {
    const medicoId = req.params.medicoId;
    return `/consultas/medico/${medicoId}`;
  },
  onError: (err, req, res) => {
    logger.error('Error en Reports Service (detalle consultas):', err);
    res.status(503).json({ error: 'Reports Service no disponible' });
  }
}));

// Ruta específica para consultas de reportes
app.use('/api/reports/consultas', authenticateToken, createProxyMiddleware({
  target: services.reports,
  changeOrigin: true,
  pathRewrite: {
    '^/api/reports/consultas': '/consultas/resumen'
  },
  onError: (err, req, res) => {
    logger.error('Error en Reports Service (consultas):', err);
    res.status(503).json({ error: 'Reports Service no disponible' });
  }
}));

// Ruta específica para pacientes frecuentes de reportes
app.use('/api/reports/pacientes', authenticateToken, createProxyMiddleware({
  target: services.reports,
  changeOrigin: true,
  pathRewrite: {
    '^/api/reports/pacientes': '/pacientes/frecuentes'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info('Proxying request to Reports Service (pacientes):', {
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl
    });
  },
  onError: (err, req, res) => {
    logger.error('Error en Reports Service (pacientes):', err);
    res.status(503).json({ error: 'Reports Service no disponible' });
  }
}));

// Otras rutas de reportes
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
      'POST /api/admin/usuarios',
      'GET /api/admin/centros'
    ]
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🌐 API Gateway iniciado en puerto ${PORT}`);
  logger.info(`🔗 Servicios configurados: ${Object.keys(services).join(', ')}`);
  logger.info(`📡 Frontend URL: ${process.env.FRONTEND_URL}`);
});

module.exports = app;