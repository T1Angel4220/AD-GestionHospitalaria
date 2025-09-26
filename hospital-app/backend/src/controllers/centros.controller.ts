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
// Función para obtener centros de todas las bases de datos (solo admin)
// =========================
async function getAllCentrosFromAllDatabases() {
  const allCentros: any[] = [];
  
  try {
    // Consultar BD Central (Quito)
    const [centralCentros] = await pools.central.query(`
      SELECT id, nombre, ciudad, direccion
      FROM centros_medicos
      ORDER BY id ASC
    `);
    
    allCentros.push(...(centralCentros as any[]));
    
    // Consultar BD Guayaquil
    try {
      const [guayaquilCentros] = await pools.guayaquil.query(`
        SELECT id, nombre, ciudad, direccion
        FROM centros_medicos
        ORDER BY id ASC
      `);
      
      allCentros.push(...(guayaquilCentros as any[]));
    } catch (error) {
      console.log('⚠️ No se pudo conectar a BD Guayaquil:', error);
    }
    
    // Consultar BD Cuenca
    try {
      const [cuencaCentros] = await pools.cuenca.query(`
        SELECT id, nombre, ciudad, direccion
        FROM centros_medicos
        ORDER BY id ASC
      `);
      
      allCentros.push(...(cuencaCentros as any[]));
    } catch (error) {
      console.log('⚠️ No se pudo conectar a BD Cuenca:', error);
    }
    
  } catch (error) {
    console.error('❌ Error consultando todas las bases de datos:', error);
    throw error;
  }
  
  // Eliminar duplicados por ID y ordenar
  const uniqueCentros = allCentros.filter((centro, index, self) => 
    index === self.findIndex(c => c.id === centro.id)
  );
  
  return uniqueCentros.sort((a, b) => a.id - b.id);
}

// =========================
// GET /api/admin/centros
// =========================
export async function list(req: Request, res: Response) {
  try {
    // Verificar si es admin para mostrar todos los centros
    const token = req.headers.authorization?.replace('Bearer ', '');
    let isAdmin = false;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        isAdmin = decoded.rol === 'admin';
        console.log('🔍 [CENTROS] Usuario:', decoded.email, 'Rol:', decoded.rol, 'Es Admin:', isAdmin);
      } catch (error) {
        console.error('❌ Error decodificando token:', error);
      }
    }
    
    let centros;
    
    if (isAdmin) {
      // Admin: obtener centros de TODAS las bases de datos
      console.log('👑 [CENTROS] Admin detectado - consultando TODAS las bases de datos');
      centros = await getAllCentrosFromAllDatabases();
      console.log('📊 [CENTROS] Total centros encontrados:', centros.length);
    } else {
      // Médico: obtener centros solo de su base de datos
      console.log('👨‍⚕️ [CENTROS] Médico detectado - consultando BD local');
      const [result] = await req.dbPool.query(`
        SELECT id, nombre, ciudad, direccion
        FROM centros_medicos
        ORDER BY id ASC
      `);
      centros = result;
    }
    
    res.json(centros);
  } catch (err) {
    console.error("[ERROR] listando centros:", err);
    res.status(500).json({ error: "Error interno al listar centros" });
  }
}

// =========================
// GET /api/admin/centros/:id
// =========================
export async function getOne(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const [centros] = await req.dbPool.query(`
      SELECT id, nombre, ciudad, direccion
      FROM centros_medicos
      WHERE id = ?
    `, [id]);

    if ((centros as any[]).length === 0) return res.status(404).json({ error: "Centro no encontrado" });

    res.json((centros as any[])[0]);
  } catch (err) {
    console.error("[ERROR] obteniendo centro:", err);
    res.status(500).json({ error: "Error interno" });
  }
}

