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
  auth: 'http://localhost:3001',
  admin: 'http://localhost:3002',
  users: 'http://localhost:3004',
  reports: 'http://localhost:3005'
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
  
  console.log(`📧 Email: ${adminData.email}`.info);
  console.log(`🔑 Rol: ${adminData.rol}`.info);
  console.log(`🏥 Centro: ${adminData.id_centro}`.info);
  
  const result = await makeRequest(`${services.auth}/register`, 'POST', adminData);
  
  if (result.success) {
    console.log(`✅ Admin creado exitosamente: ${result.status}`.success);
    return adminData;
  } else {
    console.log(`❌ Error creando admin: ${result.error}`.error);
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

// Función para probar todas las funcionalidades de admin
async function testAdminFunctionality(token) {
  if (!token) {
    console.log(`\n⚠️ Saltando pruebas de funcionalidad - No hay token`.warning);
    return;
  }
  
  console.log(`\n🔒 Probando Funcionalidades de Administrador`.title);
  
  const headers = {
    'Authorization': `Bearer ${token}`
  };
  
  // Probar Admin Service - Médicos
  console.log(`\n👨‍⚕️ Probando Gestión de Médicos`.service);
  const medicosResult = await makeRequest(`${services.admin}/medicos`, 'GET', null, headers);
  if (medicosResult.success) {
    console.log(`✅ Médicos obtenidos: ${medicosResult.data.length} registros`.success);
    medicosResult.data.forEach((medico, index) => {
      console.log(`  ${index + 1}. ${medico.nombres} ${medico.apellidos} - ${medico.especialidad || 'Sin especialidad'}`.info);
    });
  } else {
    console.log(`❌ Error obteniendo médicos: ${medicosResult.error}`.error);
  }
  
  // Probar Admin Service - Pacientes
  console.log(`\n👥 Probando Gestión de Pacientes`.service);
  const pacientesResult = await makeRequest(`${services.admin}/pacientes`, 'GET', null, headers);
  if (pacientesResult.success) {
    console.log(`✅ Pacientes obtenidos: ${pacientesResult.data.length} registros`.success);
    pacientesResult.data.forEach((paciente, index) => {
      console.log(`  ${index + 1}. ${paciente.nombres} ${paciente.apellidos} - ${paciente.cedula || 'Sin cédula'}`.info);
    });
  } else {
    console.log(`❌ Error obteniendo pacientes: ${pacientesResult.error}`.error);
  }
  
  // Probar Admin Service - Centros
  console.log(`\n🏥 Probando Gestión de Centros`.service);
  const centrosResult = await makeRequest(`${services.admin}/centros`, 'GET', null, headers);
  if (centrosResult.success) {
    console.log(`✅ Centros obtenidos: ${centrosResult.data.length} registros`.success);
    centrosResult.data.forEach((centro, index) => {
      console.log(`  ${index + 1}. ${centro.nombre} - ${centro.ciudad}`.info);
    });
  } else {
    console.log(`❌ Error obteniendo centros: ${centrosResult.error}`.error);
  }
  
  // Probar Users Service
  console.log(`\n👤 Probando Gestión de Usuarios`.service);
  const usersResult = await makeRequest(`${services.users}/usuarios`, 'GET', null, headers);
  if (usersResult.success) {
    console.log(`✅ Usuarios obtenidos: ${usersResult.data.length} registros`.success);
    usersResult.data.forEach((usuario, index) => {
      console.log(`  ${index + 1}. ${usuario.email} - ${usuario.rol} (Centro: ${usuario.id_centro})`.info);
    });
  } else {
    console.log(`❌ Error obteniendo usuarios: ${usersResult.error}`.error);
  }
  
  // Probar Reports Service - Estadísticas
  console.log(`\n📊 Probando Reportes - Estadísticas`.service);
  const statsResult = await makeRequest(`${services.reports}/estadisticas?centroId=1`, 'GET', null, headers);
  if (statsResult.success) {
    console.log(`✅ Estadísticas obtenidas: Centro ${statsResult.data.centro_id}`.success);
    console.log(`📈 Médicos: ${statsResult.data.total_medicos}`.info);
    console.log(`👥 Pacientes: ${statsResult.data.total_pacientes}`.info);
    console.log(`👨‍💼 Empleados: ${statsResult.data.total_empleados}`.info);
    console.log(`📋 Consultas: ${statsResult.data.total_consultas}`.info);
    console.log(`👤 Usuarios: ${statsResult.data.total_usuarios}`.info);
  } else {
    console.log(`❌ Error obteniendo estadísticas: ${statsResult.error}`.error);
  }
  
  // Probar Reports Service - Resumen de Consultas
  console.log(`\n📋 Probando Reportes - Resumen de Consultas`.service);
  const consultasResult = await makeRequest(`${services.reports}/consultas/resumen?centroId=1`, 'GET', null, headers);
  if (consultasResult.success) {
    console.log(`✅ Resumen de consultas obtenido: ${consultasResult.data.length} registros`.success);
    consultasResult.data.forEach((consulta, index) => {
      console.log(`  ${index + 1}. ${consulta.nombres} ${consulta.apellidos} - ${consulta.total_consultas} consultas`.info);
    });
  } else {
    console.log(`❌ Error obteniendo resumen: ${consultasResult.error}`.error);
  }
  
  // Probar Reports Service - Pacientes Frecuentes
  console.log(`\n👥 Probando Reportes - Pacientes Frecuentes`.service);
  const pacientesFreqResult = await makeRequest(`${services.reports}/pacientes/frecuentes?centroId=1&limite=5`, 'GET', null, headers);
  if (pacientesFreqResult.success) {
    console.log(`✅ Pacientes frecuentes obtenidos: ${pacientesFreqResult.data.length} registros`.success);
    pacientesFreqResult.data.forEach((paciente, index) => {
      console.log(`  ${index + 1}. ${paciente.nombres} ${paciente.apellidos} - ${paciente.total_consultas} consultas`.info);
    });
  } else {
    console.log(`❌ Error obteniendo pacientes frecuentes: ${pacientesFreqResult.error}`.error);
  }
}

// Función principal
async function runAdminCreation() {
  console.log(`\n🚀 CREANDO USUARIO ADMINISTRADOR`.title);
  console.log(`⏰ Fecha: ${new Date().toLocaleString()}`.info);
  
  try {
    // Crear usuario admin
    const adminUser = await createAdminUser();
    
    // Probar login con admin
    let adminToken = null;
    if (adminUser) {
      adminToken = await testLogin(adminUser.email, adminUser.password);
    }
    
    // Probar todas las funcionalidades de admin
    if (adminToken) {
      await testAdminFunctionality(adminToken);
    }
    
    // Resumen final
    console.log(`\n📋 RESUMEN FINAL`.title);
    console.log(`👑 Admin: ${adminUser ? 'Creado' : 'Falló'}`.success);
    console.log(`🔐 Login Admin: ${adminToken ? 'Exitoso' : 'Falló'}`.success);
    console.log(`🔒 Funcionalidades: ${adminToken ? 'Probadas' : 'No probadas'}`.success);
    
    if (adminUser && adminToken) {
      console.log(`\n🎉 ¡USUARIO ADMIN CREADO Y FUNCIONANDO!`.success);
      console.log(`\n📝 Credenciales de Administrador:`.info);
      console.log(`👑 Email: admin@hospital.com`.info);
      console.log(`🔑 Password: admin123`.info);
      console.log(`🏥 Centro: 1 (Quito)`.info);
      console.log(`\n🔍 Ahora puedes probar todas las funcionalidades del sistema`.info);
    } else {
      console.log(`\n⚠️ El usuario admin necesita atención`.warning);
    }
    
  } catch (error) {
    console.log(`\n💥 Error durante la creación: ${error.message}`.error);
  }
}

// Ejecutar la creación del admin
runAdminCreation();
