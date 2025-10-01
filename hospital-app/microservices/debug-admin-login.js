const axios = require('axios');

// URLs de los microservicios
const services = {
  auth: 'http://localhost:3001',
  admin: 'http://localhost:3002',
  users: 'http://localhost:3004'
};

async function debugAdminLogin() {
  console.log('🔍 DEBUGGING ADMIN LOGIN');
  console.log('=========================\n');
  
  // Probar diferentes variaciones de credenciales admin
  const adminCredentials = [
    { email: 'admin@hospital.com', password: 'admin123' },
    { email: 'admin@hospital.com', password: 'admin' },
    { email: 'admin@hospital.com', password: 'password' },
    { email: 'admin@hospital.com', password: '123456' },
    { email: 'admin@hospital.com', password: 'Admin123' },
    { email: 'admin@hospital.com', password: 'ADMIN123' }
  ];
  
  console.log('🔐 Probando diferentes credenciales de admin...\n');
  
  for (let i = 0; i < adminCredentials.length; i++) {
    const creds = adminCredentials[i];
    console.log(`📝 Intento ${i + 1}: ${creds.email} / ${creds.password}`);
    
    try {
      const response = await axios.post(`${services.auth}/login`, creds, {
        timeout: 5000
      });
      
      console.log(`✅ ¡LOGIN EXITOSO!`);
      console.log(`📧 Email: ${response.data.user.email}`);
      console.log(`🔑 Rol: ${response.data.user.rol}`);
      console.log(`🏥 Centro: ${response.data.user.centro?.nombre || 'N/A'}`);
      console.log(`🎫 Token: ${response.data.token ? 'Recibido' : 'No recibido'}`);
      
      return response.data;
      
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.error || error.message;
      
      if (status === 401) {
        console.log(`❌ Credenciales inválidas: ${message}`);
      } else if (status === 400) {
        console.log(`❌ Error de validación: ${message}`);
      } else {
        console.log(`❌ Error ${status || 'TIMEOUT'}: ${message}`);
      }
    }
    
    console.log(''); // Línea en blanco
  }
  
  console.log('🔍 Verificando si el usuario admin existe en la base de datos...\n');
  
  // Verificar si podemos acceder a la base de datos directamente
  try {
    const healthResponse = await axios.get(`${services.auth}/health`);
    console.log('✅ Auth service health:', healthResponse.data);
  } catch (error) {
    console.log('❌ Error verificando health del auth service:', error.message);
  }
  
  console.log('\n💡 Posibles soluciones:');
  console.log('1. El usuario admin no existe en la base de datos');
  console.log('2. La contraseña es diferente a la esperada');
  console.log('3. El usuario admin está en una base de datos diferente');
  console.log('4. Hay un problema con la conexión a la base de datos');
  
  console.log('\n🔄 Intentando crear un nuevo usuario admin...');
  
  try {
    const newAdmin = await axios.post(`${services.auth}/register`, {
      email: 'admin@hospital.com',
      password: 'admin123',
      rol: 'admin',
      id_centro: 1
    });
    
    console.log('✅ Nuevo admin creado exitosamente!');
    console.log(`📧 Email: ${newAdmin.data.user.email}`);
    console.log(`🔑 Rol: ${newAdmin.data.user.rol}`);
    console.log(`🎫 Token: ${newAdmin.data.token ? 'Recibido' : 'No recibido'}`);
    
    return newAdmin.data;
    
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.error || error.message;
    
    console.log(`❌ Error creando admin: ${status} - ${message}`);
    
    if (message.includes('ya está registrado')) {
      console.log('💡 El usuario admin ya existe, pero las credenciales no funcionan');
      console.log('🔄 Intentando eliminar y recrear el usuario...');
      
      // Aquí podrías implementar lógica para eliminar el usuario existente
      // y crear uno nuevo, pero eso requeriría acceso directo a la base de datos
    }
  }
}

debugAdminLogin();
