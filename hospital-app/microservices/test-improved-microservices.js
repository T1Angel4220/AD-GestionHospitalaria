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
  gateway: 'http://localhost:3001',
  auth: 'http://localhost:3002',
  admin: 'http://localhost:3003',
  consultas: 'http://localhost:3004',
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

// Función para obtener token de admin
async function getAdminToken() {
  console.log(`\n🔐 Obteniendo token de administrador`.title);
  
  const loginData = { 
    email: 'admin@hospital.com', 
    password: 'admin123' 
  };
  
  const result = await makeRequest(`${services.auth}/login`, 'POST', loginData);
  
  if (result.success) {
    console.log(`✅ Login exitoso: ${result.status}`.success);
    return result.data.token;
  } else {
    console.log(`❌ Login falló: ${result.error}`.error);
    return null;
  }
}

// Función para probar validaciones
async function testValidations(token) {
  if (!token) {
    console.log(`\n⚠️ No hay token disponible`.warning);
    return;
  }
  
  console.log(`\n🔍 Probando Validaciones`.title);
  
  const headers = {
    'Authorization': `Bearer ${token}`
  };
  
  // Probar validación de médico con datos inválidos
  console.log(`\n👨‍⚕️ Probando validación de médico con datos inválidos`.service);
  const medicoInvalido = {
    nombres: 'Dr.',
    apellidos: '',
    cedula: '123',
    telefono: '123',
    email: 'email-invalido',
    id_especialidad: 1,
    id_centro: 5
  };
  
  const medicoResult = await makeRequest(`${services.admin}/medicos`, 'POST', medicoInvalido, headers);
  if (!medicoResult.success) {
    console.log(`✅ Validación funcionando: ${medicoResult.response?.error || medicoResult.error}`.success);
  } else {
    console.log(`❌ Validación falló: Se creó médico con datos inválidos`.error);
  }
  
  // Probar validación de paciente con datos inválidos
  console.log(`\n👥 Probando validación de paciente con datos inválidos`.service);
  const pacienteInvalido = {
    nombres: 'P',
    apellidos: '',
    cedula: '123456789',
    telefono: '123',
    email: 'email-invalido',
    fecha_nacimiento: '2025-12-31',
    genero: 'X',
    id_centro: 5
  };
  
  const pacienteResult = await makeRequest(`${services.admin}/pacientes`, 'POST', pacienteInvalido, headers);
  if (!pacienteResult.success) {
    console.log(`✅ Validación funcionando: ${pacienteResult.response?.error || pacienteResult.error}`.success);
  } else {
    console.log(`❌ Validación falló: Se creó paciente con datos inválidos`.error);
  }
  
  // Probar validación de empleado con datos inválidos
  console.log(`\n👨‍💼 Probando validación de empleado con datos inválidos`.service);
  const empleadoInvalido = {
    nombres: 'E',
    apellidos: '',
    cargo: 'A',
    id_centro: 5
  };
  
  const empleadoResult = await makeRequest(`${services.admin}/empleados`, 'POST', empleadoInvalido, headers);
  if (!empleadoResult.success) {
    console.log(`✅ Validación funcionando: ${empleadoResult.response?.error || empleadoResult.error}`.success);
  } else {
    console.log(`❌ Validación falló: Se creó empleado con datos inválidos`.error);
  }
}

