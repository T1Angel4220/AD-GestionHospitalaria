const axios = require('axios');

async function verificarConsultasDetallado() {
  console.log('🔍 VERIFICACIÓN DETALLADA DE CONSULTAS');
  console.log('=====================================\n');
  
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
    
    // 2. Verificar consultas por centro con detalles completos
    const centros = [
      { id: 1, nombre: 'Hospital Central Quito', ciudad: 'Quito' },
      { id: 2, nombre: 'Hospital Guayaquil', ciudad: 'Guayaquil' },
      { id: 3, nombre: 'Hospital Cuenca', ciudad: 'Cuenca' }
    ];
    
    for (const centro of centros) {
      console.log(`\n🏥 CENTRO ${centro.id} (${centro.nombre}):`);
      console.log('='.repeat(50));
      
      try {
        const consultasResponse = await axios.get('http://localhost:3003/consultas', {
          headers: { ...headers, 'X-Centro-Id': centro.id.toString() }
        });
        
        const consultas = consultasResponse.data;
        console.log(`📊 Total consultas: ${consultas.length}`);
        
        if (consultas.length > 0) {
          console.log('\n📋 DETALLES DE CONSULTAS:');
          consultas.forEach((consulta, index) => {
            console.log(`   ${index + 1}. ID: ${consulta.id}`);
            console.log(`      Paciente: ${consulta.paciente_nombre} ${consulta.paciente_apellido}`);
            console.log(`      Médico: ${consulta.medico_nombres || 'N/A'} ${consulta.medico_apellidos || 'N/A'}`);
            console.log(`      Centro: ${consulta.id_centro}`);
            console.log(`      Estado: ${consulta.estado}`);
            console.log(`      Fecha: ${consulta.fecha}`);
            console.log(`      Creado: ${consulta.created_at || 'N/A'}`);
            console.log(`      Motivo: ${consulta.motivo}`);
            console.log('      ---');
          });
        } else {
          console.log('   No hay consultas en este centro');
        }
        
      } catch (error) {
        console.log(`   ❌ Error consultando centro ${centro.id}: ${error.message}`);
      }
    }
    
    // 3. Verificar si hay consultas duplicadas
    console.log('\n🔍 VERIFICANDO DUPLICADOS:');
    console.log('==========================');
    
    const todasLasConsultas = [];
    
    for (const centro of centros) {
      try {
        const consultasResponse = await axios.get('http://localhost:3003/consultas', {
          headers: { ...headers, 'X-Centro-Id': centro.id.toString() }
        });
        
        const consultas = consultasResponse.data;
        consultas.forEach(consulta => {
          todasLasConsultas.push({
            ...consulta,
            centroConsultado: centro.id
          });
        });
        
      } catch (error) {
        console.log(`Error obteniendo consultas del centro ${centro.id}: ${error.message}`);
      }
    }
    
    // Buscar duplicados por ID
    const idsConsultas = todasLasConsultas.map(c => c.id);
    const idsDuplicados = idsConsultas.filter((id, index) => idsConsultas.indexOf(id) !== index);
    
    if (idsDuplicados.length > 0) {
      console.log(`❌ Se encontraron consultas duplicadas: ${idsDuplicados.join(', ')}`);
      
      idsDuplicados.forEach(id => {
        const consultasDuplicadas = todasLasConsultas.filter(c => c.id === id);
        console.log(`\n   Consulta ID ${id} aparece en:`);
        consultasDuplicadas.forEach(c => {
          console.log(`      Centro ${c.centroConsultado}: ${c.paciente_nombre} ${c.paciente_apellido}`);
        });
      });
    } else {
      console.log('✅ No se encontraron consultas duplicadas');
    }
    
    // 4. Resumen final
    console.log('\n📊 RESUMEN FINAL:');
    console.log('==================');
    console.log(`Total consultas únicas: ${new Set(idsConsultas).size}`);
    console.log(`Total consultas reportadas: ${todasLasConsultas.length}`);
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

verificarConsultasDetallado();
