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
    console.log(`👤 Usuario: ${result.data.user?.email}`.info);
    console.log(`🔑 Rol: ${result.data.user?.rol}`.info);
    return result.data.token;
  } else {
    console.log(`❌ Login falló: ${result.error}`.error);
    return null;
  }
}

// Función para mostrar médicos con especialidades
async function showMedicosConEspecialidades(token) {
  if (!token) {
    console.log(`\n⚠️ No hay token disponible`.warning);
    return;
  }
  
  console.log(`\n👨‍⚕️ MÉDICOS CON ESPECIALIDADES`.title);
  
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
    
    // Resumen por especialidad
    console.log(`\n📊 Resumen por Especialidad:`.service);
    const especialidades = {};
    medicosResult.data.forEach(medico => {
      const esp = medico.especialidad || 'Sin especialidad';
      if (!especialidades[esp]) {
        especialidades[esp] = [];
      }
      especialidades[esp].push(medico);
    });
    
    Object.entries(especialidades).forEach(([especialidad, medicos]) => {
      console.log(`\n  🩺 ${especialidad}: ${medicos.length} médico(s)`.info);
      medicos.forEach(medico => {
        console.log(`     - ${medico.nombres} ${medico.apellidos} (${medico.centro_medico || `Centro ${medico.id_centro}`})`.info);
      });
    });
    
    // Resumen por centro
    console.log(`\n🏥 Resumen por Centro:`.service);
    const centros = {};
    medicosResult.data.forEach(medico => {
      const centro = medico.centro_medico || `Centro ${medico.id_centro}`;
      if (!centros[centro]) {
        centros[centro] = [];
      }
      centros[centro].push(medico);
    });
    
    Object.entries(centros).forEach(([centro, medicos]) => {
      console.log(`\n  🏥 ${centro}: ${medicos.length} médico(s)`.info);
      medicos.forEach(medico => {
        console.log(`     - ${medico.nombres} ${medico.apellidos} (${medico.especialidad || 'Sin especialidad'})`.info);
      });
    });
    
  } else {
    console.log(`❌ Error obteniendo médicos: ${medicosResult.error}`.error);
  }
}

// Función para mostrar especialidades disponibles
async function showEspecialidadesDisponibles(token) {
  if (!token) {
    console.log(`\n⚠️ No hay token disponible`.warning);
    return;
  }
  
  console.log(`\n🩺 ESPECIALIDADES DISPONIBLES`.title);
  
  const headers = {
    'Authorization': `Bearer ${token}`
  };
  
  // Obtener especialidades
  const especialidadesResult = await makeRequest(`${services.admin}/especialidades`, 'GET', null, headers);
  
  if (especialidadesResult.success) {
    console.log(`✅ Especialidades obtenidas: ${especialidadesResult.data.length} registros`.success);
    console.log(`\n📋 Lista de Especialidades:`.service);
    
    especialidadesResult.data.forEach((especialidad, index) => {
      const centro = especialidad.centro_medico || `Centro ${especialidad.id_centro}`;
      const ciudad = especialidad.centro_ciudad || 'N/A';
      
      console.log(`\n  ${index + 1}. ${especialidad.nombre}`.info);
      console.log(`     🏥 Centro: ${centro} (${ciudad})`.info);
      console.log(`     🆔 ID: ${especialidad.id}`.info);
      console.log(`     📍 Origen BD: ${especialidad.origen_bd || 'N/A'}`.info);
    });
    
  } else {
    console.log(`❌ Error obteniendo especialidades: ${especialidadesResult.error}`.error);
  }
}

// Función principal
async function runShowMedicos() {
  console.log(`\n🚀 MOSTRANDO MÉDICOS CON ESPECIALIDADES`.title);
  console.log(`⏰ Fecha: ${new Date().toLocaleString()}`.info);
  
  try {
    // Obtener token de admin
    const token = await getAdminToken();
    
    if (token) {
      // Mostrar médicos con especialidades
      await showMedicosConEspecialidades(token);
      
      // Mostrar especialidades disponibles
      await showEspecialidadesDisponibles(token);
      
      console.log(`\n📋 RESUMEN FINAL`.title);
      console.log(`✅ Médicos y especialidades mostrados correctamente`.success);
      console.log(`🔍 Revisa la información detallada arriba`.info);
      
    } else {
      console.log(`\n⚠️ No se pudo obtener el token de administrador`.warning);
    }
    
  } catch (error) {
    console.log(`\n💥 Error durante la consulta: ${error.message}`.error);
  }
}

// Ejecutar la consulta
runShowMedicos();
