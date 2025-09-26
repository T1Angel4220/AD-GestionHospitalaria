import { Request, Response } from "express";
import { validateMedico } from "../middlewares/validation";
import { pools } from "../config/distributedDb";

// Extender el tipo Request para incluir user y dbPool
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
      dbPool?: any; // Pool de conexión a la base de datos
    }
  }
}

// =========================
// Función para obtener médicos de todas las bases de datos (solo admin)
// =========================
async function getAllMedicosFromAllDatabases() {
  const allMedicos: any[] = [];
  
  try {
    // Consultar BD Central (Quito)
    const [centralMedicos] = await pools.central.query(`
      SELECT 
        m.id,
        m.nombres,
        m.apellidos,
        m.id_especialidad,
        m.id_centro,
        e.nombre as especialidad_nombre,
        c.nombre as centro_nombre,
        c.ciudad as centro_ciudad
      FROM medicos m
      LEFT JOIN especialidades e ON m.id_especialidad = e.id
      LEFT JOIN centros_medicos c ON m.id_centro = c.id
      ORDER BY m.id ASC
    `);
    
    // Agregar información de centro y IDs únicos
    (centralMedicos as any[]).forEach(medico => {
      medico.centro_nombre = medico.centro_nombre || 'Hospital Central Quito';
      medico.centro_ciudad = medico.centro_ciudad || 'Quito';
      medico.origen_bd = 'central';
      medico.id_unico = `central-${medico.id}`;
      medico.id_frontend = `central-${medico.id}`;
    });
    
    allMedicos.push(...(centralMedicos as any[]));
    
    // Consultar BD Guayaquil
    try {
      const [guayaquilMedicos] = await pools.guayaquil.query(`
        SELECT 
          m.id,
          m.nombres,
          m.apellidos,
          m.id_especialidad,
          m.id_centro,
          e.nombre as especialidad_nombre,
          c.nombre as centro_nombre,
          c.ciudad as centro_ciudad
        FROM medicos m
        LEFT JOIN especialidades e ON m.id_especialidad = e.id
        LEFT JOIN centros_medicos c ON m.id_centro = c.id
        ORDER BY m.id ASC
      `);
      
      (guayaquilMedicos as any[]).forEach(medico => {
        medico.centro_nombre = medico.centro_nombre || 'Hospital Guayaquil';
        medico.centro_ciudad = medico.centro_ciudad || 'Guayaquil';
        medico.origen_bd = 'guayaquil';
        medico.id_unico = `guayaquil-${medico.id}`;
        medico.id_frontend = `guayaquil-${medico.id}`;
      });
      
      allMedicos.push(...(guayaquilMedicos as any[]));
    } catch (error) {
      console.log('⚠️ No se pudo conectar a BD Guayaquil:', error);
    }
    
    // Consultar BD Cuenca
    try {
      const [cuencaMedicos] = await pools.cuenca.query(`
        SELECT 
          m.id,
          m.nombres,
          m.apellidos,
          m.id_especialidad,
          m.id_centro,
          e.nombre as especialidad_nombre,
          c.nombre as centro_nombre,
          c.ciudad as centro_ciudad
        FROM medicos m
        LEFT JOIN especialidades e ON m.id_especialidad = e.id
        LEFT JOIN centros_medicos c ON m.id_centro = c.id
        ORDER BY m.id ASC
      `);
      
      (cuencaMedicos as any[]).forEach(medico => {
        medico.centro_nombre = medico.centro_nombre || 'Hospital Cuenca';
        medico.centro_ciudad = medico.centro_ciudad || 'Cuenca';
        medico.origen_bd = 'cuenca';
        medico.id_unico = `cuenca-${medico.id}`;
        medico.id_frontend = `cuenca-${medico.id}`;
      });
      
      allMedicos.push(...(cuencaMedicos as any[]));
    } catch (error) {
      console.log('⚠️ No se pudo conectar a BD Cuenca:', error);
    }
    
  } catch (error) {
    console.error('❌ Error consultando todas las bases de datos:', error);
    throw error;
  }
  
  // Ordenar por ID
  return allMedicos.sort((a, b) => a.id - b.id);
}

