import { Router } from 'express';
import centros from './centros.routes';

const api = Router();

api.get('/health', (_req, res) => res.json({ ok: true, module: 'backend' }));
api.use('/admin/centros', centros);

export default api;
