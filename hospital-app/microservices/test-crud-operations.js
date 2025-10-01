// Usar fetch nativo de Node.js (disponible desde Node 18+)

// Configuración
const API_BASE_URL = 'http://localhost:3001/api';
const TEST_EMAIL = 'admin@test.com';
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
      throw new Error(`Login failed: ${response.status}`);
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

// Test CRUD Pacientes
async function testPacientesCRUD() {
  console.log('\n🏥 === TESTING PACIENTES CRUD ===');
  
  try {
    // CREATE
    console.log('📝 Creando paciente...');
    const createResponse = await authenticatedRequest('/pacientes', {
      method: 'POST',
      body: JSON.stringify({
        nombres: 'Juan',
        apellidos: 'Pérez',
        cedula: '1234567890',
        telefono: '0987654321',
        email: 'juan.perez@test.com',
        fecha_nacimiento: '1990-01-01',
        genero: 'M',
        direccion: 'Calle Test 123',
        id_centro: 1
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`CREATE failed: ${createResponse.status} - ${errorText}`);
    }

    const createdPaciente = await createResponse.json();
    console.log('✅ Paciente creado:', createdPaciente);

    const pacienteId = createdPaciente.id;

    // READ
    console.log('📖 Leyendo paciente...');
    const readResponse = await authenticatedRequest(`/pacientes/${pacienteId}`);
    if (!readResponse.ok) {
      throw new Error(`READ failed: ${readResponse.status}`);
    }
    const readPaciente = await readResponse.json();
    console.log('✅ Paciente leído:', readPaciente);

    // UPDATE
    console.log('✏️ Actualizando paciente...');
    const updateResponse = await authenticatedRequest(`/pacientes/${pacienteId}`, {
      method: 'PUT',
      body: JSON.stringify({
        nombres: 'Juan Carlos',
        telefono: '0999888777'
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`UPDATE failed: ${updateResponse.status} - ${errorText}`);
    }

    const updatedPaciente = await updateResponse.json();
    console.log('✅ Paciente actualizado:', updatedPaciente);

    // DELETE
    console.log('🗑️ Eliminando paciente...');
    const deleteResponse = await authenticatedRequest(`/pacientes/${pacienteId}`, {
      method: 'DELETE'
    });

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      throw new Error(`DELETE failed: ${deleteResponse.status} - ${errorText}`);
    }

    const deleteResult = await deleteResponse.json();
    console.log('✅ Paciente eliminado:', deleteResult);

    console.log('🎉 CRUD Pacientes: TODOS LOS TESTS PASARON');
    return true;

  } catch (error) {
    console.error('❌ Error en test Pacientes CRUD:', error.message);
    return false;
  }
}

// Test CRUD Médicos
async function testMedicosCRUD() {
  console.log('\n👨‍⚕️ === TESTING MÉDICOS CRUD ===');
  
  try {
    // CREATE
    console.log('📝 Creando médico...');
    const createResponse = await authenticatedRequest('/admin/medicos', {
      method: 'POST',
      body: JSON.stringify({
        nombres: 'Dr. Carlos',
        apellidos: 'Mendoza',
        id_especialidad: 1,
        id_centro: 1
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`CREATE failed: ${createResponse.status} - ${errorText}`);
    }

    const createdMedico = await createResponse.json();
    console.log('✅ Médico creado:', createdMedico);

    const medicoId = createdMedico.id;

    // READ
    console.log('📖 Leyendo médico...');
    const readResponse = await authenticatedRequest(`/admin/medicos/${medicoId}`);
    if (!readResponse.ok) {
      throw new Error(`READ failed: ${readResponse.status}`);
    }
    const readMedico = await readResponse.json();
    console.log('✅ Médico leído:', readMedico);

    // UPDATE
    console.log('✏️ Actualizando médico...');
    const updateResponse = await authenticatedRequest(`/admin/medicos/${medicoId}`, {
      method: 'PUT',
      body: JSON.stringify({
        nombres: 'Dr. Carlos Alberto',
        apellidos: 'Mendoza López'
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`UPDATE failed: ${updateResponse.status} - ${errorText}`);
    }

    const updatedMedico = await updateResponse.json();
    console.log('✅ Médico actualizado:', updatedMedico);

    // DELETE
    console.log('🗑️ Eliminando médico...');
    const deleteResponse = await authenticatedRequest(`/admin/medicos/${medicoId}`, {
      method: 'DELETE'
    });

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      throw new Error(`DELETE failed: ${deleteResponse.status} - ${errorText}`);
    }

    const deleteResult = await deleteResponse.json();
    console.log('✅ Médico eliminado:', deleteResult);

    console.log('🎉 CRUD Médicos: TODOS LOS TESTS PASARON');
    return true;

  } catch (error) {
    console.error('❌ Error en test Médicos CRUD:', error.message);
    return false;
  }
}

// Test CRUD Empleados
async function testEmpleadosCRUD() {
  console.log('\n👷 === TESTING EMPLEADOS CRUD ===');
  
  try {
    // CREATE
    console.log('📝 Creando empleado...');
    const createResponse = await authenticatedRequest('/admin/empleados', {
      method: 'POST',
      body: JSON.stringify({
        nombres: 'María',
        apellidos: 'González',
        cargo: 'Recepcionista',
        id_centro: 1
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`CREATE failed: ${createResponse.status} - ${errorText}`);
    }

    const createdEmpleado = await createResponse.json();
    console.log('✅ Empleado creado:', createdEmpleado);

    const empleadoId = createdEmpleado.id;

    // READ
    console.log('📖 Leyendo empleado...');
    const readResponse = await authenticatedRequest(`/admin/empleados/${empleadoId}`);
    if (!readResponse.ok) {
      throw new Error(`READ failed: ${readResponse.status}`);
    }
    const readEmpleado = await readResponse.json();
    console.log('✅ Empleado leído:', readEmpleado);

    // UPDATE
    console.log('✏️ Actualizando empleado...');
    const updateResponse = await authenticatedRequest(`/admin/empleados/${empleadoId}`, {
      method: 'PUT',
      body: JSON.stringify({
        nombres: 'María Elena',
        cargo: 'Supervisora'
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`UPDATE failed: ${updateResponse.status} - ${errorText}`);
    }

    const updatedEmpleado = await updateResponse.json();
    console.log('✅ Empleado actualizado:', updatedEmpleado);

    // DELETE
    console.log('🗑️ Eliminando empleado...');
    const deleteResponse = await authenticatedRequest(`/admin/empleados/${empleadoId}`, {
      method: 'DELETE'
    });

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      throw new Error(`DELETE failed: ${deleteResponse.status} - ${errorText}`);
    }

    const deleteResult = await deleteResponse.json();
    console.log('✅ Empleado eliminado:', deleteResult);

    console.log('🎉 CRUD Empleados: TODOS LOS TESTS PASARON');
    return true;

  } catch (error) {
    console.error('❌ Error en test Empleados CRUD:', error.message);
    return false;
  }
}

// Test CRUD Especialidades
async function testEspecialidadesCRUD() {
  console.log('\n🏥 === TESTING ESPECIALIDADES CRUD ===');
  
  try {
    // CREATE
    console.log('📝 Creando especialidad...');
    const createResponse = await authenticatedRequest('/admin/especialidades', {
      method: 'POST',
      body: JSON.stringify({
        nombre: 'Cardiología',
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

    // READ
    console.log('📖 Leyendo especialidad...');
    const readResponse = await authenticatedRequest(`/admin/especialidades/${especialidadId}`);
    if (!readResponse.ok) {
      throw new Error(`READ failed: ${readResponse.status}`);
    }
    const readEspecialidad = await readResponse.json();
    console.log('✅ Especialidad leída:', readEspecialidad);

    // UPDATE
    console.log('✏️ Actualizando especialidad...');
    const updateResponse = await authenticatedRequest(`/admin/especialidades/${especialidadId}`, {
      method: 'PUT',
      body: JSON.stringify({
        nombre: 'Cardiología Intervencionista'
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`UPDATE failed: ${updateResponse.status} - ${errorText}`);
    }

    const updatedEspecialidad = await updateResponse.json();
    console.log('✅ Especialidad actualizada:', updatedEspecialidad);

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

    console.log('🎉 CRUD Especialidades: TODOS LOS TESTS PASARON');
    return true;

  } catch (error) {
    console.error('❌ Error en test Especialidades CRUD:', error.message);
    return false;
  }
}

// Función principal
async function runAllTests() {
  console.log('🚀 INICIANDO TESTS DE OPERACIONES CRUD');
  console.log('=====================================');

  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('❌ No se pudo hacer login. Abortando tests.');
    return;
  }

  const results = {
    pacientes: await testPacientesCRUD(),
    medicos: await testMedicosCRUD(),
    empleados: await testEmpleadosCRUD(),
    especialidades: await testEspecialidadesCRUD()
  };

  console.log('\n📊 === RESUMEN DE RESULTADOS ===');
  console.log('================================');
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test.toUpperCase()}: ${passed ? 'PASÓ' : 'FALLÓ'}`);
  });

  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 ¡TODOS LOS TESTS PASARON! Las operaciones CRUD están funcionando correctamente.');
  } else {
    console.log('\n⚠️ Algunos tests fallaron. Revisar los errores arriba.');
  }
}

// Ejecutar tests
runAllTests().catch(console.error);
