#!/usr/bin/env node

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

// Lista de tablas en orden de dependencias (las dependientes primero)
const tables = [
  'consultas',
  'medicos',
  'pacientes',
  'empleados',
  'especialidades',
  'usuarios',
  'centros_medicos'
];

async function resetDatabase(dbName, config) {
  console.log(`\n${'='.repeat(50)}`.service);
  console.log(`🔄 RESETEANDO BASE DE DATOS: ${dbName.toUpperCase()}`.title);
  console.log(`${'='.repeat(50)}`.service);

  try {
    const connection = await mysql.createConnection(config);
    console.log(`✅ Conectado a ${dbName}`.success);

    // Deshabilitar verificaciones de claves foráneas temporalmente
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    console.log(`🔓 Verificaciones de claves foráneas deshabilitadas`.info);

    // Limpiar todas las tablas
    for (const table of tables) {
      try {
        await connection.execute(`TRUNCATE TABLE ${table}`);
        console.log(`🗑️  Tabla ${table} limpiada`.success);
      } catch (error) {
        console.log(`⚠️  Error limpiando tabla ${table}: ${error.message}`.warning);
      }
    }

    // Rehabilitar verificaciones de claves foráneas
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log(`🔒 Verificaciones de claves foráneas rehabilitadas`.info);

    // Verificar que las tablas están vacías
    console.log(`\n📊 Verificando tablas vacías:`.info);
    for (const table of tables) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        const count = rows[0].count;
        console.log(`   ${table}: ${count} registros`.info);
      } catch (error) {
        console.log(`   ${table}: Error verificando`.error);
      }
    }

    await connection.end();
    console.log(`✅ Base de datos ${dbName} reseteada exitosamente`.success);

  } catch (error) {
    console.error(`❌ Error reseteando ${dbName}: ${error.message}`.error);
    throw error;
  }
}

async function resetAllDatabases() {
  console.log(`\n🚀 INICIANDO RESET COMPLETO DE BASES DE DATOS`.title);
  console.log(`📅 Fecha: ${new Date().toLocaleString()}`.info);
  console.log(`🎯 Objetivo: Limpiar todas las tablas de todas las bases de datos`.info);

  const results = {
    success: [],
    failed: []
  };

  for (const [dbName, config] of Object.entries(dbConfigs)) {
    try {
      await resetDatabase(dbName, config);
      results.success.push(dbName);
    } catch (error) {
      results.failed.push({ db: dbName, error: error.message });
    }
  }

  // Resumen final
  console.log(`\n${'='.repeat(60)}`.service);
  console.log(`📋 RESUMEN DEL RESET`.title);
  console.log(`${'='.repeat(60)}`.service);

  if (results.success.length > 0) {
    console.log(`✅ Bases de datos reseteadas exitosamente:`.success);
    results.success.forEach(db => {
      console.log(`   - ${db}`.success);
    });
  }

  if (results.failed.length > 0) {
    console.log(`❌ Bases de datos con errores:`.error);
    results.failed.forEach(failure => {
      console.log(`   - ${failure.db}: ${failure.error}`.error);
    });
  }

  console.log(`\n🎯 Total procesadas: ${Object.keys(dbConfigs).length}`.info);
  console.log(`✅ Exitosas: ${results.success.length}`.success);
  console.log(`❌ Fallidas: ${results.failed.length}`.error);

  if (results.failed.length === 0) {
    console.log(`\n🎉 ¡RESET COMPLETO EXITOSO!`.success);
    console.log(`💡 Todas las tablas están vacías y listas para nuevos datos`.info);
  } else {
    console.log(`\n⚠️  Reset completado con errores`.warning);
    console.log(`💡 Revisa los errores anteriores y ejecuta nuevamente si es necesario`.info);
  }
}

// Ejecutar el script
if (require.main === module) {
  resetAllDatabases()
    .then(() => {
      console.log(`\n🏁 Script finalizado`.info);
      process.exit(0);
    })
    .catch((error) => {
      console.error(`\n💥 Error fatal: ${error.message}`.error);
      process.exit(1);
    });
}

module.exports = { resetAllDatabases, resetDatabase };
