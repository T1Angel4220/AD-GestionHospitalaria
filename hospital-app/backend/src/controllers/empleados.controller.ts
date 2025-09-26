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
// Función para obtener empleados de todas las bases de datos (solo admin)
// =========================
async function getAllEmpleadosFromAllDatabases() {
  const allEmpleados: any[] = [];
  
  try {
    // Consultar BD Central (Quito)
    const [centralEmpleados] = await pools.central.query(`
      SELECT 
        e.id,
        e.nombres,
        e.apellidos,
        e.cargo,
        e.id_centro,
        c.nombre as centro_nombre,
        c.ciudad as centro_ciudad
      FROM empleados e
      LEFT JOIN centros_medicos c ON e.id_centro = c.id
      ORDER BY e.id ASC
    `);
    
    // Agregar información de centro y campos únicos
    (centralEmpleados as any[]).forEach(empleado => {
      empleado.centro_nombre = empleado.centro_nombre || 'Hospital Central Quito';
      empleado.centro_ciudad = empleado.centro_ciudad || 'Quito';
      empleado.origen_bd = 'central';
      empleado.id_unico = `central-${empleado.id}`;
      empleado.id_frontend = `central-${empleado.id}`;
    });
    
    allEmpleados.push(...(centralEmpleados as any[]));
    
    // Consultar BD Guayaquil
    try {
      const [guayaquilEmpleados] = await pools.guayaquil.query(`
        SELECT 
          e.id,
          e.nombres,
          e.apellidos,
          e.cargo,
          e.id_centro,
          c.nombre as centro_nombre,
          c.ciudad as centro_ciudad
        FROM empleados e
        LEFT JOIN centros_medicos c ON e.id_centro = c.id
        ORDER BY e.id ASC
      `);
      
      (guayaquilEmpleados as any[]).forEach(empleado => {
        empleado.centro_nombre = empleado.centro_nombre || 'Hospital Guayaquil';
        empleado.centro_ciudad = empleado.centro_ciudad || 'Guayaquil';
        empleado.origen_bd = 'guayaquil';
        empleado.id_unico = `guayaquil-${empleado.id}`;
        empleado.id_frontend = `guayaquil-${empleado.id}`;
      });
      
      allEmpleados.push(...(guayaquilEmpleados as any[]));
    } catch (error) {
      console.log('⚠️ No se pudo conectar a BD Guayaquil:', error);
    }
    
    // Consultar BD Cuenca
    try {
      const [cuencaEmpleados] = await pools.cuenca.query(`
        SELECT 
          e.id,
          e.nombres,
          e.apellidos,
          e.cargo,
          e.id_centro,
          c.nombre as centro_nombre,
          c.ciudad as centro_ciudad
        FROM empleados e
        LEFT JOIN centros_medicos c ON e.id_centro = c.id
        ORDER BY e.id ASC
      `);
      
      (cuencaEmpleados as any[]).forEach(empleado => {
        empleado.centro_nombre = empleado.centro_nombre || 'Hospital Cuenca';
        empleado.centro_ciudad = empleado.centro_ciudad || 'Cuenca';
        empleado.origen_bd = 'cuenca';
        empleado.id_unico = `cuenca-${empleado.id}`;
        empleado.id_frontend = `cuenca-${empleado.id}`;
      });
      
      allEmpleados.push(...(cuencaEmpleados as any[]));
    } catch (error) {
      console.log('⚠️ No se pudo conectar a BD Cuenca:', error);
    }
    
  } catch (error) {
    console.error('❌ Error consultando todas las bases de datos:', error);
    throw error;
  }
  
  // Ordenar por ID frontend
  return allEmpleados.sort((a, b) => a.id_frontend.localeCompare(b.id_frontend));
}

