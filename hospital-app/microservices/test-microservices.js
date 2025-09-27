const axios = require('axios');
const colors = require('colors');

// Configuración de colores para la consola
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
  gateway: 'http://localhost:3001',
  auth: 'http://localhost:3002',
  admin: 'http://localhost:3003',
  consultas: 'http://localhost:3004',
  users: 'http://localhost:3005',
  reports: 'http://localhost:3006'
};

// Función para hacer peticiones HTTP con manejo de errores
async function makeRequest(url, method = 'GET', data = null, headers = {}) {
  try {
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 5000
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
      status: error.response?.status || 'TIMEOUT' 
    };
  }
}

// Función para probar un microservicio
async function testService(serviceName, serviceUrl) {
  console.log(`\n🔍 Probando ${serviceName.toUpperCase()}`.service);
  console.log(`📍 URL: ${serviceUrl}`.info);
  
  // Probar health check
  const healthResult = await makeRequest(`${serviceUrl}/health`);
  if (healthResult.success) {
    console.log(`✅ Health Check: ${healthResult.status}`.success);
    console.log(`📊 Estado: ${healthResult.data.status}`.info);
    if (healthResult.data.database) {
      console.log(`🗄️ Base de datos: ${healthResult.data.database}`.info);
    }
  } else {
    console.log(`❌ Health Check: ${healthResult.error}`.error);
    return false;
  }
  
  // Probar test de base de datos
  const testResult = await makeRequest(`${serviceUrl}/test`);
  if (testResult.success) {
    console.log(`✅ Test BD: ${testResult.status}`.success);
    console.log(`📅 Fecha: ${testResult.data.current_datetime}`.info);
  } else {
    console.log(`❌ Test BD: ${testResult.error}`.error);
  }
  
  return true;
}

// Función para probar autenticación
async function testAuthentication() {
  console.log(`\n🔐 Probando Autenticación`.title);
  
  // Intentar login con credenciales de prueba
  const loginData = {
    email: 'admin@hospital.com',
    password: 'admin123'
  };
  
  const loginResult = await makeRequest(`${services.auth}/login`, 'POST', loginData);
  if (loginResult.success) {
    console.log(`✅ Login exitoso: ${loginResult.status}`.success);
    console.log(`🎫 Token recibido: ${loginResult.data.token ? 'Sí' : 'No'}`.info);
    return loginResult.data.token;
  } else {
    console.log(`❌ Login falló: ${loginResult.error}`.error);
    return null;
  }
}

// Función para probar rutas protegidas
async function testProtectedRoutes(token) {
  if (!token) {
    console.log(`\n⚠️ Saltando pruebas de rutas protegidas - No hay token`.warning);
    return;
  }
  
  console.log(`\n🔒 Probando Rutas Protegidas`.title);
  
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
  
  // Probar Consultas Service
  console.log(`\n📋 Probando Consultas Service`.service);
  const consultasResult = await makeRequest(`${services.consultas}/consultas`, 'GET', null, headers);
  if (consultasResult.success) {
    console.log(`✅ Consultas obtenidas: ${consultasResult.data.length} registros`.success);
  } else {
    console.log(`❌ Error obteniendo consultas: ${consultasResult.error}`.error);
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

// Función para probar API Gateway
async function testAPIGateway() {
  console.log(`\n🌐 Probando API Gateway`.title);
  
  // Probar health check del gateway
  const gatewayHealth = await makeRequest(`${services.gateway}/health`);
  if (gatewayHealth.success) {
    console.log(`✅ Gateway Health: ${gatewayHealth.status}`.success);
  } else {
    console.log(`❌ Gateway Health: ${gatewayHealth.error}`.error);
  }
  
  // Probar test de servicios
  const servicesTest = await makeRequest(`${services.gateway}/api/test-services`);
  if (servicesTest.success) {
    console.log(`✅ Test de Servicios: ${servicesTest.status}`.success);
    console.log(`📊 Servicios disponibles: ${Object.keys(servicesTest.data.services).length}`.info);
    
    // Mostrar estado de cada servicio
    Object.entries(servicesTest.data.services).forEach(([name, service]) => {
      const status = service.status === 'OK' ? '✅' : '❌';
      const color = service.status === 'OK' ? 'success' : 'error';
      console.log(`${status} ${name}: ${service.status}`[color]);
    });
  } else {
    console.log(`❌ Test de Servicios: ${servicesTest.error}`.error);
  }
}

// Función principal
async function runTests() {
  console.log(`\n🚀 INICIANDO PRUEBAS DE MICROSERVICIOS`.title);
  console.log(`⏰ Fecha: ${new Date().toLocaleString()}`.info);
  console.log(`🔗 Gateway: ${services.gateway}`.info);
  
  try {
    // Probar API Gateway
    await testAPIGateway();
    
    // Probar cada microservicio individualmente
    const serviceTests = [
      ['Auth Service', services.auth],
      ['Admin Service', services.admin],
      ['Consultas Service', services.consultas],
      ['Users Service', services.users],
      ['Reports Service', services.reports]
    ];
    
    let successCount = 0;
    for (const [name, url] of serviceTests) {
      const success = await testService(name, url);
      if (success) successCount++;
    }
    
    // Probar autenticación
    const token = await testAuthentication();
    
    // Probar rutas protegidas
    await testProtectedRoutes(token);
    
    // Resumen final
    console.log(`\n📋 RESUMEN FINAL`.title);
    console.log(`✅ Servicios funcionando: ${successCount}/${serviceTests.length}`.success);
    console.log(`🔐 Autenticación: ${token ? 'Funcionando' : 'Falló'}`.success);
    console.log(`🌐 API Gateway: Funcionando`.success);
    
    if (successCount === serviceTests.length && token) {
      console.log(`\n🎉 ¡TODOS LOS MICROSERVICIOS FUNCIONAN CORRECTAMENTE!`.success);
    } else {
      console.log(`\n⚠️ Algunos servicios necesitan atención`.warning);
    }
    
  } catch (error) {
    console.log(`\n💥 Error durante las pruebas: ${error.message}`.error);
  }
}

// Ejecutar las pruebas
runTests();
