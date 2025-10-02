const axios = require('axios');

async function debugPacientesCentro3() {
  console.log('🔍 DEBUGGING PACIENTES CENTRO 3');
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
    
    // 2. Obtener todos los pacientes
    console.log('📊 OBTENIENDO TODOS LOS PACIENTES:');
    const pacientesResponse = await axios.get('http://localhost:3002/pacientes', { headers });
    const pacientes = pacientesResponse.data;
    
    console.log(`📊 Total pacientes: ${pacientes.length}`);
    pacientes.forEach((paciente, index) => {
      console.log(`   ${index + 1}. ID Global: ${paciente.id}, ID Original: ${paciente.id_original}, Nombre: ${paciente.nombres} ${paciente.apellidos}, Centro: ${paciente.id_centro}`);
    });
    
    // 3. Filtrar pacientes del Centro 3
    console.log('\n🏥 PACIENTES DEL CENTRO 3 (Cuenca):');
    const pacientesCentro3 = pacientes.filter(p => p.id_centro === 3);
    console.log(`📊 Pacientes Centro 3: ${pacientesCentro3.length}`);
    
    pacientesCentro3.forEach((paciente, index) => {
      console.log(`   ${index + 1}. ID Global: ${paciente.id}, ID Original: ${paciente.id_original}, Nombre: ${paciente.nombres} ${paciente.apellidos}, Centro: ${paciente.id_centro}`);
    });
    
    // 4. Verificar si hay pacientes con centro incorrecto
    console.log('\n🔍 VERIFICANDO CENTROS INCORRECTOS:');
    const pacientesCentroIncorrecto = pacientes.filter(p => p.nombres.includes('Sebastián') && p.id_centro !== 3);
    console.log(`📊 Pacientes Sebastián con centro incorrecto: ${pacientesCentroIncorrecto.length}`);
    
    pacientesCentroIncorrecto.forEach((paciente, index) => {
      console.log(`   ${index + 1}. ID Global: ${paciente.id}, ID Original: ${paciente.id_original}, Nombre: ${paciente.nombres} ${paciente.apellidos}, Centro: ${paciente.id_centro}`);
    });
    
    // 5. Verificar datos específicos de Sebastián
    console.log('\n🎯 DATOS ESPECÍFICOS DE SEBASTIÁN:');
    const sebastian = pacientes.find(p => p.nombres.includes('Sebastián') && p.apellidos.includes('Ortiz'));
    if (sebastian) {
      console.log('✅ Sebastián encontrado:');
      console.log(`   ID Global: ${sebastian.id}`);
      console.log(`   ID Original: ${sebastian.id_original}`);
      console.log(`   Nombre: ${sebastian.nombres} ${sebastian.apellidos}`);
      console.log(`   Centro: ${sebastian.id_centro}`);
      console.log(`   Centro Nombre: ${sebastian.centro_nombre || 'N/A'}`);
      console.log(`   Origen BD: ${sebastian.origen_bd || 'N/A'}`);
    } else {
      console.log('❌ No se encontró a Sebastián');
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

debugPacientesCentro3();
