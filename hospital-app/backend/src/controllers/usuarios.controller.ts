import { Request, Response } from "express";
import { pools } from "../config/distributedDb";
import bcrypt from "bcrypt";
import { validateUsuario } from "../middlewares/validation";

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
// Función para obtener usuarios de todas las bases de datos (solo admin)
// =========================
async function getAllUsuariosFromAllDatabases() {
  const allUsuarios: any[] = [];
  
  try {
    // Consultar BD Central (Quito)
    const [centralUsuarios] = await pools.central.query(`
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
    
    allUsuarios.push(...(centralUsuarios as any[]));
    
    // Consultar BD Guayaquil
    try {
      const [guayaquilUsuarios] = await pools.guayaquil.query(`
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
      
      allUsuarios.push(...(guayaquilUsuarios as any[]));
    } catch (error) {
      console.log('⚠️ No se pudo conectar a BD Guayaquil:', error);
    }
    
    // Consultar BD Cuenca
    try {
      const [cuencaUsuarios] = await pools.cuenca.query(`
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
      
      allUsuarios.push(...(cuencaUsuarios as any[]));
    } catch (error) {
      console.log('⚠️ No se pudo conectar a BD Cuenca:', error);
    }
    
  } catch (error) {
    console.error('❌ Error consultando todas las bases de datos:', error);
    throw error;
  }
  
  // Eliminar duplicados por ID y ordenar
  const uniqueUsuarios = allUsuarios.filter((usuario, index, self) => 
    index === self.findIndex(u => u.id === usuario.id)
  );
  
  return uniqueUsuarios.sort((a, b) => a.id - b.id);
}

// =========================
// GET /api/admin/usuarios
// =========================
export async function list(req: Request, res: Response) {
  try {
    // Verificar si es admin para mostrar todos los usuarios
    const token = req.headers.authorization?.replace('Bearer ', '');
    let isAdmin = false;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        isAdmin = decoded.rol === 'admin';
        console.log('🔍 [USUARIOS] Usuario:', decoded.email, 'Rol:', decoded.rol, 'Es Admin:', isAdmin);
      } catch (error) {
        console.error('❌ Error decodificando token:', error);
      }
    }
    
    let usuarios;
    
    if (isAdmin) {
      // Admin: obtener usuarios de TODAS las bases de datos
      console.log('👑 [USUARIOS] Admin detectado - consultando TODAS las bases de datos');
      usuarios = await getAllUsuariosFromAllDatabases();
      console.log('📊 [USUARIOS] Total usuarios encontrados:', usuarios.length);
    } else {
      // Médico: obtener usuarios solo de su base de datos
      console.log('👨‍⚕️ [USUARIOS] Médico detectado - consultando BD local');
      const [result] = await req.dbPool.query(`
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
      usuarios = result;
    }
    
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

    const [usuarios] = await req.dbPool.query(`
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

    if ((usuarios as any[]).length === 0) return res.status(404).json({ error: "Usuario no encontrado" });

    res.json((usuarios as any[])[0]);
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

    if (req.user?.rol === 'admin') {
      // Admin: crear usuario en TODAS las bases de datos
      console.log('👑 [CREATE] Admin creando usuario en TODAS las bases de datos:', email);
      
      const results: any[] = [];
      let insertId: number | null = null;
      
      // Hash de la contraseña
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Crear en BD Central
      try {
        // Validar centro
        const [centros] = await pools.central.query("SELECT id FROM centros_medicos WHERE id = ?", [Number(id_centro)]);
        if ((centros as any[]).length === 0) {
          return res.status(400).json({ error: "El centro especificado no existe" });
        }

        // Si es médico, validar que el médico existe
        if (rol === 'medico' && id_medico) {
          const [medicos] = await pools.central.query("SELECT id FROM medicos WHERE id = ?", [Number(id_medico)]);
          if ((medicos as any[]).length === 0) {
            return res.status(400).json({ error: "El médico especificado no existe" });
          }
        }

        // Verificar si el email ya existe
        const [existingUsers] = await pools.central.query("SELECT id FROM usuarios WHERE email = ?", [email]);
        if ((existingUsers as any[]).length > 0) {
          return res.status(409).json({ error: "El email ya está registrado" });
        }

        const [centralResult] = await pools.central.execute(`
          INSERT INTO usuarios (email, password_hash, rol, id_centro, id_medico) 
          VALUES (?, ?, ?, ?, ?)
        `, [email, passwordHash, rol, Number(id_centro), id_medico ? Number(id_medico) : null]);
        results.push({ db: 'central', success: true, insertId: (centralResult as any).insertId });
        insertId = (centralResult as any).insertId; // Usar el ID de la BD central como referencia
        console.log('✅ [CREATE] Usuario creado en BD Central, ID:', (centralResult as any).insertId);
      } catch (error: any) {
        console.error('❌ [CREATE] Error en BD Central:', error);
        results.push({ db: 'central', success: false, error: error.message });
      }
      
      // Crear en BD Guayaquil
      try {
        const [guayaquilResult] = await pools.guayaquil.execute(`
          INSERT INTO usuarios (email, password_hash, rol, id_centro, id_medico) 
          VALUES (?, ?, ?, ?, ?)
        `, [email, passwordHash, rol, Number(id_centro), id_medico ? Number(id_medico) : null]);
        results.push({ db: 'guayaquil', success: true, insertId: (guayaquilResult as any).insertId });
        console.log('✅ [CREATE] Usuario creado en BD Guayaquil, ID:', (guayaquilResult as any).insertId);
      } catch (error: any) {
        console.error('❌ [CREATE] Error en BD Guayaquil:', error);
        results.push({ db: 'guayaquil', success: false, error: error.message });
      }
      
      // Crear en BD Cuenca
      try {
        const [cuencaResult] = await pools.cuenca.execute(`
          INSERT INTO usuarios (email, password_hash, rol, id_centro, id_medico) 
          VALUES (?, ?, ?, ?, ?)
        `, [email, passwordHash, rol, Number(id_centro), id_medico ? Number(id_medico) : null]);
        results.push({ db: 'cuenca', success: true, insertId: (cuencaResult as any).insertId });
        console.log('✅ [CREATE] Usuario creado en BD Cuenca, ID:', (cuencaResult as any).insertId);
      } catch (error: any) {
        console.error('❌ [CREATE] Error en BD Cuenca:', error);
        results.push({ db: 'cuenca', success: false, error: error.message });
      }
      
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      
      if (successCount === 0) {
        return res.status(500).json({ 
          error: "No se pudo crear el usuario en ninguna base de datos",
          details: results
        });
      }
      
      const created = {
        id: insertId,
        email: email,
        rol,
        id_centro: Number(id_centro),
        id_medico: id_medico ? Number(id_medico) : null,
        created_in_databases: successCount,
        total_databases: totalCount,
        details: results
      };

      res.status(201).json(created);
    } else {
      // Médico: crear solo en su base de datos
      console.log('👨‍⚕️ [CREATE] Médico creando usuario en su BD local:', email);
      
      // Validar centro
      const [centros] = await req.dbPool.query("SELECT id FROM centros_medicos WHERE id = ?", [Number(id_centro)]);
      if ((centros as any[]).length === 0) {
        return res.status(400).json({ error: "El centro especificado no existe" });
      }

      // Si es médico, validar que el médico existe
      if (rol === 'medico' && id_medico) {
        const [medicos] = await req.dbPool.query("SELECT id FROM medicos WHERE id = ?", [Number(id_medico)]);
        if ((medicos as any[]).length === 0) {
          return res.status(400).json({ error: "El médico especificado no existe" });
        }
      }

      // Verificar si el email ya existe
      const [existingUsers] = await req.dbPool.query("SELECT id FROM usuarios WHERE email = ?", [email]);
      if ((existingUsers as any[]).length > 0) {
        return res.status(409).json({ error: "El email ya está registrado" });
      }

      // Hash de la contraseña
      const passwordHash = await bcrypt.hash(password, 10);

      const [result] = await req.dbPool.execute(`
        INSERT INTO usuarios (email, password_hash, rol, id_centro, id_medico) 
        VALUES (?, ?, ?, ?, ?)
      `, [email, passwordHash, rol, Number(id_centro), id_medico ? Number(id_medico) : null]);

      const created = {
        id: (result as any).insertId,
        email: email,
        rol,
        id_centro: Number(id_centro),
        id_medico: id_medico ? Number(id_medico) : null
      };

      res.status(201).json(created);
    }
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
      const [existingUsers] = await req.dbPool.query("SELECT id FROM usuarios WHERE email = ? AND id != ?", [email.trim(), id]);
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
      const [centros] = await req.dbPool.query("SELECT id FROM centros_medicos WHERE id = ?", [Number(id_centro)]);
      if ((centros as any[]).length === 0) {
        return res.status(400).json({ error: "El centro especificado no existe" });
      }
      updates.push("id_centro = ?");
      values.push(Number(id_centro));
    }

    if (id_medico !== undefined) {
      if (id_medico) {
        // Validar médico
        const [medicos] = await req.dbPool.query("SELECT id FROM medicos WHERE id = ?", [Number(id_medico)]);
        if ((medicos as any[]).length === 0) {
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

    const [result] = await req.dbPool.execute(`
      UPDATE usuarios 
      SET ${updates.join(", ")}
      WHERE id = ?
    `, values);

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // SINCRONIZACIÓN AUTOMÁTICA: Si se actualizó el centro de un usuario médico, 
    // también actualizar el centro del médico en la tabla medicos
    if (id_centro !== undefined && id_medico !== undefined && id_medico) {
      try {
        await req.dbPool.execute(`
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

    const [result] = await req.dbPool.execute("DELETE FROM usuarios WHERE id = ?", [id]);

    if ((result as any).affectedRows === 0) {
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
    const [usuariosMedicos] = await req.dbPool.query(`
      SELECT u.id, u.id_centro, u.id_medico, m.id_centro as medico_centro_actual
      FROM usuarios u
      INNER JOIN medicos m ON u.id_medico = m.id
      WHERE u.rol = 'medico' AND u.id_medico IS NOT NULL
    `);
    
    let sincronizados = 0;
    let errores = 0;
    
    for (const usuario of usuariosMedicos as any[]) {
      try {
        // Si el centro del usuario es diferente al centro del médico, sincronizar
        if (usuario.id_centro !== usuario.medico_centro_actual) {
          await req.dbPool.execute(`
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
      usuarios_revisados: (usuariosMedicos as any[]).length,
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
