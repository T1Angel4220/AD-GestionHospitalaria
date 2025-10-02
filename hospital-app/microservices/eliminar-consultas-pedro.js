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

async function eliminarConsultasPedro() {
  console.log('🗑️ ELIMINANDO CONSULTAS DE PEDRO');
  console.log('=================================\n');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos central'.success);
    
    // Eliminar consultas específicas de Pedro
    const consultasAEliminar = [11, 12];
    
    for (const id of consultasAEliminar) {
      try {
        const [result] = await connection.execute('DELETE FROM consultas WHERE id = ?', [id]);
        console.log(`✅ Consulta ID ${id} eliminada (${result.affectedRows} filas afectadas)`.success);
      } catch (error) {
        console.log(`❌ Error eliminando consulta ID ${id}: ${error.message}`.error);
      }
    }
    
    // Verificar resultado
    console.log('\n📊 VERIFICANDO RESULTADO:'.info);
    const [consultasRestantes] = await connection.query(`
      SELECT c.id, c.fecha, c.estado, c.id_centro, c.paciente_nombre, c.paciente_apellido, c.id_paciente
      FROM consultas c
      ORDER BY c.id
    `);
    
    console.log(`   Total de consultas restantes: ${consultasRestantes.length}`);
    consultasRestantes.forEach(c => {
      console.log(`   ID: ${c.id}, Paciente: ${c.paciente_nombre} ${c.paciente_apellido}, ID Paciente: ${c.id_paciente}, Centro: ${c.id_centro}`);
    });
    
    await connection.end();
    console.log('\n✅ Eliminación completada'.success);
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`.error);
  }
}

eliminarConsultasPedro();

