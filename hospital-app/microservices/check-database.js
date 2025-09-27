const mysql = require('mysql2/promise');
const colors = require('colors');

// Configuración de colores
colors.setTheme({
  success: 'green',
  error: 'red',
  warning: 'yellow',
  info: 'cyan',
  title: 'magenta',
  service: 'blue'
});

// Configuración de bases de datos
const dbConfigs = {
  central: {
    host: 'localhost',
    user: 'admin_central',
    password: 'SuperPasswordCentral123!',
    database: 'hospital_central',
    port: 3307
  },
  guayaquil: {
    host: 'localhost',
    user: 'admin_guayaquil',
    password: 'SuperPasswordGye123!',
    database: 'hospital_guayaquil',
    port: 3308
  },
  cuenca: {
    host: 'localhost',
    user: 'admin_cuenca',
    password: 'SuperPasswordCuenca123!',
    database: 'hospital_cuenca',
    port: 3309
  }
};

async function checkDatabase(dbName, config) {
  console.log(`\n🔍 Verificando Base de Datos: ${dbName.toUpperCase()}`.title);
  console.log(`📍 Host: ${config.host}:${config.port}`.info);
  console.log(`🗄️ Database: ${config.database}`.info);
  
  try {
    const connection = await mysql.createConnection(config);
    
    // Verificar conexión
    console.log(`✅ Conexión exitosa`.success);
    
    // Obtener lista de tablas
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`📊 Tablas encontradas: ${tables.length}`.info);
    
    tables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`  ${index + 1}. ${tableName}`.info);
    });
    
    // Verificar tablas específicas que necesitamos
    const requiredTables = ['usuarios', 'medicos', 'pacientes', 'consultas', 'empleados', 'especialidades', 'centros_medicos'];
    console.log(`\n🔍 Verificando tablas requeridas:`.service);
    
    for (const tableName of requiredTables) {
      const [exists] = await connection.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = ? AND table_name = ?
      `, [config.database, tableName]);
      
      if (exists[0].count > 0) {
        console.log(`  ✅ ${tableName}`.success);
      } else {
        console.log(`  ❌ ${tableName} - FALTA`.error);
      }
    }
    
    await connection.end();
    return true;
    
  } catch (error) {
    console.log(`❌ Error conectando a ${dbName}: ${error.message}`.error);
    return false;
  }
}

async function runDatabaseCheck() {
  console.log(`\n🚀 VERIFICANDO BASES DE DATOS`.title);
  console.log(`⏰ Fecha: ${new Date().toLocaleString()}`.info);
  
  let successCount = 0;
  
  for (const [dbName, config] of Object.entries(dbConfigs)) {
    const success = await checkDatabase(dbName, config);
    if (success) successCount++;
  }
  
  console.log(`\n📋 RESUMEN FINAL`.title);
  console.log(`✅ Bases de datos funcionando: ${successCount}/${Object.keys(dbConfigs).length}`.success);
  
  if (successCount === Object.keys(dbConfigs).length) {
    console.log(`\n🎉 ¡TODAS LAS BASES DE DATOS ESTÁN FUNCIONANDO!`.success);
  } else {
    console.log(`\n⚠️ Algunas bases de datos necesitan atención`.warning);
  }
}

runDatabaseCheck();
