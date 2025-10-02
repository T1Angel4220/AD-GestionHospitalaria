const axios = require('axios');

async function testPacienteDelete() {
  console.log('🔧 PROBANDO ELIMINACIÓN DE PACIENTES');
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
    
    // 2. Obtener pacientes existentes
    console.log('📋 Obteniendo pacientes existentes...');
    const pacientesResponse = await axios.get('http://localhost:3002/pacientes', { headers });
    console.log(`✅ ${pacientesResponse.data.length} pacientes encontrados\n`);
    
    if (pacientesResponse.data.length > 0) {
      // Mostrar información de los pacientes
      console.log('📋 Información de pacientes:');
      pacientesResponse.data.forEach((paciente, index) => {
        console.log(`   ${index + 1}. ID: ${paciente.id}, Nombre: ${paciente.nombres} ${paciente.apellidos}`);
        console.log(`      Centro: ${paciente.centro_nombre || 'N/A'} (${paciente.origen_bd})`);
        console.log(`      ID Original: ${paciente.id_original}, ID Frontend: ${paciente.id_frontend}`);
        console.log(`      Cédula: ${paciente.cedula}\n`);
      });
      
      // 3. Intentar eliminar el primer paciente
      const primerPaciente = pacientesResponse.data[0];
      console.log(`🗑️ Intentando eliminar paciente ID: ${primerPaciente.id} (${primerPaciente.nombres} ${primerPaciente.apellidos})...`);
      
      try {
        const deleteResponse = await axios.delete(`http://localhost:3002/pacientes/${primerPaciente.id}`, { headers });
        console.log('✅ Paciente eliminado exitosamente!');
        console.log(`📋 Respuesta: ${JSON.stringify(deleteResponse.data, null, 2)}`);
      } catch (error) {
        console.log(`❌ Error eliminando paciente: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
        
        // Si es error 500, puede ser por restricciones de clave foránea
        if (error.response?.status === 500) {
          console.log('\n💡 Posibles soluciones:');
          console.log('   1. El paciente tiene consultas asociadas');
          console.log('   2. Necesitas eliminar las consultas primero');
          console.log('   3. O implementar eliminación en cascada');
        }
      }
      
    } else {
      console.log('❌ No hay pacientes para probar la eliminación');
    }
    
  } catch (error) {
    console.log(`❌ Error durante la prueba: ${error.message}`);
    
    if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`📝 Datos: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

testPacienteDelete();

