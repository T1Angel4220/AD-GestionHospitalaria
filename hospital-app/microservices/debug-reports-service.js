const axios = require('axios');
require('colors');

const ADMIN_LOGIN_URL = 'http://localhost:3001/login';
const REPORTS_BASE_URL = 'http://localhost:3005';

async function loginAdmin() {
  try {
    const response = await axios.post(ADMIN_LOGIN_URL, {
      email: 'admin@hospital.com',
      password: 'password',
    });
    return response.data.token;
  } catch (error) {
    console.error('Error al iniciar sesión como admin:', error.message);
    throw error;
  }
}

async function debugReportsService() {
  console.log('🔍 DEBUG REPORTS SERVICE'.bold.blue);
  console.log('========================\n'.bold.blue);

  try {
    const token = await loginAdmin();
    console.log('✅ Token obtenido\n'.green);

    console.log('📊 PROBANDO DIFERENTES ENDPOINTS DE REPORTES:'.bold);
    console.log('=============================================\n');

    // 1. Probar estadísticas generales
    console.log('1️⃣ ESTADÍSTICAS GENERALES:'.cyan);
    try {
      const statsResponse = await axios.get(`${REPORTS_BASE_URL}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Centro-Id': '3' // Centro Cuenca
        }
      });
      console.log('   ✅ Stats obtenidas:');
      console.log(`   📊 Total consultas: ${statsResponse.data.total_consultas}`);
      console.log(`   📊 Total médicos: ${statsResponse.data.total_medicos}`);
      console.log(`   📊 Total pacientes: ${statsResponse.data.total_pacientes}`);
    } catch (error) {
      console.log('   ❌ Error obteniendo stats:', error.response?.data || error.message);
    }
    console.log('');

    // 2. Probar resumen de consultas
    console.log('2️⃣ RESUMEN DE CONSULTAS:'.cyan);
    try {
      const resumenResponse = await axios.get(`${REPORTS_BASE_URL}/consultas/resumen`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Centro-Id': '3' // Centro Cuenca
        }
      });
      console.log('   ✅ Resumen obtenido:');
      console.log(`   📊 Total médicos en resumen: ${resumenResponse.data.length}`);
      resumenResponse.data.forEach((medico, index) => {
        console.log(`   ${index + 1}. ${medico.nombres} ${medico.apellidos}: ${medico.total_consultas} consultas`);
      });
    } catch (error) {
      console.log('   ❌ Error obteniendo resumen:', error.response?.data || error.message);
    }
    console.log('');

    // 3. Probar detalle de consultas para médico específico
    console.log('3️⃣ DETALLE DE CONSULTAS POR MÉDICO:'.cyan);
    try {
      const detalleResponse = await axios.get(`${REPORTS_BASE_URL}/consultas/medico/1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Centro-Id': '3' // Centro Cuenca
        }
      });
      console.log('   ✅ Detalle obtenido:');
      console.log(`   📊 Total consultas en detalle: ${detalleResponse.data.length}`);
      detalleResponse.data.forEach((consulta, index) => {
        console.log(`   ${index + 1}. ID: ${consulta.id}, Paciente: ${consulta.paciente_nombres} ${consulta.paciente_apellidos}, Estado: ${consulta.estado}`);
      });
    } catch (error) {
      console.log('   ❌ Error obteniendo detalle:', error.response?.data || error.message);
    }
    console.log('');

    // 4. Probar sin X-Centro-Id (como admin)
    console.log('4️⃣ SIN X-Centro-Id (ADMIN):'.cyan);
    try {
      const adminResponse = await axios.get(`${REPORTS_BASE_URL}/consultas/resumen`, {
        headers: {
          'Authorization': `Bearer ${token}`
          // No enviar X-Centro-Id
        }
      });
      console.log('   ✅ Resumen admin obtenido:');
      console.log(`   📊 Total médicos en resumen admin: ${adminResponse.data.length}`);
      adminResponse.data.forEach((medico, index) => {
        console.log(`   ${index + 1}. ${medico.nombres} ${medico.apellidos}: ${medico.total_consultas} consultas`);
      });
    } catch (error) {
      console.log('   ❌ Error obteniendo resumen admin:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('\n❌ Error general en el debug del servicio de reportes:'.red.bold, error.message);
  }
}

debugReportsService();
