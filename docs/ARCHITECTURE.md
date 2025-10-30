# Documentación de Arquitectura

## Arquitectura del Sistema

### Estructura General

El sistema está dividido en dos componentes principales:

1. **Aplicación Móvil (Flutter)**
2. **Backend (Node.js/Express)**

### Patrón Arquitectónico

#### Aplicación Móvil
- **Patrón MVVM**: Model-View-ViewModel
- **Gestión de Estado**: Provider
- **Servicios**: Separación de lógica de negocio
- **Offline First**: Funcionalidad offline con sincronización

#### Backend
- **REST API**: Endpoints RESTful
- **MVC Pattern**: Modelos, Rutas, Controladores
- **MongoDB**: Base de datos NoSQL
- **WebSockets**: Actualizaciones en tiempo real

## Flujo de Datos

### Autenticación
1. Usuario ingresa credenciales
2. App envía a `/login`
3. Backend valida con bcrypt
4. Retorna token/sesión
5. App guarda sesión localmente

### Registro de Acceso
1. App lee NFC
2. Verifica datos localmente (offline)
3. Registra acceso en BD local
4. Sincroniza con backend cuando hay conexión
5. Backend guarda en MongoDB
6. Dashboard actualiza en tiempo real

## Componentes Principales

### Móvil
- **Models**: Estructuras de datos
- **Services**: Lógica de negocio y API
- **ViewModels**: Estado y lógica de UI
- **Views**: Interfaz de usuario
- **Widgets**: Componentes reutilizables

### Backend
- **Models**: Esquemas Mongoose
- **Routes**: Definición de endpoints
- **Controllers**: Lógica de endpoints
- **Middleware**: Autenticación, validación
- **Public**: Archivos estáticos

## Base de Datos

### MongoDB Collections
- `usuarios`: Usuarios del sistema
- `asistencias`: Registros de acceso
- `facultades`: Facultades universitarias
- `escuelas`: Escuelas profesionales
- `alumnos`: Estudiantes
- `sesiones_guardias`: Sesiones activas

