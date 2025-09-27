# 📋 README - Validaciones del Sistema Hospitalario

## 🏥 HospitalApp - Sistema de Gestión Hospitalaria

Este documento detalla todas las validaciones implementadas y recomendadas para el sistema hospitalario, tanto en el backend como en el frontend.

---

## 📊 Resumen Ejecutivo

### ✅ Validaciones Implementadas
- **Backend**: Validaciones básicas de campos obligatorios, tipos de datos y relaciones
- **Frontend**: Validaciones HTML5 básicas y controles de formulario
- **Base de Datos**: Restricciones de integridad referencial

### ⚠️ Validaciones Faltantes Críticas
- **Validaciones de longitud mínima/máxima** para nombres y textos
- **Validaciones de formato** para emails, fechas y datos médicos
- **Validaciones de negocio** específicas del dominio hospitalario
- **Sanitización de datos** para prevenir inyecciones
- **Validaciones de seguridad** adicionales

---

## 🔧 Backend - Validaciones Actuales

### 1. Controlador de Consultas (`/routes/consultas.ts`)

#### ✅ Implementadas:
```typescript
// Campos obligatorios
if (!id_medico || !paciente_nombre || !paciente_apellido || !fecha) {
  return res.status(400).json({ error: "Campos obligatorios faltantes" });
}

// Validación de duración
if (estado === 'programada' || estado === 'completada') {
  if (!duracion_minutos || duracion_minutos <= 0) {
    return res.status(400).json({ error: "Duración obligatoria" });
  }
  if (duracion_minutos > 480) {
    return res.status(400).json({ error: "Duración máxima 8 horas" });
  }
}

// Validación de ID
if (isNaN(id) || id <= 0) {
  return res.status(400).json({ error: "ID inválido" });
}
```

#### ❌ Faltantes:
- Validación de longitud de nombres (mínimo 2 caracteres)
- Validación de formato de fecha
- Validación de caracteres especiales en nombres
- Sanitización de texto para prevenir XSS

### 2. Controlador de Médicos (`/controllers/medicos.controller.ts`)

#### ✅ Implementadas:
```typescript
// Campos obligatorios
if (!nombres?.trim() || !apellidos?.trim() || !id_especialidad || !id_centro) {
  return res.status(400).json({ error: "Campos obligatorios faltantes" });
}

// Validación de existencia de centro
const centros = await query("SELECT id FROM centros_medicos WHERE id = ?", [Number(id_centro)]);
if (centros.length === 0) return res.status(400).json({ error: "Centro no existe" });

// Validación de existencia de especialidad
const especialidades = await query("SELECT id FROM especialidades WHERE id = ?", [Number(id_especialidad)]);
if (especialidades.length === 0) return res.status(400).json({ error: "Especialidad no existe" });
```

#### ❌ Faltantes:
- Validación de longitud de nombres (2-50 caracteres)
- Validación de caracteres permitidos (solo letras y espacios)
- Validación de nombres duplicados

### 3. Controlador de Usuarios (`/controllers/usuarios.controller.ts`)

#### ✅ Implementadas:
```typescript
// Campos obligatorios
if (!email?.trim() || !password?.trim() || !rol || !id_centro) {
  return res.status(400).json({ error: "Campos obligatorios faltantes" });
}

// Validación de rol
if (!['admin', 'medico'].includes(rol)) {
  return res.status(400).json({ error: "Rol inválido" });
}

// Validación de email único
const existingUsers = await query("SELECT id FROM usuarios WHERE email = ?", [email.trim()]);
if (existingUsers.length > 0) {
  return res.status(409).json({ error: "Email ya registrado" });
}
```

#### ❌ Faltantes:
- Validación de formato de email
- Validación de fortaleza de contraseña
- Validación de longitud de contraseña (mínimo 8 caracteres)

---

## 🎨 Frontend - Validaciones Actuales

### 1. Página de Login (`/pages/LoginPage.tsx`)

