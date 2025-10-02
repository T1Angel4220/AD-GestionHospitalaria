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

async function limpiarConsultasIncorrectas() {
  console.log('🧹 LIMPIANDO CONSULTAS INCORRECTAS');
  console.log('==================================\n');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos central'.success);
    
    // 1. Mostrar consultas actuales
    console.log('\n📋 CONSULTAS ACTUALES:'.info);
    const [consultas] = await connection.query(`
      SELECT c.id, c.fecha, c.estado, c.id_centro, c.paciente_nombre, c.paciente_apellido, c.id_paciente
      FROM consultas c
      ORDER BY c.id
    `);
    
    consultas.forEach(c => {
      console.log(`   ID: ${c.id}, Paciente: ${c.paciente_nombre} ${c.paciente_apellido}, ID Paciente: ${c.id_paciente}, Centro: ${c.id_centro}`);
    });
    
    // 2. Identificar consultas incorrectas
    console.log('\n🔍 IDENTIFICANDO CONSULTAS INCORRECTAS:'.info);
    const consultasIncorrectas = consultas.filter(c => 
      c.paciente_nombre === 'Pedro RRR Paredes Pp' && c.id_paciente === 4
    );
    
    console.log(`   Consultas incorrectas encontradas: ${consultasIncorrectas.length}`);
    consultasIncorrectas.forEach(c => {
      console.log(`   - ID: ${c.id}, Paciente: ${c.paciente_nombre} ${c.paciente_apellido}, ID Paciente: ${c.id_paciente}`);
    });
    
    // 3. Eliminar consultas incorrectas
    if (consultasIncorrectas.length > 0) {
      console.log('\n🗑️ ELIMINANDO CONSULTAS INCORRECTAS:'.warning);
      
      for (const consulta of consultasIncorrectas) {
        try {
          await connection.execute('DELETE FROM consultas WHERE id = ?', [consulta.id]);
          console.log(`   ✅ Consulta ID ${consulta.id} eliminada`.success);
        } catch (error) {
          console.log(`   ❌ Error eliminando consulta ID ${consulta.id}: ${error.message}`.error);
        }
      }
      
      // 4. Verificar resultado
      console.log('\n📊 VERIFICANDO RESULTADO:'.info);
      const [consultasDespues] = await connection.query(`
        SELECT c.id, c.fecha, c.estado, c.id_centro, c.paciente_nombre, c.paciente_apellido, c.id_paciente
        FROM consultas c
        ORDER BY c.id
      `);
      
      console.log(`   Consultas restantes: ${consultasDespues.length}`);
      consultasDespues.forEach(c => {
        console.log(`   ID: ${c.id}, Paciente: ${c.paciente_nombre} ${c.paciente_apellido}, ID Paciente: ${c.id_paciente}, Centro: ${c.id_centro}`);
      });
      
      console.log('\n✅ Limpieza completada'.success);
    } else {
      console.log('\n✅ No hay consultas incorrectas que limpiar'.success);
    }
    
    await connection.end();
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`.error);
  }
}

limpiarConsultasIncorrectas();

