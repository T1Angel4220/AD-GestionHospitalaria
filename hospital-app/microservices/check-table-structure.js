const mysql = require('mysql2/promise');

async function checkTableStructure() {
  try {
    // Conectar a la base de datos central
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3307,
      user: 'admin_central',
      password: 'SuperPasswordCentral123!',
      database: 'hospital_central'
    });

    console.log('✅ Conectado a la base de datos');

    // Verificar estructura de la tabla usuarios
    const [rows] = await connection.execute('DESCRIBE usuarios');
    
    console.log('📋 Estructura de la tabla usuarios:');
    rows.forEach(row => {
      console.log(`  ${row.Field} - ${row.Type} - ${row.Null} - ${row.Key} - ${row.Default}`);
    });

    // Verificar datos existentes
    const [users] = await connection.execute('SELECT * FROM usuarios LIMIT 5');
    console.log('\n👥 Usuarios existentes:');
    users.forEach(user => {
      console.log('  Usuario:', user);
    });

    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTableStructure();
