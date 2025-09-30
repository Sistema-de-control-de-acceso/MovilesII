# Backend Completo - Sistema de Asistencias NFC

Backend completo para el sistema de control de asistencias con tecnología NFC, desarrollado con Node.js, Express y MongoDB Atlas. Soporta todas las funcionalidades avanzadas del sistema incluyendo sincronización bidireccional, manejo de múltiples guardias simultáneos, y sistema completo de reportes.

## 🚀 Tecnologías y Arquitectura

- **Node.js** v12+ - Runtime de JavaScript
- **Express.js** v4.18+ - Framework web minimalista y robusto
- **MongoDB Atlas** - Base de datos NoSQL en la nube
- **Mongoose** v6.11+ - ODM para MongoDB con validación de esquemas
- **bcrypt** v5.1+ - Encriptación segura de contraseñas
- **CORS** v2.8+ - Manejo de peticiones cross-origin
- **dotenv** v16.0+ - Gestión de variables de entorno

## 🏗️ Arquitectura del Sistema

### **Colecciones de Base de Datos (7)**
1. **usuarios** - Guardias y administradores del sistema
2. **alumnos** - Estudiantes y datos académicos 
3. **asistencias** - Registros completos de entrada/salida
4. **facultades** - Estructura académica de facultades
5. **escuelas** - Escuelas por facultad
6. **decisiones_manuales** - Casos especiales y excepciones
7. **sesiones_guardias** - Control de concurrencia múltiple
8. **presencia** - Estado actual de presencia en campus
9. **visitas_externos** - Registro de visitantes externos

### **Endpoints REST Implementados (25+)**
- **Autenticación**: Login, logout, cambio de contraseña
- **Usuarios**: CRUD completo de guardias y administradores
- **Alumnos**: Consulta y validación de estudiantes
- **Asistencias**: Registro completo de accesos
- **Sesiones**: Manejo de múltiples guardias simultáneos
- **Sincronización**: Bidireccional con resolución de conflictos
- **Reportes**: Estadísticas avanzadas y exportación
- **Backup**: Sistema automático de respaldo

## 📦 Instalación Local

1. Clona el repositorio
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura las variables de entorno:
   ```bash
   cp .env.example .env
   ```
4. Edita `.env` con tu conexión a MongoDB Atlas
5. Ejecuta el servidor:
   ```bash
   npm start
   ```

El servidor estará disponible en `http://localhost:3000`

## 🌐 Despliegue en Railway

