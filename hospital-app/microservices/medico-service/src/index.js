const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const Joi = require('joi');
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
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de bases de datos
const databases = {
  central: {
    host: process.env.CENTRAL_DB_HOST || 'localhost',
    user: process.env.CENTRAL_DB_USER || 'root',
    password: process.env.CENTRAL_DB_PASSWORD || '',
    database: process.env.CENTRAL_DB_NAME || 'hospital_central',
    port: process.env.CENTRAL_DB_PORT || 3306
  },
  guayaquil: {
    host: process.env.GUAYAQUIL_DB_HOST || 'localhost',
    user: process.env.GUAYAQUIL_DB_USER || 'root',
    password: process.env.GUAYAQUIL_DB_PASSWORD || '',
    database: process.env.GUAYAQUIL_DB_NAME || 'hospital_guayaquil',
    port: process.env.GUAYAQUIL_DB_PORT || 3306
  },
  cuenca: {
    host: process.env.CUENCA_DB_HOST || 'localhost',
    user: process.env.CUENCA_DB_USER || 'root',
    password: process.env.CUENCA_DB_PASSWORD || '',
    database: process.env.CUENCA_DB_NAME || 'hospital_cuenca',
    port: process.env.CUENCA_DB_PORT || 3306
  }
};

// Función para obtener conexión a base de datos
const getConnection = async (dbName) => {
  const config = databases[dbName];
  if (!config) {
    throw new Error(`Base de datos ${dbName} no configurada`);
  }
  return await mysql.createConnection(config);
};

// Función para obtener la base de datos del centro del médico
const getMedicoDatabase = (centroId) => {
  switch (centroId) {
    case 1: return 'central';
    case 2: return 'guayaquil';
    case 3: return 'cuenca';
    default: throw new Error('Centro no válido');
  }
};

// Middleware para extraer información del usuario del token
const extractUserInfo = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.user = decoded;
    } catch (error) {
      logger.warn('Token inválido:', error.message);
    }
  }
  next();
};

// Middleware para verificar que es médico
const requireMedico = (req, res, next) => {
  if (req.user?.rol !== 'medico') {
    return res.status(403).json({ error: 'Se requieren permisos de médico' });
  }
  next();
};

// =========================
// CONSULTAS MÉDICAS
// =========================

