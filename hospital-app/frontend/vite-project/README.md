# Sistema de Gestión Hospitalaria - Frontend

## Descripción
Frontend del sistema de gestión hospitalaria construido con React, TypeScript y Vite. Incluye módulos de reportes y gestión de usuarios con roles diferenciados.

## Estructura del Proyecto

```
src/
├── api/                    # Llamadas axios/fetch
├── components/             # UI reusables
│   ├── ui/                # Componentes base
│   └── reports/           # Componentes específicos de reportes
├── layouts/              # Estructuras de páginas
├── pages/                # Componentes de páginas
│   ├── admin/           # CRUDS: centros, médicos, especialidades, empleados
│   └── medico/          # Consultas del médico
├── routes/              # React Router config
├── store/               # Zustand para estado global (user, auth)
├── types/               # Tipos TypeScript
├── lib/                 # Utilidades
├── config/              # Configuración
├── App.tsx              # Componente principal
└── main.tsx             # Punto de entrada
```

## Tecnologías

- **React 19.1.1** - Framework principal
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Tailwind CSS 4.1.12** - Estilos utilitarios
- **React Router DOM 7.8.2** - Enrutamiento
- **Zustand** - Estado global
- **Recharts** - Gráficos y visualizaciones
- **Lucide React** - Iconos

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Construcción

```bash
npm run build
```

## Funcionalidades

### Admin UI
- Tablas con datos de reportes
- Formularios CRUD
- Reportes con Chart.js (Recharts)
- Dashboard con estadísticas

### Médico UI
- Agenda de consultas
- CRUD propio
- Dashboard pequeño

### Control de Rutas
- Basado en roles (ej: si rol === 'medico' → solo rutas de médico)