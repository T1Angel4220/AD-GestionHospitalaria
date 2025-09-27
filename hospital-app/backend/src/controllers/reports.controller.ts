// src/controllers/reports.controller.ts
import { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { pools } from "../config/distributedDb";

function getCentroId(req: Request): number | null {
  const headerValue = req.header("X-Centro-Id") || req.header("x-centro-id");
  if (!headerValue) return null;
  const n = Number(headerValue);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function isAdmin(req: Request): boolean {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return false;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    return decoded.rol === 'admin';
  } catch (err) {
    return false;
  }
}

// =========================
// Función para obtener resumen de consultas de una base de datos específica (solo admin)
// =========================
async function getResumenConsultasFromSpecificDatabase(centroId: number, filters: any = {}) {
  try {
    const params: any[] = [];
    const onFilters: string[] = [];

    // Filtros de fecha aplican sobre la tabla de consultas
    if (filters.desde) { onFilters.push(`c.fecha >= ?`); params.push(`${filters.desde} 00:00:00`); }
    if (filters.hasta) { onFilters.push(`c.fecha <= ?`); params.push(`${filters.hasta} 23:59:59`); }

    // Filtro de texto (paciente/motivo/diagnostico)
    if (filters.q && filters.q.trim() !== "") {
      onFilters.push(`(c.paciente_nombre LIKE ? OR c.paciente_apellido LIKE ? OR c.motivo LIKE ? OR c.diagnostico LIKE ?)`);
      const like = `%${filters.q}%`;
      params.push(like, like, like, like);
    }

    const whereClause = onFilters.length > 0 ? `WHERE ${onFilters.join(" AND ")}` : '';
    
    // Determinar qué base de datos usar según el centroId
    let targetPool;
    let centroNombre;
    let centroCiudad;
    
    switch (centroId) {
      case 1:
        targetPool = pools.central;
        centroNombre = 'Hospital Central Quito';
        centroCiudad = 'Quito';
        break;
      case 2:
        targetPool = pools.guayaquil;
        centroNombre = 'Hospital Guayaquil';
        centroCiudad = 'Guayaquil';
        break;
      case 3:
        targetPool = pools.cuenca;
        centroNombre = 'Hospital Cuenca';
        centroCiudad = 'Cuenca';
        break;
      default:
        throw new Error(`Centro ID ${centroId} no válido`);
    }

    console.log(`🔍 [REPORTS] Consultando BD para centro ${centroId} (${centroNombre})`);

    console.log(`🔍 [REPORTS] Parámetros de consulta:`, { centroId, params, onFilters });
    
    const [reports] = await targetPool.query(`
      SELECT
        m.id,
        m.id AS medico_id,
        m.nombres,
        m.apellidos,
        e.nombre AS especialidad,
        cm.nombre AS centro_medico,
        cm.ciudad AS centro_ciudad,
        m.id_centro AS medico_centro_id,
        COUNT(CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} THEN c.id END) AS total_consultas,
        COUNT(DISTINCT CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} AND c.id_paciente IS NOT NULL THEN c.id_paciente ELSE CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} THEN CONCAT(c.paciente_nombre, '|', c.paciente_apellido) END END) AS pacientes_unicos,
        MIN(CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} THEN c.fecha END) AS primera_consulta,
        MAX(CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} THEN c.fecha END) AS ultima_consulta
      FROM medicos m
      INNER JOIN especialidades e ON e.id = m.id_especialidad
      INNER JOIN centros_medicos cm ON cm.id = m.id_centro
      LEFT JOIN consultas c ON c.id_medico = m.id AND c.id_centro = ?
      WHERE m.id_centro = ? AND EXISTS (
        SELECT 1 FROM consultas c2 
        WHERE c2.id_medico = m.id AND c2.id_centro = ?
        ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''}
      )
      GROUP BY m.id, m.nombres, m.apellidos, e.nombre, cm.nombre, cm.ciudad, m.id_centro
      ORDER BY total_consultas DESC, m.apellidos ASC, m.nombres ASC
    `, [centroId, centroId, centroId, ...params]);
    
    // Agregar información de centro
    (reports as any[]).forEach(report => {
      report.centro_medico = report.centro_medico || centroNombre;
      report.centro_ciudad = report.centro_ciudad || centroCiudad;
      console.log(`📋 [REPORTS] Médico: ${report.nombres} ${report.apellidos} (Centro: ${report.medico_centro_id}) - Consultas: ${report.total_consultas}`);
    });
    
    console.log(`✅ [REPORTS] Encontrados ${(reports as any[]).length} reportes en centro ${centroId}`);
    return reports as any[];
    
  } catch (error) {
    console.error(`❌ [REPORTS] Error consultando centro ${centroId}:`, error);
    throw error;
  }
}

// =========================
// Función para obtener resumen de consultas de todas las bases de datos (solo admin)
// =========================
async function getAllResumenConsultasFromAllDatabases(filters: any = {}) {
  const allReports: any[] = [];
  
  try {
    const params: any[] = [];
    const onFilters: string[] = [];

    // Filtros de fecha aplican sobre la tabla de consultas
    if (filters.desde) { onFilters.push(`c.fecha >= ?`); params.push(`${filters.desde} 00:00:00`); }
    if (filters.hasta) { onFilters.push(`c.fecha <= ?`); params.push(`${filters.hasta} 23:59:59`); }

    // Filtro de texto (paciente/motivo/diagnostico)
    if (filters.q && filters.q.trim() !== "") {
      onFilters.push(`(c.paciente_nombre LIKE ? OR c.paciente_apellido LIKE ? OR c.motivo LIKE ? OR c.diagnostico LIKE ?)`);
      const like = `%${filters.q}%`;
      params.push(like, like, like, like);
    }

    const whereClause = onFilters.length > 0 ? `WHERE ${onFilters.join(" AND ")}` : '';
    
    // Consultar BD Central (Quito)
    const [centralReports] = await pools.central.query(`
      SELECT
        m.id,
        m.id AS medico_id,
        m.nombres,
        m.apellidos,
        e.nombre AS especialidad,
        cm.nombre AS centro_medico,
        cm.ciudad AS centro_ciudad,
        COUNT(CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} THEN c.id END) AS total_consultas,
        COUNT(DISTINCT CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} AND c.id_paciente IS NOT NULL THEN c.id_paciente ELSE CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} THEN CONCAT(c.paciente_nombre, '|', c.paciente_apellido) END END) AS pacientes_unicos,
        MIN(CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} THEN c.fecha END) AS primera_consulta,
        MAX(CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} THEN c.fecha END) AS ultima_consulta
      FROM medicos m
      INNER JOIN especialidades e ON e.id = m.id_especialidad
      INNER JOIN centros_medicos cm ON cm.id = m.id_centro
      LEFT JOIN consultas c ON c.id_medico = m.id AND c.id_centro = 1
      WHERE EXISTS (
        SELECT 1 FROM consultas c2 
        WHERE c2.id_medico = m.id AND c2.id_centro = 1
        ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''}
      )
      GROUP BY m.id, m.nombres, m.apellidos, e.nombre, cm.nombre, cm.ciudad
      ORDER BY total_consultas DESC, m.apellidos ASC, m.nombres ASC
    `, params);
    
    // Agregar información de centro
    (centralReports as any[]).forEach(report => {
      report.centro_medico = report.centro_medico || 'Hospital Central Quito';
      report.centro_ciudad = report.centro_ciudad || 'Quito';
    });
    
    allReports.push(...(centralReports as any[]));
    
    // Consultar BD Guayaquil
    try {
      const [guayaquilReports] = await pools.guayaquil.query(`
        SELECT
          m.id,
          m.id AS medico_id,
          m.nombres,
          m.apellidos,
          e.nombre AS especialidad,
          cm.nombre AS centro_medico,
          cm.ciudad AS centro_ciudad,
          COUNT(CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} THEN c.id END) AS total_consultas,
          COUNT(DISTINCT CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} AND c.id_paciente IS NOT NULL THEN c.id_paciente ELSE CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} THEN CONCAT(c.paciente_nombre, '|', c.paciente_apellido) END END) AS pacientes_unicos,
          MIN(CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} THEN c.fecha END) AS primera_consulta,
          MAX(CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} THEN c.fecha END) AS ultima_consulta
        FROM medicos m
        INNER JOIN especialidades e ON e.id = m.id_especialidad
        INNER JOIN centros_medicos cm ON cm.id = m.id_centro
        LEFT JOIN consultas c ON c.id_medico = m.id AND c.id_centro = 2
        WHERE EXISTS (
          SELECT 1 FROM consultas c2 
          WHERE c2.id_medico = m.id AND c2.id_centro = 2
          ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''}
        )
        GROUP BY m.id, m.nombres, m.apellidos, e.nombre, cm.nombre, cm.ciudad
        ORDER BY total_consultas DESC, m.apellidos ASC, m.nombres ASC
      `, params);
      
      (guayaquilReports as any[]).forEach(report => {
        report.centro_medico = report.centro_medico || 'Hospital Guayaquil';
        report.centro_ciudad = report.centro_ciudad || 'Guayaquil';
      });
      
      allReports.push(...(guayaquilReports as any[]));
    } catch (error) {
      console.log('⚠️ No se pudo conectar a BD Guayaquil:', error);
    }
    
    // Consultar BD Cuenca
    try {
      const [cuencaReports] = await pools.cuenca.query(`
        SELECT
          m.id,
          m.id AS medico_id,
          m.nombres,
          m.apellidos,
          e.nombre AS especialidad,
          cm.nombre AS centro_medico,
          cm.ciudad AS centro_ciudad,
          COUNT(CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} THEN c.id END) AS total_consultas,
          COUNT(DISTINCT CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} AND c.id_paciente IS NOT NULL THEN c.id_paciente ELSE CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} THEN CONCAT(c.paciente_nombre, '|', c.paciente_apellido) END END) AS pacientes_unicos,
          MIN(CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} THEN c.fecha END) AS primera_consulta,
          MAX(CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} THEN c.fecha END) AS ultima_consulta
        FROM medicos m
        INNER JOIN especialidades e ON e.id = m.id_especialidad
        INNER JOIN centros_medicos cm ON cm.id = m.id_centro
        LEFT JOIN consultas c ON c.id_medico = m.id AND c.id_centro = 3
        WHERE EXISTS (
          SELECT 1 FROM consultas c2 
          WHERE c2.id_medico = m.id AND c2.id_centro = 3
          ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''}
        )
        GROUP BY m.id, m.nombres, m.apellidos, e.nombre, cm.nombre, cm.ciudad
        ORDER BY total_consultas DESC, m.apellidos ASC, m.nombres ASC
      `, params);
      
      (cuencaReports as any[]).forEach(report => {
        report.centro_medico = report.centro_medico || 'Hospital Cuenca';
        report.centro_ciudad = report.centro_ciudad || 'Cuenca';
      });
      
      allReports.push(...(cuencaReports as any[]));
    } catch (error) {
      console.log('⚠️ No se pudo conectar a BD Cuenca:', error);
    }
    
  } catch (error) {
    console.error('❌ Error consultando todas las bases de datos:', error);
    throw error;
  }
  
  // Ordenar por total de consultas (descendente) y luego por apellidos
  return allReports.sort((a, b) => {
    if (b.total_consultas !== a.total_consultas) {
      return b.total_consultas - a.total_consultas;
    }
    return a.apellidos.localeCompare(b.apellidos);
  });
}

// =========================
// Función para obtener estadísticas de una base de datos específica (solo admin)
// =========================
async function getEstadisticasFromSpecificDatabase(centroId: number, filters: any = {}) {
  try {
    // Determinar qué base de datos usar según el centroId
    let targetPool;
    
    switch (centroId) {
      case 1:
        targetPool = pools.central;
        break;
      case 2:
        targetPool = pools.guayaquil;
        break;
      case 3:
        targetPool = pools.cuenca;
        break;
      default:
        throw new Error(`Centro ID ${centroId} no válido`);
    }

    console.log(`🔍 [STATS] Consultando estadísticas para centro ${centroId}`);

    // Construir SQL dinámicamente para evitar problemas con parámetros
    let sql = `
      SELECT
        (SELECT COUNT(*) FROM medicos WHERE id_centro = ${centroId}) as total_medicos,
        (SELECT COUNT(*) FROM pacientes WHERE id_centro = ${centroId}) as total_pacientes,
        (SELECT COUNT(*) FROM empleados WHERE id_centro = ${centroId}) as total_empleados
    `;

    // Agregar consultas con filtros de fecha si se proporcionan
    if (filters.desde && filters.hasta) {
      const fechaInicio = `${filters.desde} 00:00:00`;
      const fechaFin = `${filters.hasta} 23:59:59`;
      
      sql += `,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as total_consultas,
        (SELECT COUNT(DISTINCT id_paciente) FROM consultas WHERE id_centro = ${centroId} AND id_paciente IS NOT NULL AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as pacientes_con_consultas,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND estado = 'pendiente' AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as consultas_pendientes,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND estado = 'programada' AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as consultas_programadas,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND estado = 'completada' AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as consultas_completadas,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND estado = 'cancelada' AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as consultas_canceladas,
        (SELECT AVG(duracion_minutos) FROM consultas WHERE id_centro = ${centroId} AND duracion_minutos > 0 AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as duracion_promedio_minutos,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as consultas_periodo,
        (SELECT COUNT(DISTINCT id_paciente) FROM consultas WHERE id_centro = ${centroId} AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}' AND id_paciente IS NOT NULL) as pacientes_unicos_periodo
      `;
    } else if (filters.desde) {
      const fechaInicio = `${filters.desde} 00:00:00`;
      
      sql += `,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND fecha >= '${fechaInicio}') as total_consultas,
        (SELECT COUNT(DISTINCT id_paciente) FROM consultas WHERE id_centro = ${centroId} AND id_paciente IS NOT NULL AND fecha >= '${fechaInicio}') as pacientes_con_consultas,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND estado = 'pendiente' AND fecha >= '${fechaInicio}') as consultas_pendientes,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND estado = 'programada' AND fecha >= '${fechaInicio}') as consultas_programadas,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND estado = 'completada' AND fecha >= '${fechaInicio}') as consultas_completadas,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND estado = 'cancelada' AND fecha >= '${fechaInicio}') as consultas_canceladas,
        (SELECT AVG(duracion_minutos) FROM consultas WHERE id_centro = ${centroId} AND duracion_minutos > 0 AND fecha >= '${fechaInicio}') as duracion_promedio_minutos,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND fecha >= '${fechaInicio}') as consultas_periodo,
        (SELECT COUNT(DISTINCT id_paciente) FROM consultas WHERE id_centro = ${centroId} AND fecha >= '${fechaInicio}' AND id_paciente IS NOT NULL) as pacientes_unicos_periodo
      `;
    } else if (filters.hasta) {
      const fechaFin = `${filters.hasta} 23:59:59`;
      
      sql += `,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND fecha <= '${fechaFin}') as total_consultas,
        (SELECT COUNT(DISTINCT id_paciente) FROM consultas WHERE id_centro = ${centroId} AND id_paciente IS NOT NULL AND fecha <= '${fechaFin}') as pacientes_con_consultas,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND estado = 'pendiente' AND fecha <= '${fechaFin}') as consultas_pendientes,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND estado = 'programada' AND fecha <= '${fechaFin}') as consultas_programadas,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND estado = 'completada' AND fecha <= '${fechaFin}') as consultas_completadas,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND estado = 'cancelada' AND fecha <= '${fechaFin}') as consultas_canceladas,
        (SELECT AVG(duracion_minutos) FROM consultas WHERE id_centro = ${centroId} AND duracion_minutos > 0 AND fecha <= '${fechaFin}') as duracion_promedio_minutos,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND fecha <= '${fechaFin}') as consultas_periodo,
        (SELECT COUNT(DISTINCT id_paciente) FROM consultas WHERE id_centro = ${centroId} AND fecha <= '${fechaFin}' AND id_paciente IS NOT NULL) as pacientes_unicos_periodo
      `;
    } else {
      sql += `,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId}) as total_consultas,
        (SELECT COUNT(DISTINCT id_paciente) FROM consultas WHERE id_centro = ${centroId} AND id_paciente IS NOT NULL) as pacientes_con_consultas,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND estado = 'pendiente') as consultas_pendientes,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND estado = 'programada') as consultas_programadas,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND estado = 'completada') as consultas_completadas,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND estado = 'cancelada') as consultas_canceladas,
        (SELECT AVG(duracion_minutos) FROM consultas WHERE id_centro = ${centroId} AND duracion_minutos > 0) as duracion_promedio_minutos,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId}) as consultas_periodo,
        (SELECT COUNT(DISTINCT id_paciente) FROM consultas WHERE id_centro = ${centroId} AND id_paciente IS NOT NULL) as pacientes_unicos_periodo
      `;
    }

    const [result] = await targetPool.query(sql);
    const stats = (result as any[])[0];

    // Agregar información adicional
    stats.centro_id = centroId;
    stats.fecha_generacion = new Date().toISOString();

    console.log(`✅ [STATS] Estadísticas calculadas para centro ${centroId}:`, stats);
    console.log(`🔍 [STATS] Campos disponibles:`, Object.keys(stats));
    return stats;
    
  } catch (error) {
    console.error(`❌ [STATS] Error calculando estadísticas para centro ${centroId}:`, error);
    throw error;
  }
}

// =========================
// Función para obtener estadísticas de todas las bases de datos (solo admin)
// =========================
async function getAllEstadisticasFromAllDatabases(filters: any = {}) {
  try {
    let totalMedicos = 0;
    let totalPacientes = 0;
    let totalEmpleados = 0;
    let totalConsultas = 0;
    let pacientesConConsultas = 0;
    let consultasPendientes = 0;
    let consultasProgramadas = 0;
    let consultasCompletadas = 0;
    let consultasCanceladas = 0;
    let duracionPromedioMinutos = 0;
    let totalDuracion = 0;
    let consultasConDuracion = 0;

    // Construir filtros de fecha
    const fechaInicio = filters.desde ? `${filters.desde} 00:00:00` : null;
    const fechaFin = filters.hasta ? `${filters.hasta} 23:59:59` : null;
    
    // Consultar BD Central (Quito)
    const [centralStats] = await pools.central.query(`
      SELECT
        (SELECT COUNT(*) FROM medicos WHERE id_centro = 1) as total_medicos,
        (SELECT COUNT(*) FROM pacientes WHERE id_centro = 1) as total_pacientes,
        (SELECT COUNT(*) FROM empleados WHERE id_centro = 1) as total_empleados,
        ${fechaInicio && fechaFin ? `
        (SELECT COUNT(*) FROM consultas WHERE id_centro = 1 AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as total_consultas,
        (SELECT COUNT(DISTINCT id_paciente) FROM consultas WHERE id_centro = 1 AND id_paciente IS NOT NULL AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as pacientes_con_consultas,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = 1 AND estado = 'pendiente' AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as consultas_pendientes,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = 1 AND estado = 'programada' AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as consultas_programadas,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = 1 AND estado = 'completada' AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as consultas_completadas,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = 1 AND estado = 'cancelada' AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as consultas_canceladas,
        (SELECT SUM(duracion_minutos) FROM consultas WHERE id_centro = 1 AND duracion_minutos > 0 AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as total_duracion,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = 1 AND duracion_minutos > 0 AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as consultas_con_duracion
        ` : `
        (SELECT COUNT(*) FROM consultas WHERE id_centro = 1) as total_consultas,
        (SELECT COUNT(DISTINCT id_paciente) FROM consultas WHERE id_centro = 1 AND id_paciente IS NOT NULL) as pacientes_con_consultas,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = 1 AND estado = 'pendiente') as consultas_pendientes,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = 1 AND estado = 'programada') as consultas_programadas,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = 1 AND estado = 'completada') as consultas_completadas,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = 1 AND estado = 'cancelada') as consultas_canceladas,
        (SELECT SUM(duracion_minutos) FROM consultas WHERE id_centro = 1 AND duracion_minutos > 0) as total_duracion,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = 1 AND duracion_minutos > 0) as consultas_con_duracion
        `}
    `);
    
    const stats = centralStats[0] as any;
    totalMedicos += stats.total_medicos || 0;
    totalPacientes += stats.total_pacientes || 0;
    totalEmpleados += stats.total_empleados || 0;
    totalConsultas += stats.total_consultas || 0;
    pacientesConConsultas += stats.pacientes_con_consultas || 0;
    consultasPendientes += stats.consultas_pendientes || 0;
    consultasProgramadas += stats.consultas_programadas || 0;
    consultasCompletadas += stats.consultas_completadas || 0;
    consultasCanceladas += stats.consultas_canceladas || 0;
    totalDuracion += stats.total_duracion || 0;
    consultasConDuracion += stats.consultas_con_duracion || 0;
    
    // Consultar BD Guayaquil
    try {
      const [guayaquilStats] = await pools.guayaquil.query(`
        SELECT
          (SELECT COUNT(*) FROM medicos WHERE id_centro = 2) as total_medicos,
          (SELECT COUNT(*) FROM pacientes WHERE id_centro = 2) as total_pacientes,
          (SELECT COUNT(*) FROM empleados WHERE id_centro = 2) as total_empleados,
          ${fechaInicio && fechaFin ? `
          (SELECT COUNT(*) FROM consultas WHERE id_centro = 2 AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as total_consultas,
          (SELECT COUNT(DISTINCT id_paciente) FROM consultas WHERE id_centro = 2 AND id_paciente IS NOT NULL AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as pacientes_con_consultas,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = 2 AND estado = 'pendiente' AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as consultas_pendientes,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = 2 AND estado = 'programada' AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as consultas_programadas,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = 2 AND estado = 'completada' AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as consultas_completadas,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = 2 AND estado = 'cancelada' AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as consultas_canceladas,
          (SELECT SUM(duracion_minutos) FROM consultas WHERE id_centro = 2 AND duracion_minutos > 0 AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as total_duracion,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = 2 AND duracion_minutos > 0 AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as consultas_con_duracion
          ` : `
          (SELECT COUNT(*) FROM consultas WHERE id_centro = 2) as total_consultas,
          (SELECT COUNT(DISTINCT id_paciente) FROM consultas WHERE id_centro = 2 AND id_paciente IS NOT NULL) as pacientes_con_consultas,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = 2 AND estado = 'pendiente') as consultas_pendientes,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = 2 AND estado = 'programada') as consultas_programadas,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = 2 AND estado = 'completada') as consultas_completadas,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = 2 AND estado = 'cancelada') as consultas_canceladas,
          (SELECT SUM(duracion_minutos) FROM consultas WHERE id_centro = 2 AND duracion_minutos > 0) as total_duracion,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = 2 AND duracion_minutos > 0) as consultas_con_duracion
          `}
      `);
      
      const stats = guayaquilStats[0] as any;
      totalMedicos += stats.total_medicos || 0;
      totalPacientes += stats.total_pacientes || 0;
      totalEmpleados += stats.total_empleados || 0;
      totalConsultas += stats.total_consultas || 0;
      pacientesConConsultas += stats.pacientes_con_consultas || 0;
      consultasPendientes += stats.consultas_pendientes || 0;
      consultasProgramadas += stats.consultas_programadas || 0;
      consultasCompletadas += stats.consultas_completadas || 0;
      consultasCanceladas += stats.consultas_canceladas || 0;
      totalDuracion += stats.total_duracion || 0;
      consultasConDuracion += stats.consultas_con_duracion || 0;
    } catch (error) {
      console.log('⚠️ No se pudo conectar a BD Guayaquil:', error);
    }
    
    // Consultar BD Cuenca
    try {
      const [cuencaStats] = await pools.cuenca.query(`
        SELECT
          (SELECT COUNT(*) FROM medicos WHERE id_centro = 3) as total_medicos,
          (SELECT COUNT(*) FROM pacientes WHERE id_centro = 3) as total_pacientes,
          (SELECT COUNT(*) FROM empleados WHERE id_centro = 3) as total_empleados,
          ${fechaInicio && fechaFin ? `
          (SELECT COUNT(*) FROM consultas WHERE id_centro = 3 AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as total_consultas,
          (SELECT COUNT(DISTINCT id_paciente) FROM consultas WHERE id_centro = 3 AND id_paciente IS NOT NULL AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as pacientes_con_consultas,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = 3 AND estado = 'pendiente' AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as consultas_pendientes,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = 3 AND estado = 'programada' AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as consultas_programadas,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = 3 AND estado = 'completada' AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as consultas_completadas,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = 3 AND estado = 'cancelada' AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as consultas_canceladas,
          (SELECT SUM(duracion_minutos) FROM consultas WHERE id_centro = 3 AND duracion_minutos > 0 AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as total_duracion,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = 3 AND duracion_minutos > 0 AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as consultas_con_duracion
          ` : `
          (SELECT COUNT(*) FROM consultas WHERE id_centro = 3) as total_consultas,
          (SELECT COUNT(DISTINCT id_paciente) FROM consultas WHERE id_centro = 3 AND id_paciente IS NOT NULL) as pacientes_con_consultas,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = 3 AND estado = 'pendiente') as consultas_pendientes,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = 3 AND estado = 'programada') as consultas_programadas,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = 3 AND estado = 'completada') as consultas_completadas,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = 3 AND estado = 'cancelada') as consultas_canceladas,
          (SELECT SUM(duracion_minutos) FROM consultas WHERE id_centro = 3 AND duracion_minutos > 0) as total_duracion,
          (SELECT COUNT(*) FROM consultas WHERE id_centro = 3 AND duracion_minutos > 0) as consultas_con_duracion
          `}
      `);
      
      const stats = cuencaStats[0] as any;
      totalMedicos += stats.total_medicos || 0;
      totalPacientes += stats.total_pacientes || 0;
      totalEmpleados += stats.total_empleados || 0;
      totalConsultas += stats.total_consultas || 0;
      pacientesConConsultas += stats.pacientes_con_consultas || 0;
      consultasPendientes += stats.consultas_pendientes || 0;
      consultasProgramadas += stats.consultas_programadas || 0;
      consultasCompletadas += stats.consultas_completadas || 0;
      consultasCanceladas += stats.consultas_canceladas || 0;
      totalDuracion += stats.total_duracion || 0;
      consultasConDuracion += stats.consultas_con_duracion || 0;
    } catch (error) {
      console.log('⚠️ No se pudo conectar a BD Cuenca:', error);
    }
    
    // Calcular duración promedio
    duracionPromedioMinutos = consultasConDuracion > 0 ? totalDuracion / consultasConDuracion : 0;
    
    return {
      total_medicos: totalMedicos,
      total_pacientes: totalPacientes,
      total_empleados: totalEmpleados,
      total_consultas: totalConsultas,
      pacientes_con_consultas: pacientesConConsultas,
      consultas_pendientes: consultasPendientes,
      consultas_programadas: consultasProgramadas,
      consultas_completadas: consultasCompletadas,
      consultas_canceladas: consultasCanceladas,
      duracion_promedio_minutos: Math.round(duracionPromedioMinutos * 100) / 100
    };
    
  } catch (error) {
    console.error('❌ Error consultando estadísticas de todas las bases de datos:', error);
    throw error;
  }
}

