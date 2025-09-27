const mysql = require('mysql2/promise');

// Configuración de conexiones
const connections = {
  central: {
    host: 'localhost',
    user: 'admin_central',
    password: 'SuperPasswordCentral123!',
    port: 3306,
    database: 'hospital_central'
  },
  guayaquil: {
    host: 'localhost',
    user: 'admin_guayaquil',
    password: 'SuperPasswordGye123!',
    port: 3307,
    database: 'hospital_guayaquil'
  },
  cuenca: {
    host: 'localhost',
    user: 'admin_cuenca',
    password: 'SuperPasswordCuenca123!',
    port: 3308,
    database: 'hospital_cuenca'
  }
};

async function testConnection(name, config) {
  try {
    console.log(`🔍 Probando conexión a ${name}...`);
    const connection = await mysql.createConnection(config);
    
    // Probar consulta simple
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as current_time');
    console.log(`✅ ${name}: Conexión exitosa - ${rows[0].current_time}`);
    
    await connection.end();
    return true;
  } catch (error) {
    console.log(`❌ ${name}: Error de conexión - ${error.message}`);
    return false;
  }
}

async function testAllConnections() {
  console.log('🚀 Iniciando pruebas de conexión a bases de datos...\n');
  
  const results = await Promise.all([
    testConnection('Central (Quito)', connections.central),
    testConnection('Guayaquil', connections.guayaquil),
    testConnection('Cuenca', connections.cuenca)
  ]);
  
  console.log('\n📊 Resumen de conexiones:');
  console.log(`Central (Quito): ${results[0] ? '✅ OK' : '❌ FALLO'}`);
  console.log(`Guayaquil: ${results[1] ? '✅ OK' : '❌ FALLO'}`);
  console.log(`Cuenca: ${results[2] ? '✅ OK' : '❌ FALLO'}`);
  
  const allConnected = results.every(result => result);
  console.log(`\n🎯 Estado general: ${allConnected ? '✅ TODAS LAS CONEXIONES OK' : '❌ ALGUNAS CONEXIONES FALLARON'}`);
  
  if (!allConnected) {
    console.log('\n💡 Posibles soluciones:');
    console.log('1. Verificar que MySQL esté ejecutándose en los puertos correctos');
    console.log('2. Ejecutar los scripts SQL para crear usuarios y bases de datos');
    console.log('3. Verificar que las credenciales sean correctas');
    console.log('4. Verificar que los puertos estén disponibles');
  }
}

// Ejecutar pruebas
testAllConnections().catch(console.error);
