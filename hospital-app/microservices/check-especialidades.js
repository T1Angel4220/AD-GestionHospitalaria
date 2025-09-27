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

async function checkEspecialidades(dbName, config) {
  console.log(`\n🔍 Verificando Especialidades: ${dbName.toUpperCase()}`.title);
  console.log(`📍 Host: ${config.host}:${config.port}`.info);
  console.log(`🗄️ Database: ${config.database}`.info);
  
  try {
    const connection = await mysql.createConnection(config);
    
    // Verificar especialidades existentes
    const [especialidades] = await connection.query('SELECT * FROM especialidades ORDER BY id');
    console.log(`📊 Especialidades encontradas: ${especialidades.length}`.info);
    
    especialidades.forEach((esp, index) => {
      console.log(`  ${index + 1}. ID: ${esp.id} - ${esp.nombre}`.info);
    });
    
    // Verificar médicos y sus especialidades
    const [medicos] = await connection.query(`
      SELECT m.id, m.nombres, m.apellidos, m.id_especialidad, e.nombre as especialidad_nombre
      FROM medicos m
      LEFT JOIN especialidades e ON e.id = m.id_especialidad
      ORDER BY m.id
    `);
    
    console.log(`\n👨‍⚕️ Médicos y sus especialidades:`.service);
    medicos.forEach((medico, index) => {
      const especialidad = medico.especialidad_nombre || 'Sin especialidad';
      console.log(`  ${index + 1}. ${medico.nombres} ${medico.apellidos} - ${especialidad}`.info);
    });
    
    await connection.end();
    return true;
    
  } catch (error) {
    console.log(`❌ Error en ${dbName}: ${error.message}`.error);
    return false;
  }
}

async function runCheckEspecialidades() {
  console.log(`\n🚀 VERIFICANDO ESPECIALIDADES EN BASES DE DATOS`.title);
  console.log(`⏰ Fecha: ${new Date().toLocaleString()}`.info);
  
  let successCount = 0;
  
  for (const [dbName, config] of Object.entries(dbConfigs)) {
    const success = await checkEspecialidades(dbName, config);
    if (success) successCount++;
  }
  
  console.log(`\n📋 RESUMEN FINAL`.title);
  console.log(`✅ Bases de datos verificadas: ${successCount}/${Object.keys(dbConfigs).length}`.success);
  
  if (successCount === Object.keys(dbConfigs).length) {
    console.log(`\n🎉 ¡TODAS LAS BASES DE DATOS VERIFICADAS!`.success);
  } else {
    console.log(`\n⚠️ Algunas bases de datos necesitan atención`.warning);
  }
}

runCheckEspecialidades();
