const mysql = require('mysql2/promise');
const config = require('./config');

// Función para obtener conexión a base de datos específica
const getConnection = async (dbName) => {
  const dbConfig = config.databases[dbName];
  if (!dbConfig) {
    throw new Error(`Base de datos ${dbName} no configurada`);
  }
  return await mysql.createConnection(dbConfig);
};

// Función para obtener todas las bases de datos disponibles
const getAllDatabases = async () => {
  const results = {};
  for (const [name, dbConfig] of Object.entries(config.databases)) {
    try {
      const connection = await mysql.createConnection(dbConfig);
      await connection.end();
      results[name] = dbConfig;
    } catch (error) {
      console.warn(`No se pudo conectar a ${name}:`, error.message);
    }
  }
  return results;
};

// Función para determinar la base de datos según el centro
const getDatabaseByCenter = (centroId) => {
  switch (centroId) {
    case 1:
      return 'central';
    case 2:
      return 'guayaquil';
    case 3:
      return 'cuenca';
    default:
      return 'central';
  }
};

// Función para obtener el centro según la base de datos
const getCenterByDatabase = (dbName) => {
  switch (dbName) {
    case 'central':
      return 1;
    case 'guayaquil':
      return 2;
    case 'cuenca':
      return 3;
    default:
      return 1;
  }
};

module.exports = {
  getConnection,
  getAllDatabases,
  getDatabaseByCenter,
  getCenterByDatabase
};
