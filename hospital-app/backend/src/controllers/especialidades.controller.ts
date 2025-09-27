import { Request, Response } from "express";
import { pools } from "../config/distributedDb";

// Extender el tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        rol: 'admin' | 'medico';
        id_centro: number;
        id_medico?: number;
      };
    }
  }
}

// =========================
// Función para obtener especialidades de todas las bases de datos (solo admin)
// =========================
async function getAllEspecialidadesFromAllDatabases() {
  const allEspecialidades: any[] = [];
  
  try {
    // Consultar BD Central (Quito)
    const [centralEspecialidades] = await pools.central.query(`
      SELECT id, nombre
      FROM especialidades
      ORDER BY id ASC
    `);
    
    // Agregar origen_bd e id_frontend para Central
    const centralWithOrigin = (centralEspecialidades as any[]).map(esp => ({
      ...esp,
      origen_bd: 'central',
      id_unico: `central-${esp.id}`,
      id_frontend: `central-${esp.id}`
    }));
    
    allEspecialidades.push(...centralWithOrigin);
    
    // Consultar BD Guayaquil
    try {
      const [guayaquilEspecialidades] = await pools.guayaquil.query(`
        SELECT id, nombre
        FROM especialidades
        ORDER BY id ASC
      `);
      
      // Agregar origen_bd e id_frontend para Guayaquil
      const guayaquilWithOrigin = (guayaquilEspecialidades as any[]).map(esp => ({
        ...esp,
        origen_bd: 'guayaquil',
        id_unico: `guayaquil-${esp.id}`,
        id_frontend: `guayaquil-${esp.id}`
      }));
      
      allEspecialidades.push(...guayaquilWithOrigin);
    } catch (error) {
      console.log('⚠️ No se pudo conectar a BD Guayaquil:', error);
    }
    
    // Consultar BD Cuenca
    try {
      const [cuencaEspecialidades] = await pools.cuenca.query(`
        SELECT id, nombre
        FROM especialidades
        ORDER BY id ASC
      `);
      
      // Agregar origen_bd e id_frontend para Cuenca
      const cuencaWithOrigin = (cuencaEspecialidades as any[]).map(esp => ({
        ...esp,
        origen_bd: 'cuenca',
        id_unico: `cuenca-${esp.id}`,
        id_frontend: `cuenca-${esp.id}`
      }));
      
      allEspecialidades.push(...cuencaWithOrigin);
    } catch (error) {
      console.log('⚠️ No se pudo conectar a BD Cuenca:', error);
    }
    
  } catch (error) {
    console.error('❌ Error consultando todas las bases de datos:', error);
    throw error;
  }
  
  return allEspecialidades.sort((a, b) => a.id_frontend.localeCompare(b.id_frontend));
}

// =========================
// GET /api/admin/especialidades
// =========================
export async function list(req: Request, res: Response) {
  try {
    // Verificar si es admin para mostrar todas las especialidades
    const token = req.headers.authorization?.replace('Bearer ', '');
    let isAdmin = false;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        isAdmin = decoded.rol === 'admin';
        console.log('🔍 [ESPECIALIDADES] Usuario:', decoded.email, 'Rol:', decoded.rol, 'Es Admin:', isAdmin);
      } catch (error) {
        console.error('❌ Error decodificando token:', error);
      }
    }
    
    let especialidades;
    
    if (isAdmin) {
      // Admin: obtener especialidades de TODAS las bases de datos
      console.log('👑 [ESPECIALIDADES] Admin detectado - consultando TODAS las bases de datos');
      especialidades = await getAllEspecialidadesFromAllDatabases();
      console.log('📊 [ESPECIALIDADES] Total especialidades encontradas:', especialidades.length);
    } else {
      // Médico: obtener especialidades solo de su base de datos
      console.log('👨‍⚕️ [ESPECIALIDADES] Médico detectado - consultando BD local');
      const [result] = await req.dbPool.query(`
        SELECT id, nombre
        FROM especialidades
        ORDER BY id ASC
      `);
      especialidades = result;
    }
    
    res.json(especialidades);
  } catch (err) {
    console.error("[ERROR] listando especialidades:", err);
    res.status(500).json({ error: "Error interno al listar especialidades" });
  }
}

