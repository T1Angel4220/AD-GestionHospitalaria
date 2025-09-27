const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const winston = require('winston');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

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

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Configuración de bases de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306
};

// Pool de conexiones para cada BD
const pools = {
  central: mysql.createPool({ ...dbConfig, database: 'hospital_central' }),
  guayaquil: mysql.createPool({ ...dbConfig, database: 'hospital_guayaquil' }),
  cuenca: mysql.createPool({ ...dbConfig, database: 'hospital_cuenca' })
};

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar rol admin
const requireAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador' });
  }
  next();
};

// Utilidades
const getPoolByCentroId = (centroId) => {
  switch (centroId) {
    case 1: return pools.central;
    case 2: return pools.guayaquil;
    case 3: return pools.cuenca;
    default: throw new Error(`Centro ID ${centroId} no válido`);
  }
};

const addFrontendId = (items, origenBd) => {
  return items.map((item, index) => ({
    ...item,
    origen_bd: origenBd,
    id_unico: `${origenBd}-${item.id}`,
    id_frontend: `${origenBd}-${item.id}`
  }));
};

// =========================
// RUTAS DE MÉDICOS
// =========================

// Obtener todos los médicos de todas las BDs
app.get('/medicos', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const allMedicos = [];

    for (const [dbName, pool] of Object.entries(pools)) {
      try {
        const [medicos] = await pool.query(`
          SELECT m.*, e.nombre as especialidad_nombre, cm.nombre as centro_nombre
          FROM medicos m
          LEFT JOIN especialidades e ON m.id_especialidad = e.id
          LEFT JOIN centros_medicos cm ON m.id_centro = cm.id
          ORDER BY m.id
        `);
        
        const medicosWithFrontendId = addFrontendId(medicos, dbName);
        allMedicos.push(...medicosWithFrontendId);
      } catch (error) {
        logger.error(`Error obteniendo médicos de ${dbName}:`, error.message);
      }
    }

    res.json(allMedicos);
  } catch (error) {
    logger.error('Error obteniendo médicos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear médico
app.post('/medicos', authenticateToken, requireAdmin, [
  body('nombres').notEmpty().trim(),
  body('apellidos').notEmpty().trim(),
  body('cedula').notEmpty().trim(),
  body('telefono').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('id_especialidad').isInt({ min: 1 }),
  body('id_centro').isInt({ min: 1, max: 3 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nombres, apellidos, cedula, telefono, email, id_especialidad, id_centro } = req.body;
    const pool = getPoolByCentroId(id_centro);

    const [result] = await pool.query(`
      INSERT INTO medicos (nombres, apellidos, cedula, telefono, email, id_especialidad, id_centro)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [nombres, apellidos, cedula, telefono, email, id_especialidad, id_centro]);

    const newMedico = {
      id: result.insertId,
      nombres,
      apellidos,
      cedula,
      telefono,
      email,
      id_especialidad,
      id_centro,
      origen_bd: Object.keys(pools)[id_centro - 1],
      id_unico: `${Object.keys(pools)[id_centro - 1]}-${result.insertId}`,
      id_frontend: `${Object.keys(pools)[id_centro - 1]}-${result.insertId}`
    };

    logger.info(`Médico ${nombres} ${apellidos} creado en centro ${id_centro}`);
    res.status(201).json(newMedico);

  } catch (error) {
    logger.error('Error creando médico:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar médico
app.put('/medicos/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { origen_bd, ...updateData } = req.body;

    if (!origen_bd) {
      return res.status(400).json({ error: 'origen_bd requerido' });
    }

    const pool = getPoolByCentroId(origen_bd === 'central' ? 1 : origen_bd === 'guayaquil' ? 2 : 3);

    const [result] = await pool.query(`
      UPDATE medicos 
      SET nombres = ?, apellidos = ?, cedula = ?, telefono = ?, email = ?, id_especialidad = ?
      WHERE id = ?
    `, [
      updateData.nombres,
      updateData.apellidos,
      updateData.cedula,
      updateData.telefono,
      updateData.email,
      updateData.id_especialidad,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    logger.info(`Médico ${id} actualizado en ${origen_bd}`);
    res.json({ message: 'Médico actualizado exitosamente' });

  } catch (error) {
    logger.error('Error actualizando médico:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar médico
app.delete('/medicos/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { origen_bd } = req.body;

    if (!origen_bd) {
      return res.status(400).json({ error: 'origen_bd requerido' });
    }

    const pool = getPoolByCentroId(origen_bd === 'central' ? 1 : origen_bd === 'guayaquil' ? 2 : 3);

    const [result] = await pool.query('DELETE FROM medicos WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    logger.info(`Médico ${id} eliminado de ${origen_bd}`);
    res.json({ message: 'Médico eliminado exitosamente' });

  } catch (error) {
    logger.error('Error eliminando médico:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =========================
// RUTAS DE ESPECIALIDADES
// =========================

// Obtener todas las especialidades
app.get('/especialidades', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const allEspecialidades = [];

    for (const [dbName, pool] of Object.entries(pools)) {
      try {
        const [especialidades] = await pool.query(`
          SELECT e.*, cm.nombre as centro_nombre
          FROM especialidades e
          LEFT JOIN centros_medicos cm ON e.id_centro = cm.id
          ORDER BY e.id
        `);
        
        const especialidadesWithFrontendId = addFrontendId(especialidades, dbName);
        allEspecialidades.push(...especialidadesWithFrontendId);
      } catch (error) {
        logger.error(`Error obteniendo especialidades de ${dbName}:`, error.message);
      }
    }

    res.json(allEspecialidades);
  } catch (error) {
    logger.error('Error obteniendo especialidades:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear especialidad
app.post('/especialidades', authenticateToken, requireAdmin, [
  body('nombre').notEmpty().trim(),
  body('descripcion').optional().trim(),
  body('id_centro').isInt({ min: 1, max: 3 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, descripcion, id_centro } = req.body;
    const pool = getPoolByCentroId(id_centro);

    const [result] = await pool.query(`
      INSERT INTO especialidades (nombre, descripcion, id_centro)
      VALUES (?, ?, ?)
    `, [nombre, descripcion || null, id_centro]);

    const newEspecialidad = {
      id: result.insertId,
      nombre,
      descripcion,
      id_centro,
      origen_bd: Object.keys(pools)[id_centro - 1],
      id_unico: `${Object.keys(pools)[id_centro - 1]}-${result.insertId}`,
      id_frontend: `${Object.keys(pools)[id_centro - 1]}-${result.insertId}`
    };

    logger.info(`Especialidad ${nombre} creada en centro ${id_centro}`);
    res.status(201).json(newEspecialidad);

  } catch (error) {
    logger.error('Error creando especialidad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta de salud
app.get('/health', async (req, res) => {
  try {
    const healthChecks = {};
    
    for (const [dbName, pool] of Object.entries(pools)) {
      try {
        await pool.query('SELECT 1');
        healthChecks[dbName] = 'connected';
      } catch (error) {
        healthChecks[dbName] = 'disconnected';
      }
    }

    res.json({
      status: 'OK',
      service: 'admin-service',
      timestamp: new Date().toISOString(),
      databases: healthChecks
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      service: 'admin-service',
      timestamp: new Date().toISOString(),
      error: error.message
    });
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
app.listen(PORT, () => {
  logger.info(`👥 Admin Service iniciado en puerto ${PORT}`);
  logger.info(`🗄️ Bases de datos: ${Object.keys(pools).join(', ')}`);
});

module.exports = app;
