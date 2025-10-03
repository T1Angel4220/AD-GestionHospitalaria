const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const winston = require('winston');
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
    charset: 'utf8mb4'
  },
  guayaquil: {
    host: process.env.DB_GUAYAQUIL_HOST || 'mysql-guayaquil',
    user: process.env.DB_GUAYAQUIL_USER || 'admin_guayaquil',
    password: process.env.DB_GUAYAQUIL_PASSWORD || 'SuperPasswordGye123!',
    database: 'hospital_guayaquil',
    port: process.env.DB_GUAYAQUIL_PORT || 3306,
    charset: 'utf8mb4'
  },
  cuenca: {
    host: process.env.DB_CUENCA_HOST || 'mysql-cuenca',
    user: process.env.DB_CUENCA_USER || 'admin_cuenca',
    password: process.env.DB_CUENCA_PASSWORD || 'SuperPasswordCuenca123!',
    database: 'hospital_cuenca',
    port: process.env.DB_CUENCA_PORT || 3306,
    charset: 'utf8mb4'
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
  const centroId = req.headers['x-centro-id'] || req.user?.id_centro;
  
  // Si es admin, permitir acceso sin centro específico
  if (req.user?.rol === 'admin') {
    req.centroId = centroId ? parseInt(centroId) : null; // null significa todas las BDs
    return next();
  }
  
  if (!centroId) {
    return res.status(400).json({ error: 'X-Centro-Id requerido' });
  }

  req.centroId = parseInt(centroId);
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

const getDbNameByCentroId = (centroId) => {
  switch (centroId) {
    case 1: return 'central';
    case 2: return 'guayaquil';
    case 3: return 'cuenca';
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
    const pool = getPoolByCentroId(centroId);

    // Si es admin, obtener de todas las BDs
    if (req.user.rol === 'admin') {
      const allConsultas = [];

      for (const [dbName, dbPool] of Object.entries(pools)) {
        try {
          const [consultas] = await dbPool.query(`
            SELECT c.*, 
                   m.nombres as medico_nombres, m.apellidos as medico_apellidos,
                   p.nombres as paciente_nombres, p.apellidos as paciente_apellidos,
                   cm.nombre as centro_nombre, cm.ciudad as centro_ciudad,
                   e.nombre as especialidad_nombre
            FROM consultas c
            LEFT JOIN medicos m ON c.id_medico = m.id
            LEFT JOIN especialidades e ON m.id_especialidad = e.id
            LEFT JOIN pacientes p ON c.id_paciente = p.id
            LEFT JOIN centros_medicos cm ON c.id_centro = cm.id
            ORDER BY c.fecha DESC
          `);
          
          const consultasWithFrontendId = addFrontendId(consultas, dbName);
          allConsultas.push(...consultasWithFrontendId);
        } catch (error) {
          logger.error(`Error obteniendo consultas de ${dbName}:`, error.message);
        }
      }

      return res.json(allConsultas);
    }

    // Si es médico, obtener solo sus consultas
    const [consultas] = await pool.query(`
      SELECT c.*, 
             m.nombres as medico_nombres, m.apellidos as medico_apellidos,
             p.nombres as paciente_nombres, p.apellidos as paciente_apellidos,
             cm.nombre as centro_nombre, cm.ciudad as centro_ciudad,
             e.nombre as especialidad_nombre
      FROM consultas c
      LEFT JOIN medicos m ON c.id_medico = m.id
      LEFT JOIN especialidades e ON m.id_especialidad = e.id
      LEFT JOIN pacientes p ON c.id_paciente = p.id
      LEFT JOIN centros_medicos cm ON c.id_centro = cm.id
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
  body('fecha').isISO8601().toDate(),
  body('duracion_minutos').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { centroId } = req;
    const pool = getPoolByCentroId(centroId);

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

    const [result] = await pool.query(`
      INSERT INTO consultas (
        id_medico, id_paciente, paciente_nombre, paciente_apellido,
        motivo, diagnostico, tratamiento, estado, fecha, duracion_minutos, id_centro
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id_medico, id_paciente, paciente_nombre, paciente_apellido,
      motivo, diagnostico, tratamiento, estado, fecha, duracion_minutos, centroId
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
      id_centro: centroId
    };

    logger.info(`Consulta ${result.insertId} creada en centro ${centroId}`);
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
  body('duracion_minutos').optional().isInt({ min: 1 })
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

// Obtener médicos por centro
app.get('/medicos-por-centro/:centroId', authenticateToken, async (req, res) => {
  try {
    const { centroId } = req.params;
    const pool = getPoolByCentroId(parseInt(centroId));

    const [medicos] = await pool.query(`
      SELECT m.*, 
             e.nombre as especialidad_nombre,
             cm.nombre as centro_nombre,
             cm.ciudad as centro_ciudad
      FROM medicos m
      LEFT JOIN especialidades e ON m.id_especialidad = e.id
      LEFT JOIN centros_medicos cm ON m.id_centro = cm.id
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

// Obtener pacientes según el rol del usuario
app.get('/pacientes', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    if (user.rol === 'admin') {
      // Admin puede obtener pacientes de todos los centros
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
    } else if (user.rol === 'medico') {
      // Médico solo puede obtener pacientes de su centro
      const centroId = user.id_centro;
      const dbName = getDbNameByCentroId(centroId);
      const dbPool = pools[dbName];

      if (!dbPool) {
        return res.status(404).json({ error: 'Centro médico no encontrado' });
      }

      const [pacientes] = await dbPool.query(`
        SELECT p.*, cm.nombre as centro_nombre, cm.ciudad as centro_ciudad
        FROM pacientes p
        LEFT JOIN centros_medicos cm ON p.id_centro = cm.id
        WHERE p.id_centro = ?
        ORDER BY p.apellidos, p.nombres
      `, [centroId]);
      
      const pacientesWithFrontendId = addFrontendId(pacientes, dbName);
      res.json(pacientesWithFrontendId);
    } else {
      return res.status(403).json({ error: 'Rol no autorizado para acceder a pacientes' });
    }
  } catch (error) {
    logger.error('Error obteniendo pacientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener paciente por ID
app.get('/pacientes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    if (user.rol === 'admin') {
      // Admin puede obtener paciente de cualquier centro
      for (const [dbName, dbPool] of Object.entries(pools)) {
        try {
          const [pacientes] = await dbPool.query(`
            SELECT p.*, cm.nombre as centro_nombre, cm.ciudad as centro_ciudad
            FROM pacientes p
            LEFT JOIN centros_medicos cm ON p.id_centro = cm.id
            WHERE p.id = ?
          `, [id]);
          
          if (pacientes.length > 0) {
            const pacientesWithFrontendId = addFrontendId(pacientes, dbName);
            return res.json(pacientesWithFrontendId[0]);
          }
        } catch (error) {
          logger.error(`Error obteniendo paciente de ${dbName}:`, error.message);
        }
      }
      return res.status(404).json({ error: 'Paciente no encontrado' });
    } else if (user.rol === 'medico') {
      // Médico solo puede obtener pacientes de su centro
      const centroId = user.id_centro;
      const dbName = getDbNameByCentroId(centroId);
      const dbPool = pools[dbName];

      if (!dbPool) {
        return res.status(404).json({ error: 'Centro médico no encontrado' });
      }

      const [pacientes] = await dbPool.query(`
        SELECT p.*, cm.nombre as centro_nombre, cm.ciudad as centro_ciudad
        FROM pacientes p
        LEFT JOIN centros_medicos cm ON p.id_centro = cm.id
        WHERE p.id = ? AND p.id_centro = ?
      `, [id, centroId]);
      
      if (pacientes.length === 0) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }
      
      const pacientesWithFrontendId = addFrontendId(pacientes, dbName);
      res.json(pacientesWithFrontendId[0]);
    } else {
      return res.status(403).json({ error: 'Rol no autorizado para acceder a pacientes' });
    }
  } catch (error) {
    logger.error('Error obteniendo paciente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear paciente
app.post('/pacientes', authenticateToken, [
  body('nombres').trim().isLength({ min: 1 }).withMessage('Nombres son requeridos'),
  body('apellidos').trim().isLength({ min: 1 }).withMessage('Apellidos son requeridos'),
  body('cedula').trim().isLength({ min: 1 }).withMessage('Cédula es requerida'),
  body('telefono').trim().isLength({ min: 1 }).withMessage('Teléfono es requerido'),
  body('email').isEmail().withMessage('Email válido es requerido'),
  body('fecha_nacimiento').isISO8601().withMessage('Fecha de nacimiento válida es requerida'),
  body('genero').isIn(['M', 'F', 'O']).withMessage('Género debe ser M, F u O'),
  body('direccion').trim().isLength({ min: 1 }).withMessage('Dirección es requerida'),
  body('id_centro').isInt({ min: 1 }).withMessage('ID de centro válido es requerido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = req.user;
    const { nombres, apellidos, cedula, telefono, email, fecha_nacimiento, genero, direccion, id_centro } = req.body;
    
    // Determinar el centro según el rol
    let centroId = id_centro;
    if (user.rol === 'medico') {
      centroId = user.id_centro; // Los médicos solo pueden crear pacientes en su centro
    }
    
    const dbName = getDbNameByCentroId(centroId);
    const dbPool = pools[dbName];

    if (!dbPool) {
      return res.status(404).json({ error: 'Centro médico no encontrado' });
    }

    // Verificar si ya existe un paciente con la misma cédula en este centro
    const [existingPacientes] = await dbPool.query(
      'SELECT id FROM pacientes WHERE cedula = ? AND id_centro = ?',
      [cedula, centroId]
    );

    if (existingPacientes.length > 0) {
      return res.status(400).json({ error: 'Ya existe un paciente con esta cédula en este centro' });
    }

    const [result] = await dbPool.query(`
      INSERT INTO pacientes (nombres, apellidos, cedula, telefono, email, fecha_nacimiento, genero, direccion, id_centro)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [nombres, apellidos, cedula, telefono, email, fecha_nacimiento, genero, direccion, centroId]);

    const pacientesWithFrontendId = addFrontendId([{
      id: result.insertId,
      nombres,
      apellidos,
      cedula,
      telefono,
      email,
      fecha_nacimiento,
      genero,
      direccion,
      id_centro: centroId,
      created_at: new Date(),
      updated_at: new Date()
    }], dbName);

    res.status(201).json(pacientesWithFrontendId[0]);
  } catch (error) {
    logger.error('Error creando paciente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar paciente
app.put('/pacientes/:id', authenticateToken, [
  body('nombres').optional().trim().isLength({ min: 1 }),
  body('apellidos').optional().trim().isLength({ min: 1 }),
  body('cedula').optional().trim().isLength({ min: 1 }),
  body('telefono').optional().trim().isLength({ min: 1 }),
  body('email').optional().isEmail(),
  body('fecha_nacimiento').optional().isISO8601(),
  body('genero').optional().isIn(['M', 'F', 'O']),
  body('direccion').optional().trim().isLength({ min: 1 }),
  body('id_centro').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const user = req.user;
    const updateData = req.body;
    
    // Determinar el centro según el rol
    let centroId = updateData.id_centro;
    if (user.rol === 'medico') {
      centroId = user.id_centro; // Los médicos solo pueden actualizar pacientes de su centro
    }
    
    const dbName = getDbNameByCentroId(centroId);
    const dbPool = pools[dbName];

    if (!dbPool) {
      return res.status(404).json({ error: 'Centro médico no encontrado' });
    }

    // Verificar que el paciente existe y pertenece al centro correcto
    const [existingPacientes] = await dbPool.query(
      'SELECT * FROM pacientes WHERE id = ? AND id_centro = ?',
      [id, centroId]
    );

    if (existingPacientes.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    // Si se está actualizando la cédula, verificar que no exista otra con la misma cédula
    if (updateData.cedula && updateData.cedula !== existingPacientes[0].cedula) {
      const [duplicatePacientes] = await dbPool.query(
        'SELECT id FROM pacientes WHERE cedula = ? AND id_centro = ? AND id != ?',
        [updateData.cedula, centroId, id]
      );

      if (duplicatePacientes.length > 0) {
        return res.status(400).json({ error: 'Ya existe otro paciente con esta cédula en este centro' });
      }
    }

    // Construir la consulta de actualización dinámicamente
    const updateFields = [];
    const updateValues = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && updateData[key] !== null && updateData[key] !== '') {
        updateFields.push(`${key} = ?`);
        updateValues.push(updateData[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    updateFields.push('updated_at = ?');
    updateValues.push(new Date());
    updateValues.push(id);

    const [result] = await dbPool.query(`
      UPDATE pacientes 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    // Obtener el paciente actualizado
    const [updatedPacientes] = await dbPool.query(`
      SELECT p.*, cm.nombre as centro_nombre, cm.ciudad as centro_ciudad
      FROM pacientes p
      LEFT JOIN centros_medicos cm ON p.id_centro = cm.id
      WHERE p.id = ?
    `, [id]);

    const pacientesWithFrontendId = addFrontendId(updatedPacientes, dbName);
    res.json(pacientesWithFrontendId[0]);
  } catch (error) {
    logger.error('Error actualizando paciente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar paciente
app.delete('/pacientes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    if (user.rol === 'admin') {
      // Admin puede eliminar pacientes de cualquier centro
      for (const [dbName, dbPool] of Object.entries(pools)) {
        try {
          const [result] = await dbPool.query('DELETE FROM pacientes WHERE id = ?', [id]);
          if (result.affectedRows > 0) {
            return res.status(200).json({
              message: 'Paciente eliminado exitosamente',
              id: parseInt(id)
            });
          }
        } catch (error) {
          logger.error(`Error eliminando paciente de ${dbName}:`, error.message);
        }
      }
      return res.status(404).json({ error: 'Paciente no encontrado' });
    } else if (user.rol === 'medico') {
      // Médico solo puede eliminar pacientes de su centro
      const centroId = user.id_centro;
      const dbName = getDbNameByCentroId(centroId);
      const dbPool = pools[dbName];

      if (!dbPool) {
        return res.status(404).json({ error: 'Centro médico no encontrado' });
      }

      const [result] = await dbPool.query(
        'DELETE FROM pacientes WHERE id = ? AND id_centro = ?',
        [id, centroId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }

      res.status(200).json({
        message: 'Paciente eliminado exitosamente',
        id: parseInt(id)
      });
    } else {
      return res.status(403).json({ error: 'Rol no autorizado para eliminar pacientes' });
    }
  } catch (error) {
    logger.error('Error eliminando paciente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener centros médicos
app.get('/centros', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    if (user.rol === 'admin') {
      // Admin puede ver todos los centros
      const centros = [
        { id: 1, nombre: 'Hospital Central Quito', ciudad: 'Quito', direccion: 'Av. 6 de Diciembre', telefono: '02-2345678' },
        { id: 2, nombre: 'Hospital Guayaquil', ciudad: 'Guayaquil', direccion: 'Av. 9 de Octubre', telefono: '04-2345678' },
        { id: 3, nombre: 'Hospital Cuenca', ciudad: 'Cuenca', direccion: 'Av. Solano', telefono: '07-2345678' }
      ];
      res.json(centros);
    } else if (user.rol === 'medico') {
      // Médico solo puede ver su centro
      const centroId = user.id_centro;
      const centros = [
        { id: 1, nombre: 'Hospital Central Quito', ciudad: 'Quito', direccion: 'Av. 6 de Diciembre', telefono: '02-2345678' },
        { id: 2, nombre: 'Hospital Guayaquil', ciudad: 'Guayaquil', direccion: 'Av. 9 de Octubre', telefono: '04-2345678' },
        { id: 3, nombre: 'Hospital Cuenca', ciudad: 'Cuenca', direccion: 'Av. Solano', telefono: '07-2345678' }
      ];
      const userCentro = centros.find(c => c.id === centroId);
      res.json(userCentro ? [userCentro] : []);
    } else {
      return res.status(403).json({ error: 'Rol no autorizado para acceder a centros' });
    }
  } catch (error) {
    logger.error('Error obteniendo centros:', error);
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
