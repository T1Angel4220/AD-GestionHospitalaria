// src/middlewares/databaseSelector.ts
import { Request, Response, NextFunction } from 'express';
import { getPoolByCentro, getCentralPool, getConnectionInfo } from '../config/distributedDb';

// Extender el tipo Request para incluir la información de la base de datos
declare global {
  namespace Express {
    interface Request {
      dbPool?: any;
      dbInfo?: {
        host: string;
        database: string;
        user: string;
        centroId: number;
      };
    }
  }
}

/**
 * Middleware para seleccionar la base de datos correcta según el centro médico
 * 
 * Lógica:
 * - Endpoints de administración (/admin/*) → Siempre usan BD central
 * - Endpoints de auth → Siempre usan BD central
 * - Endpoints de consultas (/consultas) → BD local según X-Centro-Id, o BD central si no hay header
 * - Endpoints de reportes (/reports) → BD local según X-Centro-Id, o BD central si no hay header
 * - Endpoints de pacientes (/pacientes) → BD local según X-Centro-Id, o BD central si no hay header
 * 
 * Nota: Si no hay X-Centro-Id, se usa BD central (para admin que ve todos los datos)
 */
export function databaseSelector(req: Request, res: Response, next: NextFunction) {
  try {
    const path = req.path;
    const centroIdHeader = req.headers['x-centro-id'] || req.headers['X-Centro-Id'];
    
    // Determinar qué base de datos usar según el endpoint
    if (path.startsWith('/api/admin/') || path.startsWith('/api/auth/')) {
      // Endpoints de administración y autenticación → BD central
      req.dbPool = getCentralPool();
      req.dbInfo = {
        host: process.env.CENTRAL_DB_HOST || 'unknown',
        database: process.env.CENTRAL_DB_NAME || 'unknown',
        user: process.env.CENTRAL_DB_USER || 'unknown',
        centroId: 1 // Quito (Central)
      };
      
      console.log(`🏥 [DB] Usando BD CENTRAL para ${path}`);
      
    } else if (path.startsWith('/api/consultas') || path.startsWith('/api/reports') || path.startsWith('/api/pacientes')) {
      // Endpoints de consultas, reportes y pacientes → BD local según X-Centro-Id
      // Si no hay X-Centro-Id, usar BD central (para admin)
      
      if (!centroIdHeader) {
        // Sin X-Centro-Id → BD central (para admin que ve todos los datos)
        req.dbPool = getCentralPool();
        req.dbInfo = {
          host: process.env.CENTRAL_DB_HOST || 'unknown',
          database: process.env.CENTRAL_DB_NAME || 'unknown',
          user: process.env.CENTRAL_DB_USER || 'unknown',
          centroId: 1 // Quito (Central)
        };
        console.log(`🏥 [DB] Usando BD CENTRAL (sin X-Centro-Id) para ${path}`);
        next();
        return;
      }
      
      const centroId = parseInt(centroIdHeader as string);
      
      if (isNaN(centroId) || centroId < 1 || centroId > 3) {
        return res.status(400).json({
          error: 'X-Centro-Id inválido',
          details: 'El centro ID debe ser 1 (Quito), 2 (Guayaquil) o 3 (Cuenca)'
        });
      }
      
      req.dbPool = getPoolByCentro(centroId);
      req.dbInfo = {
        ...getConnectionInfo(centroId),
        centroId: centroId
      };
      
      const centroNames = { 1: 'Quito', 2: 'Guayaquil', 3: 'Cuenca' };
      console.log(`🏥 [DB] Usando BD LOCAL (${centroNames[centroId as keyof typeof centroNames]}) para ${path}`);
      
    } else {
      // Otros endpoints → BD central por defecto
      req.dbPool = getCentralPool();
      req.dbInfo = {
        host: process.env.CENTRAL_DB_HOST || 'unknown',
        database: process.env.CENTRAL_DB_NAME || 'unknown',
        user: process.env.CENTRAL_DB_USER || 'unknown',
        centroId: 1
      };
      
      console.log(`🏥 [DB] Usando BD CENTRAL (default) para ${path}`);
    }
    
    next();
    
  } catch (error) {
    console.error('❌ [DB] Error en databaseSelector:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: 'Error al seleccionar la base de datos'
    });
  }
}

/**
 * Middleware para endpoints que requieren X-Centro-Id
 */
export function requireCentroId(req: Request, res: Response, next: NextFunction) {
  const centroIdHeader = req.headers['x-centro-id'] || req.headers['X-Centro-Id'];
  
  if (!centroIdHeader) {
    return res.status(400).json({
      error: 'X-Centro-Id header requerido',
      details: 'Este endpoint requiere el header X-Centro-Id'
    });
  }
  
  const centroId = parseInt(centroIdHeader as string);
  
  if (isNaN(centroId) || centroId < 1 || centroId > 3) {
    return res.status(400).json({
      error: 'X-Centro-Id inválido',
      details: 'El centro ID debe ser 1 (Quito), 2 (Guayaquil) o 3 (Cuenca)'
    });
  }
  
  // Agregar centroId al request para uso posterior
  req.body.centroId = centroId;
  
  next();
}

/**
 * Helper para obtener información de la base de datos actual
 */
export function getCurrentDbInfo(req: Request) {
  return req.dbInfo || {
    host: 'unknown',
    database: 'unknown',
    user: 'unknown',
    centroId: 1
  };
}
