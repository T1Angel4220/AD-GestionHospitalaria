const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const winston = require('winston');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3004;

// Configuración de logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/consultas.log' })
  ]
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Configuración de bases de datos
const dbConfigs = {
  central: {
    host: process.env.DB_HOST || 'mysql-central',
    user: process.env.DB_USER || 'admin_central',
    password: process.env.DB_PASSWORD || 'SuperPasswordCentral123!',
    database: 'hospital_central',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
    timezone: '+00:00'
  },
  guayaquil: {
    host: process.env.DB_GUAYAQUIL_HOST || 'mysql-guayaquil',
    user: process.env.DB_GUAYAQUIL_USER || 'admin_guayaquil',
    password: process.env.DB_GUAYAQUIL_PASSWORD || 'SuperPasswordGye123!',
    database: 'hospital_guayaquil',
    port: process.env.DB_GUAYAQUIL_PORT || 3306,
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
    timezone: '+00:00'
  },
  cuenca: {
    host: process.env.DB_CUENCA_HOST || 'mysql-cuenca',
    user: process.env.DB_CUENCA_USER || 'admin_cuenca',
    password: process.env.DB_CUENCA_PASSWORD || 'SuperPasswordCuenca123!',
    database: 'hospital_cuenca',
    port: process.env.DB_CUENCA_PORT || 3306,
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
    timezone: '+00:00'
  }
};

