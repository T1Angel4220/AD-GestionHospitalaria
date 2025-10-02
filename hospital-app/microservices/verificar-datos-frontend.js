const axios = require('axios');

async function verificarDatosFrontend() {
  console.log('🔍 VERIFICANDO DATOS DEL FRONTEND');
  console.log('==================================\n');
  
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
    
    // 2. Verificar datos de pacientes
    console.log('📊 VERIFICANDO DATOS DE PACIENTES:');
    const pacientesResponse = await axios.get('http://localhost:3002/pacientes', { headers });
    const pacientes = pacientesResponse.data;
    
    console.log(`📊 Total pacientes: ${pacientes.length}`);
    pacientes.forEach((paciente, index) => {
      console.log(`   ${index + 1}. ID Global: ${paciente.id}, ID Original: ${paciente.id_original}, Nombre: ${paciente.nombres} ${paciente.apellidos}, Centro: ${paciente.id_centro}`);
    });
    
    // 3. Verificar específicamente Sebastián
    console.log('\n🎯 VERIFICANDO SEBASTIÁN:');
    const sebastianTodos = pacientes.filter(p => p.nombres.includes('Sebastián'));
    console.log(`📊 Total Sebastián encontrados: ${sebastianTodos.length}`);
    
    sebastianTodos.forEach((sebastian, index) => {
      console.log(`   ${index + 1}. ID Global: ${sebastian.id}, ID Original: ${sebastian.id_original}, Nombre: ${sebastian.nombres} ${sebastian.apellidos}, Centro: ${sebastian.id_centro}`);
    });
    
    // 4. Verificar si hay algún problema con los datos
    console.log('\n🔍 VERIFICANDO PROBLEMAS POTENCIALES:');
    
    // Verificar si hay IDs duplicados
    const idsGlobales = pacientes.map(p => p.id);
    const idsDuplicados = idsGlobales.filter((id, index) => idsGlobales.indexOf(id) !== index);
    console.log(`📊 IDs globales duplicados: ${idsDuplicados.length > 0 ? idsDuplicados : 'Ninguno'}`);
    
    // Verificar si hay nombres duplicados
    const nombresCompletos = pacientes.map(p => `${p.nombres} ${p.apellidos}`);
    const nombresDuplicados = nombresCompletos.filter((nombre, index) => nombresCompletos.indexOf(nombre) !== index);
    console.log(`📊 Nombres duplicados: ${nombresDuplicados.length > 0 ? nombresDuplicados : 'Ninguno'}`);
    
    // Verificar centros
    const centros = [...new Set(pacientes.map(p => p.id_centro))];
    console.log(`📊 Centros únicos: ${centros.join(', ')}`);
    
    // 5. Verificar datos específicos de Sebastián Centro 3
    const sebastianCentro3 = pacientes.find(p => p.nombres.includes('Sebastián') && p.id_centro === 3);
    if (sebastianCentro3) {
      console.log('\n✅ Sebastián Centro 3 encontrado:');
      console.log(`   ID Global: ${sebastianCentro3.id}`);
      console.log(`   ID Original: ${sebastianCentro3.id_original}`);
      console.log(`   Nombre: ${sebastianCentro3.nombres} ${sebastianCentro3.apellidos}`);
      console.log(`   Centro: ${sebastianCentro3.id_centro}`);
      console.log(`   Centro Nombre: ${sebastianCentro3.centro_nombre || 'N/A'}`);
      console.log(`   Origen BD: ${sebastianCentro3.origen_bd || 'N/A'}`);
    } else {
      console.log('\n❌ No se encontró Sebastián del Centro 3');
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

verificarDatosFrontend();
