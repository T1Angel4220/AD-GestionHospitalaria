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

async function debugConsultasCentro() {
  console.log('🔍 DEBUGGING CONSULTAS Y CENTROS');
  console.log('================================\n');
  
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
        ORDER BY p.id
      `);
      
      pacientes.forEach(p => {
        console.log(`   ID: ${p.id}, Nombre: ${p.nombres} ${p.apellidos}, Centro: ${p.centro_nombre} (ID: ${p.id_centro})`);
      });
      
      // 2. Verificar consultas
      console.log('\n📋 CONSULTAS:'.info);
      const [consultas] = await connection.query(`
        SELECT c.id, c.fecha, c.estado, c.id_centro, c.paciente_nombre, c.paciente_apellido, c.id_paciente
        FROM consultas c
        ORDER BY c.id
      `);
      
      if (consultas.length > 0) {
        consultas.forEach(c => {
          console.log(`   ID: ${c.id}, Fecha: ${c.fecha}, Estado: ${c.estado}, Centro: ${c.id_centro}, Paciente: ${c.paciente_nombre} ${c.paciente_apellido}, ID Paciente: ${c.id_paciente}`);
        });
        
        // 3. Verificar inconsistencias
        console.log('\n⚠️ INCONSISTENCIAS:'.warning);
        for (const consulta of consultas) {
          if (consulta.id_paciente) {
            const paciente = pacientes.find(p => p.id === consulta.id_paciente);
            if (paciente) {
              if (paciente.id_centro !== consulta.id_centro) {
                console.log(`   ❌ Consulta ID ${consulta.id}: Paciente ${paciente.nombres} ${paciente.apellidos} está en centro ${paciente.id_centro} pero consulta dice centro ${consulta.id_centro}`);
              }
            }
          }
        }
      } else {
        console.log('   No hay consultas en este centro');
      }
      
      await connection.end();
      
    } catch (error) {
      console.log(`❌ Error en ${centro}: ${error.message}`.error);
    }
  }
}

debugConsultasCentro();

