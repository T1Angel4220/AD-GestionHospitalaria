// src/routes/reports.ts
import { Router } from "express";
import { getResumenConsultas, getDetalleConsultasMedico, getEstadisticasGenerales, getPacientesFrecuentes } from "../controllers/reports.controller";

const router = Router();

router.get("/health", (_req, res) => {
    res.json({ ok: true, module: "reports" });
  });

/**
 * GET /api/reports/estadisticas
 * Estadísticas generales del centro médico.
 * Query: desde=YYYY-MM-DD, hasta=YYYY-MM-DD (opcionales)
 * Header: X-Centro-Id (obligatorio)
 */
router.get("/estadisticas", getEstadisticasGenerales);

/**
 * GET /api/reports/pacientes-frecuentes
 * Reporte de pacientes más frecuentes del centro.
 * Query: desde=YYYY-MM-DD, hasta=YYYY-MM-DD, limite=N (opcionales)
 * Header: X-Centro-Id (obligatorio)
 */
router.get("/pacientes-frecuentes", getPacientesFrecuentes);

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
