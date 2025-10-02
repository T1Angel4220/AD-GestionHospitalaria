const axios = require('axios');

async function debugFrontendCentro3() {
  console.log('🔍 DEBUGGING FRONTEND CENTRO 3');
  console.log('================================\n');
  
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
    
    // 2. Obtener todos los pacientes (como hace el frontend)
    console.log('📊 OBTENIENDO TODOS LOS PACIENTES (como frontend):');
    const pacientesResponse = await axios.get('http://localhost:3002/pacientes', { headers });
    const pacientes = pacientesResponse.data;
    
    console.log(`📊 Total pacientes: ${pacientes.length}`);
    pacientes.forEach((paciente, index) => {
      console.log(`   ${index + 1}. ID Global: ${paciente.id}, ID Original: ${paciente.id_original}, Nombre: ${paciente.nombres} ${paciente.apellidos}, Centro: ${paciente.id_centro}`);
    });
    
    // 3. Simular selección de Sebastián del Centro 3 (como hace el frontend)
    console.log('\n🎯 SIMULANDO SELECCIÓN DE SEBASTIÁN CENTRO 3:');
    const sebastianCentro3 = pacientes.find(p => p.nombres.includes('Sebastián') && p.id_centro === 3);
    
    if (!sebastianCentro3) {
      console.log('❌ No se encontró Sebastián del Centro 3');
      return;
    }
    
    console.log('✅ Sebastián Centro 3 encontrado:');
    console.log(`   ID Global: ${sebastianCentro3.id}`);
    console.log(`   ID Original: ${sebastianCentro3.id_original}`);
    console.log(`   Nombre: ${sebastianCentro3.nombres} ${sebastianCentro3.apellidos}`);
    console.log(`   Centro: ${sebastianCentro3.id_centro}`);
    
    // 4. Simular datos que enviaría el frontend
    const consultaData = {
      id_medico: 1,
      id_paciente: sebastianCentro3.id, // ID global (como hace el frontend)
      paciente_nombre: sebastianCentro3.nombres,
      paciente_apellido: sebastianCentro3.apellidos,
      motivo: 'debug frontend centro 3',
      diagnostico: 'debug frontend centro 3',
      tratamiento: 'debug frontend centro 3',
      estado: 'pendiente',
      duracion_minutos: 0
    };
    
    console.log('\n📤 Datos que enviaría el frontend:');
    console.log(JSON.stringify(consultaData, null, 2));
    
    // 5. Simular headers que enviaría el frontend
    const frontendHeaders = {
      ...headers,
      'X-Centro-Id': sebastianCentro3.id_centro.toString() // Centro del paciente
    };
    
    console.log('\n📤 Headers que enviaría el frontend:');
    console.log(`Authorization: Bearer ${token.substring(0, 20)}...`);
    console.log(`X-Centro-Id: ${sebastianCentro3.id_centro}`);
    
    // 6. Enviar consulta (como hace el frontend)
    console.log('\n🚀 ENVIANDO CONSULTA (como frontend):');
    try {
      const consultaResponse = await axios.post('http://localhost:3003/consultas', consultaData, { 
        headers: frontendHeaders 
      });
      
      console.log('✅ Consulta creada exitosamente:');
      console.log(JSON.stringify(consultaResponse.data, null, 2));
      
      // Verificar el centro real
      console.log(`\n🔍 VERIFICANDO CENTRO REAL:`);
      console.log(`   Centro esperado: ${sebastianCentro3.id_centro}`);
      console.log(`   Centro real: ${consultaResponse.data.id_centro}`);
      
      if (consultaResponse.data.id_centro === sebastianCentro3.id_centro) {
        console.log('✅ ¡Centro correcto!');
      } else {
        console.log('❌ ¡Centro incorrecto! Se creó en centro:', consultaResponse.data.id_centro);
      }
      
    } catch (error) {
      console.log('❌ Error creando consulta:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

debugFrontendCentro3();
