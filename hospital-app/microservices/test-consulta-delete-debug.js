const axios = require('axios');

async function testConsultaDeleteDebug() {
  console.log('🔧 PROBANDO ELIMINACIÓN DE CONSULTAS - DEBUG');
  console.log('============================================\n');
  
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
      console.log(`   Centro: ${consulta.id_centro}`);
      console.log(`   Origen BD: ${consulta.origen_bd || 'N/A'}`);
      console.log(`   Médico: ${consulta.medico_nombres || 'N/A'} ${consulta.medico_apellidos || 'N/A'}`);
      console.log(`   Paciente: ${consulta.paciente_nombres || 'N/A'} ${consulta.paciente_apellidos || 'N/A'}`);
      console.log(`   Estado: ${consulta.estado || 'N/A'}\n`);
      
      // 3. Intentar eliminar con diferentes configuraciones de centro
      console.log(`🗑️ Intentando eliminar consulta ID: ${consulta.id}...`);
      
      // Opción 1: Sin header X-Centro-Id
      console.log('🔍 Opción 1: Sin header X-Centro-Id');
      try {
        const deleteResponse1 = await axios.delete(`http://localhost:3003/consultas/${consulta.id}`, { headers });
        console.log('✅ Consulta eliminada exitosamente (sin centro)!');
        console.log(`📋 Respuesta: ${JSON.stringify(deleteResponse1.data, null, 2)}`);
        return; // Si funciona, salir
      } catch (error1) {
        console.log(`❌ Error sin centro: ${error1.response?.status} - ${JSON.stringify(error1.response?.data)}`);
      }
      
      // Opción 2: Con header X-Centro-Id del centro de la consulta
      console.log(`🔍 Opción 2: Con header X-Centro-Id = ${consulta.id_centro}`);
      try {
        const headersWithCentro = {
          ...headers,
          'X-Centro-Id': consulta.id_centro.toString()
        };
        const deleteResponse2 = await axios.delete(`http://localhost:3003/consultas/${consulta.id}`, { headers: headersWithCentro });
        console.log('✅ Consulta eliminada exitosamente (con centro)!');
        console.log(`📋 Respuesta: ${JSON.stringify(deleteResponse2.data, null, 2)}`);
        return; // Si funciona, salir
      } catch (error2) {
        console.log(`❌ Error con centro: ${error2.response?.status} - ${JSON.stringify(error2.response?.data)}`);
      }
      
      // Opción 3: Con header X-Centro-Id = 1 (centro central)
      console.log('🔍 Opción 3: Con header X-Centro-Id = 1');
      try {
        const headersWithCentro1 = {
          ...headers,
          'X-Centro-Id': '1'
        };
        const deleteResponse3 = await axios.delete(`http://localhost:3003/consultas/${consulta.id}`, { headers: headersWithCentro1 });
        console.log('✅ Consulta eliminada exitosamente (centro 1)!');
        console.log(`📋 Respuesta: ${JSON.stringify(deleteResponse3.data, null, 2)}`);
        return; // Si funciona, salir
      } catch (error3) {
        console.log(`❌ Error con centro 1: ${error3.response?.status} - ${JSON.stringify(error3.response?.data)}`);
      }
      
      console.log('\n❌ Ninguna opción funcionó');
      
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

testConsultaDeleteDebug();