#### ✅ Implementadas:
```typescript
// Validación HTML5
<input
  type="email"
  required
  value={formData.email}
  onChange={handleInputChange}
  placeholder="usuario@hospital.com"
/>

<input
  type="password"
  required
  value={formData.password}
  onChange={handleInputChange}
/>
```

#### ❌ Faltantes:
- Validación de formato de email en tiempo real
- Validación de longitud mínima de contraseña
- Indicadores visuales de fortaleza de contraseña

### 2. Página de Consultas (`/pages/ConsultasPage.tsx`)

#### ✅ Implementadas:
```typescript
// Campos obligatorios
<input
  type="text"
  required
  value={formData.paciente_nombre || ''}
  onChange={(e) => setFormData((prev) => ({ ...prev, paciente_nombre: e.target.value }))}
/>

// Validación condicional de fecha
<input
  type="datetime-local"
  required={formData.estado === 'programada'}
  value={formData.fecha || ''}
  onChange={(e) => setFormData((prev) => ({ ...prev, fecha: e.target.value }))}
/>
```

#### ❌ Faltantes:
- Validación de longitud de nombres (mínimo 3 caracteres)
- Validación de formato de fecha (no fechas pasadas para programadas)
- Validación de caracteres especiales en nombres
- Validación de duración mínima/máxima

### 3. Páginas de Administración

#### ✅ Implementadas:
- Campos `required` en formularios
- Validación de selección de opciones

#### ❌ Faltantes:
- Validaciones de longitud y formato
- Validaciones de negocio específicas
- Mensajes de error descriptivos

---

## 🚨 Validaciones Críticas Faltantes

### 1. **Validaciones de Datos Personales**

#### Nombres y Apellidos
```typescript
// IMPLEMENTAR:
const validateName = (name: string): boolean => {
  if (!name || name.trim().length < 2) return false;
  if (name.trim().length > 50) return false;
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name)) return false;
  return true;
};
```

#### Email
```typescript
// IMPLEMENTAR:
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 150;
};
```

### 2. **Validaciones de Datos Médicos**

#### Fechas de Consulta
```typescript
// IMPLEMENTAR:
const validateConsultationDate = (date: string, estado: string): boolean => {
  const consultDate = new Date(date);
  const now = new Date();
  
  // No permitir fechas pasadas para consultas programadas
  if (estado === 'programada' && consultDate < now) return false;
  
  // No permitir fechas muy futuras (máximo 1 año)
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  if (consultDate > oneYearFromNow) return false;
  
  return true;
};
```

#### Duración de Consultas
```typescript
// IMPLEMENTAR:
const validateDuration = (minutes: number, estado: string): boolean => {
  if (estado === 'programada' || estado === 'completada') {
    return minutes >= 15 && minutes <= 480; // 15 min - 8 horas
  }
  return true;
};
```

### 3. **Validaciones de Seguridad**

#### Contraseñas
```typescript
// IMPLEMENTAR:
const validatePassword = (password: string): boolean => {
  if (password.length < 8) return false;
  if (password.length > 128) return false;
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return false;
  return true;
};
```

#### Sanitización de Texto
```typescript
// IMPLEMENTAR:
const sanitizeText = (text: string): string => {
  return text
    .replace(/[<>]/g, '') // Remover < y >
    .replace(/javascript:/gi, '') // Remover javascript:
    .trim();
};
```

---

## 📋 Plan de Implementación

### Fase 1: Validaciones Básicas (Prioridad Alta)
1. **Nombres y Apellidos**
   - Longitud mínima: 2 caracteres
   - Longitud máxima: 50 caracteres
   - Solo letras, espacios y acentos

2. **Email**
   - Formato válido de email
   - Longitud máxima: 150 caracteres

3. **Fechas**
   - No fechas pasadas para consultas programadas
   - Límite de 1 año en el futuro

### Fase 2: Validaciones de Negocio (Prioridad Media)
1. **Duración de Consultas**
   - Mínimo: 15 minutos
   - Máximo: 8 horas (480 minutos)

2. **Contraseñas**
   - Mínimo: 8 caracteres
   - Debe incluir mayúsculas, minúsculas y números

