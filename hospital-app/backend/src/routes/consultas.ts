import { Router, Request, Response } from "express";
import { authenticateToken, requireCentroAccess, requireRole } from "../middlewares/auth";
import { validateConsultation, validateMedico, validateUsuario, validateEmpleado, validateCentro, validateEspecialidad } from "../middlewares/validation";
import { pools } from "../config/distributedDb";
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

// Función para obtener consultas de todas las bases de datos (solo admin)
async function getAllConsultasFromAllDatabases(filters: any = {}) {
  const allConsultas: any[] = [];
  
  try {
    // Construir condiciones de filtro
    const conditions: string[] = [];
    const params: any[] = [];
    
    if (filters.medico) {
      conditions.push("c.id_medico = ?");
      params.push(Number(filters.medico));
    }
    if (filters.desde) {
      conditions.push("c.fecha >= ?");
      params.push(filters.desde);
    }
    if (filters.hasta) {
      conditions.push("c.fecha <= ?");
      params.push(filters.hasta);
    }
    if (filters.q) {
      conditions.push("(c.paciente_nombre LIKE ? OR c.paciente_apellido LIKE ? OR c.motivo LIKE ? OR c.diagnostico LIKE ?)");
      params.push(`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`);
    }
    
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    
    // Consultar BD Central (Quito)
    const [centralConsultas] = await pools.central.query(`
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
      ORDER BY c.fecha DESC
    `, params);
    
    // Agregar información de centro
    (centralConsultas as any[]).forEach(consulta => {
      consulta.centro_nombre = consulta.centro_nombre || 'Hospital Central Quito';
      consulta.centro_ciudad = consulta.centro_ciudad || 'Quito';
    });
    
    allConsultas.push(...(centralConsultas as any[]));
    
    // Consultar BD Guayaquil
    try {
      const [guayaquilConsultas] = await pools.guayaquil.query(`
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
        ORDER BY c.fecha DESC
      `, params);
      
      (guayaquilConsultas as any[]).forEach(consulta => {
        consulta.centro_nombre = consulta.centro_nombre || 'Hospital Guayaquil';
        consulta.centro_ciudad = consulta.centro_ciudad || 'Guayaquil';
      });
      
      allConsultas.push(...(guayaquilConsultas as any[]));
    } catch (error) {
      console.log('⚠️ No se pudo conectar a BD Guayaquil:', error);
    }
    
    // Consultar BD Cuenca
    try {
      const [cuencaConsultas] = await pools.cuenca.query(`
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
        ORDER BY c.fecha DESC
      `, params);
      
      (cuencaConsultas as any[]).forEach(consulta => {
        consulta.centro_nombre = consulta.centro_nombre || 'Hospital Cuenca';
        consulta.centro_ciudad = consulta.centro_ciudad || 'Cuenca';
      });
      
      allConsultas.push(...(cuencaConsultas as any[]));
    } catch (error) {
      console.log('⚠️ No se pudo conectar a BD Cuenca:', error);
    }
    
  } catch (error) {
    console.error('❌ Error consultando todas las bases de datos:', error);
    throw error;
  }
  
  // Ordenar por fecha (más recientes primero)
  return allConsultas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

// Función para obtener pacientes de todas las bases de datos (solo admin)
async function getAllPacientesFromAllDatabases() {
  const allPacientes: any[] = [];
  
  try {
    // Consultar BD Central (Quito)
    const [centralPacientes] = await pools.central.query(`
      SELECT p.*, cm.nombre as centro_nombre, cm.ciudad as centro_ciudad,
             COUNT(c.id) as consultas_activas,
             GROUP_CONCAT(DISTINCT CONCAT(m.nombres, ' ', m.apellidos) SEPARATOR ', ') as medicos_activos
      FROM pacientes p 
      LEFT JOIN centros_medicos cm ON p.id_centro = cm.id
      LEFT JOIN consultas c ON p.id = c.id_paciente AND c.estado IN ('pendiente', 'programada')
      LEFT JOIN medicos m ON c.id_medico = m.id
      GROUP BY p.id
      ORDER BY p.nombres, p.apellidos
    `);
    
    // Agregar información de centro y origen
    (centralPacientes as any[]).forEach(paciente => {
      paciente.centro_nombre = paciente.centro_nombre || 'Hospital Central Quito';
      paciente.centro_ciudad = paciente.centro_ciudad || 'Quito';
      paciente.origen_bd = 'central';
      paciente.id_unico = `central-${paciente.id}`;
      // Crear un ID único para evitar conflictos
      paciente.id_frontend = `central-${paciente.id}`;
    });
    
    allPacientes.push(...(centralPacientes as any[]));
    
    // Consultar BD Guayaquil
    try {
      const [guayaquilPacientes] = await pools.guayaquil.query(`
        SELECT p.*, cm.nombre as centro_nombre, cm.ciudad as centro_ciudad,
               COUNT(c.id) as consultas_activas,
               GROUP_CONCAT(DISTINCT CONCAT(m.nombres, ' ', m.apellidos) SEPARATOR ', ') as medicos_activos
        FROM pacientes p 
        LEFT JOIN centros_medicos cm ON p.id_centro = cm.id
        LEFT JOIN consultas c ON p.id = c.id_paciente AND c.estado IN ('pendiente', 'programada')
        LEFT JOIN medicos m ON c.id_medico = m.id
        GROUP BY p.id
        ORDER BY p.nombres, p.apellidos
      `);
      
      (guayaquilPacientes as any[]).forEach(paciente => {
        paciente.centro_nombre = paciente.centro_nombre || 'Hospital Guayaquil';
        paciente.centro_ciudad = paciente.centro_ciudad || 'Guayaquil';
        paciente.origen_bd = 'guayaquil';
        paciente.id_unico = `guayaquil-${paciente.id}`;
        // Crear un ID único para evitar conflictos
        paciente.id_frontend = `guayaquil-${paciente.id}`;
      });
      
      allPacientes.push(...(guayaquilPacientes as any[]));
    } catch (error) {
      console.log('⚠️ No se pudo conectar a BD Guayaquil para pacientes:', error);
    }
    
    // Consultar BD Cuenca
    try {
      const [cuencaPacientes] = await pools.cuenca.query(`
        SELECT p.*, cm.nombre as centro_nombre, cm.ciudad as centro_ciudad,
               COUNT(c.id) as consultas_activas,
               GROUP_CONCAT(DISTINCT CONCAT(m.nombres, ' ', m.apellidos) SEPARATOR ', ') as medicos_activos
        FROM pacientes p 
        LEFT JOIN centros_medicos cm ON p.id_centro = cm.id
        LEFT JOIN consultas c ON p.id = c.id_paciente AND c.estado IN ('pendiente', 'programada')
        LEFT JOIN medicos m ON c.id_medico = m.id
        GROUP BY p.id
        ORDER BY p.nombres, p.apellidos
      `);
      
      (cuencaPacientes as any[]).forEach(paciente => {
        paciente.centro_nombre = paciente.centro_nombre || 'Hospital Cuenca';
        paciente.centro_ciudad = paciente.centro_ciudad || 'Cuenca';
        paciente.origen_bd = 'cuenca';
        paciente.id_unico = `cuenca-${paciente.id}`;
        // Crear un ID único para evitar conflictos
        paciente.id_frontend = `cuenca-${paciente.id}`;
      });
      
      allPacientes.push(...(cuencaPacientes as any[]));
    } catch (error) {
      console.log('⚠️ No se pudo conectar a BD Cuenca para pacientes:', error);
    }
    
  } catch (error) {
    console.error('❌ Error consultando todas las bases de datos para pacientes:', error);
    throw error;
  }
  
  // Ordenar por nombre
  return allPacientes.sort((a, b) => a.nombres.localeCompare(b.nombres));
}

// Función para obtener médicos de todas las bases de datos (solo admin)
async function getAllMedicosFromAllDatabases() {
  const allMedicos: any[] = [];
  
  try {
    // Consultar BD Central (Quito)
    const [centralMedicos] = await pools.central.query(`
      SELECT m.*, e.nombre as especialidad_nombre, cm.nombre as centro_nombre
      FROM medicos m 
      LEFT JOIN especialidades e ON m.id_especialidad = e.id 
      LEFT JOIN centros_medicos cm ON m.id_centro = cm.id
      ORDER BY m.nombres, m.apellidos
    `);
    
    // Agregar información de centro y origen
    (centralMedicos as any[]).forEach(medico => {
      medico.centro_nombre = medico.centro_nombre || 'Hospital Central Quito';
      medico.origen_bd = 'central';
      medico.id_unico = `central-${medico.id}`;
      // Crear un ID único para evitar conflictos
      medico.id_frontend = `central-${medico.id}`;
    });
    
    allMedicos.push(...(centralMedicos as any[]));
    
    // Consultar BD Guayaquil
    try {
      const [guayaquilMedicos] = await pools.guayaquil.query(`
        SELECT m.*, e.nombre as especialidad_nombre, cm.nombre as centro_nombre
        FROM medicos m 
        LEFT JOIN especialidades e ON m.id_especialidad = e.id 
        LEFT JOIN centros_medicos cm ON m.id_centro = cm.id
        ORDER BY m.nombres, m.apellidos
      `);
      
      (guayaquilMedicos as any[]).forEach(medico => {
        medico.centro_nombre = medico.centro_nombre || 'Hospital Guayaquil';
        medico.origen_bd = 'guayaquil';
        medico.id_unico = `guayaquil-${medico.id}`;
        // Crear un ID único para evitar conflictos
        medico.id_frontend = `guayaquil-${medico.id}`;
      });
      
      allMedicos.push(...(guayaquilMedicos as any[]));
    } catch (error) {
      console.log('⚠️ No se pudo conectar a BD Guayaquil para médicos:', error);
    }
    
    // Consultar BD Cuenca
    try {
      const [cuencaMedicos] = await pools.cuenca.query(`
        SELECT m.*, e.nombre as especialidad_nombre, cm.nombre as centro_nombre
        FROM medicos m 
        LEFT JOIN especialidades e ON m.id_especialidad = e.id 
        LEFT JOIN centros_medicos cm ON m.id_centro = cm.id
        ORDER BY m.nombres, m.apellidos
      `);
      
      (cuencaMedicos as any[]).forEach(medico => {
        medico.centro_nombre = medico.centro_nombre || 'Hospital Cuenca';
        medico.origen_bd = 'cuenca';
        medico.id_unico = `cuenca-${medico.id}`;
        // Crear un ID único para evitar conflictos
        medico.id_frontend = `cuenca-${medico.id}`;
      });
      
      allMedicos.push(...(cuencaMedicos as any[]));
    } catch (error) {
      console.log('⚠️ No se pudo conectar a BD Cuenca para médicos:', error);
    }
    
  } catch (error) {
    console.error('❌ Error consultando todas las bases de datos para médicos:', error);
    throw error;
  }
  
  // Ordenar por nombre
  return allMedicos.sort((a, b) => a.nombres.localeCompare(b.nombres));
}

// Función para obtener médicos de un centro específico de todas las bases de datos (solo admin)
async function getMedicosByCentroFromAllDatabases(centroId: number) {
  const allMedicos: any[] = [];
  
  try {
    // Consultar BD Central (Quito)
    const [centralMedicos] = await pools.central.query(`
      SELECT m.*, e.nombre as especialidad_nombre, cm.nombre as centro_nombre
      FROM medicos m 
      LEFT JOIN especialidades e ON m.id_especialidad = e.id 
      LEFT JOIN centros_medicos cm ON m.id_centro = cm.id
      WHERE m.id_centro = ?
      ORDER BY m.nombres, m.apellidos
    `, [centroId]);
    
    // Agregar información de centro
    (centralMedicos as any[]).forEach(medico => {
      medico.centro_nombre = medico.centro_nombre || 'Hospital Central Quito';
    });
    
    allMedicos.push(...(centralMedicos as any[]));
    
    // Consultar BD Guayaquil
    try {
      const [guayaquilMedicos] = await pools.guayaquil.query(`
        SELECT m.*, e.nombre as especialidad_nombre, cm.nombre as centro_nombre
        FROM medicos m 
        LEFT JOIN especialidades e ON m.id_especialidad = e.id 
        LEFT JOIN centros_medicos cm ON m.id_centro = cm.id
        WHERE m.id_centro = ?
        ORDER BY m.nombres, m.apellidos
      `, [centroId]);
      
      (guayaquilMedicos as any[]).forEach(medico => {
        medico.centro_nombre = medico.centro_nombre || 'Hospital Guayaquil';
      });
      
      allMedicos.push(...(guayaquilMedicos as any[]));
    } catch (error) {
      console.log('⚠️ No se pudo conectar a BD Guayaquil para médicos del centro', centroId, ':', error);
    }
    
    // Consultar BD Cuenca
    try {
      const [cuencaMedicos] = await pools.cuenca.query(`
        SELECT m.*, e.nombre as especialidad_nombre, cm.nombre as centro_nombre
        FROM medicos m 
        LEFT JOIN especialidades e ON m.id_especialidad = e.id 
        LEFT JOIN centros_medicos cm ON m.id_centro = cm.id
        WHERE m.id_centro = ?
        ORDER BY m.nombres, m.apellidos
      `, [centroId]);
      
      (cuencaMedicos as any[]).forEach(medico => {
        medico.centro_nombre = medico.centro_nombre || 'Hospital Cuenca';
      });
      
      allMedicos.push(...(cuencaMedicos as any[]));
    } catch (error) {
      console.log('⚠️ No se pudo conectar a BD Cuenca para médicos del centro', centroId, ':', error);
    }
    
  } catch (error) {
    console.error('❌ Error consultando todas las bases de datos para médicos del centro', centroId, ':', error);
    throw error;
  }
  
  // Ordenar por nombre
  return allMedicos.sort((a, b) => a.nombres.localeCompare(b.nombres));
}

// Función para obtener médicos de un centro específico de la base de datos correspondiente (solo admin)
async function getMedicosByCentroFromSpecificDatabase(centroId: number, origenBd: string) {
  try {
    let medicos: any[] = [];
    
    console.log(`🔍 Buscando médicos del centro ${centroId} en BD ${origenBd}`);
    
    if (origenBd === 'central') {
      const [result] = await pools.central.query(`
        SELECT m.*, e.nombre as especialidad_nombre, cm.nombre as centro_nombre
        FROM medicos m 
        LEFT JOIN especialidades e ON m.id_especialidad = e.id 
        LEFT JOIN centros_medicos cm ON m.id_centro = cm.id
        WHERE m.id_centro = ?
        ORDER BY m.nombres, m.apellidos
      `, [centroId]);
      
      medicos = result as any[];
      medicos.forEach(medico => {
        medico.centro_nombre = medico.centro_nombre || 'Hospital Central Quito';
        medico.origen_bd = 'central';
        medico.id_unico = `central-${medico.id}`;
        medico.id_frontend = `central-${medico.id}`;
      });
      
    } else if (origenBd === 'guayaquil') {
      const [result] = await pools.guayaquil.query(`
        SELECT m.*, e.nombre as especialidad_nombre, cm.nombre as centro_nombre
        FROM medicos m 
        LEFT JOIN especialidades e ON m.id_especialidad = e.id 
        LEFT JOIN centros_medicos cm ON m.id_centro = cm.id
        WHERE m.id_centro = ?
        ORDER BY m.nombres, m.apellidos
      `, [centroId]);
      
      medicos = result as any[];
      medicos.forEach(medico => {
        medico.centro_nombre = medico.centro_nombre || 'Hospital Guayaquil';
        medico.origen_bd = 'guayaquil';
        medico.id_unico = `guayaquil-${medico.id}`;
        medico.id_frontend = `guayaquil-${medico.id}`;
      });
      
    } else if (origenBd === 'cuenca') {
      const [result] = await pools.cuenca.query(`
        SELECT m.*, e.nombre as especialidad_nombre, cm.nombre as centro_nombre
        FROM medicos m 
        LEFT JOIN especialidades e ON m.id_especialidad = e.id 
        LEFT JOIN centros_medicos cm ON m.id_centro = cm.id
        WHERE m.id_centro = ?
        ORDER BY m.nombres, m.apellidos
      `, [centroId]);
      
      medicos = result as any[];
      medicos.forEach(medico => {
        medico.centro_nombre = medico.centro_nombre || 'Hospital Cuenca';
        medico.origen_bd = 'cuenca';
        medico.id_unico = `cuenca-${medico.id}`;
        medico.id_frontend = `cuenca-${medico.id}`;
      });
    }
    
    console.log(`✅ Médicos encontrados en ${origenBd} para centro ${centroId}:`, medicos.length);
    console.log('📋 Lista de médicos:', medicos.map(m => ({
      id: m.id,
      id_frontend: m.id_frontend,
      nombre: `${m.nombres} ${m.apellidos}`,
      centro: m.id_centro,
      centro_nombre: m.centro_nombre,
      origen_bd: m.origen_bd
    })));
    
    return medicos;
    
  } catch (error) {
    console.error(`❌ Error obteniendo médicos del centro ${centroId} en BD ${origenBd}:`, error);
    return [];
  }
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
      const [medicoRows] = await req.dbPool.query(
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
    const [medicoRows] = await req.dbPool.query(
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

    const [result] = await req.dbPool.execute(
      `INSERT INTO consultas (id_centro, id_medico, paciente_nombre, paciente_apellido, id_paciente, fecha, motivo, diagnostico, tratamiento, estado, duracion_minutos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [centroConsulta, id_medico, paciente_nombre, paciente_apellido, id_paciente ?? null, fecha, motivo ?? null, diagnostico ?? null, tratamiento ?? null, estado ?? 'pendiente', duracion_minutos ?? 0]
    );

    // @ts-ignore - mysql2 returns OkPacket
    const insertedId = result.insertId as number;
    const [rows] = await req.dbPool.query("SELECT * FROM consultas WHERE id = ? AND id_centro = ?", [insertedId, centroConsulta]);
    // @ts-ignore
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creando consulta:', error);
    res.status(500).json({ error: "No se pudo crear la consulta", details: error.message });
  }
});

// Listar consultas del centro con datos relacionados
router.get("/", async (req: Request, res: Response) => {
  try {
    // Verificar si es admin para mostrar todas las consultas
    const token = req.headers.authorization?.replace('Bearer ', '');
    let isAdmin = false;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        isAdmin = decoded.rol === 'admin';
        console.log('🔍 [CONSULTAS] Usuario:', decoded.email, 'Rol:', decoded.rol, 'Es Admin:', isAdmin);
      } catch (err) {
        console.error('❌ Error decodificando token:', err);
      }
    }

    const idCentro = getCentroId(req);
    
    // Si no es admin, requerir X-Centro-Id
    if (!isAdmin && !idCentro) {
      return res.status(400).json({ error: "X-Centro-Id requerido" });
    }

    const { medico, desde, hasta, q } = req.query as Record<string, string>;
    const filters = { medico, desde, hasta, q };

    let consultas;
    
    if (isAdmin) {
      // Admin: obtener consultas de TODAS las bases de datos
      console.log('👑 [CONSULTAS] Admin detectado - consultando TODAS las bases de datos');
      consultas = await getAllConsultasFromAllDatabases(filters);
      console.log('📊 [CONSULTAS] Total consultas encontradas:', consultas.length);
    } else {
      // Médico: obtener consultas solo de su base de datos
      console.log('👨‍⚕️ [CONSULTAS] Médico detectado - consultando BD local');
      
      const conditions: string[] = ["c.id_centro = ?"]; 
      const params: any[] = [idCentro];

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
      
      const [rows] = await req.dbPool.query(sql, params);
      consultas = rows;
    }
    
    res.json(consultas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudieron obtener las consultas" });
  }
});

// Obtener médicos del centro
// Obtener médicos disponibles para asociar (solo admin)
router.get("/medicos-disponibles", requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const [rows] = await req.dbPool.query(`
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

// Obtener médicos por centro específico (para filtrado dinámico)
router.get("/medicos-por-centro/:centroId", async (req: Request, res: Response) => {
  try {
    const centroId = Number(req.params.centroId);
    if (isNaN(centroId) || centroId <= 0) {
      return res.status(400).json({ error: "ID de centro inválido" });
    }

    // Verificar si es admin para mostrar médicos de cualquier centro
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

    console.log('Obteniendo médicos para centro específico:', centroId, 'isAdmin:', isAdmin);
    
    // Solo admin puede consultar médicos de cualquier centro
    if (!isAdmin) {
      return res.status(403).json({ error: "Solo administradores pueden consultar médicos por centro" });
    }

    // Usar la función que consulta todas las bases de datos
    const medicos = await getMedicosByCentroFromAllDatabases(centroId);
    
    console.log('👑 [MÉDICOS-POR-CENTRO] Admin consultando centro', centroId, 'en TODAS las bases de datos');
    console.log('📊 [MÉDICOS-POR-CENTRO] Médicos encontrados para centro', centroId, ':', medicos.length);
    res.json(medicos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudieron obtener los médicos del centro" });
  }
});

// Obtener médicos por centro específico de una base de datos específica (solo admin)
router.get("/medicos-por-centro/:centroId/:origenBd", async (req: Request, res: Response) => {
  try {
    const centroId = Number(req.params.centroId);
    const origenBd = req.params.origenBd;
    
    if (isNaN(centroId) || centroId <= 0) {
      return res.status(400).json({ error: "ID de centro inválido" });
    }

    // Verificar si es admin
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
    
    if (!isAdmin) {
      return res.status(403).json({ error: "Solo administradores pueden consultar médicos por centro" });
    }

    // Usar la función que consulta solo la base de datos específica
    const medicos = await getMedicosByCentroFromSpecificDatabase(centroId, origenBd);
    
    console.log('👑 [MÉDICOS-POR-CENTRO-SPECIFIC] Admin consultando centro', centroId, 'en BD', origenBd);
    console.log('📊 [MÉDICOS-POR-CENTRO-SPECIFIC] Médicos encontrados:', medicos.length);
    res.json(medicos);
  } catch (error) {
    console.error("Error obteniendo médicos por centro específico:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/medicos", async (req: Request, res: Response) => {
  try {
    // Verificar si es admin PRIMERO
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

    const idCentro = getCentroId(req);
    
    // Solo requerir X-Centro-Id si NO es admin
    if (!isAdmin && !idCentro) {
      return res.status(400).json({ error: "X-Centro-Id requerido" });
    }

    console.log('Obteniendo médicos - isAdmin:', isAdmin, 'idCentro:', idCentro);
    
    let medicos;
    if (isAdmin) {
      // Admin: obtener médicos de TODAS las bases de datos
      console.log('👑 [MÉDICOS] Admin detectado - consultando TODAS las bases de datos');
      medicos = await getAllMedicosFromAllDatabases();
      console.log('📊 [MÉDICOS] Total médicos encontrados:', medicos.length);
    } else {
      // Usuario normal ve solo médicos de su centro
      const sql = `
        SELECT m.*, e.nombre as especialidad_nombre, cm.nombre as centro_nombre
        FROM medicos m 
        LEFT JOIN especialidades e ON m.id_especialidad = e.id 
        LEFT JOIN centros_medicos cm ON m.id_centro = cm.id
        WHERE m.id_centro = ? 
        ORDER BY m.nombres, m.apellidos
      `;
      
      const [rows] = await req.dbPool.query(sql, [idCentro]);
      medicos = rows;
      console.log('👨‍⚕️ [MÉDICOS] Médico detectado - consultando BD local:', medicos.length);
    }
    
    res.json(medicos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudieron obtener los médicos" });
  }
});

// Obtener especialidades
router.get("/especialidades", async (req: Request, res: Response) => {
  try {
    const [rows] = await req.dbPool.query("SELECT * FROM especialidades ORDER BY nombre");
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
    const [rows] = await req.dbPool.query("SELECT * FROM centros_medicos ORDER BY nombre");
    console.log('Centros encontrados:', rows);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudieron obtener los centros médicos" });
  }
});

// Obtener pacientes del centro
router.get("/pacientes", async (req: Request, res: Response) => {
  try {
    // Verificar si es admin PRIMERO
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

    const idCentro = getCentroId(req);
    
    // Solo requerir X-Centro-Id si NO es admin
    if (!isAdmin && !idCentro) {
      return res.status(400).json({ error: "X-Centro-Id requerido" });
    }

    console.log('Obteniendo pacientes - isAdmin:', isAdmin, 'idCentro:', idCentro);
    
    let pacientes;
    if (isAdmin) {
      // Admin: obtener pacientes de TODAS las bases de datos
      console.log('👑 [PACIENTES] Admin detectado - consultando TODAS las bases de datos');
      pacientes = await getAllPacientesFromAllDatabases();
      console.log('📊 [PACIENTES] Total pacientes encontrados:', pacientes.length);
    } else {
      // Usuario normal ve solo pacientes de su centro con info de consultas activas
      const sql = `
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
      
      const [rows] = await req.dbPool.query(sql, [idCentro]);
      pacientes = rows;
      console.log('👨‍⚕️ [PACIENTES] Médico detectado - consultando BD local:', pacientes.length);
    }
    
    res.json(pacientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudieron obtener los pacientes" });
  }
});

// Obtener usuarios (solo admin)
router.get("/usuarios", requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const [rows] = await req.dbPool.query(`
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

    const [rows] = await req.dbPool.query("SELECT * FROM consultas WHERE id = ? AND id_centro = ?", [id, idCentro]);
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
      const [medicoRows] = await req.dbPool.query(
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
    const [result] = await req.dbPool.execute(sql, params);
    // @ts-ignore
    if (result.affectedRows === 0) return res.status(404).json({ error: "Consulta no encontrada" });

    // Obtener la consulta actualizada
    const [rows] = await req.dbPool.query(`SELECT * FROM consultas ${whereClause}`, whereParams);
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

    const [result] = await req.dbPool.execute(`DELETE FROM consultas ${whereClause}`, whereParams);
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
    const [especialidadRows] = await req.dbPool.query('SELECT id FROM especialidades WHERE id = ?', [id_especialidad]);
    // @ts-ignore
    if (!especialidadRows[0]) {
      return res.status(400).json({ error: 'La especialidad no existe' });
    }

    // Verificar que el centro existe
    const [centroRows] = await req.dbPool.query('SELECT id FROM centros_medicos WHERE id = ?', [id_centro]);
    // @ts-ignore
    if (!centroRows[0]) {
      return res.status(400).json({ error: 'El centro médico no existe' });
    }

    // Crear médico
    const [result] = await req.dbPool.execute(
      'INSERT INTO medicos (nombres, apellidos, id_especialidad, id_centro) VALUES (?, ?, ?, ?)',
      [nombres, apellidos, id_especialidad, id_centro]
    );

    // @ts-ignore
    const medicoId = result.insertId;

    // Obtener el médico creado con datos relacionados
    const [rows] = await req.dbPool.query(`
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
    const [centroRows] = await req.dbPool.query('SELECT id FROM centros_medicos WHERE id = ?', [id_centro]);
    // @ts-ignore
    if (!centroRows[0]) {
      return res.status(400).json({ error: 'El centro médico no existe' });
    }

    // Si es médico, verificar que el médico existe y pertenece al centro
    if (rol === 'medico' && id_medico) {
      const [medicoRows] = await req.dbPool.query('SELECT id FROM medicos WHERE id = ? AND id_centro = ?', [id_medico, id_centro]);
      // @ts-ignore
      if (!medicoRows[0]) {
        return res.status(400).json({ error: 'El médico no existe o no pertenece al centro' });
      }
    }

    // Verificar que el email no existe
    const [emailRows] = await req.dbPool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    // @ts-ignore
    if (emailRows[0]) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hash de la contraseña
    const bcrypt = require('bcrypt');
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const [result] = await req.dbPool.execute(
      'INSERT INTO usuarios (email, password_hash, rol, id_centro, id_medico) VALUES (?, ?, ?, ?, ?)',
      [email, password_hash, rol, id_centro, id_medico || null]
    );

    // @ts-ignore
    const userId = result.insertId;

    // Obtener el usuario creado
    const [rows] = await req.dbPool.query(`
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