// GET /medico/consultas - Listar consultas del médico
app.get('/medico/consultas', extractUserInfo, requireMedico, async (req, res) => {
  try {
    const { id_medico, id_centro } = req.user;
    const { estado, fecha_desde, fecha_hasta } = req.query;
    
    const dbName = getMedicoDatabase(id_centro);
    const connection = await getConnection(dbName);
    
    let query = `
      SELECT 
        c.id,
        c.id_medico,
        c.paciente_nombre,
        c.paciente_apellido,
        c.id_paciente,
        c.fecha,
        c.motivo,
        c.diagnostico,
        c.tratamiento,
        c.estado,
        c.duracion_minutos,
        c.created_at,
        m.nombres as medico_nombres,
        m.apellidos as medico_apellidos,
        e.nombre as especialidad_nombre,
        p.cedula,
        p.telefono,
        p.email,
        p.fecha_nacimiento,
        p.genero
      FROM consultas c
      LEFT JOIN medicos m ON c.id_medico = m.id
      LEFT JOIN especialidades e ON m.id_especialidad = e.id
      LEFT JOIN pacientes p ON c.id_paciente = p.id
      WHERE c.id_medico = ?
    `;
    
    const params = [id_medico];
    
    if (estado) {
      query += ' AND c.estado = ?';
      params.push(estado);
    }
    
    if (fecha_desde) {
      query += ' AND c.fecha >= ?';
      params.push(fecha_desde);
    }
    
    if (fecha_hasta) {
      query += ' AND c.fecha <= ?';
      params.push(fecha_hasta);
    }
    
    query += ' ORDER BY c.fecha DESC';
    
    const [consultas] = await connection.query(query, params);
    await connection.end();
    
    res.json(consultas);
  } catch (error) {
    logger.error('Error listando consultas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /medico/consultas - Crear consulta
app.post('/medico/consultas', extractUserInfo, requireMedico, async (req, res) => {
  try {
    const { id_medico, id_centro } = req.user;
    const { 
      paciente_nombre, 
      paciente_apellido, 
      id_paciente, 
      fecha, 
      motivo, 
      diagnostico, 
      tratamiento, 
      estado = 'pendiente',
      duracion_minutos 
    } = req.body;

    // Validaciones
    if (!paciente_nombre || !paciente_apellido || !fecha) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const dbName = getMedicoDatabase(id_centro);
    const connection = await getConnection(dbName);

    // Crear consulta
    const [result] = await connection.execute(`
      INSERT INTO consultas (
        id_medico, paciente_nombre, paciente_apellido, id_paciente, 
        fecha, motivo, diagnostico, tratamiento, estado, duracion_minutos
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id_medico, paciente_nombre.trim(), paciente_apellido.trim(), 
      id_paciente || null, fecha, motivo || null, diagnostico || null, 
      tratamiento || null, estado, duracion_minutos || null
    ]);

    await connection.end();

    logger.info(`Consulta creada por médico ${id_medico}: ${paciente_nombre} ${paciente_apellido}`);

    res.status(201).json({
      id: result.insertId,
      id_medico: id_medico,
      paciente_nombre: paciente_nombre.trim(),
      paciente_apellido: paciente_apellido.trim(),
      id_paciente: id_paciente || null,
      fecha: fecha,
      motivo: motivo || null,
      diagnostico: diagnostico || null,
      tratamiento: tratamiento || null,
      estado: estado,
      duracion_minutos: duracion_minutos || null
    });
  } catch (error) {
    logger.error('Error creando consulta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /medico/consultas/:id - Actualizar consulta
app.put('/medico/consultas/:id', extractUserInfo, requireMedico, async (req, res) => {
  try {
    const { id_medico, id_centro } = req.user;
    const consultaId = req.params.id;
    const { 
      paciente_nombre, 
      paciente_apellido, 
      id_paciente, 
      fecha, 
      motivo, 
      diagnostico, 
      tratamiento, 
      estado,
      duracion_minutos 
    } = req.body;

    const dbName = getMedicoDatabase(id_centro);
    const connection = await getConnection(dbName);

    // Verificar que la consulta pertenece al médico
    const [existingConsulta] = await connection.query(
      'SELECT id FROM consultas WHERE id = ? AND id_medico = ?',
      [consultaId, id_medico]
    );

    if (existingConsulta.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }

    // Actualizar consulta
    const [result] = await connection.execute(`
      UPDATE consultas SET 
        paciente_nombre = ?, paciente_apellido = ?, id_paciente = ?, 
        fecha = ?, motivo = ?, diagnostico = ?, tratamiento = ?, 
        estado = ?, duracion_minutos = ?
      WHERE id = ? AND id_medico = ?
    `, [
      paciente_nombre?.trim(), paciente_apellido?.trim(), id_paciente,
      fecha, motivo, diagnostico, tratamiento, estado, duracion_minutos,
      consultaId, id_medico
    ]);

    await connection.end();

    logger.info(`Consulta ${consultaId} actualizada por médico ${id_medico}`);

    res.json({ message: 'Consulta actualizada correctamente' });
  } catch (error) {
    logger.error('Error actualizando consulta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /medico/consultas/:id - Eliminar consulta
app.delete('/medico/consultas/:id', extractUserInfo, requireMedico, async (req, res) => {
  try {
    const { id_medico, id_centro } = req.user;
    const consultaId = req.params.id;

    const dbName = getMedicoDatabase(id_centro);
    const connection = await getConnection(dbName);

    // Verificar que la consulta pertenece al médico
    const [existingConsulta] = await connection.query(
      'SELECT id FROM consultas WHERE id = ? AND id_medico = ?',
      [consultaId, id_medico]
    );

    if (existingConsulta.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }

    // Eliminar consulta
    await connection.execute(
      'DELETE FROM consultas WHERE id = ? AND id_medico = ?',
      [consultaId, id_medico]
    );

    await connection.end();

    logger.info(`Consulta ${consultaId} eliminada por médico ${id_medico}`);

    res.json({ message: 'Consulta eliminada correctamente' });
  } catch (error) {
    logger.error('Error eliminando consulta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =========================
// PACIENTES (Vista limitada)
// =========================

// GET /medico/pacientes - Listar pacientes del centro
app.get('/medico/pacientes', extractUserInfo, requireMedico, async (req, res) => {
  try {
    const { id_centro } = req.user;
    const { search } = req.query;
    
    const dbName = getMedicoDatabase(id_centro);
    const connection = await getConnection(dbName);
    
    let query = `
      SELECT 
        p.id,
        p.nombres,
        p.apellidos,
        p.cedula,
        p.telefono,
        p.email,
        p.fecha_nacimiento,
        p.genero,
        p.direccion,
        p.id_centro,
        c.nombre as centro_nombre,
        c.ciudad as centro_ciudad
      FROM pacientes p
      LEFT JOIN centros_medicos c ON p.id_centro = c.id
      WHERE p.id_centro = ?
    `;
    
    const params = [id_centro];
    
    if (search) {
      query += ' AND (p.nombres LIKE ? OR p.apellidos LIKE ? OR p.cedula LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY p.nombres ASC';
    
    const [pacientes] = await connection.query(query, params);
    await connection.end();
    
    res.json(pacientes);
  } catch (error) {
    logger.error('Error listando pacientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =========================
// PERFIL DEL MÉDICO
// =========================

// GET /medico/perfil - Obtener perfil del médico
app.get('/medico/perfil', extractUserInfo, requireMedico, async (req, res) => {
  try {
    const { id_medico, id_centro } = req.user;
    
    const dbName = getMedicoDatabase(id_centro);
    const connection = await getConnection(dbName);
    
    const [medicos] = await connection.query(`
      SELECT 
        m.id,
        m.nombres,
        m.apellidos,
        m.id_especialidad,
        m.id_centro,
        e.nombre as especialidad_nombre,
        c.nombre as centro_nombre,
        c.ciudad as centro_ciudad,
        c.direccion as centro_direccion,
        c.telefono as centro_telefono
      FROM medicos m
      LEFT JOIN especialidades e ON m.id_especialidad = e.id
      LEFT JOIN centros_medicos c ON m.id_centro = c.id
      WHERE m.id = ?
    `, [id_medico]);
    
    await connection.end();
    
    if (medicos.length === 0) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }
    
    res.json(medicos[0]);
  } catch (error) {
    logger.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /medico/perfil - Actualizar perfil del médico
app.put('/medico/perfil', extractUserInfo, requireMedico, async (req, res) => {
  try {
    const { id_medico, id_centro } = req.user;
    const { nombres, apellidos } = req.body;

    if (!nombres || !apellidos) {
      return res.status(400).json({ error: 'Nombres y apellidos son requeridos' });
    }

    const dbName = getMedicoDatabase(id_centro);
    const connection = await getConnection(dbName);

    // Actualizar perfil
    const [result] = await connection.execute(`
      UPDATE medicos SET nombres = ?, apellidos = ? WHERE id = ?
    `, [nombres.trim(), apellidos.trim(), id_medico]);

    await connection.end();

    logger.info(`Perfil actualizado para médico ${id_medico}`);

    res.json({ message: 'Perfil actualizado correctamente' });
  } catch (error) {
    logger.error('Error actualizando perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =========================
// CALENDARIO
// =========================

// GET /medico/calendario - Obtener consultas para calendario
app.get('/medico/calendario', extractUserInfo, requireMedico, async (req, res) => {
  try {
    const { id_medico, id_centro } = req.user;
    const { fecha_desde, fecha_hasta } = req.query;
    
    const dbName = getMedicoDatabase(id_centro);
    const connection = await getConnection(dbName);
    
    let query = `
      SELECT 
        c.id,
        c.paciente_nombre,
        c.paciente_apellido,
        c.fecha,
        c.estado,
        c.motivo,
        c.duracion_minutos,
        p.cedula,
        p.telefono,
        p.email
      FROM consultas c
      LEFT JOIN pacientes p ON c.id_paciente = p.id
      WHERE c.id_medico = ?
    `;
    
    const params = [id_medico];
    
    if (fecha_desde) {
      query += ' AND c.fecha >= ?';
      params.push(fecha_desde);
    }
    
    if (fecha_hasta) {
      query += ' AND c.fecha <= ?';
      params.push(fecha_hasta);
    }
    
    query += ' ORDER BY c.fecha ASC';
    
    const [consultas] = await connection.query(query, params);
    await connection.end();
    
    // Formatear para calendario
    const eventos = consultas.map(consulta => ({
      id: consulta.id,
      title: `${consulta.paciente_nombre} ${consulta.paciente_apellido}`,
      start: consulta.fecha,
      end: consulta.fecha,
      status: consulta.estado,
      motivo: consulta.motivo,
      duracion: consulta.duracion_minutos,
      paciente: {
        cedula: consulta.cedula,
        telefono: consulta.telefono,
        email: consulta.email
      }
    }));
    
    res.json(eventos);
  } catch (error) {
    logger.error('Error obteniendo calendario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =========================
// ESTADÍSTICAS DEL MÉDICO
// =========================

// GET /medico/estadisticas - Estadísticas del médico
app.get('/medico/estadisticas', extractUserInfo, requireMedico, async (req, res) => {
  try {
    const { id_medico, id_centro } = req.user;
    const { fecha_desde, fecha_hasta } = req.query;
    
    const dbName = getMedicoDatabase(id_centro);
    const connection = await getConnection(dbName);
    
    let whereClause = 'WHERE id_medico = ?';
    const params = [id_medico];
    
    if (fecha_desde && fecha_hasta) {
      whereClause += ' AND fecha BETWEEN ? AND ?';
      params.push(fecha_desde, fecha_hasta);
    }
    
    // Estadísticas generales
    const [estadisticas] = await connection.query(`
      SELECT 
        COUNT(*) as total_consultas,
        SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END) as consultas_completadas,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as consultas_pendientes,
        SUM(CASE WHEN estado = 'programada' THEN 1 ELSE 0 END) as consultas_programadas,
        SUM(CASE WHEN estado = 'cancelada' THEN 1 ELSE 0 END) as consultas_canceladas,
        AVG(duracion_minutos) as duracion_promedio,
        COUNT(DISTINCT id_paciente) as pacientes_unicos
      FROM consultas 
      ${whereClause}
    `, params);
    
    // Consultas por mes
    const [consultasPorMes] = await connection.query(`
      SELECT 
        DATE_FORMAT(fecha, '%Y-%m') as mes,
        COUNT(*) as total
      FROM consultas 
      ${whereClause}
      GROUP BY DATE_FORMAT(fecha, '%Y-%m')
      ORDER BY mes DESC
      LIMIT 12
    `, params);
    
    await connection.end();
    
    res.json({
      generales: estadisticas[0],
      por_mes: consultasPorMes
    });
  } catch (error) {
    logger.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'medico-service',
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  logger.error('Error en medico-service:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  logger.info(`Medico Service ejecutándose en puerto ${PORT}`);
  console.log(`👨‍⚕️ Medico Service ejecutándose en puerto ${PORT}`);
});

module.exports = app;