// =========================
// GET /api/admin/medicos
// =========================
export async function list(req: Request, res: Response) {
  try {
    // Verificar si es admin para mostrar todos los médicos
    const token = req.headers.authorization?.replace('Bearer ', '');
    let isAdmin = false;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        isAdmin = decoded.rol === 'admin';
        console.log('🔍 [MEDICOS] Usuario:', decoded.email, 'Rol:', decoded.rol, 'Es Admin:', isAdmin);
      } catch (error) {
        console.error('❌ Error decodificando token:', error);
      }
    }
    
    let medicos;
    
    if (isAdmin) {
      // Admin: obtener médicos de TODAS las bases de datos
      console.log('👑 [MEDICOS] Admin detectado - consultando TODAS las bases de datos');
      medicos = await getAllMedicosFromAllDatabases();
      console.log('📊 [MEDICOS] Total médicos encontrados:', medicos.length);
    } else {
      // Médico: obtener médicos solo de su base de datos
      console.log('👨‍⚕️ [MEDICOS] Médico detectado - consultando BD local');
      const [result] = await req.dbPool.query(`
        SELECT 
          m.id,
          m.nombres,
          m.apellidos,
          m.id_especialidad,
          m.id_centro,
          e.nombre as especialidad_nombre,
          c.nombre as centro_nombre,
          c.ciudad as centro_ciudad
        FROM medicos m
        LEFT JOIN especialidades e ON m.id_especialidad = e.id
        LEFT JOIN centros_medicos c ON m.id_centro = c.id
        ORDER BY m.id ASC
      `);
      medicos = result;
    }
    
    res.json(medicos);
  } catch (err) {
    console.error("[ERROR] listando médicos:", err);
    res.status(500).json({ error: "Error interno al listar médicos" });
  }
}

// =========================
// GET /api/admin/medicos/:id
// =========================
export async function getOne(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const medicos = await req.dbPool.query(`
      SELECT 
        m.id,
        m.nombres,
        m.apellidos,
        m.id_especialidad,
        m.id_centro,
        e.nombre as especialidad_nombre,
        c.nombre as centro_nombre,
        c.ciudad as centro_ciudad
      FROM medicos m
      LEFT JOIN especialidades e ON m.id_especialidad = e.id
      LEFT JOIN centros_medicos c ON m.id_centro = c.id
      WHERE m.id = ?
    `, [id]);

    if (medicos.length === 0) return res.status(404).json({ error: "Médico no encontrado" });

    res.json(medicos[0]);
  } catch (err) {
    console.error("[ERROR] obteniendo médico:", err);
    res.status(500).json({ error: "Error interno" });
  }
}

