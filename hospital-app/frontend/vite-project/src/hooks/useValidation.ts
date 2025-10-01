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
    console.log(`🔍 [VALIDATION] Validando ${fieldName}:`, { name, type: typeof name });
    
    if (!name || typeof name !== 'string') {
      console.log(`❌ [VALIDATION] ${fieldName} es obligatorio o no es string`);
      setError(fieldName, `${fieldName} es obligatorio`);
      return false;
    }
    
    const trimmedName = name.trim();
    
    if (trimmedName.length < 2) {
      console.log(`❌ [VALIDATION] ${fieldName} muy corto:`, trimmedName.length);
      setError(fieldName, `${fieldName} debe tener al menos 2 caracteres`);
      return false;
    }
    
    if (trimmedName.length > 50) {
      console.log(`❌ [VALIDATION] ${fieldName} muy largo:`, trimmedName.length);
      setError(fieldName, `${fieldName} no puede exceder 50 caracteres`);
      return false;
    }
    
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(trimmedName)) {
      console.log(`❌ [VALIDATION] ${fieldName} contiene caracteres inválidos:`, trimmedName);
      setError(fieldName, `${fieldName} solo puede contener letras y espacios`);
      return false;
    }
    
    console.log(`✅ [VALIDATION] ${fieldName} válido`);
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
    // Para consultas pendientes, la fecha es opcional
    if (estado === 'pendiente') {
      if (!date) {
        clearError('fecha');
        return true;
      }
    }
    
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
    // Para consultas pendientes, la duración es opcional
    if (estado === 'pendiente') {
      if (!minutes || minutes === 0) {
        clearError('duracion_minutos');
        return true;
      }
    }
    
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
    console.log('🔍 [VALIDATION] Validando consulta con datos:', formData);
    let isValid = true;
    
    // Validar nombres
    console.log('🔍 [VALIDATION] Validando nombres...');
    if (!validateName(formData.paciente_nombre, 'paciente_nombre')) {
      console.log('❌ [VALIDATION] Error en paciente_nombre');
      isValid = false;
    }
    if (!validateName(formData.paciente_apellido, 'paciente_apellido')) {
      console.log('❌ [VALIDATION] Error en paciente_apellido');
      isValid = false;
    }
    
    // Validar fecha
    console.log('🔍 [VALIDATION] Validando fecha...', { fecha: formData.fecha, estado: formData.estado });
    if (!validateConsultationDate(formData.fecha, formData.estado)) {
      console.log('❌ [VALIDATION] Error en fecha');
      isValid = false;
    }
    
    // Validar duración
    console.log('🔍 [VALIDATION] Validando duración...', { duracion: formData.duracion_minutos, estado: formData.estado });
    if (!validateDuration(formData.duracion_minutos, formData.estado)) {
      console.log('❌ [VALIDATION] Error en duración');
      isValid = false;
    }
    
    // Validar textos médicos
    console.log('🔍 [VALIDATION] Validando textos médicos...');
    if (formData.motivo && !validateMedicalText(formData.motivo, 'motivo', 500)) {
      console.log('❌ [VALIDATION] Error en motivo');
      isValid = false;
    }
    if (formData.diagnostico && !validateMedicalText(formData.diagnostico, 'diagnostico', 1000)) {
      console.log('❌ [VALIDATION] Error en diagnostico');
      isValid = false;
    }
    if (formData.tratamiento && !validateMedicalText(formData.tratamiento, 'tratamiento', 1000)) {
      console.log('❌ [VALIDATION] Error en tratamiento');
      isValid = false;
    }
    
    console.log('🔍 [VALIDATION] Resultado final:', { isValid, errors });
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

  // Validar cédula
  const validateCedula = useCallback((cedula: string): boolean => {
    if (!cedula || typeof cedula !== 'string') {
      setError('cedula', 'Cédula es obligatoria');
      return false;
    }
    
    const trimmedCedula = cedula.trim();
    
    if (trimmedCedula.length < 7) {
      setError('cedula', 'Cédula debe tener al menos 7 caracteres');
      return false;
    }
    
    if (trimmedCedula.length > 15) {
      setError('cedula', 'Cédula no puede exceder 15 caracteres');
      return false;
    }
    
    // Solo números
    if (!/^[0-9]+$/.test(trimmedCedula)) {
      setError('cedula', 'Cédula solo puede contener números');
      return false;
    }
    
    clearError('cedula');
    return true;
  }, [setError, clearError]);

  // Validar teléfono
  const validateTelefono = useCallback((telefono: string): boolean => {
    if (!telefono || typeof telefono !== 'string') {
      setError('telefono', 'Teléfono es obligatorio');
      return false;
    }
    
    const trimmedTelefono = telefono.trim();
    
    if (trimmedTelefono.length < 7) {
      setError('telefono', 'Teléfono debe tener al menos 7 caracteres');
      return false;
    }
    
    if (trimmedTelefono.length > 15) {
      setError('telefono', 'Teléfono no puede exceder 15 caracteres');
      return false;
    }
    
    // Solo números
    if (!/^[0-9]+$/.test(trimmedTelefono)) {
      setError('telefono', 'Teléfono solo puede contener números');
      return false;
    }
    
    clearError('telefono');
    return true;
  }, [setError, clearError]);

  // Validar email obligatorio
  const validateEmailRequired = useCallback((email: string): boolean => {
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

  // Validar fecha de nacimiento
  const validateFechaNacimiento = useCallback((fecha: string): boolean => {
    if (!fecha || typeof fecha !== 'string') {
      setError('fecha_nacimiento', 'Fecha de nacimiento es obligatoria');
      return false;
    }
    
    const fechaNacimiento = new Date(fecha);
    
    // Verificar que la fecha es válida
    if (isNaN(fechaNacimiento.getTime())) {
      setError('fecha_nacimiento', 'Formato de fecha inválido');
      return false;
    }
    
    // No permitir fechas futuras (incluyendo el día siguiente)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Establecer a medianoche
    if (fechaNacimiento >= hoy) {
      setError('fecha_nacimiento', 'La fecha de nacimiento debe ser anterior a hoy');
      return false;
    }
    
    // No permitir fechas muy antiguas (más de 120 años)
    const fechaLimite = new Date();
    fechaLimite.setFullYear(fechaLimite.getFullYear() - 120);
    if (fechaNacimiento < fechaLimite) {
      setError('fecha_nacimiento', 'La fecha de nacimiento no puede ser anterior a hace 120 años');
      return false;
    }
    
    clearError('fecha_nacimiento');
    return true;
  }, [setError, clearError]);

  // Validar género
  const validateGenero = useCallback((genero: string): boolean => {
    if (!genero || typeof genero !== 'string') {
      setError('genero', 'Género es obligatorio');
      return false;
    }
    
    if (!['M', 'F', 'O'].includes(genero)) {
      setError('genero', 'Género debe ser Masculino, Femenino u Otro');
      return false;
    }
    
    clearError('genero');
    return true;
  }, [setError, clearError]);

  // Validar dirección
  const validateDireccion = useCallback((direccion: string): boolean => {
    if (!direccion || typeof direccion !== 'string') {
      setError('direccion', 'Dirección es obligatoria');
      return false;
    }
    
    const trimmedDireccion = direccion.trim();
    
    if (trimmedDireccion.length > 200) {
      setError('direccion', 'Dirección no puede exceder 200 caracteres');
      return false;
    }
    
    clearError('direccion');
    return true;
  }, [setError, clearError]);

  // Validar formulario completo de paciente
  const validatePaciente = useCallback((formData: any): boolean => {
    let isValid = true;
    
    // Validar todos los campos (ahora todos son obligatorios)
    if (!validateName(formData.nombres, 'nombres')) isValid = false;
    if (!validateName(formData.apellidos, 'apellidos')) isValid = false;
    if (!validateCedula(formData.cedula)) isValid = false;
    if (!validateTelefono(formData.telefono)) isValid = false;
    if (!validateEmailRequired(formData.email)) isValid = false;
    if (!validateFechaNacimiento(formData.fecha_nacimiento)) isValid = false;
    if (!validateGenero(formData.genero)) isValid = false;
    if (!validateDireccion(formData.direccion)) isValid = false;
    if (!validateId(formData.id_centro, 'id_centro')) isValid = false;
    
    return isValid;
  }, [validateName, validateId, validateCedula, validateTelefono, validateEmailRequired, validateFechaNacimiento, validateGenero, validateDireccion]);

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
    validateCedula,
    validateTelefono,
    validateEmailRequired,
    validateFechaNacimiento,
    validateGenero,
    validateDireccion,
    sanitizeText,
    validateConsulta,
    validateMedico,
    validateUsuario,
    validateEmpleado,
    validateCentro,
    validateEspecialidadForm,
    validatePaciente
  };
};
