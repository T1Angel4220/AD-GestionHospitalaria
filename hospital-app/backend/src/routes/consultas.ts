import { Router, Request, Response } from "express";
import { pool } from "../config/db";
import { authenticateToken, requireCentroAccess, requireRole } from "../middlewares/auth";

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);
router.use(requireCentroAccess);

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

// Listar consultas del centro con datos relacionados
router.get("/", async (req: Request, res: Response) => {
  try {
    const idCentro = getCentroId(req);
    if (!idCentro) return res.status(400).json({ error: "X-Centro-Id requerido" });

    const { medico, desde, hasta, q } = req.query as Record<string, string>;

    const conditions: string[] = ["c.id_centro = ?"]; 
    const params: any[] = [idCentro];

    if (medico) {
      conditions.push("c.id_medico = ?");
      params.push(Number(medico));
    }
    if (desde) {
      conditions.push("c.fecha >= ?");
      params.push(desde);
    }
    if (hasta) {
      conditions.push("c.fecha <= ?");
      params.push(hasta);
    }
    if (q) {
      conditions.push("(c.paciente_nombre LIKE ? OR c.paciente_apellido LIKE ? OR c.motivo LIKE ? OR c.diagnostico LIKE ?)");
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql = `
      SELECT 
        c.*,
        m.nombres as medico_nombres,
        m.apellidos as medico_apellidos,
        e.nombre as especialidad_nombre,
        cm.nombre as centro_nombre,
        cm.ciudad as centro_ciudad
      FROM consultas c
      LEFT JOIN medicos m ON c.id_medico = m.id
      LEFT JOIN especialidades e ON m.id_especialidad = e.id
      LEFT JOIN centros_medicos cm ON c.id_centro = cm.id
      ${where} 
      ORDER BY c.fecha DESC, c.id DESC
    `;
    
    console.log('SQL Query:', sql);
    console.log('Params:', params);
    
    const [rows] = await pool.query(sql, params);
    console.log('Query result:', rows);
    
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudieron obtener las consultas" });
  }
});

// Obtener médicos del centro
router.get("/medicos", async (req: Request, res: Response) => {
  try {
    const idCentro = getCentroId(req);
    if (!idCentro) return res.status(400).json({ error: "X-Centro-Id requerido" });

    console.log('Obteniendo médicos para centro:', idCentro);
    
    const [rows] = await pool.query(`
      SELECT m.*, e.nombre as especialidad_nombre 
      FROM medicos m 
      LEFT JOIN especialidades e ON m.id_especialidad = e.id 
      WHERE m.id_centro = ? 
      ORDER BY m.nombres, m.apellidos
    `, [idCentro]);
    
    console.log('Médicos encontrados:', rows);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudieron obtener los médicos" });
  }
});

// Obtener especialidades
router.get("/especialidades", async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query("SELECT * FROM especialidades ORDER BY nombre");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudieron obtener las especialidades" });
  }
});

// Obtener centros médicos
router.get("/centros", async (req: Request, res: Response) => {
  try {
    console.log('Obteniendo centros médicos...');
    const [rows] = await pool.query("SELECT * FROM centros_medicos ORDER BY nombre");
    console.log('Centros encontrados:', rows);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudieron obtener los centros médicos" });
  }
});

// Obtener una consulta por id (scoped)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const idCentro = getCentroId(req);
    if (!idCentro) return res.status(400).json({ error: "X-Centro-Id requerido" });

    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "ID de consulta inválido" });
    }

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
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "ID de consulta inválido" });
    }

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
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "ID de consulta inválido" });
    }

    const [result] = await pool.execute("DELETE FROM consultas WHERE id = ? AND id_centro = ?", [id, idCentro]);
    // @ts-ignore
    if (result.affectedRows === 0) return res.status(404).json({ error: "Consulta no encontrada" });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo eliminar la consulta" });
  }
});

// Crear médico (solo admin)
router.post("/medicos", requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { nombres, apellidos, id_especialidad, id_centro } = req.body;

    if (!nombres || !apellidos || !id_especialidad || !id_centro) {
      return res.status(400).json({ error: 'nombres, apellidos, id_especialidad e id_centro son requeridos' });
    }

    // Verificar que la especialidad existe
    const [especialidadRows] = await pool.query('SELECT id FROM especialidades WHERE id = ?', [id_especialidad]);
    // @ts-ignore
    if (!especialidadRows[0]) {
      return res.status(400).json({ error: 'La especialidad no existe' });
    }

    // Verificar que el centro existe
    const [centroRows] = await pool.query('SELECT id FROM centros_medicos WHERE id = ?', [id_centro]);
    // @ts-ignore
    if (!centroRows[0]) {
      return res.status(400).json({ error: 'El centro médico no existe' });
    }

    // Crear médico
    const [result] = await pool.execute(
      'INSERT INTO medicos (nombres, apellidos, id_especialidad, id_centro) VALUES (?, ?, ?, ?)',
      [nombres, apellidos, id_especialidad, id_centro]
    );

    // @ts-ignore
    const medicoId = result.insertId;

    // Obtener el médico creado con datos relacionados
    const [rows] = await pool.query(`
      SELECT m.*, e.nombre as especialidad_nombre, cm.nombre as centro_nombre
      FROM medicos m
      LEFT JOIN especialidades e ON m.id_especialidad = e.id
      LEFT JOIN centros_medicos cm ON m.id_centro = cm.id
      WHERE m.id = ?
    `, [medicoId]);

    // @ts-ignore
    res.status(201).json(rows[0]);

  } catch (error) {
    console.error('Error creando médico:', error);
    res.status(500).json({ error: 'No se pudo crear el médico' });
  }
});

export default router;

