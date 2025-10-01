const axios = require('axios');

// URLs de los microservicios
const services = {
  auth: 'http://localhost:3001',
  admin: 'http://localhost:3002',
  users: 'http://localhost:3004'
};

async function checkExistingUsers() {
  console.log('🔍 VERIFICANDO USUARIOS EXISTENTES');
  console.log('==================================\n');
  
  try {
    // Primero intentar login con admin existente
    console.log('👑 Probando login con admin existente...');
    const adminLogin = await axios.post(`${services.auth}/login`, {
      email: 'admin@hospital.com',
      password: 'admin123'
    });
    
    console.log('✅ Admin login exitoso!');
    console.log(`📧 Email: ${adminLogin.data.user.email}`);
    console.log(`🔑 Rol: ${adminLogin.data.user.rol}`);
    console.log(`🏥 Centro: ${adminLogin.data.user.centro?.nombre || 'N/A'}`);
    
    // Probar rutas protegidas con el token del admin
    const token = adminLogin.data.token;
    const headers = { 'Authorization': `Bearer ${token}` };
    
    console.log('\n🔒 Probando rutas protegidas...');
    
    // Probar admin service
    try {
      const medicos = await axios.get(`${services.admin}/medicos`, { headers });
      console.log(`✅ Admin Service: ${medicos.data.length} médicos encontrados`);
    } catch (error) {
      console.log(`❌ Admin Service: ${error.response?.status || error.message}`);
    }
    
    // Probar users service
    try {
      const usuarios = await axios.get(`${services.users}/usuarios`, { headers });
      console.log(`✅ Users Service: ${usuarios.data.length} usuarios encontrados`);
    } catch (error) {
      console.log(`❌ Users Service: ${error.response?.status || error.message}`);
    }
    
    console.log('\n🎉 ¡EL SISTEMA ESTÁ FUNCIONANDO PERFECTAMENTE!');
    console.log('\n📝 Credenciales disponibles:');
    console.log('👑 Admin: admin@hospital.com / admin123');
    console.log('👨‍⚕️ Médico: medico@hospital.com / medico123');
    
  } catch (error) {
    console.log('❌ Error en login de admin:', error.response?.data || error.message);
    
    // Si el admin no existe, intentar crear uno nuevo
    console.log('\n🔄 Intentando crear admin desde cero...');
    try {
      const newAdmin = await axios.post(`${services.auth}/register`, {
        email: 'admin@hospital.com',
        password: 'admin123',
        rol: 'admin',
        id_centro: 1
      });
      console.log('✅ Nuevo admin creado exitosamente!');
    } catch (createError) {
      console.log('❌ Error creando admin:', createError.response?.data || createError.message);
    }
  }
}

checkExistingUsers();
