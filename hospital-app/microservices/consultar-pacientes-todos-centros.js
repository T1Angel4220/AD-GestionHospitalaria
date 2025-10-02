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

async function consultarPacientesTodosCentros() {
  console.log('👥 PACIENTES DE TODOS LOS CENTROS MÉDICOS');
  console.log('=========================================\n');
  
  let totalPacientes = 0;
  
  for (const [centro, config] of Object.entries(dbConfigs)) {
    console.log(`\n🏥 CENTRO: ${centro.toUpperCase()}`.title);
    console.log('='.repeat(50));
    
    try {
      const connection = await mysql.createConnection(config);
      console.log(`✅ Conectado a ${centro}`.success);
      
      // Contar pacientes
      const [count] = await connection.query('SELECT COUNT(*) as total FROM pacientes');
      const totalCentro = count[0].total;
      totalPacientes += totalCentro;
      
      console.log(`📊 Total de pacientes en ${centro}: ${totalCentro}`.info);
      
      if (totalCentro > 0) {
        // Obtener pacientes con información del centro
        const [pacientes] = await connection.query(`
          SELECT 
            p.id,
            p.nombres,
            p.apellidos,
            p.cedula,
            p.telefono,
            p.email,
            p.fecha_nacimiento,
            p.genero,
            p.id_centro,
            cm.nombre as centro_nombre,
            cm.ciudad
          FROM pacientes p
          LEFT JOIN centros_medicos cm ON p.id_centro = cm.id
          ORDER BY p.apellidos, p.nombres
        `);
        
        console.log(`\n📋 LISTA DE PACIENTES:`.info);
        
        pacientes.forEach((paciente, index) => {
          console.log(`\n   ${index + 1}. ID: ${paciente.id}`.service);
          console.log(`      👤 Nombre: ${paciente.nombres} ${paciente.apellidos}`);
          console.log(`      🆔 Cédula: ${paciente.cedula}`);
          console.log(`      📞 Teléfono: ${paciente.telefono || 'N/A'}`);
          console.log(`      📧 Email: ${paciente.email || 'N/A'}`);
          console.log(`      📅 Fecha Nacimiento: ${paciente.fecha_nacimiento || 'N/A'}`);
          console.log(`      ⚧ Género: ${paciente.genero || 'N/A'}`);
          console.log(`      🏥 Centro: ${paciente.centro_nombre || 'N/A'} (${paciente.ciudad || 'N/A'})`);
          console.log(`      🆔 Centro ID: ${paciente.id_centro}`);
          console.log('      ' + '-'.repeat(40));
        });
        
        // Estadísticas por género
        const [generos] = await connection.query(`
          SELECT genero, COUNT(*) as cantidad 
          FROM pacientes 
          WHERE genero IS NOT NULL
          GROUP BY genero 
          ORDER BY cantidad DESC
        `);
        
        if (generos.length > 0) {
          console.log(`\n📊 ESTADÍSTICAS POR GÉNERO:`.info);
          generos.forEach(genero => {
            console.log(`   ${genero.genero || 'Sin especificar'}: ${genero.cantidad} pacientes`);
          });
        }
        
        // Estadísticas por centro
        const [centros] = await connection.query(`
          SELECT id_centro, COUNT(*) as cantidad 
          FROM pacientes 
          GROUP BY id_centro 
          ORDER BY cantidad DESC
        `);
        
        if (centros.length > 0) {
          console.log(`\n🏥 DISTRIBUCIÓN POR CENTRO:`.info);
          centros.forEach(centro => {
            console.log(`   Centro ID ${centro.id_centro}: ${centro.cantidad} pacientes`);
          });
        }
        
      } else {
        console.log(`❌ No hay pacientes en ${centro}`.warning);
      }
      
      await connection.end();
      
    } catch (error) {
      console.log(`❌ Error en ${centro}: ${error.message}`.error);
      
      if (error.code === 'ECONNREFUSED') {
        console.log(`💡 Verifica que el contenedor de MySQL de ${centro} esté ejecutándose`.warning);
      }
    }
  }
  
  console.log(`\n📊 RESUMEN GENERAL:`.title);
  console.log(`   Total de pacientes en todos los centros: ${totalPacientes}`.info);
  
  if (totalPacientes === 0) {
    console.log('\n💡 No hay pacientes en ningún centro. Puedes crear algunos pacientes de prueba.'.warning);
  } else {
    console.log('\n✅ Consulta de pacientes completada exitosamente'.success);
  }
}

consultarPacientesTodosCentros();

