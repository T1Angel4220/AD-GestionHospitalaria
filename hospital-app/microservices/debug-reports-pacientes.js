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

async function debugReportsPacientes() {
  console.log('🔍 DEBUG REPORTS PACIENTES'.bold.blue);
  console.log('==========================\n'.bold.blue);

  try {
    const token = await loginAdmin();
    console.log('✅ Token obtenido\n'.green);

    console.log('📊 PROBANDO DETALLE DE CONSULTAS CON PACIENTES:'.bold);
    console.log('==============================================\n');

    // Probar detalle de consultas para médico específico
    console.log('🔍 DETALLE DE CONSULTAS PARA MÉDICO ID: 1:'.cyan);
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
        console.log(`   ${index + 1}. ID: ${consulta.id}`);
        console.log(`      Paciente: "${consulta.paciente_nombres} ${consulta.paciente_apellidos}"`);
        console.log(`      Cédula: ${consulta.paciente_cedula}`);
        console.log(`      Motivo: ${consulta.motivo}`);
        console.log(`      Diagnóstico: ${consulta.diagnostico}`);
        console.log(`      Estado: ${consulta.estado}`);
        console.log(`      Fecha: ${consulta.fecha}`);
        console.log('      ---');
      });
    } catch (error) {
      console.log('   ❌ Error obteniendo detalle:', error.response?.data || error.message);
    }
    console.log('');

    // Probar sin X-Centro-Id (como admin)
    console.log('🔍 DETALLE DE CONSULTAS SIN X-Centro-Id (ADMIN):'.cyan);
    try {
      const adminResponse = await axios.get(`${REPORTS_BASE_URL}/consultas/medico/1`, {
        headers: {
          'Authorization': `Bearer ${token}`
          // No enviar X-Centro-Id
        }
      });
      console.log('   ✅ Detalle admin obtenido:');
      console.log(`   📊 Total consultas en detalle admin: ${adminResponse.data.length}`);
      adminResponse.data.forEach((consulta, index) => {
        console.log(`   ${index + 1}. ID: ${consulta.id}`);
        console.log(`      Paciente: "${consulta.paciente_nombres} ${consulta.paciente_apellidos}"`);
        console.log(`      Cédula: ${consulta.paciente_cedula}`);
        console.log(`      Motivo: ${consulta.motivo}`);
        console.log(`      Diagnóstico: ${consulta.diagnostico}`);
        console.log(`      Estado: ${consulta.estado}`);
        console.log(`      Fecha: ${consulta.fecha}`);
        console.log('      ---');
      });
    } catch (error) {
      console.log('   ❌ Error obteniendo detalle admin:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('\n❌ Error general en el debug de reportes pacientes:'.red.bold, error.message);
  }
}

debugReportsPacientes();
