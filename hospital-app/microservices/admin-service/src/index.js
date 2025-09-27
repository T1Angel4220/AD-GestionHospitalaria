const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const Joi = require('joi');
const winston = require('winston');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Configuración de logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de bases de datos
const databases = {
  central: {
    host: process.env.CENTRAL_DB_HOST || 'localhost',
    user: process.env.CENTRAL_DB_USER || 'root',
    password: process.env.CENTRAL_DB_PASSWORD || '',
    database: process.env.CENTRAL_DB_NAME || 'hospital_central',
    port: process.env.CENTRAL_DB_PORT || 3306
  },
  guayaquil: {
    host: process.env.GUAYAQUIL_DB_HOST || 'localhost',
    user: process.env.GUAYAQUIL_DB_USER || 'root',
    password: process.env.GUAYAQUIL_DB_PASSWORD || '',
    database: process.env.GUAYAQUIL_DB_NAME || 'hospital_guayaquil',
    port: process.env.GUAYAQUIL_DB_PORT || 3306
  },
  cuenca: {
    host: process.env.CUENCA_DB_HOST || 'localhost',
    user: process.env.CUENCA_DB_USER || 'root',
    password: process.env.CUENCA_DB_PASSWORD || '',
    database: process.env.CUENCA_DB_NAME || 'hospital_cuenca',
    port: process.env.CUENCA_DB_PORT || 3306
  }
};

// Función para obtener conexión a base de datos
const getConnection = async (dbName) => {
  const config = databases[dbName];
  if (!config) {
    throw new Error(`Base de datos ${dbName} no configurada`);
  }
  return await mysql.createConnection(config);
};

// Función para obtener todas las bases de datos disponibles
const getAllDatabases = async () => {
  const results = {};
  for (const [name, config] of Object.entries(databases)) {
    try {
      const connection = await mysql.createConnection(config);
      await connection.end();
      results[name] = config;
    } catch (error) {
      logger.warn(`No se pudo conectar a ${name}:`, error.message);
    }
  }
  return results;
};

// Middleware para extraer información del usuario del token
const extractUserInfo = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.user = decoded;
    } catch (error) {
      logger.warn('Token inválido:', error.message);
    }
  }
  next();
};

// Middleware para verificar que es admin
const requireAdmin = (req, res, next) => {
  if (req.user?.rol !== 'admin') {
    return res.status(403).json({ error: 'Se requieren permisos de administrador' });
  }
  next();
};

// =========================
// USUARIOS
// =========================

