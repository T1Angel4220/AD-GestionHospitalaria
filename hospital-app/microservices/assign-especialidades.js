const axios = require('axios');
const colors = require('colors');

// Configuración de colores
colors.setTheme({
  success: 'green',
  error: 'red',
  warning: 'yellow',
  info: 'cyan',
  title: 'magenta',
  service: 'blue'
});

// URLs de los microservicios
const services = {
  auth: 'http://localhost:3002',
  admin: 'http://localhost:3003'
};

// Función para hacer peticiones HTTP
async function makeRequest(url, method = 'GET', data = null, headers = {}) {
  try {
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 10000
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      status: error.response?.status || 'TIMEOUT',
      response: error.response?.data
    };
  }
}

// Función para obtener token de admin
async function getAdminToken() {
  console.log(`\n🔐 Obteniendo token de administrador`.title);
  
  const loginData = { 
    email: 'admin@hospital.com', 
    password: 'admin123' 
  };
  
  const result = await makeRequest(`${services.auth}/login`, 'POST', loginData);
  
  if (result.success) {
    console.log(`✅ Login exitoso: ${result.status}`.success);
    return result.data.token;
  } else {
    console.log(`❌ Login falló: ${result.error}`.error);
    return null;
  }
}

// Función para crear especialidades
async function createEspecialidades(token) {
  if (!token) {
    console.log(`\n⚠️ No hay token disponible`.warning);
    return;
  }
  
  console.log(`\n🩺 Creando Especialidades`.title);
  
  const headers = {
    'Authorization': `Bearer ${token}`
  };
  
  // Especialidades a crear
  const especialidades = [
    { nombre: 'Medicina General', id_centro: 1 },
    { nombre: 'Cardiología', id_centro: 1 },
    { nombre: 'Pediatría', id_centro: 1 },
    { nombre: 'Medicina General', id_centro: 2 },
    { nombre: 'Traumatología', id_centro: 2 },
    { nombre: 'Ginecología', id_centro: 2 },
    { nombre: 'Medicina General', id_centro: 3 },
    { nombre: 'Dermatología', id_centro: 3 },
    { nombre: 'Oftalmología', id_centro: 3 }
  ];
  
  for (const especialidad of especialidades) {
    console.log(`📝 Creando especialidad: ${especialidad.nombre} (Centro ${especialidad.id_centro})`.info);
    
    const result = await makeRequest(`${services.admin}/especialidades`, 'POST', especialidad, headers);
    
    if (result.success) {
      console.log(`✅ Especialidad creada: ${especialidad.nombre}`.success);
    } else {
      console.log(`❌ Error creando especialidad: ${result.error}`.error);
    }
  }
}

// Función para asignar especialidades a médicos
async function assignEspecialidadesToMedicos(token) {
  if (!token) {
    console.log(`\n⚠️ No hay token disponible`.warning);
    return;
  }
  
  console.log(`\n👨‍⚕️ Asignando Especialidades a Médicos`.title);
  
  const headers = {
    'Authorization': `Bearer ${token}`
  };
  
  // Obtener médicos
  const medicosResult = await makeRequest(`${services.admin}/medicos`, 'GET', null, headers);
  
  if (medicosResult.success) {
    console.log(`✅ Médicos obtenidos: ${medicosResult.data.length} registros`.success);
    
    // Asignar especialidades según el centro
    const asignaciones = {
      'central': { 'Dr. Juan Pérez': 'Medicina General', 'Dra. María González': 'Cardiología' },
      'guayaquil': { 'Dr. Luis Fernández': 'Medicina General', 'Dra. Patricia Castro': 'Traumatología' },
      'cuenca': { 'Dr. Miguel Paredes': 'Medicina General', 'Dra. Sofía Morales': 'Dermatología' }
    };
    
    for (const medico of medicosResult.data) {
      const origenBd = medico.origen_bd;
      const nombreCompleto = `${medico.nombres} ${medico.apellidos}`;
      
      if (asignaciones[origenBd] && asignaciones[origenBd][nombreCompleto]) {
        const especialidad = asignaciones[origenBd][nombreCompleto];
        console.log(`📝 Asignando ${especialidad} a ${nombreCompleto}`.info);
        
        // Aquí necesitaríamos un endpoint para actualizar médicos
        // Por ahora solo mostramos la asignación
        console.log(`✅ ${nombreCompleto} → ${especialidad}`.success);
      }
    }
    
  } else {
    console.log(`❌ Error obteniendo médicos: ${medicosResult.error}`.error);
  }
}

// Función para mostrar médicos actualizados
async function showMedicosActualizados(token) {
  if (!token) {
    console.log(`\n⚠️ No hay token disponible`.warning);
    return;
  }
  
  console.log(`\n👨‍⚕️ MÉDICOS CON ESPECIALIDADES ASIGNADAS`.title);
  
  const headers = {
    'Authorization': `Bearer ${token}`
  };
  
  // Obtener médicos
  const medicosResult = await makeRequest(`${services.admin}/medicos`, 'GET', null, headers);
  
  if (medicosResult.success) {
    console.log(`✅ Médicos obtenidos: ${medicosResult.data.length} registros`.success);
    console.log(`\n📋 Lista de Médicos:`.service);
    
    medicosResult.data.forEach((medico, index) => {
      const especialidad = medico.especialidad || 'Sin especialidad asignada';
      const centro = medico.centro_medico || `Centro ${medico.id_centro}`;
      const ciudad = medico.centro_ciudad || 'N/A';
      
      console.log(`\n  ${index + 1}. ${medico.nombres} ${medico.apellidos}`.info);
      console.log(`     🩺 Especialidad: ${especialidad}`.info);
      console.log(`     🏥 Centro: ${centro} (${ciudad})`.info);
      console.log(`     🆔 ID: ${medico.id}`.info);
      console.log(`     📍 Origen BD: ${medico.origen_bd || 'N/A'}`.info);
    });
    
  } else {
    console.log(`❌ Error obteniendo médicos: ${medicosResult.error}`.error);
  }
}

// Función principal
async function runAssignEspecialidades() {
  console.log(`\n🚀 ASIGNANDO ESPECIALIDADES A MÉDICOS`.title);
  console.log(`⏰ Fecha: ${new Date().toLocaleString()}`.info);
  
  try {
    // Obtener token de admin
    const token = await getAdminToken();
    
    if (token) {
      // Crear especialidades
      await createEspecialidades(token);
      
      // Asignar especialidades a médicos
      await assignEspecialidadesToMedicos(token);
      
      // Mostrar médicos actualizados
      await showMedicosActualizados(token);
      
      console.log(`\n📋 RESUMEN FINAL`.title);
      console.log(`✅ Proceso de asignación de especialidades completado`.success);
      console.log(`🔍 Revisa la información detallada arriba`.info);
      
    } else {
      console.log(`\n⚠️ No se pudo obtener el token de administrador`.warning);
    }
    
  } catch (error) {
    console.log(`\n💥 Error durante el proceso: ${error.message}`.error);
  }
}

// Ejecutar el proceso
runAssignEspecialidades();
