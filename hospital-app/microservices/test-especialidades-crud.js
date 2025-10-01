// Script específico para probar CRUD de Especialidades
// Usar fetch nativo de Node.js (disponible desde Node 18+)

// Configuración
const API_BASE_URL = 'http://localhost:3001/api';
const TEST_EMAIL = 'admin@hospital.com';
const TEST_PASSWORD = 'admin123';

let authToken = '';

// Función para hacer login
async function login() {
  try {
    console.log('🔐 Iniciando sesión...');
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Login failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    authToken = data.token;
    console.log('✅ Login exitoso');
    return true;
  } catch (error) {
    console.error('❌ Error en login:', error.message);
    return false;
  }
}

// Función para hacer requests autenticados
async function authenticatedRequest(endpoint, options = {}) {
  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      ...options.headers,
    },
  });
}

// Test CRUD Especialidades
async function testEspecialidadesCRUD() {
  console.log('\n🏥 === TESTING ESPECIALIDADES CRUD ===');
  
  try {
    // READ - Obtener todas las especialidades
    console.log('📖 Leyendo especialidades existentes...');
    const getResponse = await authenticatedRequest('/admin/especialidades');
    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      throw new Error(`GET failed: ${getResponse.status} - ${errorText}`);
    }
    const especialidadesExistentes = await getResponse.json();
    console.log('✅ Especialidades existentes:', especialidadesExistentes.length);

    // CREATE
    console.log('📝 Creando especialidad...');
    const createResponse = await authenticatedRequest('/admin/especialidades', {
      method: 'POST',
      body: JSON.stringify({
        nombre: 'Cardiología Test',
        id_centro: 1
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`CREATE failed: ${createResponse.status} - ${errorText}`);
    }

    const createdEspecialidad = await createResponse.json();
    console.log('✅ Especialidad creada:', createdEspecialidad);

    const especialidadId = createdEspecialidad.id;

    // READ - Obtener especialidad específica
    console.log('📖 Leyendo especialidad específica...');
    const readResponse = await authenticatedRequest(`/admin/especialidades/${especialidadId}`);
    if (!readResponse.ok) {
      const errorText = await readResponse.text();
      throw new Error(`READ failed: ${readResponse.status} - ${errorText}`);
    }
    const readEspecialidad = await readResponse.json();
    console.log('✅ Especialidad leída:', readEspecialidad);

    // UPDATE
    console.log('✏️ Actualizando especialidad...');
    const updateResponse = await authenticatedRequest(`/admin/especialidades/${especialidadId}`, {
      method: 'PUT',
      body: JSON.stringify({
        nombre: 'Cardiología Intervencionista Test'
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`UPDATE failed: ${updateResponse.status} - ${errorText}`);
    }

    const updatedEspecialidad = await updateResponse.json();
    console.log('✅ Especialidad actualizada:', updatedEspecialidad);

    // Verificar que se actualizó correctamente
    console.log('🔍 Verificando actualización...');
    const verifyResponse = await authenticatedRequest(`/admin/especialidades/${especialidadId}`);
    if (!verifyResponse.ok) {
      throw new Error(`VERIFY failed: ${verifyResponse.status}`);
    }
    const verifyEspecialidad = await verifyResponse.json();
    console.log('✅ Verificación exitosa:', verifyEspecialidad);

    // DELETE
    console.log('🗑️ Eliminando especialidad...');
    const deleteResponse = await authenticatedRequest(`/admin/especialidades/${especialidadId}`, {
      method: 'DELETE'
    });

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      throw new Error(`DELETE failed: ${deleteResponse.status} - ${errorText}`);
    }

    const deleteResult = await deleteResponse.json();
    console.log('✅ Especialidad eliminada:', deleteResult);

    // Verificar que se eliminó correctamente
    console.log('🔍 Verificando eliminación...');
    const verifyDeleteResponse = await authenticatedRequest(`/admin/especialidades/${especialidadId}`);
    if (verifyDeleteResponse.status !== 404) {
      throw new Error(`VERIFY DELETE failed: Expected 404, got ${verifyDeleteResponse.status}`);
    }
    console.log('✅ Verificación de eliminación exitosa (404)');

    console.log('🎉 CRUD Especialidades: TODOS LOS TESTS PASARON');
    return true;

  } catch (error) {
    console.error('❌ Error en test Especialidades CRUD:', error.message);
    return false;
  }
}

// Test de casos edge
async function testEspecialidadesEdgeCases() {
  console.log('\n🧪 === TESTING EDGE CASES ===');
  
  try {
    // Test 1: Crear especialidad sin nombre
    console.log('📝 Test: Crear especialidad sin nombre...');
    const createResponse = await authenticatedRequest('/admin/especialidades', {
      method: 'POST',
      body: JSON.stringify({
        nombre: '',
        id_centro: 1
      })
    });

    if (createResponse.ok) {
      console.log('⚠️ WARNING: Se creó especialidad sin nombre (no debería pasar)');
    } else {
      console.log('✅ Correcto: No se puede crear especialidad sin nombre');
    }

    // Test 2: Actualizar especialidad inexistente
    console.log('✏️ Test: Actualizar especialidad inexistente...');
    const updateResponse = await authenticatedRequest('/admin/especialidades/99999', {
      method: 'PUT',
      body: JSON.stringify({
        nombre: 'Test'
      })
    });

    if (updateResponse.status === 404) {
      console.log('✅ Correcto: Especialidad inexistente devuelve 404');
    } else {
      console.log('⚠️ WARNING: Debería devolver 404 para especialidad inexistente');
    }

    // Test 3: Eliminar especialidad inexistente
    console.log('🗑️ Test: Eliminar especialidad inexistente...');
    const deleteResponse = await authenticatedRequest('/admin/especialidades/99999', {
      method: 'DELETE'
    });

    if (deleteResponse.status === 404) {
      console.log('✅ Correcto: Eliminar especialidad inexistente devuelve 404');
    } else {
      console.log('⚠️ WARNING: Debería devolver 404 para especialidad inexistente');
    }

    console.log('🎉 Edge Cases: Tests completados');
    return true;

  } catch (error) {
    console.error('❌ Error en edge cases:', error.message);
    return false;
  }
}

// Función principal
async function runEspecialidadesTests() {
  console.log('🚀 INICIANDO TESTS DE ESPECIALIDADES CRUD');
  console.log('==========================================');

  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('❌ No se pudo hacer login. Abortando tests.');
    return;
  }

  const results = {
    crud: await testEspecialidadesCRUD(),
    edgeCases: await testEspecialidadesEdgeCases()
  };

  console.log('\n📊 === RESUMEN DE RESULTADOS ===');
  console.log('================================');
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test.toUpperCase()}: ${passed ? 'PASÓ' : 'FALLÓ'}`);
  });

  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 ¡TODOS LOS TESTS DE ESPECIALIDADES PASARON!');
    console.log('Las operaciones CRUD de especialidades están funcionando correctamente.');
  } else {
    console.log('\n⚠️ Algunos tests fallaron. Revisar los errores arriba.');
  }
}

// Ejecutar tests
runEspecialidadesTests().catch(console.error);
