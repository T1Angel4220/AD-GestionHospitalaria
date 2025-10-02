const axios = require('axios');

async function debugFrontendRealCentro3Final() {
  console.log('🔍 DEBUGGING FRONTEND REAL CENTRO 3 FINAL');
  console.log('==========================================\n');
  
  try {
    // 1. Login como admin (simulando el frontend)
    console.log('🔐 1. LOGIN COMO ADMIN (simulando frontend):');
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
    
    // 2. Obtener pacientes (como hace el frontend)
    console.log('📊 2. OBTENIENDO PACIENTES (como frontend):');
    const pacientesResponse = await axios.get('http://localhost:3002/pacientes', { headers });
    const pacientes = pacientesResponse.data;
    
    console.log(`📊 Total pacientes: ${pacientes.length}`);
    pacientes.forEach((paciente, index) => {
      console.log(`   ${index + 1}. ID Global: ${paciente.id}, ID Original: ${paciente.id_original}, Nombre: ${paciente.nombres} ${paciente.apellidos}, Centro: ${paciente.id_centro}`);
    });
    
    // 3. Buscar Sebastián del Centro 3
    console.log('\n🎯 3. BUSCANDO SEBASTIÁN CENTRO 3:');
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
    
    // 4. Simular datos del formulario del frontend
    const formData = {
      id_medico: 1,
      id_paciente: sebastianCentro3.id, // ID global
      paciente_nombre: sebastianCentro3.nombres,
      paciente_apellido: sebastianCentro3.apellidos,
      motivo: 'debug frontend real centro 3 final',
      diagnostico: 'debug frontend real centro 3 final',
      tratamiento: 'debug frontend real centro 3 final',
      estado: 'pendiente',
      duracion_minutos: 0
    };
    
    console.log('\n📤 4. DATOS DEL FORMULARIO:');
    console.log(JSON.stringify(formData, null, 2));
    
    // 5. Determinar centro del paciente (como hace el frontend)
    const centroIdDelPaciente = sebastianCentro3.id_centro;
    console.log(`\n🏥 5. CENTRO DEL PACIENTE: ${centroIdDelPaciente}`);
    
    // 6. Enviar consulta (como hace el frontend)
    console.log('\n🚀 6. ENVIANDO CONSULTA (como frontend):');
    try {
      const consultaResponse = await axios.post('http://localhost:3003/consultas', formData, {
        headers: {
          ...headers,
          'X-Centro-Id': centroIdDelPaciente.toString()
        }
      });
      
      console.log('✅ Consulta creada exitosamente:');
      console.log(JSON.stringify(consultaResponse.data, null, 2));
      
      // Verificar el centro real
      console.log(`\n🔍 7. VERIFICANDO CENTRO REAL:`);
      console.log(`   Centro esperado: ${centroIdDelPaciente}`);
      console.log(`   Centro real: ${consultaResponse.data.id_centro}`);
      
      if (consultaResponse.data.id_centro === centroIdDelPaciente) {
        console.log('✅ ¡Centro correcto!');
      } else {
        console.log('❌ ¡Centro incorrecto! Se creó en centro:', consultaResponse.data.id_centro);
      }
      
    } catch (error) {
      console.log('❌ Error creando consulta:', error.response?.status, error.response?.data);
    }
    
    // 7. Verificar consultas existentes en cada centro
    console.log('\n📊 8. VERIFICANDO CONSULTAS EXISTENTES:');
    
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

debugFrontendRealCentro3Final();
