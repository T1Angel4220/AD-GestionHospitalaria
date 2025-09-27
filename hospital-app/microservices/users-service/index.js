const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
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
    new winston.transports.File({ filename: 'logs/users.log' })
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
// RUTAS DE USUARIOS
// =========================

// Obtener todos los usuarios de todas las BDs
app.get('/usuarios', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const allUsuarios = [];

    for (const [dbName, pool] of Object.entries(pools)) {
      try {
        const [usuarios] = await pool.query(`
          SELECT u.*, 
                 m.nombres as medico_nombres, m.apellidos as medico_apellidos,
                 cm.nombre as centro_nombre
          FROM usuarios u
          LEFT JOIN medicos m ON u.id_medico = m.id
          LEFT JOIN centros_medicos cm ON u.id_centro = cm.id
          ORDER BY u.id
        `);
        
        const usuariosWithFrontendId = addFrontendId(usuarios, dbName);
        allUsuarios.push(...usuariosWithFrontendId);
      } catch (error) {
        logger.error(`Error obteniendo usuarios de ${dbName}:`, error.message);
      }
    }

    res.json(allUsuarios);
  } catch (error) {
    logger.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear usuario
app.post('/usuarios', authenticateToken, requireAdmin, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('rol').isIn(['admin', 'medico']),
  body('id_centro').isInt({ min: 1, max: 3 }),
  body('id_medico').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, rol, id_centro, id_medico } = req.body;

    // Verificar si el usuario ya existe en cualquier BD
    for (const [dbName, pool] of Object.entries(pools)) {
      try {
        const [existingUsers] = await pool.query(
          'SELECT id FROM usuarios WHERE email = ?',
          [email]
        );

        if (existingUsers.length > 0) {
          return res.status(400).json({ error: 'El email ya está registrado' });
        }
      } catch (error) {
        logger.error(`Error verificando usuario en BD ${dbName}:`, error.message);
        continue;
      }
    }

    // Hash de la contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Crear usuario en la BD correspondiente
    const pool = getPoolByCentroId(id_centro);

    const [result] = await pool.query(`
      INSERT INTO usuarios (email, password_hash, rol, id_centro, id_medico)
      VALUES (?, ?, ?, ?, ?)
    `, [email, passwordHash, rol, id_centro, id_medico]);

    const newUsuario = {
      id: result.insertId,
      email,
      rol,
      id_centro,
      id_medico,
      origen_bd: Object.keys(pools)[id_centro - 1],
      id_unico: `${Object.keys(pools)[id_centro - 1]}-${result.insertId}`,
      id_frontend: `${Object.keys(pools)[id_centro - 1]}-${result.insertId}`
    };

    logger.info(`Usuario ${email} creado en centro ${id_centro}`);
    res.status(201).json(newUsuario);

  } catch (error) {
    logger.error('Error creando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar usuario
app.put('/usuarios/:id', authenticateToken, requireAdmin, [
  body('email').optional().isEmail().normalizeEmail(),
  body('password').optional().isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { email, password, origen_bd } = req.body;

    if (!origen_bd) {
      return res.status(400).json({ error: 'origen_bd requerido' });
    }

    const pool = getPoolByCentroId(origen_bd === 'central' ? 1 : origen_bd === 'guayaquil' ? 2 : 3);

    // Verificar que el usuario existe
    const [existingUsuario] = await pool.query(
      'SELECT * FROM usuarios WHERE id = ?',
      [id]
    );

    if (existingUsuario.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const updateData = {};
    if (email) updateData.email = email;
    if (password) {
      const saltRounds = 10;
      updateData.password_hash = await bcrypt.hash(password, saltRounds);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    const [result] = await pool.query(
      `UPDATE usuarios SET ${Object.keys(updateData).map(key => `${key} = ?`).join(', ')} WHERE id = ?`,
      [...Object.values(updateData), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    logger.info(`Usuario ${id} actualizado en ${origen_bd}`);
    res.json({ message: 'Usuario actualizado exitosamente' });

  } catch (error) {
    logger.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar usuario
app.delete('/usuarios/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { origen_bd } = req.body;

    if (!origen_bd) {
      return res.status(400).json({ error: 'origen_bd requerido' });
    }

    const pool = getPoolByCentroId(origen_bd === 'central' ? 1 : origen_bd === 'guayaquil' ? 2 : 3);

    // Verificar que el usuario existe
    const [existingUsuario] = await pool.query(
      'SELECT * FROM usuarios WHERE id = ?',
      [id]
    );

    if (existingUsuario.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    logger.info(`Usuario ${id} eliminado de ${origen_bd}`);
    res.json({ message: 'Usuario eliminado exitosamente' });

  } catch (error) {
    logger.error('Error eliminando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener médicos por centro para asignación de usuarios
app.get('/medicos-por-centro/:centroId', authenticateToken, requireAdmin, async (req, res) => {
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
      service: 'users-service',
      timestamp: new Date().toISOString(),
      databases: healthChecks
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      service: 'users-service',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  logger.error('Error en users service:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`👤 Users Service iniciado en puerto ${PORT}`);
  logger.info(`🗄️ Bases de datos: ${Object.keys(pools).join(', ')}`);
});

module.exports = app;
