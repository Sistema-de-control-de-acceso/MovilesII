# 📝 Changelog - API Acees Group

Todos los cambios notables en la API serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.0.0] - 2025-01-15

### ✨ Agregado

#### Autenticación
- Endpoint `POST /login` para autenticación de usuarios
- Encriptación de contraseñas con bcrypt (10 salt rounds)
- Validación de usuarios activos/inactivos

#### Usuarios
- `GET /usuarios` - Listar todos los usuarios
- `GET /usuarios/{id}` - Obtener usuario por ID
- `POST /usuarios` - Crear nuevo usuario
- `PUT /usuarios/{id}` - Actualizar usuario
- `PUT /usuarios/{id}/password` - Cambiar contraseña
- Soporte para rangos: `admin` y `guardia`
- Estados de usuario: `activo` e `inactivo`

#### Alumnos
- `GET /alumnos` - Listar todos los alumnos
- `GET /alumnos/{codigo}` - Buscar alumno por código universitario
- Validación de estado de matrícula (estado = true)
- Respuesta con error 403 si alumno no está matriculado

#### Asistencias
- `GET /asistencias` - Listar todas las asistencias
- `POST /asistencias` - Registrar asistencia básica
- `POST /asistencias/completa` - Registrar asistencia completa (US025-US030)
- `GET /asistencias/ultimo-acceso/{dni}` - Determinar último tipo de acceso
- Campos adicionales: `guardia_id`, `guardia_nombre`, `autorizacion_manual`, `razon_decision`, `coordenadas`, `descripcion_ubicacion`

#### Facultades y Escuelas
- `GET /facultades` - Listar todas las facultades
- `GET /escuelas` - Listar escuelas (con filtro opcional por facultad)
- Query parameter `siglas_facultad` para filtrar escuelas

#### Externos
- `GET /externos` - Listar todos los externos
- `GET /externos/{dni}` - Buscar externo por DNI

#### Visitas
- `GET /visitas` - Listar todas las visitas
- `POST /visitas` - Registrar nueva visita

#### Decisiones Manuales
- `GET /decisiones-manuales` - Listar todas las decisiones manuales
- `POST /decisiones-manuales` - Registrar decisión manual (US024-US025)
- `GET /decisiones-manuales/guardia/{guardiaId}` - Obtener decisiones de un guardia
- Campos: `autorizado`, `razon`, `timestamp`, `punto_control`, `tipo_acceso`, `datos_estudiante`

#### Control de Presencia
- `GET /presencia` - Obtener presencia actual en campus
- `POST /presencia/actualizar` - Actualizar presencia (entrada/salida)
- `GET /presencia/historial` - Obtener historial completo de presencia
- `GET /presencia/largo-tiempo` - Obtener personas con más de 8 horas en campus
- Cálculo automático de `tiempo_en_campus`
- Tracking de `hora_entrada`, `hora_salida`, `punto_entrada`, `punto_salida`

#### Sesiones de Guardias
- `POST /sesiones/iniciar` - Iniciar sesión de guardia (US059)
- `POST /sesiones/heartbeat` - Mantener sesión activa
- `POST /sesiones/finalizar` - Finalizar sesión
- `GET /sesiones/activas` - Listar sesiones activas
- `POST /sesiones/forzar-finalizacion` - Forzar finalización (solo admin)
- Detección de conflictos de concurrencia (error 409)
- Información de dispositivo: `platform`, `device_id`, `app_version`

#### Machine Learning
- `GET /ml/datos-historicos` - Obtener datos históricos para ML
- `POST /ml/recomendaciones-buses` - Almacenar recomendación de buses
- `GET /ml/recomendaciones-buses` - Obtener recomendaciones almacenadas
- `GET /ml/estado-actual` - Obtener estado actual para ML
- `POST /ml/feedback` - Registrar feedback para mejorar modelo
- Filtros: `fecha_inicio`, `fecha_fin`, `limite`, `solo_recientes`

#### Health Check
- `GET /api/health` - Verificar estado del servidor y base de datos

### 🔧 Cambiado

- Estructura de respuestas JSON estandarizada
- Manejo de errores mejorado con códigos HTTP apropiados
- Validación de campos requeridos en todos los endpoints POST/PUT

### 🐛 Corregido

- Validación de estado de alumno antes de permitir acceso
- Manejo de conflictos de sesiones de guardias
- Cálculo correcto de tiempo en campus

### 📚 Documentación

- Documentación OpenAPI/Swagger completa
- Guía de inicio rápido
- Guía de autenticación
- Ejemplos de flujos completos
- Changelog y versionado

---

## [Unreleased]

### 🚀 Próximas Características

#### Autenticación
- [ ] Implementación de JWT tokens
- [ ] Refresh tokens
- [ ] OAuth 2.0

#### Usuarios
- [ ] Eliminación de usuarios (soft delete)
- [ ] Historial de cambios de usuario
- [ ] Roles y permisos más granulares

#### Asistencias
- [ ] Filtros avanzados por fecha, facultad, tipo
- [ ] Exportación de reportes (PDF, Excel)
- [ ] Estadísticas agregadas

#### Machine Learning
- [ ] Endpoint de entrenamiento de modelo
- [ ] Endpoint de predicción en tiempo real
- [ ] Métricas de precisión del modelo

#### Notificaciones
- [ ] Sistema de notificaciones push
- [ ] Alertas de eventos importantes
- [ ] Notificaciones por email

#### Seguridad
- [ ] Rate limiting
- [ ] CORS más restrictivo
- [ ] Validación de tokens JWT
- [ ] Logging de auditoría

---

## Tipos de Cambios

- **✨ Agregado**: Nueva funcionalidad
- **🔧 Cambiado**: Cambios en funcionalidad existente
- **🗑️ Deprecado**: Funcionalidad que será removida
- **❌ Removido**: Funcionalidad removida
- **🐛 Corregido**: Corrección de bugs
- **🔒 Seguridad**: Correcciones de seguridad

---

**Última actualización**: Enero 2025

