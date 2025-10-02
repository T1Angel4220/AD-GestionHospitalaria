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
  },
  guayaquil: {
    host: 'localhost',
    user: 'admin_guayaquil',
    password: 'SuperPasswordGye123!',
    database: 'hospital_guayaquil',
    port: 3308
  },
  cuenca: {
    host: 'localhost',
    user: 'admin_cuenca',
    password: 'SuperPasswordCuenca123!',
    database: 'hospital_cuenca',
    port: 3309
  }
};

async function verificarMedicosCentros() {
  console.log('👨‍⚕️ VERIFICANDO MÉDICOS EN CADA CENTRO');
  console.log('=====================================\n');
  
  for (const [centro, config] of Object.entries(dbConfigs)) {
    console.log(`\n🏥 CENTRO: ${centro.toUpperCase()}`.title);
    console.log('='.repeat(50));
    
    try {
      const connection = await mysql.createConnection(config);
      console.log(`✅ Conectado a ${centro}`.success);
      
      // Verificar médicos
      console.log('\n👨‍⚕️ MÉDICOS:'.info);
      const [medicos] = await connection.query(`
        SELECT m.id, m.nombres, m.apellidos, m.id_centro, m.id_especialidad, e.nombre as especialidad_nombre
        FROM medicos m
        LEFT JOIN especialidades e ON m.id_especialidad = e.id
        ORDER BY m.id
      `);
      
      console.log(`   Total médicos: ${medicos.length}`);
      medicos.forEach(m => {
        console.log(`   ID: ${m.id}, Nombre: ${m.nombres} ${m.apellidos}, Centro: ${m.id_centro}, Especialidad: ${m.especialidad_nombre}`);
      });
      
      // Verificar pacientes
      console.log('\n👥 PACIENTES:'.info);
      const [pacientes] = await connection.query(`
        SELECT p.id, p.nombres, p.apellidos, p.id_centro
        FROM pacientes p
        ORDER BY p.id
      `);
      
      console.log(`   Total pacientes: ${pacientes.length}`);
      pacientes.forEach(p => {
        console.log(`   ID: ${p.id}, Nombre: ${p.nombres} ${p.apellidos}, Centro: ${p.id_centro}`);
      });
      
      await connection.end();
      
    } catch (error) {
      console.log(`❌ Error en ${centro}: ${error.message}`.error);
    }
  }
  
  console.log('\n💡 ANÁLISIS:'.title);
  console.log('Para crear una consulta de Pedro en Guayaquil, necesitamos:');
  console.log('1. Un médico que exista en Guayaquil');
  console.log('2. O crear un médico en Guayaquil');
  console.log('3. O modificar la lógica para usar médicos de cualquier centro');
}

verificarMedicosCentros();

