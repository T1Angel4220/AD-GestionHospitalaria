import { Request, Response } from "express";
import { query, execute } from "../config/db";
import bcrypt from "bcrypt";
import { validateUsuario } from "../middlewares/validation";

// =========================
// GET /api/admin/usuarios
// =========================
export async function list(req: Request, res: Response) {
  try {
    const usuarios = await query(`
      SELECT 
        u.id,
        u.email,
        u.rol,
        u.id_centro,
        u.id_medico,
        c.nombre as centro_nombre,
        c.ciudad as centro_ciudad,
        m.nombres as medico_nombres,
        m.apellidos as medico_apellidos
      FROM usuarios u
      LEFT JOIN centros_medicos c ON u.id_centro = c.id
      LEFT JOIN medicos m ON u.id_medico = m.id
      ORDER BY u.id ASC
    `);
    
    res.json(usuarios);
  } catch (err) {
    console.error("[ERROR] listando usuarios:", err);
    res.status(500).json({ error: "Error interno al listar usuarios" });
  }
}

// =========================
// GET /api/admin/usuarios/:id
// =========================
export async function getOne(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const usuarios = await query(`
      SELECT 
        u.id,
        u.email,
        u.rol,
        u.id_centro,
        u.id_medico,
        c.nombre as centro_nombre,
        c.ciudad as centro_ciudad,
        m.nombres as medico_nombres,
        m.apellidos as medico_apellidos
      FROM usuarios u
      LEFT JOIN centros_medicos c ON u.id_centro = c.id
      LEFT JOIN medicos m ON u.id_medico = m.id
      WHERE u.id = ?
    `, [id]);

    if (usuarios.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });

    res.json(usuarios[0]);
  } catch (err) {
    console.error("[ERROR] obteniendo usuario:", err);
    res.status(500).json({ error: "Error interno" });
  }
}

// =========================
// POST /api/admin/usuarios
// =========================
export async function create(req: Request, res: Response) {
  try {
    const { email, password, rol, id_centro, id_medico } = req.body ?? {};

    // Las validaciones detalladas ya se hicieron en el middleware

    // Validar centro
    const centros = await query("SELECT id FROM centros_medicos WHERE id = ?", [Number(id_centro)]);
    if (centros.length === 0) {
      return res.status(400).json({ error: "El centro especificado no existe" });
    }

    // Si es médico, validar que el médico existe
    if (rol === 'medico' && id_medico) {
      const medicos = await query("SELECT id FROM medicos WHERE id = ?", [Number(id_medico)]);
      if (medicos.length === 0) {
        return res.status(400).json({ error: "El médico especificado no existe" });
      }
    }

    // Verificar si el email ya existe
    const existingUsers = await query("SELECT id FROM usuarios WHERE email = ?", [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: "El email ya está registrado" });
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await execute(`
      INSERT INTO usuarios (email, password_hash, rol, id_centro, id_medico) 
      VALUES (?, ?, ?, ?, ?)
    `, [email, passwordHash, rol, Number(id_centro), id_medico ? Number(id_medico) : null]);

    // SINCRONIZACIÓN AUTOMÁTICA: Si se creó un usuario médico, 
    // también actualizar el centro del médico en la tabla medicos
    if (rol === 'medico' && id_medico) {
      try {
        await execute(`
          UPDATE medicos 
          SET id_centro = ?
          WHERE id = ?
        `, [Number(id_centro), Number(id_medico)]);
        
        console.log(`[SYNC] Centro del médico ${id_medico} actualizado a centro ${id_centro} al crear usuario`);
      } catch (syncError) {
        console.error("[ERROR] Error sincronizando centro del médico:", syncError);
        // No fallar la operación principal por un error de sincronización
      }
    }

    const created = {
      id: result.insertId,
      email: email,
      rol,
      id_centro: Number(id_centro),
      id_medico: id_medico ? Number(id_medico) : null
    };

    res.status(201).json(created);
  } catch (err) {
    console.error("[ERROR] creando usuario:", err);
    res.status(500).json({ error: "Error interno al crear usuario" });
  }
}

