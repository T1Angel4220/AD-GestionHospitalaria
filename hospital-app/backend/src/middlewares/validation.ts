// src/middlewares/validation.ts
import { Request, Response, NextFunction } from "express";

// Interfaces para validación
interface ValidationError {
  field: string;
  message: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Utilidades de validación
export class ValidationUtils {
  // Validar nombres (mínimo 2, máximo 50 caracteres, solo letras y espacios)
  static validateName(name: string, fieldName: string): ValidationError | null {
    if (!name || typeof name !== 'string') {
      return { field: fieldName, message: `${fieldName} es obligatorio` };
    }
    
    const trimmedName = name.trim();
    
    if (trimmedName.length < 2) {
      return { field: fieldName, message: `${fieldName} debe tener al menos 2 caracteres` };
    }
    
    if (trimmedName.length > 50) {
      return { field: fieldName, message: `${fieldName} no puede exceder 50 caracteres` };
    }
    
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(trimmedName)) {
      return { field: fieldName, message: `${fieldName} solo puede contener letras y espacios` };
    }
    
    return null;
  }

  // Validar email
  static validateEmail(email: string): ValidationError | null {
    if (!email || typeof email !== 'string') {
      return { field: 'email', message: 'Email es obligatorio' };
    }
    
    const trimmedEmail = email.trim();
    
    if (trimmedEmail.length > 150) {
      return { field: 'email', message: 'Email no puede exceder 150 caracteres' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return { field: 'email', message: 'Formato de email inválido' };
    }
    
    return null;
  }

  // Validar contraseña
  static validatePassword(password: string): ValidationError | null {
    if (!password || typeof password !== 'string') {
      return { field: 'password', message: 'Contraseña es obligatoria' };
    }
    
    if (password.length < 8) {
      return { field: 'password', message: 'La contraseña debe tener al menos 8 caracteres' };
    }
    
    if (password.length > 128) {
      return { field: 'password', message: 'La contraseña no puede exceder 128 caracteres' };
    }
    
    return null;
  }

  // Validar fecha de consulta
  static validateConsultationDate(date: string, estado: string): ValidationError | null {
    if (!date || typeof date !== 'string') {
      return { field: 'fecha', message: 'Fecha es obligatoria' };
    }
    
    const consultDate = new Date(date);
    const now = new Date();
    
    // Verificar que la fecha es válida
    if (isNaN(consultDate.getTime())) {
      return { field: 'fecha', message: 'Formato de fecha inválido' };
    }
    
    // Para consultas programadas, no permitir fechas pasadas
    if (estado === 'programada' && consultDate < now) {
      return { field: 'fecha', message: 'No se pueden programar consultas en fechas pasadas' };
    }
    
    // No permitir fechas muy futuras (máximo 1 año)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    if (consultDate > oneYearFromNow) {
      return { field: 'fecha', message: 'No se pueden programar consultas con más de 1 año de anticipación' };
    }
    
    return null;
  }

  // Validar duración de consulta
  static validateDuration(minutes: number, estado: string): ValidationError | null {
    if (estado === 'programada' || estado === 'completada') {
      if (!minutes || minutes <= 0) {
        return { field: 'duracion_minutos', message: 'La duración es obligatoria para consultas programadas o completadas' };
      }
      
      if (minutes < 15) {
        return { field: 'duracion_minutos', message: 'La duración mínima es 15 minutos' };
      }
      
      if (minutes > 480) {
        return { field: 'duracion_minutos', message: 'La duración máxima es 8 horas (480 minutos)' };
      }
    }
    
    return null;
  }

  // Validar texto médico (motivo, diagnóstico, tratamiento)
  static validateMedicalText(text: string, fieldName: string, maxLength: number = 1000): ValidationError | null {
    if (text && typeof text === 'string') {
      if (text.length > maxLength) {
        return { field: fieldName, message: `${fieldName} no puede exceder ${maxLength} caracteres` };
      }
      
      // Sanitizar texto para prevenir XSS
      const sanitized = text.replace(/[<>]/g, '').replace(/javascript:/gi, '');
      if (sanitized !== text) {
        return { field: fieldName, message: `${fieldName} contiene caracteres no permitidos` };
      }
    }
    
    return null;
  }

