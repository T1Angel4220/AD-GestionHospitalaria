import { Request, Response } from "express";
import { pools } from "../config/distributedDb";

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
// Función para obtener pacientes de todas las bases de datos (solo admin)
// =========================
async function getAllPacientesFromAllDatabases() {
  const allPacientes: any[] = [];
  
  try {
    // Consultar BD Central (Quito)
    const [centralPacientes] = await pools.central.query(`
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
        p.created_at
      FROM pacientes p
      LEFT JOIN centros_medicos c ON p.id_centro = c.id
      ORDER BY p.created_at DESC
    `);
    
    // Agregar información de centro
    (centralPacientes as any[]).forEach(paciente => {
      paciente.centro_nombre = paciente.centro_nombre || 'Hospital Central Quito';
      paciente.centro_ciudad = paciente.centro_ciudad || 'Quito';
    });
    
    allPacientes.push(...(centralPacientes as any[]));
    
    // Consultar BD Guayaquil
    try {
      const [guayaquilPacientes] = await pools.guayaquil.query(`
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
          p.created_at
        FROM pacientes p
        LEFT JOIN centros_medicos c ON p.id_centro = c.id
        ORDER BY p.created_at DESC
      `);
      
      (guayaquilPacientes as any[]).forEach(paciente => {
        paciente.centro_nombre = paciente.centro_nombre || 'Hospital Guayaquil';
        paciente.centro_ciudad = paciente.centro_ciudad || 'Guayaquil';
      });
      
      allPacientes.push(...(guayaquilPacientes as any[]));
    } catch (error) {
      console.log('⚠️ No se pudo conectar a BD Guayaquil:', error);
    }
    
    // Consultar BD Cuenca
    try {
      const [cuencaPacientes] = await pools.cuenca.query(`
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
          p.created_at
        FROM pacientes p
        LEFT JOIN centros_medicos c ON p.id_centro = c.id
        ORDER BY p.created_at DESC
      `);
      
      (cuencaPacientes as any[]).forEach(paciente => {
        paciente.centro_nombre = paciente.centro_nombre || 'Hospital Cuenca';
        paciente.centro_ciudad = paciente.centro_ciudad || 'Cuenca';
      });
      
      allPacientes.push(...(cuencaPacientes as any[]));
    } catch (error) {
      console.log('⚠️ No se pudo conectar a BD Cuenca:', error);
    }
    
  } catch (error) {
    console.error('❌ Error consultando todas las bases de datos:', error);
    throw error;
  }
  
  // Ordenar por fecha de creación (más recientes primero)
  return allPacientes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

// =========================
// GET /api/pacientes
// =========================
export async function list(req: Request, res: Response) {
  try {
    // Verificar si es admin para mostrar todos los pacientes
    const token = req.headers.authorization?.replace('Bearer ', '');
    let isAdmin = false;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        isAdmin = decoded.rol === 'admin';
        console.log('🔍 [PACIENTES] Usuario:', decoded.email, 'Rol:', decoded.rol, 'Es Admin:', isAdmin);
      } catch (error) {
        console.error('❌ Error decodificando token:', error);
      }
    }
    
    let pacientes;
    
    if (isAdmin) {
      // Admin: obtener pacientes de TODAS las bases de datos
      console.log('👑 [PACIENTES] Admin detectado - consultando TODAS las bases de datos');
      pacientes = await getAllPacientesFromAllDatabases();
      console.log('📊 [PACIENTES] Total pacientes encontrados:', pacientes.length);
    } else {
      // Médico: obtener pacientes solo de su base de datos
      console.log('👨‍⚕️ [PACIENTES] Médico detectado - consultando BD local');
      const [result] = await req.dbPool.query(`
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
      pacientes = result;
    }
    
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
// Función para verificar cédula en todas las bases de datos (solo admin)
// =========================
async function checkCedulaInAllDatabases(cedula: string): Promise<boolean> {
  try {
    // Verificar en BD Central (Quito)
    const [centralResult] = await pools.central.query("SELECT id FROM pacientes WHERE cedula = ?", [cedula.trim()]);
    if ((centralResult as any[]).length > 0) {
      console.log('🔍 Cédula encontrada en BD Central (Quito)');
      return true;
    }
    
    // Verificar en BD Guayaquil
    try {
      const [guayaquilResult] = await pools.guayaquil.query("SELECT id FROM pacientes WHERE cedula = ?", [cedula.trim()]);
      if ((guayaquilResult as any[]).length > 0) {
        console.log('🔍 Cédula encontrada en BD Guayaquil');
        return true;
      }
    } catch (error) {
      console.log('⚠️ No se pudo verificar en BD Guayaquil:', error);
    }
    
    // Verificar en BD Cuenca
    try {
      const [cuencaResult] = await pools.cuenca.query("SELECT id FROM pacientes WHERE cedula = ?", [cedula.trim()]);
      if ((cuencaResult as any[]).length > 0) {
        console.log('🔍 Cédula encontrada en BD Cuenca');
        return true;
      }
    } catch (error) {
      console.log('⚠️ No se pudo verificar en BD Cuenca:', error);
    }
    
    return false; // No encontrada en ninguna BD
  } catch (error) {
    console.error('❌ Error verificando cédula en todas las BDs:', error);
    throw error;
  }
}

// =========================
// Función para verificar email en todas las bases de datos (solo admin)
// =========================
async function checkEmailInAllDatabases(email: string): Promise<boolean> {
  try {
    // Verificar en BD Central (Quito)
    const [centralResult] = await pools.central.query("SELECT id FROM pacientes WHERE email = ?", [email.trim()]);
    if ((centralResult as any[]).length > 0) {
      console.log('🔍 Email encontrado en BD Central (Quito)');
      return true;
    }
    
    // Verificar en BD Guayaquil
    try {
      const [guayaquilResult] = await pools.guayaquil.query("SELECT id FROM pacientes WHERE email = ?", [email.trim()]);
      if ((guayaquilResult as any[]).length > 0) {
        console.log('🔍 Email encontrado en BD Guayaquil');
        return true;
      }
    } catch (error) {
      console.log('⚠️ No se pudo verificar en BD Guayaquil:', error);
    }
    
    // Verificar en BD Cuenca
    try {
      const [cuencaResult] = await pools.cuenca.query("SELECT id FROM pacientes WHERE email = ?", [email.trim()]);
      if ((cuencaResult as any[]).length > 0) {
        console.log('🔍 Email encontrado en BD Cuenca');
        return true;
      }
    } catch (error) {
      console.log('⚠️ No se pudo verificar en BD Cuenca:', error);
    }
    
    return false; // No encontrado en ninguna BD
  } catch (error) {
    console.error('❌ Error verificando email en todas las BDs:', error);
    throw error;
  }
}

// =========================
// Función para mover paciente entre centros (solo admin)
// =========================
async function movePatientBetweenCenters(patientId: number, newCentroId: number, patientData: any) {
  console.log('🔄 [MOVE] Moviendo paciente ID:', patientId, 'al centro:', newCentroId);
  
  // Determinar qué BD usar según el nuevo centro
  let targetDbPool;
  switch (newCentroId) {
    case 1:
      targetDbPool = pools.central;
      console.log('🔄 [MOVE] Destino: BD Central (Quito)');
      break;
    case 2:
      targetDbPool = pools.guayaquil;
      console.log('🔄 [MOVE] Destino: BD Guayaquil');
      break;
    case 3:
      targetDbPool = pools.cuenca;
      console.log('🔄 [MOVE] Destino: BD Cuenca');
      break;
    default:
      throw new Error('Centro inválido');
  }
  
  // Crear el paciente en la nueva BD
  console.log('🔄 [MOVE] Creando paciente en nueva BD con datos:', {
    nombres: patientData.nombres,
    apellidos: patientData.apellidos,
    cedula: patientData.cedula,
    centro: newCentroId
  });
  
  const result = await targetDbPool.execute(`
    INSERT INTO pacientes (
      nombres, apellidos, cedula, telefono, email, 
      fecha_nacimiento, genero, direccion, id_centro
    ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    patientData.nombres,
    patientData.apellidos,
    patientData.cedula,
    patientData.telefono,
    patientData.email,
    patientData.fecha_nacimiento,
    patientData.genero,
    patientData.direccion,
    newCentroId
  ]);
  
  console.log('✅ [MOVE] Paciente creado en nueva BD con ID:', result.insertId, 'filas afectadas:', result.affectedRows);
  return result.insertId;
}

// =========================
// Función para limpiar duplicados (solo admin)
// =========================
async function cleanupDuplicates() {
  console.log('🧹 [CLEANUP] Iniciando limpieza de duplicados...');
  
  try {
    // Obtener todos los pacientes de todas las BDs
    const [centralPacientes] = await pools.central.query("SELECT * FROM pacientes");
    const [guayaquilPacientes] = await pools.guayaquil.query("SELECT * FROM pacientes");
    const [cuencaPacientes] = await pools.cuenca.query("SELECT * FROM pacientes");
    
    const allPacientes = [
      ...(centralPacientes as any[]).map(p => ({...p, source: 'central'})),
      ...(guayaquilPacientes as any[]).map(p => ({...p, source: 'guayaquil'})),
      ...(cuencaPacientes as any[]).map(p => ({...p, source: 'cuenca'}))
    ];
    
    // Encontrar duplicados por cédula
    const cedulaGroups = allPacientes.reduce((acc, paciente) => {
      if (paciente.cedula) {
        if (!acc[paciente.cedula]) acc[paciente.cedula] = [];
        acc[paciente.cedula].push(paciente);
      }
      return acc;
    }, {} as any);
    
    // Limpiar duplicados
    for (const cedula in cedulaGroups) {
      const duplicates = cedulaGroups[cedula];
      if (duplicates.length > 1) {
        console.log(`🧹 [CLEANUP] Encontrados ${duplicates.length} duplicados para cédula ${cedula}:`, 
          duplicates.map(d => `${d.nombres} ${d.apellidos} (${d.source}, centro ${d.id_centro})`));
        
        // Mantener solo el más reciente
        const sorted = duplicates.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const toKeep = sorted[0];
        const toDelete = sorted.slice(1);
        
        console.log(`🧹 [CLEANUP] Manteniendo: ${toKeep.nombres} ${toKeep.apellidos} (${toKeep.source})`);
        
        // Eliminar duplicados
        for (const duplicate of toDelete) {
          const pool = duplicate.source === 'central' ? pools.central :
                      duplicate.source === 'guayaquil' ? pools.guayaquil : pools.cuenca;
          await pool.execute("DELETE FROM pacientes WHERE id = ?", [duplicate.id]);
          console.log(`🗑️ [CLEANUP] Eliminado duplicado: ${duplicate.nombres} ${duplicate.apellidos} (${duplicate.source}, ID ${duplicate.id})`);
        }
      }
    }
    
    console.log('✅ [CLEANUP] Limpieza de duplicados completada');
  } catch (error) {
    console.error('❌ [CLEANUP] Error en limpieza de duplicados:', error);
    throw error;
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
      // Admin puede especificar cualquier centro, o usar centro por defecto (1 = Quito)
      centroId = id_centro ? Number(id_centro) : 1;
      console.log('🔍 [CREATE] Admin creando paciente en centro:', centroId);
    } else if (req.user?.rol === 'medico') {
      // Médico usa su centro asignado
      centroId = req.user.id_centro;
      console.log('🔍 [CREATE] Médico creando paciente en centro:', centroId);
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
      let cedulaExists = false;
      
      if (req.user?.rol === 'admin') {
        // Admin: verificar en TODAS las bases de datos
        console.log('🔍 [CREATE] Admin verificando cédula en todas las BDs:', cedula.trim());
        cedulaExists = await checkCedulaInAllDatabases(cedula.trim());
      } else {
        // Médico: verificar solo en su BD local
        console.log('🔍 [CREATE] Médico verificando cédula en BD local:', cedula.trim());
        const existingCedula = await req.dbPool.query("SELECT id FROM pacientes WHERE cedula = ?", [cedula.trim()]);
        cedulaExists = existingCedula.length > 0;
      }
      
      if (cedulaExists) {
        return res.status(409).json({ error: "La cédula ya está registrada" });
      }
    }

    // Verificar si el email ya existe (si se proporciona)
    if (email?.trim()) {
      let emailExists = false;
      
      if (req.user?.rol === 'admin') {
        // Admin: verificar en TODAS las bases de datos
        console.log('🔍 [CREATE] Admin verificando email en todas las BDs:', email.trim());
        emailExists = await checkEmailInAllDatabases(email.trim());
      } else {
        // Médico: verificar solo en su BD local
        console.log('🔍 [CREATE] Médico verificando email en BD local:', email.trim());
        const existingEmail = await req.dbPool.query("SELECT id FROM pacientes WHERE email = ?", [email.trim()]);
        emailExists = existingEmail.length > 0;
      }
      
      if (emailExists) {
        return res.status(409).json({ error: "El email ya está registrado" });
      }
    }

    // Determinar qué BD usar para la inserción
    let dbPool = req.dbPool; // Por defecto usar la BD del middleware
    
    if (req.user?.rol === 'admin') {
      // Admin: usar la BD correcta según el centro
      switch (centroId) {
        case 1:
          dbPool = pools.central;
          console.log('🔍 [CREATE] Admin usando BD Central (Quito)');
          break;
        case 2:
          dbPool = pools.guayaquil;
          console.log('🔍 [CREATE] Admin usando BD Guayaquil');
          break;
        case 3:
          dbPool = pools.cuenca;
          console.log('🔍 [CREATE] Admin usando BD Cuenca');
          break;
        default:
          dbPool = pools.central; // Por defecto BD Central
          console.log('🔍 [CREATE] Admin usando BD Central (por defecto)');
      }
    }

    const result = await dbPool.execute(`
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
        let cedulaExists = false;
        
        if (req.user?.rol === 'admin') {
          // Admin: verificar en TODAS las bases de datos
          console.log('🔍 [UPDATE] Admin verificando cédula en todas las BDs:', cedula.trim());
          cedulaExists = await checkCedulaInAllDatabases(cedula.trim());
          
          // Si existe, verificar que no sea el mismo paciente
          if (cedulaExists) {
            // Verificar en cada BD si es el mismo paciente
            let isSamePatient = false;
            
            // Verificar en BD Central
            const [centralResult] = await pools.central.query("SELECT id FROM pacientes WHERE cedula = ? AND id = ?", [cedula.trim(), id]);
            if ((centralResult as any[]).length > 0) isSamePatient = true;
            
            // Verificar en BD Guayaquil
            try {
              const [guayaquilResult] = await pools.guayaquil.query("SELECT id FROM pacientes WHERE cedula = ? AND id = ?", [cedula.trim(), id]);
              if ((guayaquilResult as any[]).length > 0) isSamePatient = true;
            } catch (error) {
              // Ignorar error de conexión
            }
            
            // Verificar en BD Cuenca
            try {
              const [cuencaResult] = await pools.cuenca.query("SELECT id FROM pacientes WHERE cedula = ? AND id = ?", [cedula.trim(), id]);
              if ((cuencaResult as any[]).length > 0) isSamePatient = true;
            } catch (error) {
              // Ignorar error de conexión
            }
            
            if (!isSamePatient) {
              return res.status(409).json({ error: "La cédula ya está registrada" });
            }
          }
        } else {
          // Médico: verificar solo en su BD local
          console.log('🔍 [UPDATE] Médico verificando cédula en BD local:', cedula.trim());
          const existingCedula = await req.dbPool.query("SELECT id FROM pacientes WHERE cedula = ? AND id != ?", [cedula.trim(), id]);
          if (existingCedula.length > 0) {
            return res.status(409).json({ error: "La cédula ya está registrada" });
          }
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
        let emailExists = false;
        
        if (req.user?.rol === 'admin') {
          // Admin: verificar en TODAS las bases de datos
          console.log('🔍 [UPDATE] Admin verificando email en todas las BDs:', email.trim());
          emailExists = await checkEmailInAllDatabases(email.trim());
          
          // Si existe, verificar que no sea el mismo paciente
          if (emailExists) {
            // Verificar en cada BD si es el mismo paciente
            let isSamePatient = false;
            
            // Verificar en BD Central
            const [centralResult] = await pools.central.query("SELECT id FROM pacientes WHERE email = ? AND id = ?", [email.trim(), id]);
            if ((centralResult as any[]).length > 0) isSamePatient = true;
            
            // Verificar en BD Guayaquil
            try {
              const [guayaquilResult] = await pools.guayaquil.query("SELECT id FROM pacientes WHERE email = ? AND id = ?", [email.trim(), id]);
              if ((guayaquilResult as any[]).length > 0) isSamePatient = true;
            } catch (error) {
              // Ignorar error de conexión
            }
            
            // Verificar en BD Cuenca
            try {
              const [cuencaResult] = await pools.cuenca.query("SELECT id FROM pacientes WHERE email = ? AND id = ?", [email.trim(), id]);
              if ((cuencaResult as any[]).length > 0) isSamePatient = true;
            } catch (error) {
              // Ignorar error de conexión
            }
            
            if (!isSamePatient) {
              return res.status(409).json({ error: "El email ya está registrado" });
            }
          }
        } else {
          // Médico: verificar solo en su BD local
          console.log('🔍 [UPDATE] Médico verificando email en BD local:', email.trim());
          const existingEmail = await req.dbPool.query("SELECT id FROM pacientes WHERE email = ? AND id != ?", [email.trim(), id]);
          if (existingEmail.length > 0) {
            return res.status(409).json({ error: "El email ya está registrado" });
          }
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
    // Manejar cambio de centro de manera especial
    let newCentroId: number | null = null;
    if (id_centro !== undefined) {
      newCentroId = Number(id_centro);
      // Validar centro
      const centros = await req.dbPool.query("SELECT id FROM centros_medicos WHERE id = ?", [newCentroId]);
      if (centros.length === 0) {
        return res.status(400).json({ error: "El centro especificado no existe" });
      }
      // NO agregar id_centro a updates, se manejará por separado
    }

    if (updates.length === 0 && !newCentroId) {
      return res.status(400).json({ error: "Debe enviar al menos un campo para actualizar" });
    }

    if (req.user?.rol === 'admin') {
      // Admin: lógica especial para cambio de centro
      console.log('🔍 [UPDATE] Admin buscando paciente en todas las BDs, ID:', id);
      
      // Buscar el paciente en todas las BDs para obtener sus datos completos
      let patientData: any = null;
      let sourceDbPool: any = null;
      let currentCentro: number | null = null;
      
      // Buscar en BD Central
      const [centralResult] = await pools.central.query("SELECT * FROM pacientes WHERE id = ?", [id]);
      if ((centralResult as any[]).length > 0) {
        patientData = (centralResult as any[])[0];
        sourceDbPool = pools.central;
        currentCentro = patientData.id_centro;
        console.log('🔍 [UPDATE] Paciente encontrado en BD Central, centro actual:', currentCentro);
      } else {
        // Buscar en BD Guayaquil
        try {
          const [guayaquilResult] = await pools.guayaquil.query("SELECT * FROM pacientes WHERE id = ?", [id]);
          if ((guayaquilResult as any[]).length > 0) {
            patientData = (guayaquilResult as any[])[0];
            sourceDbPool = pools.guayaquil;
            currentCentro = patientData.id_centro;
            console.log('🔍 [UPDATE] Paciente encontrado en BD Guayaquil, centro actual:', currentCentro);
          } else {
            // Buscar en BD Cuenca
            try {
              const [cuencaResult] = await pools.cuenca.query("SELECT * FROM pacientes WHERE id = ?", [id]);
              if ((cuencaResult as any[]).length > 0) {
                patientData = (cuencaResult as any[])[0];
                sourceDbPool = pools.cuenca;
                currentCentro = patientData.id_centro;
                console.log('🔍 [UPDATE] Paciente encontrado en BD Cuenca, centro actual:', currentCentro);
              }
            } catch (error) {
              console.log('⚠️ No se pudo buscar en BD Cuenca:', error);
            }
          }
        } catch (error) {
          console.log('⚠️ No se pudo buscar en BD Guayaquil:', error);
        }
      }
      
      if (!patientData) {
        return res.status(404).json({ error: "Paciente no encontrado en ninguna base de datos" });
      }
      
      // Si hay cambio de centro, mover el paciente
      if (newCentroId && newCentroId !== currentCentro) {
        console.log('🔄 [UPDATE] Cambio de centro detectado:', currentCentro, '→', newCentroId);
        
        // Aplicar otros cambios al objeto del paciente
        if (nombres !== undefined) patientData.nombres = nombres.trim();
        if (apellidos !== undefined) patientData.apellidos = apellidos.trim();
        if (cedula !== undefined) patientData.cedula = cedula?.trim() || null;
        if (telefono !== undefined) patientData.telefono = telefono?.trim() || null;
        if (email !== undefined) patientData.email = email?.trim() || null;
        if (fecha_nacimiento !== undefined) patientData.fecha_nacimiento = fecha_nacimiento;
        if (genero !== undefined) patientData.genero = genero;
        if (direccion !== undefined) patientData.direccion = direccion?.trim() || null;
        
        // Mover paciente a nueva BD
        const newPatientId = await movePatientBetweenCenters(id, newCentroId, patientData);
        
        // Eliminar paciente de BD original
        if (sourceDbPool) {
          try {
            const deleteResult = await sourceDbPool.execute("DELETE FROM pacientes WHERE id = ?", [id]);
            console.log('🗑️ [UPDATE] Paciente eliminado de BD original, filas afectadas:', deleteResult.affectedRows);
            
            if (deleteResult.affectedRows === 0) {
              console.error('❌ [UPDATE] ERROR: No se pudo eliminar el paciente de la BD original');
              // Si no se pudo eliminar, también eliminar el que se creó en la nueva BD
              const targetDbPool = newCentroId === 1 ? pools.central : 
                                  newCentroId === 2 ? pools.guayaquil : pools.cuenca;
              await targetDbPool.execute("DELETE FROM pacientes WHERE id = ?", [newPatientId]);
              return res.status(500).json({ error: "Error al mover paciente: no se pudo eliminar del centro original" });
            }
          } catch (deleteError) {
            console.error('❌ [UPDATE] Error eliminando paciente de BD original:', deleteError);
            // Si hay error al eliminar, también eliminar el que se creó en la nueva BD
            const targetDbPool = newCentroId === 1 ? pools.central : 
                                newCentroId === 2 ? pools.guayaquil : pools.cuenca;
            await targetDbPool.execute("DELETE FROM pacientes WHERE id = ?", [newPatientId]);
            return res.status(500).json({ error: "Error al mover paciente: " + deleteError.message });
          }
        }
        
        return res.json({
          id: newPatientId,
          ...patientData,
          id_centro: newCentroId
        });
      } else {
        // Solo actualizar en la misma BD
        if (!sourceDbPool) {
          return res.status(500).json({ error: "Error interno: no se pudo determinar la base de datos" });
        }
        values.push(id);
        const result = await sourceDbPool.execute(`
          UPDATE pacientes 
          SET ${updates.join(", ")}
          WHERE id = ?
        `, values);
        
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Paciente no encontrado" });
        }
        
        return res.json({
          id,
          ...patientData,
          ...Object.fromEntries(updates.map((update, index) => {
            const field = update.split(' = ')[0];
            return [field, values[index]];
          }))
        });
      }
    } else {
      // Médico: lógica normal
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
        id_centro: newCentroId ? Number(newCentroId) : undefined
      };

      res.json(updated);
    }
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

    // Determinar qué BD usar para la eliminación
    let dbPool = req.dbPool; // Por defecto usar la BD del middleware
    
    if (req.user?.rol === 'admin') {
      // Admin: necesitamos encontrar en qué BD está el paciente
      console.log('🔍 [DELETE] Admin buscando paciente en todas las BDs, ID:', id);
      
      // Buscar el paciente en todas las BDs para determinar su centro
      let patientFound = false;
      
      // Buscar en BD Central
      const [centralResult] = await pools.central.query("SELECT id FROM pacientes WHERE id = ?", [id]);
      if ((centralResult as any[]).length > 0) {
        dbPool = pools.central;
        patientFound = true;
        console.log('🔍 [DELETE] Paciente encontrado en BD Central');
      } else {
        // Buscar en BD Guayaquil
        try {
          const [guayaquilResult] = await pools.guayaquil.query("SELECT id FROM pacientes WHERE id = ?", [id]);
          if ((guayaquilResult as any[]).length > 0) {
            dbPool = pools.guayaquil;
            patientFound = true;
            console.log('🔍 [DELETE] Paciente encontrado en BD Guayaquil');
          } else {
            // Buscar en BD Cuenca
            try {
              const [cuencaResult] = await pools.cuenca.query("SELECT id FROM pacientes WHERE id = ?", [id]);
              if ((cuencaResult as any[]).length > 0) {
                dbPool = pools.cuenca;
                patientFound = true;
                console.log('🔍 [DELETE] Paciente encontrado en BD Cuenca');
              }
            } catch (error) {
              console.log('⚠️ No se pudo buscar en BD Cuenca:', error);
            }
          }
        } catch (error) {
          console.log('⚠️ No se pudo buscar en BD Guayaquil:', error);
        }
      }
      
      if (!patientFound) {
        return res.status(404).json({ error: "Paciente no encontrado en ninguna base de datos" });
      }
    }

    const result = await dbPool.execute("DELETE FROM pacientes WHERE id = ?", [id]);

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

// =========================
// POST /api/pacientes/cleanup-duplicates
// =========================
export async function cleanupDuplicatesEndpoint(req: Request, res: Response) {
  try {
    // Solo admin puede limpiar duplicados
    if (req.user?.rol !== 'admin') {
      return res.status(403).json({ error: "Solo administradores pueden limpiar duplicados" });
    }
    
    await cleanupDuplicates();
    res.json({ message: "Limpieza de duplicados completada exitosamente" });
  } catch (err) {
    console.error("[ERROR] limpiando duplicados:", err);
    res.status(500).json({ error: "Error interno al limpiar duplicados" });
  }
}
