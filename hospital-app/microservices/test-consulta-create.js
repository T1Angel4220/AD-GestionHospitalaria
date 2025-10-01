const axios = require('axios');

async function testConsultaCreate() {
  console.log('🔧 PROBANDO CREACIÓN DE CONSULTAS');
  console.log('==================================\n');
  
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
    try {
      const medicosResponse = await axios.get('http://localhost:3003/medicos', { headers });
      console.log(`✅ ${medicosResponse.data.length} médicos encontrados`);
      
      if (medicosResponse.data.length > 0) {
        const medico = medicosResponse.data[0];
        console.log(`   Médico seleccionado: ${medico.nombres} ${medico.apellidos} (ID: ${medico.id})`);
        
        // 3. Crear una consulta de prueba
        console.log('\n📋 Creando consulta de prueba...');
        const consultaData = {
          id_medico: medico.id,
          paciente_nombre: 'Juan',
          paciente_apellido: 'Pérez',
          motivo: 'Dolor de cabeza',
          diagnostico: 'Migraña',
          tratamiento: 'Reposo y medicamento',
          estado: 'programada',
          fecha: new Date().toISOString(),
          duracion_minutos: 30
        };
        
        console.log('📤 Datos de la consulta:');
        console.log(`   Médico ID: ${consultaData.id_medico}`);
        console.log(`   Paciente: ${consultaData.paciente_nombre} ${consultaData.paciente_apellido}`);
        console.log(`   Motivo: ${consultaData.motivo}`);
        console.log(`   Diagnóstico: ${consultaData.diagnostico}`);
        console.log(`   Tratamiento: ${consultaData.tratamiento}`);
        console.log(`   Estado: ${consultaData.estado}`);
        console.log(`   Fecha: ${consultaData.fecha}`);
        console.log(`   Duración: ${consultaData.duracion_minutos} minutos\n`);
        
        const createResponse = await axios.post('http://localhost:3003/consultas', consultaData, { headers });
        
        console.log('✅ Consulta creada exitosamente!');
        console.log(`📋 Respuesta: ${JSON.stringify(createResponse.data, null, 2)}`);
        
      } else {
        console.log('❌ No hay médicos disponibles para crear consultas');
      }
      
    } catch (medicosError) {
      console.log(`❌ Error obteniendo médicos: ${medicosError.message}`);
      if (medicosError.response) {
        console.log(`📊 Status: ${medicosError.response.status}`);
        console.log(`📝 Datos: ${JSON.stringify(medicosError.response.data, null, 2)}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Error durante la prueba: ${error.message}`);
    
    if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`📝 Datos: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

testConsultaCreate();
