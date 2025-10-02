const axios = require('axios');

async function debugFrontendCentro2() {
  console.log('🔍 DEBUGGING FRONTEND CENTRO 2');
  console.log('==============================\n');
  
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
    
    // 2. Simular exactamente lo que hace el frontend real
    console.log('👥 2. SIMULANDO FRONTEND REAL:'.info);
    
    // Cargar pacientes
    const pacientesResponse = await axios.get('http://localhost:3002/pacientes', { headers });
    const pacientes = pacientesResponse.data;
    console.log('📊 Pacientes cargados:', pacientes.length);
    
    const pedro = pacientes.find(p => p.nombres.includes('Pedro') && p.apellidos.includes('Paredes'));
    console.log('🔍 Pedro:', {
      id: pedro.id,
      id_frontend: pedro.id_frontend,
      nombres: pedro.nombres,
      apellidos: pedro.apellidos,
      id_centro: pedro.id_centro,
      centro_nombre: pedro.centro_nombre,
      origen_bd: pedro.origen_bd
    });
    
    // Cargar médicos
    const medicosResponse = await axios.get('http://localhost:3003/medicos', { headers });
    const medicos = medicosResponse.data;
    console.log('📊 Médicos cargados:', medicos.length);
    
    // Filtrar médicos de Guayaquil
    const medicosGuayaquil = medicos.filter(m => m.id_centro === 2);
    console.log(`🎯 Médicos en Guayaquil: ${medicosGuayaquil.length}`);
    
    if (medicosGuayaquil.length === 0) {
      console.log('❌ No hay médicos en Guayaquil');
      return;
    }
    
    const medicoGuayaquil = medicosGuayaquil[0];
    console.log(`🎯 Médico seleccionado: ${medicoGuayaquil.nombres} ${medicoGuayaquil.apellidos} (ID: ${medicoGuayaquil.id}, Centro: ${medicoGuayaquil.id_centro})`);
    
    // 3. Simular el problema del frontend real
    console.log('\n🔧 3. SIMULANDO PROBLEMA DEL FRONTEND:'.info);
    
    // Simular que el frontend NO está enviando el header X-Centro-Id
    const consultaData = {
      id_medico: medicoGuayaquil.id,
      id_paciente: pedro.id,
      paciente_nombre: pedro.nombres,
      paciente_apellido: pedro.apellidos,
      motivo: 'debug frontend centro 2',
      diagnostico: 'debug frontend centro 2',
      tratamiento: 'debug frontend centro 2',
      estado: 'pendiente',
      fecha: undefined,
      duracion_minutos: 0
    };
    
    // Simular que el frontend NO está enviando el header X-Centro-Id
    const consultaHeaders = {
      ...headers
      // NO incluir 'X-Centro-Id'
    };
    
    console.log('📤 Datos que enviaría el frontend problemático:', consultaData);
    console.log('📤 Headers que enviaría el frontend problemático:', consultaHeaders);
    
    try {
      const consultaResponse = await axios.post('http://localhost:3003/consultas', consultaData, { headers: consultaHeaders });
      console.log('✅ Consulta creada:', consultaResponse.data);
      
      // Verificar en qué centro se creó
      console.log('\n🔍 VERIFICACIÓN:'.info);
      console.log(`   ID de la consulta: ${consultaResponse.data.id}`);
      console.log(`   Centro en respuesta: ${consultaResponse.data.id_centro}`);
      
      if (consultaResponse.data.id_centro === 1) {
        console.log('❌ PROBLEMA CONFIRMADO: Consulta creada en Centro 1 (Quito) - INCORRECTO'.error);
        console.log('🔍 Esto explica por qué el frontend real está creando consultas en el centro incorrecto');
      } else {
        console.log(`✅ Consulta creada en Centro ${consultaResponse.data.id_centro} - CORRECTO`.success);
      }
      
    } catch (error) {
      console.log('❌ Error creando consulta:', error.response?.status, error.response?.data);
    }
    
    // 4. Probar con el header correcto
    console.log('\n🔧 4. PROBANDO CON HEADER CORRECTO:'.info);
    
    const consultaHeadersCorrectos = {
      ...headers,
      'X-Centro-Id': '2'
    };
    
    console.log('📤 Headers correctos:', consultaHeadersCorrectos);
    
    try {
      const consultaResponse2 = await axios.post('http://localhost:3003/consultas', consultaData, { headers: consultaHeadersCorrectos });
      console.log('✅ Consulta creada con header correcto:', consultaResponse2.data);
      
      console.log('\n🔍 VERIFICACIÓN FINAL:'.info);
      console.log(`   ID de la consulta: ${consultaResponse2.data.id}`);
      console.log(`   Centro en respuesta: ${consultaResponse2.data.id_centro}`);
      
      if (consultaResponse2.data.id_centro === 2) {
        console.log('✅ ÉXITO: Con header correcto, consulta creada en Centro 2 - CORRECTO'.success);
      } else {
        console.log(`❌ ERROR: Con header correcto, consulta creada en Centro ${consultaResponse2.data.id_centro} - INCORRECTO`.error);
      }
      
    } catch (error) {
      console.log('❌ Error creando consulta con header correcto:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.log(`❌ Error general: ${error.message}`);
  }
}

debugFrontendCentro2();