// =========================
// POST /api/admin/medicos
// =========================
export async function create(req: Request, res: Response) {
  try {
    const { nombres, apellidos, id_especialidad, id_centro } = req.body ?? {};

    console.log('🔍 [CREATE] Datos recibidos:', {
      nombres,
      apellidos,
      id_especialidad,
      id_centro,
      xCentroId: req.headers['x-centro-id'],
      userRol: req.user?.rol
    });

    // Las validaciones detalladas ya se hicieron en el middleware

    // Determinar qué BD usar para la inserción
    let dbPool = req.dbPool; // Por defecto usar la BD del middleware
    let centroId = Number(id_centro);
    
    // Verificar si es admin usando el token directamente
    const token = req.headers.authorization?.replace('Bearer ', '');
    let isAdmin = false;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        isAdmin = decoded.rol === 'admin';
        console.log('🔍 [CREATE] Verificación de rol:', { email: decoded.email, rol: decoded.rol, isAdmin });
      } catch (error) {
        console.error('❌ Error decodificando token:', error);
      }
    }
    
    if (isAdmin) {
      // Admin: SIEMPRE usar el centro del cuerpo de la petición, NO del header
      if (!centroId || centroId === 0) {
        centroId = 1; // Quito por defecto solo si no se especifica
        console.log('⚠️ [CREATE] Admin sin centro especificado en body, usando Quito por defecto');
      } else {
        console.log('✅ [CREATE] Admin usando centro del body:', centroId, 'IGNORANDO X-Centro-Id del header');
      }
      
      // Seleccionar la BD correcta según el centro del BODY
      if (centroId === 1) {
        dbPool = pools.central;
      } else if (centroId === 2) {
        dbPool = pools.guayaquil;
      } else if (centroId === 3) {
        dbPool = pools.cuenca;
      }
      
      console.log('👑 [CREATE] Admin creando médico en centro:', centroId, 'BD seleccionada:', centroId === 1 ? 'Central' : centroId === 2 ? 'Guayaquil' : 'Cuenca');
    } else {
      // Médico: usar su centro
      centroId = req.user?.id_centro || 1;
      console.log('👨‍⚕️ [CREATE] Médico creando médico en su centro:', centroId);
    }

    // Validar centro
    const centros = await dbPool.query("SELECT id FROM centros_medicos WHERE id = ?", [centroId]);
    if (centros.length === 0) return res.status(400).json({ error: "El centro especificado no existe" });

    // Validar especialidad
    const especialidades = await dbPool.query("SELECT id FROM especialidades WHERE id = ?", [Number(id_especialidad)]);
    if (especialidades.length === 0) return res.status(400).json({ error: "La especialidad especificada no existe" });

    const result = await dbPool.execute(`
      INSERT INTO medicos (nombres, apellidos, id_especialidad, id_centro) 
      VALUES (?, ?, ?, ?)
    `, [nombres, apellidos, Number(id_especialidad), centroId]);

    const created = {
      id: result.insertId,
      nombres: nombres,
      apellidos: apellidos,
      id_centro: centroId
    };

    res.status(201).json(created);
  } catch (err) {
    console.error("[ERROR] creando médico:", err);
    res.status(500).json({ error: "Error interno al crear médico" });
  }
}