// =========================
// GET /api/admin/empleados
// =========================
export async function list(req: Request, res: Response) {
  try {
    // Verificar si es admin para mostrar todos los empleados
    const token = req.headers.authorization?.replace('Bearer ', '');
    let isAdmin = false;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        isAdmin = decoded.rol === 'admin';
        console.log('🔍 [EMPLEADOS] Usuario:', decoded.email, 'Rol:', decoded.rol, 'Es Admin:', isAdmin);
      } catch (error) {
        console.error('❌ Error decodificando token:', error);
      }
    }
    
    let empleados;
    
    if (isAdmin) {
      // Admin: obtener empleados de TODAS las bases de datos
      console.log('👑 [EMPLEADOS] Admin detectado - consultando TODAS las bases de datos');
      empleados = await getAllEmpleadosFromAllDatabases();
      console.log('📊 [EMPLEADOS] Total empleados encontrados:', empleados.length);
    } else {
      // Médico: obtener empleados solo de su base de datos
      console.log('👨‍⚕️ [EMPLEADOS] Médico detectado - consultando BD local');
      const [result] = await req.dbPool.query(`
        SELECT 
          e.id,
          e.nombres,
          e.apellidos,
          e.cargo,
          e.id_centro,
          c.nombre as centro_nombre,
          c.ciudad as centro_ciudad
        FROM empleados e
        LEFT JOIN centros_medicos c ON e.id_centro = c.id
        ORDER BY e.id ASC
      `);
      empleados = result;
    }
    
    res.json(empleados);
  } catch (err) {
    console.error("[ERROR] listando empleados:", err);
    res.status(500).json({ error: "Error interno al listar empleados" });
  }
}

// =========================
// GET /api/admin/empleados/:id
// =========================
export async function getOne(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const empleados = await req.dbPool.query(`
      SELECT 
        e.id,
        e.nombres,
        e.apellidos,
        e.cargo,
        e.id_centro,
        c.nombre as centro_nombre,
        c.ciudad as centro_ciudad
      FROM empleados e
      LEFT JOIN centros_medicos c ON e.id_centro = c.id
      WHERE e.id = ?
    `, [id]);

    if (empleados.length === 0) return res.status(404).json({ error: "Empleado no encontrado" });

    res.json(empleados[0]);
  } catch (err) {
    console.error("[ERROR] obteniendo empleado:", err);
    res.status(500).json({ error: "Error interno" });
  }
}

// =========================
// POST /api/admin/empleados
// =========================
export async function create(req: Request, res: Response) {
  try {
    const { nombres, apellidos, cargo, id_centro } = req.body ?? {};

    if (!nombres?.trim() || !apellidos?.trim() || !cargo?.trim() || !id_centro) {
      return res.status(400).json({ error: "nombres, apellidos, cargo e id_centro son obligatorios" });
    }

    // Verificar si es admin usando el token directamente
    const token = req.headers.authorization?.replace('Bearer ', '');
    let isAdmin = false;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        isAdmin = decoded.rol === 'admin';
        console.log('🔍 [CREATE] Token decodificado:', { rol: decoded.rol, isAdmin });
      } catch (error) {
        console.error('❌ Error decodificando token:', error);
      }
    }

    // Determinar qué BD usar para la inserción
    let dbPool = req.dbPool; // Por defecto usar la BD del middleware
    let centroId = Number(id_centro);
    
    if (isAdmin) {
      // Admin puede especificar el centro
      if (!centroId) {
        centroId = 1; // Quito por defecto
      }
      
      // Seleccionar la BD correcta según el centro
      if (centroId === 1) {
        dbPool = pools.central;
      } else if (centroId === 2) {
        dbPool = pools.guayaquil;
      } else if (centroId === 3) {
        dbPool = pools.cuenca;
      }
      
      console.log('👑 [CREATE] Admin creando empleado en centro:', centroId);
    } else {
      // Médico: usar su centro
      centroId = req.user?.id_centro || 1;
      console.log('👨‍⚕️ [CREATE] Médico creando empleado en su centro:', centroId);
    }

    // Validar centro
    const centros = await dbPool.query("SELECT id FROM centros_medicos WHERE id = ?", [centroId]);
    if (centros.length === 0) {
      return res.status(400).json({ error: "El centro especificado no existe" });
    }

    const [result] = await dbPool.execute(`
      INSERT INTO empleados (nombres, apellidos, cargo, id_centro) 
      VALUES (?, ?, ?, ?)
    `, [nombres.trim(), apellidos.trim(), cargo.trim(), centroId]);

    const created = {
      id: (result as any).insertId,
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      cargo: cargo.trim(),
      id_centro: centroId
    };

    res.status(201).json(created);
  } catch (err) {
    console.error("[ERROR] creando empleado:", err);
    res.status(500).json({ error: "Error interno al crear empleado" });
  }
}