/**
 * Resumen de consultas por médico del centro:
 * - medico_id, nombres, apellidos, especialidad
 * - total_consultas
 * - primera_consulta (min fecha)
 * - ultima_consulta   (max fecha)
 * - pacientes_unicos (cantidad de pacientes diferentes atendidos)
 *
 * Incluye médicos del centro aunque no tengan consultas en el rango (LEFT JOIN).
 */
export async function getResumenConsultas(req: Request, res: Response) {
  try {
    const centroId = getCentroId(req);
    const adminUser = isAdmin(req);
    
    // Si no es admin, requerir X-Centro-Id
    if (!adminUser && !centroId) {
      return res.status(400).json({ error: "X-Centro-Id requerido" });
    }

    const { desde, hasta, q } = req.query as Record<string, string | undefined>;

    // Si es admin y no hay centroId, obtener reportes de todas las bases de datos
    if (adminUser && !centroId) {
      console.log('👑 [REPORTS] Admin detectado - consultando TODAS las bases de datos');
      const allReports = await getAllResumenConsultasFromAllDatabases({ desde, hasta, q });
      console.log('📊 [REPORTS] Total reportes encontrados:', allReports.length);
      return res.json(allReports);
    }

    // Si es admin y hay centroId, consultar solo esa base de datos específica
    if (adminUser && centroId) {
      console.log(`👑 [REPORTS] Admin detectado - consultando solo centro ${centroId}`);
      const specificReports = await getResumenConsultasFromSpecificDatabase(centroId, { desde, hasta, q });
      console.log('📊 [REPORTS] Reportes encontrados en centro específico:', specificReports.length);
      return res.json(specificReports);
    }

    const params: any[] = [];
    const onFilters: string[] = [];

    // Filtros de fecha aplican sobre la tabla de consultas
    if (desde) { onFilters.push(`c.fecha >= ?`); params.push(`${desde} 00:00:00`); }
    if (hasta) { onFilters.push(`c.fecha <= ?`); params.push(`${hasta} 23:59:59`); }

    // Filtro de texto (paciente/motivo/diagnostico)
    if (q && q.trim() !== "") {
      onFilters.push(`(c.paciente_nombre LIKE ? OR c.paciente_apellido LIKE ? OR c.motivo LIKE ? OR c.diagnostico LIKE ?)`);
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }

    // Agregar filtro de centro a los filtros de consultas
    if (onFilters.length > 0) {
      onFilters.unshift(`c.id_centro = ?`);
      params.unshift(centroId);
    }

    let sql: string;
    
    if (adminUser) {
      // Para ADMIN: Mostrar TODOS los médicos que tienen consultas en el centro seleccionado
      sql = `
        SELECT
          m.id,
          m.id AS medico_id,
          m.nombres,
          m.apellidos,
          e.nombre AS especialidad,
          cm.nombre AS centro_medico,
          COUNT(CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} THEN c.id END) AS total_consultas,
          COUNT(DISTINCT CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} AND c.id_paciente IS NOT NULL THEN c.id_paciente ELSE CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} THEN CONCAT(c.paciente_nombre, '|', c.paciente_apellido) END END) AS pacientes_unicos,
          MIN(CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} THEN c.fecha END) AS primera_consulta,
          MAX(CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} THEN c.fecha END) AS ultima_consulta
        FROM medicos m
        INNER JOIN especialidades e ON e.id = m.id_especialidad
        INNER JOIN centros_medicos cm ON cm.id = m.id_centro
        LEFT JOIN consultas c ON c.id_medico = m.id AND c.id_centro = ?
        WHERE EXISTS (
          SELECT 1 FROM consultas c2 
          WHERE c2.id_medico = m.id AND c2.id_centro = ?
          ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''}
        )
        GROUP BY m.id, m.nombres, m.apellidos, e.nombre, cm.nombre
        ORDER BY total_consultas DESC, m.apellidos ASC, m.nombres ASC
      `;
      params.push(centroId, centroId); // para LEFT JOIN y EXISTS
    } else {
      // Para MÉDICO: Solo médicos del centro asignado
      sql = `
        SELECT
          m.id,
          m.id AS medico_id,
          m.nombres,
          m.apellidos,
          e.nombre AS especialidad,
          COUNT(CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} THEN c.id END) AS total_consultas,
          COUNT(DISTINCT CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} AND c.id_paciente IS NOT NULL THEN c.id_paciente ELSE CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} THEN CONCAT(c.paciente_nombre, '|', c.paciente_apellido) END END) AS pacientes_unicos,
          MIN(CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} THEN c.fecha END) AS primera_consulta,
          MAX(CASE WHEN c.id IS NOT NULL ${onFilters.length > 0 ? `AND (${onFilters.join(" AND ")})` : ''} THEN c.fecha END) AS ultima_consulta
        FROM medicos m
        INNER JOIN especialidades e ON e.id = m.id_especialidad
        LEFT JOIN consultas c ON c.id_medico = m.id AND c.id_centro = ?
        WHERE m.id_centro = ?
        GROUP BY m.id, m.nombres, m.apellidos, e.nombre
        ORDER BY total_consultas DESC, m.apellidos ASC, m.nombres ASC
      `;
      params.push(centroId, centroId); // para LEFT JOIN y WHERE
    }

    console.log('=== DEBUG REPORTES ===');
    console.log('Centro ID solicitado:', centroId);
    console.log('Es usuario admin:', adminUser);
    console.log('Filtros aplicados:', onFilters);
    console.log('SQL Query:', sql);
    console.log('Params:', params);
    
    const [rows] = await req.dbPool.query(sql, params);
    console.log('Query results:', rows);
    console.log('Total médicos encontrados:', (rows as any[]).length);
    
    res.json(rows);
  } catch (err) {
    console.error("[reports] getResumenConsultas:", err);
    res.status(500).json({ error: "No se pudo generar el reporte" });
  }
}

