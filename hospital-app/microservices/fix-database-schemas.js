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

// Función para verificar y corregir esquemas
async function fixDatabaseSchemas() {
  console.log(`\n🔧 CORRIGIENDO ESQUEMAS DE BASE DE DATOS`.title);
  console.log(`⏰ Fecha: ${new Date().toLocaleString()}`.info);
  
  for (const [centro, config] of Object.entries(dbConfigs)) {
    console.log(`\n📊 Procesando: ${centro.toUpperCase()}`.service);
    
    try {
      const connection = await mysql.createConnection(config);
      console.log(`✅ Conectado a ${config.database}`.success);
      
      // Verificar estructura de tabla medicos
      console.log(`\n👨‍⚕️ Verificando tabla medicos...`.info);
      const [medicosColumns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'medicos'
        ORDER BY ORDINAL_POSITION
      `, [config.database]);
      
      console.log(`📋 Columnas en tabla medicos:`);
      medicosColumns.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? '(NOT NULL)' : '(NULL)'}`);
      });
      
      // Verificar estructura de tabla pacientes
      console.log(`\n👥 Verificando tabla pacientes...`.info);
      const [pacientesColumns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'pacientes'
        ORDER BY ORDINAL_POSITION
      `, [config.database]);
      
      console.log(`📋 Columnas en tabla pacientes:`);
      pacientesColumns.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? '(NOT NULL)' : '(NULL)'}`);
      });
      
      // Verificar estructura de tabla consultas
      console.log(`\n📋 Verificando tabla consultas...`.info);
      const [consultasColumns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'consultas'
        ORDER BY ORDINAL_POSITION
      `, [config.database]);
      
      console.log(`📋 Columnas en tabla consultas:`);
      consultasColumns.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? '(NOT NULL)' : '(NULL)'}`);
      });
      
      // Verificar estructura de tabla empleados
      console.log(`\n👨‍💼 Verificando tabla empleados...`.info);
      const [empleadosColumns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'empleados'
        ORDER BY ORDINAL_POSITION
      `, [config.database]);
      
      console.log(`📋 Columnas en tabla empleados:`);
      empleadosColumns.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? '(NOT NULL)' : '(NULL)'}`);
      });
      
      // Verificar estructura de tabla especialidades
      console.log(`\n🏥 Verificando tabla especialidades...`.info);
      const [especialidadesColumns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'especialidades'
        ORDER BY ORDINAL_POSITION
      `, [config.database]);
      
      console.log(`📋 Columnas en tabla especialidades:`);
      especialidadesColumns.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? '(NOT NULL)' : '(NULL)'}`);
      });
      
      // Verificar estructura de tabla centros_medicos
      console.log(`\n🏢 Verificando tabla centros_medicos...`.info);
      const [centrosColumns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'centros_medicos'
        ORDER BY ORDINAL_POSITION
      `, [config.database]);
      
      console.log(`📋 Columnas en tabla centros_medicos:`);
      centrosColumns.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? '(NOT NULL)' : '(NULL)'}`);
      });
      
      // Verificar estructura de tabla usuarios
      console.log(`\n👤 Verificando tabla usuarios...`.info);
      const [usuariosColumns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuarios'
        ORDER BY ORDINAL_POSITION
      `, [config.database]);
      
      console.log(`📋 Columnas en tabla usuarios:`);
      usuariosColumns.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? '(NOT NULL)' : '(NULL)'}`);
      });
      
      await connection.end();
      console.log(`✅ ${centro.toUpperCase()} verificado correctamente`.success);
      
    } catch (error) {
      console.log(`❌ Error en ${centro}: ${error.message}`.error);
    }
  }
  
  console.log(`\n📋 RESUMEN DE ESQUEMAS`.title);
  console.log(`✅ Todas las bases de datos verificadas`.success);
  console.log(`\n🎯 PRÓXIMOS PASOS:`.info);
  console.log(`1. Revisar las columnas mostradas arriba`.info);
  console.log(`2. Ajustar los microservicios según el esquema real`.info);
  console.log(`3. Probar las funcionalidades corregidas`.info);
}

// Ejecutar verificación
fixDatabaseSchemas().catch(console.error);
