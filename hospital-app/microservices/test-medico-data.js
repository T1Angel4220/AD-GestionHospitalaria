const axios = require('axios');

async function testMedicoData() {
  console.log('🔍 PROBANDO DATOS DE MÉDICOS');
  console.log('============================\n');
  
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
    
    // 2. Obtener médicos
    console.log('👨‍⚕️ Obteniendo médicos...');
    const medicosResponse = await axios.get('http://localhost:3002/medicos', { headers });
    
    console.log(`✅ ${medicosResponse.data.length} médicos encontrados\n`);
    
    if (medicosResponse.data.length > 0) {
      const medico = medicosResponse.data[0];
      console.log('📋 Datos del primer médico:');
      console.log(`   ID: ${medico.id}`);
      console.log(`   Nombres: ${medico.nombres}`);
      console.log(`   Apellidos: ${medico.apellidos}`);
      console.log(`   Cédula: ${medico.cedula || 'NO DEFINIDO'}`);
      console.log(`   Teléfono: ${medico.telefono || 'NO DEFINIDO'}`);
      console.log(`   Email: ${medico.email || 'NO DEFINIDO'}`);
      console.log(`   Especialidad: ${medico.especialidad_nombre || 'NO DEFINIDO'}`);
      console.log(`   Centro: ${medico.centro_nombre || 'NO DEFINIDO'}`);
      console.log(`   ID Especialidad: ${medico.id_especialidad}`);
      console.log(`   ID Centro: ${medico.id_centro}`);
      
      console.log('\n🔍 Campos disponibles en el objeto:');
      Object.keys(medico).forEach(key => {
        console.log(`   ${key}: ${medico[key]}`);
      });
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`📝 Datos: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

testMedicoData();
