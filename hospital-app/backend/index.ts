import express, { Request, Response } from "express";
import cors from "cors";
import { pool } from "./src/config/db";
import { testAllConnections, pools, getConnectionInfo } from "./src/config/distributedDb";
import { databaseSelector } from "./src/middlewares/databaseSelector";
import dotenv from "dotenv";
import { setupSwagger } from "./src/config/swagger";
import consultasRouter from "./src/routes/consultas";
import authRouter from "./src/routes/auth";
import reportsRouter from "./src/routes/reports";
import medicosRouter from "./src/routes/medicos.routes";
import empleadosRouter from "./src/routes/empleados.routes";
import centrosRouter from "./src/routes/centros.routes";
import especialidadesRouter from "./src/routes/especialidades.routes";
import usuariosRouter from "./src/routes/usuarios.routes";
import pacientesRouter from "./src/routes/pacientes.routes";

dotenv.config();

const app = express();

// Configurar CORS
app.use(cors({
  origin: 'http://localhost:5173', // URL del frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Centro-Id', 'x-centro-id']
}));

app.use(express.json());

// Middleware para selección de base de datos
app.use(databaseSelector);

// Configurar Swagger
setupSwagger(app);

// Rutas de autenticación
app.use("/api/auth", authRouter);

// Rutas protegidas
app.use("/api/consultas", consultasRouter);

// Rutas de reportes
app.use("/api/reports", reportsRouter);

// Rutas de administración
app.use("/api/admin/medicos", medicosRouter);
app.use("/api/admin/empleados", empleadosRouter);
app.use("/api/admin/centros", centrosRouter);
app.use("/api/admin/especialidades", especialidadesRouter);
app.use("/api/admin/usuarios", usuariosRouter);

// Rutas de pacientes
app.use("/api/pacientes", pacientesRouter);

// Ruta de prueba para verificar conexión
app.get("/ping", async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS now");
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB connection failed" });
  }
});

// Ruta de prueba para bases de datos distribuidas
app.get("/api/test-db", async (req: Request, res: Response) => {
  try {
    const dbInfo = req.dbInfo;
    const pool = req.dbPool;
    
    if (!pool || !dbInfo) {
      return res.status(500).json({ error: "No se pudo obtener información de la base de datos" });
    }
    
    const [rows] = await pool.query("SELECT NOW() AS now, DATABASE() AS database_name, USER() AS user_name");
    
    res.json({
      message: "Conexión exitosa",
      database: dbInfo,
      query_result: rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      error: "Error de conexión a base de datos",
      details: err instanceof Error ? err.message : "Error desconocido"
    });
  }
});

// Endpoint para probar todos los centros médicos
app.get("/api/test-centros", async (req: Request, res: Response) => {
  try {
    const centros = [
      { centroId: 1, nombre: "Quito", pool: pools.central },
      { centroId: 2, nombre: "Guayaquil", pool: pools.guayaquil },
      { centroId: 3, nombre: "Cuenca", pool: pools.cuenca }
    ];
    
    const resultados: any[] = [];
    
    for (const centro of centros) {
      try {
        const [rows] = await centro.pool.query("SELECT NOW() AS now, DATABASE() AS database_name, USER() AS user_name");
        const dbInfo = getConnectionInfo(centro.centroId);
        
        resultados.push({
          centroId: centro.centroId,
          nombre: centro.nombre,
          host: dbInfo.host,
          database: dbInfo.database,
          user: dbInfo.user,
          status: "conectado",
          timestamp: new Date().toISOString(),
          query_result: rows[0]
        });
      } catch (error) {
        resultados.push({
          centroId: centro.centroId,
          nombre: centro.nombre,
          host: "unknown",
          database: "unknown",
          user: "unknown",
          status: "error",
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : "Error desconocido"
        });
      }
    }
    
    res.json({
      message: "Información de todos los centros médicos",
      centros: resultados,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      error: "Error al probar centros médicos",
      details: err instanceof Error ? err.message : "Error desconocido"
    });
  }
});

// Endpoint especial para probar consultas sin datos
app.get("/api/test-consultas", async (req: Request, res: Response) => {
  try {
    const dbInfo = req.dbInfo;
    const pool = req.dbPool;
    
    if (!pool || !dbInfo) {
      return res.status(500).json({ error: "No se pudo obtener información de la base de datos" });
    }
    
    // Verificar si hay datos en las tablas
    const [consultasCount] = await pool.query("SELECT COUNT(*) as total FROM consultas");
    const [medicosCount] = await pool.query("SELECT COUNT(*) as total FROM medicos");
    const [pacientesCount] = await pool.query("SELECT COUNT(*) as total FROM pacientes");
    
    res.json({
      message: "Información de la base de datos local",
      database: dbInfo,
      estadisticas: {
        consultas: consultasCount[0].total,
        medicos: medicosCount[0].total,
        pacientes: pacientesCount[0].total
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      error: "Error al consultar la base de datos",
      details: err instanceof Error ? err.message : "Error desconocido"
    });
  }
});

const PORT = process.env.PORT || 3000;

// Inicializar servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
  
  // Probar conexiones a todas las bases de datos
  try {
    console.log('🔌 Probando conexiones a bases de datos distribuidas...');
    await testAllConnections();
    console.log('✅ Todas las conexiones de base de datos funcionando correctamente');
  } catch (error) {
    console.error('❌ Error en conexiones de base de datos:', error);
    console.log('⚠️  El servidor continuará ejecutándose, pero algunas funcionalidades pueden no estar disponibles');
  }
  
  console.log(`📚 Swagger UI disponible en: http://localhost:${PORT}/api-docs`);
  console.log(`🏥 Sistema de gestión hospitalaria con bases de datos distribuidas`);
});
