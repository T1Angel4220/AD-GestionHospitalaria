const mysql = require('mysql2/promise');
require('colors');

const dbConfigs = {
  central: {
    host: 'mysql-central',
    user: 'admin_central',
    password: 'SuperPasswordCentral123!',
    database: 'hospital_central',
    port: 3306,
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
    timezone: '+00:00'
  },
  guayaquil: {
    host: 'mysql-guayaquil',
    user: 'admin_guayaquil',
    password: 'SuperPasswordGye123!',
    database: 'hospital_guayaquil',
    port: 3306,
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
    timezone: '+00:00'
  },
  cuenca: {
    host: 'mysql-cuenca',
    user: 'admin_cuenca',
    password: 'SuperPasswordCuenca123!',
    database: 'hospital_cuenca',
    port: 3306,
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
    timezone: '+00:00'
  }
};

async function debugConsultaPacienteJoin() {
  console.log('🔍 DEBUG CONSULTA-PACIENTE JOIN'.bold.blue);
  console.log('================================\n'.bold.blue);

  try {
    // Probar cada base de datos
    for (const [dbName, config] of Object.entries(dbConfigs)) {
      console.log(`🏥 PROBANDO ${dbName.toUpperCase()}:`.bold.cyan);
      console.log('====================================='.bold.cyan);
      
      try {
        const connection = await mysql.createConnection(config);
        
        // 1. Verificar consultas
        console.log('📊 CONSULTAS:'.yellow);
        const [consultas] = await connection.query(`
          SELECT c.id, c.id_paciente, c.id_medico, c.id_centro, c.motivo, c.estado
          FROM consultas c 
          ORDER BY c.id DESC 
          LIMIT 5
        `);
        
        consultas.forEach((consulta, index) => {
          console.log(`   ${index + 1}. ID: ${consulta.id}, Paciente ID: ${consulta.id_paciente}, Médico ID: ${consulta.id_medico}, Centro: ${consulta.id_centro}`);
        });
        
        // 2. Verificar pacientes
        console.log('\n👥 PACIENTES:'.yellow);
        const [pacientes] = await connection.query(`
          SELECT p.id, p.nombres, p.apellidos, p.id_centro
          FROM pacientes p 
          ORDER BY p.id DESC 
          LIMIT 5
        `);
        
        pacientes.forEach((paciente, index) => {
          console.log(`   ${index + 1}. ID: ${paciente.id}, Nombre: ${paciente.nombres} ${paciente.apellidos}, Centro: ${paciente.id_centro}`);
        });
        
        // 3. Probar JOIN
        console.log('\n🔗 JOIN CONSULTA-PACIENTE:'.yellow);
        const [joinResult] = await connection.query(`
          SELECT 
            c.id, c.id_paciente, c.id_medico, c.id_centro,
            p.nombres as paciente_nombre, p.apellidos as paciente_apellido,
            p.cedula as paciente_cedula
          FROM consultas c
          LEFT JOIN pacientes p ON p.id = c.id_paciente
          ORDER BY c.id DESC 
          LIMIT 5
        `);
        
        joinResult.forEach((result, index) => {
          console.log(`   ${index + 1}. Consulta ID: ${result.id}`);
          console.log(`      Paciente ID: ${result.id_paciente}`);
          console.log(`      Paciente: "${result.paciente_nombre} ${result.paciente_apellido}"`);
          console.log(`      Cédula: ${result.paciente_cedula}`);
          console.log('      ---');
        });
        
        await connection.end();
        console.log('');
        
      } catch (error) {
        console.log(`   ❌ Error conectando a ${dbName}:`, error.message);
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error general en el debug de JOIN:'.red.bold, error.message);
  }
}

debugConsultaPacienteJoin();
