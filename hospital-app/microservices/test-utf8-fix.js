const axios = require('axios');

// URLs de los microservicios
const services = {
  auth: 'http://localhost:3001',
  admin: 'http://localhost:3002',
  users: 'http://localhost:3004',
  consultas: 'http://localhost:3003'
};

async function testUTF8Fix() {
  console.log('🔧 PROBANDO CORRECCIÓN DE CODIFICACIÓN UTF-8');
  console.log('============================================\n');
  
  try {
    // Primero hacer login para obtener token
    console.log('🔐 Obteniendo token de autenticación...');
    const loginResponse = await axios.post(`${services.auth}/login`, {
      email: 'medico@hospital.com',
      password: 'medico123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Token obtenido exitosamente\n');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8'
    };
    
    // Probar obtener médicos (donde deberían aparecer nombres con acentos)
    console.log('👨‍⚕️ Probando obtención de médicos...');
    try {
      const medicosResponse = await axios.get(`${services.admin}/medicos`, { headers });
      console.log('✅ Médicos obtenidos exitosamente');
      
      if (medicosResponse.data && medicosResponse.data.length > 0) {
        console.log('\n📋 Lista de médicos:');
        medicosResponse.data.forEach((medico, index) => {
          console.log(`   ${index + 1}. ${medico.nombres} ${medico.apellidos} - ${medico.especialidad || 'Sin especialidad'}`);
        });
      } else {
        console.log('📝 No hay médicos registrados');
      }
    } catch (error) {
      console.log(`❌ Error obteniendo médicos: ${error.response?.status || error.message}`);
    }
    
    // Probar obtener consultas (donde deberían aparecer diagnósticos con acentos)
    console.log('\n🏥 Probando obtención de consultas...');
    try {
      const consultasResponse = await axios.get(`${services.consultas}/consultas`, { headers });
      console.log('✅ Consultas obtenidas exitosamente');
      
      if (consultasResponse.data && consultasResponse.data.length > 0) {
        console.log('\n📋 Lista de consultas:');
        consultasResponse.data.forEach((consulta, index) => {
          console.log(`   ${index + 1}. Diagnóstico: ${consulta.diagnostico || 'Sin diagnóstico'}`);
          console.log(`      Tratamiento: ${consulta.tratamiento || 'Sin tratamiento'}`);
          console.log(`      Médico: ${consulta.medico_nombres || 'N/A'} ${consulta.medico_apellidos || 'N/A'}`);
        });
      } else {
        console.log('📝 No hay consultas registradas');
      }
    } catch (error) {
      console.log(`❌ Error obteniendo consultas: ${error.response?.status || error.message}`);
    }
    
    // Probar crear una consulta con caracteres especiales
    console.log('\n➕ Probando creación de consulta con caracteres especiales...');
    try {
      const nuevaConsulta = {
        id_paciente: 1,
        id_medico: 1,
        fecha: '2025-01-10',
        hora: '10:00',
        motivo: 'Dolor de cabeza y náuseas',
        diagnostico: 'Migraña con aura',
        tratamiento: 'Reposo y medicación para el dolor',
        estado: 'completada'
      };
      
      const createResponse = await axios.post(`${services.consultas}/consultas`, nuevaConsulta, { headers });
      console.log('✅ Consulta creada exitosamente con caracteres especiales');
      console.log(`   Diagnóstico: ${createResponse.data.diagnostico}`);
      console.log(`   Tratamiento: ${createResponse.data.tratamiento}`);
    } catch (error) {
      console.log(`❌ Error creando consulta: ${error.response?.status || error.message}`);
      if (error.response?.data) {
        console.log(`   Detalles: ${JSON.stringify(error.response.data)}`);
      }
    }
    
    console.log('\n🎉 PRUEBA DE CODIFICACIÓN COMPLETADA');
    console.log('=====================================');
    console.log('✅ Si ves caracteres como é, ñ, á, etc. correctamente, la corrección funcionó');
    console.log('❌ Si ves caracteres como Ã©, Ã±, Ã¡, etc., aún hay problemas de codificación');
    
  } catch (error) {
    console.log(`❌ Error general: ${error.message}`);
  }
}

testUTF8Fix();
