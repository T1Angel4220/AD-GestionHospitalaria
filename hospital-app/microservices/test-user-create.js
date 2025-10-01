const axios = require('axios');

async function testUserCreate() {
  console.log('🔧 PROBANDO CREACIÓN DE USUARIOS');
  console.log('=================================\n');
  
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
    
    // 2. Probar creación de usuario en users-service (puerto 3004)
    console.log('👤 Probando creación de usuario en users-service (puerto 3004)...');
    try {
      const userData = {
        email: 'test.user@hospital.com',
        password: 'password123',
        rol: 'medico',
        id_centro: 1,
        id_medico: 1
      };
      
      const createResponse = await axios.post('http://localhost:3004/usuarios', userData, { headers });
      console.log('✅ Usuario creado exitosamente en users-service!');
      console.log(`📋 Respuesta: ${JSON.stringify(createResponse.data, null, 2)}`);
      
    } catch (error) {
      console.log(`❌ Error en users-service: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
    }
    
    // 3. Probar creación de usuario en admin-service (puerto 3002) - debería fallar
    console.log('\n👤 Probando creación de usuario en admin-service (puerto 3002)...');
    try {
      const userData = {
        email: 'test.user2@hospital.com',
        password: 'password123',
        rol: 'medico',
        id_centro: 1,
        id_medico: 1
      };
      
      const createResponse = await axios.post('http://localhost:3002/usuarios', userData, { headers });
      console.log('✅ Usuario creado exitosamente en admin-service!');
      console.log(`📋 Respuesta: ${JSON.stringify(createResponse.data, null, 2)}`);
      
    } catch (error) {
      console.log(`❌ Error en admin-service (esperado): ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
    }
    
  } catch (error) {
    console.log(`❌ Error durante la prueba: ${error.message}`);
    
    if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`📝 Datos: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

testUserCreate();