/**
 * Detalle de consultas para un médico específico del centro.
 * Devuelve la lista de consultas (fecha descendente) con información de pacientes.
 */
export async function getDetalleConsultasMedico(req: Request, res: Response) {
  try {
    const centroId = getCentroId(req);
    console.log(`🔍 [DETALLE] Headers recibidos:`, req.headers);
    console.log(`🔍 [DETALLE] CentroId extraído:`, centroId);
    if (!centroId) return res.status(400).json({ error: "X-Centro-Id requerido" });

    const medicoId = Number(req.params.medicoId);
    if (!Number.isFinite(medicoId) || medicoId <= 0) {
      return res.status(400).json({ error: "medicoId inválido" });
    }

    const adminUser = isAdmin(req);

    // Determinar qué base de datos usar según el centroId
    let targetPool;
    
    if (adminUser) {
      // Para ADMIN: usar la BD específica del centro seleccionado
      switch (centroId) {
        case 1:
          targetPool = pools.central;
          break;
        case 2:
          targetPool = pools.guayaquil;
          break;
        case 3:
          targetPool = pools.cuenca;
          break;
        default:
          return res.status(400).json({ error: `Centro ID ${centroId} no válido` });
      }
      console.log(`🔍 [DETALLE] Admin consultando detalles del médico ${medicoId} en centro ${centroId}`);
    } else {
      // Para MÉDICO: usar la BD del centro del médico
      targetPool = req.dbPool;
      console.log(`🔍 [DETALLE] Médico consultando sus propios detalles`);
    }

    // Verificar que el médico tenga consultas en el centro (para admin) o pertenezca al centro (para médico)
    let checkQuery: string;
    let checkParams: any[];
    
    if (adminUser) {
      // Para ADMIN: Verificar que el médico tenga consultas en el centro seleccionado
      checkQuery = "SELECT DISTINCT m.id FROM medicos m INNER JOIN consultas c ON c.id_medico = m.id WHERE m.id = ? AND c.id_centro = ?";
      checkParams = [medicoId, centroId];
    } else {
      // Para MÉDICO: Verificar que el médico pertenezca al centro
      checkQuery = "SELECT id FROM medicos WHERE id = ? AND id_centro = ?";
      checkParams = [medicoId, centroId];
    }

    const [check] = await targetPool.query(checkQuery, checkParams);
    // @ts-ignore
    if (!check[0]) {
      return res.status(400).json({ 
        error: adminUser 
          ? "El médico no tiene consultas en el centro indicado" 
          : "El médico no pertenece al centro indicado" 
      });
    }

    const { desde, hasta, q } = req.query as Record<string, string | undefined>;

    const cond: string[] = [`c.id_centro = ?`, `c.id_medico = ?`];
    const params: any[] = [centroId, medicoId];

    if (desde) { cond.push(`c.fecha >= ?`); params.push(`${desde} 00:00:00`); }
    if (hasta) { cond.push(`c.fecha <= ?`); params.push(`${hasta} 23:59:59`); }
    if (q && q.trim() !== "") {
      cond.push(`(c.paciente_nombre LIKE ? OR c.paciente_apellido LIKE ? OR c.motivo LIKE ? OR c.diagnostico LIKE ?)`);
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }

    const sql = `
      SELECT
        c.id,
        c.fecha,
        c.paciente_nombre,
        c.paciente_apellido,
        c.id_paciente,
        p.cedula,
        p.telefono,
        p.email,
        p.fecha_nacimiento,
        p.genero,
        c.motivo,
        c.diagnostico,
        c.tratamiento,
        c.estado,
        c.duracion_minutos
      FROM consultas c
      LEFT JOIN pacientes p ON c.id_paciente = p.id
      WHERE ${cond.join(" AND ")}
      ORDER BY c.fecha DESC, c.id DESC
    `;

    const [rows] = await targetPool.query(sql, params);
    console.log(`✅ [DETALLE] Encontradas ${(rows as any[]).length} consultas para médico ${medicoId} en centro ${centroId}`);
    res.json(rows);
  } catch (err) {
    console.error("[reports] getDetalleConsultasMedico:", err);
    res.status(500).json({ error: "No se pudo obtener el detalle" });
  }
}

