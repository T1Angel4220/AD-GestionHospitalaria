
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export type JwtUser = { id: number; rol: 'admin' | 'medico'; centroId: number; medicoId?: number };

declare global {
  namespace Express { interface Request { user?: JwtUser } }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization;
  if (!hdr?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    const token = hdr.slice(7);
    req.user = jwt.verify(token, env.jwtSecret) as JwtUser;
    next();
  } catch { return res.status(401).json({ error: 'Token inválido' }); }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.rol !== 'admin') return res.status(403).json({ error: 'Solo admin' });
  next();
}
