const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function corregirIdsDocker() {
  console.log('🔧 CORRIGIENDO IDs CON DOCKER');
  console.log('=============================\n');
  
  try {
    // 1. Verificar IDs actuales
    console.log('📊 VERIFICANDO IDs ACTUALES:'.info);
    
    console.log('\n🏥 CENTRO 1 (Central):');
    try {
      const { stdout: central } = await execAsync('docker exec hospital-mysql-central mysql -u root -ppassword -e "SELECT id, nombres, apellidos FROM hospital_central.pacientes ORDER BY id;"');
      console.log(central);
    } catch (error) {
      console.log('❌ Error accediendo a central:', error.message);
    }
    
    console.log('\n🏥 CENTRO 2 (Guayaquil):');
    try {
      const { stdout: guayaquil } = await execAsync('docker exec hospital-mysql-guayaquil mysql -u root -ppassword -e "SELECT id, nombres, apellidos FROM hospital_guayaquil.pacientes ORDER BY id;"');
      console.log(guayaquil);
    } catch (error) {
      console.log('❌ Error accediendo a guayaquil:', error.message);
    }
    
    console.log('\n🏥 CENTRO 3 (Cuenca):');
    try {
      const { stdout: cuenca } = await execAsync('docker exec hospital-mysql-cuenca mysql -u root -ppassword -e "SELECT id, nombres, apellidos FROM hospital_cuenca.pacientes ORDER BY id;"');
      console.log(cuenca);
    } catch (error) {
      console.log('❌ Error accediendo a cuenca:', error.message);
    }
    
    // 2. Corregir IDs duplicados
    console.log('\n🔧 CORRIGIENDO IDs DUPLICADOS:'.info);
    
    // Cambiar Pedro de ID 4 a ID 6 en Guayaquil
    console.log('🏥 Cambiando Pedro de ID 4 a ID 6 en Guayaquil...');
    try {
      await execAsync('docker exec hospital-mysql-guayaquil mysql -u root -ppassword -e "UPDATE hospital_guayaquil.pacientes SET id = 6 WHERE id = 4 AND nombres = \'Pedro RRR\';"');
      console.log('✅ Pedro actualizado en Guayaquil');
    } catch (error) {
      console.log('❌ Error actualizando Pedro:', error.message);
    }
    
    // Cambiar Sebastián de ID 5 a ID 7 en Cuenca
    console.log('🏥 Cambiando Sebastián de ID 5 a ID 7 en Cuenca...');
    try {
      await execAsync('docker exec hospital-mysql-cuenca mysql -u root -ppassword -e "UPDATE hospital_cuenca.pacientes SET id = 7 WHERE id = 5 AND nombres = \'Sebastián Alejandro\';"');
      console.log('✅ Sebastián actualizado en Cuenca');
    } catch (error) {
      console.log('❌ Error actualizando Sebastián:', error.message);
    }
    
    // 3. Verificar IDs corregidos
    console.log('\n📊 VERIFICANDO IDs CORREGIDOS:'.info);
    
    console.log('\n🏥 CENTRO 1 (Central):');
    try {
      const { stdout: central2 } = await execAsync('docker exec hospital-mysql-central mysql -u root -ppassword -e "SELECT id, nombres, apellidos FROM hospital_central.pacientes ORDER BY id;"');
      console.log(central2);
    } catch (error) {
      console.log('❌ Error accediendo a central:', error.message);
    }
    
    console.log('\n🏥 CENTRO 2 (Guayaquil):');
    try {
      const { stdout: guayaquil2 } = await execAsync('docker exec hospital-mysql-guayaquil mysql -u root -ppassword -e "SELECT id, nombres, apellidos FROM hospital_guayaquil.pacientes ORDER BY id;"');
      console.log(guayaquil2);
    } catch (error) {
      console.log('❌ Error accediendo a guayaquil:', error.message);
    }
    
    console.log('\n🏥 CENTRO 3 (Cuenca):');
    try {
      const { stdout: cuenca2 } = await execAsync('docker exec hospital-mysql-cuenca mysql -u root -ppassword -e "SELECT id, nombres, apellidos FROM hospital_cuenca.pacientes ORDER BY id;"');
      console.log(cuenca2);
    } catch (error) {
      console.log('❌ Error accediendo a cuenca:', error.message);
    }
    
    console.log('\n✅ IDs corregidos exitosamente');
    
  } catch (error) {
    console.log(`❌ Error general: ${error.message}`);
  }
}

corregirIdsDocker();

