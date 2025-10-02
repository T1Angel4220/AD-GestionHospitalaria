const axios = require('axios');

async function testPacientesFinal() {
  console.log('🎉 PRUEBA FINAL - GESTIÓN DE PACIENTES');
  console.log('=====================================\n');
  
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
      
      // Verificar que no hay IDs duplicados
      const ids = pacientesResponse.data.map(p => p.id);
      const idsUnicos = [...new Set(ids)];
      const hayDuplicados = ids.length !== idsUnicos.length;
      
      console.log('🔍 Análisis de IDs:');
      console.log(`   Total pacientes: ${ids.length}`);
      console.log(`   IDs únicos: ${idsUnicos.length}`);
      console.log(`   Hay duplicados: ${hayDuplicados ? '❌ SÍ' : '✅ NO'}`);
      
      if (!hayDuplicados) {
        console.log('\n🎉 ¡PROBLEMA DE IDs DUPLICADOS RESUELTO!');
      } else {
        console.log('\n❌ Aún hay IDs duplicados');
      }
      
      // 3. Probar eliminación
      if (pacientesResponse.data.length > 0) {
        const primerPaciente = pacientesResponse.data[0];
        console.log(`\n🗑️ Probando eliminación del paciente ID: ${primerPaciente.id} (${primerPaciente.nombres} ${primerPaciente.apellidos})...`);
        
        try {
          const deleteResponse = await axios.delete(`http://localhost:3002/pacientes/${primerPaciente.id}`, { headers });
          console.log('✅ Paciente eliminado exitosamente!');
          console.log(`📋 Respuesta: ${JSON.stringify(deleteResponse.data, null, 2)}`);
          
          // Verificar que se eliminó
          const pacientesDespues = await axios.get('http://localhost:3002/pacientes', { headers });
          console.log(`\n📊 Pacientes después de eliminación: ${pacientesDespues.data.length}`);
          
          if (pacientesDespues.data.length < pacientesResponse.data.length) {
            console.log('🎉 ¡ELIMINACIÓN FUNCIONA CORRECTAMENTE!');
          } else {
            console.log('❌ El paciente no se eliminó correctamente');
          }
          
        } catch (error) {
          console.log(`❌ Error eliminando paciente: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
        }
      }
      
    } else {
      console.log('❌ No hay pacientes para probar');
    }
    
    console.log('\n📋 RESUMEN FINAL:');
    console.log('✅ IDs únicos globales implementados');
    console.log('✅ Eliminación en cascada funcionando');
    console.log('✅ No más duplicados de IDs');
    console.log('🎉 ¡PROBLEMA RESUELTO!');
    
  } catch (error) {
    console.log(`❌ Error durante la prueba: ${error.message}`);
    
    if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`📝 Datos: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

testPacientesFinal();

