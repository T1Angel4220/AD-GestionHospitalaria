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

async function consultarConsultasTodosCentros() {
  console.log('🏥 CONSULTAS DE TODOS LOS CENTROS MÉDICOS');
  console.log('==========================================\n');
  
  let totalConsultas = 0;
  
  for (const [centro, config] of Object.entries(dbConfigs)) {
    console.log(`\n🏥 CENTRO: ${centro.toUpperCase()}`.title);
    console.log('='.repeat(50));
    
    try {
      const connection = await mysql.createConnection(config);
      console.log(`✅ Conectado a ${centro}`.success);
      
      // Contar consultas
      const [count] = await connection.query('SELECT COUNT(*) as total FROM consultas');
      const totalCentro = count[0].total;
      totalConsultas += totalCentro;
      
      console.log(`📊 Total de consultas en ${centro}: ${totalCentro}`.info);
      
      if (totalCentro > 0) {
        // Obtener consultas con información relacionada
        const [consultas] = await connection.query(`
          SELECT 
            c.id,
            c.fecha,
            c.duracion_minutos,
            c.estado,
            c.motivo,
            c.diagnostico,
            c.tratamiento,
            c.id_centro,
            c.created_at,
            p.nombres as paciente_nombres,
            p.apellidos as paciente_apellidos,
            p.cedula as paciente_cedula,
            m.nombres as medico_nombres,
            m.apellidos as medico_apellidos,
            e.nombre as especialidad_nombre
          FROM consultas c
          LEFT JOIN pacientes p ON c.id_paciente = p.id
          LEFT JOIN medicos m ON c.id_medico = m.id
          LEFT JOIN especialidades e ON m.id_especialidad = e.id
          ORDER BY c.fecha DESC
          LIMIT 3
        `);
        
        console.log(`\n📋 PRIMERAS ${Math.min(3, consultas.length)} CONSULTAS:`.info);
        
        consultas.forEach((consulta, index) => {
          console.log(`\n   ${index + 1}. ID: ${consulta.id} - ${consulta.estado || 'Sin estado'}`);
          console.log(`      📅 Fecha: ${consulta.fecha || 'N/A'}`);
          console.log(`      👤 Paciente: ${consulta.paciente_nombres || 'N/A'} ${consulta.paciente_apellidos || 'N/A'}`);
          console.log(`      👨‍⚕️ Médico: ${consulta.medico_nombres || 'N/A'} ${consulta.medico_apellidos || 'N/A'}`);
          console.log(`      🏥 Especialidad: ${consulta.especialidad_nombre || 'N/A'}`);
          
          if (consulta.motivo) {
            console.log(`      📝 Motivo: ${consulta.motivo.substring(0, 50)}${consulta.motivo.length > 50 ? '...' : ''}`);
          }
        });
        
        // Estadísticas por estado
        const [estados] = await connection.query(`
          SELECT estado, COUNT(*) as cantidad 
          FROM consultas 
          GROUP BY estado 
          ORDER BY cantidad DESC
        `);
        
        console.log(`\n📊 ESTADÍSTICAS POR ESTADO:`.info);
        estados.forEach(estado => {
          console.log(`   ${estado.estado || 'Sin estado'}: ${estado.cantidad} consultas`);
        });
      } else {
        console.log(`❌ No hay consultas en ${centro}`.warning);
      }
      
      await connection.end();
      
    } catch (error) {
      console.log(`❌ Error en ${centro}: ${error.message}`.error);
    }
  }
  
  console.log(`\n📊 RESUMEN GENERAL:`.title);
  console.log(`   Total de consultas en todos los centros: ${totalConsultas}`.info);
  
  if (totalConsultas === 0) {
    console.log('\n💡 No hay consultas en ningún centro. Puedes crear algunas consultas de prueba.'.warning);
  }
}

consultarConsultasTodosCentros();