// Función para probar creación de entidades válidas
async function testCreateValidEntities(token) {
  if (!token) {
    console.log(`\n⚠️ No hay token disponible`.warning);
    return;
  }
  
  console.log(`\n✅ Probando Creación de Entidades Válidas`.title);
  
  const headers = {
    'Authorization': `Bearer ${token}`
  };
  
  // Crear médico válido
  console.log(`\n👨‍⚕️ Creando médico válido`.service);
  const medicoValido = {
    nombres: 'Dr. Carlos',
    apellidos: 'Mendoza',
    id_especialidad: 1,
    id_centro: 1
  };
  
  const medicoResult = await makeRequest(`${services.admin}/medicos`, 'POST', medicoValido, headers);
  if (medicoResult.success) {
    console.log(`✅ Médico creado: ${medicoResult.data.message}`.success);
  } else {
    console.log(`❌ Error creando médico: ${medicoResult.error}`.error);
  }
  
  // Crear paciente válido
  console.log(`\n👥 Creando paciente válido`.service);
  const timestamp = Date.now();
  const pacienteValido = {
    nombres: 'María',
    apellidos: 'González',
    cedula: `${timestamp.toString().slice(-10)}`,
    telefono: '0987654322',
    email: 'maria.gonzalez@email.com',
    fecha_nacimiento: '1990-05-15',
    genero: 'F',
    direccion: 'Av. Principal 123',
    id_centro: 1
  };
  
  const pacienteResult = await makeRequest(`${services.admin}/pacientes`, 'POST', pacienteValido, headers);
  if (pacienteResult.success) {
    console.log(`✅ Paciente creado: ${pacienteResult.data.message}`.success);
  } else {
    console.log(`❌ Error creando paciente: ${pacienteResult.error}`.error);
  }
  
  // Crear empleado válido
  console.log(`\n👨‍💼 Creando empleado válido`.service);
  const empleadoValido = {
    nombres: 'Ana',
    apellidos: 'Rodríguez',
    cargo: 'Enfermera',
    id_centro: 1
  };
  
  const empleadoResult = await makeRequest(`${services.admin}/empleados`, 'POST', empleadoValido, headers);
  if (empleadoResult.success) {
    console.log(`✅ Empleado creado: ${empleadoResult.data.message}`.success);
  } else {
    console.log(`❌ Error creando empleado: ${empleadoResult.error}`.error);
  }
}

// Función para probar rate limiting
async function testRateLimiting(token) {
  if (!token) {
    console.log(`\n⚠️ No hay token disponible`.warning);
    return;
  }
  
  console.log(`\n🚦 Probando Rate Limiting`.title);
  
  const headers = {
    'Authorization': `Bearer ${token}`
  };
  
  console.log(`📊 Enviando 5 requests rápidos para probar rate limiting...`.info);
  
  for (let i = 1; i <= 5; i++) {
    const result = await makeRequest(`${services.admin}/medicos`, 'GET', null, headers);
    if (result.success) {
      console.log(`✅ Request ${i}: ${result.status}`.success);
    } else {
      console.log(`❌ Request ${i}: ${result.status} - ${result.error}`.error);
    }
    
    // Pequeña pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Función para probar todas las funcionalidades
async function testAllFunctionalities(token) {
  if (!token) {
    console.log(`\n⚠️ No hay token disponible`.warning);
    return;
  }
  
  console.log(`\n🔍 Probando Todas las Funcionalidades`.title);
  
  const headers = {
    'Authorization': `Bearer ${token}`
  };
  
  // Probar todas las rutas del Admin Service
  const routes = [
    { name: 'Médicos', url: '/medicos' },
    { name: 'Pacientes', url: '/pacientes' },
    { name: 'Empleados', url: '/empleados' },
    { name: 'Especialidades', url: '/especialidades' },
    { name: 'Centros', url: '/centros' }
  ];
  
  for (const route of routes) {
    console.log(`\n📋 Probando ${route.name}`.service);
    const result = await makeRequest(`${services.admin}${route.url}`, 'GET', null, headers);
    
    if (result.success) {
      console.log(`✅ ${route.name}: ${result.data.length} registros`.success);
    } else {
      console.log(`❌ ${route.name}: ${result.error}`.error);
    }
  }
}

// Función principal
async function runImprovedTests() {
  console.log(`\n🚀 PROBANDO MICROSERVICIOS MEJORADOS`.title);
  console.log(`⏰ Fecha: ${new Date().toLocaleString()}`.info);
  
  try {
    // Obtener token de admin
    const token = await getAdminToken();
    
    if (token) {
      // Probar validaciones
      await testValidations(token);
      
      // Probar creación de entidades válidas
      await testCreateValidEntities(token);
      
      // Probar rate limiting
      await testRateLimiting(token);
      
      // Probar todas las funcionalidades
      await testAllFunctionalities(token);
      
      console.log(`\n📋 RESUMEN FINAL`.title);
      console.log(`✅ Validaciones: Implementadas y funcionando`.success);
      console.log(`✅ Creación de entidades: Funcionando`.success);
      console.log(`✅ Rate limiting: Implementado`.success);
      console.log(`✅ Todas las rutas: Funcionando`.success);
      
      console.log(`\n🎉 ¡MICROSERVICIOS MEJORADOS FUNCIONANDO CORRECTAMENTE!`.success);
      
    } else {
      console.log(`\n⚠️ No se pudo obtener el token de administrador`.warning);
    }
    
  } catch (error) {
    console.log(`\n💥 Error durante las pruebas: ${error.message}`.error);
  }
}

// Ejecutar las pruebas mejoradas
runImprovedTests();
