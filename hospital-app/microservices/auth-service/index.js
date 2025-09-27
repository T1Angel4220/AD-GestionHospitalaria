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
app.use(helmet());
app.use(cors());
app.use(express.json());

// Configuración de base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_central',
  port: process.env.DB_PORT || 3306
};

// Pool de conexiones
const pool = mysql.createPool(dbConfig);

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
      { name: 'central', id: 1 },
      { name: 'guayaquil', id: 2 },
      { name: 'cuenca', id: 3 }
    ];

    let user = null;
    let userDatabase = null;

    for (const db of databases) {
      try {
        const dbPool = mysql.createPool({
          ...dbConfig,
          database: `hospital_${db.name}`
        });

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
        const dbPool = mysql.createPool({
          ...dbConfig,
          database: `hospital_${dbName}`
        });

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
    const targetPool = mysql.createPool({
      ...dbConfig,
      database: `hospital_${targetDatabase}`
    });

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

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  logger.error('Error en auth service:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`🔐 Auth Service iniciado en puerto ${PORT}`);
  logger.info(`🗄️ Base de datos: ${dbConfig.database}`);
});

module.exports = app;
