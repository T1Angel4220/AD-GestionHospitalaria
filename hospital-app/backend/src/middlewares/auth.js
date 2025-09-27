import jwt from 'jsonwebtoken';
import { CONFIG } from '../config/env';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Token de acceso requerido',
      code: 'NO_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET);
    
    // Verificar si el token ha expirado
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      return res.status(401).json({ 
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      rol: decoded.rol,
      id_centro: decoded.id_centro,
      id_medico: decoded.id_medico
    };
    next();
  } catch (error) {
    return res.status(403).json({ 
      error: 'Token inválido',
      code: 'INVALID_TOKEN'
    });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuario no autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ 
        error: 'Permisos insuficientes',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

export const requireCentroAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Usuario no autenticado',
      code: 'NOT_AUTHENTICATED'
    });
  }

  // Los admins pueden acceder a cualquier centro
  if (req.user.rol === 'admin') {
    return next();
  }

  // Los médicos solo pueden acceder a su centro
  const centroId = req.header('X-Centro-Id') || req.header('x-centro-id');
  if (!centroId) {
    return res.status(400).json({ 
      error: 'X-Centro-Id requerido',
      code: 'MISSING_CENTRO_ID'
    });
  }

  if (Number(centroId) !== req.user.id_centro) {
    return res.status(403).json({ 
      error: 'No tienes acceso a este centro médico',
      code: 'CENTRO_ACCESS_DENIED'
    });
  }

  next();
};
