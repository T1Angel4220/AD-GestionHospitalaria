// Usar fetch nativo de Node.js (disponible desde Node 18+)

// Test script para verificar que el frontend funcione con admin-service directamente
async function testFrontendAdminDirect() {
  console.log('🧪 Probando conexión directa con admin-service...\n');

  try {
    // 1. Login para obtener token
    console.log('1. 🔐 Obteniendo token de autenticación...');
    const loginResponse = await fetch('http://localhost:3002/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@hospital.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Token obtenido exitosamente\n');

    // 2. Probar GET especialidades directamente desde admin-service
    console.log('2. 📋 Probando GET especialidades desde admin-service...');
    const getResponse = await fetch('http://localhost:3003/especialidades', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!getResponse.ok) {
      throw new Error(`GET failed: ${getResponse.status}`);
    }

    const especialidades = await getResponse.json();
    console.log(`✅ GET exitoso: ${especialidades.length} especialidades encontradas\n`);

    // 3. Probar POST especialidad directamente desde admin-service
    console.log('3. ➕ Probando POST especialidad desde admin-service...');
    const postResponse = await fetch('http://localhost:3003/especialidades', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre: 'Test Especialidad Frontend',
        id_centro: 1
      })
    });

    if (!postResponse.ok) {
      const errorText = await postResponse.text();
      throw new Error(`POST failed: ${postResponse.status} - ${errorText}`);
    }

    const newEspecialidad = await postResponse.json();
    console.log(`✅ POST exitoso: Especialidad creada con ID ${newEspecialidad.id}\n`);

    // 4. Probar PUT especialidad directamente desde admin-service
    console.log('4. ✏️ Probando PUT especialidad desde admin-service...');
    const putResponse = await fetch(`http://localhost:3003/especialidades/${newEspecialidad.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre: 'Test Especialidad Frontend Actualizada'
      })
    });

    if (!putResponse.ok) {
      const errorText = await putResponse.text();
      throw new Error(`PUT failed: ${putResponse.status} - ${errorText}`);
    }

    const updatedEspecialidad = await putResponse.json();
    console.log(`✅ PUT exitoso: Especialidad actualizada\n`);

    // 5. Probar DELETE especialidad directamente desde admin-service
    console.log('5. 🗑️ Probando DELETE especialidad desde admin-service...');
    const deleteResponse = await fetch(`http://localhost:3003/especialidades/${newEspecialidad.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      throw new Error(`DELETE failed: ${deleteResponse.status} - ${errorText}`);
    }

    const deleteResult = await deleteResponse.json();
    console.log(`✅ DELETE exitoso: ${deleteResult.message}\n`);

    console.log('🎉 ¡Todas las pruebas CRUD pasaron exitosamente!');
    console.log('✅ El admin-service funciona correctamente para todas las operaciones');
    console.log('✅ El frontend debería funcionar ahora con la nueva configuración');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    process.exit(1);
  }
}

// Ejecutar las pruebas
testFrontendAdminDirect();
