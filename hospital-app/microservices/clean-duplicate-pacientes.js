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

async function cleanDuplicatePacientes(dbName, config) {
  console.log(`\n🔧 Limpiando duplicados en: ${dbName.toUpperCase()}`.title);
  console.log(`📍 Host: ${config.host}:${config.port}`.info);
  console.log(`🗄️ Database: ${config.database}`.info);
  
  try {
    const connection = await mysql.createConnection(config);
    
    // Obtener todos los pacientes
    const [pacientes] = await connection.query('SELECT * FROM pacientes ORDER BY id');
    console.log(`📊 Total pacientes: ${pacientes.length}`.info);
    
    if (pacientes.length === 0) {
      console.log(`✅ No hay pacientes en ${dbName}`.success);
      await connection.end();
      return true;
    }
    
    // Encontrar duplicados por cédula
    const cedulas = {};
    const duplicados = [];
    
    pacientes.forEach(paciente => {
      if (cedulas[paciente.cedula]) {
        duplicados.push(paciente);
      } else {
        cedulas[paciente.cedula] = paciente;
      }
    });
    
    if (duplicados.length === 0) {
      console.log(`✅ No hay duplicados en ${dbName}`.success);
      await connection.end();
      return true;
    }
    
    console.log(`⚠️ Encontrados ${duplicados.length} duplicados:`.warning);
    duplicados.forEach(dup => {
      console.log(`   - ID: ${dup.id}, Cédula: ${dup.cedula}, Nombre: ${dup.nombres} ${dup.apellidos}`.warning);
    });
    
    // Eliminar duplicados (mantener el primero)
    for (const duplicado of duplicados) {
      console.log(`🗑️ Eliminando duplicado ID ${duplicado.id} (${duplicado.nombres} ${duplicado.apellidos})...`.info);
      await connection.execute('DELETE FROM pacientes WHERE id = ?', [duplicado.id]);
    }
    
    console.log(`✅ ${duplicados.length} duplicados eliminados en ${dbName}`.success);
    
    await connection.end();
    return true;
    
  } catch (error) {
    console.log(`❌ Error en ${dbName}: ${error.message}`.error);
    return false;
  }
}

async function runCleanDuplicates() {
  console.log(`\n🚀 LIMPIANDO PACIENTES DUPLICADOS`.title);
  console.log(`⏰ Fecha: ${new Date().toLocaleString()}`.info);
  
  let successCount = 0;
  
  for (const [dbName, config] of Object.entries(dbConfigs)) {
    const success = await cleanDuplicatePacientes(dbName, config);
    if (success) successCount++;
  }
  
  console.log(`\n📋 RESUMEN FINAL`.title);
  console.log(`✅ Bases de datos limpiadas: ${successCount}/${Object.keys(dbConfigs).length}`.success);
  
  if (successCount === Object.keys(dbConfigs).length) {
    console.log(`\n🎉 ¡DUPLICADOS ELIMINADOS DE TODAS LAS BASES DE DATOS!`.success);
  } else {
    console.log(`\n⚠️ Algunas bases de datos necesitan atención manual`.warning);
  }
}

runCleanDuplicates();

