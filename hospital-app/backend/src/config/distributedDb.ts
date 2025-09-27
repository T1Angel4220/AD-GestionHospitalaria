// src/config/distributedDb.ts
import mysql from "mysql2/promise";
import { CONFIG } from "./env";

// Configuraciones de conexión para cada base de datos
const dbConfigs = {
  central: {
    host: CONFIG.CENTRAL_DB_HOST,
    port: CONFIG.CENTRAL_DB_PORT || 3306,
    user: CONFIG.CENTRAL_DB_USER,
    password: CONFIG.CENTRAL_DB_PASS,
    database: CONFIG.CENTRAL_DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  },
  guayaquil: {
    host: CONFIG.GYE_DB_HOST,
    port: CONFIG.GYE_DB_PORT || 3306,
    user: CONFIG.GYE_DB_USER,
    password: CONFIG.GYE_DB_PASS,
    database: CONFIG.GYE_DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  },
  cuenca: {
    host: CONFIG.CUENCA_DB_HOST,
    port: CONFIG.CUENCA_DB_PORT || 3306,
    user: CONFIG.CUENCA_DB_USER,
    password: CONFIG.CUENCA_DB_PASS,
    database: CONFIG.CUENCA_DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  },
};

// Pools de conexión para cada base de datos
const pools: Record<string, mysql.Pool> = {};

// Inicializar pools de conexión
Object.keys(dbConfigs).forEach(key => {
  pools[key] = mysql.createPool(dbConfigs[key as keyof typeof dbConfigs]);
});

// Función para obtener el pool correcto según el centro
export function getPoolByCentro(centroId: number): mysql.Pool {
  switch (centroId) {
    case 1: // Quito (Central)
      return pools.central;
    case 2: // Guayaquil
      return pools.guayaquil;
    case 3: // Cuenca
      return pools.cuenca;
    default:
      // Por defecto usar la base de datos central
      return pools.central;
  }
}

// Función para obtener el pool correcto según el nombre del centro
export function getPoolByCentroName(centroName: string): mysql.Pool {
  const centroLower = centroName.toLowerCase();
  
  if (centroLower.includes('quito') || centroLower.includes('central')) {
    return pools.central;
  } else if (centroLower.includes('guayaquil') || centroLower.includes('gye')) {
    return pools.guayaquil;
  } else if (centroLower.includes('cuenca')) {
    return pools.cuenca;
  }
  
  // Por defecto usar la base de datos central
  return pools.central;
}

// Función para consultas que requieren la base de datos central (admin, médicos, especialidades, empleados)
export function getCentralPool(): mysql.Pool {
  return pools.central;
}

// Función para consultas que requieren la base de datos local (consultas médicas)
export function getLocalPool(centroId: number): mysql.Pool {
  return getPoolByCentro(centroId);
}

// Helper genérico para consultas tipadas con pool específico
export async function queryWithPool<T = any>(
  pool: mysql.Pool, 
  sql: string, 
  params?: any[]
): Promise<T[]> {
  const [rows] = await pool.query(sql, params ?? []);
  return rows as T[];
}

// Helper para operaciones que devuelven metadata con pool específico
export async function executeWithPool(
  pool: mysql.Pool, 
  sql: string, 
  params?: any[]
): Promise<any> {
  const [result] = await pool.execute(sql, params ?? []);
  return result;
}

// Función para probar todas las conexiones
export async function testAllConnections(): Promise<void> {
  const testPromises = Object.entries(pools).map(async ([name, pool]) => {
    try {
      const conn = await pool.getConnection();
      await conn.ping();
      conn.release();
      console.log(`✅ Conexión a ${name} exitosa`);
    } catch (error) {
      console.error(`❌ Error conectando a ${name}:`, error);
      throw error;
    }
  });
  
  await Promise.all(testPromises);
}

// Función para obtener información de conexión
export function getConnectionInfo(centroId: number): { host: string; database: string; user: string } {
  switch (centroId) {
    case 1: // Quito (Central)
      return {
        host: dbConfigs.central.host,
        database: dbConfigs.central.database,
        user: dbConfigs.central.user
      };
    case 2: // Guayaquil
      return {
        host: dbConfigs.guayaquil.host,
        database: dbConfigs.guayaquil.database,
        user: dbConfigs.guayaquil.user
      };
    case 3: // Cuenca
      return {
        host: dbConfigs.cuenca.host,
        database: dbConfigs.cuenca.database,
        user: dbConfigs.cuenca.user
      };
    default:
      return {
        host: 'unknown',
        database: 'unknown',
        user: 'unknown'
      };
  }
}

// Cierre limpio de todos los pools
async function shutdown() {
  try {
    await Promise.all(Object.values(pools).map(pool => pool.end()));
    console.log('🔌 Todas las conexiones de base de datos cerradas');
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Exportar pools individuales si se necesitan
export { pools };
