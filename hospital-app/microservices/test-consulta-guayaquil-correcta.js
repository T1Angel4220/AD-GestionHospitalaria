const axios = require('axios');

async function testConsultaGuayaquilCorrecta() {
  console.log('🔧 PROBANDO CONSULTA CON MÉDICO CORRECTO DE GUAYAQUIL');
  console.log('====================================================\n');
  
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
    
    // 2. Obtener pacientes para ver Pedro
    console.log('👥 OBTENIENDO PACIENTES:'.info);
    const pacientesResponse = await axios.get('http://localhost:3002/pacientes', { headers });
    
    const pedro = pacientesResponse.data.find(p => p.nombres.includes('Pedro') && p.apellidos.includes('Paredes'));
    console.log(`   Pedro: ID ${pedro.id}, Centro ${pedro.id_centro}, Origen: ${pedro.origen_bd}`);
    
    // 3. Obtener médicos de Guayaquil (Centro 2)
    console.log('\n👨‍⚕️ OBTENIENDO MÉDICOS DE GUAYAQUIL:'.info);
    const medicosResponse = await axios.get('http://localhost:3003/medicos', { headers });
    
    // Filtrar médicos de Guayaquil (Centro 2)
    const medicosGuayaquil = medicosResponse.data.filter(m => m.id_centro === 2);
    console.log(`   Médicos en Guayaquil: ${medicosGuayaquil.length}`);
    
    if (medicosGuayaquil.length === 0) {
      console.log('❌ No hay médicos en Guayaquil');
      return;
    }
    
    const medicoGuayaquil = medicosGuayaquil[0];
    console.log(`   Usando médico: ${medicoGuayaquil.nombres} ${medicoGuayaquil.apellidos} (ID: ${medicoGuayaquil.id})`);
    
    // 4. Crear consulta con médico de Guayaquil
    console.log('\n🔧 CREANDO CONSULTA CON MÉDICO DE GUAYAQUIL:'.info);
    
    const consultaData = {
      id_medico: medicoGuayaquil.id, // Médico de Guayaquil
      id_paciente: pedro.id, // Pedro (Guayaquil)
      paciente_nombre: pedro.nombres,
      paciente_apellido: pedro.apellidos,
      motivo: 'dolor de prueba con médico correcto',
      diagnostico: 'dolor de prueba con médico correcto',
      tratamiento: 'dolor de prueba con médico correcto',
      estado: 'programada',
      fecha: new Date('2024-12-01T16:00:00'),
      duracion_minutos: 30
    };
    
    // Enviar con centro de Guayaquil
    const consultaHeaders = {
      ...headers,
      'X-Centro-Id': '2' // Centro 2 = Guayaquil
    };
    
    console.log('📤 Datos de la consulta:', {
      id_medico: consultaData.id_medico,
      id_paciente: consultaData.id_paciente,
      centro_header: '2'
    });
    
    const consultaResponse = await axios.post('http://localhost:3003/consultas', consultaData, { headers: consultaHeaders });
    console.log('✅ Consulta creada exitosamente:', consultaResponse.data);
    
    // 5. Verificar que se creó en Guayaquil
    console.log('\n🔍 VERIFICANDO CONSULTA EN GUAYAQUIL:'.info);
    const consultasResponse = await axios.get('http://localhost:3003/consultas', { headers: consultaHeaders });
    const consultasPedro = consultasResponse.data.filter(c => c.paciente_nombre.includes('Pedro'));
    console.log(`   Consultas de Pedro en Guayaquil: ${consultasPedro.length}`);
    
    consultasPedro.forEach(c => {
      console.log(`   ID: ${c.id}, Fecha: ${c.fecha}, Médico: ${c.medico_nombres} ${c.medico_apellidos}`);
    });
    
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
  }
}

testConsultaGuayaquilCorrecta();

