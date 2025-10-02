const axios = require('axios');

async function debugCrearConsultaError() {
  console.log('🔍 DEBUG CREAR CONSULTA ERROR');
  console.log('==============================\n');
  
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
    console.log('📊 SIMULANDO CREACIÓN DE CONSULTA:');
    console.log('==================================');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
      // NO enviar X-Centro-Id como admin
    };
    
    const consultaData = {
      id_medico: 1, // Dr. Luis Fernández
      id_paciente: 6, // Monica Eufemia Bustos Jerez
      paciente_nombre: 'Monica Eufemia',
      paciente_apellido: 'Bustos Jerez',
      motivo: 'f',
      diagnostico: 'f',
      tratamiento: 'f',
      estado: 'pendiente',
      fecha: '2025-11-11T11:11:00.000Z',
      duracion_minutos: null,
      centroId: 3 // Centro 3
    };
    
    console.log('📤 Datos de la consulta:');
    console.log(JSON.stringify(consultaData, null, 2));
    
    console.log('\n📤 Headers:');
    console.log(JSON.stringify(headers, null, 2));
    
    console.log('\n🚀 Enviando POST a /consultas...');
    
    try {
      const response = await axios.post('http://localhost:3003/consultas', consultaData, { headers });
      
      console.log('✅ Consulta creada exitosamente:');
      console.log(`   Status: ${response.status}`);
      console.log(`   ID: ${response.data.id}`);
      console.log(`   Centro: ${response.data.id_centro}`);
      
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

debugCrearConsultaError();
