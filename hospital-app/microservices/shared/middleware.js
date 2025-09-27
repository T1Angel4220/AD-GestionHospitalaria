const jwt = require('jsonwebtoken');
const config = require('./config');

// Middleware para extraer información del usuario del token
const extractUserInfo = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = decoded;
    } catch (error) {
      console.warn('Token inválido:', error.message);
    }
  }
  next();
};

// Middleware de autenticación requerida
const requireAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Middleware para verificar rol de administrador
const requireAdmin = (req, res, next) => {
  if (req.user?.rol !== 'admin') {
    return res.status(403).json({ error: 'Se requieren permisos de administrador' });
  }
  next();
};

// Middleware para verificar rol de médico
const requireMedico = (req, res, next) => {
  if (req.user?.rol !== 'medico') {
    return res.status(403).json({ error: 'Se requieren permisos de médico' });
  }
  next();
};

module.exports = {
  extractUserInfo,
  requireAuth,
  requireAdmin,
  requireMedico
};
