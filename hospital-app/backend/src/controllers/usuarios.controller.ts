import { Request, Response } from "express";
import { pools } from "../config/distributedDb";
import bcrypt from "bcrypt";
import { validateUsuario } from "../middlewares/validation";
import jwt from "jsonwebtoken";

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
    
    // Agregar información de distribución
    (centralUsuarios as any[]).forEach(usuario => {
      usuario.origen_bd = 'central';
      usuario.id_unico = `central-${usuario.id}`;
      usuario.id_frontend = `central-${usuario.id}`;
    });
    
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
      
      // Agregar información de distribución
      (guayaquilUsuarios as any[]).forEach(usuario => {
        usuario.origen_bd = 'guayaquil';
        usuario.id_unico = `guayaquil-${usuario.id}`;
        usuario.id_frontend = `guayaquil-${usuario.id}`;
      });
      
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
      
      // Agregar información de distribución
      (cuencaUsuarios as any[]).forEach(usuario => {
        usuario.origen_bd = 'cuenca';
        usuario.id_unico = `cuenca-${usuario.id}`;
        usuario.id_frontend = `cuenca-${usuario.id}`;
      });
      
      allUsuarios.push(...(cuencaUsuarios as any[]));
    } catch (error) {
      console.log('⚠️ No se pudo conectar a BD Cuenca:', error);
    }
    
  } catch (error) {
    console.error('❌ Error consultando todas las bases de datos:', error);
    throw error;
  }
  
  // Ordenar por ID frontend
  return allUsuarios.sort((a, b) => a.id_frontend.localeCompare(b.id_frontend));
}

