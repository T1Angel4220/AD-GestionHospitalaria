const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function createTestAdmin() {
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

    // Hash de la contraseña
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('🔑 Contraseña original:', password);
    console.log('🔐 Contraseña hasheada:', hashedPassword);

    // Eliminar usuario existente si existe
    await connection.execute('DELETE FROM usuarios WHERE email = ?', ['admin@hospital.com']);
    console.log('🗑️ Usuario anterior eliminado');

    // Crear nuevo usuario admin
    const [result] = await connection.execute(
      'INSERT INTO usuarios (email, password, rol, id_centro) VALUES (?, ?, ?, ?)',
      ['admin@hospital.com', hashedPassword, 'admin', 1]
    );

    console.log('✅ Usuario admin creado exitosamente');
    console.log('📧 Email: admin@hospital.com');
    console.log('🔑 Password: admin123');
    console.log('👑 Rol: admin');
    console.log('🏥 Centro: 1');

    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestAdmin();