// =========================
// GET /api/admin/especialidades/:id
// =========================
export async function getOne(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const especialidades = await req.dbPool.query(`
      SELECT id, nombre
      FROM especialidades
      WHERE id = ?
    `, [id]);

    if (especialidades.length === 0) return res.status(404).json({ error: "Especialidad no encontrada" });

    res.json(especialidades[0]);
  } catch (err) {
    console.error("[ERROR] obteniendo especialidad:", err);
    res.status(500).json({ error: "Error interno" });
  }
}

// =========================
// POST /api/admin/especialidades
// =========================
export async function create(req: Request, res: Response) {
  try {
    const { nombre, id_centro } = req.body ?? {};

    if (!nombre?.trim()) {
      return res.status(400).json({ error: "nombre es obligatorio" });
    }

    // Verificar si es admin usando el token directamente
    const token = req.headers.authorization?.replace('Bearer ', '');
    let isAdmin = false;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        isAdmin = decoded.rol === 'admin';
        console.log('🔍 [CREATE ESPECIALIDADES] Verificación de rol:', { email: decoded.email, rol: decoded.rol, isAdmin });
      } catch (error) {
        console.error('❌ Error decodificando token:', error);
      }
    }

    if (isAdmin) {
      // Admin: crear especialidad en centro específico o en TODAS las bases de datos
      if (id_centro) {
        // Crear en centro específico
        console.log('👑 [CREATE] Admin creando especialidad en centro específico:', id_centro, 'Nombre:', nombre.trim());
        
        let targetDbPool: any;
        if (id_centro === 1) {
          targetDbPool = pools.central;
        } else if (id_centro === 2) {
          targetDbPool = pools.guayaquil;
        } else if (id_centro === 3) {
          targetDbPool = pools.cuenca;
        } else {
          return res.status(400).json({ error: "Centro inválido" });
        }
        
        // Validar que el centro existe
        const centros = await targetDbPool.query("SELECT id FROM centros_medicos WHERE id = ?", [id_centro]);
        if (centros.length === 0) return res.status(400).json({ error: "El centro especificado no existe" });
        
        const [result] = await targetDbPool.execute(`
          INSERT INTO especialidades (nombre) 
          VALUES (?)
        `, [nombre.trim()]);

        const created = {
          id: (result as any).insertId,
          nombre: nombre.trim(),
          id_centro: id_centro,
          created_in_database: id_centro === 1 ? 'Central' : id_centro === 2 ? 'Guayaquil' : 'Cuenca'
        };

        res.status(201).json(created);
      } else {
        // Crear en TODAS las bases de datos (comportamiento original)
      console.log('👑 [CREATE] Admin creando especialidad en TODAS las bases de datos:', nombre.trim());
      
      const results: any[] = [];
      let insertId: number | null = null;
      
      // Crear en BD Central
      try {
        const [centralResult] = await pools.central.execute(`
          INSERT INTO especialidades (nombre) 
          VALUES (?)
        `, [nombre.trim()]);
        results.push({ db: 'central', success: true, insertId: (centralResult as any).insertId });
        insertId = (centralResult as any).insertId; // Usar el ID de la BD central como referencia
        console.log('✅ [CREATE] Especialidad creada en BD Central, ID:', (centralResult as any).insertId);
      } catch (error: any) {
        console.error('❌ [CREATE] Error en BD Central:', error);
        results.push({ db: 'central', success: false, error: error.message });
      }
      
      // Crear en BD Guayaquil
      try {
        const [guayaquilResult] = await pools.guayaquil.execute(`
          INSERT INTO especialidades (nombre) 
          VALUES (?)
        `, [nombre.trim()]);
        results.push({ db: 'guayaquil', success: true, insertId: (guayaquilResult as any).insertId });
        console.log('✅ [CREATE] Especialidad creada en BD Guayaquil, ID:', (guayaquilResult as any).insertId);
      } catch (error: any) {
        console.error('❌ [CREATE] Error en BD Guayaquil:', error);
        results.push({ db: 'guayaquil', success: false, error: error.message });
      }
      
      // Crear en BD Cuenca
      try {
        const [cuencaResult] = await pools.cuenca.execute(`
          INSERT INTO especialidades (nombre) 
          VALUES (?)
        `, [nombre.trim()]);
        results.push({ db: 'cuenca', success: true, insertId: (cuencaResult as any).insertId });
        console.log('✅ [CREATE] Especialidad creada en BD Cuenca, ID:', (cuencaResult as any).insertId);
      } catch (error: any) {
        console.error('❌ [CREATE] Error en BD Cuenca:', error);
        results.push({ db: 'cuenca', success: false, error: error.message });
      }
      
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      
      if (successCount === 0) {
        return res.status(500).json({ 
          error: "No se pudo crear la especialidad en ninguna base de datos",
          details: results
        });
      }
      
      const created = {
        id: insertId,
        nombre: nombre.trim(),
        created_in_databases: successCount,
        total_databases: totalCount,
        details: results
      };

      res.status(201).json(created);
      }
    } else {
      // Médico: crear solo en su base de datos
      console.log('👨‍⚕️ [CREATE] Médico creando especialidad en su BD local:', nombre.trim());
      
      const result = await req.dbPool.execute(`
        INSERT INTO especialidades (nombre) 
        VALUES (?)
      `, [nombre.trim()]);

      const created = {
        id: result.insertId,
        nombre: nombre.trim()
      };

      res.status(201).json(created);
    }
  } catch (err: any) {
    console.error("[ERROR] creando especialidad:", err);
    
    // Verificar si es error de constraint único
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: "nombre ya existe" });
    }
    
    res.status(500).json({ error: "Error interno al crear especialidad" });
  }
}

