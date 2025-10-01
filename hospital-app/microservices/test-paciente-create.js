const axios = require('axios');

async function testPacienteCreate() {
  console.log('🔧 PROBANDO CREACIÓN DE PACIENTES');
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
      'Content-Type': 'application/json'
    };
    
    // 2. Crear un paciente de prueba
    console.log('👤 Creando paciente de prueba...');
    const pacienteData = {
      nombres: 'María',
      apellidos: 'González',
      cedula: '1234567890',
      telefono: '0987654321',
      email: 'maria.gonzalez@email.com',
      fecha_nacimiento: '1990-05-15',
      genero: 'F',
      id_centro: 1
    };
    
    console.log('📤 Datos del paciente:');
    console.log(`   Nombres: ${pacienteData.nombres}`);
    console.log(`   Apellidos: ${pacienteData.apellidos}`);
    console.log(`   Cédula: ${pacienteData.cedula}`);
    console.log(`   Teléfono: ${pacienteData.telefono}`);
    console.log(`   Email: ${pacienteData.email}`);
    console.log(`   Fecha de nacimiento: ${pacienteData.fecha_nacimiento}`);
    console.log(`   Género: ${pacienteData.genero}`);
    console.log(`   Centro: ${pacienteData.id_centro}\n`);
    
    const createResponse = await axios.post('http://localhost:3002/pacientes', pacienteData, { headers });
    
    console.log('✅ Paciente creado exitosamente!');
    console.log(`📋 Respuesta: ${JSON.stringify(createResponse.data, null, 2)}`);
    
    // 3. Verificar que el paciente se creó correctamente
    console.log('\n🔍 Verificando que el paciente se creó...');
    const pacientesResponse = await axios.get('http://localhost:3002/pacientes', { headers });
    
    const nuevoPaciente = pacientesResponse.data.find(p => p.cedula === pacienteData.cedula);
    if (nuevoPaciente) {
      console.log('✅ Paciente encontrado en la lista:');
      console.log(`   ID: ${nuevoPaciente.id}`);
      console.log(`   Nombres: ${nuevoPaciente.nombres}`);
      console.log(`   Apellidos: ${nuevoPaciente.apellidos}`);
      console.log(`   Cédula: ${nuevoPaciente.cedula}`);
      console.log(`   Teléfono: ${nuevoPaciente.telefono}`);
      console.log(`   Email: ${nuevoPaciente.email}`);
      console.log(`   Fecha de nacimiento: ${nuevoPaciente.fecha_nacimiento}`);
      console.log(`   Género: ${nuevoPaciente.genero}`);
      console.log(`   Centro: ${nuevoPaciente.centro_nombre || 'N/A'}`);
    } else {
      console.log('❌ No se pudo encontrar el paciente creado');
    }
    
  } catch (error) {
    console.log(`❌ Error durante la prueba: ${error.message}`);
    
    if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`📝 Datos: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

testPacienteCreate();
