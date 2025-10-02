const axios = require('axios');

async function debugConsultaEdit() {
  console.log('🔍 DEBUG CONSULTA EDIT');
  console.log('======================\n');
  
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
        
        // 3. Probar editar la primera consulta
        const primeraConsulta = consultas[0];
        console.log(`\n🔧 PROBANDO EDICIÓN DE CONSULTA ID: ${primeraConsulta.id}`);
        console.log('===============================================');
        
        const updateData = {
          motivo: 'Motivo actualizado',
          diagnostico: 'Diagnóstico actualizado',
          tratamiento: 'Tratamiento actualizado'
        };
        
        console.log('📤 Datos de actualización:');
        console.log(JSON.stringify(updateData, null, 2));
        
        try {
          const updateResponse = await axios.put(`http://localhost:3003/consultas/${primeraConsulta.id}`, updateData, { headers });
          
          console.log('✅ Consulta actualizada exitosamente:');
          console.log(`   Status: ${updateResponse.status}`);
          console.log(`   Data: ${JSON.stringify(updateResponse.data, null, 2)}`);
          
        } catch (updateError) {
          console.log('❌ Error actualizando consulta:');
          console.log(`   Status: ${updateError.response?.status}`);
          console.log(`   Message: ${updateError.response?.data?.error || updateError.message}`);
          console.log(`   Data: ${JSON.stringify(updateError.response?.data, null, 2)}`);
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

debugConsultaEdit();
