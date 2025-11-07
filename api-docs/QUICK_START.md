# 🚀 Guía de Inicio Rápido - API Acees Group

Esta guía te ayudará a comenzar a usar la API de Acees Group en minutos.

## 📋 Prerrequisitos

- Acceso a internet
- Herramienta para hacer peticiones HTTP (Postman, Insomnia, curl, o tu cliente HTTP preferido)
- Credenciales de acceso (email y contraseña)

## 🌐 URLs Base

- **Producción**: `https://acees-group-backend-production.up.railway.app`
- **Desarrollo Local**: `http://localhost:3000`
- **Red Local**: `http://192.168.1.51:3000`

## ✅ Paso 1: Verificar el Servidor

Primero, verifica que el servidor esté funcionando:

```bash
curl https://acees-group-backend-production.up.railway.app/api/health
```

**Respuesta esperada**:
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "database": "connected"
}
```

## 🔐 Paso 2: Autenticación (Login)

Autentica un usuario para obtener acceso:

```bash
curl -X POST https://acees-group-backend-production.up.railway.app/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "guardia@ejemplo.com",
    "password": "contraseña123"
  }'
```

**Respuesta exitosa**:
```json
{
  "id": "user_id_123",
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "guardia@ejemplo.com",
  "dni": "12345678",
  "rango": "guardia",
  "puerta_acargo": "Puerta Principal",
  "estado": "activo"
}
```

## 📚 Paso 3: Ejemplos de Uso Común

### Buscar un Alumno por Código Universitario

```bash
curl https://acees-group-backend-production.up.railway.app/alumnos/20201234
```

### Registrar una Asistencia

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

### Obtener Lista de Facultades

```bash
curl https://acees-group-backend-production.up.railway.app/facultades
```

### Obtener Lista de Escuelas por Facultad

```bash
curl "https://acees-group-backend-production.up.railway.app/escuelas?siglas_facultad=FC"
```

## 🔄 Flujos Completos

### Flujo 1: Registro de Entrada de Estudiante (NFC)

1. **Login del Guardia**
```bash
POST /login
```

2. **Buscar Alumno por Código NFC**
```bash
GET /alumnos/{codigo_universitario}
```

3. **Registrar Asistencia**
```bash
POST /asistencias
```

4. **Actualizar Presencia**
```bash
POST /presencia/actualizar
```

### Flujo 2: Iniciar Sesión de Guardia

1. **Login del Guardia**
```bash
POST /login
```

2. **Iniciar Sesión de Guardia**
```bash
POST /sesiones/iniciar
```

3. **Enviar Heartbeat (cada 30 segundos)**
```bash
POST /sesiones/heartbeat
```

4. **Finalizar Sesión**
```bash
POST /sesiones/finalizar
```

### Flujo 3: Decisión Manual de Guardia

1. **Buscar Alumno**
```bash
GET /alumnos/{codigo_universitario}
```

2. **Registrar Decisión Manual**
```bash
POST /decisiones-manuales
```

3. **Registrar Asistencia Completa**
```bash
POST /asistencias/completa
```

## 📝 Headers Comunes

Todas las peticiones deben incluir:

```http
Content-Type: application/json
```

## ⚠️ Códigos de Error Comunes

- **200**: Éxito
- **201**: Creado exitosamente
- **400**: Solicitud inválida (faltan campos requeridos)
- **401**: No autorizado (credenciales incorrectas)
- **403**: Prohibido (alumno no matriculado)
- **404**: Recurso no encontrado
- **409**: Conflicto (otro guardia activo)
- **500**: Error interno del servidor

## 🛠️ Herramientas Recomendadas

### Postman

1. Importa la colección desde `api-docs/postman_collection.json`
2. Configura la variable de entorno `baseUrl`
3. Comienza a hacer peticiones

### Insomnia

1. Importa la colección desde `api-docs/insomnia_collection.json`
2. Configura el ambiente con la URL base
3. Comienza a hacer peticiones

### cURL

Usa los ejemplos de cURL proporcionados en esta guía.

## 📖 Próximos Pasos

1. Revisa la [Documentación OpenAPI completa](./openapi.yaml)
2. Explora los [Ejemplos de Flujos Completos](./FLUJOS_COMPLETOS.md)
3. Consulta la [Guía de Autenticación](./AUTENTICACION.md)
4. Descarga la [Colección de Postman](./postman_collection.json)

## 🆘 Soporte

Si tienes problemas:

1. Verifica que el servidor esté funcionando (`GET /api/health`)
2. Revisa los códigos de error en la [Documentación OpenAPI](./openapi.yaml)
3. Consulta la sección de [Troubleshooting](./TROUBLESHOOTING.md)

---

**¡Listo para comenzar!** 🎉

