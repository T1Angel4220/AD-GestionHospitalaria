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
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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

// Pool de conexiones
const pool = mysql.createPool(dbConfigs.central);

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

// Rutas de autenticación
app.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Buscar usuario en todas las bases de datos
    const databases = [
      { name: 'central', id: 1, config: dbConfigs.central },
      { name: 'guayaquil', id: 2, config: dbConfigs.guayaquil },
      { name: 'cuenca', id: 3, config: dbConfigs.cuenca }
    ];

    let user = null;
    let userDatabase = null;

    for (const db of databases) {
      try {
        const dbPool = mysql.createPool(db.config);

        const [rows] = await dbPool.query(
          'SELECT * FROM usuarios WHERE email = ?',
          [email]
        );

        if (rows.length > 0) {
          user = rows[0];
          userDatabase = db;
          await dbPool.end();
          break;
        }
        await dbPool.end();
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

    res.json({
      message: 'Autenticación exitosa',
      token,
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol,
        id_centro: userDatabase.id,
        id_medico: user.id_medico
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

    // Verificar si el usuario ya existe en cualquier BD
    const databases = ['central', 'guayaquil', 'cuenca'];
    for (const dbName of databases) {
      try {
        const dbPool = mysql.createPool(dbConfigs[dbName]);

        const [existingUsers] = await dbPool.query(
          'SELECT id FROM usuarios WHERE email = ?',
          [email]
        );

        if (existingUsers.length > 0) {
          await dbPool.end();
          return res.status(400).json({ error: 'El email ya está registrado' });
        }
        await dbPool.end();
      } catch (error) {
        logger.error(`Error verificando usuario en BD ${dbName}:`, error.message);
        continue;
      }
    }

    // Hash de la contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Determinar en qué BD crear el usuario
    const targetDatabase = databases[id_centro - 1];
    const targetPool = mysql.createPool(dbConfigs[targetDatabase]);

    // Crear usuario
    const [result] = await targetPool.query(
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

    logger.info(`Usuario ${email} registrado exitosamente en BD ${targetDatabase}`);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: newUser
    });

    await targetPool.end();

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
    await pool.query('SELECT 1');
    res.json({
      status: 'OK',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Ruta de prueba de base de datos
app.get('/test', async (req, res) => {
  try {
    const connection = await pool.getConnection();
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