// =========================
// PUT /api/admin/especialidades/:id
// =========================
export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const { nombre, id_centro, origen_bd } = req.body ?? {};

    if (nombre === undefined && id_centro === undefined) {
      return res.status(400).json({ error: "Debe enviar al menos un campo para actualizar" });
    }

    // Verificar si es admin usando el token directamente
    const token = req.headers.authorization?.replace('Bearer ', '');
    let isAdmin = false;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        isAdmin = decoded.rol === 'admin';
        console.log('🔍 [UPDATE ESPECIALIDADES] Verificación de rol:', { email: decoded.email, rol: decoded.rol, isAdmin });
      } catch (error) {
        console.error('❌ Error decodificando token:', error);
      }
    }

    if (isAdmin) {
      // Admin: verificar si hay cambio de centro
      if (id_centro && origen_bd) {
        console.log('🔄 [UPDATE] Cambio de centro detectado:', { id, origen_bd, newCentroId: id_centro });
        
        // Buscar la especialidad en la BD original
        let sourceDbPool: any;
        if (origen_bd === 'central') {
          sourceDbPool = pools.central;
        } else if (origen_bd === 'guayaquil') {
          sourceDbPool = pools.guayaquil;
        } else if (origen_bd === 'cuenca') {
          sourceDbPool = pools.cuenca;
        } else {
          return res.status(400).json({ error: "Origen de base de datos inválido" });
        }
        
        // Obtener datos de la especialidad original
        const [especialidadData] = await sourceDbPool.query(`
          SELECT id, nombre
          FROM especialidades
          WHERE id = ?
        `, [id]);
        
        if (especialidadData.length === 0) {
          return res.status(404).json({ error: "Especialidad no encontrada en la base de datos original" });
        }
        
        const especialidad = especialidadData[0];
        const newNombre = nombre?.trim() || especialidad.nombre;
        
        // Seleccionar BD destino
        let targetDbPool: any;
        if (id_centro === 1) {
          targetDbPool = pools.central;
        } else if (id_centro === 2) {
          targetDbPool = pools.guayaquil;
        } else if (id_centro === 3) {
          targetDbPool = pools.cuenca;
        } else {
          return res.status(400).json({ error: "Centro destino inválido" });
        }
        
        // Validar que el centro destino existe
        const centros = await targetDbPool.query("SELECT id FROM centros_medicos WHERE id = ?", [id_centro]);
        if (centros.length === 0) return res.status(400).json({ error: "El centro destino no existe" });
        
        // Crear especialidad en BD destino
        console.log('🔄 [UPDATE] Creando especialidad en BD destino:', {
          nombre: newNombre,
          id_centro,
          targetDb: id_centro === 1 ? 'Central' : id_centro === 2 ? 'Guayaquil' : 'Cuenca'
        });
        
        let newEspecialidadId;
        try {
          const [newEspecialidadResult] = await targetDbPool.execute(`
            INSERT INTO especialidades (nombre) 
            VALUES (?)
          `, [newNombre]);
          
          newEspecialidadId = (newEspecialidadResult as any).insertId;
          console.log('✅ [UPDATE] Especialidad creada en BD destino, ID:', newEspecialidadId);
        } catch (createError: any) {
          console.error('❌ [UPDATE] Error creando especialidad en BD destino:', createError);
          return res.status(500).json({ error: "Error al crear especialidad en el nuevo centro: " + createError.message });
        }
        
        // Eliminar especialidad de BD original
        try {
          console.log('🗑️ [UPDATE] Eliminando especialidad de BD original, ID:', id, 'BD:', origen_bd);
          const [deleteResult] = await sourceDbPool.execute(`
            DELETE FROM especialidades WHERE id = ?
          `, [id]);
          
          console.log('🗑️ [UPDATE] Especialidad eliminada de BD original, filas afectadas:', (deleteResult as any).affectedRows);
        } catch (deleteError: any) {
          console.error('❌ [UPDATE] Error eliminando especialidad de BD original:', deleteError);
          // Rollback: eliminar la especialidad creada en el destino
          try {
            await targetDbPool.execute("DELETE FROM especialidades WHERE id = ?", [newEspecialidadId]);
            console.log('🔄 [UPDATE] Rollback: Especialidad eliminada del destino');
          } catch (rollbackError) {
            console.error('❌ [UPDATE] Error en rollback:', rollbackError);
          }
          return res.status(500).json({ error: "Error al eliminar especialidad del centro original" });
        }
        
        const updated = {
          id: newEspecialidadId,
          nombre: newNombre,
          id_centro: id_centro,
          origen_bd: id_centro === 1 ? 'central' : id_centro === 2 ? 'guayaquil' : 'cuenca',
          id_frontend: `${id_centro === 1 ? 'central' : id_centro === 2 ? 'guayaquil' : 'cuenca'}-${newEspecialidadId}`,
          moved_from: origen_bd,
          moved_to: id_centro === 1 ? 'central' : id_centro === 2 ? 'guayaquil' : 'cuenca'
        };

        res.json(updated);
      } else {
        // Actualización normal (solo nombre) en TODAS las bases de datos
      console.log('👑 [UPDATE] Admin actualizando especialidad en TODAS las bases de datos, ID:', id);
      
      const results: any[] = [];
      let totalAffectedRows = 0;
      
      // Actualizar en BD Central
      try {
        const [centralResult] = await pools.central.execute(`
          UPDATE especialidades 
          SET nombre = ?
          WHERE id = ?
        `, [nombre.trim(), id]);
        results.push({ db: 'central', success: true, affectedRows: (centralResult as any).affectedRows });
        totalAffectedRows += (centralResult as any).affectedRows;
        console.log('✅ [UPDATE] Especialidad actualizada en BD Central, filas afectadas:', (centralResult as any).affectedRows);
      } catch (error: any) {
        console.error('❌ [UPDATE] Error en BD Central:', error);
        results.push({ db: 'central', success: false, error: error.message });
      }
      
      // Actualizar en BD Guayaquil
      try {
        const [guayaquilResult] = await pools.guayaquil.execute(`
          UPDATE especialidades 
          SET nombre = ?
          WHERE id = ?
        `, [nombre.trim(), id]);
        results.push({ db: 'guayaquil', success: true, affectedRows: (guayaquilResult as any).affectedRows });
        totalAffectedRows += (guayaquilResult as any).affectedRows;
        console.log('✅ [UPDATE] Especialidad actualizada en BD Guayaquil, filas afectadas:', (guayaquilResult as any).affectedRows);
      } catch (error: any) {
        console.error('❌ [UPDATE] Error en BD Guayaquil:', error);
        results.push({ db: 'guayaquil', success: false, error: error.message });
      }
      
      // Actualizar en BD Cuenca
      try {
        const [cuencaResult] = await pools.cuenca.execute(`
          UPDATE especialidades 
          SET nombre = ?
          WHERE id = ?
        `, [nombre.trim(), id]);
        results.push({ db: 'cuenca', success: true, affectedRows: (cuencaResult as any).affectedRows });
        totalAffectedRows += (cuencaResult as any).affectedRows;
        console.log('✅ [UPDATE] Especialidad actualizada en BD Cuenca, filas afectadas:', (cuencaResult as any).affectedRows);
      } catch (error: any) {
        console.error('❌ [UPDATE] Error en BD Cuenca:', error);
        results.push({ db: 'cuenca', success: false, error: error.message });
      }
      
      if (totalAffectedRows === 0) {
        return res.status(404).json({ 
          error: "Especialidad no encontrada en ninguna base de datos",
          details: results
        });
      }
      
      const updated = {
        id,
        nombre: nombre.trim(),
        updated_in_databases: results.filter(r => r.success).length,
        total_databases: results.length,
        total_affected_rows: totalAffectedRows,
        details: results
      };

      res.json(updated);
      }
    } else {
      // Médico: actualizar solo en su base de datos
      console.log('👨‍⚕️ [UPDATE] Médico actualizando especialidad en su BD local, ID:', id);
      
      const result = await req.dbPool.execute(`
        UPDATE especialidades 
        SET nombre = ?
        WHERE id = ?
      `, [nombre.trim(), id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Especialidad no encontrada" });
      }

      const updated = {
        id,
        nombre: nombre.trim()
      };

      res.json(updated);
    }
  } catch (err: any) {
    console.error("[ERROR] actualizando especialidad:", err);
    
    // Verificar si es error de constraint único
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: "nombre ya existe" });
    }
    
    res.status(500).json({ error: "Error interno al actualizar especialidad" });
  }
}

