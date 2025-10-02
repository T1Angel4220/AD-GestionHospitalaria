const axios = require('axios');

async function debugCentro3Especifico() {
  console.log('🔍 DEBUGGING CENTRO 3 ESPECÍFICO');
  console.log('=================================\n');
  
  try {
    // 1. Login como admin
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
    
    // 2. Obtener todos los pacientes
    console.log('📊 OBTENIENDO TODOS LOS PACIENTES:');
    const pacientesResponse = await axios.get('http://localhost:3002/pacientes', { headers });
    const pacientes = pacientesResponse.data;
    
    console.log(`📊 Total pacientes: ${pacientes.length}`);
    pacientes.forEach((paciente, index) => {
      console.log(`   ${index + 1}. ID Global: ${paciente.id}, ID Original: ${paciente.id_original}, Nombre: ${paciente.nombres} ${paciente.apellidos}, Centro: ${paciente.id_centro}`);
    });
    
    // 3. Buscar específicamente Sebastián del Centro 3
    console.log('\n🎯 BUSCANDO SEBASTIÁN CENTRO 3:');
    const sebastianCentro3 = pacientes.find(p => p.nombres.includes('Sebastián') && p.id_centro === 3);
    
    if (!sebastianCentro3) {
      console.log('❌ No se encontró Sebastián del Centro 3');
      console.log('🔍 Pacientes con nombre Sebastián:');
      const sebastianTodos = pacientes.filter(p => p.nombres.includes('Sebastián'));
      sebastianTodos.forEach((p, index) => {
        console.log(`   ${index + 1}. ID: ${p.id}, Nombre: ${p.nombres} ${p.apellidos}, Centro: ${p.id_centro}`);
      });
      return;
    }
    
    console.log('✅ Sebastián Centro 3 encontrado:');
    console.log(`   ID Global: ${sebastianCentro3.id}`);
    console.log(`   ID Original: ${sebastianCentro3.id_original}`);
    console.log(`   Nombre: ${sebastianCentro3.nombres} ${sebastianCentro3.apellidos}`);
    console.log(`   Centro: ${sebastianCentro3.id_centro}`);
    console.log(`   Centro Nombre: ${sebastianCentro3.centro_nombre || 'N/A'}`);
    console.log(`   Origen BD: ${sebastianCentro3.origen_bd || 'N/A'}`);
    
    // 4. Simular creación de consulta como lo haría el frontend
    console.log('\n🚀 SIMULANDO CREACIÓN DE CONSULTA (como frontend):');
    
    const consultaData = {
      id_medico: 1,
      id_paciente: sebastianCentro3.id, // ID global
      paciente_nombre: sebastianCentro3.nombres,
      paciente_apellido: sebastianCentro3.apellidos,
      motivo: 'debug centro 3 específico',
      diagnostico: 'debug centro 3 específico',
      tratamiento: 'debug centro 3 específico',
      estado: 'pendiente',
      duracion_minutos: 0
    };
    
    console.log('📤 Datos de consulta:');
    console.log(JSON.stringify(consultaData, null, 2));
    
    // 5. Determinar centro del paciente (como hace el frontend)
    const centroIdDelPaciente = sebastianCentro3.id_centro;
    console.log(`\n🏥 Centro del paciente: ${centroIdDelPaciente}`);
    
    // 6. Enviar consulta con header X-Centro-Id
    const consultaHeaders = {
      ...headers,
      'X-Centro-Id': centroIdDelPaciente.toString()
    };
    
    console.log('\n📤 Headers:');
    console.log(`Authorization: Bearer ${token.substring(0, 20)}...`);
    console.log(`X-Centro-Id: ${centroIdDelPaciente}`);
    
    try {
      const consultaResponse = await axios.post('http://localhost:3003/consultas', consultaData, { 
        headers: consultaHeaders 
      });
      
      console.log('\n✅ Consulta creada exitosamente:');
      console.log(JSON.stringify(consultaResponse.data, null, 2));
      
      // Verificar el centro real
      console.log(`\n🔍 VERIFICANDO CENTRO REAL:`);
      console.log(`   Centro esperado: ${centroIdDelPaciente}`);
      console.log(`   Centro real: ${consultaResponse.data.id_centro}`);
      
      if (consultaResponse.data.id_centro === centroIdDelPaciente) {
        console.log('✅ ¡Centro correcto!');
      } else {
        console.log('❌ ¡Centro incorrecto! Se creó en centro:', consultaResponse.data.id_centro);
        console.log('🔍 Esto indica un problema en el backend');
      }
      
    } catch (error) {
      console.log('❌ Error creando consulta:', error.response?.status, error.response?.data);
    }
    
    // 7. Verificar consultas existentes en cada centro
    console.log('\n📊 VERIFICANDO CONSULTAS EXISTENTES:');
    
    try {
      // Centro 1
      const consultasCentro1 = await axios.get('http://localhost:3003/consultas', {
        headers: { ...headers, 'X-Centro-Id': '1' }
      });
      console.log(`🏥 Centro 1: ${consultasCentro1.data.length} consultas`);
      
      // Centro 2
      const consultasCentro2 = await axios.get('http://localhost:3003/consultas', {
        headers: { ...headers, 'X-Centro-Id': '2' }
      });
      console.log(`🏥 Centro 2: ${consultasCentro2.data.length} consultas`);
      
      // Centro 3
      const consultasCentro3 = await axios.get('http://localhost:3003/consultas', {
        headers: { ...headers, 'X-Centro-Id': '3' }
      });
      console.log(`🏥 Centro 3: ${consultasCentro3.data.length} consultas`);
      
    } catch (error) {
      console.log('❌ Error verificando consultas:', error.message);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

debugCentro3Especifico();