// =========================
// PUT /api/admin/empleados/:id
// =========================
export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const { nombres, apellidos, cargo, id_centro, origen_bd } = req.body ?? {};

    // Verificar si es admin usando el token directamente
    const token = req.headers.authorization?.replace('Bearer ', '');
    let isAdmin = false;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        isAdmin = decoded.rol === 'admin';
        console.log('🔍 [UPDATE] Token decodificado:', { rol: decoded.rol, isAdmin });
      } catch (error) {
        console.error('❌ Error decodificando token:', error);
      }
    }

    // Construir objeto dinámico con los campos presentes
    const updates: string[] = [];
    const values: any[] = [];

    if (nombres !== undefined) {
      updates.push("nombres = ?");
      values.push(nombres.trim());
    }
    if (apellidos !== undefined) {
      updates.push("apellidos = ?");
      values.push(apellidos.trim());
    }
    if (cargo !== undefined) {
      updates.push("cargo = ?");
      values.push(cargo.trim());
    }

    // Manejar cambio de centro de manera especial
    let newCentroId: number | null = null;
    if (id_centro !== undefined) {
      newCentroId = Number(id_centro);
      // Validar centro
      const centros = await req.dbPool.query("SELECT id FROM centros_medicos WHERE id = ?", [newCentroId]);
      if (centros.length === 0) {
        return res.status(400).json({ error: "El centro especificado no existe" });
      }
      // NO agregar id_centro a updates, se manejará por separado
    }

    if (updates.length === 0 && !newCentroId) {
      return res.status(400).json({ error: "Debe enviar al menos un campo para actualizar" });
    }

    if (isAdmin) {
      // Admin: lógica especial para cambio de centro
      console.log('🔍 [UPDATE] Admin buscando empleado, ID:', id, 'origen_bd:', origen_bd);
      
      // Buscar el empleado en la BD específica si se proporciona origen_bd
      let empleadoData: any = null;
      let sourceDbPool: any = null;
      let currentCentro: number | null = null;
      
      if (origen_bd) {
        // Usar origen_bd para buscar en BD específica
        if (origen_bd === 'central') {
          sourceDbPool = pools.central;
        } else if (origen_bd === 'guayaquil') {
          sourceDbPool = pools.guayaquil;
        } else if (origen_bd === 'cuenca') {
          sourceDbPool = pools.cuenca;
        } else {
          return res.status(400).json({ error: "Origen de base de datos inválido" });
        }
        
        const [result] = await sourceDbPool.query("SELECT * FROM empleados WHERE id = ?", [id]);
        if ((result as any[]).length > 0) {
          empleadoData = (result as any[])[0];
          currentCentro = empleadoData.id_centro;
          console.log('🔍 [UPDATE] Empleado encontrado en BD', origen_bd, 'centro actual:', currentCentro);
        }
      } else {
        // Buscar en todas las BDs si no se proporciona origen_bd
        console.log('🔍 [UPDATE] Buscando empleado en todas las BDs, ID:', id);
        
        // Buscar en BD Central
        const [centralResult] = await pools.central.query("SELECT * FROM empleados WHERE id = ?", [id]);
        if ((centralResult as any[]).length > 0) {
          empleadoData = (centralResult as any[])[0];
          sourceDbPool = pools.central;
          currentCentro = empleadoData.id_centro;
          console.log('🔍 [UPDATE] Empleado encontrado en BD Central, centro actual:', currentCentro);
        } else {
          // Buscar en BD Guayaquil
          try {
            const [guayaquilResult] = await pools.guayaquil.query("SELECT * FROM empleados WHERE id = ?", [id]);
            if ((guayaquilResult as any[]).length > 0) {
              empleadoData = (guayaquilResult as any[])[0];
              sourceDbPool = pools.guayaquil;
              currentCentro = empleadoData.id_centro;
              console.log('🔍 [UPDATE] Empleado encontrado en BD Guayaquil, centro actual:', currentCentro);
            } else {
              // Buscar en BD Cuenca
              try {
                const [cuencaResult] = await pools.cuenca.query("SELECT * FROM empleados WHERE id = ?", [id]);
                if ((cuencaResult as any[]).length > 0) {
                  empleadoData = (cuencaResult as any[])[0];
                  sourceDbPool = pools.cuenca;
                  currentCentro = empleadoData.id_centro;
                  console.log('🔍 [UPDATE] Empleado encontrado en BD Cuenca, centro actual:', currentCentro);
                }
              } catch (error) {
                console.log('⚠️ No se pudo buscar en BD Cuenca:', error);
              }
            }
          } catch (error) {
            console.log('⚠️ No se pudo buscar en BD Guayaquil:', error);
          }
        }
      }
      
      if (!empleadoData) {
        return res.status(404).json({ error: "Empleado no encontrado en ninguna base de datos" });
      }
      
      // Si hay cambio de centro, mover el empleado
      if (newCentroId && newCentroId !== currentCentro) {
        console.log('🔄 [UPDATE] Cambio de centro detectado:', currentCentro, '→', newCentroId);
        
        // Aplicar otros cambios al objeto del empleado
        if (nombres !== undefined) empleadoData.nombres = nombres.trim();
        if (apellidos !== undefined) empleadoData.apellidos = apellidos.trim();
        if (cargo !== undefined) empleadoData.cargo = cargo.trim();
        
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
        
        // Crear empleado en nueva BD
        const [newEmpleadoResult] = await targetDbPool.execute(`
          INSERT INTO empleados (nombres, apellidos, cargo, id_centro) 
          VALUES (?, ?, ?, ?)
        `, [empleadoData.nombres, empleadoData.apellidos, empleadoData.cargo, newCentroId]);
        
        const newEmpleadoId = (newEmpleadoResult as any).insertId;
        
        // Eliminar empleado de BD original
        if (sourceDbPool) {
          try {
            const [deleteResult] = await sourceDbPool.execute("DELETE FROM empleados WHERE id = ?", [id]);
            console.log('🗑️ [UPDATE] Empleado eliminado de BD original, filas afectadas:', (deleteResult as any).affectedRows);
            
            if ((deleteResult as any).affectedRows === 0) {
              console.error('❌ [UPDATE] ERROR: No se pudo eliminar el empleado de la BD original');
              // Si no se pudo eliminar, también eliminar el que se creó en la nueva BD
              await targetDbPool.execute("DELETE FROM empleados WHERE id = ?", [newEmpleadoId]);
              return res.status(500).json({ error: "Error al mover empleado: no se pudo eliminar del centro original" });
            }
          } catch (deleteError: any) {
            console.error('❌ [UPDATE] Error eliminando empleado de BD original:', deleteError);
            // Si hay error al eliminar, también eliminar el que se creó en la nueva BD
            await targetDbPool.execute("DELETE FROM empleados WHERE id = ?", [newEmpleadoId]);
            return res.status(500).json({ error: "Error al mover empleado: " + deleteError.message });
          }
        }
        
        return res.json({
          id: newEmpleadoId,
          nombres: empleadoData.nombres,
          apellidos: empleadoData.apellidos,
          cargo: empleadoData.cargo,
          id_centro: newCentroId
        });
      } else {
        // Solo actualizar en la misma BD
        if (!sourceDbPool) {
          return res.status(500).json({ error: "Error interno: no se pudo determinar la base de datos" });
        }
        values.push(id);
        await sourceDbPool.execute(`
          UPDATE empleados 
          SET ${updates.join(", ")}
          WHERE id = ?
        `, values);
        
        return res.json({
          id,
          nombres: nombres?.trim(),
          apellidos: apellidos?.trim(),
          cargo: cargo?.trim(),
          id_centro: currentCentro
        });
      }
    } else {
      // Médico: lógica normal
      values.push(id);
      await req.dbPool.execute(`
        UPDATE empleados 
        SET ${updates.join(", ")}
        WHERE id = ?
      `, values);

      const updated = {
        id,
        nombres: nombres?.trim(),
        apellidos: apellidos?.trim(),
        cargo: cargo?.trim(),
        id_centro: newCentroId ? Number(newCentroId) : undefined
      };

      res.json(updated);
    }
  } catch (err) {
    console.error("[ERROR] actualizando empleado:", err);
    res.status(500).json({ error: "Error interno al actualizar empleado" });
  }
}

