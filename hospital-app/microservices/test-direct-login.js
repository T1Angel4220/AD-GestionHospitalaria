const axios = require('axios');

async function testDirectLogin() {
  try {
    console.log('🔍 Probando login directo al Auth Service...');
    
    const response = await axios.post('http://localhost:3002/login', {
      email: 'admin@hospital.com',
      password: 'admin123'
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
    console.error('❌ Error en login directo:');
    console.error('📊 Status:', error.response?.status);
    console.error('📋 Data:', error.response?.data);
    console.error('🔍 Message:', error.message);
  }
}

testDirectLogin();
