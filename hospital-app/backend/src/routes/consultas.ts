import { Router, Request, Response } from "express";
import { pool } from "../config/db";

const router = Router();

function getCentroId(req: Request): number | null {
  const headerValue = req.header("X-Centro-Id") || req.header("x-centro-id");
  if (!headerValue) return null;
  const numeric = Number(headerValue);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

// Crear consulta
router.post("/", async (req: Request, res: Response) => {
  try {
    const idCentro = getCentroId(req);
    if (!idCentro) return res.status(400).json({ error: "X-Centro-Id requerido" });

    const { id_medico, paciente_nombre, paciente_apellido, fecha, motivo, diagnostico, tratamiento } = req.body || {};
    if (!id_medico || !paciente_nombre || !paciente_apellido || !fecha) {
      return res.status(400).json({ error: "id_medico, paciente_nombre, paciente_apellido y fecha son obligatorios" });
    }

    // Validar que el médico pertenece al mismo centro
    const [medicoRows] = await pool.query(
      "SELECT id FROM medicos WHERE id = ? AND id_centro = ?",
      [id_medico, idCentro]
    );
    // @ts-ignore
    if (!medicoRows[0]) {
      return res.status(400).json({ error: "El médico no pertenece al centro indicado" });
    }

    const [result] = await pool.execute(
      `INSERT INTO consultas (id_centro, id_medico, paciente_nombre, paciente_apellido, fecha, motivo, diagnostico, tratamiento)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [idCentro, id_medico, paciente_nombre, paciente_apellido, fecha, motivo ?? null, diagnostico ?? null, tratamiento ?? null]
    );

    // @ts-ignore - mysql2 returns OkPacket
    const insertedId = result.insertId as number;
    const [rows] = await pool.query("SELECT * FROM consultas WHERE id = ? AND id_centro = ?", [insertedId, idCentro]);
    // @ts-ignore
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo crear la consulta" });
  }
});

// Listar consultas del centro
router.get("/", async (req: Request, res: Response) => {
  try {
    const idCentro = getCentroId(req);
    if (!idCentro) return res.status(400).json({ error: "X-Centro-Id requerido" });

    const { medico, desde, hasta, q } = req.query as Record<string, string>;

    const conditions: string[] = ["id_centro = ?"]; 
    const params: any[] = [idCentro];

    if (medico) {
      conditions.push("id_medico = ?");
      params.push(Number(medico));
    }
    if (desde) {
      conditions.push("fecha >= ?");
      params.push(desde);
    }
    if (hasta) {
      conditions.push("fecha <= ?");
      params.push(hasta);
    }
    if (q) {
      conditions.push("(paciente_nombre LIKE ? OR paciente_apellido LIKE ? OR motivo LIKE ? OR diagnostico LIKE ?)");
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql = `SELECT * FROM consultas ${where} ORDER BY fecha DESC, id DESC`;
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudieron obtener las consultas" });
  }
});

// Obtener una consulta por id (scoped)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const idCentro = getCentroId(req);
    if (!idCentro) return res.status(400).json({ error: "X-Centro-Id requerido" });

    const id = Number(req.params.id);
    const [rows] = await pool.query("SELECT * FROM consultas WHERE id = ? AND id_centro = ?", [id, idCentro]);
    // @ts-ignore
    const item = rows[0];
    if (!item) return res.status(404).json({ error: "Consulta no encontrada" });
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo obtener la consulta" });
  }
});

// Actualizar una consulta
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const idCentro = getCentroId(req);
    if (!idCentro) return res.status(400).json({ error: "X-Centro-Id requerido" });
    const id = Number(req.params.id);

    const { id_medico, paciente_nombre, paciente_apellido, fecha, motivo, diagnostico, tratamiento } = req.body || {};

    // Build dynamic SET clause
    const fields: string[] = [];
    const params: any[] = [];
    if (id_medico !== undefined) { fields.push("id_medico = ?"); params.push(id_medico); }
    if (paciente_nombre !== undefined) { fields.push("paciente_nombre = ?"); params.push(paciente_nombre); }
    if (paciente_apellido !== undefined) { fields.push("paciente_apellido = ?"); params.push(paciente_apellido); }
    if (fecha !== undefined) { fields.push("fecha = ?"); params.push(fecha); }
    if (motivo !== undefined) { fields.push("motivo = ?"); params.push(motivo); }
    if (diagnostico !== undefined) { fields.push("diagnostico = ?"); params.push(diagnostico); }
    if (tratamiento !== undefined) { fields.push("tratamiento = ?"); params.push(tratamiento); }

    if (fields.length === 0) return res.status(400).json({ error: "No hay campos para actualizar" });

    // Si se intenta cambiar el médico, validar que pertenezca al centro
    if (id_medico !== undefined) {
      const [medicoRows] = await pool.query(
        "SELECT id FROM medicos WHERE id = ? AND id_centro = ?",
        [id_medico, idCentro]
      );
      // @ts-ignore
      if (!medicoRows[0]) {
        return res.status(400).json({ error: "El médico no pertenece al centro indicado" });
      }
    }

    const sql = `UPDATE consultas SET ${fields.join(", ")} WHERE id = ? AND id_centro = ?`;
    params.push(id, idCentro);
    const [result] = await pool.execute(sql, params);
    // @ts-ignore
    if (result.affectedRows === 0) return res.status(404).json({ error: "Consulta no encontrada" });

    const [rows] = await pool.query("SELECT * FROM consultas WHERE id = ? AND id_centro = ?", [id, idCentro]);
    // @ts-ignore
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo actualizar la consulta" });
  }
});

// Eliminar una consulta
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const idCentro = getCentroId(req);
    if (!idCentro) return res.status(400).json({ error: "X-Centro-Id requerido" });
    const id = Number(req.params.id);

    const [result] = await pool.execute("DELETE FROM consultas WHERE id = ? AND id_centro = ?", [id, idCentro]);
    // @ts-ignore
    if (result.affectedRows === 0) return res.status(404).json({ error: "Consulta no encontrada" });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo eliminar la consulta" });
  }
});

export default router;

