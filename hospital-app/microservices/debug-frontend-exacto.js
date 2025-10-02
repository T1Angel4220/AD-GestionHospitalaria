const axios = require('axios');

async function debugFrontendExacto() {
  console.log('🔍 DEBUGGING FRONTEND EXACTO');
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
    
    // 2. Simular carga de datos como lo hace el frontend
    console.log('👥 2. CARGANDO DATOS COMO FRONTEND:'.info);
    
    // Cargar pacientes
    const pacientesResponse = await axios.get('http://localhost:3002/pacientes', { headers });
    const pacientes = pacientesResponse.data;
    console.log('📊 Pacientes cargados:', pacientes.length);
    
    // Cargar médicos
    const medicosResponse = await axios.get('http://localhost:3003/medicos', { headers });
    const medicos = medicosResponse.data;
    console.log('📊 Médicos cargados:', medicos.length);
    
    // 3. Simular selección de paciente (como lo haría el frontend)
    console.log('\n🔄 3. SIMULANDO SELECCIÓN DE PACIENTE:'.info);
    
    // Buscar Pedro por id_frontend (como lo hace el frontend)
    const pedroFrontend = pacientes.find(p => p.nombres.includes('Pedro') && p.apellidos.includes('Paredes'));
    console.log('🔍 Pedro encontrado por búsqueda:', {
      id: pedroFrontend.id,
      id_frontend: pedroFrontend.id_frontend,
      nombres: pedroFrontend.nombres,
      apellidos: pedroFrontend.apellidos,
      id_centro: pedroFrontend.id_centro,
      centro_nombre: pedroFrontend.centro_nombre,
      origen_bd: pedroFrontend.origen_bd
    });
    
    // Simular handlePacienteChange
    const pacienteIdFrontend = pedroFrontend.id_frontend;
    const paciente = pacientes.find(p => p.id_frontend === pacienteIdFrontend);
    
    console.log('🔍 handlePacienteChange:', {
      pacienteIdFrontend,
      pacienteEncontrado: paciente ? {
        id: paciente.id,
        id_frontend: paciente.id_frontend,
        nombres: paciente.nombres,
        apellidos: paciente.apellidos,
        id_centro: paciente.id_centro
      } : null
    });
    
    if (!paciente) {
      console.log('❌ ERROR: No se encontró el paciente con id_frontend:', pacienteIdFrontend);
      return;
    }
    
    // Simular setFormData
    const formData = {
      id_paciente: paciente.id,
      id_frontend: paciente.id_frontend,
      paciente_nombre: paciente.nombres,
      paciente_apellido: paciente.apellidos,
      id_medico: undefined
    };
    
    console.log('📝 FormData actualizado:', formData);
    
    // 4. Simular selección de médico
    console.log('\n👨‍⚕️ 4. SIMULANDO SELECCIÓN DE MÉDICO:'.info);
    
    // Filtrar médicos por centro del paciente
    const medicosDelCentro = medicos.filter(m => m.id_centro === paciente.id_centro);
    console.log(`🎯 Médicos del centro ${paciente.id_centro}:`, medicosDelCentro.length);
    
    if (medicosDelCentro.length === 0) {
      console.log('❌ No hay médicos en el centro del paciente');
      return;
    }
    
    const medicoSeleccionado = medicosDelCentro[0];
    console.log('🎯 Médico seleccionado:', {
      id: medicoSeleccionado.id,
      nombres: medicoSeleccionado.nombres,
      apellidos: medicoSeleccionado.apellidos,
      id_centro: medicoSeleccionado.id_centro
    });
    
    // 5. Simular handleSubmit
    console.log('\n🔧 5. SIMULANDO handleSubmit:'.info);
    
    const sanitizedFormData = {
      id_paciente: formData.id_paciente,
      id_medico: medicoSeleccionado.id,
      paciente_nombre: formData.paciente_nombre,
      paciente_apellido: formData.paciente_apellido,
      motivo: 'debug frontend exacto',
      diagnostico: 'debug frontend exacto',
      tratamiento: 'debug frontend exacto',
      estado: 'pendiente',
      fecha: '',
      duracion_minutos: 0
    };
    
    console.log('📤 sanitizedFormData:', sanitizedFormData);
    
    // Buscar paciente en handleSubmit (como lo hace el frontend)
    const pacienteSeleccionado = sanitizedFormData.id_paciente 
      ? pacientes.find(p => p.id === sanitizedFormData.id_paciente)
      : null;
    
    console.log('🔍 Paciente en handleSubmit:', {
      id_paciente: sanitizedFormData.id_paciente,
      pacienteEncontrado: pacienteSeleccionado ? {
        id: pacienteSeleccionado.id,
        nombres: pacienteSeleccionado.nombres,
        apellidos: pacienteSeleccionado.apellidos,
        id_centro: pacienteSeleccionado.id_centro
      } : null
    });
    
    const centroIdDelPaciente = pacienteSeleccionado?.id_centro;
    
    console.log('🎯 Centro que se enviará:', centroIdDelPaciente);
    
    if (!centroIdDelPaciente) {
      console.log('❌ ERROR: No se pudo determinar el centro del paciente');
      return;
    }
    
    // 6. Crear consulta
    const consultaData = {
      id_medico: sanitizedFormData.id_medico,
      id_paciente: sanitizedFormData.id_paciente,
      paciente_nombre: sanitizedFormData.paciente_nombre,
      paciente_apellido: sanitizedFormData.paciente_apellido,
      motivo: sanitizedFormData.motivo,
      diagnostico: sanitizedFormData.diagnostico,
      tratamiento: sanitizedFormData.tratamiento,
      estado: sanitizedFormData.estado,
      fecha: sanitizedFormData.fecha || undefined,
      duracion_minutos: sanitizedFormData.duracion_minutos
    };
    
    const consultaHeaders = {
      ...headers,
      'X-Centro-Id': centroIdDelPaciente.toString()
    };
    
    console.log('\n📡 6. ENVIANDO AL BACKEND:'.info);
    console.log('Headers:', consultaHeaders);
    console.log('Data:', consultaData);
    
    try {
      const consultaResponse = await axios.post('http://localhost:3003/consultas', consultaData, { headers: consultaHeaders });
      console.log('✅ Consulta creada exitosamente:', consultaResponse.data);
      
      // 7. Verificar resultado
      console.log('\n🔍 7. VERIFICACIÓN FINAL:'.info);
      console.log(`   ID de la consulta: ${consultaResponse.data.id}`);
      console.log(`   Centro en respuesta: ${consultaResponse.data.id_centro}`);
      
      if (consultaResponse.data.id_centro === centroIdDelPaciente) {
        console.log(`✅ ÉXITO: Consulta creada en Centro ${consultaResponse.data.id_centro} - CORRECTO`.success);
      } else {
        console.log(`❌ ERROR: Consulta creada en Centro ${consultaResponse.data.id_centro}, esperaba Centro ${centroIdDelPaciente} - INCORRECTO`.error);
      }
      
    } catch (error) {
      console.log('❌ Error creando consulta:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.log(`❌ Error general: ${error.message}`);
  }
}

debugFrontendExacto();