  // Validar ID numérico
  static validateId(id: any, fieldName: string): ValidationError | null {
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId <= 0) {
      return { field: fieldName, message: `${fieldName} debe ser un número válido mayor a 0` };
    }
    return null;
  }

  // Validar rol
  static validateRole(rol: string): ValidationError | null {
    if (!rol || typeof rol !== 'string') {
      return { field: 'rol', message: 'Rol es obligatorio' };
    }
    
    if (!['admin', 'medico'].includes(rol)) {
      return { field: 'rol', message: 'Rol debe ser "admin" o "medico"' };
    }
    
    return null;
  }

  // Sanitizar texto
  static sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/[<>]/g, '') // Remover < y >
      .replace(/javascript:/gi, '') // Remover javascript:
      .replace(/on\w+=/gi, '') // Remover event handlers
      .trim();
  }
}

// Middleware para validar consultas
export const validateConsultation = (req: Request, res: Response, next: NextFunction) => {
  const errors: ValidationError[] = [];
  const { paciente_nombre, paciente_apellido, fecha, motivo, diagnostico, tratamiento, estado, duracion_minutos } = req.body;

  // Validar nombres
  const nombreError = ValidationUtils.validateName(paciente_nombre, 'paciente_nombre');
  if (nombreError) errors.push(nombreError);

  const apellidoError = ValidationUtils.validateName(paciente_apellido, 'paciente_apellido');
  if (apellidoError) errors.push(apellidoError);

  // Validar fecha
  const fechaError = ValidationUtils.validateConsultationDate(fecha, estado);
  if (fechaError) errors.push(fechaError);

  // Validar duración
  const duracionError = ValidationUtils.validateDuration(duracion_minutos, estado);
  if (duracionError) errors.push(duracionError);

  // Validar textos médicos
  const motivoError = ValidationUtils.validateMedicalText(motivo, 'motivo', 500);
  if (motivoError) errors.push(motivoError);

  const diagnosticoError = ValidationUtils.validateMedicalText(diagnostico, 'diagnostico', 1000);
  if (diagnosticoError) errors.push(diagnosticoError);

  const tratamientoError = ValidationUtils.validateMedicalText(tratamiento, 'tratamiento', 1000);
  if (tratamientoError) errors.push(tratamientoError);

  // Validar estado
  if (estado && !['pendiente', 'programada', 'completada', 'cancelada'].includes(estado)) {
    errors.push({ field: 'estado', message: 'Estado debe ser: pendiente, programada, completada o cancelada' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Datos de consulta inválidos', 
      details: errors 
    });
  }

  // Sanitizar datos antes de continuar
  req.body.paciente_nombre = ValidationUtils.sanitizeText(paciente_nombre);
  req.body.paciente_apellido = ValidationUtils.sanitizeText(paciente_apellido);
  req.body.motivo = ValidationUtils.sanitizeText(motivo);
  req.body.diagnostico = ValidationUtils.sanitizeText(diagnostico);
  req.body.tratamiento = ValidationUtils.sanitizeText(tratamiento);

  next();
};

// Middleware para validar médicos
export const validateMedico = (req: Request, res: Response, next: NextFunction) => {
  const errors: ValidationError[] = [];
  const { nombres, apellidos, id_especialidad, id_centro } = req.body;

  // Validar nombres
  const nombreError = ValidationUtils.validateName(nombres, 'nombres');
  if (nombreError) errors.push(nombreError);

  const apellidoError = ValidationUtils.validateName(apellidos, 'apellidos');
  if (apellidoError) errors.push(apellidoError);

  // Validar IDs
  const especialidadError = ValidationUtils.validateId(id_especialidad, 'id_especialidad');
  if (especialidadError) errors.push(especialidadError);

  const centroError = ValidationUtils.validateId(id_centro, 'id_centro');
  if (centroError) errors.push(centroError);

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Datos de médico inválidos', 
      details: errors 
    });
  }

  // Sanitizar datos
  req.body.nombres = ValidationUtils.sanitizeText(nombres);
  req.body.apellidos = ValidationUtils.sanitizeText(apellidos);

  next();
};

// Middleware para validar usuarios
export const validateUsuario = (req: Request, res: Response, next: NextFunction) => {
  const errors: ValidationError[] = [];
  const { email, password, rol, id_centro, id_medico } = req.body;

  // Validar email
  const emailError = ValidationUtils.validateEmail(email);
  if (emailError) errors.push(emailError);

  // Validar contraseña
  const passwordError = ValidationUtils.validatePassword(password);
  if (passwordError) errors.push(passwordError);

  // Validar rol
  const rolError = ValidationUtils.validateRole(rol);
  if (rolError) errors.push(rolError);

  // Validar centro
  const centroError = ValidationUtils.validateId(id_centro, 'id_centro');
  if (centroError) errors.push(centroError);

  // Validar médico si es necesario
  if (rol === 'medico' && id_medico) {
    const medicoError = ValidationUtils.validateId(id_medico, 'id_medico');
    if (medicoError) errors.push(medicoError);
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Datos de usuario inválidos', 
      details: errors 
    });
  }

  // Sanitizar email
  req.body.email = email.trim().toLowerCase();

  next();
};

