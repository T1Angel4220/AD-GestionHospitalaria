// src/routes/reports.ts
import { Router } from "express";
import { getResumenConsultas, getDetalleConsultasMedico } from "../controllers/reports.controller";

const router = Router();

router.get("/health", (_req, res) => {
    res.json({ ok: true, module: "reports" });
  });
/**
 * GET /api/reports/consultas
 * Resumen por médico (conteo, primera/última consulta) dentro de un centro.
 * Query: desde=YYYY-MM-DD, hasta=YYYY-MM-DD, q=<texto opcional en paciente/motivo/diagnostico>
 * Header: X-Centro-Id (obligatorio)
 */
router.get("/consultas", getResumenConsultas);

/**
 * GET /api/reports/consultas/:medicoId/detalle
 * Detalle de consultas para un médico del centro.
 * Query: desde, hasta, q (opcionales)
 * Header: X-Centro-Id (obligatorio)
 */
router.get("/consultas/:medicoId/detalle", getDetalleConsultasMedico);

export default router;