/**
 * Estadísticas generales del centro médico.
 * Incluye conteos de médicos, pacientes, consultas, etc.
 */
export async function getEstadisticasGenerales(req: Request, res: Response) {
  try {
    const centroId = getCentroId(req);
    const adminUser = isAdmin(req);
    
    // Si no es admin, requerir X-Centro-Id
    if (!adminUser && !centroId) {
      return res.status(400).json({ error: "X-Centro-Id requerido" });
    }

    const { desde, hasta } = req.query as Record<string, string | undefined>;

    // Si es admin y no hay centroId, obtener estadísticas de todas las bases de datos
    if (adminUser && !centroId) {
      console.log('👑 [REPORTS] Admin detectado - consultando estadísticas de TODAS las bases de datos');
      const allStats = await getAllEstadisticasFromAllDatabases({ desde, hasta });
      console.log('📊 [REPORTS] Estadísticas consolidadas:', allStats);
      return res.json(allStats);
    }

    // Si es admin y hay centroId, consultar solo esa base de datos específica
    if (adminUser && centroId) {
      console.log(`👑 [STATS] Admin detectado - consultando solo centro ${centroId}`);
      const specificStats = await getEstadisticasFromSpecificDatabase(centroId, { desde, hasta });
      console.log('📊 [STATS] Estadísticas calculadas para centro específico');
      return res.json(specificStats);
    }

    // Construir SQL dinámicamente para evitar problemas con parámetros
    let sql = `
      SELECT
        (SELECT COUNT(*) FROM medicos WHERE id_centro = ${centroId}) as total_medicos,
        (SELECT COUNT(*) FROM pacientes WHERE id_centro = ${centroId}) as total_pacientes,
        (SELECT COUNT(*) FROM empleados WHERE id_centro = ${centroId}) as total_empleados
    `;

    // Agregar consultas con filtros de fecha si se proporcionan
    if (desde && hasta) {
      const fechaInicio = `${desde} 00:00:00`;
      const fechaFin = `${hasta} 23:59:59`;
      
      sql += `,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as total_consultas,
        (SELECT COUNT(DISTINCT id_paciente) FROM consultas WHERE id_centro = ${centroId} AND id_paciente IS NOT NULL AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as pacientes_con_consultas,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND estado = 'pendiente' AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as consultas_pendientes,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND estado = 'programada' AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as consultas_programadas,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND estado = 'completada' AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as consultas_completadas,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND estado = 'cancelada' AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as consultas_canceladas,
        (SELECT AVG(duracion_minutos) FROM consultas WHERE id_centro = ${centroId} AND duracion_minutos > 0 AND fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}') as duracion_promedio_minutos
      `;
    } else {
      sql += `,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId}) as total_consultas,
        (SELECT COUNT(DISTINCT id_paciente) FROM consultas WHERE id_centro = ${centroId} AND id_paciente IS NOT NULL) as pacientes_con_consultas,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND estado = 'pendiente') as consultas_pendientes,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND estado = 'programada') as consultas_programadas,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND estado = 'completada') as consultas_completadas,
        (SELECT COUNT(*) FROM consultas WHERE id_centro = ${centroId} AND estado = 'cancelada') as consultas_canceladas,
        (SELECT AVG(duracion_minutos) FROM consultas WHERE id_centro = ${centroId} AND duracion_minutos > 0) as duracion_promedio_minutos
      `;
    }

    console.log('=== DEBUG REPORTES ESTADISTICAS ===');
    console.log('Centro ID:', centroId);
    console.log('Filtros de fecha:', { desde, hasta });
    console.log('SQL Query:', sql);

    const [rows] = await req.dbPool.query(sql);
    res.json(rows[0]);
  } catch (err) {
    console.error("[reports] getEstadisticasGenerales:", err);
    res.status(500).json({ error: "No se pudieron obtener las estadísticas" });
  }
}

