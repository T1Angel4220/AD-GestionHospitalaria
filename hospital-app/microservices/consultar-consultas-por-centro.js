const axios = require('axios');

async function consultarConsultasPorCentro() {
  console.log('📊 CONSULTANDO CONSULTAS POR CENTRO');
  console.log('===================================\n');
  
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
    
    // 2. Consultar consultas por centro
    console.log('📊 CONSULTANDO CONSULTAS POR CENTRO:');
    
    const centros = [
      { id: 1, nombre: 'Hospital Central Quito', ciudad: 'Quito' },
      { id: 2, nombre: 'Hospital Guayaquil', ciudad: 'Guayaquil' },
      { id: 3, nombre: 'Hospital Cuenca', ciudad: 'Cuenca' }
    ];
    
    const resultados = [];
    
    for (const centro of centros) {
      try {
        console.log(`\n🏥 Consultando Centro ${centro.id} (${centro.nombre}):`);
        
        const consultasResponse = await axios.get('http://localhost:3003/consultas', {
          headers: { ...headers, 'X-Centro-Id': centro.id.toString() }
        });
        
        const consultas = consultasResponse.data;
        console.log(`   📊 Total consultas: ${consultas.length}`);
        
        // Agrupar por estado
        const porEstado = consultas.reduce((acc, consulta) => {
          acc[consulta.estado] = (acc[consulta.estado] || 0) + 1;
          return acc;
        }, {});
        
        console.log(`   📈 Por estado:`);
        Object.entries(porEstado).forEach(([estado, cantidad]) => {
          console.log(`      ${estado}: ${cantidad}`);
        });
        
        // Mostrar últimas 3 consultas
        if (consultas.length > 0) {
          console.log(`   🔍 Últimas 3 consultas:`);
          const ultimasConsultas = consultas.slice(-3);
          ultimasConsultas.forEach((consulta, index) => {
            console.log(`      ${index + 1}. ID: ${consulta.id}, Paciente: ${consulta.paciente_nombre} ${consulta.paciente_apellido}, Estado: ${consulta.estado}, Centro: ${consulta.id_centro}`);
          });
        }
        
        resultados.push({
          centro: centro,
          total: consultas.length,
          porEstado: porEstado,
          consultas: consultas
        });
        
      } catch (error) {
        console.log(`   ❌ Error consultando centro ${centro.id}: ${error.message}`);
        resultados.push({
          centro: centro,
          total: 0,
          porEstado: {},
          consultas: [],
          error: error.message
        });
      }
    }
    
    // 3. Resumen general
    console.log('\n📊 RESUMEN GENERAL:');
    console.log('==================');
    
    let totalGeneral = 0;
    resultados.forEach(resultado => {
      console.log(`🏥 ${resultado.centro.nombre}: ${resultado.total} consultas`);
      totalGeneral += resultado.total;
    });
    
    console.log(`\n📊 TOTAL GENERAL: ${totalGeneral} consultas`);
    
    // 4. Verificar consultas con centro incorrecto
    console.log('\n🔍 VERIFICANDO CONSULTAS CON CENTRO INCORRECTO:');
    console.log('===============================================');
    
    for (const resultado of resultados) {
      if (resultado.consultas.length > 0) {
        const consultasIncorrectas = resultado.consultas.filter(consulta => 
          consulta.id_centro !== resultado.centro.id
        );
        
        if (consultasIncorrectas.length > 0) {
          console.log(`\n❌ Centro ${resultado.centro.id} tiene ${consultasIncorrectas.length} consultas con centro incorrecto:`);
          consultasIncorrectas.forEach(consulta => {
            console.log(`   ID: ${consulta.id}, Paciente: ${consulta.paciente_nombre} ${consulta.paciente_apellido}, Centro Real: ${consulta.id_centro}, Centro Esperado: ${resultado.centro.id}`);
          });
        } else {
          console.log(`✅ Centro ${resultado.centro.id}: Todas las consultas tienen el centro correcto`);
        }
      }
    }
    
    // 5. Estadísticas por estado
    console.log('\n📈 ESTADÍSTICAS POR ESTADO:');
    console.log('===========================');
    
    const estadosGenerales = {};
    resultados.forEach(resultado => {
      Object.entries(resultado.porEstado).forEach(([estado, cantidad]) => {
        estadosGenerales[estado] = (estadosGenerales[estado] || 0) + cantidad;
      });
    });
    
    Object.entries(estadosGenerales).forEach(([estado, cantidad]) => {
      console.log(`${estado}: ${cantidad}`);
    });
    
  } catch (error) {
    console.log(`❌ Error general: ${error.message}`);
  }
}

consultarConsultasPorCentro();
