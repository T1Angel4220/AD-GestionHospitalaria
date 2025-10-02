const fs = require('fs');
const path = require('path');

// Leer el archivo admin-service/index.js
const filePath = path.join(__dirname, 'admin-service', 'index.js');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Eliminando ruta duplicada GET /pacientes...');

// Buscar y eliminar la primera ocurrencia de la ruta GET /pacientes
const lines = content.split('\n');
let foundFirst = false;
let startLine = -1;
let endLine = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('app.get(\'/pacientes\', authenticateToken, requireAdmin, async (req, res) => {')) {
    if (!foundFirst) {
      foundFirst = true;
      startLine = i;
      continue;
    }
    // Segunda ocurrencia encontrada, no eliminar esta
    break;
  }
}

if (startLine !== -1) {
  // Encontrar el final de la primera función
  let braceCount = 0;
  let inFunction = false;
  
  for (let i = startLine; i < lines.length; i++) {
    if (lines[i].includes('app.get(\'/pacientes\'')) {
      inFunction = true;
    }
    
    if (inFunction) {
      for (const char of lines[i]) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }
      
      if (braceCount === 0 && lines[i].includes('});')) {
        endLine = i;
        break;
      }
    }
  }
  
  if (endLine !== -1) {
    // Eliminar las líneas de la primera función
    const newLines = [
      ...lines.slice(0, startLine),
      ...lines.slice(endLine + 1)
    ];
    
    const newContent = newLines.join('\n');
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ Ruta duplicada eliminada (líneas ${startLine + 1}-${endLine + 1})`);
  } else {
    console.log('❌ No se pudo encontrar el final de la función');
  }
} else {
  console.log('❌ No se encontró la primera ruta GET /pacientes');
}

console.log('🎉 Limpieza completada');

