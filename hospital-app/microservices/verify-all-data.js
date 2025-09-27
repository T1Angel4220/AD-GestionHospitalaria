const mysql = require('mysql2/promise');
const colors = require('colors');

// Configuración de colores
colors.setTheme({
  success: 'green',
  error: 'red',
  warning: 'yellow',
  info: 'cyan',
  title: 'magenta',
  service: 'blue',
  data: 'white'
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

// Función para mostrar datos de una tabla
async function showTableData(connection, tableName, centro) {
  try {
    const [rows] = await connection.execute(`SELECT * FROM ${tableName} ORDER BY id`);
    console.log(`\n📋 ${tableName.toUpperCase()} en ${centro.toUpperCase()}:`.service);
    console.log(`📊 Total registros: ${rows.length}`.info);
    
    if (rows.length > 0) {
      console.log(`📝 Datos:`.data);
      rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${JSON.stringify(row, null, 2)}`.data);
      });
    } else {
      console.log(`   ⚠️ No hay datos`.warning);
    }
    
    return rows.length;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`.error);
    return 0;
  }
}

// Función para verificar datos de todas las tablas
async function verifyAllData() {
  console.log(`\n🔍 VERIFICACIÓN COMPLETA DE TODAS LAS BASES DE DATOS`.title);
  console.log(`⏰ Fecha: ${new Date().toLocaleString()}`.info);
  
  const summary = {
    central: {},
    guayaquil: {},
    cuenca: {}
  };
  
  for (const [centro, config] of Object.entries(dbConfigs)) {
    console.log(`\n${'='.repeat(60)}`.service);
    console.log(`📊 PROCESANDO: ${centro.toUpperCase()}`.service);
    console.log(`🗄️ Base de datos: ${config.database}`.info);
    console.log(`🌐 Host: ${config.host}:${config.port}`.info);
    console.log(`${'='.repeat(60)}`.service);
    
    try {
      const connection = await mysql.createConnection(config);
      console.log(`✅ Conectado exitosamente`.success);
      
      // Verificar cada tabla
      const tables = [
        'centros_medicos',
        'especialidades', 
        'medicos',
        'pacientes',
        'empleados',
        'usuarios',
        'consultas'
      ];
      
      for (const table of tables) {
        const count = await showTableData(connection, table, centro);
        summary[centro][table] = count;
      }
      
      await connection.end();
      console.log(`\n✅ ${centro.toUpperCase()} verificado completamente`.success);
      
    } catch (error) {
      console.log(`\n❌ Error conectando a ${centro}: ${error.message}`.error);
      summary[centro] = { error: error.message };
    }
  }
  
  // Resumen final
  console.log(`\n${'='.repeat(80)}`.title);
  console.log(`📊 RESUMEN FINAL DE TODAS LAS BASES DE DATOS`.title);
  console.log(`${'='.repeat(80)}`.title);
  
  for (const [centro, data] of Object.entries(summary)) {
    console.log(`\n🏥 ${centro.toUpperCase()}:`.service);
    
    if (data.error) {
      console.log(`   ❌ Error: ${data.error}`.error);
    } else {
      Object.entries(data).forEach(([table, count]) => {
        const status = count > 0 ? '✅' : '⚠️';
        console.log(`   ${status} ${table}: ${count} registros`.data);
      });
    }
  }
  
  // Verificar consistencia entre centros
  console.log(`\n🔍 VERIFICACIÓN DE CONSISTENCIA:`.title);
  
  const centrosData = Object.values(summary).filter(data => !data.error);
  if (centrosData.length > 0) {
    const firstCentro = centrosData[0];
    let isConsistent = true;
    
    Object.keys(firstCentro).forEach(table => {
      const counts = centrosData.map(data => data[table] || 0);
      const uniqueCounts = [...new Set(counts)];
      
      if (uniqueCounts.length > 1) {
        console.log(`   ⚠️ ${table}: Conteos inconsistentes ${counts.join(', ')}`.warning);
        isConsistent = false;
      } else {
        console.log(`   ✅ ${table}: Consistente (${counts[0]} registros)`.success);
      }
    });
    
    if (isConsistent) {
      console.log(`\n🎉 ¡TODAS LAS BASES DE DATOS ESTÁN CONSISTENTES!`.success);
    } else {
      console.log(`\n⚠️ Se encontraron inconsistencias entre las bases de datos`.warning);
    }
  }
  
  console.log(`\n📋 VERIFICACIÓN COMPLETADA`.title);
  console.log(`⏰ Finalizado: ${new Date().toLocaleString()}`.info);
}

// Ejecutar verificación
verifyAllData().catch(console.error);
