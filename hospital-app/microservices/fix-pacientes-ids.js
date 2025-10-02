const fs = require('fs');
const path = require('path');

// Leer el archivo admin-service/index.js
const filePath = path.join(__dirname, 'admin-service', 'index.js');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Corrigiendo IDs únicos globales en admin-service...');

// Buscar y reemplazar la función GET /pacientes
const oldPattern = `  try {
    const pacientes = [];
    
    // Obtener pacientes de cada centro
    for (const [centro, pool] of Object.entries(pools)) {
      const [rows] = await pool.query(\`
        SELECT p.*, cm.nombre as centro_nombre, cm.ciudad
        FROM pacientes p
        LEFT JOIN centros_medicos cm ON cm.id = p.id_centro
        ORDER BY p.id
      \`);
      
      // Agregar información de origen
      const pacientesConOrigen = rows.map(paciente => ({
        ...paciente,
        origen_bd: centro,
        id_frontend: \`\${centro}-\${paciente.id}\`
      }));
      
      pacientes.push(...pacientesConOrigen);
    }
    
    res.json(pacientes);`;

const newPattern = `  try {
    const pacientes = [];
    let idGlobal = 1;
    
    // Obtener pacientes de cada centro con ID único global
    for (const [centro, pool] of Object.entries(pools)) {
      const [rows] = await pool.query(\`
        SELECT p.*, cm.nombre as centro_nombre, cm.ciudad
        FROM pacientes p
        LEFT JOIN centros_medicos cm ON cm.id = p.id_centro
        ORDER BY p.id
      \`);
      
      // Agregar información de origen y ID único global
      const pacientesConOrigen = rows.map(paciente => ({
        ...paciente,
        id: idGlobal++, // ID único global para el frontend
        id_original: paciente.id, // ID original de la base de datos
        origen_bd: centro,
        id_frontend: \`\${centro}-\${paciente.id}\`
      }));
      
      pacientes.push(...pacientesConOrigen);
    }
    
    res.json(pacientes);`;

// Reemplazar solo la segunda ocurrencia (la que está en la línea 546)
const lines = content.split('\n');
let foundFirst = false;
let inReplacement = false;
let replacementStart = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('app.get(\'/pacientes\', authenticateToken, requireAdmin, async (req, res) => {')) {
    if (!foundFirst) {
      foundFirst = true;
      continue;
    }
    // Segunda ocurrencia encontrada
    replacementStart = i;
    break;
  }
}

if (replacementStart !== -1) {
  // Encontrar el final de la función
  let braceCount = 0;
  let replacementEnd = replacementStart;
  let inFunction = false;
  
  for (let i = replacementStart; i < lines.length; i++) {
    if (lines[i].includes('app.get(\'/pacientes\'')) {
      inFunction = true;
    }
    
    if (inFunction) {
      for (const char of lines[i]) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }
      
      if (braceCount === 0 && lines[i].includes('});')) {
        replacementEnd = i;
        break;
      }
    }
  }
  
  // Reemplazar las líneas
  const newLines = [
    ...lines.slice(0, replacementStart),
    "app.get('/pacientes', authenticateToken, requireAdmin, async (req, res) => {",
    "  try {",
    "    const pacientes = [];",
    "    let idGlobal = 1;",
    "    ",
    "    // Obtener pacientes de cada centro con ID único global",
    "    for (const [centro, pool] of Object.entries(pools)) {",
    "      const [rows] = await pool.query(`",
    "        SELECT p.*, cm.nombre as centro_nombre, cm.ciudad",
    "        FROM pacientes p",
    "        LEFT JOIN centros_medicos cm ON cm.id = p.id_centro",
    "        ORDER BY p.id",
    "      `);",
    "      ",
    "      // Agregar información de origen y ID único global",
    "      const pacientesConOrigen = rows.map(paciente => ({",
    "        ...paciente,",
    "        id: idGlobal++, // ID único global para el frontend",
    "        id_original: paciente.id, // ID original de la base de datos",
    "        origen_bd: centro,",
    "        id_frontend: `${centro}-${paciente.id}`",
    "      }));",
    "      ",
    "      pacientes.push(...pacientesConOrigen);",
    "    }",
    "    ",
    "    res.json(pacientes);",
    "  } catch (error) {",
    "    logger.error('Error obteniendo pacientes:', error);",
    "    res.status(500).json({ error: 'Error interno del servidor' });",
    "  }",
    "});",
    ...lines.slice(replacementEnd + 1)
  ];
  
  const newContent = newLines.join('\n');
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log('✅ Archivo modificado exitosamente');
} else {
  console.log('❌ No se encontró la función GET /pacientes');
}

console.log('🎉 Corrección completada');