// =========================
// POST /api/admin/centros
// =========================
export async function create(req: Request, res: Response) {
  try {
    const { nombre, ciudad, direccion } = req.body ?? {};

    if (!nombre?.trim() || !ciudad?.trim()) {
      return res.status(400).json({ error: "nombre y ciudad son obligatorios" });
    }

    if (req.user?.rol === 'admin') {
      // Admin: crear centro en TODAS las bases de datos
      console.log('👑 [CREATE] Admin creando centro en TODAS las bases de datos:', nombre.trim());
      
      const results: any[] = [];
      let insertId: number | null = null;
      
      // Crear en BD Central
      try {
        const [centralResult] = await pools.central.execute(`
          INSERT INTO centros_medicos (nombre, ciudad, direccion) 
          VALUES (?, ?, ?)
        `, [nombre.trim(), ciudad.trim(), direccion?.trim() || null]);
        results.push({ db: 'central', success: true, insertId: (centralResult as any).insertId });
        insertId = (centralResult as any).insertId; // Usar el ID de la BD central como referencia
        console.log('✅ [CREATE] Centro creado en BD Central, ID:', (centralResult as any).insertId);
      } catch (error: any) {
        console.error('❌ [CREATE] Error en BD Central:', error);
        results.push({ db: 'central', success: false, error: error.message });
      }
      
      // Crear en BD Guayaquil
      try {
        const [guayaquilResult] = await pools.guayaquil.execute(`
          INSERT INTO centros_medicos (nombre, ciudad, direccion) 
          VALUES (?, ?, ?)
        `, [nombre.trim(), ciudad.trim(), direccion?.trim() || null]);
        results.push({ db: 'guayaquil', success: true, insertId: (guayaquilResult as any).insertId });
        console.log('✅ [CREATE] Centro creado en BD Guayaquil, ID:', (guayaquilResult as any).insertId);
      } catch (error: any) {
        console.error('❌ [CREATE] Error en BD Guayaquil:', error);
        results.push({ db: 'guayaquil', success: false, error: error.message });
      }
      
      // Crear en BD Cuenca
      try {
        const [cuencaResult] = await pools.cuenca.execute(`
          INSERT INTO centros_medicos (nombre, ciudad, direccion) 
          VALUES (?, ?, ?)
        `, [nombre.trim(), ciudad.trim(), direccion?.trim() || null]);
        results.push({ db: 'cuenca', success: true, insertId: (cuencaResult as any).insertId });
        console.log('✅ [CREATE] Centro creado en BD Cuenca, ID:', (cuencaResult as any).insertId);
      } catch (error: any) {
        console.error('❌ [CREATE] Error en BD Cuenca:', error);
        results.push({ db: 'cuenca', success: false, error: error.message });
      }
      
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      
      if (successCount === 0) {
        return res.status(500).json({ 
          error: "No se pudo crear el centro en ninguna base de datos",
          details: results
        });
      }
      
      const created = {
        id: insertId,
        nombre: nombre.trim(),
        ciudad: ciudad.trim(),
        direccion: direccion?.trim() || null,
        created_in_databases: successCount,
        total_databases: totalCount,
        details: results
      };

      res.status(201).json(created);
    } else {
      // Médico: crear solo en su base de datos
      console.log('👨‍⚕️ [CREATE] Médico creando centro en su BD local:', nombre.trim());
      
      const [result] = await req.dbPool.execute(`
        INSERT INTO centros_medicos (nombre, ciudad, direccion) 
        VALUES (?, ?, ?)
      `, [nombre.trim(), ciudad.trim(), direccion?.trim() || null]);

      const created = {
        id: (result as any).insertId,
        nombre: nombre.trim(),
        ciudad: ciudad.trim(),
        direccion: direccion?.trim() || null
      };

      res.status(201).json(created);
    }
  } catch (err) {
    console.error("[ERROR] creando centro:", err);
    res.status(500).json({ error: "Error interno al crear centro" });
  }
}

// =========================
// PUT /api/admin/centros/:id
// =========================
export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const { nombre, ciudad, direccion } = req.body ?? {};

    // Construir objeto dinámico con los campos presentes
    const updates: string[] = [];
    const values: any[] = [];

    if (nombre !== undefined) {
      updates.push("nombre = ?");
      values.push(nombre.trim());
    }
    if (ciudad !== undefined) {
      updates.push("ciudad = ?");
      values.push(ciudad.trim());
    }
    if (direccion !== undefined) {
      updates.push("direccion = ?");
      values.push(direccion?.trim() || null);
    }

    if (updates.length === 0) {
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
        console.log('🔍 [UPDATE CENTROS] Verificación de rol:', { email: decoded.email, rol: decoded.rol, isAdmin });
      } catch (error) {
        console.error('❌ Error decodificando token:', error);
      }
    }
    
    if (isAdmin) {
      // Admin: actualizar centro en TODAS las bases de datos
      console.log('👑 [UPDATE] Admin actualizando centro en TODAS las bases de datos, ID:', id);
      
      const results: any[] = [];
      let totalAffectedRows = 0;
      
      // Actualizar en BD Central
      try {
        const [centralResult] = await pools.central.execute(`
          UPDATE centros_medicos 
          SET ${updates.join(", ")}
          WHERE id = ?
        `, [...values, id]);
        results.push({ db: 'central', success: true, affectedRows: (centralResult as any).affectedRows });
        totalAffectedRows += (centralResult as any).affectedRows;
        console.log('✅ [UPDATE] Centro actualizado en BD Central, filas afectadas:', (centralResult as any).affectedRows);
      } catch (error: any) {
        console.error('❌ [UPDATE] Error en BD Central:', error);
        results.push({ db: 'central', success: false, error: error.message });
      }
      
      // Actualizar en BD Guayaquil
      try {
        const [guayaquilResult] = await pools.guayaquil.execute(`
          UPDATE centros_medicos 
          SET ${updates.join(", ")}
          WHERE id = ?
        `, [...values, id]);
        results.push({ db: 'guayaquil', success: true, affectedRows: (guayaquilResult as any).affectedRows });
        totalAffectedRows += (guayaquilResult as any).affectedRows;
        console.log('✅ [UPDATE] Centro actualizado en BD Guayaquil, filas afectadas:', (guayaquilResult as any).affectedRows);
      } catch (error: any) {
        console.error('❌ [UPDATE] Error en BD Guayaquil:', error);
        results.push({ db: 'guayaquil', success: false, error: error.message });
      }
      
      // Actualizar en BD Cuenca
      try {
        const [cuencaResult] = await pools.cuenca.execute(`
          UPDATE centros_medicos 
          SET ${updates.join(", ")}
          WHERE id = ?
        `, [...values, id]);
        results.push({ db: 'cuenca', success: true, affectedRows: (cuencaResult as any).affectedRows });
        totalAffectedRows += (cuencaResult as any).affectedRows;
        console.log('✅ [UPDATE] Centro actualizado en BD Cuenca, filas afectadas:', (cuencaResult as any).affectedRows);
      } catch (error: any) {
        console.error('❌ [UPDATE] Error en BD Cuenca:', error);
        results.push({ db: 'cuenca', success: false, error: error.message });
      }
      
      if (totalAffectedRows === 0) {
        return res.status(404).json({ 
          error: "Centro no encontrado en ninguna base de datos",
          details: results
        });
      }
      
      const updated = {
        id,
        nombre: nombre?.trim(),
        ciudad: ciudad?.trim(),
        direccion: direccion?.trim() || null,
        updated_in_databases: results.filter(r => r.success).length,
        total_databases: results.length,
        total_affected_rows: totalAffectedRows,
        details: results
      };

      res.json(updated);
    } else {
      // Médico: actualizar solo en su base de datos
      console.log('👨‍⚕️ [UPDATE] Médico actualizando centro en su BD local, ID:', id);
      
      const [result] = await req.dbPool.execute(`
        UPDATE centros_medicos 
        SET ${updates.join(", ")}
        WHERE id = ?
      `, [...values, id]);

      if ((result as any).affectedRows === 0) {
        return res.status(404).json({ error: "Centro no encontrado" });
      }

      const updated = {
        id,
        nombre: nombre?.trim(),
        ciudad: ciudad?.trim(),
        direccion: direccion?.trim() || null
      };

      res.json(updated);
    }
  } catch (err) {
    console.error("[ERROR] actualizando centro:", err);
    res.status(500).json({ error: "Error interno al actualizar centro" });
  }
}

