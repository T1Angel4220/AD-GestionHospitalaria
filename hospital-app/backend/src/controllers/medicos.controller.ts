import { Request, Response } from "express";
import { validateMedico } from "../middlewares/validation";

// =========================
// GET /api/admin/medicos
// =========================
export async function list(req: Request, res: Response) {
  try {
    const medicos = await req.dbPool.query(`
      SELECT 
        m.id,
        m.nombres,
        m.apellidos,
        m.id_especialidad,
        m.id_centro,
        e.nombre as especialidad_nombre,
        c.nombre as centro_nombre,
        c.ciudad as centro_ciudad
      FROM medicos m
      LEFT JOIN especialidades e ON m.id_especialidad = e.id
      LEFT JOIN centros_medicos c ON m.id_centro = c.id
      ORDER BY m.id ASC
    `);
    
    res.json(medicos);
  } catch (err) {
    console.error("[ERROR] listando médicos:", err);
    res.status(500).json({ error: "Error interno al listar médicos" });
  }
}

// =========================
// GET /api/admin/medicos/:id
// =========================
export async function getOne(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const medicos = await req.dbPool.query(`
      SELECT 
        m.id,
        m.nombres,
        m.apellidos,
        m.id_especialidad,
        m.id_centro,
        e.nombre as especialidad_nombre,
        c.nombre as centro_nombre,
        c.ciudad as centro_ciudad
      FROM medicos m
      LEFT JOIN especialidades e ON m.id_especialidad = e.id
      LEFT JOIN centros_medicos c ON m.id_centro = c.id
      WHERE m.id = ?
    `, [id]);

    if (medicos.length === 0) return res.status(404).json({ error: "Médico no encontrado" });

    res.json(medicos[0]);
  } catch (err) {
    console.error("[ERROR] obteniendo médico:", err);
    res.status(500).json({ error: "Error interno" });
  }
}

// =========================
// POST /api/admin/medicos
// =========================
export async function create(req: Request, res: Response) {
  try {
    const { nombres, apellidos, id_especialidad, id_centro } = req.body ?? {};

    // Las validaciones detalladas ya se hicieron en el middleware

    // Validar centro
    const centros = await req.dbPool.query("SELECT id FROM centros_medicos WHERE id = ?", [Number(id_centro)]);
    if (centros.length === 0) return res.status(400).json({ error: "El centro especificado no existe" });

    // Validar especialidad
    const especialidades = await req.dbPool.query("SELECT id FROM especialidades WHERE id = ?", [Number(id_especialidad)]);
    if (especialidades.length === 0) return res.status(400).json({ error: "La especialidad especificada no existe" });

    const result = await req.dbPool.execute(`
      INSERT INTO medicos (nombres, apellidos, id_especialidad, id_centro) 
      VALUES (?, ?, ?, ?)
    `, [nombres, apellidos, Number(id_especialidad), Number(id_centro)]);

    const created = {
      id: result.insertId,
      nombres: nombres,
      apellidos: apellidos
    };

    res.status(201).json(created);
  } catch (err) {
    console.error("[ERROR] creando médico:", err);
    res.status(500).json({ error: "Error interno al crear médico" });
  }
}

// =========================
// PUT /api/admin/medicos/:id
// =========================
export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const { nombres, apellidos, id_especialidad, id_centro } = req.body ?? {};

    // Las validaciones detalladas ya se hicieron en el middleware

    // Validar existencia del médico
    const medicos = await req.dbPool.query("SELECT id FROM medicos WHERE id = ?", [id]);
    if (medicos.length === 0) return res.status(404).json({ error: "Médico no encontrado" });

    // Validar centro
    const centros = await req.dbPool.query("SELECT id FROM centros_medicos WHERE id = ?", [Number(id_centro)]);
    if (centros.length === 0) return res.status(400).json({ error: "El centro especificado no existe" });

    // Validar especialidad
    const especialidades = await req.dbPool.query("SELECT id FROM especialidades WHERE id = ?", [Number(id_especialidad)]);
    if (especialidades.length === 0) return res.status(400).json({ error: "La especialidad especificada no existe" });

    await req.dbPool.execute(`
      UPDATE medicos 
      SET nombres = ?, apellidos = ?, id_especialidad = ?, id_centro = ?
      WHERE id = ?
    `, [nombres, apellidos, Number(id_especialidad), Number(id_centro), id]);

    const updated = {
      id,
      nombres: nombres,
      apellidos: apellidos
    };

    res.json(updated);
  } catch (err) {
    console.error("[ERROR] actualizando médico:", err);
    res.status(500).json({ error: "Error interno al actualizar médico" });
  }
}

// =========================
// DELETE /api/admin/medicos/:id
// =========================
export async function remove(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const medicos = await req.dbPool.query("SELECT id FROM medicos WHERE id = ?", [id]);
    if (medicos.length === 0) return res.status(404).json({ error: "Médico no encontrado" });

    await req.dbPool.execute("DELETE FROM medicos WHERE id = ?", [id]);

    res.json({ message: "Médico eliminado correctamente" });
  } catch (err) {
    console.error("[ERROR] eliminando médico:", err);
    res.status(500).json({ error: "Error interno al eliminar médico" });
  }
}
