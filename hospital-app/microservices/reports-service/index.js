const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
const PDFDocument = require('pdfkit');
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

// Ruta de salud
app.get('/health', async (req, res) => {
  try {
    await pools.central.query('SELECT 1');
    res.json({
      status: 'OK',
      service: 'reports-service',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      service: 'reports-service',
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

// ===== RUTAS DE REPORTES =====

// Obtener estadísticas generales
app.get('/estadisticas', authenticateToken, async (req, res) => {
  try {
    const { centroId } = req.query;
    const centro = centroId ? parseInt(centroId) : 1;
    const pool = getPoolByCentro(centro);
    
    const [stats] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM medicos WHERE id_centro = ?) as total_medicos,
        (SELECT COUNT(*) FROM pacientes WHERE id_centro = ?) as total_pacientes,
        (SELECT COUNT(*) FROM empleados WHERE id_centro = ?) as total_empleados,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ?) as total_consultas,
        (SELECT COUNT(*) FROM usuarios WHERE id_centro = ?) as total_usuarios
    `, [centro, centro, centro, centro, centro]);
    
    res.json({
      centro_id: centro,
      fecha_generacion: new Date().toISOString(),
      ...stats[0]
    });
  } catch (error) {
    logger.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener resumen de consultas por médico
app.get('/consultas/resumen', authenticateToken, async (req, res) => {
  try {
    const { centroId, desde, hasta, q } = req.query;
    const centro = centroId ? parseInt(centroId) : 1;
    const pool = getPoolByCentro(centro);
    
    let fechaFilter = '';
    let searchFilter = '';
    let params = [centro, centro];
    
    if (desde && hasta) {
      fechaFilter = 'AND c.fecha >= ? AND c.fecha <= ?';
      params.push(desde, hasta);
    } else if (desde) {
      fechaFilter = 'AND c.fecha >= ?';
      params.push(desde);
    } else if (hasta) {
      fechaFilter = 'AND c.fecha <= ?';
      params.push(hasta);
    }
    
    if (q) {
      searchFilter = 'AND (m.nombres LIKE ? OR m.apellidos LIKE ? OR e.nombre LIKE ?)';
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    const [reports] = await pool.query(`
      SELECT 
        m.id as medico_id, m.nombres, m.apellidos, e.nombre as especialidad,
        COUNT(c.id) as total_consultas,
        COUNT(DISTINCT c.id_paciente) as pacientes_unicos,
        MIN(c.fecha) as primera_consulta,
        MAX(c.fecha) as ultima_consulta
      FROM medicos m
      LEFT JOIN especialidades e ON e.id = m.id_especialidad
      LEFT JOIN consultas c ON c.id_medico = m.id AND c.id_centro = ? ${fechaFilter}
      WHERE m.id_centro = ? ${searchFilter}
      GROUP BY m.id, m.nombres, m.apellidos, e.nombre
      ORDER BY total_consultas DESC
    `, params);
    
    res.json(reports);
  } catch (error) {
    logger.error('Error obteniendo resumen de consultas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener pacientes más frecuentes
app.get('/pacientes/frecuentes', authenticateToken, async (req, res) => {
  try {
    const { centroId, limite = 10, desde, hasta, q } = req.query;
    const centro = centroId ? parseInt(centroId) : 1;
    const pool = getPoolByCentro(centro);
    
    let fechaFilter = '';
    let searchFilter = '';
    let params = [centro, centro];
    
    if (desde && hasta) {
      fechaFilter = 'AND c.fecha >= ? AND c.fecha <= ?';
      params.push(desde, hasta);
    } else if (desde) {
      fechaFilter = 'AND c.fecha >= ?';
      params.push(desde);
    } else if (hasta) {
      fechaFilter = 'AND c.fecha <= ?';
      params.push(hasta);
    }
    
    if (q) {
      searchFilter = 'AND (p.nombres LIKE ? OR p.apellidos LIKE ? OR p.cedula LIKE ?)';
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    const [pacientes] = await pool.query(`
      SELECT 
        p.id, p.nombres, p.apellidos, p.cedula, p.telefono, p.email,
        COUNT(c.id) as total_consultas,
        MIN(c.fecha) as primera_consulta,
        MAX(c.fecha) as ultima_consulta
      FROM pacientes p
      INNER JOIN consultas c ON c.id_paciente = p.id AND c.id_centro = ? ${fechaFilter}
      WHERE p.id_centro = ? ${searchFilter}
      GROUP BY p.id, p.nombres, p.apellidos, p.cedula, p.telefono, p.email
      ORDER BY total_consultas DESC
      LIMIT ?
    `, [...params, parseInt(limite)]);
    
    res.json(pacientes);
  } catch (error) {
    logger.error('Error obteniendo pacientes frecuentes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener detalle de consultas por médico
app.get('/consultas/medico/:medicoId', authenticateToken, async (req, res) => {
  try {
    const { medicoId } = req.params;
    const { centroId, desde, hasta, q } = req.query;
    const centro = centroId ? parseInt(centroId) : 1;
    const pool = getPoolByCentro(centro);
    
    let fechaFilter = '';
    let searchFilter = '';
    let params = [centro, parseInt(medicoId)];
    
    if (desde && hasta) {
      fechaFilter = 'AND c.fecha >= ? AND c.fecha <= ?';
      params.push(desde, hasta);
    } else if (desde) {
      fechaFilter = 'AND c.fecha >= ?';
      params.push(desde);
    } else if (hasta) {
      fechaFilter = 'AND c.fecha <= ?';
      params.push(hasta);
    }
    
    if (q) {
      searchFilter = 'AND (p.nombres LIKE ? OR p.apellidos LIKE ? OR c.motivo LIKE ? OR c.diagnostico LIKE ?)';
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    const [consultas] = await pool.query(`
      SELECT 
        c.id, c.fecha, c.motivo, c.diagnostico, c.tratamiento, c.estado,
        p.nombres as paciente_nombres, p.apellidos as paciente_apellidos,
        p.cedula as paciente_cedula
      FROM consultas c
      LEFT JOIN pacientes p ON p.id = c.id_paciente
      WHERE c.id_centro = ? AND c.id_medico = ? ${fechaFilter} ${searchFilter}
      ORDER BY c.fecha DESC
    `, params);
    
    res.json(consultas);
  } catch (error) {
    logger.error('Error obteniendo detalle de consultas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Generar reporte PDF
app.post('/pdf', authenticateToken, async (req, res) => {
  try {
    const { tipo, centroId, desde, hasta } = req.body;
    const centro = centroId ? parseInt(centroId) : 1;
    
    // Crear documento PDF
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte.pdf');
    doc.pipe(res);
    
    // Configurar documento
    doc.fontSize(20).text('Reporte del Sistema Hospitalario', 50, 50);
    doc.fontSize(12).text(`Centro ID: ${centro}`, 50, 80);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 50, 100);
    
    if (tipo === 'estadisticas') {
      const pool = getPoolByCentro(centro);
      const [stats] = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM medicos WHERE id_centro = ?) as total_medicos,
          (SELECT COUNT(*) FROM pacientes WHERE id_centro = ?) as total_pacientes,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = ?) as total_consultas
      `, [centro, centro, centro]);
      
      doc.text('Estadísticas Generales:', 50, 130);
      doc.text(`Total Médicos: ${stats[0].total_medicos}`, 70, 150);
      doc.text(`Total Pacientes: ${stats[0].total_pacientes}`, 70, 170);
      doc.text(`Total Consultas: ${stats[0].total_consultas}`, 70, 190);
    }
    
    doc.end();
  } catch (error) {
    logger.error('Error generando PDF:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
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
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`📊 Reports Service iniciado en puerto ${PORT}`);
  logger.info(`🗄️ Bases de datos: Central, Guayaquil, Cuenca`);
});

module.exports = app;