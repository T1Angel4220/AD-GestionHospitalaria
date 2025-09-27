const axios = require('axios');

async function testLoginFlow() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DEL SISTEMA DE LOGIN\n');
  
  try {
    // 1. Probar API Gateway
    console.log('1️⃣ Probando API Gateway...');
    const gatewayHealth = await axios.get('http://localhost:3001/health');
    console.log('✅ API Gateway OK:', gatewayHealth.data);
    
    // 2. Probar endpoint de login
    console.log('\n2️⃣ Probando endpoint de login...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@hospital.com',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 segundos de timeout
    });
    
    console.log('✅ Login exitoso:', {
      message: loginResponse.data.message,
      token: loginResponse.data.token ? 'Token recibido' : 'Sin token',
      user: loginResponse.data.user ? 'Usuario recibido' : 'Sin usuario'
    });
    
    // 3. Verificar estructura de respuesta
    console.log('\n3️⃣ Estructura de respuesta:');
    console.log('Keys:', Object.keys(loginResponse.data));
    console.log('User keys:', loginResponse.data.user ? Object.keys(loginResponse.data.user) : 'No user');
    
  } catch (error) {
    console.error('❌ Error en el diagnóstico:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🚨 Error de conexión - El servicio no está disponible');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('🚨 Timeout - El servicio no responde en tiempo');
    }
  }
}

testLoginFlow();
