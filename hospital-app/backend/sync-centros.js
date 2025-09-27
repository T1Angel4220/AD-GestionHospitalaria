// Script para sincronizar centros de médicos con usuarios
const mysql = require('mysql2/promise');

async function syncCentros() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'admin_central',
    password: 'SuperPasswordCentral123!',
    database: 'hospital_central'
  });

  try {
    console.log('🔄 Iniciando sincronización de centros...');
    
    // Obtener todos los usuarios médicos con sus centros
    const [usuariosMedicos] = await connection.execute(`
      SELECT u.id, u.id_centro, u.id_medico, m.id_centro as medico_centro_actual,
             m.nombres, m.apellidos
      FROM usuarios u
      INNER JOIN medicos m ON u.id_medico = m.id
      WHERE u.rol = 'medico' AND u.id_medico IS NOT NULL
    `);
    
    console.log(`📊 Encontrados ${usuariosMedicos.length} usuarios médicos`);
    
    let sincronizados = 0;
    let errores = 0;
    
    for (const usuario of usuariosMedicos) {
      try {
        console.log(`\n👨‍⚕️ Médico: ${usuario.nombres} ${usuario.apellidos} (ID: ${usuario.id_medico})`);
        console.log(`   Usuario centro: ${usuario.id_centro}`);
        console.log(`   Médico centro actual: ${usuario.medico_centro_actual}`);
        
        // Si el centro del usuario es diferente al centro del médico, sincronizar
        if (usuario.id_centro !== usuario.medico_centro_actual) {
          await connection.execute(`
            UPDATE medicos 
            SET id_centro = ?
            WHERE id = ?
          `, [usuario.id_centro, usuario.id_medico]);
          
          console.log(`   ✅ Sincronizado: ${usuario.medico_centro_actual} → ${usuario.id_centro}`);
          sincronizados++;
        } else {
          console.log(`   ✅ Ya está sincronizado`);
        }
      } catch (error) {
        console.error(`   ❌ Error sincronizando médico ${usuario.id_medico}:`, error.message);
        errores++;
      }
    }
    
    console.log(`\n📈 Resultado:`);
    console.log(`   Usuarios revisados: ${usuariosMedicos.length}`);
    console.log(`   Médicos sincronizados: ${sincronizados}`);
    console.log(`   Errores: ${errores}`);
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await connection.end();
  }
}

syncCentros();
