const axios = require('axios');

async function debugFrontendConsulta() {
  console.log('🔍 DEBUGGING FRONTEND CONSULTA CREATION');
  console.log('========================================\n');
  
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
      'Content-Type': 'application/json'
    };
    
    // 2. Obtener pacientes para ver los IDs
    console.log('👥 OBTENIENDO PACIENTES:'.info);
    const pacientesResponse = await axios.get('http://localhost:3002/pacientes', { headers });
    console.log(`   Total pacientes: ${pacientesResponse.data.length}`);
    
    const pedro = pacientesResponse.data.find(p => p.nombres.includes('Pedro') && p.apellidos.includes('Paredes'));
    if (pedro) {
      console.log(`   Pedro encontrado:`, {
        id: pedro.id,
        nombres: pedro.nombres,
        apellidos: pedro.apellidos,
        id_centro: pedro.id_centro,
        centro_nombre: pedro.centro_nombre,
        origen_bd: pedro.origen_bd
      });
    }
    
    // 3. Obtener médicos
    console.log('\n👨‍⚕️ OBTENIENDO MÉDICOS:'.info);
    const medicosResponse = await axios.get('http://localhost:3003/medicos', { headers });
    console.log(`   Total médicos: ${medicosResponse.data.length}`);
    
    const medico = medicosResponse.data[0];
    if (medico) {
      console.log(`   Primer médico:`, {
        id: medico.id,
        nombres: medico.nombres,
        apellidos: medico.apellidos,
        id_centro: medico.id_centro,
        centro_nombre: medico.centro_nombre,
        origen_bd: medico.origen_bd
      });
    }
    
    // 4. Simular creación de consulta como lo haría el frontend
    console.log('\n🔧 SIMULANDO CREACIÓN DE CONSULTA:'.info);
    
    const consultaData = {
      id_medico: medico.id,
      id_paciente: pedro.id, // ID global del paciente
      paciente_nombre: pedro.nombres,
      paciente_apellido: pedro.apellidos,
      motivo: 'dolor de prueba',
      diagnostico: 'dolor de prueba',
      tratamiento: 'dolor de prueba',
      estado: 'programada',
      fecha: new Date('2024-12-01T16:00:00'),
      duracion_minutos: 30
    };
    
    // El frontend enviaría el centro del paciente
    const centroIdDelPaciente = pedro.id_centro;
    
    console.log('📤 Datos que enviaría el frontend:', {
      consultaData,
      centroIdDelPaciente,
      headerXCentroId: centroIdDelPaciente
    });
    
    // 5. Crear consulta con el header correcto
    const consultaHeaders = {
      ...headers,
      'X-Centro-Id': centroIdDelPaciente.toString()
    };
    
    console.log('\n📡 ENVIANDO CONSULTA AL BACKEND:'.info);
    console.log('Headers:', consultaHeaders);
    
    try {
      const consultaResponse = await axios.post('http://localhost:3003/consultas', consultaData, { headers: consultaHeaders });
      console.log('✅ Consulta creada exitosamente:', consultaResponse.data);
    } catch (error) {
      console.log('❌ Error creando consulta:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.log(`❌ Error general: ${error.message}`);
  }
}

debugFrontendConsulta();

