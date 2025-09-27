const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const winston = require('winston');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

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

// Middleware de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // máximo 1000 requests por IP
  message: 'Demasiadas solicitudes desde esta IP'
});
app.use(limiter);

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Middleware de logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Configuración de microservicios
const services = {
  auth: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    routes: ['/api/auth/*']
  },
  admin: {
    url: process.env.ADMIN_SERVICE_URL || 'http://localhost:3002',
    routes: ['/api/admin/*'],
    requiresAuth: true
  },
  consultas: {
    url: process.env.CONSULTAS_SERVICE_URL || 'http://localhost:3003',
    routes: ['/api/consultas/*'],
    requiresAuth: true
  },
  users: {
    url: process.env.USERS_SERVICE_URL || 'http://localhost:3004',
    routes: ['/api/users/*'],
    requiresAuth: true
  },
  reports: {
    url: process.env.REPORTS_SERVICE_URL || 'http://localhost:3005',
    routes: ['/api/reports/*'],
    requiresAuth: true
  }
};

// Configurar proxies para cada microservicio
Object.entries(services).forEach(([serviceName, config]) => {
  const proxyOptions = {
    target: config.url,
    changeOrigin: true,
    pathRewrite: {
      [`^/api/${serviceName}`]: ''
    },
    onError: (err, req, res) => {
      logger.error(`Error en ${serviceName}:`, err.message);
      res.status(503).json({ 
        error: `Servicio ${serviceName} no disponible`,
        service: serviceName
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      // Pasar headers importantes
      if (req.headers['x-centro-id']) {
        proxyReq.setHeader('X-Centro-Id', req.headers['x-centro-id']);
      }
      if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.id);
        proxyReq.setHeader('X-User-Role', req.user.rol);
      }
    }
  };

  // Aplicar middleware de autenticación si es requerido
  const middleware = config.requiresAuth ? [authenticateToken] : [];
  
  config.routes.forEach(route => {
    app.use(route, ...middleware, createProxyMiddleware(proxyOptions));
  });
});

// Ruta de salud del gateway
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: Object.keys(services)
  });
});

// Ruta de información del gateway
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Hospital API Gateway',
    version: '1.0.0',
    description: 'Gateway para microservicios del sistema hospitalario',
    services: Object.entries(services).map(([name, config]) => ({
      name,
      url: config.url,
      routes: config.routes,
      requiresAuth: config.requiresAuth
    }))
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  logger.error('Error en gateway:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`🚀 API Gateway iniciado en puerto ${PORT}`);
  logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  logger.info(`📋 Servicios configurados: ${Object.keys(services).join(', ')}`);
});

module.exports = app;
