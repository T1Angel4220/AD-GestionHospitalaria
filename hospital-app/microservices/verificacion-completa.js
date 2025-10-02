const axios = require('axios');

async function verificacionCompleta() {
  console.log('🔍 VERIFICACIÓN COMPLETA DEL SISTEMA');
  console.log('===================================\n');
  
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
    
    // 2. Verificar datos base
    console.log('👥 2. VERIFICANDO DATOS BASE:'.info);
    
    // Cargar pacientes
    const pacientesResponse = await axios.get('http://localhost:3002/pacientes', { headers });
    const pacientes = pacientesResponse.data;
    console.log('📊 Pacientes cargados:', pacientes.length);
    
    const pedro = pacientes.find(p => p.nombres.includes('Pedro') && p.apellidos.includes('Paredes'));
    console.log('🔍 Pedro:', {
      id: pedro.id,
      id_frontend: pedro.id_frontend,
      nombres: pedro.nombres,
      apellidos: pedro.apellidos,
      id_centro: pedro.id_centro,
      centro_nombre: pedro.centro_nombre,
      origen_bd: pedro.origen_bd
    });
    
    // Cargar médicos
    const medicosResponse = await axios.get('http://localhost:3003/medicos', { headers });
    const medicos = medicosResponse.data;
    console.log('📊 Médicos cargados:', medicos.length);
    
    const medicosGuayaquil = medicos.filter(m => m.id_centro === 2);
    console.log(`🎯 Médicos en Guayaquil (Centro 2): ${medicosGuayaquil.length}`);
    medicosGuayaquil.forEach(m => {
      console.log(`   ID: ${m.id}, Nombre: ${m.nombres} ${m.apellidos}, Centro: ${m.id_centro}`);
    });
    
    if (medicosGuayaquil.length === 0) {
      console.log('❌ No hay médicos en Guayaquil');
      return;
    }
    
    const medicoGuayaquil = medicosGuayaquil[0];
    console.log(`🎯 Médico seleccionado: ${medicoGuayaquil.nombres} ${medicoGuayaquil.apellidos} (ID: ${medicoGuayaquil.id}, Centro: ${medicoGuayaquil.id_centro})`);
    
    // 3. Simular exactamente lo que hace el frontend
    console.log('\n🔄 3. SIMULANDO FRONTEND COMPLETO:'.info);
    
    // Simular handlePacienteChange
    const pacienteIdFrontend = pedro.id_frontend;
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
      console.log('❌ ERROR: No se encontró el paciente');
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
    
    // Simular handleMedicoChange
    const medico = medicos.find(m => m.id === medicoGuayaquil.id);
    console.log('🔍 handleMedicoChange:', {
      medicoId: medicoGuayaquil.id,
      medicoEncontrado: medico ? {
        id: medico.id,
        nombres: medico.nombres,
        apellidos: medico.apellidos,
        id_centro: medico.id_centro,
        centro_nombre: medico.centro_nombre
      } : null
    });
    
    // Simular handleSubmit
    console.log('\n🔧 4. SIMULANDO handleSubmit:'.info);
    
    const sanitizedFormData = {
      id_paciente: formData.id_paciente,
      id_medico: medicoGuayaquil.id,
      paciente_nombre: formData.paciente_nombre,
      paciente_apellido: formData.paciente_apellido,
      motivo: 'verificación completa',
      diagnostico: 'verificación completa',
      tratamiento: 'verificación completa',
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
        id_centro: pacienteSeleccionado.id_centro,
        centro_nombre: pacienteSeleccionado.centro_nombre,
        origen_bd: pacienteSeleccionado.origen_bd
      } : null
    });
    
    const centroIdDelPaciente = pacienteSeleccionado?.id_centro;
    
    console.log('🎯 Centro que se enviará:', centroIdDelPaciente);
    
    if (!centroIdDelPaciente) {
      console.log('❌ ERROR: No se pudo determinar el centro del paciente');
      return;
    }
    
    // 5. Crear consulta
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
    
    console.log('\n📡 5. ENVIANDO AL BACKEND:'.info);
    console.log('Headers:', consultaHeaders);
    console.log('Data:', consultaData);
    
    try {
      const consultaResponse = await axios.post('http://localhost:3003/consultas', consultaData, { headers: consultaHeaders });
      console.log('✅ Consulta creada exitosamente:', consultaResponse.data);
      
      // 6. Verificar resultado
      console.log('\n🔍 6. VERIFICACIÓN FINAL:'.info);
      console.log(`   ID de la consulta: ${consultaResponse.data.id}`);
      console.log(`   Centro en respuesta: ${consultaResponse.data.id_centro}`);
      
      if (consultaResponse.data.id_centro === centroIdDelPaciente) {
        console.log(`✅ ÉXITO: Consulta creada en Centro ${consultaResponse.data.id_centro} - CORRECTO`.success);
      } else {
        console.log(`❌ ERROR: Consulta creada en Centro ${consultaResponse.data.id_centro}, esperaba Centro ${centroIdDelPaciente} - INCORRECTO`.error);
      }
      
      // 7. Verificar en qué base de datos se creó
      console.log('\n🔍 7. VERIFICANDO EN BASES DE DATOS:'.info);
      
      // Verificar en Guayaquil
      try {
        const guayaquilResponse = await axios.get('http://localhost:3003/consultas', { 
          headers: { ...headers, 'X-Centro-Id': '2' }
        });
        const consultasGuayaquil = guayaquilResponse.data.filter(c => c.paciente_nombre.includes('Pedro'));
        console.log(`📊 Consultas de Pedro en Guayaquil: ${consultasGuayaquil.length}`);
        consultasGuayaquil.forEach(c => {
          console.log(`   ID: ${c.id}, Centro: ${c.id_centro}, Fecha: ${c.fecha}`);
        });
      } catch (error) {
        console.log('❌ Error verificando Guayaquil:', error.message);
      }
      
      // Verificar en Quito
      try {
        const quitoResponse = await axios.get('http://localhost:3003/consultas', { 
          headers: { ...headers, 'X-Centro-Id': '1' }
        });
        const consultasQuito = quitoResponse.data.filter(c => c.paciente_nombre.includes('Pedro'));
        console.log(`📊 Consultas de Pedro en Quito: ${consultasQuito.length}`);
        consultasQuito.forEach(c => {
          console.log(`   ID: ${c.id}, Centro: ${c.id_centro}, Fecha: ${c.fecha}`);
        });
      } catch (error) {
        console.log('❌ Error verificando Quito:', error.message);
      }
      
    } catch (error) {
      console.log('❌ Error creando consulta:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.log(`❌ Error general: ${error.message}`);
  }
}

verificacionCompleta();

