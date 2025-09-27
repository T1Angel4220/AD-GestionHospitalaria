// src/controllers/reports.controller.ts
import { Request, Response } from "express";
import jwt from 'jsonwebtoken';

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
    if (!centroId) return res.status(400).json({ error: "X-Centro-Id requerido" });

    const { desde, hasta, q } = req.query as Record<string, string | undefined>;
    const adminUser = isAdmin(req);

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
    if (!centroId) return res.status(400).json({ error: "X-Centro-Id requerido" });

    const medicoId = Number(req.params.medicoId);
    if (!Number.isFinite(medicoId) || medicoId <= 0) {
      return res.status(400).json({ error: "medicoId inválido" });
    }

    const adminUser = isAdmin(req);

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

    const [check] = await req.dbPool.query(checkQuery, checkParams);
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

    const [rows] = await req.dbPool.query(sql, params);
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
    if (!centroId) return res.status(400).json({ error: "X-Centro-Id requerido" });

    const { desde, hasta } = req.query as Record<string, string | undefined>;

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

/**
 * Reporte de pacientes más frecuentes del centro.
 * Muestra pacientes con más consultas en el período.
 */
export async function getPacientesFrecuentes(req: Request, res: Response) {
  try {
    const centroId = getCentroId(req);
    if (!centroId) return res.status(400).json({ error: "X-Centro-Id requerido" });

    const { desde, hasta, limite = '10' } = req.query as Record<string, string | undefined>;

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
