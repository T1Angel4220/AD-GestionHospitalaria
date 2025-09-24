import { Request, Response } from "express";
import { query } from "../config/db";

// =========================
// GET /api/admin/especialidades
// =========================
export async function list(req: Request, res: Response) {
  try {
    const especialidades = await query(`
      SELECT id, nombre
      FROM especialidades
      ORDER BY id ASC
    `);
    
    res.json(especialidades);
  } catch (err) {
    console.error("[ERROR] listando especialidades:", err);
    res.status(500).json({ error: "Error interno al listar especialidades" });
  }
}

// =========================
// GET /api/admin/especialidades/:id
// =========================
export async function getOne(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const especialidades = await query(`
      SELECT id, nombre
      FROM especialidades
      WHERE id = ?
    `, [id]);

    if (especialidades.length === 0) return res.status(404).json({ error: "Especialidad no encontrada" });

    res.json(especialidades[0]);
  } catch (err) {
    console.error("[ERROR] obteniendo especialidad:", err);
    res.status(500).json({ error: "Error interno" });
  }
}

// =========================
// POST /api/admin/especialidades
// =========================
export async function create(req: Request, res: Response) {
  try {
    const { nombre } = req.body ?? {};

    if (!nombre?.trim()) {
      return res.status(400).json({ error: "nombre es obligatorio" });
    }

    const result = await query(`
      INSERT INTO especialidades (nombre) 
      VALUES (?)
    `, [nombre.trim()]);

    const created = {
      id: result.insertId
    };

    res.status(201).json(created);
  } catch (err: any) {
    console.error("[ERROR] creando especialidad:", err);
    
    // Verificar si es error de constraint único
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: "nombre ya existe" });
    }
    
    res.status(500).json({ error: "Error interno al crear especialidad" });
  }
}

// =========================
// PUT /api/admin/especialidades/:id
// =========================
export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const { nombre } = req.body ?? {};

    if (nombre === undefined) {
      return res.status(400).json({ error: "Debe enviar al menos un campo para actualizar" });
    }

    const result = await query(`
      UPDATE especialidades 
      SET nombre = ?
      WHERE id = ?
    `, [nombre.trim(), id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Especialidad no encontrada" });
    }

    const updated = {
      id
    };

    res.json(updated);
  } catch (err: any) {
    console.error("[ERROR] actualizando especialidad:", err);
    
    // Verificar si es error de constraint único
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: "nombre ya existe" });
    }
    
    res.status(500).json({ error: "Error interno al actualizar especialidad" });
  }
}

// =========================
// DELETE /api/admin/especialidades/:id
// =========================
export async function remove(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const result = await query("DELETE FROM especialidades WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Especialidad no encontrada" });
    }

    res.status(204).send();
  } catch (err) {
    console.error("[ERROR] eliminando especialidad:", err);
    res.status(500).json({ error: "Error interno al eliminar especialidad" });
  }
}
