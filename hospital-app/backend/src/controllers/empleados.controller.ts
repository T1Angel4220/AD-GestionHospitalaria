import { Request, Response } from "express";
import { query, execute } from "../config/db";

// =========================
// GET /api/admin/empleados
// =========================
export async function list(req: Request, res: Response) {
  try {
    const empleados = await query(`
      SELECT 
        e.id,
        e.nombres,
        e.apellidos,
        e.cargo,
        e.id_centro,
        c.nombre as centro_nombre,
        c.ciudad as centro_ciudad
      FROM empleados e
      LEFT JOIN centros_medicos c ON e.id_centro = c.id
      ORDER BY e.id ASC
    `);
    
    res.json(empleados);
  } catch (err) {
    console.error("[ERROR] listando empleados:", err);
    res.status(500).json({ error: "Error interno al listar empleados" });
  }
}

// =========================
// GET /api/admin/empleados/:id
// =========================
export async function getOne(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const empleados = await query(`
      SELECT 
        e.id,
        e.nombres,
        e.apellidos,
        e.cargo,
        e.id_centro,
        c.nombre as centro_nombre,
        c.ciudad as centro_ciudad
      FROM empleados e
      LEFT JOIN centros_medicos c ON e.id_centro = c.id
      WHERE e.id = ?
    `, [id]);

    if (empleados.length === 0) return res.status(404).json({ error: "Empleado no encontrado" });

    res.json(empleados[0]);
  } catch (err) {
    console.error("[ERROR] obteniendo empleado:", err);
    res.status(500).json({ error: "Error interno" });
  }
}

// =========================
// POST /api/admin/empleados
// =========================
export async function create(req: Request, res: Response) {
  try {
    const { nombres, apellidos, cargo, id_centro } = req.body ?? {};

    if (!nombres?.trim() || !apellidos?.trim() || !cargo?.trim() || !id_centro) {
      return res.status(400).json({ error: "nombres, apellidos, cargo e id_centro son obligatorios" });
    }

    // Validar centro
    const centros = await query("SELECT id FROM centros_medicos WHERE id = ?", [Number(id_centro)]);
    if (centros.length === 0) {
      return res.status(400).json({ error: "El centro especificado no existe" });
    }

    const result = await execute(`
      INSERT INTO empleados (nombres, apellidos, cargo, id_centro) 
      VALUES (?, ?, ?, ?)
    `, [nombres.trim(), apellidos.trim(), cargo.trim(), Number(id_centro)]);

    const created = {
      id: result.insertId,
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      cargo: cargo.trim(),
      id_centro: Number(id_centro)
    };

    res.status(201).json(created);
  } catch (err) {
    console.error("[ERROR] creando empleado:", err);
    res.status(500).json({ error: "Error interno al crear empleado" });
  }
}

// =========================
// PUT /api/admin/empleados/:id
// =========================
export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const { nombres, apellidos, cargo, id_centro } = req.body ?? {};

    // Construir objeto dinámico con los campos presentes
    const updates: string[] = [];
    const values: any[] = [];

    if (nombres !== undefined) {
      updates.push("nombres = ?");
      values.push(nombres.trim());
    }
    if (apellidos !== undefined) {
      updates.push("apellidos = ?");
      values.push(apellidos.trim());
    }
    if (cargo !== undefined) {
      updates.push("cargo = ?");
      values.push(cargo.trim());
    }
    if (id_centro !== undefined) {
      // Validar centro si viene en el body
      const centros = await query("SELECT id FROM centros_medicos WHERE id = ?", [Number(id_centro)]);
      if (centros.length === 0) {
        return res.status(400).json({ error: "El centro especificado no existe" });
      }
      updates.push("id_centro = ?");
      values.push(Number(id_centro));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "Debe enviar al menos un campo para actualizar" });
    }

    values.push(id);

    await execute(`
      UPDATE empleados 
      SET ${updates.join(", ")}
      WHERE id = ?
    `, values);

    const updated = {
      id,
      nombres: nombres?.trim(),
      apellidos: apellidos?.trim(),
      cargo: cargo?.trim(),
      id_centro: id_centro ? Number(id_centro) : undefined
    };

    res.json(updated);
  } catch (err) {
    console.error("[ERROR] actualizando empleado:", err);
    res.status(500).json({ error: "Error interno al actualizar empleado" });
  }
}

// =========================
// DELETE /api/admin/empleados/:id
// =========================
export async function remove(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const empleados = await query("SELECT id FROM empleados WHERE id = ?", [id]);
    if (empleados.length === 0) return res.status(404).json({ error: "Empleado no encontrado" });

    await execute("DELETE FROM empleados WHERE id = ?", [id]);

    res.json({ message: "Empleado eliminado correctamente" });
  } catch (err) {
    console.error("[ERROR] eliminando empleado:", err);
    res.status(500).json({ error: "Error interno al eliminar empleado" });
  }
}
