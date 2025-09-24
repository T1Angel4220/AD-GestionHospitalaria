import { Router, Request, Response } from "express";
import { pool } from "../config/db";
import { authenticateToken, requireCentroAccess, requireRole } from "../middlewares/auth";
import { validateConsultation, validateMedico, validateUsuario, validateEmpleado, validateCentro, validateEspecialidad } from "../middlewares/validation";
import jwt from "jsonwebtoken";

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Aplicar requireCentroAccess solo a rutas que lo necesiten
// (no a /usuarios porque los admins pueden ver todos los usuarios)

function getCentroId(req: Request): number | null {
  const headerValue = req.header("X-Centro-Id") || req.header("x-centro-id");
  if (!headerValue) return null;
  const numeric = Number(headerValue);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

// Crear consulta
router.post("/", requireCentroAccess, validateConsultation, async (req: Request, res: Response) => {
  try {
    const idCentro = getCentroId(req);
    if (!idCentro) return res.status(400).json({ error: "X-Centro-Id requerido" });

    const { id_medico, paciente_nombre, paciente_apellido, id_paciente, fecha, motivo, diagnostico, tratamiento, estado, duracion_minutos } = req.body || {};
    
    // Validaciones básicas (las validaciones detalladas ya se hicieron en el middleware)
    if (!id_medico) {
      return res.status(400).json({ error: "id_medico es obligatorio" });
    }

    // Obtener información del usuario autenticado
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Token requerido" });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userRole = decoded.rol;

    // Si es admin, puede asignar cualquier médico a cualquier centro
    // Si es médico, solo puede crear consultas en su centro
    let centroConsulta = idCentro;
    
    if (userRole === 'admin') {
      // Para admin, usar el centro seleccionado en el header X-Centro-Id
      // Esto permite que el admin asigne consultas a cualquier centro
      centroConsulta = idCentro;
      
      // Solo validar que el médico existe
      const [medicoRows] = await pool.query(
        "SELECT id FROM medicos WHERE id = ?",
        [id_medico]
      );
      // @ts-ignore
      if (!medicoRows[0]) {
        return res.status(400).json({ error: "Médico no encontrado" });
      }
    } else {
      // Para médico, validar que el médico es el mismo usuario médico
      const userId = decoded.id;
    const [medicoRows] = await pool.query(
        "SELECT id FROM medicos WHERE id = ? AND id = (SELECT id_medico FROM usuarios WHERE id = ?)",
        [id_medico, userId]
    );
    // @ts-ignore
    if (!medicoRows[0]) {
        return res.status(400).json({ error: "Solo puedes crear consultas para ti mismo" });
      }
      // Para médico, usar el centro del usuario autenticado
      centroConsulta = decoded.id_centro;
    }

    console.log('Datos para insertar consulta:', {
      centroConsulta,
      id_medico,
      paciente_nombre,
      paciente_apellido,
      id_paciente,
      fecha,
      motivo,
      diagnostico,
      tratamiento,
      estado,
      duracion_minutos
    });

    const [result] = await pool.execute(
      `INSERT INTO consultas (id_centro, id_medico, paciente_nombre, paciente_apellido, id_paciente, fecha, motivo, diagnostico, tratamiento, estado, duracion_minutos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [centroConsulta, id_medico, paciente_nombre, paciente_apellido, id_paciente ?? null, fecha, motivo ?? null, diagnostico ?? null, tratamiento ?? null, estado ?? 'pendiente', duracion_minutos ?? 0]
    );

    // @ts-ignore - mysql2 returns OkPacket
    const insertedId = result.insertId as number;
    const [rows] = await pool.query("SELECT * FROM consultas WHERE id = ? AND id_centro = ?", [insertedId, centroConsulta]);
    // @ts-ignore
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creando consulta:', error);
    res.status(500).json({ error: "No se pudo crear la consulta", details: error.message });
  }
});

// Listar consultas del centro con datos relacionados
router.get("/", requireCentroAccess, async (req: Request, res: Response) => {
  try {
    const idCentro = getCentroId(req);
    if (!idCentro) return res.status(400).json({ error: "X-Centro-Id requerido" });

    // Verificar si es admin para mostrar todas las consultas
    const token = req.headers.authorization?.replace('Bearer ', '');
    let isAdmin = false;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        isAdmin = decoded.rol === 'admin';
      } catch (err) {
        // Token inválido, continuar como no admin
      }
    }

    const { medico, desde, hasta, q } = req.query as Record<string, string>;

    const conditions: string[] = isAdmin ? [] : ["c.id_centro = ?"]; 
    const params: any[] = isAdmin ? [] : [idCentro];

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
    
    console.log('Obteniendo consultas - Centro:', idCentro, 'isAdmin:', isAdmin);
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
// Obtener médicos disponibles para asociar (solo admin)
router.get("/medicos-disponibles", requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT m.*, e.nombre as especialidad_nombre, cm.nombre as centro_nombre
      FROM medicos m
      LEFT JOIN especialidades e ON m.id_especialidad = e.id
      LEFT JOIN centros_medicos cm ON m.id_centro = cm.id
      WHERE m.id NOT IN (
        SELECT id_medico FROM usuarios WHERE id_medico IS NOT NULL
      )
      ORDER BY m.nombres, m.apellidos
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo médicos disponibles:', error);
    res.status(500).json({ error: 'No se pudieron obtener los médicos disponibles' });
  }
});

router.get("/medicos", async (req: Request, res: Response) => {
  try {
    const idCentro = getCentroId(req);
    if (!idCentro) return res.status(400).json({ error: "X-Centro-Id requerido" });

    // Verificar si es admin para mostrar todos los médicos
    const token = req.headers.authorization?.replace('Bearer ', '');
    let isAdmin = false;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        isAdmin = decoded.rol === 'admin';
      } catch (err) {
        // Token inválido, continuar como no admin
      }
    }

    console.log('Obteniendo médicos para centro:', idCentro, 'isAdmin:', isAdmin);
    
    let sql, params;
    if (isAdmin) {
      // Admin ve todos los médicos de todos los centros
      sql = `
        SELECT m.*, e.nombre as especialidad_nombre, cm.nombre as centro_nombre
        FROM medicos m 
        LEFT JOIN especialidades e ON m.id_especialidad = e.id 
        LEFT JOIN centros_medicos cm ON m.id_centro = cm.id
        ORDER BY m.nombres, m.apellidos
      `;
      params = [];
    } else {
      // Usuario normal ve solo médicos de su centro
      sql = `
        SELECT m.*, e.nombre as especialidad_nombre, cm.nombre as centro_nombre
        FROM medicos m 
        LEFT JOIN especialidades e ON m.id_especialidad = e.id 
        LEFT JOIN centros_medicos cm ON m.id_centro = cm.id
        WHERE m.id_centro = ? 
        ORDER BY m.nombres, m.apellidos
      `;
      params = [idCentro];
    }
    
    const [rows] = await pool.query(sql, params);
    console.log('Médicos encontrados:', (rows as any[]).length);
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

// Obtener pacientes del centro
router.get("/pacientes", requireCentroAccess, async (req: Request, res: Response) => {
  try {
    const idCentro = getCentroId(req);
    if (!idCentro) return res.status(400).json({ error: "X-Centro-Id requerido" });

    // Verificar si es admin para mostrar todos los pacientes
    const token = req.headers.authorization?.replace('Bearer ', '');
    let isAdmin = false;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        isAdmin = decoded.rol === 'admin';
      } catch (err) {
        // Token inválido, continuar como no admin
      }
    }

    console.log('Obteniendo pacientes para centro:', idCentro, 'isAdmin:', isAdmin);
    
    let sql, params;
    if (isAdmin) {
      // Admin ve todos los pacientes de todos los centros con info de consultas activas
      sql = `
        SELECT p.*, cm.nombre as centro_nombre, cm.ciudad as centro_ciudad,
               COUNT(c.id) as consultas_activas,
               GROUP_CONCAT(DISTINCT CONCAT(m.nombres, ' ', m.apellidos) SEPARATOR ', ') as medicos_activos
        FROM pacientes p 
        LEFT JOIN centros_medicos cm ON p.id_centro = cm.id
        LEFT JOIN consultas c ON p.id = c.id_paciente AND c.estado IN ('pendiente', 'programada')
        LEFT JOIN medicos m ON c.id_medico = m.id
        GROUP BY p.id
        ORDER BY p.nombres, p.apellidos
      `;
      params = [];
    } else {
      // Usuario normal ve solo pacientes de su centro con info de consultas activas
      sql = `
        SELECT p.*, cm.nombre as centro_nombre, cm.ciudad as centro_ciudad,
               COUNT(c.id) as consultas_activas,
               GROUP_CONCAT(DISTINCT CONCAT(m.nombres, ' ', m.apellidos) SEPARATOR ', ') as medicos_activos
        FROM pacientes p 
        LEFT JOIN centros_medicos cm ON p.id_centro = cm.id
        LEFT JOIN consultas c ON p.id = c.id_paciente AND c.estado IN ('pendiente', 'programada')
        LEFT JOIN medicos m ON c.id_medico = m.id
        WHERE p.id_centro = ? 
        GROUP BY p.id
        ORDER BY p.nombres, p.apellidos
      `;
      params = [idCentro];
    }
    
    const [rows] = await pool.query(sql, params);
    console.log('Pacientes encontrados:', (rows as any[]).length);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudieron obtener los pacientes" });
  }
});

// Obtener usuarios (solo admin)
router.get("/usuarios", requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.*, 
             cm.nombre as centro_nombre, 
             m.nombres as medico_nombres, 
             m.apellidos as medico_apellidos
      FROM usuarios u
      LEFT JOIN centros_medicos cm ON u.id_centro = cm.id
      LEFT JOIN medicos m ON u.id_medico = m.id
      ORDER BY u.email
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'No se pudieron obtener los usuarios' });
  }
});

// Obtener una consulta por id (scoped)
router.get("/:id", requireCentroAccess, async (req: Request, res: Response) => {
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
router.put("/:id", requireCentroAccess, validateConsultation, async (req: Request, res: Response) => {
  try {
    const idCentro = getCentroId(req);
    if (!idCentro) return res.status(400).json({ error: "X-Centro-Id requerido" });
    
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "ID de consulta inválido" });
    }

    const { id_medico, paciente_nombre, paciente_apellido, id_paciente, fecha, motivo, diagnostico, tratamiento, estado, duracion_minutos } = req.body || {};

    // Las validaciones detalladas ya se hicieron en el middleware

    console.log('Actualizando consulta:', { id, id_medico, paciente_nombre, paciente_apellido, fecha, motivo, diagnostico, tratamiento, estado, duracion_minutos });

    // Build dynamic SET clause
    const fields: string[] = [];
    const params: any[] = [];
    if (id_medico !== undefined) { fields.push("id_medico = ?"); params.push(id_medico); }
    if (paciente_nombre !== undefined) { fields.push("paciente_nombre = ?"); params.push(paciente_nombre); }
    if (paciente_apellido !== undefined) { fields.push("paciente_apellido = ?"); params.push(paciente_apellido); }
    if (id_paciente !== undefined) { fields.push("id_paciente = ?"); params.push(id_paciente); }
    if (fecha !== undefined) { fields.push("fecha = ?"); params.push(fecha); }
    if (motivo !== undefined) { fields.push("motivo = ?"); params.push(motivo); }
    if (diagnostico !== undefined) { fields.push("diagnostico = ?"); params.push(diagnostico); }
    if (tratamiento !== undefined) { fields.push("tratamiento = ?"); params.push(tratamiento); }
    if (estado !== undefined) { fields.push("estado = ?"); params.push(estado); }
    if (duracion_minutos !== undefined) { fields.push("duracion_minutos = ?"); params.push(duracion_minutos); }

    if (fields.length === 0) return res.status(400).json({ error: "No hay campos para actualizar" });

    // Obtener el rol del usuario para validaciones
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Token requerido" });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userRole = decoded.rol;

    // Si se intenta cambiar el médico, validar que pertenezca al centro (solo para médicos)
    if (id_medico !== undefined && userRole === 'medico') {
      const [medicoRows] = await pool.query(
        "SELECT id FROM medicos WHERE id = ? AND id_centro = ?",
        [id_medico, idCentro]
      );
      // @ts-ignore
      if (!medicoRows[0]) {
        return res.status(400).json({ error: "El médico no pertenece al centro indicado" });
      }
    }

    // Construir la consulta WHERE según el rol del usuario
    let whereClause = "WHERE id = ?";
    let whereParams = [id];
    
    if (userRole === 'medico') {
      // Los médicos solo pueden actualizar consultas de su centro
      whereClause += " AND id_centro = ?";
      whereParams.push(idCentro);
    }
    // Los admins pueden actualizar consultas de cualquier centro

    const sql = `UPDATE consultas SET ${fields.join(", ")} ${whereClause}`;
    params.push(...whereParams);
    console.log('SQL de actualización:', sql);
    console.log('Parámetros:', params);
    const [result] = await pool.execute(sql, params);
    // @ts-ignore
    if (result.affectedRows === 0) return res.status(404).json({ error: "Consulta no encontrada" });

    // Obtener la consulta actualizada
    const [rows] = await pool.query(`SELECT * FROM consultas ${whereClause}`, whereParams);
    // @ts-ignore
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo actualizar la consulta" });
  }
});

// Eliminar una consulta
router.delete("/:id", requireCentroAccess, async (req: Request, res: Response) => {
  try {
    const idCentro = getCentroId(req);
    if (!idCentro) return res.status(400).json({ error: "X-Centro-Id requerido" });
    
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "ID de consulta inválido" });
    }

    // Obtener el rol del usuario para validaciones
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Token requerido" });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userRole = decoded.rol;

    // Construir la consulta WHERE según el rol del usuario
    let whereClause = "WHERE id = ?";
    let whereParams = [id];
    
    if (userRole === 'medico') {
      // Los médicos solo pueden eliminar consultas de su centro
      whereClause += " AND id_centro = ?";
      whereParams.push(idCentro);
    }
    // Los admins pueden eliminar consultas de cualquier centro

    const [result] = await pool.execute(`DELETE FROM consultas ${whereClause}`, whereParams);
    // @ts-ignore
    if (result.affectedRows === 0) return res.status(404).json({ error: "Consulta no encontrada" });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo eliminar la consulta" });
  }
});

// Crear médico (solo admin)
router.post("/medicos", requireRole(['admin']), validateMedico, async (req: Request, res: Response) => {
  try {
    const { nombres, apellidos, id_especialidad, id_centro } = req.body;

    // Las validaciones detalladas ya se hicieron en el middleware

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

// Crear usuario (solo admin)
router.post("/usuarios", requireRole(['admin']), validateUsuario, async (req: Request, res: Response) => {
  try {
    const { email, password, rol, id_centro, id_medico } = req.body;

    // Las validaciones detalladas ya se hicieron en el middleware

    // Verificar que el centro existe
    const [centroRows] = await pool.query('SELECT id FROM centros_medicos WHERE id = ?', [id_centro]);
    // @ts-ignore
    if (!centroRows[0]) {
      return res.status(400).json({ error: 'El centro médico no existe' });
    }

    // Si es médico, verificar que el médico existe y pertenece al centro
    if (rol === 'medico' && id_medico) {
      const [medicoRows] = await pool.query('SELECT id FROM medicos WHERE id = ? AND id_centro = ?', [id_medico, id_centro]);
      // @ts-ignore
      if (!medicoRows[0]) {
        return res.status(400).json({ error: 'El médico no existe o no pertenece al centro' });
      }
    }

    // Verificar que el email no existe
    const [emailRows] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    // @ts-ignore
    if (emailRows[0]) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hash de la contraseña
    const bcrypt = require('bcrypt');
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const [result] = await pool.execute(
      'INSERT INTO usuarios (email, password_hash, rol, id_centro, id_medico) VALUES (?, ?, ?, ?, ?)',
      [email, password_hash, rol, id_centro, id_medico || null]
    );

    // @ts-ignore
    const userId = result.insertId;

    // Obtener el usuario creado
    const [rows] = await pool.query(`
      SELECT u.*, cm.nombre as centro_nombre, m.nombres as medico_nombres, m.apellidos as medico_apellidos
      FROM usuarios u
      LEFT JOIN centros_medicos cm ON u.id_centro = cm.id
      LEFT JOIN medicos m ON u.id_medico = m.id
      WHERE u.id = ?
    `, [userId]);

    // @ts-ignore
    res.status(201).json(rows[0]);

  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: 'No se pudo crear el usuario' });
  }
});

export default router;

