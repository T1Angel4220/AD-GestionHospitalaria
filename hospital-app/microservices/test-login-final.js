const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔍 Probando login con usuario de prueba...');
    
    const response = await axios.post('http://localhost:3002/login', {
      email: 'test@hospital.com',
      password: 'test123'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login exitoso!');
    console.log('📊 Status:', response.status);
    console.log('📋 Data:', response.data);
    
  } catch (error) {
    console.error('❌ Error en login:');
    console.error('📊 Status:', error.response?.status);
    console.error('📋 Data:', error.response?.data);
    console.error('🔍 Message:', error.message);
  }
}

testLogin();