// =========================
// PUT /api/admin/usuarios/:id
// =========================
export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const { email, password, rol, id_centro, id_medico } = req.body ?? {};

    // Construir objeto dinámico con los campos presentes
    const updates: string[] = [];
    const values: any[] = [];

    if (email !== undefined) {
      // Verificar si el email ya existe (excluyendo el usuario actual)
      const existingUsers = await query("SELECT id FROM usuarios WHERE email = ? AND id != ?", [email.trim(), id]);
      if (existingUsers.length > 0) {
        return res.status(409).json({ error: "El email ya está registrado" });
      }
      updates.push("email = ?");
      values.push(email.trim());
    }

    if (password !== undefined) {
      const passwordHash = await bcrypt.hash(password.trim(), 10);
      updates.push("password_hash = ?");
      values.push(passwordHash);
    }

    if (rol !== undefined) {
      if (!['admin', 'medico'].includes(rol)) {
        return res.status(400).json({ error: "rol debe ser 'admin' o 'medico'" });
      }
      updates.push("rol = ?");
      values.push(rol);
    }

    if (id_centro !== undefined) {
      // Validar centro
      const centros = await query("SELECT id FROM centros_medicos WHERE id = ?", [Number(id_centro)]);
      if (centros.length === 0) {
        return res.status(400).json({ error: "El centro especificado no existe" });
      }
      updates.push("id_centro = ?");
      values.push(Number(id_centro));
    }

    if (id_medico !== undefined) {
      if (id_medico) {
        // Validar médico
        const medicos = await query("SELECT id FROM medicos WHERE id = ?", [Number(id_medico)]);
        if (medicos.length === 0) {
          return res.status(400).json({ error: "El médico especificado no existe" });
        }
      }
      updates.push("id_medico = ?");
      values.push(id_medico ? Number(id_medico) : null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "Debe enviar al menos un campo para actualizar" });
    }

    values.push(id);

    const result = await execute(`
      UPDATE usuarios 
      SET ${updates.join(", ")}
      WHERE id = ?
    `, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // SINCRONIZACIÓN AUTOMÁTICA: Si se actualizó el centro de un usuario médico, 
    // también actualizar el centro del médico en la tabla medicos
    if (id_centro !== undefined && id_medico !== undefined && id_medico) {
      try {
        await execute(`
          UPDATE medicos 
          SET id_centro = ?
          WHERE id = ?
        `, [Number(id_centro), Number(id_medico)]);
        
        console.log(`[SYNC] Centro del médico ${id_medico} actualizado a centro ${id_centro}`);
      } catch (syncError) {
        console.error("[ERROR] Error sincronizando centro del médico:", syncError);
        // No fallar la operación principal por un error de sincronización
      }
    }

    const updated = {
      id,
      email: email?.trim(),
      rol,
      id_centro: id_centro ? Number(id_centro) : undefined,
      id_medico: id_medico !== undefined ? (id_medico ? Number(id_medico) : null) : undefined
    };

    res.json(updated);
  } catch (err) {
    console.error("[ERROR] actualizando usuario:", err);
    res.status(500).json({ error: "Error interno al actualizar usuario" });
  }
}

// =========================
// DELETE /api/admin/usuarios/:id
// =========================
export async function remove(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const result = await execute("DELETE FROM usuarios WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ message: "Usuario eliminado correctamente" });
  } catch (err) {
    console.error("[ERROR] eliminando usuario:", err);
    res.status(500).json({ error: "Error interno al eliminar usuario" });
  }
}

// =========================
// POST /api/admin/usuarios/sync-centros
// =========================
export async function syncCentros(req: Request, res: Response) {
  try {
    console.log('[SYNC] Iniciando sincronización de centros...');
    
    // Obtener todos los usuarios médicos con sus centros
    const usuariosMedicos = await query(`
      SELECT u.id, u.id_centro, u.id_medico, m.id_centro as medico_centro_actual
      FROM usuarios u
      INNER JOIN medicos m ON u.id_medico = m.id
      WHERE u.rol = 'medico' AND u.id_medico IS NOT NULL
    `);
    
    let sincronizados = 0;
    let errores = 0;
    
    for (const usuario of usuariosMedicos) {
      try {
        // Si el centro del usuario es diferente al centro del médico, sincronizar
        if (usuario.id_centro !== usuario.medico_centro_actual) {
          await execute(`
            UPDATE medicos 
            SET id_centro = ?
            WHERE id = ?
          `, [usuario.id_centro, usuario.id_medico]);
          
          console.log(`[SYNC] Médico ${usuario.id_medico} sincronizado: centro ${usuario.medico_centro_actual} → ${usuario.id_centro}`);
          sincronizados++;
        }
      } catch (error) {
        console.error(`[ERROR] Error sincronizando médico ${usuario.id_medico}:`, error);
        errores++;
      }
    }
    
    const resultado = {
      mensaje: "Sincronización completada",
      usuarios_revisados: usuariosMedicos.length,
      medicos_sincronizados: sincronizados,
      errores: errores
    };
    
    console.log('[SYNC] Resultado:', resultado);
    res.json(resultado);
    
  } catch (err) {
    console.error("[ERROR] sincronizando centros:", err);
    res.status(500).json({ error: "Error interno al sincronizar centros" });
  }
}
