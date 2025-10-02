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

async function debugNuevaConsultaPedro() {
  console.log('🔍 DEBUGGING NUEVA CONSULTA DE PEDRO');
  console.log('====================================\n');
  
  for (const [centro, config] of Object.entries(dbConfigs)) {
    console.log(`\n🏥 CENTRO: ${centro.toUpperCase()}`.title);
    console.log('='.repeat(50));
    
    try {
      const connection = await mysql.createConnection(config);
      console.log(`✅ Conectado a ${centro}`.success);
      
      // 1. Verificar pacientes
      console.log('\n👥 PACIENTES:'.info);
      const [pacientes] = await connection.query(`
        SELECT p.id, p.nombres, p.apellidos, p.cedula, p.id_centro, cm.nombre as centro_nombre
        FROM pacientes p
        LEFT JOIN centros_medicos cm ON p.id_centro = cm.id
        WHERE p.nombres LIKE '%Pedro%' OR p.apellidos LIKE '%Paredes%'
        ORDER BY p.id
      `);
      
      if (pacientes.length > 0) {
        pacientes.forEach(p => {
          console.log(`   ID: ${p.id}, Nombre: ${p.nombres} ${p.apellidos}, Centro: ${p.centro_nombre} (ID: ${p.id_centro})`);
        });
      } else {
        console.log('   No hay pacientes de Pedro en este centro');
      }
      
      // 2. Verificar consultas
      console.log('\n📋 CONSULTAS:'.info);
      const [consultas] = await connection.query(`
        SELECT c.id, c.fecha, c.estado, c.id_centro, c.paciente_nombre, c.paciente_apellido, c.id_paciente, c.created_at
        FROM consultas c
        WHERE c.paciente_nombre LIKE '%Pedro%' OR c.paciente_apellido LIKE '%Paredes%'
        ORDER BY c.created_at DESC
      `);
      
      if (consultas.length > 0) {
        console.log(`   Consultas encontradas: ${consultas.length}`);
        consultas.forEach(c => {
          console.log(`   ID: ${c.id}, Fecha: ${c.fecha}, Estado: ${c.estado}, Centro: ${c.id_centro}`);
          console.log(`   Paciente: ${c.paciente_nombre} ${c.paciente_apellido}, ID Paciente: ${c.id_paciente}`);
          console.log(`   Creado: ${c.created_at}`);
          console.log('   ' + '-'.repeat(40));
        });
      } else {
        console.log('   No hay consultas de Pedro en este centro');
      }
      
      await connection.end();
      
    } catch (error) {
      console.log(`❌ Error en ${centro}: ${error.message}`.error);
    }
  }
  
  console.log('\n🔍 ANÁLISIS DEL PROBLEMA:'.title);
  console.log('1. Pedro RRR Paredes Pp está en Guayaquil (Centro 2)');
  console.log('2. Pero sus consultas se crean en Quito (Centro 1)');
  console.log('3. Esto indica un problema en la lógica de creación de consultas');
  console.log('4. El frontend está enviando el ID global en lugar del ID original');
  console.log('5. O el backend está usando la base de datos incorrecta');
}

debugNuevaConsultaPedro();