// =========================
// Función para obtener médicos de un centro específico
// =========================
async function getMedicosByCentro(centroId: number) {
  let dbPool: any;
  
  if (centroId === 1) {
    dbPool = pools.central;
  } else if (centroId === 2) {
    dbPool = pools.guayaquil;
  } else if (centroId === 3) {
    dbPool = pools.cuenca;
  } else {
    throw new Error("Centro inválido");
  }
  
  const [medicos] = await dbPool.query(`
    SELECT 
      id,
      nombres,
      apellidos,
      id_especialidad,
      id_centro
    FROM medicos
    WHERE id_centro = ?
    ORDER BY nombres ASC
  `, [centroId]);
  
  return medicos;
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

    // Decodificar JWT para determinar si es admin
    const token = req.headers.authorization?.replace('Bearer ', '');
    let isAdmin = false;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        isAdmin = decoded.rol === 'admin';
        console.log('🔐 [CREATE] Token decodificado:', { rol: decoded.rol, isAdmin, id_centro });
      } catch (error) {
        console.error('❌ [CREATE] Error decodificando token:', error);
      }
    }

    if (isAdmin) {
      // Admin: crear usuario en la base de datos específica del centro
      console.log('👑 [CREATE] Admin creando usuario en centro específico:', id_centro, 'para:', email);
      
      // Determinar qué base de datos usar basado en el id_centro
      let targetPool;
      let dbName;
      
      if (id_centro === 1) {
        targetPool = pools.central;
        dbName = 'central';
      } else if (id_centro === 2) {
        targetPool = pools.guayaquil;
        dbName = 'guayaquil';
      } else if (id_centro === 3) {
        targetPool = pools.cuenca;
        dbName = 'cuenca';
      } else {
        return res.status(400).json({ error: "Centro médico no válido" });
      }
      
      console.log('🗄️ [CREATE] Usando base de datos:', dbName);
      
      // Hash de la contraseña
      const passwordHash = await bcrypt.hash(password, 10);
      
      try {
        // Validar centro
        const [centros] = await targetPool.query("SELECT id FROM centros_medicos WHERE id = ?", [Number(id_centro)]);
        if ((centros as any[]).length === 0) {
          return res.status(400).json({ error: "El centro especificado no existe" });
        }

        // Si es médico, validar que el médico existe en la misma base de datos
        if (rol === 'medico' && id_medico) {
          const [medicos] = await targetPool.query("SELECT id FROM medicos WHERE id = ?", [Number(id_medico)]);
          if ((medicos as any[]).length === 0) {
            return res.status(400).json({ error: "El médico especificado no existe en este centro" });
          }
        }

        // Verificar si el email ya existe en esta base de datos
        const [existingUsers] = await targetPool.query("SELECT id FROM usuarios WHERE email = ?", [email]);
        if ((existingUsers as any[]).length > 0) {
          return res.status(409).json({ error: "El email ya está registrado" });
        }

        const [result] = await targetPool.execute(`
          INSERT INTO usuarios (email, password_hash, rol, id_centro, id_medico) 
          VALUES (?, ?, ?, ?, ?)
        `, [email, passwordHash, rol, Number(id_centro), id_medico ? Number(id_medico) : null]);
        
        console.log('✅ [CREATE] Usuario creado en', dbName, 'ID:', (result as any).insertId);
        
        res.status(201).json({
          message: "Usuario creado exitosamente",
          id: (result as any).insertId,
          origen_bd: dbName,
          id_frontend: `${dbName}-${(result as any).insertId}`
        });
      } catch (error: any) {
        console.error('❌ [CREATE] Error en', dbName, ':', error);
        res.status(500).json({ error: `Error al crear usuario en ${dbName}: ${error.message}` });
      }
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
    console.log('🔄 [BACKEND-UPDATE] Recibida petición de actualización:', {
      id,
      body: req.body,
      headers: req.headers
    });
    
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const { email, password, rol, id_centro, id_medico } = req.body ?? {};

    // Decodificar JWT para determinar si es admin
    const token = req.headers.authorization?.replace('Bearer ', '');
    let isAdmin = false;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        isAdmin = decoded.rol === 'admin';
        console.log('🔐 [UPDATE] Token decodificado:', { rol: decoded.rol, isAdmin });
      } catch (error) {
        console.error('❌ [UPDATE] Error decodificando token:', error);
      }
    }

    if (isAdmin) {
      // Admin: buscar usuario en todas las bases de datos y actualizar en la correcta
      console.log('👑 [UPDATE] Admin actualizando usuario ID:', id);
      
      let usuarioEncontrado: any = null;
      let targetPool: any = null;
      let dbName = '';
      
      // Buscar en BD Central
      try {
        const [centralUsuarios] = await pools.central.query("SELECT id, email, rol, id_centro, id_medico FROM usuarios WHERE id = ?", [id]);
        if ((centralUsuarios as any[]).length > 0) {
          const usuario = (centralUsuarios as any[])[0];
          // Verificar que el usuario realmente pertenece a este centro
          if (usuario.id_centro === 1) {
            usuarioEncontrado = usuario;
            targetPool = pools.central;
            dbName = 'central';
            console.log('✅ [UPDATE] Usuario encontrado en BD Central (centro correcto)');
          } else {
            console.log('⚠️ [UPDATE] Usuario encontrado en BD Central pero pertenece a otro centro:', usuario.id_centro);
          }
        }
      } catch (error) {
        console.log('⚠️ [UPDATE] Error buscando en BD Central:', error);
      }
      
      // Si no se encontró en Central, buscar en Guayaquil
      if (!usuarioEncontrado) {
        try {
          const [guayaquilUsuarios] = await pools.guayaquil.query("SELECT id, email, rol, id_centro, id_medico FROM usuarios WHERE id = ?", [id]);
          if ((guayaquilUsuarios as any[]).length > 0) {
            const usuario = (guayaquilUsuarios as any[])[0];
            // Verificar que el usuario realmente pertenece a este centro
            if (usuario.id_centro === 2) {
              usuarioEncontrado = usuario;
              targetPool = pools.guayaquil;
              dbName = 'guayaquil';
              console.log('✅ [UPDATE] Usuario encontrado en BD Guayaquil (centro correcto)');
            } else {
              console.log('⚠️ [UPDATE] Usuario encontrado en BD Guayaquil pero pertenece a otro centro:', usuario.id_centro);
            }
          }
        } catch (error) {
          console.log('⚠️ [UPDATE] Error buscando en BD Guayaquil:', error);
        }
      }
      
      // Si no se encontró en Guayaquil, buscar en Cuenca
      if (!usuarioEncontrado) {
        try {
          const [cuencaUsuarios] = await pools.cuenca.query("SELECT id, email, rol, id_centro, id_medico FROM usuarios WHERE id = ?", [id]);
          if ((cuencaUsuarios as any[]).length > 0) {
            const usuario = (cuencaUsuarios as any[])[0];
            // Verificar que el usuario realmente pertenece a este centro
            if (usuario.id_centro === 3) {
              usuarioEncontrado = usuario;
              targetPool = pools.cuenca;
              dbName = 'cuenca';
              console.log('✅ [UPDATE] Usuario encontrado en BD Cuenca (centro correcto)');
            } else {
              console.log('⚠️ [UPDATE] Usuario encontrado en BD Cuenca pero pertenece a otro centro:', usuario.id_centro);
            }
          }
        } catch (error) {
          console.log('⚠️ [UPDATE] Error buscando en BD Cuenca:', error);
        }
      }
      
      if (!usuarioEncontrado || !targetPool) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      
      // Construir objeto dinámico con los campos presentes
      const updates: string[] = [];
      const values: any[] = [];

      if (email !== undefined) {
        // Verificar si el email ya existe (excluyendo el usuario actual)
        const [existingUsers] = await targetPool.query("SELECT id FROM usuarios WHERE email = ? AND id != ?", [email.trim(), id]);
        if ((existingUsers as any[]).length > 0) {
          return res.status(409).json({ error: "El email ya está registrado" });
        }
        updates.push("email = ?");
        values.push(email.trim());
      }

      if (password !== undefined && password.trim() !== '') {
        const passwordHash = await bcrypt.hash(password.trim(), 10);
        updates.push("password_hash = ?");
        values.push(passwordHash);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: "Debe enviar al menos un campo para actualizar" });
      }

      values.push(id);

      const [result] = await targetPool.execute(`
        UPDATE usuarios 
        SET ${updates.join(", ")}
        WHERE id = ?
      `, values);

      if ((result as any).affectedRows === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      console.log('✅ [UPDATE] Usuario actualizado en', dbName, 'ID:', id);
      
      const updated = {
        id,
        email: email?.trim(),
        rol: usuarioEncontrado.rol,
        id_centro: usuarioEncontrado.id_centro,
        id_medico: usuarioEncontrado.id_medico,
        origen_bd: dbName,
        id_frontend: `${dbName}-${id}`
      };

      res.json(updated);
    } else {
      // Médico: actualizar solo en su base de datos
      console.log('👨‍⚕️ [UPDATE] Médico actualizando usuario de su BD local, ID:', id);
      
      const updates: string[] = [];
      const values: any[] = [];

      if (email !== undefined) {
        // Verificar si el email ya existe (excluyendo el usuario actual)
        const [existingUsers] = await req.dbPool.query("SELECT id FROM usuarios WHERE email = ? AND id != ?", [email.trim(), id]);
        if ((existingUsers as any[]).length > 0) {
          return res.status(409).json({ error: "El email ya está registrado" });
        }
        updates.push("email = ?");
        values.push(email.trim());
      }

      if (password !== undefined && password.trim() !== '') {
        const passwordHash = await bcrypt.hash(password.trim(), 10);
        updates.push("password_hash = ?");
        values.push(passwordHash);
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

      const updated = {
        id,
        email: email?.trim(),
        rol: rol,
        id_centro: id_centro ? Number(id_centro) : undefined,
        id_medico: id_medico !== undefined ? (id_medico ? Number(id_medico) : null) : undefined
      };

      res.json(updated);
    }
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

    // Decodificar JWT para determinar si es admin
    const token = req.headers.authorization?.replace('Bearer ', '');
    let isAdmin = false;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        isAdmin = decoded.rol === 'admin';
        console.log('🔐 [DELETE] Token decodificado:', { rol: decoded.rol, isAdmin });
      } catch (error) {
        console.error('❌ [DELETE] Error decodificando token:', error);
      }
    }

    if (isAdmin) {
      // Admin: buscar usuario en todas las bases de datos y eliminar de la correcta
      console.log('👑 [DELETE] Admin eliminando usuario ID:', id);
      
      let usuarioEncontrado: any = null;
      let targetPool: any = null;
      let dbName = '';
      
      // Buscar en BD Central
      try {
        const [centralUsuarios] = await pools.central.query("SELECT id, email, id_centro FROM usuarios WHERE id = ?", [id]);
        if ((centralUsuarios as any[]).length > 0) {
          const usuario = (centralUsuarios as any[])[0];
          // Verificar que el usuario realmente pertenece a este centro
          if (usuario.id_centro === 1) {
            usuarioEncontrado = usuario;
            targetPool = pools.central;
            dbName = 'central';
            console.log('✅ [DELETE] Usuario encontrado en BD Central (centro correcto)');
          } else {
            console.log('⚠️ [DELETE] Usuario encontrado en BD Central pero pertenece a otro centro:', usuario.id_centro);
          }
        }
      } catch (error) {
        console.log('⚠️ [DELETE] Error buscando en BD Central:', error);
      }
      
      // Si no se encontró en Central, buscar en Guayaquil
      if (!usuarioEncontrado) {
        try {
          const [guayaquilUsuarios] = await pools.guayaquil.query("SELECT id, email, id_centro FROM usuarios WHERE id = ?", [id]);
          if ((guayaquilUsuarios as any[]).length > 0) {
            const usuario = (guayaquilUsuarios as any[])[0];
            // Verificar que el usuario realmente pertenece a este centro
            if (usuario.id_centro === 2) {
              usuarioEncontrado = usuario;
              targetPool = pools.guayaquil;
              dbName = 'guayaquil';
              console.log('✅ [DELETE] Usuario encontrado en BD Guayaquil (centro correcto)');
            } else {
              console.log('⚠️ [DELETE] Usuario encontrado en BD Guayaquil pero pertenece a otro centro:', usuario.id_centro);
            }
          }
        } catch (error) {
          console.log('⚠️ [DELETE] Error buscando en BD Guayaquil:', error);
        }
      }
      
      // Si no se encontró en Guayaquil, buscar en Cuenca
      if (!usuarioEncontrado) {
        try {
          const [cuencaUsuarios] = await pools.cuenca.query("SELECT id, email, id_centro FROM usuarios WHERE id = ?", [id]);
          if ((cuencaUsuarios as any[]).length > 0) {
            const usuario = (cuencaUsuarios as any[])[0];
            // Verificar que el usuario realmente pertenece a este centro
            if (usuario.id_centro === 3) {
              usuarioEncontrado = usuario;
              targetPool = pools.cuenca;
              dbName = 'cuenca';
              console.log('✅ [DELETE] Usuario encontrado en BD Cuenca (centro correcto)');
            } else {
              console.log('⚠️ [DELETE] Usuario encontrado en BD Cuenca pero pertenece a otro centro:', usuario.id_centro);
            }
          }
        } catch (error) {
          console.log('⚠️ [DELETE] Error buscando en BD Cuenca:', error);
        }
      }
      
      if (!usuarioEncontrado || !targetPool) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      
      // Eliminar de la base de datos correcta
      try {
        const [result] = await targetPool.execute("DELETE FROM usuarios WHERE id = ?", [id]);
        
        if ((result as any).affectedRows === 0) {
          return res.status(404).json({ error: "Usuario no encontrado" });
        }
        
        console.log('✅ [DELETE] Usuario eliminado de', dbName, 'ID:', id);
        res.json({ message: "Usuario eliminado correctamente" });
      } catch (error) {
        console.error('❌ [DELETE] Error eliminando de', dbName, ':', error);
        res.status(500).json({ error: `Error al eliminar usuario de ${dbName}` });
      }
    } else {
      // Médico: eliminar solo de su base de datos
      console.log('👨‍⚕️ [DELETE] Médico eliminando usuario de su BD local, ID:', id);
      
      const [result] = await req.dbPool.execute("DELETE FROM usuarios WHERE id = ?", [id]);

      if ((result as any).affectedRows === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.json({ message: "Usuario eliminado correctamente" });
    }
  } catch (err) {
    console.error("[ERROR] eliminando usuario:", err);
    res.status(500).json({ error: "Error interno al eliminar usuario" });
  }
}

// =========================
// GET /api/admin/usuarios/medicos-por-centro/:centroId
// =========================
export async function getMedicosByCentroEndpoint(req: Request, res: Response) {
  try {
    const centroId = Number(req.params.centroId);
    if (isNaN(centroId)) {
      return res.status(400).json({ error: "ID de centro inválido" });
    }

    const medicos = await getMedicosByCentro(centroId);
    res.json(medicos);
  } catch (err) {
    console.error("[ERROR] obteniendo médicos por centro:", err);
    res.status(500).json({ error: "Error interno al obtener médicos" });
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
