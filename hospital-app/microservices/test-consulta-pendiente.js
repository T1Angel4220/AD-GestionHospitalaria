const axios = require('axios');

async function testConsultaPendiente() {
  console.log('🔧 PROBANDO CREACIÓN DE CONSULTA PENDIENTE');
  console.log('==========================================\n');
  
  try {
    // 1. Hacer login como admin
    console.log('🔐 Obteniendo token de admin...');
    const loginResponse = await axios.post('http://localhost:3001/login', {
      email: 'admin@hospital.com',
      password: 'password'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Token obtenido\n');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Centro-Id': '1'
    };
    
    // 2. Obtener médicos disponibles
    console.log('👨‍⚕️ Obteniendo médicos...');
    const medicosResponse = await axios.get('http://localhost:3003/medicos', { headers });
    console.log(`✅ ${medicosResponse.data.length} médicos encontrados`);
    
    if (medicosResponse.data.length > 0) {
      const medico = medicosResponse.data[0];
      console.log(`   Médico seleccionado: ${medico.nombres} ${medico.apellidos} (ID: ${medico.id})\n`);
      
      // 3. Crear una consulta PENDIENTE (sin duración específica)
      console.log('📋 Creando consulta PENDIENTE...');
      const consultaData = {
        id_medico: medico.id,
        paciente_nombre: 'Ana',
        paciente_apellido: 'Rodríguez',
        motivo: 'dolor',
        diagnostico: 'dolor',
        tratamiento: 'dolor',
        estado: 'pendiente',
        fecha: new Date().toISOString(),
        duracion_minutos: 0  // ← Esto debería ser permitido para consultas pendientes
      };
      
      console.log('📤 Datos de la consulta PENDIENTE:');
      console.log(`   Médico ID: ${consultaData.id_medico}`);
      console.log(`   Paciente: ${consultaData.paciente_nombre} ${consultaData.paciente_apellido}`);
      console.log(`   Motivo: ${consultaData.motivo}`);
      console.log(`   Estado: ${consultaData.estado}`);
      console.log(`   Duración: ${consultaData.duracion_minutos} minutos (debería permitir 0)\n`);
      
      const createResponse = await axios.post('http://localhost:3003/consultas', consultaData, { headers });
      
      console.log('✅ Consulta PENDIENTE creada exitosamente!');
      console.log(`📋 Respuesta: ${JSON.stringify(createResponse.data, null, 2)}`);
      
    } else {
      console.log('❌ No hay médicos disponibles para crear consultas');
    }
    
  } catch (error) {
    console.log(`❌ Error durante la prueba: ${error.message}`);
    
    if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`📝 Datos: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

testConsultaPendiente();
