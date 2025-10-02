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

async function testSearchFunctionality() {
  console.log('🔍 TESTING SEARCH FUNCTIONALITY'.bold.blue);
  console.log('================================\n'.bold.blue);

  try {
    const token = await loginAdmin();
    console.log('✅ Token obtenido\n'.green);

    const headers = {
      'Authorization': `Bearer ${token}`,
      'X-Centro-Id': '3' // Centro Cuenca
    };

    console.log('📊 PROBANDO DIFERENTES BÚSQUEDAS:'.bold);
    console.log('=================================\n');

    // 1. Búsqueda por nombre de paciente
    console.log('1️⃣ BÚSQUEDA POR NOMBRE DE PACIENTE:'.cyan);
    try {
      const response1 = await axios.get(`${REPORTS_BASE_URL}/consultas/resumen?q=Monica`, { headers });
      console.log(`   📊 Resultados para "Monica": ${response1.data.length}`);
      response1.data.forEach((medico, index) => {
        console.log(`   ${index + 1}. ${medico.nombres} ${medico.apellidos}: ${medico.total_consultas} consultas`);
      });
    } catch (error) {
      console.log('   ❌ Error:', error.response?.data || error.message);
    }
    console.log('');

    // 2. Búsqueda por motivo de consulta
    console.log('2️⃣ BÚSQUEDA POR MOTIVO:'.cyan);
    try {
      const response2 = await axios.get(`${REPORTS_BASE_URL}/consultas/resumen?q=r45`, { headers });
      console.log(`   📊 Resultados para "r45": ${response2.data.length}`);
      response2.data.forEach((medico, index) => {
        console.log(`   ${index + 1}. ${medico.nombres} ${medico.apellidos}: ${medico.total_consultas} consultas`);
      });
    } catch (error) {
      console.log('   ❌ Error:', error.response?.data || error.message);
    }
    console.log('');

    // 3. Búsqueda por diagnóstico
    console.log('3️⃣ BÚSQUEDA POR DIAGNÓSTICO:'.cyan);
    try {
      const response3 = await axios.get(`${REPORTS_BASE_URL}/consultas/resumen?q=r`, { headers });
      console.log(`   📊 Resultados para "r": ${response3.data.length}`);
      response3.data.forEach((medico, index) => {
        console.log(`   ${index + 1}. ${medico.nombres} ${medico.apellidos}: ${medico.total_consultas} consultas`);
      });
    } catch (error) {
      console.log('   ❌ Error:', error.response?.data || error.message);
    }
    console.log('');

    // 4. Búsqueda por nombre de médico
    console.log('4️⃣ BÚSQUEDA POR NOMBRE DE MÉDICO:'.cyan);
    try {
      const response4 = await axios.get(`${REPORTS_BASE_URL}/consultas/resumen?q=Luis`, { headers });
      console.log(`   📊 Resultados para "Luis": ${response4.data.length}`);
      response4.data.forEach((medico, index) => {
        console.log(`   ${index + 1}. ${medico.nombres} ${medico.apellidos}: ${medico.total_consultas} consultas`);
      });
    } catch (error) {
      console.log('   ❌ Error:', error.response?.data || error.message);
    }
    console.log('');

    // 5. Búsqueda sin filtros (todos los resultados)
    console.log('5️⃣ SIN FILTROS (TODOS LOS RESULTADOS):'.cyan);
    try {
      const response5 = await axios.get(`${REPORTS_BASE_URL}/consultas/resumen`, { headers });
      console.log(`   📊 Resultados sin filtros: ${response5.data.length}`);
      response5.data.forEach((medico, index) => {
        console.log(`   ${index + 1}. ${medico.nombres} ${medico.apellidos}: ${medico.total_consultas} consultas`);
      });
    } catch (error) {
      console.log('   ❌ Error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('\n❌ Error general en el test de búsqueda:'.red.bold, error.message);
  }
}

testSearchFunctionality();
