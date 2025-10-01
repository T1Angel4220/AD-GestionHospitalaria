const axios = require('axios');

async function testAdminLogin() {
  console.log('🔐 PROBANDO LOGIN DE ADMINISTRADOR');
  console.log('==================================\n');
  
  const adminCredentials = [
    { email: 'admin@hospital.com', password: 'admin123' },
    { email: 'admin@hospital.com', password: 'admin' },
    { email: 'admin@hospital.com', password: 'Admin123' },
    { email: 'admin@hospital.com', password: 'ADMIN123' }
  ];
  
  for (let i = 0; i < adminCredentials.length; i++) {
    const creds = adminCredentials[i];
    console.log(`📝 Intento ${i + 1}: ${creds.email} / ${creds.password}`);
    
    try {
      const response = await axios.post('http://localhost:3001/login', creds, {
        timeout: 5000
      });
      
      console.log('✅ ¡LOGIN EXITOSO!');
      console.log(`📧 Email: ${response.data.user.email}`);
      console.log(`🔑 Rol: ${response.data.user.rol}`);
      console.log(`🏥 Centro: ${response.data.user.centro?.nombre || 'N/A'}`);
      console.log(`🎫 Token: ${response.data.token ? 'Recibido' : 'No recibido'}`);
      
      // Probar acceso a médicos con este token
      console.log('\n👨‍⚕️ Probando acceso a médicos...');
      const medicosResponse = await axios.get('http://localhost:3002/medicos', {
        headers: {
          'Authorization': `Bearer ${response.data.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ Acceso a médicos exitoso: ${medicosResponse.data.length} médicos encontrados`);
      
      if (medicosResponse.data.length > 0) {
        console.log('\n📋 Primeros médicos:');
        medicosResponse.data.slice(0, 3).forEach((medico, index) => {
          console.log(`   ${index + 1}. ${medico.nombres} ${medico.apellidos} - ${medico.especialidad || 'Sin especialidad'}`);
        });
      }
      
      return response.data.token;
      
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.error || error.message;
      
      if (status === 401) {
        console.log(`❌ Credenciales inválidas: ${message}`);
      } else if (status === 403) {
        console.log(`❌ Acceso denegado: ${message}`);
      } else {
        console.log(`❌ Error ${status || 'TIMEOUT'}: ${message}`);
      }
    }
    
    console.log(''); // Línea en blanco
  }
  
  console.log('❌ No se pudo hacer login con ninguna credencial de admin');
  console.log('\n💡 Posibles soluciones:');
  console.log('1. El usuario admin no existe');
  console.log('2. Las credenciales son diferentes');
  console.log('3. Hay un problema con el auth-service');
  
  return null;
}

testAdminLogin();
