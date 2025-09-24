import { Router } from "express";
import { 
  list, 
  getOne, 
  create, 
  update, 
  remove, 
  search 
} from "../controllers/pacientes.controller";
import { authenticateToken, requireCentroAccess, requireRole } from "../middlewares/auth";
import { validatePaciente } from "../middlewares/validation";

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// =========================
// GET /api/pacientes
// Listar todos los pacientes (solo admin puede ver todos, médicos solo de su centro)
// =========================
router.get("/", async (req, res, next) => {
  // Verificar si es admin para mostrar todos los pacientes
  const token = req.headers.authorization?.replace('Bearer ', '');
  let isAdmin = false;
  
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      isAdmin = decoded.rol === 'admin';
    } catch (err) {
      // Token inválido, continuar como no admin
    }
  }

  if (isAdmin) {
    // Admin puede ver todos los pacientes
    return list(req, res);
  } else {
    // Médicos solo ven pacientes de su centro
    return requireCentroAccess(req, res, next);
  }
}, list);

// =========================
// GET /api/pacientes/search
// Buscar pacientes con filtros
// =========================
router.get("/search", async (req, res, next) => {
  // Verificar si es admin para buscar en todos los centros
  const token = req.headers.authorization?.replace('Bearer ', '');
  let isAdmin = false;
  
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      isAdmin = decoded.rol === 'admin';
    } catch (err) {
      // Token inválido, continuar como no admin
    }
  }

  if (isAdmin) {
    // Admin puede buscar en todos los centros
    return search(req, res);
  } else {
    // Médicos solo buscan en su centro
    return requireCentroAccess(req, res, next);
  }
}, search);

// =========================
// GET /api/pacientes/:id
// Obtener un paciente por ID
// =========================
router.get("/:id", async (req, res, next) => {
  // Verificar si es admin para ver cualquier paciente
  const token = req.headers.authorization?.replace('Bearer ', '');
  let isAdmin = false;
  
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      isAdmin = decoded.rol === 'admin';
    } catch (err) {
      // Token inválido, continuar como no admin
    }
  }

  if (isAdmin) {
    // Admin puede ver cualquier paciente
    return getOne(req, res);
  } else {
    // Médicos solo ven pacientes de su centro
    return requireCentroAccess(req, res, next);
  }
}, getOne);

// =========================
// POST /api/pacientes
// Crear un nuevo paciente (solo admin)
// =========================
router.post("/", requireRole(['admin']), validatePaciente, create);

// =========================
// PUT /api/pacientes/:id
// Actualizar un paciente (solo admin)
// =========================
router.put("/:id", requireRole(['admin']), validatePaciente, update);

// =========================
// DELETE /api/pacientes/:id
// Eliminar un paciente (solo admin)
// =========================
router.delete("/:id", requireRole(['admin']), remove);

export default router;
