const axios = require('axios');

async function testConsultaFinal() {
  console.log('🎯 PRUEBA FINAL - CREACIÓN DE CONSULTA');
  console.log('======================================\n');
  
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
    
    // 2. Obtener pacientes
    console.log('👥 2. OBTENIENDO PACIENTES:'.info);
    const pacientesResponse = await axios.get('http://localhost:3002/pacientes', { headers });
    
    const pedro = pacientesResponse.data.find(p => p.nombres.includes('Pedro') && p.apellidos.includes('Paredes'));
    console.log('   Pedro:', {
      id: pedro.id,
      nombres: pedro.nombres,
      apellidos: pedro.apellidos,
      id_centro: pedro.id_centro,
      centro_nombre: pedro.centro_nombre,
      origen_bd: pedro.origen_bd
    });
    
    // 3. Obtener médicos de Guayaquil
    console.log('\n👨‍⚕️ 3. OBTENIENDO MÉDICOS DE GUAYAQUIL:'.info);
    const medicosResponse = await axios.get('http://localhost:3003/medicos', { headers });
    const medicosGuayaquil = medicosResponse.data.filter(m => m.id_centro === 2);
    
    if (medicosGuayaquil.length === 0) {
      console.log('❌ No hay médicos en Guayaquil');
      return;
    }
    
    const medicoGuayaquil = medicosGuayaquil[0];
    console.log(`   Médico: ${medicoGuayaquil.nombres} ${medicoGuayaquil.apellidos} (ID: ${medicoGuayaquil.id}, Centro: ${medicoGuayaquil.id_centro})`);
    
    // 4. Crear consulta simulando el frontend corregido
    console.log('\n🔧 4. CREANDO CONSULTA CON LÓGICA CORREGIDA:'.info);
    
    const consultaData = {
      id_medico: medicoGuayaquil.id,
      id_paciente: pedro.id, // ID global del frontend
      paciente_nombre: pedro.nombres,
      paciente_apellido: pedro.apellidos,
      motivo: 'prueba final corregida',
      diagnostico: 'prueba final corregida',
      tratamiento: 'prueba final corregida',
      estado: 'programada',
      fecha: new Date('2024-12-01T16:00:00'),
      duracion_minutos: 30
    };
    
    // El frontend corregido enviaría el centro del paciente
    const centroIdDelPaciente = pedro.id_centro; // Debería ser 2 (Guayaquil)
    
    console.log('📤 Datos corregidos:', {
      consultaData,
      centroIdDelPaciente,
      headerXCentroId: centroIdDelPaciente
    });
    
    // 5. Crear consulta con el header correcto
    const consultaHeaders = {
      ...headers,
      'X-Centro-Id': centroIdDelPaciente.toString()
    };
    
    console.log('\n📡 5. ENVIANDO AL BACKEND:'.info);
    
    try {
      const consultaResponse = await axios.post('http://localhost:3003/consultas', consultaData, { headers: consultaHeaders });
      console.log('✅ Consulta creada exitosamente:', consultaResponse.data);
      
      // 6. Verificar resultado
      console.log('\n🔍 6. VERIFICACIÓN FINAL:'.info);
      console.log(`   ID de la consulta: ${consultaResponse.data.id}`);
      console.log(`   Centro en respuesta: ${consultaResponse.data.id_centro}`);
      
      if (consultaResponse.data.id_centro === 2) {
        console.log('✅ ÉXITO: Consulta creada en Guayaquil (Centro 2)'.success);
        console.log('✅ El frontend ahora debería mostrar "Centro: 2"'.success);
      } else {
        console.log(`❌ ERROR: Consulta creada en Centro ${consultaResponse.data.id_centro} - INCORRECTO`.error);
      }
      
    } catch (error) {
      console.log('❌ Error creando consulta:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.log(`❌ Error general: ${error.message}`);
  }
}

testConsultaFinal();

