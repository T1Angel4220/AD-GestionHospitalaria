const mysql = require('mysql2/promise');

async function checkUser() {
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

    // Buscar el usuario
    const [rows] = await connection.execute(
      'SELECT id, email, rol, id_centro FROM usuarios WHERE email = ?',
      ['admin@hospital.com']
    );

    if (rows.length > 0) {
      console.log('✅ Usuario encontrado:');
      console.log('📧 Email:', rows[0].email);
      console.log('👑 Rol:', rows[0].rol);
      console.log('🏥 Centro:', rows[0].id_centro);
    } else {
      console.log('❌ Usuario no encontrado');
    }

    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUser();
