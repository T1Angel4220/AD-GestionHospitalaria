const mysql = require('mysql2/promise');

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

async function checkDatabaseUsers() {
  console.log('🔍 VERIFICANDO USUARIOS EN BASE DE DATOS');
  console.log('========================================\n');
  
  for (const [dbName, config] of Object.entries(dbConfigs)) {
    console.log(`📊 Verificando base de datos: ${dbName.toUpperCase()}`);
    console.log(`🔗 Host: ${config.host}:${config.port}`);
    console.log(`🗄️ Database: ${config.database}\n`);
    
    try {
      const connection = await mysql.createConnection(config);
      
      // Verificar si la tabla usuarios existe
      const [tables] = await connection.execute(
        "SHOW TABLES LIKE 'usuarios'"
      );
      
      if (tables.length === 0) {
        console.log(`❌ La tabla 'usuarios' no existe en ${dbName}`);
        console.log('');
        continue;
      }
      
      console.log(`✅ Tabla 'usuarios' existe en ${dbName}`);
      
      // Obtener todos los usuarios
      const [users] = await connection.execute(
        'SELECT id, email, rol, id_centro, created_at FROM usuarios ORDER BY created_at DESC'
      );
      
      if (users.length === 0) {
        console.log(`📝 No hay usuarios en ${dbName}`);
      } else {
        console.log(`👥 Usuarios encontrados en ${dbName}: ${users.length}`);
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ID: ${user.id} | Email: ${user.email} | Rol: ${user.rol} | Centro: ${user.id_centro} | Creado: ${user.created_at}`);
        });
      }
      
      await connection.end();
      console.log('');
      
    } catch (error) {
      console.log(`❌ Error conectando a ${dbName}: ${error.message}`);
      console.log('');
    }
  }
  
  console.log('🔍 VERIFICANDO CONEXIÓN A AUTH SERVICE');
  console.log('=====================================\n');
  
  try {
    const axios = require('axios');
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('✅ Auth service health check:');
    console.log(JSON.stringify(healthResponse.data, null, 2));
  } catch (error) {
    console.log('❌ Error verificando auth service:', error.message);
  }
  
  console.log('\n💡 RECOMENDACIONES:');
  console.log('==================');
  console.log('1. Si no hay usuarios admin, crea uno nuevo');
  console.log('2. Si hay usuarios admin, verifica las credenciales');
  console.log('3. Asegúrate de que el auth-service esté conectado a la BD correcta');
  console.log('4. Revisa los logs del auth-service para más detalles');
}

checkDatabaseUsers();