// =========================
// DELETE /api/admin/centros/:id
// =========================
export async function remove(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    if (req.user?.rol === 'admin') {
      // Admin: eliminar centro de TODAS las bases de datos
      console.log('👑 [DELETE] Admin eliminando centro de TODAS las bases de datos, ID:', id);
      
      const results: any[] = [];
      let totalAffectedRows = 0;
      
      // Eliminar de BD Central
      try {
        const [centralResult] = await pools.central.execute("DELETE FROM centros_medicos WHERE id = ?", [id]);
        results.push({ db: 'central', success: true, affectedRows: (centralResult as any).affectedRows });
        totalAffectedRows += (centralResult as any).affectedRows;
        console.log('✅ [DELETE] Centro eliminado de BD Central, filas afectadas:', (centralResult as any).affectedRows);
      } catch (error: any) {
        console.error('❌ [DELETE] Error en BD Central:', error);
        results.push({ db: 'central', success: false, error: error.message });
      }
      
      // Eliminar de BD Guayaquil
      try {
        const [guayaquilResult] = await pools.guayaquil.execute("DELETE FROM centros_medicos WHERE id = ?", [id]);
        results.push({ db: 'guayaquil', success: true, affectedRows: (guayaquilResult as any).affectedRows });
        totalAffectedRows += (guayaquilResult as any).affectedRows;
        console.log('✅ [DELETE] Centro eliminado de BD Guayaquil, filas afectadas:', (guayaquilResult as any).affectedRows);
      } catch (error: any) {
        console.error('❌ [DELETE] Error en BD Guayaquil:', error);
        results.push({ db: 'guayaquil', success: false, error: error.message });
      }
      
      // Eliminar de BD Cuenca
      try {
        const [cuencaResult] = await pools.cuenca.execute("DELETE FROM centros_medicos WHERE id = ?", [id]);
        results.push({ db: 'cuenca', success: true, affectedRows: (cuencaResult as any).affectedRows });
        totalAffectedRows += (cuencaResult as any).affectedRows;
        console.log('✅ [DELETE] Centro eliminado de BD Cuenca, filas afectadas:', (cuencaResult as any).affectedRows);
      } catch (error: any) {
        console.error('❌ [DELETE] Error en BD Cuenca:', error);
        results.push({ db: 'cuenca', success: false, error: error.message });
      }
      
      if (totalAffectedRows === 0) {
        return res.status(404).json({ 
          error: "Centro no encontrado en ninguna base de datos",
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
      console.log('👨‍⚕️ [DELETE] Médico eliminando centro de su BD local, ID:', id);
      
      const [result] = await req.dbPool.execute("DELETE FROM centros_medicos WHERE id = ?", [id]);

      if ((result as any).affectedRows === 0) {
        return res.status(404).json({ error: "Centro no encontrado" });
      }

      res.status(204).send();
    }
  } catch (err) {
    console.error("[ERROR] eliminando centro:", err);
    res.status(500).json({ error: "Error interno al eliminar centro" });
  }
}