3. **Validaciones de Horarios**
   - Horarios de atención del hospital
   - Días laborables

### Fase 3: Validaciones Avanzadas (Prioridad Baja)
1. **Sanitización de Datos**
   - Prevención de XSS
   - Limpieza de caracteres especiales

2. **Validaciones de Integridad**
   - Verificación de duplicados
   - Validaciones de consistencia

---

## 🛠️ Implementación Recomendada

### Backend - Middleware de Validación
```typescript
// Crear: src/middlewares/validation.ts
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateConsultation = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    paciente_nombre: Joi.string().min(2).max(50).pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).required(),
    paciente_apellido: Joi.string().min(2).max(50).pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).required(),
    fecha: Joi.date().min('now').max('+1y').required(),
    duracion_minutos: Joi.number().min(15).max(480).required(),
    motivo: Joi.string().max(500).optional(),
    diagnostico: Joi.string().max(1000).optional(),
    tratamiento: Joi.string().max(1000).optional(),
    estado: Joi.string().valid('pendiente', 'programada', 'completada', 'cancelada').required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};
```

### Frontend - Hook de Validación
```typescript
// Crear: src/hooks/useValidation.ts
import { useState } from 'react';

export const useValidation = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateName = (name: string): boolean => {
    if (!name || name.trim().length < 2) {
      setErrors(prev => ({ ...prev, name: 'El nombre debe tener al menos 2 caracteres' }));
      return false;
    }
    if (name.trim().length > 50) {
      setErrors(prev => ({ ...prev, name: 'El nombre no puede exceder 50 caracteres' }));
      return false;
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name)) {
      setErrors(prev => ({ ...prev, name: 'El nombre solo puede contener letras y espacios' }));
      return false;
    }
    setErrors(prev => ({ ...prev, name: '' }));
    return true;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrors(prev => ({ ...prev, email: 'Formato de email inválido' }));
      return false;
    }
    if (email.length > 150) {
      setErrors(prev => ({ ...prev, email: 'El email no puede exceder 150 caracteres' }));
      return false;
    }
    setErrors(prev => ({ ...prev, email: '' }));
    return true;
  };

  return { errors, validateName, validateEmail };
};
```

---

## 📊 Métricas de Validación

### Campos Críticos por Módulo

| Módulo | Campo | Validación Actual | Validación Requerida | Prioridad |
|--------|-------|-------------------|---------------------|-----------|
| Consultas | paciente_nombre | ✅ Requerido | ❌ Longitud + Formato | 🔴 Alta |
| Consultas | paciente_apellido | ✅ Requerido | ❌ Longitud + Formato | 🔴 Alta |
| Consultas | fecha | ✅ Requerido | ❌ Rango de fechas | 🔴 Alta |
| Consultas | duracion_minutos | ✅ Rango 0-480 | ✅ Implementada | 🟢 OK |
| Usuarios | email | ✅ Requerido | ❌ Formato + Longitud | 🔴 Alta |
| Usuarios | password | ✅ Requerido | ❌ Fortaleza | 🔴 Alta |
| Médicos | nombres | ✅ Requerido | ❌ Longitud + Formato | 🟡 Media |
| Médicos | apellidos | ✅ Requerido | ❌ Longitud + Formato | 🟡 Media |

---

## 🎯 Conclusión

El sistema actual tiene **validaciones básicas** implementadas, pero carece de **validaciones robustas** necesarias para un entorno hospitalario. Se recomienda implementar las validaciones faltantes en **3 fases** para mejorar la seguridad, integridad de datos y experiencia del usuario.

### Próximos Pasos:
1. Implementar validaciones de Fase 1 (Prioridad Alta)
2. Crear middleware de validación en backend
3. Desarrollar hooks de validación en frontend
4. Agregar tests de validación
5. Documentar casos de uso específicos

---

**📅 Última actualización:** $(date)  
**👨‍💻 Desarrollado por:** Equipo de Desarrollo HospitalApp  
**📧 Contacto:** dev@hospitalapp.com
