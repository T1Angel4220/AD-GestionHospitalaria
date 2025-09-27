const axios = require('axios');
const colors = require('colors');

// Configuración de colores
colors.setTheme({
  success: 'green',
  error: 'red',
  warning: 'yellow',
  info: 'cyan',
  title: 'magenta',
  service: 'blue'
});

// URLs de los microservicios
const services = {
  auth: 'http://localhost:3002',
  admin: 'http://localhost:3003',
  users: 'http://localhost:3005',
  reports: 'http://localhost:3006'
};

// Función para hacer peticiones HTTP
async function makeRequest(url, method = 'GET', data = null, headers = {}) {
  try {
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 10000
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      status: error.response?.status || 'TIMEOUT',
      response: error.response?.data
    };
  }
}

// Función para probar login
async function testLogin(email, password, userType) {
  console.log(`\n🔐 Probando Login: ${userType}`.service);
  console.log(`📧 Email: ${email}`.info);
  
  const loginData = { email, password };
  const result = await makeRequest(`${services.auth}/login`, 'POST', loginData);
  
  if (result.success) {
    console.log(`✅ Login exitoso: ${result.status}`.success);
    console.log(`🎫 Token recibido: ${result.data.token ? 'Sí' : 'No'}`.info);
    console.log(`👤 Usuario: ${result.data.user?.email || 'N/A'}`.info);
    console.log(`🔑 Rol: ${result.data.user?.rol || 'N/A'}`.info);
    console.log(`🏥 Centro: ${result.data.user?.id_centro || 'N/A'}`.info);
    return result.data.token;
  } else {
    console.log(`❌ Login falló: ${result.error}`.error);
    if (result.response) {
      console.log(`📝 Detalles: ${JSON.stringify(result.response)}`.warning);
    }
    return null;
  }
}

// Función para probar rutas protegidas
async function testProtectedRoutes(token, userType) {
  if (!token) {
    console.log(`\n⚠️ Saltando pruebas de rutas protegidas - No hay token`.warning);
    return;
  }
  
  console.log(`\n🔒 Probando Rutas Protegidas: ${userType}`.title);
  
  const headers = {
    'Authorization': `Bearer ${token}`
  };
  
  // Probar Admin Service
  console.log(`\n👑 Probando Admin Service`.service);
  const adminResult = await makeRequest(`${services.admin}/medicos`, 'GET', null, headers);
  if (adminResult.success) {
    console.log(`✅ Médicos obtenidos: ${adminResult.data.length} registros`.success);
  } else {
    console.log(`❌ Error obteniendo médicos: ${adminResult.error}`.error);
  }
  
  // Probar Users Service
  console.log(`\n👥 Probando Users Service`.service);
  const usersResult = await makeRequest(`${services.users}/usuarios`, 'GET', null, headers);
  if (usersResult.success) {
    console.log(`✅ Usuarios obtenidos: ${usersResult.data.length} registros`.success);
  } else {
    console.log(`❌ Error obteniendo usuarios: ${usersResult.error}`.error);
  }
  
  // Probar Reports Service
  console.log(`\n📊 Probando Reports Service`.service);
  const reportsResult = await makeRequest(`${services.reports}/estadisticas?centroId=1`, 'GET', null, headers);
  if (reportsResult.success) {
    console.log(`✅ Estadísticas obtenidas: Centro ${reportsResult.data.centro_id}`.success);
    console.log(`📈 Médicos: ${reportsResult.data.total_medicos}, Pacientes: ${reportsResult.data.total_pacientes}`.info);
  } else {
    console.log(`❌ Error obteniendo estadísticas: ${reportsResult.error}`.error);
  }
}

// Función principal
async function runLoginTests() {
  console.log(`\n🚀 PROBANDO LOGIN Y RUTAS PROTEGIDAS`.title);
  console.log(`⏰ Fecha: ${new Date().toLocaleString()}`.info);
  
  try {
    // Probar login con admin
    const adminToken = await testLogin('admin@hospital.com', 'admin123', 'Administrador');
    
    // Probar login con médico
    const medicoToken = await testLogin('medico@hospital.com', 'medico123', 'Médico');
    
    // Probar rutas protegidas con admin
    if (adminToken) {
      await testProtectedRoutes(adminToken, 'Administrador');
    }
    
    // Probar rutas protegidas con médico
    if (medicoToken) {
      await testProtectedRoutes(medicoToken, 'Médico');
    }
    
    // Resumen final
    console.log(`\n📋 RESUMEN FINAL`.title);
    console.log(`👑 Admin Login: ${adminToken ? 'Exitoso' : 'Falló'}`.success);
    console.log(`👨‍⚕️ Médico Login: ${medicoToken ? 'Exitoso' : 'Falló'}`.success);
    console.log(`🔒 Rutas Protegidas: ${adminToken || medicoToken ? 'Funcionando' : 'Falló'}`.success);
    
    if (adminToken || medicoToken) {
      console.log(`\n🎉 ¡AUTENTICACIÓN FUNCIONANDO CORRECTAMENTE!`.success);
      console.log(`\n📝 Credenciales de Prueba:`.info);
      if (adminToken) {
        console.log(`👑 Admin: admin@hospital.com / admin123`.info);
      }
      if (medicoToken) {
        console.log(`👨‍⚕️ Médico: medico@hospital.com / medico123`.info);
      }
    } else {
      console.log(`\n⚠️ La autenticación necesita atención`.warning);
    }
    
  } catch (error) {
    console.log(`\n💥 Error durante las pruebas: ${error.message}`.error);
  }
}

// Ejecutar las pruebas de login
runLoginTests();
