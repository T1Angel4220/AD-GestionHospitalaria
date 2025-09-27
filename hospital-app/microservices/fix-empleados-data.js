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
    centroId: 1
  },
  guayaquil: {
    host: 'localhost',
    user: 'admin_guayaquil',
    password: 'SuperPasswordGye123!',
    database: 'hospital_guayaquil',
    port: 3308,
    centroId: 2
  },
  cuenca: {
    host: 'localhost',
    user: 'admin_cuenca',
    password: 'SuperPasswordCuenca123!',
    database: 'hospital_cuenca',
    port: 3309,
    centroId: 3
  }
};

// Datos de empleados para cada centro
const empleadosData = {
  central: [
    { nombres: 'Ana', apellidos: 'García', cargo: 'Enfermera Jefe' },
    { nombres: 'Carlos', apellidos: 'López', cargo: 'Técnico de Laboratorio' },
    { nombres: 'María', apellidos: 'Rodríguez', cargo: 'Recepcionista' },
    { nombres: 'Luis', apellidos: 'Martínez', cargo: 'Auxiliar de Enfermería' },
    { nombres: 'Elena', apellidos: 'Fernández', cargo: 'Farmacéutica' }
  ],
  guayaquil: [
    { nombres: 'Roberto', apellidos: 'Silva', cargo: 'Enfermero Jefe' },
    { nombres: 'Carmen', apellidos: 'Vega', cargo: 'Técnica de Laboratorio' },
    { nombres: 'Diego', apellidos: 'Mendoza', cargo: 'Recepcionista' },
    { nombres: 'Patricia', apellidos: 'Castro', cargo: 'Auxiliar de Enfermería' },
    { nombres: 'Fernando', apellidos: 'Rojas', cargo: 'Farmacéutico' }
  ],
  cuenca: [
    { nombres: 'Isabel', apellidos: 'Torres', cargo: 'Enfermera Jefe' },
    { nombres: 'Andrés', apellidos: 'Jiménez', cargo: 'Técnico de Laboratorio' },
    { nombres: 'Lucía', apellidos: 'Herrera', cargo: 'Recepcionista' },
    { nombres: 'Miguel', apellidos: 'Paredes', cargo: 'Auxiliar de Enfermería' },
    { nombres: 'Sofía', apellidos: 'Morales', cargo: 'Farmacéutica' }
  ]
};

async function fixEmpleadosData(dbName, config) {
  console.log(`\n🔧 Arreglando datos de empleados: ${dbName.toUpperCase()}`.title);
  console.log(`📍 Host: ${config.host}:${config.port}`.info);
  console.log(`🗄️ Database: ${config.database}`.info);
  console.log(`🏥 Centro ID: ${config.centroId}`.info);
  
  try {
    const connection = await mysql.createConnection(config);
    
    // Verificar si ya hay empleados
    const [existing] = await connection.query('SELECT COUNT(*) as count FROM empleados');
    console.log(`📊 Empleados existentes: ${existing[0].count}`.info);
    
    if (existing[0].count > 0) {
      console.log(`🗑️ Eliminando empleados existentes...`.warning);
      await connection.query('DELETE FROM empleados');
      console.log(`✅ Empleados eliminados`.success);
    }
    
    // Insertar empleados con el ID correcto del centro
    const empleados = empleadosData[dbName] || empleadosData.central;
    console.log(`📝 Insertando ${empleados.length} empleados...`.info);
    
    for (const empleado of empleados) {
      await connection.query(`
        INSERT INTO empleados (nombres, apellidos, cargo, id_centro) 
        VALUES (?, ?, ?, ?)
      `, [empleado.nombres, empleado.apellidos, empleado.cargo, config.centroId]);
    }
    
    console.log(`✅ ${empleados.length} empleados insertados exitosamente`.success);
    
    // Verificar inserción
    const [count] = await connection.query('SELECT COUNT(*) as count FROM empleados');
    console.log(`📈 Total empleados: ${count[0].count}`.info);
    
    // Mostrar empleados insertados
    const [empleadosList] = await connection.query(`
      SELECT nombres, apellidos, cargo, id_centro 
      FROM empleados 
      ORDER BY nombres
    `);
    
    console.log(`👥 Empleados en ${dbName}:`.info);
    empleadosList.forEach((emp, index) => {
      console.log(`  ${index + 1}. ${emp.nombres} ${emp.apellidos} - ${emp.cargo} (Centro: ${emp.id_centro})`.info);
    });
    
    await connection.end();
    return true;
    
  } catch (error) {
    console.log(`❌ Error en ${dbName}: ${error.message}`.error);
    return false;
  }
}

async function runFixEmpleados() {
  console.log(`\n🚀 ARREGLANDO DATOS DE EMPLEADOS`.title);
  console.log(`⏰ Fecha: ${new Date().toLocaleString()}`.info);
  
  let successCount = 0;
  
  for (const [dbName, config] of Object.entries(dbConfigs)) {
    const success = await fixEmpleadosData(dbName, config);
    if (success) successCount++;
  }
  
  console.log(`\n📋 RESUMEN FINAL`.title);
  console.log(`✅ Bases de datos arregladas: ${successCount}/${Object.keys(dbConfigs).length}`.success);
  
  if (successCount === Object.keys(dbConfigs).length) {
    console.log(`\n🎉 ¡DATOS DE EMPLEADOS ARREGLADOS EN TODAS LAS BASES!`.success);
    console.log(`\n🔍 Ahora puedes probar el Reports Service sin errores`.info);
  } else {
    console.log(`\n⚠️ Algunas bases de datos necesitan atención manual`.warning);
  }
}

runFixEmpleados();
