import { NextFunction, Request, Response } from 'express';

export function requireCentroHeader(req: Request, res: Response, next: NextFunction) {
    const centroId = Number(req.header('x-centro-id'));
    if (!centroId) return res.status(400).json({ error: 'Falta header x-centro-id' });
    if (req.user && req.user.rol !== 'admin' && req.user.centroId !== centroId) {
        return res.status(403).json({ error: 'Centro no autorizado' });
    }
    (req as any).centroId = centroId;
    next();
}
