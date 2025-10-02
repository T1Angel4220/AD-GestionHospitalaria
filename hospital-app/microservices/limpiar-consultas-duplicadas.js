const axios = require('axios');

async function limpiarConsultasDuplicadas() {
  console.log('🧹 LIMPIANDO CONSULTAS DUPLICADAS');
  console.log('=================================\n');
  
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
    
    // 2. Identificar y eliminar consultas duplicadas
    const centros = [
      { id: 1, nombre: 'Hospital Central Quito' },
      { id: 2, nombre: 'Hospital Guayaquil' },
      { id: 3, nombre: 'Hospital Cuenca' }
    ];
    
    for (const centro of centros) {
      console.log(`\n🏥 CENTRO ${centro.id} (${centro.nombre}):`);
      console.log('='.repeat(40));
      
      try {
        // Obtener consultas del centro
        const consultasResponse = await axios.get('http://localhost:3003/consultas', {
          headers: { ...headers, 'X-Centro-Id': centro.id.toString() }
        });
        
        const consultas = consultasResponse.data;
        console.log(`📊 Consultas antes: ${consultas.length}`);
        
        if (consultas.length <= 1) {
          console.log('✅ No hay duplicados en este centro');
          continue;
        }
        
        // Agrupar por paciente
        const consultasPorPaciente = {};
        consultas.forEach(consulta => {
          const key = `${consulta.paciente_nombre}_${consulta.paciente_apellido}`;
          if (!consultasPorPaciente[key]) {
            consultasPorPaciente[key] = [];
          }
          consultasPorPaciente[key].push(consulta);
        });
        
        // Identificar duplicados y eliminar los más antiguos
        let eliminadas = 0;
        for (const [paciente, consultasPaciente] of Object.entries(consultasPorPaciente)) {
          if (consultasPaciente.length > 1) {
            console.log(`\n   🔍 Paciente: ${paciente}`);
            console.log(`   📊 Consultas encontradas: ${consultasPaciente.length}`);
            
            // Ordenar por fecha de creación (más reciente primero)
            consultasPaciente.sort((a, b) => new Date(b.created_at || b.fecha) - new Date(a.created_at || a.fecha));
            
            // Mantener solo la más reciente
            const consultaMantener = consultasPaciente[0];
            const consultasEliminar = consultasPaciente.slice(1);
            
            console.log(`   ✅ Manteniendo consulta ID: ${consultaMantener.id} (más reciente)`);
            
            for (const consultaEliminar of consultasEliminar) {
              try {
                console.log(`   🗑️  Eliminando consulta ID: ${consultaEliminar.id}`);
                
                // Eliminar consulta
                await axios.delete(`http://localhost:3003/consultas/${consultaEliminar.id}`, {
                  headers: { ...headers, 'X-Centro-Id': centro.id.toString() }
                });
                
                eliminadas++;
                console.log(`   ✅ Consulta ${consultaEliminar.id} eliminada`);
                
              } catch (error) {
                console.log(`   ❌ Error eliminando consulta ${consultaEliminar.id}: ${error.message}`);
              }
            }
          }
        }
        
        console.log(`\n📊 Consultas eliminadas en centro ${centro.id}: ${eliminadas}`);
        
      } catch (error) {
        console.log(`❌ Error procesando centro ${centro.id}: ${error.message}`);
      }
    }
    
    // 3. Verificar resultado final
    console.log('\n📊 VERIFICACIÓN FINAL:');
    console.log('======================');
    
    for (const centro of centros) {
      try {
        const consultasResponse = await axios.get('http://localhost:3003/consultas', {
          headers: { ...headers, 'X-Centro-Id': centro.id.toString() }
        });
        
        const consultas = consultasResponse.data;
        console.log(`🏥 Centro ${centro.id}: ${consultas.length} consultas`);
        
        if (consultas.length > 0) {
          consultas.forEach(consulta => {
            console.log(`   - ${consulta.paciente_nombre} ${consulta.paciente_apellidos} (ID: ${consulta.id})`);
          });
        }
        
      } catch (error) {
        console.log(`❌ Error verificando centro ${centro.id}: ${error.message}`);
      }
    }
    
    console.log('\n✅ Limpieza de duplicados completada');
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

limpiarConsultasDuplicadas();
