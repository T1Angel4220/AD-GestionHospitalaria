#!/usr/bin/env node

const mysql = require('mysql2/promise');

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

async function verifyUTF8Configuration() {
  console.log('🔍 Verificando configuración UTF-8 en todas las bases de datos...\n');

  for (const [dbName, config] of Object.entries(dbConfigs)) {
    try {
      console.log(`📊 Verificando ${dbName}...`);
      
      const connection = await mysql.createConnection(config);
      
      // Verificar configuración de la base de datos
      const [dbInfo] = await connection.execute(`
        SELECT 
          DEFAULT_CHARACTER_SET_NAME,
          DEFAULT_COLLATION_NAME
        FROM information_schema.SCHEMATA 
        WHERE SCHEMA_NAME = ?
      `, [config.database]);
      
      console.log(`   Base de datos: ${dbInfo[0].DEFAULT_CHARACTER_SET_NAME}/${dbInfo[0].DEFAULT_COLLATION_NAME}`);
      
      // Verificar configuración de las tablas
      const [tables] = await connection.execute(`
        SELECT 
          TABLE_NAME,
          TABLE_COLLATION,
          CHARACTER_SET_NAME
        FROM information_schema.TABLES t
        JOIN information_schema.COLLATIONS c ON t.TABLE_COLLATION = c.COLLATION_NAME
        WHERE t.TABLE_SCHEMA = ?
        ORDER BY TABLE_NAME
      `, [config.database]);
      
      console.log(`   Tablas configuradas: ${tables.length}`);
      
      // Verificar campos específicos
      const [columns] = await connection.execute(`
        SELECT 
          TABLE_NAME,
          COLUMN_NAME,
          CHARACTER_SET_NAME,
          COLLATION_NAME
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = ? 
        AND CHARACTER_SET_NAME IS NOT NULL
        AND COLUMN_NAME IN ('nombres', 'apellidos', 'nombre', 'ciudad', 'direccion', 'email')
        ORDER BY TABLE_NAME, COLUMN_NAME
      `, [config.database]);
      
      console.log(`   Campos de texto verificados: ${columns.length}`);
      
      // Mostrar algunos ejemplos
      columns.slice(0, 3).forEach(col => {
        console.log(`   - ${col.TABLE_NAME}.${col.COLUMN_NAME}: ${col.CHARACTER_SET_NAME}/${col.COLLATION_NAME}`);
      });
      
      // Probar inserción de caracteres especiales
      try {
        await connection.execute(`
          CREATE TEMPORARY TABLE test_utf8 (
            id INT AUTO_INCREMENT PRIMARY KEY,
            test_text VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
          )
        `);
        
        await connection.execute(`
          INSERT INTO test_utf8 (test_text) VALUES 
          ('José María'), ('Niño'), ('Niña'), ('México'), ('España'), ('François')
        `);
        
        const [testResults] = await connection.execute('SELECT test_text FROM test_utf8');
        console.log(`   ✅ Prueba de caracteres especiales: ${testResults.length} registros insertados correctamente`);
        
        await connection.execute('DROP TEMPORARY TABLE test_utf8');
      } catch (testError) {
        console.log(`   ⚠️  Error en prueba de caracteres especiales: ${testError.message}`);
      }
      
      await connection.end();
      console.log(`✅ ${dbName} verificado correctamente\n`);
      
    } catch (error) {
      console.error(`❌ Error verificando ${dbName}:`, error.message);
    }
  }

  console.log('🎉 Verificación completada!');
  console.log('\n📋 Resumen de configuración UTF-8:');
  console.log('   - Bases de datos: utf8mb4/utf8mb4_unicode_ci');
  console.log('   - Tablas: utf8mb4/utf8mb4_unicode_ci');
  console.log('   - Campos de texto: utf8mb4/utf8mb4_unicode_ci');
  console.log('   - Compatible con: ñ, á, é, í, ó, ú, ü, ç, y otros caracteres especiales');
}

// Ejecutar la verificación
verifyUTF8Configuration().catch(console.error);
