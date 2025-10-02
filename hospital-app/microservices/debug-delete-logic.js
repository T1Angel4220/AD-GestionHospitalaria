const axios = require('axios');

async function debugDeleteLogic() {
  console.log('🔍 DEBUGGING DELETE LOGIC');
  console.log('=========================\n');
  
  try {
    // 1. Hacer login como admin
    const loginResponse = await axios.post('http://localhost:3001/login', {
      email: 'admin@hospital.com',
      password: 'password'
    });
    
    const token = loginResponse.data.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. Obtener pacientes
    const pacientesResponse = await axios.get('http://localhost:3002/pacientes', { headers });
    console.log('📋 Pacientes obtenidos:');
    pacientesResponse.data.forEach((p, i) => {
      console.log(`   ${i + 1}. ID Global: ${p.id}, ID Original: ${p.id_original}, Nombre: ${p.nombres} ${p.apellidos}, Centro: ${p.origen_bd}`);
    });
    
    if (pacientesResponse.data.length > 0) {
      const primerPaciente = pacientesResponse.data[0];
      console.log(`\n🔍 Analizando paciente a eliminar:`);
      console.log(`   ID Global: ${primerPaciente.id}`);
      console.log(`   ID Original: ${primerPaciente.id_original}`);
      console.log(`   Centro: ${primerPaciente.origen_bd}`);
      
      // 3. Intentar eliminar
      console.log(`\n🗑️ Intentando eliminar paciente ID global: ${primerPaciente.id}...`);
      
      try {
        const deleteResponse = await axios.delete(`http://localhost:3002/pacientes/${primerPaciente.id}`, { headers });
        console.log('✅ Respuesta de eliminación:', JSON.stringify(deleteResponse.data, null, 2));
        
        // 4. Verificar si realmente se eliminó
        console.log('\n🔍 Verificando si se eliminó realmente...');
        const despuesResponse = await axios.get('http://localhost:3002/pacientes', { headers });
        
        const pacienteEliminado = despuesResponse.data.find(p => p.id === primerPaciente.id);
        if (pacienteEliminado) {
          console.log('❌ El paciente NO se eliminó - sigue en la lista');
          console.log(`   Paciente encontrado: ${pacienteEliminado.nombres} ${pacienteEliminado.apellidos}`);
        } else {
          console.log('✅ El paciente SÍ se eliminó - no está en la lista');
        }
        
        console.log(`\n📊 Resumen:`);
        console.log(`   Antes: ${pacientesResponse.data.length} pacientes`);
        console.log(`   Después: ${despuesResponse.data.length} pacientes`);
        
      } catch (error) {
        console.log(`❌ Error eliminando: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Error general: ${error.message}`);
  }
}

debugDeleteLogic();

