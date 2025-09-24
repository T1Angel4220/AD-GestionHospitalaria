// src/controllers/reports.controller.ts
import { Request, Response } from "express";
import { pool } from "../config/db";

function getCentroId(req: Request): number | null {
  const headerValue = req.header("X-Centro-Id") || req.header("x-centro-id");
  if (!headerValue) return null;
  const n = Number(headerValue);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Resumen de consultas por médico del centro:
 * - medico_id, nombres, apellidos, especialidad
 * - total_consultas
 * - primera_consulta (min fecha)
 * - ultima_consulta   (max fecha)
 *
 * Incluye médicos del centro aunque no tengan consultas en el rango (LEFT JOIN).
 */
export async function getResumenConsultas(req: Request, res: Response) {
  try {
    const centroId = getCentroId(req);
    if (!centroId) return res.status(400).json({ error: "X-Centro-Id requerido" });

    const { desde, hasta, q } = req.query as Record<string, string | undefined>;

    const params: any[] = [];
    const onFilters: string[] = [`c.id_centro = ?`];
    params.push(centroId);

    // Filtros de fecha aplican sobre la tabla de consultas (en el JOIN)
    if (desde) { onFilters.push(`c.fecha >= ?`); params.push(`${desde} 00:00:00`); }
    if (hasta) { onFilters.push(`c.fecha <= ?`); params.push(`${hasta} 23:59:59`); }

    // Filtro de texto (paciente/motivo/diagnostico) también en JOIN
    if (q && q.trim() !== "") {
      onFilters.push(`(c.paciente_nombre LIKE ? OR c.paciente_apellido LIKE ? OR c.motivo LIKE ? OR c.diagnostico LIKE ?)`);
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }

    const sql = `
      SELECT
        m.id,
        m.id AS medico_id,
        m.nombres,
        m.apellidos,
        e.nombre AS especialidad,
        COUNT(c.id) AS total_consultas,
        MIN(c.fecha) AS primera_consulta,
        MAX(c.fecha) AS ultima_consulta
      FROM medicos m
      INNER JOIN especialidades e ON e.id = m.id_especialidad
      LEFT JOIN consultas c
        ON c.id_medico = m.id
       AND ${onFilters.join(" AND ")}
      WHERE m.id_centro = ?
      GROUP BY m.id, m.nombres, m.apellidos, e.nombre
      ORDER BY total_consultas DESC, m.apellidos ASC, m.nombres ASC
    `;
    params.push(centroId); // para WHERE m.id_centro = ?

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("[reports] getResumenConsultas:", err);
    res.status(500).json({ error: "No se pudo generar el reporte" });
  }
}

/**
 * Detalle de consultas para un médico específico del centro.
 * Devuelve la lista de consultas (fecha descendente).
 */
export async function getDetalleConsultasMedico(req: Request, res: Response) {
  try {
    const centroId = getCentroId(req);
    if (!centroId) return res.status(400).json({ error: "X-Centro-Id requerido" });

    const medicoId = Number(req.params.medicoId);
    if (!Number.isFinite(medicoId) || medicoId <= 0) {
      return res.status(400).json({ error: "medicoId inválido" });
    }

    // Verifica que el médico pertenezca al centro
    const [check] = await pool.query("SELECT id FROM medicos WHERE id = ? AND id_centro = ?", [medicoId, centroId]);
    // @ts-ignore
    if (!check[0]) return res.status(400).json({ error: "El médico no pertenece al centro indicado" });

    const { desde, hasta, q } = req.query as Record<string, string | undefined>;

    const cond: string[] = [`c.id_centro = ?`, `c.id_medico = ?`];
    const params: any[] = [centroId, medicoId];

    if (desde) { cond.push(`c.fecha >= ?`); params.push(`${desde} 00:00:00`); }
    if (hasta) { cond.push(`c.fecha <= ?`); params.push(`${hasta} 23:59:59`); }
    if (q && q.trim() !== "") {
      cond.push(`(c.paciente_nombre LIKE ? OR c.paciente_apellido LIKE ? OR c.motivo LIKE ? OR c.diagnostico LIKE ?)`);
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }

    const sql = `
      SELECT
        c.id,
        c.fecha,
        c.paciente_nombre,
        c.paciente_apellido,
        c.motivo,
        c.diagnostico,
        c.tratamiento,
        c.estado
      FROM consultas c
      WHERE ${cond.join(" AND ")}
      ORDER BY c.fecha DESC, c.id DESC
    `;

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("[reports] getDetalleConsultasMedico:", err);
    res.status(500).json({ error: "No se pudo obtener el detalle" });
  }
}
