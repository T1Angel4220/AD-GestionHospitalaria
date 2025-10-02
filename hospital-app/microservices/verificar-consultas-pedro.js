const mysql = require('mysql2/promise');
const colors = require('colors');

// Configuración de colores
colors.setTheme({
  success: 'green',
  error: 'red',
  warning: 'yellow',
  info: 'cyan',
  title: 'magenta',
  service: 'blue'
});

// Configuración de la base de datos central
const dbConfig = {
  host: 'localhost',
  user: 'admin_central',
  password: 'SuperPasswordCentral123!',
  database: 'hospital_central',
  port: 3307
};

async function verificarConsultasPedro() {
  console.log('🔍 VERIFICANDO CONSULTAS DE PEDRO');
  console.log('==================================\n');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos central'.success);
    
    // 1. Buscar todas las consultas de Pedro
    console.log('\n📋 CONSULTAS DE PEDRO:'.info);
    const [consultasPedro] = await connection.query(`
      SELECT c.id, c.fecha, c.estado, c.id_centro, c.paciente_nombre, c.paciente_apellido, c.id_paciente
      FROM consultas c
      WHERE c.paciente_nombre LIKE '%Pedro%' OR c.paciente_apellido LIKE '%Paredes%'
      ORDER BY c.id
    `);
    
    console.log(`   Consultas encontradas: ${consultasPedro.length}`);
    consultasPedro.forEach(c => {
      console.log(`   ID: ${c.id}, Paciente: ${c.paciente_nombre} ${c.paciente_apellido}, ID Paciente: ${c.id_paciente}, Centro: ${c.id_centro}`);
    });
    
    // 2. Verificar el paciente con ID 4
    console.log('\n👤 PACIENTE CON ID 4:'.info);
    const [paciente4] = await connection.query(`
      SELECT p.id, p.nombres, p.apellidos, p.cedula, p.id_centro, cm.nombre as centro_nombre
      FROM pacientes p
      LEFT JOIN centros_medicos cm ON p.id_centro = cm.id
      WHERE p.id = 4
    `);
    
    if (paciente4.length > 0) {
      const p = paciente4[0];
      console.log(`   ID: ${p.id}, Nombre: ${p.nombres} ${p.apellidos}, Centro: ${p.centro_nombre} (ID: ${p.id_centro})`);
    } else {
      console.log('   No hay paciente con ID 4');
    }
    
    // 3. Eliminar consultas incorrectas manualmente
    if (consultasPedro.length > 0) {
      console.log('\n🗑️ ELIMINANDO CONSULTAS INCORRECTAS:'.warning);
      
      for (const consulta of consultasPedro) {
        if (consulta.paciente_nombre === 'Pedro RRR Paredes Pp' && consulta.id_paciente === 4) {
          try {
            await connection.execute('DELETE FROM consultas WHERE id = ?', [consulta.id]);
            console.log(`   ✅ Consulta ID ${consulta.id} eliminada`.success);
          } catch (error) {
            console.log(`   ❌ Error eliminando consulta ID ${consulta.id}: ${error.message}`.error);
          }
        }
      }
    }
    
    // 4. Verificar resultado final
    console.log('\n📊 RESULTADO FINAL:'.info);
    const [consultasFinales] = await connection.query(`
      SELECT c.id, c.fecha, c.estado, c.id_centro, c.paciente_nombre, c.paciente_apellido, c.id_paciente
      FROM consultas c
      ORDER BY c.id
    `);
    
    console.log(`   Total de consultas: ${consultasFinales.length}`);
    consultasFinales.forEach(c => {
      console.log(`   ID: ${c.id}, Paciente: ${c.paciente_nombre} ${c.paciente_apellido}, ID Paciente: ${c.id_paciente}, Centro: ${c.id_centro}`);
    });
    
    await connection.end();
    console.log('\n✅ Verificación completada'.success);
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`.error);
  }
}

verificarConsultasPedro();

