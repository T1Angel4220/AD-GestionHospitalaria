const axios = require('axios');

async function debugConsultaDelete() {
  console.log('🔍 DEBUG CONSULTA DELETE');
  console.log('========================\n');
  
  try {
    // 1. Login como admin
    console.log('🔐 Obteniendo token de admin...');
    const loginResponse = await axios.post('http://localhost:3001/login', {
      email: 'admin@hospital.com',
      password: 'password'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Token obtenido\n');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. Obtener todas las consultas para ver los IDs disponibles
    console.log('📊 CONSULTAS DISPONIBLES:');
    console.log('========================');
    
    try {
      const consultasResponse = await axios.get('http://localhost:3003/consultas', { headers });
      const consultas = consultasResponse.data;
      
      console.log(`📊 Total consultas: ${consultas.length}`);
      
      if (consultas.length > 0) {
        console.log('\n📋 CONSULTAS DISPONIBLES:');
        consultas.forEach((consulta, index) => {
          console.log(`   ${index + 1}. ID: ${consulta.id}`);
          console.log(`      Paciente: ${consulta.paciente_nombre} ${consulta.paciente_apellidos}`);
          console.log(`      Centro: ${consulta.id_centro}`);
          console.log(`      Estado: ${consulta.estado}`);
          console.log(`      Motivo: ${consulta.motivo}`);
          console.log('      ---');
        });
        
        // 3. Probar eliminar la primera consulta
        const primeraConsulta = consultas[0];
        console.log(`\n🗑️  PROBANDO ELIMINACIÓN DE CONSULTA ID: ${primeraConsulta.id}`);
        console.log('===============================================');
        
        try {
          const deleteResponse = await axios.delete(`http://localhost:3003/consultas/${primeraConsulta.id}`, { headers });
          
          console.log('✅ Consulta eliminada exitosamente:');
          console.log(`   Status: ${deleteResponse.status}`);
          console.log(`   Data: ${JSON.stringify(deleteResponse.data, null, 2)}`);
          
          // 4. Verificar que se eliminó
          console.log('\n🔍 VERIFICANDO ELIMINACIÓN:');
          console.log('==========================');
          
          const consultasAfterResponse = await axios.get('http://localhost:3003/consultas', { headers });
          const consultasAfter = consultasAfterResponse.data;
          
          console.log(`📊 Total consultas después: ${consultasAfter.length}`);
          
          const consultaEliminada = consultasAfter.find(c => c.id === primeraConsulta.id);
          if (consultaEliminada) {
            console.log('❌ La consulta NO fue eliminada');
          } else {
            console.log('✅ La consulta fue eliminada correctamente');
          }
          
        } catch (deleteError) {
          console.log('❌ Error eliminando consulta:');
          console.log(`   Status: ${deleteError.response?.status}`);
          console.log(`   Message: ${deleteError.response?.data?.error || deleteError.message}`);
          console.log(`   Data: ${JSON.stringify(deleteError.response?.data, null, 2)}`);
        }
        
      } else {
        console.log('❌ No hay consultas disponibles para probar');
      }
      
    } catch (error) {
      console.log('❌ Error obteniendo consultas:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.log(`❌ Error general: ${error.message}`);
  }
}

debugConsultaDelete();