// =========================
// DELETE /api/admin/empleados/:id
// =========================
export async function remove(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const { origen_bd } = req.body ?? {};

    // Verificar si es admin usando el token directamente
    const token = req.headers.authorization?.replace('Bearer ', '');
    let isAdmin = false;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        isAdmin = decoded.rol === 'admin';
        console.log('🔍 [DELETE] Token decodificado:', { rol: decoded.rol, isAdmin });
      } catch (error) {
        console.error('❌ Error decodificando token:', error);
      }
    }

    // Determinar qué BD usar para la eliminación
    let dbPool = req.dbPool; // Por defecto usar la BD del middleware
    
    if (isAdmin) {
      // Admin: usar origen_bd si está disponible, sino buscar en todas las BDs
      if (origen_bd) {
        console.log('🔍 [DELETE] Admin eliminando empleado de BD específica:', origen_bd, 'ID:', id);
        
        if (origen_bd === 'central') {
          dbPool = pools.central;
        } else if (origen_bd === 'guayaquil') {
          dbPool = pools.guayaquil;
        } else if (origen_bd === 'cuenca') {
          dbPool = pools.cuenca;
        } else {
          return res.status(400).json({ error: "Origen de base de datos inválido" });
        }
      } else {
        // Buscar en todas las BDs si no se proporciona origen_bd
        console.log('🔍 [DELETE] Admin buscando empleado en todas las BDs, ID:', id);
        
        // Buscar el empleado en todas las BDs para determinar su centro
        let empleadoFound = false;
        
        // Buscar en BD Central
        const [centralResult] = await pools.central.query("SELECT id FROM empleados WHERE id = ?", [id]);
        if ((centralResult as any[]).length > 0) {
          dbPool = pools.central;
          empleadoFound = true;
          console.log('🔍 [DELETE] Empleado encontrado en BD Central');
        } else {
          // Buscar en BD Guayaquil
          try {
            const [guayaquilResult] = await pools.guayaquil.query("SELECT id FROM empleados WHERE id = ?", [id]);
            if ((guayaquilResult as any[]).length > 0) {
              dbPool = pools.guayaquil;
              empleadoFound = true;
              console.log('🔍 [DELETE] Empleado encontrado en BD Guayaquil');
            } else {
              // Buscar en BD Cuenca
              try {
                const [cuencaResult] = await pools.cuenca.query("SELECT id FROM empleados WHERE id = ?", [id]);
                if ((cuencaResult as any[]).length > 0) {
                  dbPool = pools.cuenca;
                  empleadoFound = true;
                  console.log('🔍 [DELETE] Empleado encontrado en BD Cuenca');
                }
              } catch (error) {
                console.log('⚠️ No se pudo buscar en BD Cuenca:', error);
              }
            }
          } catch (error) {
            console.log('⚠️ No se pudo buscar en BD Guayaquil:', error);
          }
        }
        
        if (!empleadoFound) {
          return res.status(404).json({ error: "Empleado no encontrado en ninguna base de datos" });
        }
      }
    } else {
      // Médico: usar su BD local
      console.log('👨‍⚕️ [DELETE] Médico eliminando empleado de su BD local, ID:', id);
    }

    const [result] = await dbPool.execute("DELETE FROM empleados WHERE id = ?", [id]);

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: "Empleado no encontrado" });
    }

    res.json({ message: "Empleado eliminado correctamente" });
  } catch (err) {
    console.error("[ERROR] eliminando empleado:", err);
    res.status(500).json({ error: "Error interno al eliminar empleado" });
  }
}
