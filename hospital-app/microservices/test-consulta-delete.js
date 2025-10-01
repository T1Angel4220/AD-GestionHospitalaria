const axios = require('axios');

async function testConsultaDelete() {
  console.log('🔧 PROBANDO ELIMINACIÓN DE CONSULTAS');
  console.log('===================================\n');
  
  try {
    // 1. Hacer login como admin
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
    
    // 2. Obtener todas las consultas
    console.log('📋 Obteniendo consultas existentes...');
    const consultasResponse = await axios.get('http://localhost:3003/consultas', { headers });
    
    console.log(`✅ ${consultasResponse.data.length} consultas encontradas\n`);
    
    if (consultasResponse.data.length > 0) {
      const consulta = consultasResponse.data[0];
      console.log('📋 Datos de la primera consulta:');
      console.log(`   ID: ${consulta.id}`);
      console.log(`   ID Frontend: ${consulta.id_frontend || 'N/A'}`);
      console.log(`   Médico: ${consulta.medico_nombres || 'N/A'} ${consulta.medico_apellidos || 'N/A'}`);
      console.log(`   Paciente: ${consulta.paciente_nombres || 'N/A'} ${consulta.paciente_apellidos || 'N/A'}`);
      console.log(`   Motivo: ${consulta.motivo || 'N/A'}`);
      console.log(`   Estado: ${consulta.estado || 'N/A'}`);
      console.log(`   Centro: ${consulta.id_centro || 'N/A'}`);
      console.log(`   Origen BD: ${consulta.origen_bd || 'N/A'}\n`);
      
      // 3. Intentar eliminar la consulta
      console.log(`🗑️ Intentando eliminar consulta ID: ${consulta.id}...`);
      
      try {
        const deleteResponse = await axios.delete(`http://localhost:3003/consultas/${consulta.id}`, { headers });
        console.log('✅ Consulta eliminada exitosamente!');
        console.log(`📋 Respuesta: ${JSON.stringify(deleteResponse.data, null, 2)}`);
        
        // 4. Verificar que se eliminó
        console.log('\n🔍 Verificando que la consulta se eliminó...');
        const consultasAfterResponse = await axios.get('http://localhost:3003/consultas', { headers });
        const consultaEliminada = consultasAfterResponse.data.find(c => c.id === consulta.id);
        
        if (!consultaEliminada) {
          console.log('✅ La consulta fue eliminada correctamente');
        } else {
          console.log('❌ La consulta aún existe');
        }
        
      } catch (deleteError) {
        console.log(`❌ Error al eliminar consulta: ${deleteError.message}`);
        if (deleteError.response) {
          console.log(`📊 Status: ${deleteError.response.status}`);
          console.log(`📝 Datos: ${JSON.stringify(deleteError.response.data, null, 2)}`);
        }
      }
      
    } else {
      console.log('❌ No hay consultas para probar la eliminación');
    }
    
  } catch (error) {
    console.log(`❌ Error durante la prueba: ${error.message}`);
    
    if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`📝 Datos: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

testConsultaDelete();
