const axios = require('axios');

async function debugCentro2Especifico() {
  console.log('🔍 DEBUGGING CENTRO 2 ESPECÍFICO');
  console.log('================================\n');
  
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
    
    // 2. Verificar datos específicos del Centro 2
    console.log('🏥 2. VERIFICANDO CENTRO 2 (GUAYAQUIL):'.info);
    
    // Cargar pacientes
    const pacientesResponse = await axios.get('http://localhost:3002/pacientes', { headers });
    const pacientes = pacientesResponse.data;
    
    const pacientesCentro2 = pacientes.filter(p => p.id_centro === 2);
    console.log(`📊 Pacientes en Centro 2: ${pacientesCentro2.length}`);
    pacientesCentro2.forEach(p => {
      console.log(`   ID: ${p.id}, Nombre: ${p.nombres} ${p.apellidos}, Centro: ${p.id_centro}, Origen: ${p.origen_bd}`);
    });
    
    // Cargar médicos
    const medicosResponse = await axios.get('http://localhost:3003/medicos', { headers });
    const medicos = medicosResponse.data;
    
    const medicosCentro2 = medicos.filter(m => m.id_centro === 2);
    console.log(`📊 Médicos en Centro 2: ${medicosCentro2.length}`);
    medicosCentro2.forEach(m => {
      console.log(`   ID: ${m.id}, Nombre: ${m.nombres} ${m.apellidos}, Centro: ${m.id_centro}`);
    });
    
    if (pacientesCentro2.length === 0 || medicosCentro2.length === 0) {
      console.log('❌ No hay pacientes o médicos en Centro 2');
      return;
    }
    
    const pacienteCentro2 = pacientesCentro2[0];
    const medicoCentro2 = medicosCentro2[0];
    
    console.log(`🎯 Paciente seleccionado: ${pacienteCentro2.nombres} ${pacienteCentro2.apellidos} (ID: ${pacienteCentro2.id}, Centro: ${pacienteCentro2.id_centro})`);
    console.log(`🎯 Médico seleccionado: ${medicoCentro2.nombres} ${medicoCentro2.apellidos} (ID: ${medicoCentro2.id}, Centro: ${medicoCentro2.id_centro})`);
    
    // 3. Probar creación de consulta en Centro 2
    console.log('\n🔧 3. PROBANDO CREACIÓN EN CENTRO 2:'.info);
    
    const consultaData = {
      id_medico: medicoCentro2.id,
      id_paciente: pacienteCentro2.id,
      paciente_nombre: pacienteCentro2.nombres,
      paciente_apellido: pacienteCentro2.apellidos,
      motivo: 'debug centro 2 específico',
      diagnostico: 'debug centro 2 específico',
      tratamiento: 'debug centro 2 específico',
      estado: 'pendiente',
      fecha: undefined,
      duracion_minutos: 0
    };
    
    const consultaHeaders = {
      ...headers,
      'X-Centro-Id': '2'
    };
    
    console.log('📤 Datos:', consultaData);
    console.log('📤 Headers:', consultaHeaders);
    
    try {
      const consultaResponse = await axios.post('http://localhost:3003/consultas', consultaData, { headers: consultaHeaders });
      console.log('✅ Consulta creada:', consultaResponse.data);
      
      console.log('\n🔍 VERIFICACIÓN:'.info);
      console.log(`   ID de la consulta: ${consultaResponse.data.id}`);
      console.log(`   Centro en respuesta: ${consultaResponse.data.id_centro}`);
      
      if (consultaResponse.data.id_centro === 2) {
        console.log('✅ ÉXITO: Consulta creada en Centro 2 - CORRECTO'.success);
      } else {
        console.log(`❌ ERROR: Consulta creada en Centro ${consultaResponse.data.id_centro}, esperaba Centro 2 - INCORRECTO`.error);
      }
      
    } catch (error) {
      console.log('❌ Error creando consulta:', error.response?.status, error.response?.data);
    }
    
    // 4. Comparar con Centro 3
    console.log('\n🏥 4. COMPARANDO CON CENTRO 3 (CUENCA):'.info);
    
    const pacientesCentro3 = pacientes.filter(p => p.id_centro === 3);
    const medicosCentro3 = medicos.filter(m => m.id_centro === 3);
    
    console.log(`📊 Pacientes en Centro 3: ${pacientesCentro3.length}`);
    console.log(`📊 Médicos en Centro 3: ${medicosCentro3.length}`);
    
    if (pacientesCentro3.length > 0 && medicosCentro3.length > 0) {
      const pacienteCentro3 = pacientesCentro3[0];
      const medicoCentro3 = medicosCentro3[0];
      
      console.log(`🎯 Paciente Centro 3: ${pacienteCentro3.nombres} ${pacienteCentro3.apellidos} (ID: ${pacienteCentro3.id}, Centro: ${pacienteCentro3.id_centro})`);
      console.log(`🎯 Médico Centro 3: ${medicoCentro3.nombres} ${medicoCentro3.apellidos} (ID: ${medicoCentro3.id}, Centro: ${medicoCentro3.id_centro})`);
      
      // Probar creación en Centro 3
      const consultaData3 = {
        id_medico: medicoCentro3.id,
        id_paciente: pacienteCentro3.id,
        paciente_nombre: pacienteCentro3.nombres,
        paciente_apellido: pacienteCentro3.apellidos,
        motivo: 'debug centro 3 comparación',
        diagnostico: 'debug centro 3 comparación',
        tratamiento: 'debug centro 3 comparación',
        estado: 'pendiente',
        fecha: undefined,
        duracion_minutos: 0
      };
      
      const consultaHeaders3 = {
        ...headers,
        'X-Centro-Id': '3'
      };
      
      try {
        const consultaResponse3 = await axios.post('http://localhost:3003/consultas', consultaData3, { headers: consultaHeaders3 });
        console.log('✅ Consulta Centro 3 creada:', consultaResponse3.data);
        
        if (consultaResponse3.data.id_centro === 3) {
          console.log('✅ ÉXITO: Consulta Centro 3 creada correctamente - CORRECTO'.success);
        } else {
          console.log(`❌ ERROR: Consulta Centro 3 creada en Centro ${consultaResponse3.data.id_centro} - INCORRECTO`.error);
        }
        
      } catch (error) {
        console.log('❌ Error creando consulta Centro 3:', error.response?.status, error.response?.data);
      }
    }
    
    // 5. Verificar logs del backend
    console.log('\n📋 5. VERIFICANDO LOGS DEL BACKEND:'.info);
    console.log('Revisa los logs del consultas-service para ver qué está pasando con Centro 2');
    
  } catch (error) {
    console.log(`❌ Error general: ${error.message}`);
  }
}

debugCentro2Especifico();

