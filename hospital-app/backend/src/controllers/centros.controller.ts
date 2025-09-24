import { Request, Response } from "express";
import { query, execute } from "../config/db";

// =========================
// GET /api/admin/centros
// =========================
export async function list(req: Request, res: Response) {
  try {
    const centros = await query(`
      SELECT id, nombre, ciudad, direccion
      FROM centros_medicos
      ORDER BY id ASC
    `);
    
    res.json(centros);
  } catch (err) {
    console.error("[ERROR] listando centros:", err);
    res.status(500).json({ error: "Error interno al listar centros" });
  }
}

// =========================
// GET /api/admin/centros/:id
// =========================
export async function getOne(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const centros = await query(`
      SELECT id, nombre, ciudad, direccion
      FROM centros_medicos
      WHERE id = ?
    `, [id]);

    if (centros.length === 0) return res.status(404).json({ error: "Centro no encontrado" });

    res.json(centros[0]);
  } catch (err) {
    console.error("[ERROR] obteniendo centro:", err);
    res.status(500).json({ error: "Error interno" });
  }
}

// =========================
// POST /api/admin/centros
// =========================
export async function create(req: Request, res: Response) {
  try {
    const { nombre, ciudad, direccion } = req.body ?? {};

    if (!nombre?.trim() || !ciudad?.trim()) {
      return res.status(400).json({ error: "nombre y ciudad son obligatorios" });
    }

    const result = await execute(`
      INSERT INTO centros_medicos (nombre, ciudad, direccion) 
      VALUES (?, ?, ?)
    `, [nombre.trim(), ciudad.trim(), direccion?.trim() || null]);

    const created = {
      id: result.insertId
    };

    res.status(201).json(created);
  } catch (err) {
    console.error("[ERROR] creando centro:", err);
    res.status(500).json({ error: "Error interno al crear centro" });
  }
}

// =========================
// PUT /api/admin/centros/:id
// =========================
export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const { nombre, ciudad, direccion } = req.body ?? {};

    // Construir objeto dinámico con los campos presentes
    const updates: string[] = [];
    const values: any[] = [];

    if (nombre !== undefined) {
      updates.push("nombre = ?");
      values.push(nombre.trim());
    }
    if (ciudad !== undefined) {
      updates.push("ciudad = ?");
      values.push(ciudad.trim());
    }
    if (direccion !== undefined) {
      updates.push("direccion = ?");
      values.push(direccion?.trim() || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "Debe enviar al menos un campo para actualizar" });
    }

    values.push(id);

    const result = await execute(`
      UPDATE centros_medicos 
      SET ${updates.join(", ")}
      WHERE id = ?
    `, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Centro no encontrado" });
    }

    const updated = {
      id
    };

    res.json(updated);
  } catch (err) {
    console.error("[ERROR] actualizando centro:", err);
    res.status(500).json({ error: "Error interno al actualizar centro" });
  }
}

// =========================
// DELETE /api/admin/centros/:id
// =========================
export async function remove(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const result = await execute("DELETE FROM centros_medicos WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Centro no encontrado" });
    }

    res.status(204).send();
  } catch (err) {
    console.error("[ERROR] eliminando centro:", err);
    res.status(500).json({ error: "Error interno al eliminar centro" });
  }
}
