const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
const rateLimit = require('express-rate-limit');
const { validateMedico, validateEspecialidad, validatePaciente, validateEmpleado } = require('./validation');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

// Configuración de logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/admin.log' })
  ]
});

// Configuración de rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por IP
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo en 15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(limiter);

// Configuración de bases de datos
const dbConfigs = {
  central: {
    host: process.env.DB_HOST || 'mysql-central',
    user: process.env.DB_USER || 'admin_central',
    password: process.env.DB_PASSWORD || 'SuperPasswordCentral123!',
    database: process.env.DB_NAME || 'hospital_central',
    port: process.env.DB_PORT || 3306
  },
  guayaquil: {
    host: process.env.DB_GUAYAQUIL_HOST || 'mysql-guayaquil',
    user: process.env.DB_GUAYAQUIL_USER || 'admin_guayaquil',
    password: process.env.DB_GUAYAQUIL_PASSWORD || 'SuperPasswordGye123!',
    database: process.env.DB_GUAYAQUIL_NAME || 'hospital_guayaquil',
    port: process.env.DB_GUAYAQUIL_PORT || 3306
  },
  cuenca: {
    host: process.env.DB_CUENCA_HOST || 'mysql-cuenca',
    user: process.env.DB_CUENCA_USER || 'admin_cuenca',
    password: process.env.DB_CUENCA_PASSWORD || 'SuperPasswordCuenca123!',
    database: process.env.DB_CUENCA_NAME || 'hospital_cuenca',
    port: process.env.DB_CUENCA_PORT || 3306
  }
};

// Pools de conexiones
const pools = {
  central: mysql.createPool(dbConfigs.central),
  guayaquil: mysql.createPool(dbConfigs.guayaquil),
  cuenca: mysql.createPool(dbConfigs.cuenca)
};

// Función para obtener el pool correcto según el centro
function getPoolByCentro(centroId) {
  switch (centroId) {
    case 1: return pools.central;
    case 2: return pools.guayaquil;
    case 3: return pools.cuenca;
    default: return pools.central;
  }
}

// Middleware de autenticación
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
}

// Middleware para verificar rol admin
function requireAdmin(req, res, next) {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador' });
  }
  next();
}

