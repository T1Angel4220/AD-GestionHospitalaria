import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config/env';

// Interfaz para el token decodificado
interface DecodedToken {
  id: number;
  email: string;
  rol: string;
  id_centro: number;
  id_medico?: number;
  exp: number;
  iat: number;
}

// Middleware para verificar el token JWT
export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ 
      error: 'Token de acceso requerido',
      code: 'NO_TOKEN'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as DecodedToken;
    
    // Verificar si el token ha expirado
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      res.status(401).json({ 
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
      return;
    }

    // Agregar información del usuario al request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      rol: decoded.rol,
      id_centro: decoded.id_centro,
      id_medico: decoded.id_medico
    };

    next();
  } catch (error) {
    res.status(403).json({ 
      error: 'Token inválido',
      code: 'INVALID_TOKEN'
    });
  }
};

// Middleware para verificar roles específicos
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Usuario no autenticado',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    if (!roles.includes(req.user.rol)) {
      res.status(403).json({ 
        error: 'Permisos insuficientes',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    next();
  };
};

// Middleware para verificar acceso a centro específico
export const requireCentroAccess = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ 
      error: 'Usuario no autenticado',
      code: 'NOT_AUTHENTICATED'
    });
    return;
  }

  // Los admins pueden acceder a cualquier centro
  if (req.user.rol === 'admin') {
    next();
    return;
  }

  // Los médicos solo pueden acceder a su centro
  const centroId = req.header('X-Centro-Id') || req.header('x-centro-id');
  if (!centroId) {
    res.status(400).json({ 
      error: 'X-Centro-Id requerido',
      code: 'MISSING_CENTRO_ID'
    });
    return;
  }

  if (Number(centroId) !== req.user.id_centro) {
    res.status(403).json({ 
      error: 'No tienes acceso a este centro médico',
      code: 'CENTRO_ACCESS_DENIED'
    });
    return;
  }

  next();
};

// Middleware para verificar acceso a médico específico
export const requireMedicoAccess = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ 
      error: 'Usuario no autenticado',
      code: 'NOT_AUTHENTICATED'
    });
    return;
  }

  // Los admins pueden acceder a cualquier médico
  if (req.user.rol === 'admin') {
    next();
    return;
  }

  // Los médicos solo pueden acceder a sus propios datos
  const medicoId = req.params.id || req.body.id_medico;
  if (medicoId && Number(medicoId) !== req.user.id_medico) {
    res.status(403).json({ 
      error: 'No tienes acceso a este médico',
      code: 'MEDICO_ACCESS_DENIED'
    });
    return;
  }

  next();
};

// Middleware para verificar acceso a consulta específica
export const requireConsultaAccess = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ 
      error: 'Usuario no autenticado',
      code: 'NOT_AUTHENTICATED'
    });
    return;
  }

  // Los admins pueden acceder a cualquier consulta
  if (req.user.rol === 'admin') {
    next();
    return;
  }

  // Los médicos solo pueden acceder a sus propias consultas
  const consultaId = req.params.id;
  if (consultaId) {
    // Aquí deberías verificar en la base de datos si la consulta pertenece al médico
    // Por ahora, asumimos que el middleware de base de datos lo manejará
    next();
    return;
  }

  next();
};

// Middleware para verificar acceso a usuario específico
export const requireUserAccess = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ 
      error: 'Usuario no autenticado',
      code: 'NOT_AUTHENTICATED'
    });
    return;
  }

  // Los admins pueden acceder a cualquier usuario
  if (req.user.rol === 'admin') {
    next();
    return;
  }

  // Los médicos solo pueden acceder a sus propios datos
  const userId = req.params.id;
  if (userId && Number(userId) !== req.user.id) {
    res.status(403).json({ 
      error: 'No tienes acceso a este usuario',
      code: 'USER_ACCESS_DENIED'
    });
    return;
  }

  next();
};

// Middleware para verificar acceso a centro específico por ID
export const requireCentroAccessById = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ 
      error: 'Usuario no autenticado',
      code: 'NOT_AUTHENTICATED'
    });
    return;
  }

  // Los admins pueden acceder a cualquier centro
  if (req.user.rol === 'admin') {
    next();
    return;
  }

  // Los médicos solo pueden acceder a su centro
  const centroId = req.params.id || req.body.id_centro;
  if (centroId && Number(centroId) !== req.user.id_centro) {
    res.status(403).json({ 
      error: 'No tienes acceso a este centro médico',
      code: 'CENTRO_ACCESS_DENIED'
    });
    return;
  }

  next();
};
