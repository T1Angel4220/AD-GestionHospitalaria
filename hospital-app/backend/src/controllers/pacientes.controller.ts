import { Request, Response } from "express";

// Extender el tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        rol: 'admin' | 'medico';
        id_centro: number;
        id_medico?: number;
      };
    }
  }
}

// =========================
// GET /api/pacientes
// =========================
export async function list(req: Request, res: Response) {
  try {
    const pacientes = await req.dbPool.query(`
      SELECT 
        p.id,
        p.nombres,
        p.apellidos,
        p.cedula,
        p.telefono,
        p.email,
        p.fecha_nacimiento,
        p.genero,
        p.direccion,
        p.id_centro,
        c.nombre as centro_nombre,
        c.ciudad as centro_ciudad,
        p.created_at,
        p.updated_at
      FROM pacientes p
      LEFT JOIN centros_medicos c ON p.id_centro = c.id
      ORDER BY p.apellidos ASC, p.nombres ASC
    `);
    
    res.json(pacientes);
  } catch (err) {
    console.error("[ERROR] listando pacientes:", err);
    res.status(500).json({ error: "Error interno al listar pacientes" });
  }
}

// =========================
// GET /api/pacientes/:id
// =========================
export async function getOne(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const pacientes = await req.dbPool.query(`
      SELECT 
        p.id,
        p.nombres,
        p.apellidos,
        p.cedula,
        p.telefono,
        p.email,
        p.fecha_nacimiento,
        p.genero,
        p.direccion,
        p.id_centro,
        c.nombre as centro_nombre,
        c.ciudad as centro_ciudad,
        p.created_at,
        p.updated_at
      FROM pacientes p
      LEFT JOIN centros_medicos c ON p.id_centro = c.id
      WHERE p.id = ?
    `, [id]);

    if (pacientes.length === 0) return res.status(404).json({ error: "Paciente no encontrado" });

    res.json(pacientes[0]);
  } catch (err) {
    console.error("[ERROR] obteniendo paciente:", err);
    res.status(500).json({ error: "Error interno" });
  }
}

