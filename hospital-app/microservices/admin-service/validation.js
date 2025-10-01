// Middleware de validación para Admin Service
const validateMedico = (req, res, next) => {
  const { nombres, apellidos, cedula, id_especialidad, id_centro } = req.body;
  
  // Validar campos requeridos
  if (!nombres || !apellidos || !cedula || !id_especialidad || !id_centro) {
    return res.status(400).json({ 
      error: 'Faltan campos requeridos',
      required: ['nombres', 'apellidos', 'cedula', 'id_especialidad', 'id_centro']
    });
  }
  
  // Validar formato de cédula (básico)
  if (typeof cedula !== 'string' || cedula.trim().length < 5) {
    return res.status(400).json({ 
      error: 'Cédula inválida. Debe tener al menos 5 caracteres' 
    });
  }
  
  // Validar centro médico
  if (![1, 2, 3].includes(parseInt(id_centro))) {
    return res.status(400).json({ 
      error: 'Centro médico inválido. Debe ser 1, 2 o 3' 
    });
  }
  
  // Validar ID de especialidad (básico)
  if (!Number.isInteger(parseInt(id_especialidad)) || parseInt(id_especialidad) < 1) {
    return res.status(400).json({ 
      error: 'ID de especialidad inválido' 
    });
  }
  
  next();
};

const validateEspecialidad = (req, res, next) => {
  const { nombre, id_centro } = req.body;
  
  if (!nombre || !id_centro) {
    return res.status(400).json({ 
      error: 'Faltan campos requeridos',
      required: ['nombre', 'id_centro']
    });
  }
  
  // Validar nombre de especialidad
  if (nombre.length < 3 || nombre.length > 100) {
    return res.status(400).json({ 
      error: 'Nombre de especialidad debe tener entre 3 y 100 caracteres' 
    });
  }
  
  // Validar centro médico
  if (![1, 2, 3].includes(parseInt(id_centro))) {
    return res.status(400).json({ 
      error: 'Centro médico inválido. Debe ser 1, 2 o 3' 
    });
  }
  
  next();
};

const validatePaciente = (req, res, next) => {
  const { nombres, apellidos, cedula, telefono, email, fecha_nacimiento, genero, id_centro } = req.body;
  
  if (!nombres || !apellidos || !cedula || !id_centro) {
    return res.status(400).json({ 
      error: 'Faltan campos requeridos',
      required: ['nombres', 'apellidos', 'cedula', 'id_centro']
    });
  }
  
  // Validar formato de cédula
  if (!/^\d{10}$/.test(cedula)) {
    return res.status(400).json({ 
      error: 'Cédula inválida. Debe tener 10 dígitos numéricos' 
    });
  }
  
  // Validar email si se proporciona
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ 
      error: 'Email inválido' 
    });
  }
  
  // Validar teléfono si se proporciona
  if (telefono && !/^\d{10}$/.test(telefono.replace(/\D/g, ''))) {
    return res.status(400).json({ 
      error: 'Teléfono inválido. Debe tener 10 dígitos' 
    });
  }
  
  // Validar fecha de nacimiento si se proporciona
  if (fecha_nacimiento) {
    const fecha = new Date(fecha_nacimiento);
    const hoy = new Date();
    if (fecha >= hoy) {
      return res.status(400).json({ 
        error: 'Fecha de nacimiento debe ser anterior a hoy' 
      });
    }
  }
  
  // Validar género si se proporciona
  if (genero && !['M', 'F', 'O'].includes(genero)) {
    return res.status(400).json({ 
      error: 'Género inválido. Debe ser M, F u O' 
    });
  }
  
  // Validar centro médico
  if (![1, 2, 3].includes(parseInt(id_centro))) {
    return res.status(400).json({ 
      error: 'Centro médico inválido. Debe ser 1, 2 o 3' 
    });
  }
  
  next();
};

const validateEmpleado = (req, res, next) => {
  const { nombres, apellidos, cargo, id_centro } = req.body;
  
  if (!nombres || !apellidos || !cargo || !id_centro) {
    return res.status(400).json({ 
      error: 'Faltan campos requeridos',
      required: ['nombres', 'apellidos', 'cargo', 'id_centro']
    });
  }
  
  // Validar cargo
  if (cargo.length < 3 || cargo.length > 100) {
    return res.status(400).json({ 
      error: 'Cargo debe tener entre 3 y 100 caracteres' 
    });
  }
  
  // Validar centro médico
  if (![1, 2, 3].includes(parseInt(id_centro))) {
    return res.status(400).json({ 
      error: 'Centro médico inválido. Debe ser 1, 2 o 3' 
    });
  }
  
  next();
};

module.exports = {
  validateMedico,
  validateEspecialidad,
  validatePaciente,
  validateEmpleado
};
