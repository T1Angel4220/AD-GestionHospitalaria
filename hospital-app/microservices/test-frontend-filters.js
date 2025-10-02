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

async function testFrontendFilters() {
  console.log('🔍 TESTING FRONTEND FILTERS'.bold.blue);
  console.log('==========================\n'.bold.blue);

  try {
    const token = await loginAdmin();
    console.log('✅ Token obtenido\n'.green);

    const headers = {
      'Authorization': `Bearer ${token}`,
      'X-Centro-Id': '3' // Centro Cuenca
    };

    console.log('📊 PROBANDO FILTROS COMO FRONTEND:'.bold);
    console.log('==================================\n');

    // 1. Sin filtros
    console.log('1️⃣ SIN FILTROS:'.cyan);
    try {
      const [resumenResponse, statsResponse] = await Promise.all([
        axios.get(`${REPORTS_BASE_URL}/consultas/resumen`, { headers }),
        axios.get(`${REPORTS_BASE_URL}/estadisticas`, { headers })
      ]);
      
      console.log(`   📊 Resumen: ${resumenResponse.data.length} médicos`);
      console.log(`   📊 Stats: ${statsResponse.data.total_consultas} consultas`);
      
      const totalConsultasResumen = resumenResponse.data.reduce((sum, medico) => sum + medico.total_consultas, 0);
      console.log(`   📊 Total consultas del resumen: ${totalConsultasResumen}`);
      
      if (statsResponse.data.total_consultas === totalConsultasResumen) {
        console.log('   ✅ Consistencia correcta');
      } else {
        console.log('   ❌ Inconsistencia detectada');
      }
    } catch (error) {
      console.log('   ❌ Error:', error.response?.data || error.message);
    }
    console.log('');

    // 2. Con filtro de búsqueda "h" (como frontend)
    console.log('2️⃣ CON FILTRO "h" (COMO FRONTEND):'.cyan);
    try {
      const [resumenResponse, statsResponse] = await Promise.all([
        axios.get(`${REPORTS_BASE_URL}/consultas/resumen?q=h`, { headers }),
        axios.get(`${REPORTS_BASE_URL}/estadisticas?q=h`, { headers })
      ]);
      
      console.log(`   📊 Resumen: ${resumenResponse.data.length} médicos`);
      console.log(`   📊 Stats: ${statsResponse.data.total_consultas} consultas`);
      
      const totalConsultasResumen = resumenResponse.data.reduce((sum, medico) => sum + medico.total_consultas, 0);
      console.log(`   📊 Total consultas del resumen: ${totalConsultasResumen}`);
      
      if (statsResponse.data.total_consultas === totalConsultasResumen) {
        console.log('   ✅ Consistencia correcta');
      } else {
        console.log('   ❌ Inconsistencia detectada');
      }
    } catch (error) {
      console.log('   ❌ Error:', error.response?.data || error.message);
    }
    console.log('');

    // 3. Con filtro de búsqueda "Monica" (como frontend)
    console.log('3️⃣ CON FILTRO "Monica" (COMO FRONTEND):'.cyan);
    try {
      const [resumenResponse, statsResponse] = await Promise.all([
        axios.get(`${REPORTS_BASE_URL}/consultas/resumen?q=Monica`, { headers }),
        axios.get(`${REPORTS_BASE_URL}/estadisticas?q=Monica`, { headers })
      ]);
      
      console.log(`   📊 Resumen: ${resumenResponse.data.length} médicos`);
      console.log(`   📊 Stats: ${statsResponse.data.total_consultas} consultas`);
      
      const totalConsultasResumen = resumenResponse.data.reduce((sum, medico) => sum + medico.total_consultas, 0);
      console.log(`   📊 Total consultas del resumen: ${totalConsultasResumen}`);
      
      if (statsResponse.data.total_consultas === totalConsultasResumen) {
        console.log('   ✅ Consistencia correcta');
      } else {
        console.log('   ❌ Inconsistencia detectada');
      }
    } catch (error) {
      console.log('   ❌ Error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('\n❌ Error general en el test de filtros frontend:'.red.bold, error.message);
  }
}

testFrontendFilters();
