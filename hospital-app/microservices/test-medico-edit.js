const axios = require('axios');

// URLs de los microservicios
const services = {
  auth: 'http://localhost:3001',
  admin: 'http://localhost:3002'
};

async function testMedicoEdit() {
  console.log('🔧 PROBANDO EDICIÓN DE MÉDICOS');
  console.log('==============================\n');
  
  try {
    // 1. Hacer login para obtener token (usando admin)
    console.log('🔐 Obteniendo token de autenticación...');
    const loginResponse = await axios.post(`${services.auth}/login`, {
      email: 'admin@hospital.com',
      password: 'password'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Token obtenido exitosamente\n');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8'
    };
    
    // 2. Obtener lista de médicos
    console.log('👨‍⚕️ Obteniendo lista de médicos...');
    const medicosResponse = await axios.get(`${services.admin}/medicos`, { headers });
    console.log(`✅ ${medicosResponse.data.length} médicos encontrados\n`);
    
    if (medicosResponse.data.length === 0) {
      console.log('❌ No hay médicos para probar la edición');
      return;
    }
    
    // 3. Seleccionar el primer médico para editar
    const medico = medicosResponse.data[0];
    console.log(`📝 Editando médico: ${medico.nombres} ${medico.apellidos} (ID: ${medico.id})`);
    
    // 4. Intentar editar el médico
    const updateData = {
      nombres: 'Dr. Juan Carlos',
      apellidos: 'Pérez González',
      id_especialidad: medico.id_especialidad || 1
    };
    
    console.log('📤 Enviando datos de actualización...');
    console.log(`   Nombres: ${updateData.nombres}`);
    console.log(`   Apellidos: ${updateData.apellidos}`);
    console.log(`   Especialidad: ${updateData.id_especialidad}`);
    
    const updateResponse = await axios.put(`${services.admin}/medicos/${medico.id}`, updateData, { headers });
    
    console.log('✅ Médico actualizado exitosamente!');
    console.log(`📋 Respuesta: ${JSON.stringify(updateResponse.data, null, 2)}`);
    
    // 5. Verificar que los cambios se aplicaron
    console.log('\n🔍 Verificando cambios aplicados...');
    const updatedMedicosResponse = await axios.get(`${services.admin}/medicos`, { headers });
    const updatedMedico = updatedMedicosResponse.data.find(m => m.id === medico.id);
    
    if (updatedMedico) {
      console.log('✅ Médico encontrado después de la actualización:');
      console.log(`   Nombres: ${updatedMedico.nombres}`);
      console.log(`   Apellidos: ${updatedMedico.apellidos}`);
      console.log(`   Especialidad: ${updatedMedico.especialidad || 'N/A'}`);
      
      if (updatedMedico.nombres === updateData.nombres && updatedMedico.apellidos === updateData.apellidos) {
        console.log('🎉 ¡La edición funcionó correctamente!');
      } else {
        console.log('⚠️ Los cambios no se reflejaron completamente');
      }
    } else {
      console.log('❌ No se pudo encontrar el médico actualizado');
    }
    
  } catch (error) {
    console.log(`❌ Error durante la prueba: ${error.message}`);
    
    if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`📝 Datos: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

testMedicoEdit();
