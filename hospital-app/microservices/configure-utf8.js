#!/usr/bin/env node

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Configuración de bases de datos
const dbConfigs = {
  central: {
    host: 'localhost',
    user: 'admin_central',
    password: 'SuperPasswordCentral123!',
    database: 'hospital_central',
    port: 3307,
    charset: 'utf8mb4'
  },
  guayaquil: {
    host: 'localhost',
    user: 'admin_guayaquil',
    password: 'SuperPasswordGye123!',
    database: 'hospital_guayaquil',
    port: 3308,
    charset: 'utf8mb4'
  },
  cuenca: {
    host: 'localhost',
    user: 'admin_cuenca',
    password: 'SuperPasswordCuenca123!',
    database: 'hospital_cuenca',
    port: 3309,
    charset: 'utf8mb4'
  }
};

// Leer el script SQL
const utf8Script = fs.readFileSync(path.join(__dirname, 'sql', 'configure-utf8.sql'), 'utf8');

async function configureUTF8() {
  console.log('🔧 Configurando UTF-8 para caracteres especiales en español...\n');

  for (const [dbName, config] of Object.entries(dbConfigs)) {
    try {
      console.log(`📊 Configurando ${dbName}...`);
      
      const connection = await mysql.createConnection(config);
      
      // Ejecutar el script SQL
      await connection.execute(utf8Script);
      
      // Verificar que la configuración se aplicó correctamente
      const [result] = await connection.execute(`
        SELECT 
          COUNT(*) as tables_configured
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ? 
        AND TABLE_COLLATION = 'utf8mb4_unicode_ci'
      `, [config.database]);
      
      console.log(`✅ ${dbName} configurado correctamente (${result[0].tables_configured} tablas con UTF-8)`);
      
      await connection.end();
    } catch (error) {
      console.error(`❌ Error configurando ${dbName}:`, error.message);
    }
  }

  console.log('\n🎉 Configuración UTF-8 completada!');
  console.log('Ahora las tablas pueden manejar caracteres especiales en español como ñ, á, é, í, ó, ú, ü, etc.');
  console.log('\n💡 Para verificar la configuración, ejecuta: node verify-utf8.js');
}

// Ejecutar la configuración
configureUTF8().catch(console.error);
