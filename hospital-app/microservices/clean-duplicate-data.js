const mysql = require('mysql2/promise');
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

// Configuración de bases de datos
const dbConfigs = {
  central: {
    host: 'localhost',
    user: 'admin_central',
    password: 'SuperPasswordCentral123!',
    database: 'hospital_central',
    port: 3307
  }
};

// Función para limpiar datos duplicados
async function cleanDuplicateData() {
  console.log(`\n🧹 LIMPIANDO DATOS DUPLICADOS`.title);
  console.log(`⏰ Fecha: ${new Date().toLocaleString()}`.info);
  
  try {
    const connection = await mysql.createConnection(dbConfigs.central);
    console.log(`✅ Conectado a Central`.success);
    
    // Limpiar pacientes duplicados (mantener el más reciente)
    console.log(`\n👥 Limpiando pacientes duplicados...`.info);
    const [duplicatePacientes] = await connection.execute(`
      SELECT nombres, apellidos, cedula, COUNT(*) as count
      FROM pacientes 
      GROUP BY nombres, apellidos, cedula 
      HAVING COUNT(*) > 1
    `);
    
    if (duplicatePacientes.length > 0) {
      console.log(`📋 Encontrados ${duplicatePacientes.length} grupos de pacientes duplicados`.warning);
      
      for (const dup of duplicatePacientes) {
        console.log(`   - ${dup.nombres} ${dup.apellidos} (${dup.cedula}): ${dup.count} registros`.warning);
        
        // Mantener solo el más reciente (mayor ID)
        await connection.execute(`
          DELETE FROM pacientes 
          WHERE nombres = ? AND apellidos = ? AND cedula = ? 
          AND id NOT IN (
            SELECT * FROM (
              SELECT MAX(id) FROM pacientes 
              WHERE nombres = ? AND apellidos = ? AND cedula = ?
            ) as temp
          )
        `, [dup.nombres, dup.apellidos, dup.cedula, dup.nombres, dup.apellidos, dup.cedula]);
        
        console.log(`   ✅ Duplicados eliminados`.success);
      }
    } else {
      console.log(`   ✅ No hay pacientes duplicados`.success);
    }
    
    // Limpiar empleados duplicados (mantener el más reciente)
    console.log(`\n👨‍💼 Limpiando empleados duplicados...`.info);
    const [duplicateEmpleados] = await connection.execute(`
      SELECT nombres, apellidos, cargo, COUNT(*) as count
      FROM empleados 
      GROUP BY nombres, apellidos, cargo 
      HAVING COUNT(*) > 1
    `);
    
    if (duplicateEmpleados.length > 0) {
      console.log(`📋 Encontrados ${duplicateEmpleados.length} grupos de empleados duplicados`.warning);
      
      for (const dup of duplicateEmpleados) {
        console.log(`   - ${dup.nombres} ${dup.apellidos} (${dup.cargo}): ${dup.count} registros`.warning);
        
        // Mantener solo el más reciente (mayor ID)
        await connection.execute(`
          DELETE FROM empleados 
          WHERE nombres = ? AND apellidos = ? AND cargo = ? 
          AND id NOT IN (
            SELECT * FROM (
              SELECT MAX(id) FROM empleados 
              WHERE nombres = ? AND apellidos = ? AND cargo = ?
            ) as temp
          )
        `, [dup.nombres, dup.apellidos, dup.cargo, dup.nombres, dup.apellidos, dup.cargo]);
        
        console.log(`   ✅ Duplicados eliminados`.success);
      }
    } else {
      console.log(`   ✅ No hay empleados duplicados`.success);
    }
    
    // Verificar resultados
    console.log(`\n📊 Verificando resultados...`.info);
    
    const [pacientesCount] = await connection.execute('SELECT COUNT(*) as count FROM pacientes');
    const [empleadosCount] = await connection.execute('SELECT COUNT(*) as count FROM empleados');
    
    console.log(`   👥 Pacientes: ${pacientesCount[0].count} registros`.info);
    console.log(`   👨‍💼 Empleados: ${empleadosCount[0].count} registros`.info);
    
    await connection.end();
    console.log(`\n✅ Limpieza completada`.success);
    
  } catch (error) {
    console.log(`\n❌ Error: ${error.message}`.error);
  }
}

// Ejecutar limpieza
cleanDuplicateData().catch(console.error);
