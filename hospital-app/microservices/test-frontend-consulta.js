const axios = require('axios');

async function testFrontendConsulta() {
  console.log('🔍 TESTING FRONTEND CONSULTA CREATION');
  console.log('=====================================\n');
  
  try {
    // 1. Login como admin
    console.log('🔐 Obteniendo token de admin...');
    const loginResponse = await axios.post('http://localhost:3001/login', {
      email: 'admin@hospital.com',
      password: 'password'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Token obtenido\n');
    
    // 2. Simular exactamente lo que hace el frontend
    console.log('📊 SIMULANDO FRONTEND CONSULTA CREATION:');
    console.log('========================================');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
      // NO enviar X-Centro-Id como admin
    };
    
    // Datos que enviaría el frontend
    const consultaData = {
      id_medico: 1,
      id_paciente: 6,
      paciente_nombre: 'Monica Eufemia',
      paciente_apellido: 'Bustos Jerez',
      motivo: 'f',
      diagnostico: 'f',
      tratamiento: 'f',
      estado: 'pendiente',
      fecha: '2025-11-11T11:11:00.000Z',
      duracion_minutos: null,
      centroId: 3 // Esto es lo que agregamos
    };
    
    console.log('📤 Datos de la consulta (como frontend):');
    console.log(JSON.stringify(consultaData, null, 2));
    
    console.log('\n📤 Headers (como frontend):');
    console.log(JSON.stringify(headers, null, 2));
    
    console.log('\n🚀 Enviando POST a /consultas...');
    
    try {
      const response = await axios.post('http://localhost:3003/consultas', consultaData, { headers });
      
      console.log('✅ Consulta creada exitosamente:');
      console.log(`   Status: ${response.status}`);
      console.log(`   ID: ${response.data.id}`);
      console.log(`   Centro: ${response.data.id_centro}`);
      console.log(`   Paciente: ${response.data.paciente_nombre} ${response.data.paciente_apellido}`);
      
    } catch (error) {
      console.log('❌ Error creando consulta:');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${error.response?.data?.error || error.message}`);
      console.log(`   Data: ${JSON.stringify(error.response?.data, null, 2)}`);
      
      if (error.response?.data?.stack) {
        console.log('\n📋 Stack trace:');
        console.log(error.response.data.stack);
      }
    }
    
  } catch (error) {
    console.log(`❌ Error general: ${error.message}`);
  }
}

testFrontendConsulta();
