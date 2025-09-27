const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const compression = require('compression');
const winston = require('winston');

// Configuración de logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP por ventana
  message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.'
});
app.use(limiter);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Middleware de logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Configuración de servicios
const services = {
  auth: {
    target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    pathRewrite: { '^/api/auth': '' }
  },
  admin: {
    target: process.env.ADMIN_SERVICE_URL || 'http://localhost:3002',
    pathRewrite: { '^/api/admin': '' }
  },
  medico: {
    target: process.env.MEDICO_SERVICE_URL || 'http://localhost:3003',
    pathRewrite: { '^/api/medico': '' }
  }
};

// Rutas públicas (no requieren autenticación)
app.use('/api/auth', createProxyMiddleware(services.auth));

// Rutas de administración (requieren autenticación y rol admin)
app.use('/api/admin', authenticateToken, (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Se requieren permisos de administrador' });
  }
  next();
}, createProxyMiddleware(services.admin));

// Rutas de médico (requieren autenticación y rol medico)
app.use('/api/medico', authenticateToken, (req, res, next) => {
  if (req.user.rol !== 'medico') {
    return res.status(403).json({ error: 'Se requieren permisos de médico' });
  }
  next();
}, createProxyMiddleware(services.medico));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    services: Object.keys(services)
  });
});

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    message: 'API Gateway - Sistema Hospitalario',
    version: '1.0.0',
    services: Object.keys(services),
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  logger.error('Error en API Gateway:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  logger.info(`API Gateway ejecutándose en puerto ${PORT}`);
  console.log(`🚀 API Gateway ejecutándose en puerto ${PORT}`);
  console.log('Servicios disponibles:', Object.keys(services));
});

module.exports = app;