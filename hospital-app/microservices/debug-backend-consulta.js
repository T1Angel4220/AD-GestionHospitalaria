const axios = require('axios');

async function debugBackendConsulta() {
  console.log('🔍 DEBUGGING BACKEND CONSULTA');
  console.log('=============================\n');
  
  try {
    // 1. Login como admin
    console.log('🔐 1. LOGIN COMO ADMIN:'.info);
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
    console.log('👥 2. VERIFICANDO DATOS DE PACIENTES:'.info);
    
    const pacientesResponse = await axios.get('http://localhost:3002/pacientes', { headers });
    const pacientes = pacientesResponse.data;
    console.log('📊 Pacientes cargados:', pacientes.length);
    
    pacientes.forEach(p => {
      console.log(`   ID Global: ${p.id}, ID Original: ${p.id_original}, Nombre: ${p.nombres} ${p.apellidos}, Centro: ${p.id_centro}`);
    });
    
    // 3. Probar creación de consulta para Centro 1 (Diego Xavier)
    console.log('\n🔧 3. PROBANDO CONSULTA CENTRO 1:'.info);
    
    const diego = pacientes.find(p => p.nombres.includes('Diego') && p.apellidos.includes('Ortiz'));
    if (!diego) {
      console.log('❌ No se encontró a Diego Xavier');
      return;
    }
    
    console.log('🎯 Diego Xavier:', {
      id: diego.id,
      id_original: diego.id_original,
      nombres: diego.nombres,
      apellidos: diego.apellidos,
      id_centro: diego.id_centro
    });
    
    const consultaData = {
      id_medico: 1, // Asumiendo que hay un médico en centro 1
      id_paciente: diego.id, // ID global
      paciente_nombre: diego.nombres,
      paciente_apellido: diego.apellidos,
      motivo: 'debug backend consulta',
      diagnostico: 'debug backend consulta',
      tratamiento: 'debug backend consulta',
      estado: 'pendiente',
      fecha: undefined,
      duracion_minutos: 0
    };
    
    const consultaHeaders = {
      ...headers,
      'X-Centro-Id': diego.id_centro.toString()
    };
    
    console.log('📤 Datos:', consultaData);
    console.log('📤 Headers:', consultaHeaders);
    
    try {
      const consultaResponse = await axios.post('http://localhost:3003/consultas', consultaData, { headers: consultaHeaders });
      console.log('✅ Consulta Centro 1 creada:', consultaResponse.data);
    } catch (error) {
      console.log('❌ Error creando consulta Centro 1:', error.response?.status, error.response?.data);
    }
    
    // 4. Probar creación de consulta para Centro 3 (Sebastián)
    console.log('\n🔧 4. PROBANDO CONSULTA CENTRO 3:'.info);
    
    const sebastian = pacientes.find(p => p.nombres.includes('Sebastián') && p.apellidos.includes('Ortiz'));
    if (!sebastian) {
      console.log('❌ No se encontró a Sebastián');
      return;
    }
    
    console.log('🎯 Sebastián:', {
      id: sebastian.id,
      id_original: sebastian.id_original,
      nombres: sebastian.nombres,
      apellidos: sebastian.apellidos,
      id_centro: sebastian.id_centro
    });
    
    const consultaData3 = {
      id_medico: 1, // Asumiendo que hay un médico en centro 3
      id_paciente: sebastian.id, // ID global
      paciente_nombre: sebastian.nombres,
      paciente_apellido: sebastian.apellidos,
      motivo: 'debug backend consulta centro 3',
      diagnostico: 'debug backend consulta centro 3',
      tratamiento: 'debug backend consulta centro 3',
      estado: 'pendiente',
      fecha: undefined,
      duracion_minutos: 0
    };
    
    const consultaHeaders3 = {
      ...headers,
      'X-Centro-Id': sebastian.id_centro.toString()
    };
    
    console.log('📤 Datos Centro 3:', consultaData3);
    console.log('📤 Headers Centro 3:', consultaHeaders3);
    
    try {
      const consultaResponse3 = await axios.post('http://localhost:3003/consultas', consultaData3, { headers: consultaHeaders3 });
      console.log('✅ Consulta Centro 3 creada:', consultaResponse3.data);
    } catch (error) {
      console.log('❌ Error creando consulta Centro 3:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.log(`❌ Error general: ${error.message}`);
  }
}

debugBackendConsulta();

