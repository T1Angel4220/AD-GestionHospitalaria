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

async function checkCentrosMedicos(dbName, config) {
  console.log(`\n🔍 Verificando Centros Médicos: ${dbName.toUpperCase()}`.title);
  console.log(`📍 Host: ${config.host}:${config.port}`.info);
  console.log(`🗄️ Database: ${config.database}`.info);
  
  try {
    const connection = await mysql.createConnection(config);
    
    // Verificar centros médicos existentes
    const [centros] = await connection.query('SELECT * FROM centros_medicos ORDER BY id');
    console.log(`📊 Centros médicos encontrados: ${centros.length}`.info);
    
    centros.forEach((centro, index) => {
      console.log(`  ${index + 1}. ID: ${centro.id} - ${centro.nombre} (${centro.ciudad})`.info);
    });
    
    // Si no hay centros, crear uno por defecto
    if (centros.length === 0) {
      console.log(`🔨 No hay centros médicos, creando uno por defecto...`.warning);
      
      const centroData = {
        central: { nombre: 'Hospital Central Quito', ciudad: 'Quito', direccion: 'Av. Central 123' },
        guayaquil: { nombre: 'Hospital Guayaquil', ciudad: 'Guayaquil', direccion: 'Av. 9 de Octubre 456' },
        cuenca: { nombre: 'Hospital Cuenca', ciudad: 'Cuenca', direccion: 'Av. Solano 789' }
      };
      
      const centro = centroData[dbName] || centroData.central;
      
      await connection.query(`
        INSERT INTO centros_medicos (nombre, ciudad, direccion) 
        VALUES (?, ?, ?)
      `, [centro.nombre, centro.ciudad, centro.direccion]);
      
      console.log(`✅ Centro médico creado: ${centro.nombre}`.success);
    }
    
    await connection.end();
    return true;
    
  } catch (error) {
    console.log(`❌ Error en ${dbName}: ${error.message}`.error);
    return false;
  }
}

async function runCheckCentros() {
  console.log(`\n🚀 VERIFICANDO CENTROS MÉDICOS`.title);
  console.log(`⏰ Fecha: ${new Date().toLocaleString()}`.info);
  
  let successCount = 0;
  
  for (const [dbName, config] of Object.entries(dbConfigs)) {
    const success = await checkCentrosMedicos(dbName, config);
    if (success) successCount++;
  }
  
  console.log(`\n📋 RESUMEN FINAL`.title);
  console.log(`✅ Bases de datos verificadas: ${successCount}/${Object.keys(dbConfigs).length}`.success);
  
  if (successCount === Object.keys(dbConfigs).length) {
    console.log(`\n🎉 ¡TODOS LOS CENTROS MÉDICOS ESTÁN LISTOS!`.success);
  } else {
    console.log(`\n⚠️ Algunas bases de datos necesitan atención manual`.warning);
  }
}

runCheckCentros();