// GET /admin/usuarios - Listar usuarios
app.get('/admin/usuarios', extractUserInfo, requireAdmin, async (req, res) => {
  try {
    let usuarios = [];
    const availableDbs = await getAllDatabases();
    
    for (const [dbName, config] of Object.entries(availableDbs)) {
      try {
        const connection = await mysql.createConnection(config);
        const [dbUsuarios] = await connection.query(`
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
        
        // Agregar información de origen
        dbUsuarios.forEach(usuario => {
          usuario.origen_bd = dbName;
          usuario.id_unico = `${dbName}-${usuario.id}`;
          usuario.id_frontend = `${dbName}-${usuario.id}`;
        });
        
        usuarios.push(...dbUsuarios);
        await connection.end();
      } catch (error) {
        logger.error(`Error consultando ${dbName}:`, error);
      }
    }

    res.json(usuarios);
  } catch (error) {
    logger.error('Error listando usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /admin/usuarios - Crear usuario
app.post('/admin/usuarios', extractUserInfo, requireAdmin, async (req, res) => {
  try {
    const { email, password, rol, id_centro, id_medico } = req.body;

    // Validaciones
    if (!email || !password || !rol || !id_centro) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    if (rol !== 'admin' && rol !== 'medico') {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    // Determinar qué base de datos usar según el centro
    let dbName;
    switch (id_centro) {
      case 1: dbName = 'central'; break;
      case 2: dbName = 'guayaquil'; break;
      case 3: dbName = 'cuenca'; break;
      default: return res.status(400).json({ error: 'Centro inválido' });
    }

    const connection = await getConnection(dbName);

    // Verificar si el email ya existe
    const [existingUsers] = await connection.query(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );
    if (existingUsers.length > 0) {
      await connection.end();
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    // Si es médico, validar que el médico existe
    if (rol === 'medico' && id_medico) {
      const [medicos] = await connection.query(
        'SELECT id FROM medicos WHERE id = ?',
        [id_medico]
      );
      if (medicos.length === 0) {
        await connection.end();
        return res.status(400).json({ error: 'El médico especificado no existe' });
      }
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const [result] = await connection.execute(`
      INSERT INTO usuarios (email, password_hash, rol, id_centro, id_medico) 
      VALUES (?, ?, ?, ?, ?)
    `, [email, passwordHash, rol, id_centro, id_medico || null]);

    await connection.end();

    logger.info(`Usuario creado: ${email} en centro ${id_centro}`);

    res.status(201).json({
      id: result.insertId,
      email: email,
      rol: rol,
      id_centro: id_centro,
      id_medico: id_medico || null,
      origen_bd: dbName,
      id_frontend: `${dbName}-${result.insertId}`
    });
  } catch (error) {
    logger.error('Error creando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =========================
// MÉDICOS
// =========================

// GET /admin/medicos - Listar médicos
app.get('/admin/medicos', extractUserInfo, requireAdmin, async (req, res) => {
  try {
    let medicos = [];
    const availableDbs = await getAllDatabases();
    
    for (const [dbName, config] of Object.entries(availableDbs)) {
      try {
        const connection = await mysql.createConnection(config);
        const [dbMedicos] = await connection.query(`
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
          ORDER BY m.nombres ASC
        `);
        
        // Agregar información de origen
        dbMedicos.forEach(medico => {
          medico.origen_bd = dbName;
          medico.id_unico = `${dbName}-${medico.id}`;
          medico.id_frontend = `${dbName}-${medico.id}`;
        });
        
        medicos.push(...dbMedicos);
        await connection.end();
      } catch (error) {
        logger.error(`Error consultando ${dbName}:`, error);
      }
    }

    res.json(medicos);
  } catch (error) {
    logger.error('Error listando médicos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /admin/medicos - Crear médico
app.post('/admin/medicos', extractUserInfo, requireAdmin, async (req, res) => {
  try {
    const { nombres, apellidos, id_especialidad, id_centro } = req.body;

    // Validaciones
    if (!nombres || !apellidos || !id_especialidad || !id_centro) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Determinar qué base de datos usar según el centro
    let dbName;
    switch (id_centro) {
      case 1: dbName = 'central'; break;
      case 2: dbName = 'guayaquil'; break;
      case 3: dbName = 'cuenca'; break;
      default: return res.status(400).json({ error: 'Centro inválido' });
    }

    const connection = await getConnection(dbName);

    // Validar que la especialidad existe
    const [especialidades] = await connection.query(
      'SELECT id FROM especialidades WHERE id = ?',
      [id_especialidad]
    );
    if (especialidades.length === 0) {
      await connection.end();
      return res.status(400).json({ error: 'La especialidad especificada no existe' });
    }

    // Crear médico
    const [result] = await connection.execute(`
      INSERT INTO medicos (nombres, apellidos, id_especialidad, id_centro) 
      VALUES (?, ?, ?, ?)
    `, [nombres.trim(), apellidos.trim(), id_especialidad, id_centro]);

    await connection.end();

    logger.info(`Médico creado: ${nombres} ${apellidos} en centro ${id_centro}`);

    res.status(201).json({
      id: result.insertId,
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      id_especialidad: id_especialidad,
      id_centro: id_centro,
      origen_bd: dbName,
      id_frontend: `${dbName}-${result.insertId}`
    });
  } catch (error) {
    logger.error('Error creando médico:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =========================
// PACIENTES
// =========================

// GET /admin/pacientes - Listar pacientes
app.get('/admin/pacientes', extractUserInfo, requireAdmin, async (req, res) => {
  try {
    let pacientes = [];
    const availableDbs = await getAllDatabases();
    
    for (const [dbName, config] of Object.entries(availableDbs)) {
      try {
        const connection = await mysql.createConnection(config);
        const [dbPacientes] = await connection.query(`
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
          ORDER BY p.created_at DESC
        `);
        
        // Agregar información de origen
        dbPacientes.forEach(paciente => {
          paciente.origen_bd = dbName;
          paciente.id_unico = `${dbName}-${paciente.id}`;
          paciente.id_frontend = `${dbName}-${paciente.id}`;
        });
        
        pacientes.push(...dbPacientes);
        await connection.end();
      } catch (error) {
        logger.error(`Error consultando ${dbName}:`, error);
      }
    }

    res.json(pacientes);
  } catch (error) {
    logger.error('Error listando pacientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =========================
// CENTROS MÉDICOS
// =========================

// GET /admin/centros - Listar centros
app.get('/admin/centros', extractUserInfo, requireAdmin, async (req, res) => {
  try {
    // Los centros se almacenan en la BD central
    const connection = await getConnection('central');
    const [centros] = await connection.query(`
      SELECT 
        id,
        nombre,
        direccion,
        ciudad,
        telefono,
        email,
        director,
        created_at,
        updated_at
      FROM centros_medicos
      ORDER BY id ASC
    `);
    
    await connection.end();
    res.json(centros);
  } catch (error) {
    logger.error('Error listando centros:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =========================
// ESPECIALIDADES
// =========================

// GET /admin/especialidades - Listar especialidades
app.get('/admin/especialidades', extractUserInfo, requireAdmin, async (req, res) => {
  try {
    // Las especialidades se almacenan en la BD central
    const connection = await getConnection('central');
    const [especialidades] = await connection.query(`
      SELECT 
        id,
        nombre,
        descripcion,
        activa,
        created_at,
        updated_at
      FROM especialidades
      ORDER BY nombre ASC
    `);
    
    await connection.end();
    res.json(especialidades);
  } catch (error) {
    logger.error('Error listando especialidades:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =========================
// EMPLEADOS
// =========================

// GET /admin/empleados - Listar empleados
app.get('/admin/empleados', extractUserInfo, requireAdmin, async (req, res) => {
  try {
    let empleados = [];
    const availableDbs = await getAllDatabases();
    
    for (const [dbName, config] of Object.entries(availableDbs)) {
      try {
        const connection = await mysql.createConnection(config);
        const [dbEmpleados] = await connection.query(`
          SELECT 
            e.id,
            e.nombres,
            e.apellidos,
            e.cargo,
            e.id_centro,
            c.nombre as centro_nombre,
            c.ciudad as centro_ciudad,
            e.created_at,
            e.updated_at
          FROM empleados e
          LEFT JOIN centros_medicos c ON e.id_centro = c.id
          ORDER BY e.nombres ASC
        `);
        
        // Agregar información de origen
        dbEmpleados.forEach(empleado => {
          empleado.origen_bd = dbName;
          empleado.id_unico = `${dbName}-${empleado.id}`;
          empleado.id_frontend = `${dbName}-${empleado.id}`;
        });
        
        empleados.push(...dbEmpleados);
        await connection.end();
      } catch (error) {
        logger.error(`Error consultando ${dbName}:`, error);
      }
    }

    res.json(empleados);
  } catch (error) {
    logger.error('Error listando empleados:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =========================
// REPORTES
// =========================

// GET /admin/reportes/estadisticas - Estadísticas generales
app.get('/admin/reportes/estadisticas', extractUserInfo, requireAdmin, async (req, res) => {
  try {
    const { desde, hasta, centro } = req.query;
    let estadisticas = {
      total_medicos: 0,
      total_pacientes: 0,
      total_empleados: 0,
      total_consultas: 0,
      consultas_por_centro: []
    };

    const availableDbs = await getAllDatabases();
    
    for (const [dbName, config] of Object.entries(availableDbs)) {
      try {
        const connection = await mysql.createConnection(config);
        
        // Contar médicos
        const [medicos] = await connection.query('SELECT COUNT(*) as count FROM medicos');
        estadisticas.total_medicos += medicos[0].count;
        
        // Contar pacientes
        const [pacientes] = await connection.query('SELECT COUNT(*) as count FROM pacientes');
        estadisticas.total_pacientes += pacientes[0].count;
        
        // Contar empleados
        const [empleados] = await connection.query('SELECT COUNT(*) as count FROM empleados');
        estadisticas.total_empleados += empleados[0].count;
        
        // Contar consultas
        let consultasQuery = 'SELECT COUNT(*) as count FROM consultas';
        let consultasParams = [];
        
        if (desde && hasta) {
          consultasQuery += ' WHERE fecha BETWEEN ? AND ?';
          consultasParams = [desde, hasta];
        }
        
        const [consultas] = await connection.query(consultasQuery, consultasParams);
        estadisticas.total_consultas += consultas[0].count;
        
        await connection.end();
      } catch (error) {
        logger.error(`Error consultando ${dbName}:`, error);
      }
    }

    res.json(estadisticas);
  } catch (error) {
    logger.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'admin-service',
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  logger.error('Error en admin-service:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  logger.info(`Admin Service ejecutándose en puerto ${PORT}`);
  console.log(`👑 Admin Service ejecutándose en puerto ${PORT}`);
});

module.exports = app;
