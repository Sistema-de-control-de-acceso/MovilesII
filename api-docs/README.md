# 📚 Documentación Completa de la API - Acees Group

Bienvenido a la documentación completa de la API REST de Acees Group - Sistema de Control de Acceso NFC.

## 📋 Tabla de Contenidos

1. [Inicio Rápido](#-inicio-rápido)
2. [Documentación OpenAPI](#-documentación-openapi)
3. [Guías](#-guías)
4. [Ejemplos](#-ejemplos)
5. [Referencia](#-referencia)

---

## 🚀 Inicio Rápido

¿Nuevo en la API? Comienza aquí:

👉 **[Guía de Inicio Rápido](./QUICK_START.md)**

Esta guía te ayudará a:
- Verificar el servidor
- Autenticarte
- Hacer tu primera petición
- Entender los conceptos básicos

---

## 📖 Documentación OpenAPI

### Especificación OpenAPI 3.0

La documentación completa de la API está disponible en formato OpenAPI/Swagger:

👉 **[openapi.yaml](./openapi.yaml)**

Esta especificación incluye:
- ✅ Todos los endpoints documentados
- ✅ Esquemas de request/response
- ✅ Ejemplos de uso
- ✅ Códigos de error
- ✅ Modelos de datos

### Visualizar la Documentación

#### Opción 1: Swagger UI (Recomendado)

1. Visita [Swagger Editor](https://editor.swagger.io/)
2. Importa el archivo `openapi.yaml`
3. Explora la documentación interactiva

#### Opción 2: Postman

1. Importa `openapi.yaml` en Postman
2. Genera colección automáticamente
3. Prueba los endpoints

#### Opción 3: Insomnia

1. Importa `openapi.yaml` en Insomnia
2. Genera colección automáticamente
3. Prueba los endpoints

---

## 📚 Guías

### 🔐 Autenticación

👉 **[Guía de Autenticación](./AUTENTICACION.md)**

Aprende sobre:
- Cómo autenticarte
- Seguridad de contraseñas
- Rangos de usuario
- Mejores prácticas

### 🔄 Flujos Completos

👉 **[Flujos Completos](./FLUJOS_COMPLETOS.md)**

Ejemplos paso a paso de:
- Registro de entrada (NFC)
- Registro de salida
- Sesión de guardia
- Decisión manual
- Gestión de usuarios (Admin)
- Predicción ML

### 📌 Versionado

👉 **[Guía de Versionado](./VERSIONADO.md)**

Información sobre:
- Estrategia de versionado
- Compatibilidad
- Migración entre versiones
- Historial de versiones

### 📝 Changelog

👉 **[Changelog](./CHANGELOG.md)**

Historial completo de cambios:
- Nuevas funcionalidades
- Correcciones
- Mejoras
- Deprecaciones

---

## 💻 Ejemplos

### Ejemplo 1: Login y Buscar Alumno

```bash
# 1. Login
curl -X POST https://acees-group-backend-production.up.railway.app/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "guardia@ejemplo.com",
    "password": "contraseña123"
  }'

# 2. Buscar alumno
curl https://acees-group-backend-production.up.railway.app/alumnos/20201234
```

### Ejemplo 2: Registrar Asistencia

```bash
curl -X POST https://acees-group-backend-production.up.railway.app/asistencias \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "María",
    "apellido": "González",
    "dni": "87654321",
    "codigo_universitario": "20201234",
    "tipo": "entrada",
    "fecha_hora": "2025-01-15T10:30:00.000Z",
    "puerta": "Puerta Principal",
    "guardia_id": "guardia_id_123",
    "guardia_nombre": "Juan Pérez"
  }'
```

### Ejemplo 3: Iniciar Sesión de Guardia

```bash
curl -X POST https://acees-group-backend-production.up.railway.app/sesiones/iniciar \
  -H "Content-Type: application/json" \
  -d '{
    "guardia_id": "guardia_id_123",
    "guardia_nombre": "Juan Pérez",
    "punto_control": "Puerta Principal",
    "device_info": {
      "platform": "Android",
      "device_id": "device_123",
      "app_version": "1.0.0"
    }
  }'
```

---

## 📖 Referencia

### Base URLs

- **Producción**: `https://acees-group-backend-production.up.railway.app`
- **Desarrollo Local**: `http://localhost:3000`
- **Red Local**: `http://192.168.1.51:3000`

### Endpoints Principales

#### Autenticación
- `POST /login` - Autenticar usuario

#### Usuarios
- `GET /usuarios` - Listar usuarios
- `GET /usuarios/{id}` - Obtener usuario
- `POST /usuarios` - Crear usuario
- `PUT /usuarios/{id}` - Actualizar usuario
- `PUT /usuarios/{id}/password` - Cambiar contraseña

#### Alumnos
- `GET /alumnos` - Listar alumnos
- `GET /alumnos/{codigo}` - Buscar alumno por código

#### Asistencias
- `GET /asistencias` - Listar asistencias
- `POST /asistencias` - Registrar asistencia
- `POST /asistencias/completa` - Registrar asistencia completa
- `GET /asistencias/ultimo-acceso/{dni}` - Último tipo de acceso

#### Presencia
- `GET /presencia` - Presencia actual
- `POST /presencia/actualizar` - Actualizar presencia
- `GET /presencia/historial` - Historial de presencia

#### Sesiones
- `POST /sesiones/iniciar` - Iniciar sesión
- `POST /sesiones/heartbeat` - Heartbeat
- `POST /sesiones/finalizar` - Finalizar sesión
- `GET /sesiones/activas` - Sesiones activas

#### Machine Learning
- `GET /ml/datos-historicos` - Datos históricos
- `GET /ml/recomendaciones-buses` - Recomendaciones
- `POST /ml/recomendaciones-buses` - Almacenar recomendación
- `GET /ml/estado-actual` - Estado actual
- `POST /ml/feedback` - Feedback ML

### Códigos de Estado HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Solicitud inválida |
| 401 | Unauthorized - No autorizado |
| 403 | Forbidden - Prohibido |
| 404 | Not Found - No encontrado |
| 409 | Conflict - Conflicto |
| 500 | Internal Server Error - Error del servidor |

---

## 🛠️ Herramientas

### Postman

1. Importa `openapi.yaml` en Postman
2. Configura variable `baseUrl`
3. Comienza a probar endpoints

### Insomnia

1. Importa `openapi.yaml` en Insomnia
2. Configura ambiente con URL base
3. Comienza a probar endpoints

### Swagger UI

1. Visita [Swagger Editor](https://editor.swagger.io/)
2. Importa `openapi.yaml`
3. Explora documentación interactiva

---

## 📞 Soporte

### Documentación

- **OpenAPI**: [openapi.yaml](./openapi.yaml)
- **Inicio Rápido**: [QUICK_START.md](./QUICK_START.md)
- **Autenticación**: [AUTENTICACION.md](./AUTENTICACION.md)
- **Flujos**: [FLUJOS_COMPLETOS.md](./FLUJOS_COMPLETOS.md)
- **Changelog**: [CHANGELOG.md](./CHANGELOG.md)
- **Versionado**: [VERSIONADO.md](./VERSIONADO.md)

### Contacto

- **Email**: support@aceesgroup.com
- **Documentación**: Este repositorio

---

## 🔄 Actualizaciones

### Última Actualización

- **Fecha**: Enero 2025
- **Versión**: 1.0.0
- **Changelog**: [CHANGELOG.md](./CHANGELOG.md)

### Próximas Características

- JWT tokens
- OAuth 2.0
- Nuevos endpoints de reportes
- Mejoras en ML

Ver [CHANGELOG.md](./CHANGELOG.md) para más detalles.

---

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.

---

**Desarrollado por**: Acees Group  
**Versión de la API**: 1.0.0  
**Última actualización**: Enero 2025

