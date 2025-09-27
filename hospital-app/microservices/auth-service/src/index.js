const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
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
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login por IP
  message: 'Demasiados intentos de login, intenta de nuevo más tarde.'
});

// Configuración de base de datos
const createConnection = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_central',
      port: process.env.DB_PORT || 3306
    });
    return connection;
  } catch (error) {
    logger.error('Error conectando a la base de datos:', error);
    throw error;
  }
};

// Esquemas de validación
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  rol: Joi.string().valid('admin', 'medico').required(),
  id_centro: Joi.number().integer().positive().required(),
  id_medico: Joi.number().integer().positive().optional()
});

// Función para buscar usuario en todas las bases de datos
const findUserInAllDatabases = async (email) => {
  const databases = [
    { name: 'central', url: process.env.CENTRAL_DB_URL },
    { name: 'guayaquil', url: process.env.GUAYAQUIL_DB_URL },
    { name: 'cuenca', url: process.env.CUENCA_DB_URL }
  ];

  for (const db of databases) {
    try {
      if (!db.url) continue;
      
      const connection = await mysql.createConnection(db.url);
      const [users] = await connection.query(
        'SELECT * FROM usuarios WHERE email = ?',
        [email]
      );
      await connection.end();

      if (users.length > 0) {
        return { ...users[0], database: db.name };
      }
    } catch (error) {
      logger.warn(`Error conectando a ${db.name}:`, error.message);
    }
  }

  return null;
};

// POST /login
app.post('/login', loginLimiter, async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = value;

    // Buscar usuario en todas las bases de datos
    const user = await findUserInAllDatabases(email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        rol: user.rol,
        id_centro: user.id_centro,
        id_medico: user.id_medico,
        database: user.database
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    logger.info(`Login exitoso para usuario: ${email} desde ${user.database}`);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol,
        id_centro: user.id_centro,
        id_medico: user.id_medico,
        database: user.database
      }
    });
  } catch (error) {
    logger.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /register
app.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password, rol, id_centro, id_medico } = value;

    // Verificar si el usuario ya existe
    const existingUser = await findUserInAllDatabases(email);
    if (existingUser) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    
    // Determinar qué base de datos usar según el centro
    let dbUrl;
    switch (id_centro) {
      case 1:
        dbUrl = `mysql://${process.env.CENTRAL_DB_USER}:${process.env.CENTRAL_DB_PASSWORD}@${process.env.CENTRAL_DB_HOST}:${process.env.CENTRAL_DB_PORT}/${process.env.CENTRAL_DB_NAME}`;
        break;
      case 2:
        dbUrl = `mysql://${process.env.GUAYAQUIL_DB_USER}:${process.env.GUAYAQUIL_DB_PASSWORD}@${process.env.GUAYAQUIL_DB_HOST}:${process.env.GUAYAQUIL_DB_PORT}/${process.env.GUAYAQUIL_DB_NAME}`;
        break;
      case 3:
        dbUrl = `mysql://${process.env.CUENCA_DB_USER}:${process.env.CUENCA_DB_PASSWORD}@${process.env.CUENCA_DB_HOST}:${process.env.CUENCA_DB_PORT}/${process.env.CUENCA_DB_NAME}`;
        break;
      default:
        return res.status(400).json({ error: 'Centro inválido' });
    }
    
    if (!dbUrl) {
      return res.status(500).json({ error: 'Base de datos no configurada para este centro' });
    }
    

    // Conectar a la base de datos correspondiente
    const connection = await mysql.createConnection(dbUrl);

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const [result] = await connection.execute(
      'INSERT INTO usuarios (email, password_hash, rol, id_centro, id_medico) VALUES (?, ?, ?, ?, ?)',
      [email, passwordHash, rol, id_centro, id_medico || null]
    );

    await connection.end();

    logger.info(`Usuario registrado: ${email} en centro ${id_centro}`);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      id: result.insertId
    });
  } catch (error) {
    logger.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' + error.message+ " " + error.stack });
  }
});

// POST /verify-token
app.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'auth-service',
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  logger.error('Error en auth-service:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  logger.info(`Auth Service ejecutándose en puerto ${PORT}`);
  console.log(`🔐 Auth Service ejecutándose en puerto ${PORT}`);
});

module.exports = app;