// =========================
// PUT /api/admin/medicos/:id
// =========================
export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const { nombres, apellidos, id_especialidad, id_centro } = req.body ?? {};

    // Las validaciones detalladas ya se hicieron en el middleware

    // Determinar qué BD usar para la actualización
    let dbPool = req.dbPool; // Por defecto usar la BD del middleware
    
    // Verificar si es admin usando el token directamente
    const token = req.headers.authorization?.replace('Bearer ', '');
    let isAdmin = false;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        isAdmin = decoded.rol === 'admin';
        console.log('🔍 [UPDATE] Verificación de rol:', { email: decoded.email, rol: decoded.rol, isAdmin });
      } catch (error) {
        console.error('❌ Error decodificando token:', error);
      }
    }
    
    if (isAdmin) {
      // Admin: buscar el médico en todas las BDs para determinar su ubicación
      console.log('🔍 [UPDATE] Admin buscando médico en todas las BDs, ID:', id);
      
      // Buscar el médico en todas las BDs para obtener sus datos completos
      let medicoData: any = null;
      let sourceDbPool: any = null;
      let currentCentro: number | null = null;
      
      // Buscar en BD Central
      const [centralResult] = await pools.central.query("SELECT * FROM medicos WHERE id = ?", [id]);
      if ((centralResult as any[]).length > 0) {
        medicoData = (centralResult as any[])[0];
        sourceDbPool = pools.central;
        currentCentro = medicoData.id_centro;
        console.log('🔍 [UPDATE] Médico encontrado en BD Central, centro actual:', currentCentro);
      } else {
        // Buscar en BD Guayaquil
        try {
          const [guayaquilResult] = await pools.guayaquil.query("SELECT * FROM medicos WHERE id = ?", [id]);
          if ((guayaquilResult as any[]).length > 0) {
            medicoData = (guayaquilResult as any[])[0];
            sourceDbPool = pools.guayaquil;
            currentCentro = medicoData.id_centro;
            console.log('🔍 [UPDATE] Médico encontrado en BD Guayaquil, centro actual:', currentCentro);
          } else {
            // Buscar en BD Cuenca
            try {
              const [cuencaResult] = await pools.cuenca.query("SELECT * FROM medicos WHERE id = ?", [id]);
              if ((cuencaResult as any[]).length > 0) {
                medicoData = (cuencaResult as any[])[0];
                sourceDbPool = pools.cuenca;
                currentCentro = medicoData.id_centro;
                console.log('🔍 [UPDATE] Médico encontrado en BD Cuenca, centro actual:', currentCentro);
              }
            } catch (error) {
              console.log('⚠️ No se pudo buscar en BD Cuenca:', error);
            }
          }
        } catch (error) {
          console.log('⚠️ No se pudo buscar en BD Guayaquil:', error);
        }
      }
      
      if (!medicoData) {
        return res.status(404).json({ error: "Médico no encontrado en ninguna base de datos" });
      }
      
      // Si hay cambio de centro, mover el médico
      const newCentroId = Number(id_centro);
      console.log('🔍 [UPDATE] Comparando centros:', { 
        currentCentro, 
        newCentroId, 
        id_centro, 
        hayCambio: newCentroId && newCentroId !== currentCentro 
      });
      
      if (newCentroId && newCentroId !== currentCentro) {
        console.log('🔄 [UPDATE] Cambio de centro detectado:', currentCentro, '→', newCentroId);
        
        // Aplicar otros cambios al objeto del médico
        if (nombres !== undefined) medicoData.nombres = nombres.trim();
        if (apellidos !== undefined) medicoData.apellidos = apellidos.trim();
        if (id_especialidad !== undefined) medicoData.id_especialidad = Number(id_especialidad);
        
        // Seleccionar BD destino
        let targetDbPool: any;
        if (newCentroId === 1) {
          targetDbPool = pools.central;
        } else if (newCentroId === 2) {
          targetDbPool = pools.guayaquil;
        } else if (newCentroId === 3) {
          targetDbPool = pools.cuenca;
        } else {
          return res.status(400).json({ error: "Centro inválido" });
        }
        
        // Validar especialidad en BD destino
        const especialidades = await targetDbPool.query("SELECT id FROM especialidades WHERE id = ?", [medicoData.id_especialidad]);
        if (especialidades.length === 0) return res.status(400).json({ error: "La especialidad especificada no existe" });
        
        // Crear médico en nueva BD
        console.log('🔄 [UPDATE] Creando médico en BD destino:', {
          nombres: medicoData.nombres,
          apellidos: medicoData.apellidos,
          id_especialidad: medicoData.id_especialidad,
          newCentroId,
          targetDb: newCentroId === 1 ? 'Central' : newCentroId === 2 ? 'Guayaquil' : 'Cuenca'
        });
        
        let newMedicoId;
        try {
          const [newMedicoResult] = await targetDbPool.execute(`
            INSERT INTO medicos (nombres, apellidos, id_especialidad, id_centro) 
            VALUES (?, ?, ?, ?)
          `, [medicoData.nombres, medicoData.apellidos, medicoData.id_especialidad, newCentroId]);
          
          console.log('🔄 [UPDATE] Resultado de inserción:', {
            insertId: newMedicoResult.insertId,
            affectedRows: newMedicoResult.affectedRows,
            result: newMedicoResult
          });
          
          newMedicoId = newMedicoResult.insertId;
          
          if (!newMedicoId) {
            console.error('❌ [UPDATE] ERROR: No se pudo obtener el ID del médico creado');
            return res.status(500).json({ error: "Error al crear médico en el nuevo centro: no se obtuvo ID" });
          }
        } catch (createError: any) {
          console.error('❌ [UPDATE] Error creando médico en BD destino:', createError);
          return res.status(500).json({ error: "Error al crear médico en el nuevo centro: " + createError.message });
        }
        
        // Eliminar médico de BD original
        if (sourceDbPool) {
          try {
            console.log('🗑️ [UPDATE] Eliminando médico de BD original, ID:', id, 'BD:', sourceDbPool === pools.central ? 'Central' : sourceDbPool === pools.guayaquil ? 'Guayaquil' : 'Cuenca');
            
            // Verificar que el médico existe antes de eliminar
            const [checkResult] = await sourceDbPool.query("SELECT id FROM medicos WHERE id = ?", [id]);
            console.log('🔍 [UPDATE] Verificación pre-eliminación:', { 
              medicoExiste: (checkResult as any[]).length > 0,
              id: id,
              bd: sourceDbPool === pools.central ? 'Central' : sourceDbPool === pools.guayaquil ? 'Guayaquil' : 'Cuenca'
            });
            
            const deleteResult = await sourceDbPool.execute("DELETE FROM medicos WHERE id = ?", [id]);
            console.log('🗑️ [UPDATE] Médico eliminado de BD original, filas afectadas:', deleteResult.affectedRows);
            
            if (deleteResult.affectedRows === 0) {
              console.error('❌ [UPDATE] ERROR: No se pudo eliminar el médico de la BD original');
              // Si no se pudo eliminar, también eliminar el que se creó en la nueva BD
              console.log('🗑️ [UPDATE] Eliminando médico de BD destino como rollback, ID:', newMedicoId);
              await targetDbPool.execute("DELETE FROM medicos WHERE id = ?", [newMedicoId]);
              return res.status(500).json({ error: "Error al mover médico: no se pudo eliminar del centro original" });
            }
            
            // Verificar que se eliminó correctamente
            const [verifyResult] = await sourceDbPool.query("SELECT id FROM medicos WHERE id = ?", [id]);
            console.log('✅ [UPDATE] Verificación post-eliminación:', { 
              medicoEliminado: (verifyResult as any[]).length === 0,
              id: id
            });
            
          } catch (deleteError: any) {
            console.error('❌ [UPDATE] Error eliminando médico de BD original:', deleteError);
            // Si hay error al eliminar, también eliminar el que se creó en la nueva BD
            console.log('🗑️ [UPDATE] Eliminando médico de BD destino como rollback, ID:', newMedicoId);
            await targetDbPool.execute("DELETE FROM medicos WHERE id = ?", [newMedicoId]);
            return res.status(500).json({ error: "Error al mover médico: " + deleteError.message });
          }
        } else {
          console.error('❌ [UPDATE] ERROR: sourceDbPool es null, no se puede eliminar el médico original');
          // Si no hay sourceDbPool, eliminar el que se creó en la nueva BD
          console.log('🗑️ [UPDATE] Eliminando médico de BD destino como rollback, ID:', newMedicoId);
          await targetDbPool.execute("DELETE FROM medicos WHERE id = ?", [newMedicoId]);
          return res.status(500).json({ error: "Error al mover médico: no se pudo determinar la base de datos original" });
        }
        
        console.log('✅ [UPDATE] Médico movido exitosamente:', {
          idOriginal: id,
          idNuevo: newMedicoId,
          centroAnterior: currentCentro,
          centroNuevo: newCentroId,
          nombres: medicoData.nombres,
          apellidos: medicoData.apellidos
        });
        
        return res.json({
          id: newMedicoId,
          nombres: medicoData.nombres,
          apellidos: medicoData.apellidos,
          id_especialidad: medicoData.id_especialidad,
          id_centro: newCentroId
        });
      } else {
        // Solo actualizar en la misma BD
        if (!sourceDbPool) {
          return res.status(500).json({ error: "Error interno: no se pudo determinar la base de datos" });
        }
        
        // Validar especialidad
        const especialidades = await sourceDbPool.query("SELECT id FROM especialidades WHERE id = ?", [Number(id_especialidad)]);
        if (especialidades.length === 0) return res.status(400).json({ error: "La especialidad especificada no existe" });
        
        await sourceDbPool.execute(`
          UPDATE medicos 
          SET nombres = ?, apellidos = ?, id_especialidad = ?
          WHERE id = ?
        `, [nombres, apellidos, Number(id_especialidad), id]);
        
        return res.json({
          id,
          nombres: nombres,
          apellidos: apellidos,
          id_especialidad: Number(id_especialidad),
          id_centro: currentCentro
        });
      }
    } else {
      // Médico: lógica normal
      // Validar existencia del médico
      const medicos = await req.dbPool.query("SELECT id FROM medicos WHERE id = ?", [id]);
      if (medicos.length === 0) return res.status(404).json({ error: "Médico no encontrado" });

      // Validar especialidad
      const especialidades = await req.dbPool.query("SELECT id FROM especialidades WHERE id = ?", [Number(id_especialidad)]);
      if (especialidades.length === 0) return res.status(400).json({ error: "La especialidad especificada no existe" });

      await req.dbPool.execute(`
        UPDATE medicos 
        SET nombres = ?, apellidos = ?, id_especialidad = ?
        WHERE id = ?
      `, [nombres, apellidos, Number(id_especialidad), id]);

      const updated = {
        id,
        nombres: nombres,
        apellidos: apellidos,
        id_especialidad: Number(id_especialidad)
      };

      res.json(updated);
    }
  } catch (err) {
    console.error("[ERROR] actualizando médico:", err);
    res.status(500).json({ error: "Error interno al actualizar médico" });
  }
}