// Middleware para validar empleados
export const validateEmpleado = (req: Request, res: Response, next: NextFunction) => {
  const errors: ValidationError[] = [];
  const { nombres, apellidos, cargo, id_centro } = req.body;

  // Validar nombres
  const nombreError = ValidationUtils.validateName(nombres, 'nombres');
  if (nombreError) errors.push(nombreError);

  const apellidoError = ValidationUtils.validateName(apellidos, 'apellidos');
  if (apellidoError) errors.push(apellidoError);

  // Validar cargo
  if (!cargo || typeof cargo !== 'string') {
    errors.push({ field: 'cargo', message: 'Cargo es obligatorio' });
  } else {
    const trimmedCargo = cargo.trim();
    if (trimmedCargo.length < 2) {
      errors.push({ field: 'cargo', message: 'Cargo debe tener al menos 2 caracteres' });
    } else if (trimmedCargo.length > 100) {
      errors.push({ field: 'cargo', message: 'Cargo no puede exceder 100 caracteres' });
    }
  }

  // Validar centro
  const centroError = ValidationUtils.validateId(id_centro, 'id_centro');
  if (centroError) errors.push(centroError);

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Datos de empleado inválidos', 
      details: errors 
    });
  }

  // Sanitizar datos
  req.body.nombres = ValidationUtils.sanitizeText(nombres);
  req.body.apellidos = ValidationUtils.sanitizeText(apellidos);
  req.body.cargo = ValidationUtils.sanitizeText(cargo);

  next();
};

// Middleware para validar centros médicos
export const validateCentro = (req: Request, res: Response, next: NextFunction) => {
  const errors: ValidationError[] = [];
  const { nombre, ciudad, direccion } = req.body;

  // Validar nombre
  if (!nombre || typeof nombre !== 'string') {
    errors.push({ field: 'nombre', message: 'Nombre del centro es obligatorio' });
  } else {
    const trimmedNombre = nombre.trim();
    if (trimmedNombre.length < 2) {
      errors.push({ field: 'nombre', message: 'Nombre debe tener al menos 2 caracteres' });
    } else if (trimmedNombre.length > 150) {
      errors.push({ field: 'nombre', message: 'Nombre no puede exceder 150 caracteres' });
    }
  }

  // Validar ciudad
  if (!ciudad || typeof ciudad !== 'string') {
    errors.push({ field: 'ciudad', message: 'Ciudad es obligatoria' });
  } else {
    const trimmedCiudad = ciudad.trim();
    if (trimmedCiudad.length < 2) {
      errors.push({ field: 'ciudad', message: 'Ciudad debe tener al menos 2 caracteres' });
    } else if (trimmedCiudad.length > 100) {
      errors.push({ field: 'ciudad', message: 'Ciudad no puede exceder 100 caracteres' });
    }
  }

  // Validar dirección (opcional)
  if (direccion && typeof direccion === 'string') {
    const trimmedDireccion = direccion.trim();
    if (trimmedDireccion.length > 200) {
      errors.push({ field: 'direccion', message: 'Dirección no puede exceder 200 caracteres' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Datos de centro inválidos', 
      details: errors 
    });
  }

  // Sanitizar datos
  req.body.nombre = ValidationUtils.sanitizeText(nombre);
  req.body.ciudad = ValidationUtils.sanitizeText(ciudad);
  req.body.direccion = direccion ? ValidationUtils.sanitizeText(direccion) : null;

  next();
};

// Middleware para validar especialidades
export const validateEspecialidad = (req: Request, res: Response, next: NextFunction) => {
  const errors: ValidationError[] = [];
  const { nombre } = req.body;

  // Validar nombre
  if (!nombre || typeof nombre !== 'string') {
    errors.push({ field: 'nombre', message: 'Nombre de especialidad es obligatorio' });
  } else {
    const trimmedNombre = nombre.trim();
    if (trimmedNombre.length < 2) {
      errors.push({ field: 'nombre', message: 'Nombre debe tener al menos 2 caracteres' });
    } else if (trimmedNombre.length > 100) {
      errors.push({ field: 'nombre', message: 'Nombre no puede exceder 100 caracteres' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Datos de especialidad inválidos', 
      details: errors 
    });
  }

  // Sanitizar datos
  req.body.nombre = ValidationUtils.sanitizeText(nombre);

  next();
};
