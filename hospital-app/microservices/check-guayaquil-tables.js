const mysql = require('mysql2/promise');

async function checkTables() {
  try {
    // Conectar a la base de datos Guayaquil
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3308,
      user: 'admin_guayaquil',
      password: 'SuperPasswordGye123!',
      database: 'hospital_guayaquil'
    });

    console.log('✅ Conectado a Guayaquil');

    // Verificar si existe la tabla usuarios
    const [tables] = await connection.execute('SHOW TABLES LIKE "usuarios"');
    
    if (tables.length > 0) {
      console.log('✅ Tabla usuarios existe en Guayaquil');
      
      // Contar usuarios
      const [count] = await connection.execute('SELECT COUNT(*) as total FROM usuarios');
      console.log('👥 Total usuarios en Guayaquil:', count[0].total);
    } else {
      console.log('❌ Tabla usuarios NO existe en Guayaquil');
    }

    await connection.end();
    
  } catch (error) {
    console.error('❌ Error en Guayaquil:', error.message);
  }
}

checkTables();
