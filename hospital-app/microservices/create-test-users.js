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
  users: 'http://localhost:3005'
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

// Función para crear usuario admin
async function createAdminUser() {
  console.log(`\n👑 Creando Usuario Administrador`.title);
  
  const adminData = {
    email: 'admin@hospital.com',
    password: 'admin123',
    rol: 'admin',
    id_centro: 1
  };
  
  const result = await makeRequest(`${services.auth}/register`, 'POST', adminData);
  
  if (result.success) {
    console.log(`✅ Admin creado exitosamente: ${result.status}`.success);
    console.log(`📧 Email: ${adminData.email}`.info);
    console.log(`🔑 Rol: ${adminData.rol}`.info);
    return adminData;
  } else {
    console.log(`❌ Error creando admin: ${result.error}`.error);
    if (result.response) {
      console.log(`📝 Detalles: ${JSON.stringify(result.response)}`.warning);
    }
    return null;
  }
}

// Función para crear usuario médico
async function createMedicoUser() {
  console.log(`\n👨‍⚕️ Creando Usuario Médico`.title);
  
  const medicoData = {
    email: 'medico@hospital.com',
    password: 'medico123',
    rol: 'medico',
    id_centro: 1
  };
  
  const result = await makeRequest(`${services.auth}/register`, 'POST', medicoData);
  
  if (result.success) {
    console.log(`✅ Médico creado exitosamente: ${result.status}`.success);
    console.log(`📧 Email: ${medicoData.email}`.info);
    console.log(`🔑 Rol: ${medicoData.rol}`.info);
    return medicoData;
  } else {
    console.log(`❌ Error creando médico: ${result.error}`.error);
    if (result.response) {
      console.log(`📝 Detalles: ${JSON.stringify(result.response)}`.warning);
    }
    return null;
  }
}

// Función para probar login
async function testLogin(email, password) {
  console.log(`\n🔐 Probando Login: ${email}`.service);
  
  const loginData = { email, password };
  const result = await makeRequest(`${services.auth}/login`, 'POST', loginData);
  
  if (result.success) {
    console.log(`✅ Login exitoso: ${result.status}`.success);
    console.log(`🎫 Token recibido: ${result.data.token ? 'Sí' : 'No'}`.info);
    console.log(`👤 Usuario: ${result.data.user?.email || 'N/A'}`.info);
    console.log(`🔑 Rol: ${result.data.user?.rol || 'N/A'}`.info);
    return result.data.token;
  } else {
    console.log(`❌ Login falló: ${result.error}`.error);
    if (result.response) {
      console.log(`📝 Detalles: ${JSON.stringify(result.response)}`.warning);
    }
    return null;
  }
}

// Función para probar rutas protegidas con token
async function testProtectedRoutes(token) {
  if (!token) {
    console.log(`\n⚠️ Saltando pruebas de rutas protegidas - No hay token`.warning);
    return;
  }
  
  console.log(`\n🔒 Probando Rutas Protegidas con Token`.title);
  
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
}

// Función para crear datos de prueba
async function createTestData(token) {
  if (!token) {
    console.log(`\n⚠️ Saltando creación de datos de prueba - No hay token`.warning);
    return;
  }
  
  console.log(`\n📊 Creando Datos de Prueba`.title);
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  // Crear centro médico
  console.log(`\n🏥 Creando Centro Médico`.service);
  const centroData = {
    nombre: 'Hospital de Prueba',
    ciudad: 'Quito',
    direccion: 'Av. Test 123',
    telefono: '02-1234567'
  };
  
  const centroResult = await makeRequest(`${services.admin}/centros`, 'POST', centroData, headers);
  if (centroResult.success) {
    console.log(`✅ Centro creado: ${centroResult.data.nombre}`.success);
  } else {
    console.log(`❌ Error creando centro: ${centroResult.error}`.error);
  }
  
  // Crear especialidad
  console.log(`\n🩺 Creando Especialidad`.service);
  const especialidadData = {
    nombre: 'Medicina General',
    descripcion: 'Especialidad de medicina general para pruebas'
  };
  
  const especialidadResult = await makeRequest(`${services.admin}/especialidades`, 'POST', especialidadData, headers);
  if (especialidadResult.success) {
    console.log(`✅ Especialidad creada: ${especialidadResult.data.nombre}`.success);
  } else {
    console.log(`❌ Error creando especialidad: ${especialidadResult.error}`.error);
  }
}

// Función principal
async function runUserCreation() {
  console.log(`\n🚀 CREANDO USUARIOS DE PRUEBA`.title);
  console.log(`⏰ Fecha: ${new Date().toLocaleString()}`.info);
  
  try {
    // Crear usuario admin
    const adminUser = await createAdminUser();
    
    // Crear usuario médico
    const medicoUser = await createMedicoUser();
    
    // Probar login con admin
    let adminToken = null;
    if (adminUser) {
      adminToken = await testLogin(adminUser.email, adminUser.password);
    }
    
    // Probar login con médico
    let medicoToken = null;
    if (medicoUser) {
      medicoToken = await testLogin(medicoUser.email, medicoUser.password);
    }
    
    // Probar rutas protegidas con admin
    if (adminToken) {
      await testProtectedRoutes(adminToken);
      await createTestData(adminToken);
    }
    
    // Resumen final
    console.log(`\n📋 RESUMEN FINAL`.title);
    console.log(`👑 Admin: ${adminUser ? 'Creado' : 'Falló'}`.success);
    console.log(`👨‍⚕️ Médico: ${medicoUser ? 'Creado' : 'Falló'}`.success);
    console.log(`🔐 Login Admin: ${adminToken ? 'Exitoso' : 'Falló'}`.success);
    console.log(`🔐 Login Médico: ${medicoToken ? 'Exitoso' : 'Falló'}`.success);
    
    if (adminUser && medicoUser && adminToken && medicoToken) {
      console.log(`\n🎉 ¡TODOS LOS USUARIOS CREADOS Y FUNCIONANDO!`.success);
      console.log(`\n📝 Credenciales de Prueba:`.info);
      console.log(`👑 Admin: admin@hospital.com / admin123`.info);
      console.log(`👨‍⚕️ Médico: medico@hospital.com / medico123`.info);
    } else {
      console.log(`\n⚠️ Algunos usuarios necesitan atención`.warning);
    }
    
  } catch (error) {
    console.log(`\n💥 Error durante la creación: ${error.message}`.error);
  }
}

// Ejecutar la creación de usuarios
runUserCreation();