// =========================
// DELETE /api/admin/medicos/:id
// =========================
export async function remove(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    // Determinar qué BD usar para la eliminación
    let dbPool = req.dbPool; // Por defecto usar la BD del middleware
    
    // Verificar si es admin usando el token directamente
    const token = req.headers.authorization?.replace('Bearer ', '');
    let isAdmin = false;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        isAdmin = decoded.rol === 'admin';
        console.log('🔍 [DELETE] Verificación de rol:', { email: decoded.email, rol: decoded.rol, isAdmin });
      } catch (error) {
        console.error('❌ Error decodificando token:', error);
      }
    }
    
    if (isAdmin) {
      // Admin: usar el origen_bd del cuerpo de la petición para saber exactamente dónde buscar
      const { origen_bd } = req.body ?? {};
      
      console.log('🔍 [DELETE] Admin eliminando médico:', { id, origen_bd });
      
      if (origen_bd === 'central') {
        dbPool = pools.central;
        console.log('🗑️ [DELETE] Usando BD Central para eliminar médico ID:', id);
      } else if (origen_bd === 'guayaquil') {
        dbPool = pools.guayaquil;
        console.log('🗑️ [DELETE] Usando BD Guayaquil para eliminar médico ID:', id);
      } else if (origen_bd === 'cuenca') {
        dbPool = pools.cuenca;
        console.log('🗑️ [DELETE] Usando BD Cuenca para eliminar médico ID:', id);
      } else {
        return res.status(400).json({ error: "Origen de base de datos no especificado o inválido" });
      }
      
      // Verificar que el médico existe en la BD especificada
      const [checkResult] = await dbPool.query("SELECT id FROM medicos WHERE id = ?", [id]);
      if ((checkResult as any[]).length === 0) {
        return res.status(404).json({ error: `Médico no encontrado en la base de datos ${origen_bd}` });
      }
      
      console.log('✅ [DELETE] Médico encontrado en BD', origen_bd, 'ID:', id);
    }

    const result = await dbPool.execute("DELETE FROM medicos WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Médico no encontrado" });
    }

    res.json({ message: "Médico eliminado correctamente" });
  } catch (err) {
    console.error("[ERROR] eliminando médico:", err);
    res.status(500).json({ error: "Error interno al eliminar médico" });
  }
}
