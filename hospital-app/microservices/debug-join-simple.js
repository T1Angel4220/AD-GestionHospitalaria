const mysql = require('mysql2/promise');

async function debugJoin() {
  try {
    const connection = await mysql.createConnection({
      host: 'mysql-cuenca',
      user: 'admin_cuenca',
      password: 'SuperPasswordCuenca123!',
      database: 'hospital_cuenca',
      port: 3306
    });
    
    console.log('🔍 DEBUG JOIN EN CUENCA:');
    
    // Verificar consultas
    const [consultas] = await connection.query('SELECT c.id, c.id_paciente, c.id_medico, c.id_centro FROM consultas c ORDER BY c.id DESC LIMIT 3');
    console.log('📊 CONSULTAS:');
    consultas.forEach(c => {
      console.log(`   ID: ${c.id}, Paciente ID: ${c.id_paciente}, Médico ID: ${c.id_medico}`);
    });
    
    // Verificar pacientes
    const [pacientes] = await connection.query('SELECT p.id, p.nombres, p.apellidos FROM pacientes p ORDER BY p.id DESC LIMIT 3');
    console.log('👥 PACIENTES:');
    pacientes.forEach(p => {
      console.log(`   ID: ${p.id}, Nombre: ${p.nombres} ${p.apellidos}`);
    });
    
    // Probar JOIN
    const [joinResult] = await connection.query(`
      SELECT 
        c.id, c.id_paciente,
        p.nombres as paciente_nombre, p.apellidos as paciente_apellido
      FROM consultas c
      LEFT JOIN pacientes p ON p.id = c.id_paciente
      ORDER BY c.id DESC 
      LIMIT 3
    `);
    console.log('🔗 JOIN RESULT:');
    joinResult.forEach(r => {
      console.log(`   Consulta ${r.id}: ${r.paciente_nombre} ${r.paciente_apellido}`);
    });
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugJoin();