// =========================
// Función para obtener pacientes frecuentes de una base de datos específica (solo admin)
// =========================
async function getPacientesFrecuentesFromSpecificDatabase(centroId: number, filters: any = {}) {
  try {
    // Determinar qué base de datos usar según el centroId
    let targetPool;
    
    switch (centroId) {
      case 1:
        targetPool = pools.central;
        break;
      case 2:
        targetPool = pools.guayaquil;
        break;
      case 3:
        targetPool = pools.cuenca;
        break;
      default:
        throw new Error(`Centro ID ${centroId} no válido`);
    }

    console.log(`🔍 [PACIENTES] Consultando pacientes frecuentes para centro ${centroId}`);

    const params: any[] = [centroId, centroId]; // centroId para consultas y pacientes
    let fechaFilter = "";
    
    if (filters.desde && filters.hasta) {
      fechaFilter = "AND c.fecha >= ? AND c.fecha <= ?";
      params.push(`${filters.desde} 00:00:00`, `${filters.hasta} 23:59:59`);
    }

    const limiteNum = Math.min(Number(filters.limite) || 10, 50); // Máximo 50 resultados

    const sql = `
      SELECT
        p.id,
        p.nombres,
        p.apellidos,
        p.cedula,
        p.telefono,
        p.email,
        p.fecha_nacimiento,
        p.genero,
        COUNT(c.id) as total_consultas,
        MIN(c.fecha) as primera_consulta,
        MAX(c.fecha) as ultima_consulta,
        GROUP_CONCAT(DISTINCT m.nombres, ' ', m.apellidos SEPARATOR ', ') as medicos_atendidos
      FROM pacientes p
      INNER JOIN consultas c ON c.id_paciente = p.id AND c.id_centro = ?
      INNER JOIN medicos m ON m.id = c.id_medico
      WHERE p.id_centro = ?
      ${fechaFilter}
      GROUP BY p.id, p.nombres, p.apellidos, p.cedula, p.telefono, p.email, p.fecha_nacimiento, p.genero
      HAVING total_consultas > 0
      ORDER BY total_consultas DESC, p.apellidos ASC, p.nombres ASC
      LIMIT ${limiteNum}
    `;

    const [pacientes] = await targetPool.query(sql, params);
    
    console.log(`✅ [PACIENTES] Encontrados ${(pacientes as any[]).length} pacientes frecuentes en centro ${centroId}`);
    return pacientes as any[];
    
  } catch (error) {
    console.error(`❌ [PACIENTES] Error consultando pacientes frecuentes para centro ${centroId}:`, error);
    throw error;
  }
}

