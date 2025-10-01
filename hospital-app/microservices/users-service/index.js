const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;

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
const dbConfigs = {
  central: {
    host: process.env.DB_HOST || 'mysql-central',
    user: process.env.DB_USER || 'admin_central',
    password: process.env.DB_PASSWORD || 'SuperPasswordCentral123!',
    database: process.env.DB_NAME || 'hospital_central',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
    timezone: '+00:00'
  },
  guayaquil: {
    host: process.env.DB_GUAYAQUIL_HOST || 'mysql-guayaquil',
    user: process.env.DB_GUAYAQUIL_USER || 'admin_guayaquil',
    password: process.env.DB_GUAYAQUIL_PASSWORD || 'SuperPasswordGye123!',
    database: process.env.DB_GUAYAQUIL_NAME || 'hospital_guayaquil',
    port: process.env.DB_GUAYAQUIL_PORT || 3306,
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
    timezone: '+00:00'
  },
  cuenca: {
    host: process.env.DB_CUENCA_HOST || 'mysql-cuenca',
    user: process.env.DB_CUENCA_USER || 'admin_cuenca',
    password: process.env.DB_CUENCA_PASSWORD || 'SuperPasswordCuenca123!',
    database: process.env.DB_CUENCA_NAME || 'hospital_cuenca',
    port: process.env.DB_CUENCA_PORT || 3306,
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
    timezone: '+00:00'
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
      service: 'users-service',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      service: 'users-service',
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

// ===== RUTAS DE USUARIOS =====

// Obtener todos los usuarios de todos los centros
app.get('/usuarios', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const usuarios = [];
    
    // Obtener usuarios de cada centro
    for (const [centro, pool] of Object.entries(pools)) {
      const [rows] = await pool.query(`
        SELECT u.*, m.nombres as medico_nombres, m.apellidos as medico_apellidos, 
               cm.nombre as centro_nombre, cm.ciudad
        FROM usuarios u
        LEFT JOIN medicos m ON m.id = u.id_medico
        LEFT JOIN centros_medicos cm ON cm.id = u.id_centro
        ORDER BY u.id
      `);
      
      // Agregar información de origen
      const usuariosConOrigen = rows.map(usuario => ({
        ...usuario,
        origen_bd: centro,
        id_frontend: `${centro}-${usuario.id}`
      }));
      
      usuarios.push(...usuariosConOrigen);
    }
    
    res.json(usuarios);
  } catch (error) {
    logger.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener usuarios por centro específico
app.get('/usuarios/centro/:centroId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const centroId = parseInt(req.params.centroId);
    const pool = getPoolByCentro(centroId);
    
    const [rows] = await pool.query(`
      SELECT u.*, m.nombres as medico_nombres, m.apellidos as medico_apellidos, 
             cm.nombre as centro_nombre, cm.ciudad
      FROM usuarios u
      LEFT JOIN medicos m ON m.id = u.id_medico
      LEFT JOIN centros_medicos cm ON cm.id = u.id_centro
      WHERE u.id_centro = ?
      ORDER BY u.id
    `, [centroId]);
    
    res.json(rows);
  } catch (error) {
    logger.error('Error obteniendo usuarios por centro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear usuario
app.post('/usuarios', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, password, rol, id_medico, id_centro } = req.body;
    
    if (!email || !password || !rol || !id_centro) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    
    // Validar que el médico pertenezca al centro especificado
    if (id_medico) {
      const pool = getPoolByCentro(id_centro);
      const [medicoRows] = await pool.query(
        'SELECT id FROM medicos WHERE id = ? AND id_centro = ?',
        [id_medico, id_centro]
      );
      
      if (medicoRows.length === 0) {
        return res.status(400).json({ 
          error: 'El médico especificado no pertenece al centro seleccionado' 
        });
      }
    }
    
    // Verificar que el email no exista en ninguna base de datos
    for (const [centro, pool] of Object.entries(pools)) {
      const [existingUser] = await pool.query(
        'SELECT id FROM usuarios WHERE email = ?',
        [email]
      );
      
      if (existingUser.length > 0) {
        return res.status(400).json({ 
          error: 'El email ya está registrado en el sistema' 
        });
      }
    }
    
    const pool = getPoolByCentro(id_centro);
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.execute(`
      INSERT INTO usuarios (email, password_hash, rol, id_medico, id_centro)
      VALUES (?, ?, ?, ?, ?)
    `, [email, hashedPassword, rol, id_medico || null, id_centro]);
    
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      id: result.insertId,
      id_centro
    });
  } catch (error) {
    logger.error('Error creando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar usuario
app.put('/usuarios/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { email, password } = req.body;
    
    if (!email && !password) {
      return res.status(400).json({ error: 'Debe proporcionar email o password para actualizar' });
    }
    
    // Buscar el usuario en todas las bases de datos
    let targetPool = null;
    let foundUser = null;
    
    for (const [centro, pool] of Object.entries(pools)) {
      const [rows] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [userId]);
      if (rows.length > 0) {
        targetPool = pool;
        foundUser = rows[0];
        break;
      }
    }
    
    if (!foundUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const updateFields = [];
    const updateValues = [];
    
    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password_hash = ?');
      updateValues.push(hashedPassword);
    }
    
    updateValues.push(userId);
    
    await targetPool.execute(`
      UPDATE usuarios 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);
    
    res.json({
      message: 'Usuario actualizado exitosamente',
      id: userId
    });
  } catch (error) {
    logger.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar usuario
app.delete('/usuarios/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Buscar el usuario en todas las bases de datos
    let targetPool = null;
    let foundUser = null;
    
    for (const [centro, pool] of Object.entries(pools)) {
      const [rows] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [userId]);
      if (rows.length > 0) {
        targetPool = pool;
        foundUser = rows[0];
        break;
      }
    }
    
    if (!foundUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    await targetPool.execute('DELETE FROM usuarios WHERE id = ?', [userId]);
    
    res.json({
      message: 'Usuario eliminado exitosamente',
      id: userId
    });
  } catch (error) {
    logger.error('Error eliminando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener médicos por centro (para asociar con usuarios)
app.get('/medicos/centro/:centroId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const centroId = parseInt(req.params.centroId);
    const pool = getPoolByCentro(centroId);
    
    const [rows] = await pool.query(`
      SELECT m.id, m.nombres, m.apellidos, m.cedula, m.email,
             e.nombre as especialidad_nombre
      FROM medicos m
      LEFT JOIN especialidades e ON e.id = m.id_especialidad
      WHERE m.id_centro = ?
      ORDER BY m.apellidos, m.nombres
    `, [centroId]);
    
    res.json(rows);
  } catch (error) {
    logger.error('Error obteniendo médicos por centro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
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
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`👥 Users Service iniciado en puerto ${PORT}`);
  logger.info(`🗄️ Bases de datos: Central, Guayaquil, Cuenca`);
});

module.exports = app;