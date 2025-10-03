#!/usr/bin/env node

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002'; // Admin service

async function testPatientUpdate() {
  console.log('🧪 Probando actualización de pacientes...\n');

  try {
    // 1. Primero obtener el token de autenticación
    console.log('🔐 Obteniendo token de autenticación...');
    const loginResponse = await axios.post(`${API_BASE_URL}/login`, {
      email: 'admin@hospital.com',
      password: 'password'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Token obtenido');

    // 2. Obtener lista de pacientes
    console.log('\n📋 Obteniendo lista de pacientes...');
    const pacientesResponse = await axios.get(`${API_BASE_URL}/pacientes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const pacientes = pacientesResponse.data;
    console.log(`✅ Se encontraron ${pacientes.length} pacientes`);
    
    if (pacientes.length === 0) {
      console.log('❌ No hay pacientes para probar');
      return;
    }

    const paciente = pacientes[0];
    console.log(`🎯 Probando con paciente: ${paciente.nombres} ${paciente.apellidos} (ID: ${paciente.id})`);

    // 3. Probar actualización con datos válidos
    console.log('\n🔄 Probando actualización con datos válidos...');
    const updateData = {
      nombres: 'José María',
      apellidos: 'González Pérez',
      telefono: '0987654321',
      email: 'jose.gonzalez@email.com'
    };

    try {
      const updateResponse = await axios.put(`${API_BASE_URL}/pacientes/${paciente.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Actualización exitosa:', updateResponse.data);
    } catch (updateError) {
      console.log('❌ Error en actualización:', updateError.response?.data || updateError.message);
    }

    // 4. Probar actualización con campos vacíos
    console.log('\n🔄 Probando actualización con campos vacíos...');
    const emptyUpdateData = {
      nombres: '',
      apellidos: '',
      telefono: '',
      email: ''
    };

    try {
      const emptyUpdateResponse = await axios.put(`${API_BASE_URL}/pacientes/${paciente.id}`, emptyUpdateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Actualización con campos vacíos exitosa:', emptyUpdateResponse.data);
    } catch (emptyUpdateError) {
      console.log('❌ Error en actualización con campos vacíos:', emptyUpdateError.response?.data || emptyUpdateError.message);
    }

    // 5. Probar actualización con campos undefined
    console.log('\n🔄 Probando actualización con campos undefined...');
    const undefinedUpdateData = {
      nombres: undefined,
      apellidos: undefined,
      telefono: undefined,
      email: undefined
    };

    try {
      const undefinedUpdateResponse = await axios.put(`${API_BASE_URL}/pacientes/${paciente.id}`, undefinedUpdateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Actualización con campos undefined exitosa:', undefinedUpdateResponse.data);
    } catch (undefinedUpdateError) {
      console.log('❌ Error en actualización con campos undefined:', undefinedUpdateError.response?.data || undefinedUpdateError.message);
    }

    // 6. Probar actualización con solo un campo
    console.log('\n🔄 Probando actualización con solo un campo...');
    const singleFieldUpdateData = {
      telefono: '0999888777'
    };

    try {
      const singleFieldUpdateResponse = await axios.put(`${API_BASE_URL}/pacientes/${paciente.id}`, singleFieldUpdateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Actualización con un solo campo exitosa:', singleFieldUpdateResponse.data);
    } catch (singleFieldUpdateError) {
      console.log('❌ Error en actualización con un solo campo:', singleFieldUpdateError.response?.data || singleFieldUpdateError.message);
    }

  } catch (error) {
    console.error('❌ Error general:', error.response?.data || error.message);
  }
}

// Ejecutar la prueba
testPatientUpdate().catch(console.error);
