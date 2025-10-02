const fetch = require('node-fetch');

async function debugCentro3() {
  console.log('🔍 DEBUGGING CENTRO 3 PROBLEMA');
  console.log('===============================\n');
  
  try {
    // 1. Login como admin
    console.log('🔐 Obteniendo token de admin...');
    const loginResponse = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@hospital.com',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const { token } = await loginResponse.json();
    console.log('✅ Token obtenido\n');
    
    // 2. Obtener todos los pacientes
    console.log('📊 OBTENIENDO TODOS LOS PACIENTES:');
    const pacientesResponse = await fetch('http://localhost:3000/admin/pacientes', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!pacientesResponse.ok) {
      throw new Error(`Error obteniendo pacientes: ${pacientesResponse.status}`);
    }
    
    const pacientes = await pacientesResponse.json();
    console.log(`📊 Total pacientes: ${pacientes.length}`);
    
    // Mostrar todos los pacientes
    pacientes.forEach((paciente, index) => {
      console.log(`   ${index + 1}. ID Global: ${paciente.id}, ID Original: ${paciente.id_original}, Nombre: ${paciente.nombres} ${paciente.apellidos}, Centro: ${paciente.id_centro}`);
    });
    
    // 3. Buscar pacientes del Centro 3
    console.log('\n🏥 PACIENTES DEL CENTRO 3 (Cuenca):');
    const pacientesCentro3 = pacientes.filter(p => p.id_centro === 3);
    console.log(`📊 Pacientes Centro 3: ${pacientesCentro3.length}`);
    
    pacientesCentro3.forEach((paciente, index) => {
      console.log(`   ${index + 1}. ID Global: ${paciente.id}, ID Original: ${paciente.id_original}, Nombre: ${paciente.nombres} ${paciente.apellidos}`);
    });
    
    // 4. Probar crear consulta con paciente del Centro 3
    if (pacientesCentro3.length > 0) {
      const pacienteCentro3 = pacientesCentro3[0];
      console.log(`\n🎯 PROBANDO CONSULTA CON PACIENTE CENTRO 3:`);
      console.log(`   Paciente: ${pacienteCentro3.nombres} ${pacienteCentro3.apellidos}`);
      console.log(`   ID Global: ${pacienteCentro3.id}`);
      console.log(`   ID Original: ${pacienteCentro3.id_original}`);
      console.log(`   Centro: ${pacienteCentro3.id_centro}`);
      
      const consultaData = {
        id_medico: 1,
        id_paciente: pacienteCentro3.id,
        paciente_nombre: pacienteCentro3.nombres,
        paciente_apellido: pacienteCentro3.apellidos,
        motivo: 'debug centro 3 problema',
        diagnostico: 'debug centro 3 problema',
        tratamiento: 'debug centro 3 problema',
        estado: 'pendiente',
        duracion_minutos: 0
      };
      
      console.log('\n📤 Datos de consulta:');
      console.log(JSON.stringify(consultaData, null, 2));
      
      console.log('\n📤 Headers:');
      console.log(`Authorization: Bearer ${token.substring(0, 20)}...`);
      console.log(`X-Centro-Id: ${pacienteCentro3.id_centro}`);
      
      const consultaResponse = await fetch('http://localhost:3000/consultas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Centro-Id': pacienteCentro3.id_centro.toString()
        },
        body: JSON.stringify(consultaData)
      });
      
      if (consultaResponse.ok) {
        const consultaCreada = await consultaResponse.json();
        console.log('\n✅ Consulta creada exitosamente:');
        console.log(JSON.stringify(consultaCreada, null, 2));
        
        // Verificar en qué centro se creó realmente
        console.log(`\n🔍 VERIFICANDO CENTRO REAL DE LA CONSULTA:`);
        console.log(`   ID de consulta: ${consultaCreada.id}`);
        console.log(`   Centro esperado: ${pacienteCentro3.id_centro}`);
        console.log(`   Centro real: ${consultaCreada.id_centro}`);
        
        if (consultaCreada.id_centro === pacienteCentro3.id_centro) {
          console.log('✅ ¡Centro correcto!');
        } else {
          console.log('❌ ¡Centro incorrecto!');
        }
        
      } else {
        const error = await consultaResponse.text();
        console.log(`\n❌ Error creando consulta: ${consultaResponse.status}`);
        console.log(`Error: ${error}`);
      }
    } else {
      console.log('\n❌ No hay pacientes en el Centro 3 para probar');
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

debugCentro3();
