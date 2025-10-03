const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const cors = require('cors');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const winston = require('winston');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/auth.log' })
  ]
});

// Middleware
// app.use(helmet({
//   contentSecurityPolicy: false,
//   crossOriginEmbedderPolicy: false
// }));

// Configuración CORS más permisiva
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Centro-Id'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Manejar peticiones OPTIONS explícitamente
app.options('*', cors());

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

// Pools de conexiones persistentes
const pools = {
  central: mysql.createPool(dbConfigs.central),
  guayaquil: mysql.createPool(dbConfigs.guayaquil),
  cuenca: mysql.createPool(dbConfigs.cuenca)
};

// Middleware de validación
const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
];

const validateRegister = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('rol').isIn(['admin', 'medico']),
  body('id_centro').isInt({ min: 1, max: 3 }),
  body('id_medico').optional().isInt({ min: 1 })
];

// Utilidades
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      rol: user.rol,
      id_centro: user.id_centro,
      id_medico: user.id_medico
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

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

// Función para obtener pool por centro
function getPoolByCentro(centroId) {
  switch (centroId) {
    case 1: return pools.central;
    case 2: return pools.guayaquil;
    case 3: return pools.cuenca;
    default: return pools.central;
  }
}

// Rutas de autenticación
app.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Buscar usuario en todas las bases de datos usando pools persistentes
    const databases = [
      { name: 'central', id: 1, pool: pools.central },
      { name: 'guayaquil', id: 2, pool: pools.guayaquil },
      { name: 'cuenca', id: 3, pool: pools.cuenca }
    ];

    let user = null;
    let userDatabase = null;

    for (const db of databases) {
      try {
        const [rows] = await db.pool.query(
          'SELECT * FROM usuarios WHERE email = ?',
          [email]
        );

        if (rows.length > 0) {
          user = rows[0];
          userDatabase = db;
          break;
        }
      } catch (error) {
        logger.error(`Error consultando BD ${db.name}:`, error.message);
        continue;
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token
    const token = generateToken({
      ...user,
      id_centro: userDatabase.id
    });

    logger.info(`Usuario ${email} autenticado exitosamente desde BD ${userDatabase.name}`);

    // Mapear centros conocidos
    const centros = {
      1: { id: 1, nombre: 'Hospital Central Quito', ciudad: 'Quito' },
      2: { id: 2, nombre: 'Hospital Guayaquil', ciudad: 'Guayaquil' },
      3: { id: 3, nombre: 'Hospital Cuenca', ciudad: 'Cuenca' }
    };

    res.json({
      message: 'Autenticación exitosa',
      token,
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol,
        id_centro: userDatabase.id,
        id_medico: user.id_medico,
        centro: centros[userDatabase.id]
      }
    });

  } catch (error) {
    logger.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/register', validateRegister, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, rol, id_centro, id_medico } = req.body;

    // Verificar si el usuario ya existe en cualquier BD usando pools persistentes
    const databases = [
      { name: 'central', pool: pools.central },
      { name: 'guayaquil', pool: pools.guayaquil },
      { name: 'cuenca', pool: pools.cuenca }
    ];

    for (const db of databases) {
      try {
        const [existingUsers] = await db.pool.query(
          'SELECT id FROM usuarios WHERE email = ?',
          [email]
        );

        if (existingUsers.length > 0) {
          return res.status(400).json({ error: 'El email ya está registrado' });
        }
      } catch (error) {
        logger.error(`Error verificando usuario en BD ${db.name}:`, error.message);
        continue;
      }
    }

    // Validar que el médico exista si se proporciona
    if (id_medico) {
      const targetDb = databases[id_centro - 1];
      try {
        const [medico] = await targetDb.pool.query(
          'SELECT id FROM medicos WHERE id = ? AND id_centro = ?',
          [id_medico, id_centro]
        );
        if (medico.length === 0) {
          return res.status(400).json({ error: 'El médico especificado no existe en el centro seleccionado' });
        }
      } catch (error) {
        logger.error('Error validando médico:', error.message);
        return res.status(500).json({ error: 'Error validando médico' });
      }
    }

    // Hash de la contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Determinar en qué BD crear el usuario
    const targetDatabase = databases[id_centro - 1];

    // Crear usuario
    const [result] = await targetDatabase.pool.query(
      'INSERT INTO usuarios (email, password_hash, rol, id_centro, id_medico) VALUES (?, ?, ?, ?, ?)',
      [email, passwordHash, rol, id_centro, id_medico]
    );

    const newUser = {
      id: result.insertId,
      email,
      rol,
      id_centro,
      id_medico
    };

    // Generar token
    const token = generateToken(newUser);

    logger.info(`Usuario ${email} registrado exitosamente en BD ${targetDatabase.name}`);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: newUser
    });

  } catch (error) {
    logger.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    res.json({
      valid: true,
      user: decoded
    });

  } catch (error) {
    res.status(401).json({
      valid: false,
      error: 'Token inválido'
    });
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
      service: 'auth-service',
      timestamp: new Date().toISOString(),
      databases: healthChecks
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Ruta de prueba de base de datos
app.get('/test', async (req, res) => {
  try {
    const connection = await pools.central.getConnection();
    await connection.ping();
    connection.release();
    
    res.json({ 
      status: 'OK',
      message: 'Conexión a base de datos exitosa',
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

// =========================
// ENDPOINTS CRUD PARA USUARIOS
// =========================

// Obtener todos los usuarios
app.get('/usuarios', authenticateToken, async (req, res) => {
  try {
    // Obtener usuarios de todas las bases de datos
    const databases = [
      { name: 'central', id: 1, pool: pools.central },
      { name: 'guayaquil', id: 2, pool: pools.guayaquil },
      { name: 'cuenca', id: 3, pool: pools.cuenca }
    ];

    let allUsuarios = [];

    for (const db of databases) {
      try {
        const [usuarios] = await db.pool.execute(`
          SELECT u.id, u.email, u.rol, u.id_centro, u.id_medico, u.created_at,
                 c.nombre as centro_nombre,
                 m.nombres as medico_nombres, m.apellidos as medico_apellidos,
                 '${db.name}' as origen_bd,
                 u.id as id_frontend
          FROM usuarios u
          LEFT JOIN centros_medicos c ON u.id_centro = c.id
          LEFT JOIN medicos m ON u.id_medico = m.id
          ORDER BY u.created_at DESC
        `);
        
        allUsuarios = allUsuarios.concat(usuarios);
      } catch (error) {
        logger.error(`Error obteniendo usuarios de BD ${db.name}:`, error);
        continue;
      }
    }
    
    res.json(allUsuarios);
  } catch (error) {
    logger.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener usuario por ID
app.get('/usuarios/:id', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const pool = getPoolByCentro(req.user.id_centro);
    
    const [usuarios] = await pool.execute(`
      SELECT u.id, u.email, u.rol, u.id_centro, u.id_medico, u.created_at,
             c.nombre as centro_nombre,
             m.nombres as medico_nombres, m.apellidos as medico_apellidos
      FROM usuarios u
      LEFT JOIN centros_medicos c ON u.id_centro = c.id
      LEFT JOIN medicos m ON u.id_medico = m.id
      WHERE u.id = ?
    `, [userId]);
    
    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(usuarios[0]);
  } catch (error) {
    logger.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear usuario
app.post('/usuarios', authenticateToken, async (req, res) => {
  try {
    const { email, password, rol, id_centro, id_medico } = req.body;
    
    console.log('🔄 [CREATE USER] Datos recibidos:', {
      email,
      password: password ? '[PROVIDED]' : '[MISSING]',
      rol,
      id_centro,
      id_medico,
      emailValido: !!email,
      passwordValido: !!password,
      rolValido: !!rol,
      centroValido: !!id_centro
    });
    
    console.log('🔄 [CREATE USER] Request body completo:', req.body);
    console.log('🔄 [CREATE USER] Request headers:', req.headers);
    console.log('🔄 [CREATE USER] Content-Type:', req.headers['content-type']);
    
    if (!email || !password || !rol || !id_centro) {
      return res.status(400).json({ error: 'Email, password, rol e id_centro son obligatorios' });
    }
    
    if (rol === 'medico' && !id_medico) {
      return res.status(400).json({ error: 'El id_medico es obligatorio para rol médico' });
    }
    
    
    // Validar rol
    if (!['admin', 'medico'].includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }
    
    // Para usuarios médicos, id_medico es requerido
    if (rol === 'medico' && !id_medico) {
      console.log('❌ [CREATE USER] Médico sin id_medico');
      return res.status(400).json({ error: 'Los usuarios médicos deben tener un médico asociado' });
    }
    
    // Para usuarios admin, id_medico debe ser null
    if (rol === 'admin' && id_medico) {
      console.log('❌ [CREATE USER] Admin con id_medico (no permitido)');
      return res.status(400).json({ error: 'Los usuarios administradores no pueden tener médico asociado' });
    }
    
    // Verificar si el usuario ya existe en cualquier BD usando pools persistentes
    const databases = [
      { name: 'central', pool: pools.central },
      { name: 'guayaquil', pool: pools.guayaquil },
      { name: 'cuenca', pool: pools.cuenca }
    ];

    for (const db of databases) {
      try {
        const [existingUsers] = await db.pool.query(
          'SELECT id FROM usuarios WHERE email = ?',
          [email]
        );

        if (existingUsers.length > 0) {
          console.log(`❌ [CREATE USER] Email ya existe en BD ${db.name}`);
          return res.status(400).json({ error: 'El email ya está registrado' });
        }
      } catch (error) {
        logger.error(`Error verificando usuario en BD ${db.name}:`, error.message);
        continue;
      }
    }
    
    // Validar que el médico exista si se proporciona
    if (rol === 'medico' && id_medico) {
      const targetDb = databases[id_centro - 1];
      try {
        const [medico] = await targetDb.pool.query(
          'SELECT id FROM medicos WHERE id = ? AND id_centro = ?',
          [id_medico, id_centro]
        );
        if (medico.length === 0) {
          console.log('❌ [CREATE USER] Médico no existe en el centro');
          return res.status(400).json({ error: 'El médico especificado no existe en el centro seleccionado' });
        }
      } catch (error) {
        logger.error('Error validando médico:', error.message);
        return res.status(500).json({ error: 'Error validando médico' });
      }
    }
    
    const pool = getPoolByCentro(id_centro);
    const passwordHash = await bcrypt.hash(password, 10);
    
    const [result] = await pool.execute(
      'INSERT INTO usuarios (email, password_hash, rol, id_centro, id_medico) VALUES (?, ?, ?, ?, ?)',
      [email, passwordHash, rol, id_centro, rol === 'medico' ? id_medico : null]
    );
    
    console.log('✅ [CREATE USER] Usuario creado exitosamente:', result.insertId);
    
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      id: result.insertId
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    logger.error('Error creando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar usuario
app.put('/usuarios/:id', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { email, rol, id_centro, id_medico } = req.body;
    
    const pool = getPoolByCentro(req.user.id_centro);
    
    // Verificar que el usuario existe
    const [usuarios] = await pool.execute('SELECT * FROM usuarios WHERE id = ?', [userId]);
    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Actualizar usuario
    await pool.execute(
      'UPDATE usuarios SET email = ?, rol = ?, id_centro = ?, id_medico = ? WHERE id = ?',
      [email, rol, id_centro, id_medico, userId]
    );
    
    res.json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    logger.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar usuario
app.delete('/usuarios/:id', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const pool = getPoolByCentro(req.user.id_centro);
    
    // Verificar que el usuario existe
    const [usuarios] = await pool.execute('SELECT * FROM usuarios WHERE id = ?', [userId]);
    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // No permitir eliminar el usuario actual
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }
    
    await pool.execute('DELETE FROM usuarios WHERE id = ?', [userId]);
    
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    logger.error('Error eliminando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  logger.error('Error en auth service:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🔐 Auth Service iniciado en puerto ${PORT}`);
  logger.info(`🗄️ Base de datos: ${dbConfigs.central.database}`);
});

module.exports = app;