// =========================
// DELETE /api/admin/especialidades/:id
// =========================
export async function remove(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    // Verificar si es admin usando el token directamente
    const token = req.headers.authorization?.replace('Bearer ', '');
    let isAdmin = false;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        isAdmin = decoded.rol === 'admin';
        console.log('🔍 [DELETE ESPECIALIDADES] Verificación de rol:', { email: decoded.email, rol: decoded.rol, isAdmin });
      } catch (error) {
        console.error('❌ Error decodificando token:', error);
      }
    }

    if (isAdmin) {
      // Admin: eliminar especialidad de TODAS las bases de datos
      console.log('👑 [DELETE] Admin eliminando especialidad de TODAS las bases de datos, ID:', id);
      
      const results: any[] = [];
      let totalAffectedRows = 0;
      
      // Eliminar de BD Central
      try {
        const [centralResult] = await pools.central.execute("DELETE FROM especialidades WHERE id = ?", [id]);
        results.push({ db: 'central', success: true, affectedRows: (centralResult as any).affectedRows });
        totalAffectedRows += (centralResult as any).affectedRows;
        console.log('✅ [DELETE] Especialidad eliminada de BD Central, filas afectadas:', (centralResult as any).affectedRows);
      } catch (error: any) {
        console.error('❌ [DELETE] Error en BD Central:', error);
        results.push({ db: 'central', success: false, error: error.message });
      }
      
      // Eliminar de BD Guayaquil
      try {
        const [guayaquilResult] = await pools.guayaquil.execute("DELETE FROM especialidades WHERE id = ?", [id]);
        results.push({ db: 'guayaquil', success: true, affectedRows: (guayaquilResult as any).affectedRows });
        totalAffectedRows += (guayaquilResult as any).affectedRows;
        console.log('✅ [DELETE] Especialidad eliminada de BD Guayaquil, filas afectadas:', (guayaquilResult as any).affectedRows);
      } catch (error: any) {
        console.error('❌ [DELETE] Error en BD Guayaquil:', error);
        results.push({ db: 'guayaquil', success: false, error: error.message });
      }
      
      // Eliminar de BD Cuenca
      try {
        const [cuencaResult] = await pools.cuenca.execute("DELETE FROM especialidades WHERE id = ?", [id]);
        results.push({ db: 'cuenca', success: true, affectedRows: (cuencaResult as any).affectedRows });
        totalAffectedRows += (cuencaResult as any).affectedRows;
        console.log('✅ [DELETE] Especialidad eliminada de BD Cuenca, filas afectadas:', (cuencaResult as any).affectedRows);
      } catch (error: any) {
        console.error('❌ [DELETE] Error en BD Cuenca:', error);
        results.push({ db: 'cuenca', success: false, error: error.message });
      }
      
      if (totalAffectedRows === 0) {
        return res.status(404).json({ 
          error: "Especialidad no encontrada en ninguna base de datos",
          details: results
        });
      }
      
      const deleted = {
        id,
        deleted_from_databases: results.filter(r => r.success).length,
        total_databases: results.length,
        total_affected_rows: totalAffectedRows,
        details: results
      };

      res.json(deleted);
    } else {
      // Médico: eliminar solo de su base de datos
      console.log('👨‍⚕️ [DELETE] Médico eliminando especialidad de su BD local, ID:', id);
      
      const result = await req.dbPool.execute("DELETE FROM especialidades WHERE id = ?", [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Especialidad no encontrada" });
      }

      res.status(204).send();
    }
  } catch (err) {
    console.error("[ERROR] eliminando especialidad:", err);
    res.status(500).json({ error: "Error interno al eliminar especialidad" });
  }
}