/**
 * Reporte de pacientes más frecuentes del centro.
 * Muestra pacientes con más consultas en el período.
 */
export async function getPacientesFrecuentes(req: Request, res: Response) {
  try {
    const centroId = getCentroId(req);
    const adminUser = isAdmin(req);
    
    // Si no es admin, requerir X-Centro-Id
    if (!adminUser && !centroId) {
      return res.status(400).json({ error: "X-Centro-Id requerido" });
    }

    const { desde, hasta, limite = '10' } = req.query as Record<string, string | undefined>;

    // Si es admin y hay centroId, consultar solo esa base de datos específica
    if (adminUser && centroId) {
      console.log(`👑 [PACIENTES] Admin detectado - consultando solo centro ${centroId}`);
      const specificPacientes = await getPacientesFrecuentesFromSpecificDatabase(centroId, { desde, hasta, limite });
      console.log('📊 [PACIENTES] Pacientes frecuentes encontrados en centro específico:', specificPacientes.length);
      return res.json(specificPacientes);
    }

    const params: any[] = [centroId];
    let fechaFilter = "";
    
    if (desde && hasta) {
      fechaFilter = "AND c.fecha >= ? AND c.fecha <= ?";
      params.push(`${desde} 00:00:00`, `${hasta} 23:59:59`);
    }

    const limiteNum = Math.min(Number(limite) || 10, 50); // Máximo 50 resultados

    const sql = `
      SELECT
        p.id,
        p.nombres,
        p.apellidos,
        p.cedula,
        p.telefono,
        p.email,
        p.fecha_nacimiento,
        p.genero,
        COUNT(c.id) as total_consultas,
        MIN(c.fecha) as primera_consulta,
        MAX(c.fecha) as ultima_consulta,
        GROUP_CONCAT(DISTINCT CONCAT(m.nombres, ' ', m.apellidos) SEPARATOR ', ') as medicos_atendidos
      FROM pacientes p
      INNER JOIN consultas c ON p.id = c.id_paciente
      LEFT JOIN medicos m ON c.id_medico = m.id
      WHERE p.id_centro = ? ${fechaFilter}
      GROUP BY p.id, p.nombres, p.apellidos, p.cedula, p.telefono, p.email, p.fecha_nacimiento, p.genero
      ORDER BY total_consultas DESC, p.apellidos ASC, p.nombres ASC
      LIMIT ?
    `;
    
    params.push(limiteNum);

    const [rows] = await req.dbPool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("[reports] getPacientesFrecuentes:", err);
    res.status(500).json({ error: "No se pudo obtener el reporte de pacientes" });
  }
}
