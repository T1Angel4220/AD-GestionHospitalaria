// Script de prueba para la autenticación
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Función para hacer requests
async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

// Función principal de prueba
async function testAuth() {
  console.log('🧪 Iniciando pruebas de autenticación...\n');

  // 1. Test de login con admin
  console.log('1. Probando login con admin...');
  const adminLogin = await makeRequest('POST', '/auth/login', {
    email: 'admin@hospital.com',
    password: 'admin123'
  });

  if (adminLogin.success) {
    console.log('✅ Login admin exitoso');
    console.log('Token:', adminLogin.data.token.substring(0, 50) + '...');
    console.log('Usuario:', adminLogin.data.user.email, '- Rol:', adminLogin.data.user.rol);
  } else {
    console.log('❌ Error en login admin:', adminLogin.error);
    return;
  }

  const adminToken = adminLogin.data.token;

  // 2. Test de perfil
  console.log('\n2. Probando obtener perfil...');
  const profile = await makeRequest('GET', '/auth/profile', null, adminToken);
  if (profile.success) {
    console.log('✅ Perfil obtenido correctamente');
    console.log('Centro:', profile.data.centro.nombre);
  } else {
    console.log('❌ Error obteniendo perfil:', profile.error);
  }

  // 3. Test de crear usuario médico
  console.log('\n3. Probando crear usuario médico...');
  const newUser = await makeRequest('POST', '/auth/register', {
    email: 'test.medico@hospital.com',
    password: 'test123',
    rol: 'medico',
    id_centro: 1,
    id_medico: 1
  }, adminToken);

  if (newUser.success) {
    console.log('✅ Usuario médico creado exitosamente');
    console.log('Email:', newUser.data.user.email);
  } else {
    console.log('❌ Error creando usuario:', newUser.error);
  }

  // 4. Test de login con el nuevo usuario
  console.log('\n4. Probando login con nuevo usuario...');
  const newUserLogin = await makeRequest('POST', '/auth/login', {
    email: 'test.medico@hospital.com',
    password: 'test123'
  });

  if (newUserLogin.success) {
    console.log('✅ Login con nuevo usuario exitoso');
    console.log('Centro asignado:', newUserLogin.data.user.centro.nombre);
  } else {
    console.log('❌ Error en login con nuevo usuario:', newUserLogin.error);
  }

  // 5. Test de cambio de contraseña
  console.log('\n5. Probando cambio de contraseña...');
  const changePassword = await makeRequest('POST', '/auth/change-password', {
    currentPassword: 'test123',
    newPassword: 'nueva123'
  }, newUserLogin.data.token);

  if (changePassword.success) {
    console.log('✅ Contraseña cambiada exitosamente');
  } else {
    console.log('❌ Error cambiando contraseña:', changePassword.error);
  }

  // 6. Test de consultas con autenticación
  console.log('\n6. Probando acceso a consultas...');
  const consultas = await makeRequest('GET', '/consultas', null, newUserLogin.data.token);
  if (consultas.success) {
    console.log('✅ Acceso a consultas exitoso');
    console.log('Consultas encontradas:', consultas.data.length);
  } else {
    console.log('❌ Error accediendo a consultas:', consultas.error);
  }

  console.log('\n🎉 Pruebas completadas!');
}

// Ejecutar pruebas
testAuth().catch(console.error);
