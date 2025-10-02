const axios = require('axios');

async function testAdminTodasConsultas() {
  console.log('🔍 TESTING ADMIN TODAS LAS CONSULTAS');
  console.log('====================================\n');
  
  try {
    // 1. Login como admin
    console.log('🔐 Obteniendo token de admin...');
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
    
    // 2. Obtener consultas SIN enviar X-Centro-Id (como debería hacer el admin)
    console.log('📊 OBTENIENDO CONSULTAS SIN X-Centro-Id (como admin):');
    try {
      const consultasResponse = await axios.get('http://localhost:3003/consultas', { headers });
      const consultas = consultasResponse.data;
      
      console.log(`📊 Total consultas obtenidas: ${consultas.length}`);
      
      if (consultas.length > 0) {
        console.log('\n📋 CONSULTAS OBTENIDAS:');
        consultas.forEach((consulta, index) => {
          console.log(`   ${index + 1}. ID: ${consulta.id}`);
          console.log(`      Paciente: ${consulta.paciente_nombre} ${consulta.paciente_apellidos}`);
          console.log(`      Centro: ${consulta.id_centro}`);
          console.log(`      Estado: ${consulta.estado}`);
          console.log(`      Fecha: ${consulta.fecha}`);
          console.log('      ---');
        });
        
        // Agrupar por centro
        const consultasPorCentro = consultas.reduce((acc, consulta) => {
          const centro = consulta.id_centro;
          if (!acc[centro]) acc[centro] = [];
          acc[centro].push(consulta);
          return acc;
        }, {});
        
        console.log('\n📊 CONSULTAS POR CENTRO:');
        Object.entries(consultasPorCentro).forEach(([centro, consultasCentro]) => {
          console.log(`   Centro ${centro}: ${consultasCentro.length} consultas`);
        });
        
      } else {
        console.log('❌ No se obtuvieron consultas');
      }
      
    } catch (error) {
      console.log('❌ Error obteniendo consultas:', error.response?.status, error.response?.data);
    }
    
    // 3. Comparar con consultas por centro individual
    console.log('\n🔍 COMPARANDO CON CONSULTAS POR CENTRO:');
    console.log('========================================');
    
    const centros = [1, 2, 3];
    let totalPorCentro = 0;
    
    for (const centro of centros) {
      try {
        const consultasResponse = await axios.get('http://localhost:3003/consultas', {
          headers: { ...headers, 'X-Centro-Id': centro.toString() }
        });
        
        const consultas = consultasResponse.data;
        console.log(`   Centro ${centro}: ${consultas.length} consultas`);
        totalPorCentro += consultas.length;
        
      } catch (error) {
        console.log(`   Centro ${centro}: Error - ${error.message}`);
      }
    }
    
    console.log(`\n📊 Total por centro individual: ${totalPorCentro}`);
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

testAdminTodasConsultas();
