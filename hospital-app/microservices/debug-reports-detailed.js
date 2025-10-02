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

async function debugReportsDetailed() {
  console.log('🔍 DEBUG REPORTS DETAILED'.bold.blue);
  console.log('==========================\n'.bold.blue);

  try {
    const token = await loginAdmin();
    console.log('✅ Token obtenido\n'.green);

    console.log('📊 PROBANDO DETALLE DE CONSULTAS CON DEBUG DETALLADO:'.bold);
    console.log('====================================================\n');

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
      
      // Mostrar el objeto completo de la primera consulta
      if (detalleResponse.data.length > 0) {
        console.log('\n🔍 OBJETO COMPLETO DE LA PRIMERA CONSULTA:'.yellow);
        console.log(JSON.stringify(detalleResponse.data[0], null, 2));
      }
      
    } catch (error) {
      console.log('   ❌ Error obteniendo detalle:', error.response?.data || error.message);
    }
    console.log('');

  } catch (error) {
    console.error('\n❌ Error general en el debug detallado de reportes:'.red.bold, error.message);
  }
}

debugReportsDetailed();