// Ruta de salud
app.get('/health', async (req, res) => {
  try {
    await pools.central.query('SELECT 1');
    res.json({
      status: 'OK',
      service: 'admin-service',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      service: 'admin-service',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Ruta de prueba de base de datos
app.get('/test', async (req, res) => {
  try {
    const connection = await pools.central.getConnection();
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as current_datetime');
    connection.release();
    
    res.json({ 
      message: 'Conexión a BD exitosa',
      test: rows[0].test,
      current_datetime: rows[0].current_datetime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error de conexión',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===== RUTAS DE MÉDICOS =====

// Obtener todos los médicos de todos los centros
app.get('/medicos', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const medicos = [];
    
    // Obtener médicos de cada centro
    for (const [centro, pool] of Object.entries(pools)) {
      const [rows] = await pool.query(`
        SELECT m.*, e.nombre as especialidad_nombre, cm.nombre as centro_nombre, cm.ciudad
        FROM medicos m
        LEFT JOIN especialidades e ON e.id = m.id_especialidad
        LEFT JOIN centros_medicos cm ON cm.id = m.id_centro
        ORDER BY m.id
      `);
      
      // Agregar información de origen
      const medicosConOrigen = rows.map(medico => ({
        ...medico,
        especialidad: medico.especialidad_nombre,
        centro_medico: medico.centro_nombre,
        centro_ciudad: medico.ciudad,
        origen_bd: centro,
        id_frontend: `${centro}-${medico.id}`
      }));
      
      medicos.push(...medicosConOrigen);
    }
    
    res.json(medicos);
  } catch (error) {
    logger.error('Error obteniendo médicos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener médicos por centro específico
app.get('/medicos/centro/:centroId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const centroId = parseInt(req.params.centroId);
    const pool = getPoolByCentro(centroId);
    
    const [rows] = await pool.query(`
      SELECT m.*, e.nombre as especialidad_nombre, cm.nombre as centro_nombre, cm.ciudad
      FROM medicos m
      LEFT JOIN especialidades e ON e.id = m.id_especialidad
      LEFT JOIN centros_medicos cm ON cm.id = m.id_centro
      WHERE m.id_centro = ?
      ORDER BY m.id
    `, [centroId]);
    
    res.json(rows);
  } catch (error) {
    logger.error('Error obteniendo médicos por centro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear médico
app.post('/medicos', authenticateToken, requireAdmin, validateMedico, async (req, res) => {
  try {
    const { nombres, apellidos, id_especialidad, id_centro } = req.body;
    
    if (!nombres || !apellidos || !id_especialidad || !id_centro) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    
    const pool = getPoolByCentro(id_centro);
    
    const [result] = await pool.execute(`
      INSERT INTO medicos (nombres, apellidos, id_especialidad, id_centro)
      VALUES (?, ?, ?, ?)
    `, [nombres, apellidos, id_especialidad, id_centro]);
    
    res.status(201).json({
      message: 'Médico creado exitosamente',
      id: result.insertId,
      id_centro
    });
  } catch (error) {
    logger.error('Error creando médico:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== RUTAS DE PACIENTES =====

// Obtener todos los pacientes de todos los centros
app.get('/pacientes', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pacientes = [];
    
    // Obtener pacientes de cada centro
    for (const [centro, pool] of Object.entries(pools)) {
      const [rows] = await pool.query(`
        SELECT p.*, cm.nombre as centro_nombre, cm.ciudad
        FROM pacientes p
        LEFT JOIN centros_medicos cm ON cm.id = p.id_centro
        ORDER BY p.id
      `);
      
      // Agregar información de origen
      const pacientesConOrigen = rows.map(paciente => ({
        ...paciente,
        origen_bd: centro,
        id_frontend: `${centro}-${paciente.id}`
      }));
      
      pacientes.push(...pacientesConOrigen);
    }
    
    res.json(pacientes);
  } catch (error) {
    logger.error('Error obteniendo pacientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== RUTAS DE ESPECIALIDADES =====

// Obtener todas las especialidades de todos los centros
app.get('/especialidades', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const especialidades = [];
    
    // Obtener especialidades de cada centro
    for (const [centro, pool] of Object.entries(pools)) {
      const [rows] = await pool.query(`
        SELECT e.*, cm.nombre as centro_nombre, cm.ciudad
        FROM especialidades e
        CROSS JOIN centros_medicos cm
        ORDER BY e.id
      `);
      
      // Agregar información de origen
      const especialidadesConOrigen = rows.map(especialidad => ({
        ...especialidad,
        origen_bd: centro,
        id_frontend: `${centro}-${especialidad.id}`
      }));
      
      especialidades.push(...especialidadesConOrigen);
    }
    
    res.json(especialidades);
  } catch (error) {
    logger.error('Error obteniendo especialidades:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear especialidad
app.post('/especialidades', authenticateToken, requireAdmin, validateEspecialidad, async (req, res) => {
  try {
    const { nombre, id_centro } = req.body;
    
    if (!nombre || !id_centro) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    
    const pool = getPoolByCentro(id_centro);
    
    const [result] = await pool.execute(`
      INSERT INTO especialidades (nombre)
      VALUES (?)
    `, [nombre]);
    
    res.status(201).json({
      message: 'Especialidad creada exitosamente',
      id: result.insertId,
      id_centro
    });
  } catch (error) {
    logger.error('Error creando especialidad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== RUTAS DE PACIENTES =====

// Obtener todos los pacientes de todos los centros
app.get('/pacientes', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pacientes = [];
    
    // Obtener pacientes de cada centro
    for (const [centro, pool] of Object.entries(pools)) {
      const [rows] = await pool.query(`
        SELECT p.*, cm.nombre as centro_nombre, cm.ciudad
        FROM pacientes p
        LEFT JOIN centros_medicos cm ON cm.id = p.id_centro
        ORDER BY p.id
      `);
      
      // Agregar información de origen
      const pacientesConOrigen = rows.map(paciente => ({
        ...paciente,
        origen_bd: centro,
        id_frontend: `${centro}-${paciente.id}`
      }));
      
      pacientes.push(...pacientesConOrigen);
    }
    
    res.json(pacientes);
  } catch (error) {
    logger.error('Error obteniendo pacientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear paciente
app.post('/pacientes', authenticateToken, requireAdmin, validatePaciente, async (req, res) => {
  try {
    const { nombres, apellidos, cedula, telefono, email, fecha_nacimiento, genero, direccion, id_centro } = req.body;
    
    const pool = getPoolByCentro(id_centro);
    
    const [result] = await pool.execute(`
      INSERT INTO pacientes (nombres, apellidos, cedula, telefono, email, fecha_nacimiento, genero, direccion, id_centro)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [nombres, apellidos, cedula, telefono, email, fecha_nacimiento, genero, direccion, id_centro]);
    
    res.status(201).json({
      message: 'Paciente creado exitosamente',
      id: result.insertId,
      id_centro
    });
  } catch (error) {
    logger.error('Error creando paciente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== RUTAS DE EMPLEADOS =====

// Obtener todos los empleados de todos los centros
app.get('/empleados', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const empleados = [];
    
    // Obtener empleados de cada centro
    for (const [centro, pool] of Object.entries(pools)) {
      const [rows] = await pool.query(`
        SELECT e.*, cm.nombre as centro_nombre, cm.ciudad
        FROM empleados e
        LEFT JOIN centros_medicos cm ON cm.id = e.id_centro
        ORDER BY e.id
      `);
      
      // Agregar información de origen
      const empleadosConOrigen = rows.map(empleado => ({
        ...empleado,
        origen_bd: centro,
        id_frontend: `${centro}-${empleado.id}`
      }));
      
      empleados.push(...empleadosConOrigen);
    }
    
    res.json(empleados);
  } catch (error) {
    logger.error('Error obteniendo empleados:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear empleado
app.post('/empleados', authenticateToken, requireAdmin, validateEmpleado, async (req, res) => {
  try {
    const { nombres, apellidos, cargo, id_centro } = req.body;
    
    const pool = getPoolByCentro(id_centro);
    
    const [result] = await pool.execute(`
      INSERT INTO empleados (nombres, apellidos, cargo, id_centro)
      VALUES (?, ?, ?, ?)
    `, [nombres, apellidos, cargo, id_centro]);
    
    res.status(201).json({
      message: 'Empleado creado exitosamente',
      id: result.insertId,
      id_centro
    });
  } catch (error) {
    logger.error('Error creando empleado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== RUTAS DE CENTROS MÉDICOS =====

// Obtener todos los centros médicos
app.get('/centros', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const centros = [];
    
    // Obtener centros de cada base de datos
    for (const [centro, pool] of Object.entries(pools)) {
      const [rows] = await pool.query('SELECT * FROM centros_medicos ORDER BY id');
      centros.push(...rows);
    }
    
    res.json(centros);
  } catch (error) {
    logger.error('Error obteniendo centros:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  logger.error('Error en admin service:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`👑 Admin Service iniciado en puerto ${PORT}`);
  logger.info(`🗄️ Bases de datos: Central, Guayaquil, Cuenca`);
});

module.exports = app;