// =========================
// POST /api/pacientes
// =========================
export async function create(req: Request, res: Response) {
  try {
    const { 
      nombres, 
      apellidos, 
      cedula, 
      telefono, 
      email, 
      fecha_nacimiento, 
      genero, 
      direccion, 
      id_centro 
    } = req.body ?? {};

    if (!nombres?.trim() || !apellidos?.trim()) {
      return res.status(400).json({ error: "nombres y apellidos son obligatorios" });
    }

    // Determinar el centro a usar
    let centroId: number;
    if (req.user?.rol === 'admin') {
      // Admin puede especificar cualquier centro
      if (!id_centro) {
        return res.status(400).json({ error: "id_centro es obligatorio para administradores" });
      }
      centroId = Number(id_centro);
    } else if (req.user?.rol === 'medico') {
      // Médico usa su centro asignado
      centroId = req.user.id_centro;
    } else {
      return res.status(403).json({ error: "Rol no válido para crear pacientes" });
    }

    // Validar centro
    const centros = await req.dbPool.query("SELECT id FROM centros_medicos WHERE id = ?", [centroId]);
    if (centros.length === 0) {
      return res.status(400).json({ error: "El centro especificado no existe" });
    }

    // Verificar si la cédula ya existe (si se proporciona)
    if (cedula?.trim()) {
      const existingCedula = await req.dbPool.query("SELECT id FROM pacientes WHERE cedula = ?", [cedula.trim()]);
      if (existingCedula.length > 0) {
        return res.status(409).json({ error: "La cédula ya está registrada" });
      }
    }

    // Verificar si el email ya existe (si se proporciona)
    if (email?.trim()) {
      const existingEmail = await req.dbPool.query("SELECT id FROM pacientes WHERE email = ?", [email.trim()]);
      if (existingEmail.length > 0) {
        return res.status(409).json({ error: "El email ya está registrado" });
      }
    }

    const result = await req.dbPool.execute(`
      INSERT INTO pacientes (
        nombres, apellidos, cedula, telefono, email, 
        fecha_nacimiento, genero, direccion, id_centro
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      nombres.trim(), 
      apellidos.trim(), 
      cedula?.trim() || null, 
      telefono?.trim() || null, 
      email?.trim() || null, 
      fecha_nacimiento || null, 
      genero || null, 
      direccion?.trim() || null, 
      centroId
    ]);

    const created = {
      id: result.insertId,
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      cedula: cedula?.trim() || null,
      telefono: telefono?.trim() || null,
      email: email?.trim() || null,
      fecha_nacimiento: fecha_nacimiento || null,
      genero: genero || null,
      direccion: direccion?.trim() || null,
      id_centro: centroId
    };

    res.status(201).json(created);
  } catch (err: any) {
    console.error("[ERROR] creando paciente:", err);
    
    // Verificar si es error de constraint único
    if (err.code === 'ER_DUP_ENTRY') {
      if (err.message.includes('cedula')) {
        return res.status(409).json({ error: "La cédula ya está registrada" });
      }
      if (err.message.includes('email')) {
        return res.status(409).json({ error: "El email ya está registrado" });
      }
    }
    
    res.status(500).json({ error: "Error interno al crear paciente" });
  }
}

// =========================
// PUT /api/pacientes/:id
// =========================
export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const { 
      nombres, 
      apellidos, 
      cedula, 
      telefono, 
      email, 
      fecha_nacimiento, 
      genero, 
      direccion, 
      id_centro 
    } = req.body ?? {};

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
    if (cedula !== undefined) {
      // Verificar si la cédula ya existe (excluyendo el paciente actual)
      if (cedula?.trim()) {
        const existingCedula = await req.dbPool.query("SELECT id FROM pacientes WHERE cedula = ? AND id != ?", [cedula.trim(), id]);
        if (existingCedula.length > 0) {
          return res.status(409).json({ error: "La cédula ya está registrada" });
        }
      }
      updates.push("cedula = ?");
      values.push(cedula?.trim() || null);
    }
    if (telefono !== undefined) {
      updates.push("telefono = ?");
      values.push(telefono?.trim() || null);
    }
    if (email !== undefined) {
      // Verificar si el email ya existe (excluyendo el paciente actual)
      if (email?.trim()) {
        const existingEmail = await req.dbPool.query("SELECT id FROM pacientes WHERE email = ? AND id != ?", [email.trim(), id]);
        if (existingEmail.length > 0) {
          return res.status(409).json({ error: "El email ya está registrado" });
        }
      }
      updates.push("email = ?");
      values.push(email?.trim() || null);
    }
    if (fecha_nacimiento !== undefined) {
      updates.push("fecha_nacimiento = ?");
      values.push(fecha_nacimiento || null);
    }
    if (genero !== undefined) {
      updates.push("genero = ?");
      values.push(genero || null);
    }
    if (direccion !== undefined) {
      updates.push("direccion = ?");
      values.push(direccion?.trim() || null);
    }
    if (id_centro !== undefined) {
      // Validar centro
      const centros = await req.dbPool.query("SELECT id FROM centros_medicos WHERE id = ?", [Number(id_centro)]);
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

    const result = await req.dbPool.execute(`
      UPDATE pacientes 
      SET ${updates.join(", ")}
      WHERE id = ?
    `, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    const updated = {
      id,
      nombres: nombres?.trim(),
      apellidos: apellidos?.trim(),
      cedula: cedula?.trim() || null,
      telefono: telefono?.trim() || null,
      email: email?.trim() || null,
      fecha_nacimiento: fecha_nacimiento || null,
      genero: genero || null,
      direccion: direccion?.trim() || null,
      id_centro: id_centro ? Number(id_centro) : undefined
    };

    res.json(updated);
  } catch (err: any) {
    console.error("[ERROR] actualizando paciente:", err);
    
    // Verificar si es error de constraint único
    if (err.code === 'ER_DUP_ENTRY') {
      if (err.message.includes('cedula')) {
        return res.status(409).json({ error: "La cédula ya está registrada" });
      }
      if (err.message.includes('email')) {
        return res.status(409).json({ error: "El email ya está registrado" });
      }
    }
    
    res.status(500).json({ error: "Error interno al actualizar paciente" });
  }
}

// =========================
// DELETE /api/pacientes/:id
// =========================
export async function remove(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const result = await req.dbPool.execute("DELETE FROM pacientes WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    res.json({ message: "Paciente eliminado correctamente" });
  } catch (err) {
    console.error("[ERROR] eliminando paciente:", err);
    res.status(500).json({ error: "Error interno al eliminar paciente" });
  }
}

// =========================
// GET /api/pacientes/search
// =========================
export async function search(req: Request, res: Response) {
  try {
    const { q, centro } = req.query as Record<string, string>;
    
    let whereConditions: string[] = [];
    let params: any[] = [];

    if (q && q.trim()) {
      whereConditions.push(`(
        p.nombres LIKE ? OR 
        p.apellidos LIKE ? OR 
        p.cedula LIKE ? OR 
        p.email LIKE ?
      )`);
      const searchTerm = `%${q.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (centro) {
      whereConditions.push("p.id_centro = ?");
      params.push(Number(centro));
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    const pacientes = await req.dbPool.query(`
      SELECT 
        p.id,
        p.nombres,
        p.apellidos,
        p.cedula,
        p.telefono,
        p.email,
        p.fecha_nacimiento,
        p.genero,
        p.direccion,
        p.id_centro,
        c.nombre as centro_nombre,
        c.ciudad as centro_ciudad,
        p.created_at,
        p.updated_at
      FROM pacientes p
      LEFT JOIN centros_medicos c ON p.id_centro = c.id
      ${whereClause}
      ORDER BY p.apellidos ASC, p.nombres ASC
      LIMIT 50
    `, params);
    
    res.json(pacientes);
  } catch (err) {
    console.error("[ERROR] buscando pacientes:", err);
    res.status(500).json({ error: "Error interno al buscar pacientes" });
  }
}