### Paso 1: Preparación
1. Asegúrate de que todos los cambios estén en el repositorio de GitHub
2. Ve a [Railway.app](https://railway.app) y crea una cuenta
3. Conecta tu cuenta de GitHub

### Paso 2: Crear Proyecto
1. Haz clic en "New Project"
2. Selecciona "Deploy from GitHub repo"
3. Elige tu repositorio
4. Railway detectará automáticamente que es un proyecto Node.js

### Paso 3: Configurar Variables de Entorno
En el dashboard de Railway:
1. Ve a la pestaña "Variables"
2. Agrega las siguientes variables:
   - `MONGODB_URI`: Tu string de conexión a MongoDB Atlas
   - Railway asignará automáticamente `PORT`

### Paso 4: Desplegar
1. Railway comenzará el despliegue automáticamente
2. Obtendrás una URL como `https://tu-proyecto.railway.app`
3. Usa esta URL en tu aplicación Flutter

## 📱 Configuración Flutter

Después del despliegue, actualiza la URL en tu app Flutter:

1. Ve a `lib/config/api_config.dart`
2. Actualiza `_baseUrlProd` con tu URL de Railway
3. Cambia `_isProduction = true` para compilar la APK final

## 🔧 Endpoints Completos Implementados (25+)

### **Autenticación y Usuarios**
- `POST /login` - Autenticación de guardias/administradores  
- `GET /usuarios` - Lista todos los usuarios del sistema
- `POST /usuarios` - Crear nuevo usuario (guardia/admin)
- `PUT /usuarios/:id` - Actualizar datos de usuario
- `PUT /usuarios/:id/password` - Cambiar contraseña
- `GET /usuarios/:id` - Obtener usuario específico

### **Gestión de Estudiantes**
- `GET /alumnos` - Lista de todos los estudiantes
- `GET /alumnos/:codigo` - Buscar estudiante por código
- `GET /externos/:dni` - Buscar visitante externo por DNI

### **Control de Asistencias**
- `GET /asistencias` - Todos los registros de asistencia
- `POST /asistencias` - Registrar nueva asistencia  
- `POST /asistencias/completa` - Registro completo con validaciones
- `GET /asistencias/ultimo-acceso/:dni` - Último acceso de estudiante

### **Sesiones Múltiples de Guardias**
- `POST /sesiones/iniciar` - Iniciar sesión de guardia
- `POST /sesiones/heartbeat` - Mantener sesión activa
- `POST /sesiones/finalizar` - Finalizar sesión normal
- `GET /sesiones/activas` - Ver sesiones activas
- `POST /sesiones/forzar-finalizacion` - Forzar cierre por admin

### **Sincronización y Backup**
- `GET /sync/changes/:timestamp` - Obtener cambios desde fecha
- `POST /sync/upload` - Subir cambios del cliente  
- `POST /backup/create` - Crear backup automático

### **Reportes y Analytics**
- `GET /reportes/asistencias` - Reporte con filtros avanzados
- `GET /reportes/guardias` - Reporte de actividad de guardias

### **Sistema y Datos Académicos**
- `GET /health` - Estado de salud del servidor y BD
- `GET /facultades` - Lista de facultades
- `GET /escuelas` - Lista de escuelas por facultad
- `POST /decisiones-manuales` - Registrar decisión manual
- `GET /presencia` - Estado actual de presencia en campus

## 🔒 Seguridad Robusta Implementada

### **Autenticación Avanzada**
- Contraseñas encriptadas con bcrypt (salt rounds: 10)
- Validación de credenciales en tiempo real
- Control de acceso basado en roles (Guardia/Administrador)
- Sistema de tokens de sesión únicos

### **Protección de Datos**
- Variables de entorno para credenciales sensibles
- CORS configurado para peticiones seguras
- Validación de entrada en todos los endpoints
- Manejo robusto de errores con logging

### **Control de Concurrencia**
- Sistema de locks optimistas para múltiples guardias
- Heartbeat para mantener sesiones activas  
- Resolución automática de conflictos
- Timeouts configurables por seguridad

## � Base de Datos MongoDB Completa

### **9 Colecciones Implementadas**
1. **usuarios** - Guardias y administradores del sistema
2. **asistencias** - Registros completos de entrada/salida  
3. **alumnos** - Base de datos de estudiantes
4. **facultades** - Estructura académica de facultades
5. **escuelas** - Escuelas organizadas por facultad
6. **decisiones_manuales** - Casos especiales documentados
7. **sesiones_guardias** - Control de múltiples guardias simultáneos
8. **presencia** - Estado actual de presencia en campus
9. **visitas_externos** - Registro de visitantes

### **Optimizaciones de Rendimiento**
- Índices optimizados en consultas frecuentes
- Agregaciones eficientes para reportes
- Esquemas flexibles con validación
- Conexión persistente con pooling

## � Características Avanzadas

### **Sincronización Bidireccional**
- Detección automática de cambios desde timestamp
- Resolución inteligente de conflictos
- Upload de cambios del cliente móvil
- Versionado de datos para consistencia

### **Sistema de Backup Automático**  
- Backup programático de todas las colecciones
- Estadísticas de uso y conteo de registros
- Identificadores únicos de backup
- Restauración desde punto en tiempo

### **Reportes Inteligentes**
- Filtros múltiples por fecha, carrera, facultad
- Estadísticas automáticas por categoría  
- Agrupación de datos por facultad
- Métricas de desempeño de guardias

## 🛠️ Desarrollo y Deployment

### **Para Desarrollo Local**
```bash
npm install
npm run dev  # Servidor en puerto 3000
```

### **Para Producción en Railway**
1. ✅ Variables de entorno configuradas
2. ✅ Puerto dinámico asignado automáticamente  
3. ✅ Conexión MongoDB Atlas estable
4. ✅ Logs de sistema habilitados

## 📈 Monitoreo del Sistema

### **Endpoint de Salud (`/health`)**
- Estado de conexión a MongoDB Atlas
- Conteo de registros por colección
- Número de sesiones activas de guardias
- Timestamp y versión del API

### **Logging Automático**
- ✅ Conexiones exitosas a base de datos
- ✅ Autenticaciones de usuarios  
- ✅ Errores de operación detallados
- ✅ Performance de consultas críticas

**🎯 BACKEND 100% COMPLETO Y LISTO PARA PRODUCCIÓN**
