const axios = require('axios');

async function debugAdminBackend() {
  console.log('🔍 DEBUG ADMIN BACKEND');
  console.log('=====================\n');
  
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
    
    // 2. Verificar qué está pasando en el backend
    console.log('📊 PROBANDO DIFERENTES ESCENARIOS:');
    console.log('==================================');
    
    // Escenario 1: Sin X-Centro-Id
    console.log('\n1️⃣ SIN X-Centro-Id:');
    try {
      const response1 = await axios.get('http://localhost:3003/consultas', { headers });
      console.log(`   Status: ${response1.status}`);
      console.log(`   Consultas: ${response1.data.length}`);
      if (response1.data.length > 0) {
        response1.data.forEach((c, i) => {
          console.log(`   ${i+1}. ${c.paciente_nombre} ${c.paciente_apellidos} (Centro: ${c.id_centro})`);
        });
      }
    } catch (error) {
      console.log(`   Error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
    }
    
    // Escenario 2: Con X-Centro-Id = 1
    console.log('\n2️⃣ CON X-Centro-Id = 1:');
    try {
      const response2 = await axios.get('http://localhost:3003/consultas', {
        headers: { ...headers, 'X-Centro-Id': '1' }
      });
      console.log(`   Status: ${response2.status}`);
      console.log(`   Consultas: ${response2.data.length}`);
      if (response2.data.length > 0) {
        response2.data.forEach((c, i) => {
          console.log(`   ${i+1}. ${c.paciente_nombre} ${c.paciente_apellidos} (Centro: ${c.id_centro})`);
        });
      }
    } catch (error) {
      console.log(`   Error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
    }
    
    // Escenario 3: Con X-Centro-Id = 2
    console.log('\n3️⃣ CON X-Centro-Id = 2:');
    try {
      const response3 = await axios.get('http://localhost:3003/consultas', {
        headers: { ...headers, 'X-Centro-Id': '2' }
      });
      console.log(`   Status: ${response3.status}`);
      console.log(`   Consultas: ${response3.data.length}`);
      if (response3.data.length > 0) {
        response3.data.forEach((c, i) => {
          console.log(`   ${i+1}. ${c.paciente_nombre} ${c.paciente_apellidos} (Centro: ${c.id_centro})`);
        });
      }
    } catch (error) {
      console.log(`   Error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
    }
    
    // Escenario 4: Con X-Centro-Id = 3
    console.log('\n4️⃣ CON X-Centro-Id = 3:');
    try {
      const response4 = await axios.get('http://localhost:3003/consultas', {
        headers: { ...headers, 'X-Centro-Id': '3' }
      });
      console.log(`   Status: ${response4.status}`);
      console.log(`   Consultas: ${response4.data.length}`);
      if (response4.data.length > 0) {
        response4.data.forEach((c, i) => {
          console.log(`   ${i+1}. ${c.paciente_nombre} ${c.paciente_apellidos} (Centro: ${c.id_centro})`);
        });
      }
    } catch (error) {
      console.log(`   Error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
    }
    
    // Resumen
    console.log('\n📊 RESUMEN:');
    console.log('===========');
    console.log('Sin X-Centro-Id: Debería devolver TODAS las consultas (3)');
    console.log('Con X-Centro-Id: Debería devolver solo consultas de ese centro (1 cada uno)');
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

debugAdminBackend();
