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

// Configuración de la base de datos de Guayaquil
const dbConfig = {
  host: 'localhost',
  user: 'admin_guayaquil',
  password: 'SuperPasswordGye123!',
  database: 'hospital_guayaquil',
  port: 3308
};

async function consultarConsultasGuayaquil() {
  console.log('🏥 CONSULTAS DEL CENTRO MÉDICO DE GUAYAQUIL');
  console.log('==========================================\n');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos de Guayaquil'.success);
    console.log(`📍 Host: ${dbConfig.host}:${dbConfig.port}`.info);
    console.log(`🗄️ Database: ${dbConfig.database}\n`.info);
    
    // Consulta para obtener todas las consultas con información relacionada
    const [consultas] = await connection.query(`
      SELECT 
        c.id,
        c.fecha,
        c.duracion_minutos,
        c.estado,
        c.motivo,
        c.diagnostico,
        c.tratamiento,
        c.paciente_nombre,
        c.paciente_apellido,
        c.id_paciente,
        c.id_medico,
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
    `);
    
    console.log(`📊 Total de consultas encontradas: ${consultas.length}\n`.info);
    
    if (consultas.length === 0) {
      console.log('❌ No hay consultas registradas en Guayaquil'.warning);
    } else {
      console.log('📋 DETALLE DE CONSULTAS:'.title);
      console.log('='.repeat(80));
      
      consultas.forEach((consulta, index) => {
        console.log(`\n${index + 1}. CONSULTA ID: ${consulta.id}`.service);
        console.log(`   📅 Fecha: ${consulta.fecha || 'N/A'}`);
        console.log(`   ⏱️ Duración: ${consulta.duracion_minutos || 0} minutos`);
        console.log(`   📊 Estado: ${consulta.estado || 'N/A'}`);
        console.log(`   🏥 Centro ID: ${consulta.id_centro || 'N/A'}`);
        console.log(`   👤 Paciente: ${consulta.paciente_nombres || consulta.paciente_nombre || 'N/A'} ${consulta.paciente_apellidos || consulta.paciente_apellido || 'N/A'}`);
        console.log(`   🆔 Cédula Paciente: ${consulta.paciente_cedula || 'N/A'}`);
        console.log(`   👨‍⚕️ Médico: ${consulta.medico_nombres || 'N/A'} ${consulta.medico_apellidos || 'N/A'}`);
        console.log(`   🏥 Especialidad: ${consulta.especialidad_nombre || 'N/A'}`);
        
        if (consulta.motivo) {
          console.log(`   📝 Motivo: ${consulta.motivo}`);
        }
        
        if (consulta.diagnostico) {
          console.log(`   🔍 Diagnóstico: ${consulta.diagnostico}`);
        }
        
        if (consulta.tratamiento) {
          console.log(`   💊 Tratamiento: ${consulta.tratamiento}`);
        }
        
        console.log(`   📅 Creado: ${consulta.created_at || 'N/A'}`);
        console.log('   ' + '-'.repeat(60));
      });
      
      // Estadísticas por estado
      const estados = {};
      consultas.forEach(consulta => {
        const estado = consulta.estado || 'Sin estado';
        estados[estado] = (estados[estado] || 0) + 1;
      });
      
      console.log('\n📊 ESTADÍSTICAS POR ESTADO:'.title);
      Object.entries(estados).forEach(([estado, cantidad]) => {
        console.log(`   ${estado}: ${cantidad} consultas`.info);
      });
      
      // Estadísticas por especialidad
      const especialidades = {};
      consultas.forEach(consulta => {
        const especialidad = consulta.especialidad_nombre || 'Sin especialidad';
        especialidades[especialidad] = (especialidades[especialidad] || 0) + 1;
      });
      
      console.log('\n🏥 ESTADÍSTICAS POR ESPECIALIDAD:'.title);
      Object.entries(especialidades).forEach(([especialidad, cantidad]) => {
        console.log(`   ${especialidad}: ${cantidad} consultas`.info);
      });
    }
    
    await connection.end();
    console.log('\n✅ Conexión cerrada exitosamente'.success);
    
  } catch (error) {
    console.log(`❌ Error consultando consultas: ${error.message}`.error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Verifica que el contenedor de MySQL de Guayaquil esté ejecutándose'.warning);
      console.log('   Comando: docker-compose up -d mysql-guayaquil'.info);
    }
  }
}

consultarConsultasGuayaquil();