// Pool de conexiones para cada BD
const pools = {
  central: mysql.createPool(dbConfigs.central),
  guayaquil: mysql.createPool(dbConfigs.guayaquil),
  cuenca: mysql.createPool(dbConfigs.cuenca)
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

// Middleware para obtener centro del usuario
const getCentroFromUser = (req, res, next) => {
  const centroId = req.headers['x-centro-id'] || req.headers['X-Centro-Id'];
  
  // Si es admin, permitir acceso sin centro específico
  if (req.user?.rol === 'admin') {
    req.centroId = centroId ? parseInt(centroId) : null; // null significa todas las BDs
    return next();
  }
  
  // Para médicos, usar su centro específico si no se proporciona header
  const finalCentroId = centroId || req.user?.id_centro;
  
  if (!finalCentroId) {
    return res.status(400).json({ error: 'X-Centro-Id requerido' });
  }

  req.centroId = parseInt(finalCentroId);
  next();
};

// Utilidades
const getPoolByCentroId = (centroId) => {
  if (centroId === null) {
    // Para administradores, devolver el pool central por defecto
    return pools.central;
  }
  
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
// RUTAS DE CONSULTAS
// =========================

// Obtener todas las consultas
app.get('/consultas', authenticateToken, getCentroFromUser, async (req, res) => {
  try {
    const { centroId } = req;

    // Si es admin, obtener consultas del centro específico o todas si no se especifica centro
    if (req.user.rol === 'admin') {
      logger.info(`Admin request - centroId: ${centroId}, tipo: ${typeof centroId}`);
      
      if (centroId) {
        // Admin con centro específico - obtener solo consultas de ese centro
        logger.info(`Admin con centro específico: ${centroId}`);
        const pool = getPoolByCentroId(centroId);
        const [consultas] = await pool.query(`
          SELECT c.*, 
                 m.nombres as medico_nombres, m.apellidos as medico_apellidos,
                 p.nombres as paciente_nombres, p.apellidos as paciente_apellidos
          FROM consultas c
          LEFT JOIN medicos m ON c.id_medico = m.id
          LEFT JOIN pacientes p ON c.id_paciente = p.id
          WHERE c.id_centro = ?
          ORDER BY c.fecha DESC
        `, [centroId]);
        
        return res.json(consultas);
      } else {
        // Admin sin centro específico - obtener de todas las BDs
        logger.info('Admin sin centro específico - obteniendo de todas las BDs');
        const allConsultas = [];

        for (const [dbName, dbPool] of Object.entries(pools)) {
          try {
            logger.info(`Obteniendo consultas de ${dbName}`);
            const [consultas] = await dbPool.query(`
              SELECT c.*, 
                     m.nombres as medico_nombres, m.apellidos as medico_apellidos,
                     p.nombres as paciente_nombres, p.apellidos as paciente_apellidos
              FROM consultas c
              LEFT JOIN medicos m ON c.id_medico = m.id
              LEFT JOIN pacientes p ON c.id_paciente = p.id
              ORDER BY c.fecha DESC
            `);
            
            logger.info(`${dbName}: ${consultas.length} consultas encontradas`);
            const consultasWithFrontendId = addFrontendId(consultas, dbName);
            allConsultas.push(...consultasWithFrontendId);
          } catch (error) {
            logger.error(`Error obteniendo consultas de ${dbName}:`, error.message);
          }
        }

        logger.info(`Total consultas obtenidas: ${allConsultas.length}`);
        return res.json(allConsultas);
      }
    }

    // Si es médico, obtener solo sus consultas
    const pool = getPoolByCentroId(centroId);
    const [consultas] = await pool.query(`
      SELECT c.*, 
             m.nombres as medico_nombres, m.apellidos as medico_apellidos,
             p.nombres as paciente_nombres, p.apellidos as paciente_apellidos
      FROM consultas c
      LEFT JOIN medicos m ON c.id_medico = m.id
      LEFT JOIN pacientes p ON c.id_paciente = p.id
      WHERE c.id_medico = ?
      ORDER BY c.fecha DESC
    `, [req.user.id_medico]);

    res.json(consultas);

  } catch (error) {
    logger.error('Error obteniendo consultas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear consulta
app.post('/consultas', authenticateToken, getCentroFromUser, [
  body('id_medico').isInt({ min: 1 }),
  body('id_paciente').optional().isInt({ min: 1 }),
  body('paciente_nombre').notEmpty().trim(),
  body('paciente_apellido').notEmpty().trim(),
  body('motivo').notEmpty().trim(),
  body('diagnostico').optional().trim(),
  body('tratamiento').optional().trim(),
  body('estado').isIn(['pendiente', 'programada', 'completada', 'cancelada']),
  body('fecha').optional().isISO8601().toDate(),
  body('duracion_minutos').optional().custom((value) => {
    if (value === null || value === undefined || value === '') {
      return true; // Permitir valores nulos/vacíos
    }
    const num = parseInt(value);
    return !isNaN(num) && num >= 0;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { centroId } = req;
    
    // Si es admin y no se especifica centro en header, usar el centroId del body
    const finalCentroId = centroId || req.body.centroId;
    
    if (!finalCentroId) {
      return res.status(400).json({ error: 'Centro ID requerido' });
    }
    
    const pool = getPoolByCentroId(finalCentroId);

    const {
      id_medico,
      id_paciente,
      paciente_nombre,
      paciente_apellido,
      motivo,
      diagnostico,
      tratamiento,
      estado,
      fecha,
      duracion_minutos
    } = req.body;

    // Obtener el ID original del paciente desde admin-service
    let idPacienteOriginal = id_paciente;
    try {
      const adminResponse = await fetch('http://admin-service:3002/pacientes', {
        headers: {
          'Authorization': req.headers.authorization
        }
      });
      
      if (adminResponse.ok) {
        const pacientes = await adminResponse.json();
        const paciente = pacientes.find(p => p.id === id_paciente && p.id_centro === finalCentroId);
        if (paciente && paciente.id_original) {
          idPacienteOriginal = paciente.id_original;
          logger.info(`Usando ID original del paciente: ${idPacienteOriginal} (global: ${id_paciente}) para centro ${finalCentroId}`);
        } else {
          logger.warn(`No se encontró paciente con ID global ${id_paciente} en centro ${finalCentroId}`);
        }
      }
    } catch (error) {
      logger.warn('No se pudo obtener ID original del paciente, usando ID global:', error.message);
    }

    // Manejar fecha opcional para consultas pendientes
    const fechaValida = fecha ? new Date(fecha) : new Date(); // Usar fecha actual para consultas pendientes
    
    const [result] = await pool.query(`
      INSERT INTO consultas (
        id_medico, id_paciente, paciente_nombre, paciente_apellido,
        motivo, diagnostico, tratamiento, estado, fecha, duracion_minutos, id_centro
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id_medico, idPacienteOriginal, paciente_nombre, paciente_apellido,
      motivo, diagnostico, tratamiento, estado, fechaValida, duracion_minutos, finalCentroId
    ]);

    const newConsulta = {
      id: result.insertId,
      id_medico,
      id_paciente,
      paciente_nombre,
      paciente_apellido,
      motivo,
      diagnostico,
      tratamiento,
      estado,
      fecha,
      duracion_minutos,
      id_centro: finalCentroId
    };

    logger.info(`Consulta ${result.insertId} creada en centro ${finalCentroId}`);
    res.status(201).json(newConsulta);

  } catch (error) {
    logger.error('Error creando consulta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar consulta
app.put('/consultas/:id', authenticateToken, getCentroFromUser, [
  body('motivo').optional().trim(),
  body('diagnostico').optional().trim(),
  body('tratamiento').optional().trim(),
  body('estado').optional().isIn(['pendiente', 'programada', 'completada', 'cancelada']),
  body('duracion_minutos').optional().custom((value) => {
    if (value === null || value === undefined || value === '') {
      return true; // Permitir valores nulos/vacíos
    }
    const num = parseInt(value);
    return !isNaN(num) && num >= 0;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { centroId } = req;
    const pool = getPoolByCentroId(centroId);

    // Verificar que la consulta existe y pertenece al médico (si no es admin)
    const [existingConsulta] = await pool.query(
      'SELECT * FROM consultas WHERE id = ? AND id_centro = ?',
      [id, centroId]
    );

    if (existingConsulta.length === 0) {
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }

    // Si es médico, verificar que la consulta le pertenece
    if (req.user.rol === 'medico' && existingConsulta[0].id_medico !== req.user.id_medico) {
      return res.status(403).json({ error: 'No tienes permisos para editar esta consulta' });
    }

    const updateData = req.body;
    const updateFields = [];
    const updateValues = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(updateData[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    updateValues.push(id);

    const [result] = await pool.query(
      `UPDATE consultas SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }

    logger.info(`Consulta ${id} actualizada en centro ${centroId}`);
    res.json({ message: 'Consulta actualizada exitosamente' });

  } catch (error) {
    logger.error('Error actualizando consulta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar consulta
app.delete('/consultas/:id', authenticateToken, getCentroFromUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { centroId } = req;
    const pool = getPoolByCentroId(centroId);

    // Verificar que la consulta existe
    const [existingConsulta] = await pool.query(
      'SELECT * FROM consultas WHERE id = ? AND id_centro = ?',
      [id, centroId]
    );

    if (existingConsulta.length === 0) {
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }

    // Si es médico, verificar que la consulta le pertenece
    if (req.user.rol === 'medico' && existingConsulta[0].id_medico !== req.user.id_medico) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar esta consulta' });
    }

    const [result] = await pool.query('DELETE FROM consultas WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }

    logger.info(`Consulta ${id} eliminada de centro ${centroId}`);
    res.json({ message: 'Consulta eliminada exitosamente' });

  } catch (error) {
    logger.error('Error eliminando consulta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =========================
// RUTAS DE MÉDICOS Y PACIENTES
// =========================

// Obtener médicos (ruta general)
app.get('/medicos', authenticateToken, getCentroFromUser, async (req, res) => {
  try {
    const { centroId } = req;
    
    // Si es admin, obtener de todas las BDs
    if (req.user.rol === 'admin') {
      const allMedicos = [];

      for (const [dbName, dbPool] of Object.entries(pools)) {
        try {
          const [medicos] = await dbPool.query(`
            SELECT m.*, e.nombre as especialidad_nombre
            FROM medicos m
            LEFT JOIN especialidades e ON m.id_especialidad = e.id
            ORDER BY m.apellidos, m.nombres
          `);
          
          const medicosWithFrontendId = addFrontendId(medicos, dbName);
          allMedicos.push(...medicosWithFrontendId);
        } catch (error) {
          logger.error(`Error obteniendo médicos de ${dbName}:`, error.message);
        }
      }

      return res.json(allMedicos);
    }

    // Si es médico, obtener solo médicos de su centro
    const pool = getPoolByCentroId(centroId);
    const [medicos] = await pool.query(`
      SELECT m.*, e.nombre as especialidad_nombre
      FROM medicos m
      LEFT JOIN especialidades e ON m.id_especialidad = e.id
      WHERE m.id_centro = ?
      ORDER BY m.apellidos, m.nombres
    `, [centroId]);

    res.json(medicos);
  } catch (error) {
    logger.error('Error obteniendo médicos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener médicos por centro
app.get('/medicos-por-centro/:centroId', authenticateToken, async (req, res) => {
  try {
    const { centroId } = req.params;
    const pool = getPoolByCentroId(parseInt(centroId));

    const [medicos] = await pool.query(`
      SELECT m.*, e.nombre as especialidad_nombre
      FROM medicos m
      LEFT JOIN especialidades e ON m.id_especialidad = e.id
      WHERE m.id_centro = ?
      ORDER BY m.apellidos, m.nombres
    `, [centroId]);

    res.json(medicos);
  } catch (error) {
    logger.error('Error obteniendo médicos por centro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener pacientes por centro
app.get('/pacientes-por-centro/:centroId', authenticateToken, async (req, res) => {
  try {
    const { centroId } = req.params;
    const pool = getPoolByCentroId(parseInt(centroId));

    const [pacientes] = await pool.query(`
      SELECT * FROM pacientes
      WHERE id_centro = ?
      ORDER BY apellidos, nombres
    `, [centroId]);

    res.json(pacientes);
  } catch (error) {
    logger.error('Error obteniendo pacientes por centro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener todos los pacientes (solo admin)
app.get('/pacientes', authenticateToken, async (req, res) => {
  try {
    // Solo admin puede obtener pacientes de todos los centros
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden obtener todos los pacientes' });
    }

    const allPacientes = [];

    for (const [dbName, dbPool] of Object.entries(pools)) {
      try {
        const [pacientes] = await dbPool.query(`
          SELECT p.*, cm.nombre as centro_nombre, cm.ciudad as centro_ciudad
          FROM pacientes p
          LEFT JOIN centros_medicos cm ON p.id_centro = cm.id
          ORDER BY p.apellidos, p.nombres
        `);
        
        const pacientesWithFrontendId = addFrontendId(pacientes, dbName);
        allPacientes.push(...pacientesWithFrontendId);
      } catch (error) {
        logger.error(`Error obteniendo pacientes de ${dbName}:`, error.message);
      }
    }

    res.json(allPacientes);
  } catch (error) {
    logger.error('Error obteniendo todos los pacientes:', error);
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
      service: 'consultas-service',
      timestamp: new Date().toISOString(),
      databases: healthChecks
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      service: 'consultas-service',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  logger.error('Error en consultas service:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`📋 Consultas Service iniciado en puerto ${PORT}`);
  logger.info(`🗄️ Bases de datos: ${Object.keys(pools).join(', ')}`);
});

module.exports = app;
