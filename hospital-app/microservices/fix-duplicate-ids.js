const mysql = require('mysql2/promise');

async function fixDuplicateIds() {
  console.log('🔧 CORRIGIENDO IDs DUPLICADOS');
  console.log('=============================\n');
  
  const dbConfigs = {
    central: {
      host: 'localhost',
      user: 'root',
      password: 'password',
      database: 'hospital_central',
      port: 3306,
      charset: 'utf8mb4',
      timezone: '+00:00'
    },
    guayaquil: {
      host: 'localhost',
      user: 'root',
      password: 'password',
      database: 'hospital_guayaquil',
      port: 3307,
      charset: 'utf8mb4',
      timezone: '+00:00'
    },
    cuenca: {
      host: 'localhost',
      user: 'root',
      password: 'password',
      database: 'hospital_cuenca',
      port: 3308,
      charset: 'utf8mb4',
      timezone: '+00:00'
    }
  };
  
  const pools = {};
  
  try {
    // Conectar a todas las bases de datos
    for (const [centro, config] of Object.entries(dbConfigs)) {
      console.log(`🔌 Conectando a ${centro}...`);
      pools[centro] = await mysql.createPool(config);
      console.log(`✅ Conectado a ${centro}`);
    }
    
    // 1. Verificar IDs actuales
    console.log('\n📊 VERIFICANDO IDs ACTUALES:'.info);
    
    for (const [centro, pool] of Object.entries(pools)) {
      console.log(`\n🏥 CENTRO: ${centro.toUpperCase()}`);
      const [rows] = await pool.query('SELECT id, nombres, apellidos FROM pacientes ORDER BY id');
      rows.forEach(p => {
        console.log(`   ID: ${p.id}, Nombre: ${p.nombres} ${p.apellidos}`);
      });
    }
    
    // 2. Corregir IDs duplicados
    console.log('\n🔧 CORRIGIENDO IDs DUPLICADOS:'.info);
    
    // Cambiar Pedro de ID 4 a ID 6 en Guayaquil
    console.log('🏥 Cambiando Pedro de ID 4 a ID 6 en Guayaquil...');
    await pools.guayaquil.execute('UPDATE pacientes SET id = 6 WHERE id = 4 AND nombres = "Pedro RRR"');
    
    // Cambiar Sebastián de ID 5 a ID 7 en Cuenca
    console.log('🏥 Cambiando Sebastián de ID 5 a ID 7 en Cuenca...');
    await pools.cuenca.execute('UPDATE pacientes SET id = 7 WHERE id = 5 AND nombres = "Sebastián Alejandro"');
    
    // 3. Verificar IDs corregidos
    console.log('\n📊 VERIFICANDO IDs CORREGIDOS:'.info);
    
    for (const [centro, pool] of Object.entries(pools)) {
      console.log(`\n🏥 CENTRO: ${centro.toUpperCase()}`);
      const [rows] = await pool.query('SELECT id, nombres, apellidos FROM pacientes ORDER BY id');
      rows.forEach(p => {
        console.log(`   ID: ${p.id}, Nombre: ${p.nombres} ${p.apellidos}`);
      });
    }
    
    console.log('\n✅ IDs corregidos exitosamente');
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  } finally {
    // Cerrar conexiones
    for (const [centro, pool] of Object.entries(pools)) {
      await pool.end();
      console.log(`🔌 Conexión ${centro} cerrada`);
    }
  }
}

fixDuplicateIds();

