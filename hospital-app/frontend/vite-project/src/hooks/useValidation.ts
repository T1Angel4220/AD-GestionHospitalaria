// src/hooks/useValidation.ts
import { useState, useCallback } from 'react';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export const useValidation = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Limpiar errores de un campo específico
  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Limpiar todos los errores
  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Establecer error para un campo
  const setError = useCallback((field: string, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  // Validar nombres (mínimo 2, máximo 50 caracteres, solo letras y espacios)
  const validateName = useCallback((name: string, fieldName: string): boolean => {
    if (!name || typeof name !== 'string') {
      setError(fieldName, `${fieldName} es obligatorio`);
      return false;
    }
    
    const trimmedName = name.trim();
    
    if (trimmedName.length < 2) {
      setError(fieldName, `${fieldName} debe tener al menos 2 caracteres`);
      return false;
    }
    
    if (trimmedName.length > 50) {
      setError(fieldName, `${fieldName} no puede exceder 50 caracteres`);
      return false;
    }
    
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(trimmedName)) {
      setError(fieldName, `${fieldName} solo puede contener letras y espacios`);
      return false;
    }
    
    clearError(fieldName);
    return true;
  }, [setError, clearError]);

  // Validar email
  const validateEmail = useCallback((email: string): boolean => {
    if (!email || typeof email !== 'string') {
      setError('email', 'Email es obligatorio');
      return false;
    }
    
    const trimmedEmail = email.trim();
    
    if (trimmedEmail.length > 150) {
      setError('email', 'Email no puede exceder 150 caracteres');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('email', 'Formato de email inválido');
      return false;
    }
    
    clearError('email');
    return true;
  }, [setError, clearError]);

  // Validar contraseña
  const validatePassword = useCallback((password: string): boolean => {
    if (!password || typeof password !== 'string') {
      setError('password', 'Contraseña es obligatoria');
      return false;
    }
    
    if (password.length < 8) {
      setError('password', 'La contraseña debe tener al menos 8 caracteres');
      return false;
    }
    
    if (password.length > 128) {
      setError('password', 'La contraseña no puede exceder 128 caracteres');
      return false;
    }
    
    clearError('password');
    return true;
  }, [setError, clearError]);

  // Validar fecha de consulta
  const validateConsultationDate = useCallback((date: string, estado: string): boolean => {
    if (!date || typeof date !== 'string') {
      setError('fecha', 'Fecha es obligatoria');
      return false;
    }
    
    const consultDate = new Date(date);
    const now = new Date();
    
    // Verificar que la fecha es válida
    if (isNaN(consultDate.getTime())) {
      setError('fecha', 'Formato de fecha inválido');
      return false;
    }
    
    // Para consultas programadas, no permitir fechas pasadas
    if (estado === 'programada' && consultDate < now) {
      setError('fecha', 'No se pueden programar consultas en fechas pasadas');
      return false;
    }
    
    // No permitir fechas muy futuras (máximo 1 año)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    if (consultDate > oneYearFromNow) {
      setError('fecha', 'No se pueden programar consultas con más de 1 año de anticipación');
      return false;
    }
    
    clearError('fecha');
    return true;
  }, [setError, clearError]);

  // Validar duración de consulta
  const validateDuration = useCallback((minutes: number, estado: string): boolean => {
    if (estado === 'programada' || estado === 'completada') {
      if (!minutes || minutes <= 0) {
        setError('duracion_minutos', 'La duración es obligatoria para consultas programadas o completadas');
        return false;
      }
      
      if (minutes < 15) {
        setError('duracion_minutos', 'La duración mínima es 15 minutos');
        return false;
      }
      
      if (minutes > 480) {
        setError('duracion_minutos', 'La duración máxima es 8 horas (480 minutos)');
        return false;
      }
    }
    
    clearError('duracion_minutos');
    return true;
  }, [setError, clearError]);

  // Validar texto médico (motivo, diagnóstico, tratamiento)
  const validateMedicalText = useCallback((text: string, fieldName: string, maxLength: number = 1000): boolean => {
    if (text && typeof text === 'string') {
      if (text.length > maxLength) {
        setError(fieldName, `${fieldName} no puede exceder ${maxLength} caracteres`);
        return false;
      }
      
      // Sanitizar texto para prevenir XSS
      const sanitized = text.replace(/[<>]/g, '').replace(/javascript:/gi, '');
      if (sanitized !== text) {
        setError(fieldName, `${fieldName} contiene caracteres no permitidos`);
        return false;
      }
    }
    
    clearError(fieldName);
    return true;
  }, [setError, clearError]);

  // Validar ID numérico
  const validateId = useCallback((id: any, fieldName: string): boolean => {
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId <= 0) {
      setError(fieldName, `${fieldName} debe ser un número válido mayor a 0`);
      return false;
    }
    clearError(fieldName);
    return true;
  }, [setError, clearError]);

  // Validar rol
  const validateRole = useCallback((rol: string): boolean => {
    if (!rol || typeof rol !== 'string') {
      setError('rol', 'Rol es obligatorio');
      return false;
    }
    
    if (!['admin', 'medico'].includes(rol)) {
      setError('rol', 'Rol debe ser "admin" o "medico"');
      return false;
    }
    
    clearError('rol');
    return true;
  }, [setError, clearError]);

  // Validar cargo
  const validateCargo = useCallback((cargo: string): boolean => {
    if (!cargo || typeof cargo !== 'string') {
      setError('cargo', 'Cargo es obligatorio');
      return false;
    }
    
    const trimmedCargo = cargo.trim();
    if (trimmedCargo.length < 2) {
      setError('cargo', 'Cargo debe tener al menos 2 caracteres');
      return false;
    }
    
    if (trimmedCargo.length > 100) {
      setError('cargo', 'Cargo no puede exceder 100 caracteres');
      return false;
    }
    
    clearError('cargo');
    return true;
  }, [setError, clearError]);

  // Validar nombre de centro
  const validateCentroName = useCallback((nombre: string): boolean => {
    if (!nombre || typeof nombre !== 'string') {
      setError('nombre', 'Nombre del centro es obligatorio');
      return false;
    }
    
    const trimmedNombre = nombre.trim();
    if (trimmedNombre.length < 2) {
      setError('nombre', 'Nombre debe tener al menos 2 caracteres');
      return false;
    }
    
    if (trimmedNombre.length > 150) {
      setError('nombre', 'Nombre no puede exceder 150 caracteres');
      return false;
    }
    
    clearError('nombre');
    return true;
  }, [setError, clearError]);

  // Validar ciudad
  const validateCiudad = useCallback((ciudad: string): boolean => {
    if (!ciudad || typeof ciudad !== 'string') {
      setError('ciudad', 'Ciudad es obligatoria');
      return false;
    }
    
    const trimmedCiudad = ciudad.trim();
    if (trimmedCiudad.length < 2) {
      setError('ciudad', 'Ciudad debe tener al menos 2 caracteres');
      return false;
    }
    
    if (trimmedCiudad.length > 100) {
      setError('ciudad', 'Ciudad no puede exceder 100 caracteres');
      return false;
    }
    
    clearError('ciudad');
    return true;
  }, [setError, clearError]);

  // Validar especialidad
  const validateEspecialidad = useCallback((nombre: string): boolean => {
    if (!nombre || typeof nombre !== 'string') {
      setError('nombre', 'Nombre de especialidad es obligatorio');
      return false;
    }
    
    const trimmedNombre = nombre.trim();
    if (trimmedNombre.length < 2) {
      setError('nombre', 'Nombre debe tener al menos 2 caracteres');
      return false;
    }
    
    if (trimmedNombre.length > 100) {
      setError('nombre', 'Nombre no puede exceder 100 caracteres');
      return false;
    }
    
    clearError('nombre');
    return true;
  }, [setError, clearError]);

  // Sanitizar texto
  const sanitizeText = useCallback((text: string): string => {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/[<>]/g, '') // Remover < y >
      .replace(/javascript:/gi, '') // Remover javascript:
      .replace(/on\w+=/gi, '') // Remover event handlers
      .trim();
  }, []);

  // Validar formulario completo de consulta
  const validateConsulta = useCallback((formData: any): boolean => {
    let isValid = true;
    
    // Validar nombres
    if (!validateName(formData.paciente_nombre, 'paciente_nombre')) isValid = false;
    if (!validateName(formData.paciente_apellido, 'paciente_apellido')) isValid = false;
    
    // Validar fecha
    if (!validateConsultationDate(formData.fecha, formData.estado)) isValid = false;
    
    // Validar duración
    if (!validateDuration(formData.duracion_minutos, formData.estado)) isValid = false;
    
    // Validar textos médicos
    if (formData.motivo && !validateMedicalText(formData.motivo, 'motivo', 500)) isValid = false;
    if (formData.diagnostico && !validateMedicalText(formData.diagnostico, 'diagnostico', 1000)) isValid = false;
    if (formData.tratamiento && !validateMedicalText(formData.tratamiento, 'tratamiento', 1000)) isValid = false;
    
    return isValid;
  }, [validateName, validateConsultationDate, validateDuration, validateMedicalText]);

  // Validar formulario completo de médico
  const validateMedico = useCallback((formData: any): boolean => {
    let isValid = true;
    
    if (!validateName(formData.nombres, 'nombres')) isValid = false;
    if (!validateName(formData.apellidos, 'apellidos')) isValid = false;
    if (!validateId(formData.id_especialidad, 'id_especialidad')) isValid = false;
    if (!validateId(formData.id_centro, 'id_centro')) isValid = false;
    
    return isValid;
  }, [validateName, validateId]);

  // Validar formulario completo de usuario
  const validateUsuario = useCallback((formData: any): boolean => {
    let isValid = true;
    
    if (!validateEmail(formData.email)) isValid = false;
    if (!validatePassword(formData.password)) isValid = false;
    if (!validateRole(formData.rol)) isValid = false;
    if (!validateId(formData.id_centro, 'id_centro')) isValid = false;
    
    if (formData.rol === 'medico' && formData.id_medico) {
      if (!validateId(formData.id_medico, 'id_medico')) isValid = false;
    }
    
    return isValid;
  }, [validateEmail, validatePassword, validateRole, validateId]);

  // Validar formulario completo de empleado
  const validateEmpleado = useCallback((formData: any): boolean => {
    let isValid = true;
    
    if (!validateName(formData.nombres, 'nombres')) isValid = false;
    if (!validateName(formData.apellidos, 'apellidos')) isValid = false;
    if (!validateCargo(formData.cargo)) isValid = false;
    if (!validateId(formData.id_centro, 'id_centro')) isValid = false;
    
    return isValid;
  }, [validateName, validateCargo, validateId]);

  // Validar formulario completo de centro
  const validateCentro = useCallback((formData: any): boolean => {
    let isValid = true;
    
    if (!validateCentroName(formData.nombre)) isValid = false;
    if (!validateCiudad(formData.ciudad)) isValid = false;
    
    if (formData.direccion && formData.direccion.length > 200) {
      setError('direccion', 'Dirección no puede exceder 200 caracteres');
      isValid = false;
    } else {
      clearError('direccion');
    }
    
    return isValid;
  }, [validateCentroName, validateCiudad, setError, clearError]);

  // Validar formulario completo de especialidad
  const validateEspecialidadForm = useCallback((formData: any): boolean => {
    return validateEspecialidad(formData.nombre);
  }, [validateEspecialidad]);

  return {
    errors,
    clearError,
    clearAllErrors,
    setError,
    validateName,
    validateEmail,
    validatePassword,
    validateConsultationDate,
    validateDuration,
    validateMedicalText,
    validateId,
    validateRole,
    validateCargo,
    validateCentroName,
    validateCiudad,
    validateEspecialidad,
    sanitizeText,
    validateConsulta,
    validateMedico,
    validateUsuario,
    validateEmpleado,
    validateCentro,
    validateEspecialidadForm
  };
};
