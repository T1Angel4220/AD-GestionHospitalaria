const axios = require('axios');

async function debugConsultaFrontend() {
  console.log('🔍 DEBUGGING CONSULTA DESDE FRONTEND');
  console.log('====================================\n');
  
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
    
    // 3. Obtener médicos
    console.log('\n👨‍⚕️ 3. OBTENIENDO MÉDICOS:'.info);
    const medicosResponse = await axios.get('http://localhost:3003/medicos', { headers });
    
    // Filtrar médicos de Guayaquil (Centro 2)
    const medicosGuayaquil = medicosResponse.data.filter(m => m.id_centro === 2);
    console.log(`   Médicos en Guayaquil: ${medicosGuayaquil.length}`);
    
    if (medicosGuayaquil.length === 0) {
      console.log('❌ No hay médicos en Guayaquil');
      return;
    }
    
    const medicoGuayaquil = medicosGuayaquil[0];
    console.log(`   Médico: ${medicoGuayaquil.nombres} ${medicoGuayaquil.apellidos} (ID: ${medicoGuayaquil.id}, Centro: ${medicoGuayaquil.id_centro})`);
    
    // 4. Simular exactamente lo que hace el frontend corregido
    console.log('\n🔧 4. SIMULANDO FRONTEND CORREGIDO:'.info);
    
    const consultaData = {
      id_medico: medicoGuayaquil.id,
      id_paciente: pedro.id, // ID global del frontend
      paciente_nombre: pedro.nombres,
      paciente_apellido: pedro.apellidos,
      motivo: 'debug frontend corregido',
      diagnostico: 'debug frontend corregido',
      tratamiento: 'debug frontend corregido',
      estado: 'programada',
      fecha: new Date('2024-12-01T16:00:00'),
      duracion_minutos: 30
    };
    
    // El frontend corregido debería enviar el centro del paciente
    const centroIdDelPaciente = pedro.id_centro; // Debería ser 2 (Guayaquil)
    
    console.log('📤 Datos del frontend corregido:', {
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
    console.log('Headers:', consultaHeaders);
    
    try {
      const consultaResponse = await axios.post('http://localhost:3003/consultas', consultaData, { headers: consultaHeaders });
      console.log('✅ Consulta creada exitosamente:', consultaResponse.data);
      
      // 6. Verificar resultado
      console.log('\n🔍 6. VERIFICACIÓN FINAL:'.info);
      console.log(`   ID de la consulta: ${consultaResponse.data.id}`);
      console.log(`   Centro en respuesta: ${consultaResponse.data.id_centro}`);
      
      if (consultaResponse.data.id_centro === 2) {
        console.log('✅ ÉXITO: Consulta creada en Guayaquil (Centro 2)'.success);
      } else {
        console.log(`❌ ERROR: Consulta creada en Centro ${consultaResponse.data.id_centro} - INCORRECTO`.error);
        console.log('🔍 Esto indica que el backend no está procesando correctamente el header X-Centro-Id');
      }
      
    } catch (error) {
      console.log('❌ Error creando consulta:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.log(`❌ Error general: ${error.message}`);
  }
}

debugConsultaFrontend();

