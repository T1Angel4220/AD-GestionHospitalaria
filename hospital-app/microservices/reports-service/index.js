const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
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
    new winston.transports.File({ filename: 'logs/reports.log' })
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

// Utilidades
const getPoolByCentroId = (centroId) => {
  switch (centroId) {
    case 1: return pools.central;
    case 2: return pools.guayaquil;
    case 3: return pools.cuenca;
    default: throw new Error(`Centro ID ${centroId} no válido`);
  }
};

const isAdmin = (req) => {
  return req.user && req.user.rol === 'admin';
};

// =========================
// RUTAS DE REPORTES
// =========================

// Resumen de consultas
app.get('/consultas', authenticateToken, async (req, res) => {
  try {
    const { desde, hasta, q, centroId } = req.query;
    const adminUser = isAdmin(req);

    // Si es admin y hay centroId, consultar solo esa BD
    if (adminUser && centroId) {
      const pool = getPoolByCentroId(parseInt(centroId));
      
      let sql = `
        SELECT
          m.id, m.id AS medico_id, m.nombres, m.apellidos, e.nombre AS especialidad,
          cm.nombre AS centro_medico, cm.ciudad AS centro_ciudad, m.id_centro AS medico_centro_id,
          COUNT(CASE WHEN c.id IS NOT NULL THEN c.id END) AS total_consultas,
          COUNT(DISTINCT CASE WHEN c.id IS NOT NULL AND c.id_paciente IS NOT NULL THEN c.id_paciente ELSE CASE WHEN c.id IS NOT NULL THEN CONCAT(c.paciente_nombre, '|', c.paciente_apellido) END END) AS pacientes_unicos,
          MIN(CASE WHEN c.id IS NOT NULL THEN c.fecha END) AS primera_consulta,
          MAX(CASE WHEN c.id IS NOT NULL THEN c.fecha END) AS ultima_consulta
        FROM medicos m
        INNER JOIN especialidades e ON e.id = m.id_especialidad
        INNER JOIN centros_medicos cm ON cm.id = m.id_centro
        LEFT JOIN consultas c ON c.id_medico = m.id AND c.id_centro = ?
        WHERE m.id_centro = ? AND EXISTS (
          SELECT 1 FROM consultas c2 
          WHERE c2.id_medico = m.id AND c2.id_centro = ?
        )
        GROUP BY m.id, m.nombres, m.apellidos, e.nombre, cm.nombre, cm.ciudad, m.id_centro
        ORDER BY total_consultas DESC, m.apellidos ASC, m.nombres ASC
      `;

      const [reports] = await pool.query(sql, [centroId, centroId, centroId]);
      return res.json(reports);
    }

    // Si es médico, obtener solo sus consultas
    if (!adminUser) {
      const pool = getPoolByCentroId(req.user.id_centro);
      
      let sql = `
        SELECT
          m.id, m.id AS medico_id, m.nombres, m.apellidos, e.nombre AS especialidad,
          cm.nombre AS centro_medico, cm.ciudad AS centro_ciudad, m.id_centro AS medico_centro_id,
          COUNT(CASE WHEN c.id IS NOT NULL THEN c.id END) AS total_consultas,
          COUNT(DISTINCT CASE WHEN c.id IS NOT NULL AND c.id_paciente IS NOT NULL THEN c.id_paciente ELSE CASE WHEN c.id IS NOT NULL THEN CONCAT(c.paciente_nombre, '|', c.paciente_apellido) END END) AS pacientes_unicos,
          MIN(CASE WHEN c.id IS NOT NULL THEN c.fecha END) AS primera_consulta,
          MAX(CASE WHEN c.id IS NOT NULL THEN c.fecha END) AS ultima_consulta
        FROM medicos m
        INNER JOIN especialidades e ON e.id = m.id_especialidad
        INNER JOIN centros_medicos cm ON cm.id = m.id_centro
        LEFT JOIN consultas c ON c.id_medico = m.id AND c.id_centro = ?
        WHERE m.id = ?
        GROUP BY m.id, m.nombres, m.apellidos, e.nombre, cm.nombre, cm.ciudad, m.id_centro
        ORDER BY total_consultas DESC, m.apellidos ASC, m.nombres ASC
      `;

      const [reports] = await pool.query(sql, [req.user.id_centro, req.user.id_medico]);
      return res.json(reports);
    }

    // Si es admin sin centroId, obtener de todas las BDs
    const allReports = [];
    for (const [dbName, pool] of Object.entries(pools)) {
      try {
        const [reports] = await pool.query(`
          SELECT
            m.id, m.id AS medico_id, m.nombres, m.apellidos, e.nombre AS especialidad,
            cm.nombre AS centro_medico, cm.ciudad AS centro_ciudad, m.id_centro AS medico_centro_id,
            COUNT(CASE WHEN c.id IS NOT NULL THEN c.id END) AS total_consultas,
            COUNT(DISTINCT CASE WHEN c.id IS NOT NULL AND c.id_paciente IS NOT NULL THEN c.id_paciente ELSE CASE WHEN c.id IS NOT NULL THEN CONCAT(c.paciente_nombre, '|', c.paciente_apellido) END END) AS pacientes_unicos,
            MIN(CASE WHEN c.id IS NOT NULL THEN c.fecha END) AS primera_consulta,
            MAX(CASE WHEN c.id IS NOT NULL THEN c.fecha END) AS ultima_consulta
          FROM medicos m
          INNER JOIN especialidades e ON e.id = m.id_especialidad
          INNER JOIN centros_medicos cm ON cm.id = m.id_centro
          LEFT JOIN consultas c ON c.id_medico = m.id AND c.id_centro = m.id_centro
          WHERE EXISTS (
            SELECT 1 FROM consultas c2 
            WHERE c2.id_medico = m.id AND c2.id_centro = m.id_centro
          )
          GROUP BY m.id, m.nombres, m.apellidos, e.nombre, cm.nombre, cm.ciudad, m.id_centro
          ORDER BY total_consultas DESC, m.apellidos ASC, m.nombres ASC
        `);
        
        allReports.push(...reports);
      } catch (error) {
        logger.error(`Error obteniendo reportes de ${dbName}:`, error.message);
      }
    }

    res.json(allReports);

  } catch (error) {
    logger.error('Error obteniendo resumen de consultas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Estadísticas generales
app.get('/estadisticas', authenticateToken, async (req, res) => {
  try {
    const { desde, hasta, centroId } = req.query;
    const adminUser = isAdmin(req);

    // Si es admin y hay centroId, consultar solo esa BD
    if (adminUser && centroId) {
      const pool = getPoolByCentroId(parseInt(centroId));
      
      let sql = `
        SELECT
          (SELECT COUNT(*) FROM medicos WHERE id_centro = ?) as total_medicos,
          (SELECT COUNT(*) FROM pacientes WHERE id_centro = ?) as total_pacientes,
          (SELECT COUNT(*) FROM empleados WHERE id_centro = ?) as total_empleados
      `;

      if (desde && hasta) {
        const fechaInicio = `${desde} 00:00:00`;
        const fechaFin = `${hasta} 23:59:59`;
        
        sql += `,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = ? AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as total_consultas,
          (SELECT COUNT(DISTINCT id_paciente) FROM consultas WHERE id_centro = ? AND id_paciente IS NOT NULL AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as pacientes_con_consultas,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = ? AND estado = 'pendiente' AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as consultas_pendientes,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = ? AND estado = 'programada' AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as consultas_programadas,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = ? AND estado = 'completada' AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as consultas_completadas,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = ? AND estado = 'cancelada' AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as consultas_canceladas,
          (SELECT AVG(duracion_minutos) FROM consultas WHERE id_centro = ? AND duracion_minutos > 0 AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as duracion_promedio_minutos
        `;
      } else {
        sql += `,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = ?) as total_consultas,
          (SELECT COUNT(DISTINCT id_paciente) FROM consultas WHERE id_centro = ? AND id_paciente IS NOT NULL) as pacientes_con_consultas,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = ? AND estado = 'pendiente') as consultas_pendientes,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = ? AND estado = 'programada') as consultas_programadas,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = ? AND estado = 'completada') as consultas_completadas,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = ? AND estado = 'cancelada') as consultas_canceladas,
          (SELECT AVG(duracion_minutos) FROM consultas WHERE id_centro = ? AND duracion_minutos > 0) as duracion_promedio_minutos
        `;
      }

      const [result] = await pool.query(sql, [centroId, centroId, centroId, ...Array(7).fill(centroId)]);
      const stats = result[0];
      stats.centro_id = parseInt(centroId);
      stats.fecha_generacion = new Date().toISOString();
      
      return res.json(stats);
    }

    // Si es médico, obtener solo sus estadísticas
    if (!adminUser) {
      const pool = getPoolByCentroId(req.user.id_centro);
      
      let sql = `
        SELECT
          COUNT(DISTINCT c.id) as total_consultas,
          COUNT(DISTINCT CASE WHEN c.id_paciente IS NOT NULL THEN c.id_paciente ELSE CONCAT(c.paciente_nombre, '|', c.paciente_apellido) END) as pacientes_con_consultas,
          COUNT(CASE WHEN c.estado = 'pendiente' THEN c.id END) as consultas_pendientes,
          COUNT(CASE WHEN c.estado = 'programada' THEN c.id END) as consultas_programadas,
          COUNT(CASE WHEN c.estado = 'completada' THEN c.id END) as consultas_completadas,
          COUNT(CASE WHEN c.estado = 'cancelada' THEN c.id END) as consultas_canceladas,
          AVG(CASE WHEN c.duracion_minutos > 0 THEN c.duracion_minutos END) as duracion_promedio_minutos
        FROM consultas c
        WHERE c.id_medico = ? AND c.id_centro = ?
      `;

      const [result] = await pool.query(sql, [req.user.id_medico, req.user.id_centro]);
      const stats = result[0];
      stats.centro_id = req.user.id_centro;
      stats.fecha_generacion = new Date().toISOString();
      
      return res.json(stats);
    }

    // Si es admin sin centroId, obtener de todas las BDs
    let totalMedicos = 0;
    let totalPacientes = 0;
    let totalEmpleados = 0;
    let totalConsultas = 0;
    let pacientesConConsultas = 0;
    let consultasPendientes = 0;
    let consultasProgramadas = 0;
    let consultasCompletadas = 0;
    let consultasCanceladas = 0;
    let duracionPromedio = 0;

    for (const [dbName, pool] of Object.entries(pools)) {
      try {
        const [medicos] = await pool.query('SELECT COUNT(*) as count FROM medicos');
        const [pacientes] = await pool.query('SELECT COUNT(*) as count FROM pacientes');
        const [empleados] = await pool.query('SELECT COUNT(*) as count FROM empleados');
        const [consultas] = await pool.query('SELECT COUNT(*) as count FROM consultas');
        const [pacientesCon] = await pool.query('SELECT COUNT(DISTINCT id_paciente) as count FROM consultas WHERE id_paciente IS NOT NULL');
        const [pendientes] = await pool.query("SELECT COUNT(*) as count FROM consultas WHERE estado = 'pendiente'");
        const [programadas] = await pool.query("SELECT COUNT(*) as count FROM consultas WHERE estado = 'programada'");
        const [completadas] = await pool.query("SELECT COUNT(*) as count FROM consultas WHERE estado = 'completada'");
        const [canceladas] = await pool.query("SELECT COUNT(*) as count FROM consultas WHERE estado = 'cancelada'");
        const [duracion] = await pool.query('SELECT AVG(duracion_minutos) as avg FROM consultas WHERE duracion_minutos > 0');

        totalMedicos += medicos[0].count;
        totalPacientes += pacientes[0].count;
        totalEmpleados += empleados[0].count;
        totalConsultas += consultas[0].count;
        pacientesConConsultas += pacientesCon[0].count;
        consultasPendientes += pendientes[0].count;
        consultasProgramadas += programadas[0].count;
        consultasCompletadas += completadas[0].count;
        consultasCanceladas += canceladas[0].count;
        duracionPromedio += duracion[0].avg || 0;
      } catch (error) {
        logger.error(`Error obteniendo estadísticas de ${dbName}:`, error.message);
      }
    }

    const stats = {
      total_medicos: totalMedicos,
      total_pacientes: totalPacientes,
      total_empleados: totalEmpleados,
      total_consultas: totalConsultas,
      pacientes_con_consultas: pacientesConConsultas,
      consultas_pendientes: consultasPendientes,
      consultas_programadas: consultasProgramadas,
      consultas_completadas: consultasCompletadas,
      consultas_canceladas: consultasCanceladas,
      duracion_promedio_minutos: duracionPromedio / 3,
      fecha_generacion: new Date().toISOString()
    };

    res.json(stats);

  } catch (error) {
    logger.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Pacientes frecuentes
app.get('/pacientes-frecuentes', authenticateToken, async (req, res) => {
  try {
    const { desde, hasta, limite = 10, centroId } = req.query;
    const adminUser = isAdmin(req);

    // Si es admin y hay centroId, consultar solo esa BD
    if (adminUser && centroId) {
      const pool = getPoolByCentroId(parseInt(centroId));
      
      let sql = `
        SELECT
          p.id, p.nombres, p.apellidos, p.cedula, p.telefono, p.email, p.fecha_nacimiento, p.genero,
          COUNT(c.id) as total_consultas, MIN(c.fecha) as primera_consulta, MAX(c.fecha) as ultima_consulta,
          GROUP_CONCAT(DISTINCT m.nombres, ' ', m.apellidos SEPARATOR ', ') as medicos_atendidos
        FROM pacientes p
        INNER JOIN consultas c ON c.id_paciente = p.id AND c.id_centro = ?
        INNER JOIN medicos m ON m.id = c.id_medico
        WHERE p.id_centro = ?
      `;

      if (desde && hasta) {
        sql += ` AND c.fecha >= '${desde} 00:00:00' AND c.fecha <= '${hasta} 23:59:59'`;
      }

      sql += `
        GROUP BY p.id, p.nombres, p.apellidos, p.cedula, p.telefono, p.email, p.fecha_nacimiento, p.genero
        HAVING total_consultas > 0
        ORDER BY total_consultas DESC, p.apellidos ASC, p.nombres ASC
        LIMIT ?
      `;

      const [pacientes] = await pool.query(sql, [centroId, centroId, parseInt(limite)]);
      return res.json(pacientes);
    }

    // Si es médico, obtener solo sus pacientes
    if (!adminUser) {
      const pool = getPoolByCentroId(req.user.id_centro);
      
      let sql = `
        SELECT
          p.id, p.nombres, p.apellidos, p.cedula, p.telefono, p.email, p.fecha_nacimiento, p.genero,
          COUNT(c.id) as total_consultas, MIN(c.fecha) as primera_consulta, MAX(c.fecha) as ultima_consulta
        FROM pacientes p
        INNER JOIN consultas c ON c.id_paciente = p.id AND c.id_centro = ?
        WHERE p.id_centro = ? AND c.id_medico = ?
      `;

      if (desde && hasta) {
        sql += ` AND c.fecha >= '${desde} 00:00:00' AND c.fecha <= '${hasta} 23:59:59'`;
      }

      sql += `
        GROUP BY p.id, p.nombres, p.apellidos, p.cedula, p.telefono, p.email, p.fecha_nacimiento, p.genero
        HAVING total_consultas > 0
        ORDER BY total_consultas DESC, p.apellidos ASC, p.nombres ASC
        LIMIT ?
      `;

      const [pacientes] = await pool.query(sql, [req.user.id_centro, req.user.id_centro, req.user.id_medico, parseInt(limite)]);
      return res.json(pacientes);
    }

    // Si es admin sin centroId, obtener de todas las BDs
    const allPacientes = [];
    for (const [dbName, pool] of Object.entries(pools)) {
      try {
        const [pacientes] = await pool.query(`
          SELECT
            p.id, p.nombres, p.apellidos, p.cedula, p.telefono, p.email, p.fecha_nacimiento, p.genero,
            COUNT(c.id) as total_consultas, MIN(c.fecha) as primera_consulta, MAX(c.fecha) as ultima_consulta,
            GROUP_CONCAT(DISTINCT m.nombres, ' ', m.apellidos SEPARATOR ', ') as medicos_atendidos
          FROM pacientes p
          INNER JOIN consultas c ON c.id_paciente = p.id AND c.id_centro = p.id_centro
          INNER JOIN medicos m ON m.id = c.id_medico
          WHERE p.id_centro = m.id_centro
          GROUP BY p.id, p.nombres, p.apellidos, p.cedula, p.telefono, p.email, p.fecha_nacimiento, p.genero
          HAVING total_consultas > 0
          ORDER BY total_consultas DESC, p.apellidos ASC, p.nombres ASC
          LIMIT ?
        `, [parseInt(limite)]);
        
        allPacientes.push(...pacientes);
      } catch (error) {
        logger.error(`Error obteniendo pacientes frecuentes de ${dbName}:`, error.message);
      }
    }

    res.json(allPacientes);

  } catch (error) {
    logger.error('Error obteniendo pacientes frecuentes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Detalle de consultas de un médico
app.get('/consultas/:medicoId/detalle', authenticateToken, async (req, res) => {
  try {
    const { medicoId } = req.params;
    const { desde, hasta, q, centroId } = req.query;
    const adminUser = isAdmin(req);

    const targetCentroId = centroId || req.user.id_centro;
    const pool = getPoolByCentroId(parseInt(targetCentroId));

    // Verificar que el médico existe y pertenece al centro
    const [medico] = await pool.query(
      'SELECT id FROM medicos WHERE id = ? AND id_centro = ?',
      [medicoId, targetCentroId]
    );

    if (medico.length === 0) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    // Si es médico, verificar que es su propio detalle
    if (!adminUser && parseInt(medicoId) !== req.user.id_medico) {
      return res.status(403).json({ error: 'No tienes permisos para ver este detalle' });
    }

    let sql = `
      SELECT
        c.id, c.fecha, c.paciente_nombre, c.paciente_apellido, c.id_paciente,
        p.cedula, p.telefono, p.email, p.fecha_nacimiento, p.genero,
        c.motivo, c.diagnostico, c.tratamiento, c.estado, c.duracion_minutos
      FROM consultas c
      LEFT JOIN pacientes p ON c.id_paciente = p.id
      WHERE c.id_centro = ? AND c.id_medico = ?
    `;

    const params = [targetCentroId, medicoId];

    if (desde && hasta) {
      sql += ' AND c.fecha >= ? AND c.fecha <= ?';
      params.push(`${desde} 00:00:00`, `${hasta} 23:59:59`);
    }

    if (q) {
      sql += ' AND (c.paciente_nombre LIKE ? OR c.paciente_apellido LIKE ? OR c.motivo LIKE ? OR c.diagnostico LIKE ?)';
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY c.fecha DESC, c.id DESC';

    const [consultas] = await pool.query(sql, params);
    res.json(consultas);

  } catch (error) {
    logger.error('Error obteniendo detalle de consultas:', error);
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
      service: 'reports-service',
      timestamp: new Date().toISOString(),
      databases: healthChecks
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      service: 'reports-service',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  logger.error('Error en reports service:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`📊 Reports Service iniciado en puerto ${PORT}`);
  logger.info(`🗄️ Bases de datos: ${Object.keys(pools).join(', ')}`);
});

module.exports = app;
