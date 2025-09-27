const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createUser() {
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

    // Crear hash de la contraseña
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('✅ Contraseña hasheada');

    // Insertar usuario
    const [result] = await connection.execute(
      'INSERT INTO usuarios (email, password_hash, rol, id_centro) VALUES (?, ?, ?, ?)',
      ['admin@hospital.com', hashedPassword, 'admin', 1]
    );

    console.log('✅ Usuario creado con ID:', result.insertId);
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createUser();
