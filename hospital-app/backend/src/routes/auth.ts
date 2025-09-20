import { Router, Request, Response } from "express";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from "../config/db";
import { authenticateToken, requireRole } from "../middlewares/auth";
import emailService from "../services/emailService";

const router = Router();

// Generar token JWT
const generateToken = (user: any) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no configurado');
  }
  
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      rol: user.rol,
      id_centro: user.id_centro,
      id_medico: user.id_medico
    },
    secret,
    { expiresIn: '24h' }
  );
};

// Generar token de recuperación
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Buscar usuario con datos del centro y médico
    const [rows] = await pool.query(`
      SELECT 
        u.*,
        cm.nombre as centro_nombre,
        cm.ciudad as centro_ciudad,
        m.nombres as medico_nombres,
        m.apellidos as medico_apellidos,
        e.nombre as especialidad_nombre
      FROM usuarios u
      LEFT JOIN centros_medicos cm ON u.id_centro = cm.id
      LEFT JOIN medicos m ON u.id_medico = m.id
      LEFT JOIN especialidades e ON m.id_especialidad = e.id
      WHERE u.email = ?
    `, [email]);

    // @ts-ignore
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token
    const token = generateToken(user);

    // Preparar respuesta sin datos sensibles
    const userResponse = {
      id: user.id,
      email: user.email,
      rol: user.rol,
      id_centro: user.id_centro,
      id_medico: user.id_medico,
      centro: {
        id: user.id_centro,
        nombre: user.centro_nombre,
        ciudad: user.centro_ciudad
      },
      medico: user.id_medico ? {
        id: user.id_medico,
        nombres: user.medico_nombres,
        apellidos: user.medico_apellidos,
        especialidad: user.especialidad_nombre
      } : null
    };

    res.json({
      message: 'Login exitoso',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Register (solo para admins)
router.post('/register', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { email, password, rol, id_centro, id_medico } = req.body;

    if (!email || !password || !rol || !id_centro) {
      return res.status(400).json({ error: 'Email, contraseña, rol e id_centro son requeridos' });
    }

    if (!['admin', 'medico'].includes(rol)) {
      return res.status(400).json({ error: 'Rol debe ser admin o medico' });
    }

    // Si es médico, debe tener id_medico
    if (rol === 'medico' && !id_medico) {
      return res.status(400).json({ error: 'Los médicos deben tener un id_medico asociado' });
    }

    // Verificar que el email no exista
    const [existingUser] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    // @ts-ignore
    if (existingUser[0]) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Verificar que el centro existe
    const [centroRows] = await pool.query('SELECT id FROM centros_medicos WHERE id = ?', [id_centro]);
    // @ts-ignore
    if (!centroRows[0]) {
      return res.status(400).json({ error: 'El centro médico no existe' });
    }

    // Si es médico, verificar que el médico existe y pertenece al centro
    if (rol === 'medico') {
      const [medicoRows] = await pool.query(
        'SELECT id FROM medicos WHERE id = ? AND id_centro = ?',
        [id_medico, id_centro]
      );
      // @ts-ignore
      if (!medicoRows[0]) {
        return res.status(400).json({ error: 'El médico no existe o no pertenece al centro' });
      }
    }

    // Hash de la contraseña
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const [result] = await pool.execute(
      'INSERT INTO usuarios (email, password_hash, rol, id_centro, id_medico) VALUES (?, ?, ?, ?, ?)',
      [email, passwordHash, rol, id_centro, rol === 'medico' ? id_medico : null]
    );

    // @ts-ignore
    const userId = result.insertId;

    // Obtener datos del usuario creado
    const [newUserRows] = await pool.query(`
      SELECT 
        u.*,
        cm.nombre as centro_nombre,
        cm.ciudad as centro_ciudad,
        m.nombres as medico_nombres,
        m.apellidos as medico_apellidos,
        e.nombre as especialidad_nombre
      FROM usuarios u
      LEFT JOIN centros_medicos cm ON u.id_centro = cm.id
      LEFT JOIN medicos m ON u.id_medico = m.id
      LEFT JOIN especialidades e ON m.id_especialidad = e.id
      WHERE u.id = ?
    `, [userId]);

    // @ts-ignore
    const newUser = newUserRows[0];

    // Enviar email de bienvenida
    await emailService.sendWelcomeEmail(email, `${newUser.medico_nombres || 'Usuario'} ${newUser.medico_apellidos || ''}`, password);

    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      rol: newUser.rol,
      id_centro: newUser.id_centro,
      id_medico: newUser.id_medico,
      centro: {
        id: newUser.id_centro,
        nombre: newUser.centro_nombre,
        ciudad: newUser.centro_ciudad
      },
      medico: newUser.id_medico ? {
        id: newUser.id_medico,
        nombres: newUser.medico_nombres,
        apellidos: newUser.medico_apellidos,
        especialidad: newUser.especialidad_nombre
      } : null
    };

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: userResponse
    });

  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Solicitar recuperación de contraseña
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email es requerido' });
    }

    // Buscar usuario
    const [rows] = await pool.query(`
      SELECT u.*, m.nombres, m.apellidos 
      FROM usuarios u
      LEFT JOIN medicos m ON u.id_medico = m.id
      WHERE u.email = ?
    `, [email]);

    // @ts-ignore
    const user = rows[0];

    if (!user) {
      // Por seguridad, no revelar si el email existe o no
      return res.json({ message: 'Si el email existe, se enviará un enlace de recuperación' });
    }

    // Generar token de recuperación
    const resetToken = generateResetToken();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hora

    // Guardar token en la base de datos
    await pool.execute(
      'UPDATE usuarios SET reset_token = ?, reset_expires = ? WHERE id = ?',
      [resetToken, resetExpires, user.id]
    );

    // Enviar email
    const userName = user.nombres && user.apellidos 
      ? `${user.nombres} ${user.apellidos}` 
      : 'Usuario';

    await emailService.sendPasswordResetEmail(email, resetToken, userName);

    res.json({ message: 'Si el email existe, se enviará un enlace de recuperación' });

  } catch (error) {
    console.error('Error en forgot-password:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Resetear contraseña
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Buscar usuario con token válido
    const [rows] = await pool.query(
      'SELECT id FROM usuarios WHERE reset_token = ? AND reset_expires > NOW()',
      [token]
    );

    // @ts-ignore
    const user = rows[0];

    if (!user) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    // Hash de la nueva contraseña
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña y limpiar token
    await pool.execute(
      'UPDATE usuarios SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?',
      [passwordHash, user.id]
    );

    res.json({ message: 'Contraseña actualizada exitosamente' });

  } catch (error) {
    console.error('Error en reset-password:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Verificar token de recuperación
router.get('/verify-reset-token/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const [rows] = await pool.query(
      'SELECT id FROM usuarios WHERE reset_token = ? AND reset_expires > NOW()',
      [token]
    );

    // @ts-ignore
    const user = rows[0];

    if (!user) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    res.json({ message: 'Token válido' });

  } catch (error) {
    console.error('Error verificando token:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener perfil del usuario autenticado
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const [rows] = await pool.query(`
      SELECT 
        u.*,
        cm.nombre as centro_nombre,
        cm.ciudad as centro_ciudad,
        m.nombres as medico_nombres,
        m.apellidos as medico_apellidos,
        e.nombre as especialidad_nombre
      FROM usuarios u
      LEFT JOIN centros_medicos cm ON u.id_centro = cm.id
      LEFT JOIN medicos m ON u.id_medico = m.id
      LEFT JOIN especialidades e ON m.id_especialidad = e.id
      WHERE u.id = ?
    `, [userId]);

    // @ts-ignore
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const userResponse = {
      id: user.id,
      email: user.email,
      rol: user.rol,
      id_centro: user.id_centro,
      id_medico: user.id_medico,
      centro: {
        id: user.id_centro,
        nombre: user.centro_nombre,
        ciudad: user.centro_ciudad
      },
      medico: user.id_medico ? {
        id: user.id_medico,
        nombres: user.medico_nombres,
        apellidos: user.medico_apellidos,
        especialidad: user.especialidad_nombre
      } : null
    };

    res.json(userResponse);

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Cambiar contraseña (usuario autenticado)
router.post('/change-password', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Contraseña actual y nueva contraseña son requeridas' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    // Obtener usuario actual
    const [rows] = await pool.query('SELECT password_hash FROM usuarios WHERE id = ?', [userId]);
    // @ts-ignore
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    }

    // Hash de la nueva contraseña
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña
    await pool.execute(
      'UPDATE usuarios SET password_hash = ? WHERE id = ?',
      [passwordHash, userId]
    );

    res.json({ message: 'Contraseña actualizada exitosamente' });

  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
