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

async function limpiarTodasConsultas() {
  console.log('🧹 LIMPIANDO TODAS LAS CONSULTAS');
  console.log('================================\n');
  
  let totalConsultasEliminadas = 0;
  
  for (const [centro, config] of Object.entries(dbConfigs)) {
    console.log(`\n🏥 CENTRO: ${centro.toUpperCase()}`.title);
    console.log('='.repeat(50));
    
    try {
      const connection = await mysql.createConnection(config);
      console.log(`✅ Conectado a ${centro}`.success);
      
      // Contar consultas antes de eliminar
      const [countBefore] = await connection.query('SELECT COUNT(*) as total FROM consultas');
      const consultasAntes = countBefore[0].total;
      
      console.log(`📊 Consultas antes: ${consultasAntes}`.info);
      
      if (consultasAntes > 0) {
        // Eliminar todas las consultas
        const [result] = await connection.query('DELETE FROM consultas');
        console.log(`🗑️  Consultas eliminadas: ${result.affectedRows}`.warning);
        totalConsultasEliminadas += result.affectedRows;
        
        // Verificar que se eliminaron
        const [countAfter] = await connection.query('SELECT COUNT(*) as total FROM consultas');
        const consultasDespues = countAfter[0].total;
        
        console.log(`📊 Consultas después: ${consultasDespues}`.info);
        
        if (consultasDespues === 0) {
          console.log(`✅ ${centro} limpiado exitosamente`.success);
        } else {
          console.log(`❌ Error: quedaron ${consultasDespues} consultas en ${centro}`.error);
        }
      } else {
        console.log(`ℹ️  No había consultas en ${centro}`.info);
      }
      
      await connection.end();
      
    } catch (error) {
      console.log(`❌ Error en ${centro}: ${error.message}`.error);
    }
  }
  
  console.log('\n📊 RESUMEN FINAL:'.title);
  console.log('================');
  console.log(`🗑️  Total consultas eliminadas: ${totalConsultasEliminadas}`.warning);
  
  if (totalConsultasEliminadas > 0) {
    console.log('✅ Limpieza completada exitosamente'.success);
  } else {
    console.log('ℹ️  No había consultas para eliminar'.info);
  }
  
  console.log('\n🔍 VERIFICACIÓN FINAL:'.title);
  console.log('=====================');
  
  // Verificar que no quedan consultas
  for (const [centro, config] of Object.entries(dbConfigs)) {
    try {
      const connection = await mysql.createConnection(config);
      const [count] = await connection.query('SELECT COUNT(*) as total FROM consultas');
      const total = count[0].total;
      console.log(`${centro}: ${total} consultas restantes`);
      await connection.end();
    } catch (error) {
      console.log(`${centro}: Error verificando - ${error.message}`);
    }
  }
}

limpiarTodasConsultas();

