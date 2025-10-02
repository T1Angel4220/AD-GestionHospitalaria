const axios = require('axios');

async function debugFrontendReal() {
  console.log('🔍 DEBUGGING FRONTEND REAL');
  console.log('==========================\n');
  
  try {
    // 1. Login como admin
    console.log('🔐 1. LOGIN COMO ADMIN:'.info);
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
    
    // 2. Simular exactamente lo que hace el frontend
    console.log('👥 2. SIMULANDO CARGA DE PACIENTES:'.info);
    const pacientesResponse = await axios.get('http://localhost:3002/pacientes', { headers });
    
    console.log('📊 Pacientes cargados:', pacientesResponse.data.length);
    pacientesResponse.data.forEach(p => {
      console.log(`   ID: ${p.id}, Nombre: ${p.nombres} ${p.apellidos}, Centro: ${p.id_centro}, Origen: ${p.origen_bd}`);
    });
    
    const pedro = pacientesResponse.data.find(p => p.nombres.includes('Pedro') && p.apellidos.includes('Paredes'));
    console.log('\n🔍 Pedro encontrado:', {
      id: pedro.id,
      nombres: pedro.nombres,
      apellidos: pedro.apellidos,
      id_centro: pedro.id_centro,
      centro_nombre: pedro.centro_nombre,
      origen_bd: pedro.origen_bd
    });
    
    // 3. Simular selección de paciente (como lo haría el frontend)
    console.log('\n🔄 3. SIMULANDO SELECCIÓN DE PACIENTE:'.info);
    const pacienteSeleccionado = pedro;
    const centroIdDelPaciente = pacienteSeleccionado?.id_centro;
    
    console.log('📤 Datos del paciente seleccionado:', {
      id: pacienteSeleccionado.id,
      nombre: `${pacienteSeleccionado.nombres} ${pacienteSeleccionado.apellidos}`,
      centro: pacienteSeleccionado.id_centro,
      centro_nombre: pacienteSeleccionado.centro_nombre,
      origen_bd: pacienteSeleccionado.origen_bd
    });
    
    console.log('🎯 Centro que se enviaría:', centroIdDelPaciente);
    
    // 4. Simular carga de médicos
    console.log('\n👨‍⚕️ 4. SIMULANDO CARGA DE MÉDICOS:'.info);
    const medicosResponse = await axios.get('http://localhost:3003/medicos', { headers });
    
    console.log('📊 Médicos cargados:', medicosResponse.data.length);
    medicosResponse.data.forEach(m => {
      console.log(`   ID: ${m.id}, Nombre: ${m.nombres} ${m.apellidos}, Centro: ${m.id_centro}`);
    });
    
    // Filtrar médicos del centro del paciente
    const medicosDelCentro = medicosResponse.data.filter(m => m.id_centro === centroIdDelPaciente);
    console.log(`\n🎯 Médicos del centro ${centroIdDelPaciente}:`, medicosDelCentro.length);
    medicosDelCentro.forEach(m => {
      console.log(`   ID: ${m.id}, Nombre: ${m.nombres} ${m.apellidos}, Centro: ${m.id_centro}`);
    });
    
    if (medicosDelCentro.length === 0) {
      console.log('❌ No hay médicos en el centro del paciente');
      return;
    }
    
    const medicoSeleccionado = medicosDelCentro[0];
    console.log('\n🎯 Médico seleccionado:', {
      id: medicoSeleccionado.id,
      nombre: `${medicoSeleccionado.nombres} ${medicoSeleccionado.apellidos}`,
      centro: medicoSeleccionado.id_centro
    });
    
    // 5. Simular creación de consulta
    console.log('\n🔧 5. SIMULANDO CREACIÓN DE CONSULTA:'.info);
    
    const consultaData = {
      id_medico: medicoSeleccionado.id,
      id_paciente: pacienteSeleccionado.id,
      paciente_nombre: pacienteSeleccionado.nombres,
      paciente_apellido: pacienteSeleccionado.apellidos,
      motivo: 'debug frontend real',
      diagnostico: 'debug frontend real',
      tratamiento: 'debug frontend real',
      estado: 'programada',
      fecha: new Date('2024-12-01T16:00:00'),
      duracion_minutos: 30
    };
    
    console.log('📤 Datos de la consulta:', consultaData);
    console.log('🎯 Centro que se enviará:', centroIdDelPaciente);
    
    // 6. Crear consulta
    const consultaHeaders = {
      ...headers,
      'X-Centro-Id': centroIdDelPaciente.toString()
    };
    
    console.log('\n📡 6. ENVIANDO AL BACKEND:'.info);
    console.log('Headers:', consultaHeaders);
    
    try {
      const consultaResponse = await axios.post('http://localhost:3003/consultas', consultaData, { headers: consultaHeaders });
      console.log('✅ Consulta creada exitosamente:', consultaResponse.data);
      
      // 7. Verificar resultado
      console.log('\n🔍 7. VERIFICACIÓN FINAL:'.info);
      console.log(`   ID de la consulta: ${consultaResponse.data.id}`);
      console.log(`   Centro en respuesta: ${consultaResponse.data.id_centro}`);
      
      if (consultaResponse.data.id_centro === centroIdDelPaciente) {
        console.log(`✅ ÉXITO: Consulta creada en Centro ${consultaResponse.data.id_centro} - CORRECTO`.success);
      } else {
        console.log(`❌ ERROR: Consulta creada en Centro ${consultaResponse.data.id_centro}, esperaba Centro ${centroIdDelPaciente} - INCORRECTO`.error);
      }
      
    } catch (error) {
      console.log('❌ Error creando consulta:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.log(`❌ Error general: ${error.message}`);
  }
}

debugFrontendReal();

