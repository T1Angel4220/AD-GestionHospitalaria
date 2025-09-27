const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createTestUser() {
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

    // Eliminar usuario existente
    await connection.execute('DELETE FROM usuarios WHERE email = ?', ['test@hospital.com']);
    console.log('🗑️ Usuario anterior eliminado (si existía)');

    // Crear hash de la contraseña
    const hashedPassword = await bcrypt.hash('test123', 10);
    console.log('✅ Contraseña hasheada');

    // Insertar usuario
    const [result] = await connection.execute(
      'INSERT INTO usuarios (email, password_hash, rol, id_centro) VALUES (?, ?, ?, ?)',
      ['test@hospital.com', hashedPassword, 'admin', 1]
    );

    console.log('✅ Usuario de prueba creado con ID:', result.insertId);
    console.log('📧 Email: test@hospital.com');
    console.log('🔑 Password: test123');
    console.log('👑 Rol: admin');
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestUser();
