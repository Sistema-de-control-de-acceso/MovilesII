# 📌 Guía de Versionado - API Acees Group

## 📋 Estrategia de Versionado

La API utiliza [Semantic Versioning](https://semver.org/lang/es/) (SemVer) con el formato:

```
MAJOR.MINOR.PATCH
```

### Versión Actual: `1.0.0`

- **MAJOR** (1): Cambios incompatibles con versiones anteriores
- **MINOR** (0): Nuevas funcionalidades compatibles con versiones anteriores
- **PATCH** (0): Correcciones de bugs compatibles con versiones anteriores

## 🔄 Política de Versionado

### Versión MAJOR (X.0.0)

Se incrementa cuando:
- Se eliminan endpoints
- Se cambian estructuras de respuesta de forma incompatible
- Se cambian parámetros requeridos de forma incompatible
- Se cambian códigos de estado HTTP de forma incompatible

**Ejemplo**: Cambiar de `GET /usuarios` a `GET /api/v2/usuarios`

### Versión MINOR (1.X.0)

Se incrementa cuando:
- Se agregan nuevos endpoints
- Se agregan nuevos campos opcionales a respuestas
- Se agregan nuevos parámetros opcionales
- Se agregan nuevas funcionalidades sin romper compatibilidad

**Ejemplo**: Agregar `GET /usuarios/{id}/historial`

### Versión PATCH (1.0.X)

Se incrementa cuando:
- Se corrigen bugs
- Se mejoran mensajes de error
- Se optimizan respuestas
- Se corrigen documentaciones

**Ejemplo**: Corregir validación de email en `POST /usuarios`

## 📍 Ubicación de la Versión

### En la API

La versión se indica en:
- Header `X-API-Version` (próximamente)
- Endpoint `/api/health` en campo `version`
- Documentación OpenAPI en `info.version`

### En la Documentación

- Archivo `openapi.yaml`: Campo `info.version`
- Archivo `CHANGELOG.md`: Encabezados de versión
- Este archivo: Versión actual

## 🔮 Versionado de Endpoints

### Estrategia Actual

Actualmente, todos los endpoints están en la versión base sin prefijo de versión:

```
POST /login
GET /usuarios
POST /asistencias
```

### Estrategia Futura

Se planea implementar versionado en la URL:

```
POST /api/v1/login
GET /api/v1/usuarios
POST /api/v1/asistencias
```

**Ventajas**:
- Permite mantener múltiples versiones simultáneamente
- Facilita migración gradual
- Claridad sobre qué versión se está usando

## 📅 Calendario de Versiones

### Versión 1.0.0 (Enero 2025)
- Versión inicial de la API
- Todos los endpoints básicos implementados
- Documentación completa

### Versión 1.1.0 (Próximamente)
- Nuevos endpoints de reportes
- Filtros avanzados
- Mejoras en ML

### Versión 2.0.0 (Futuro)
- JWT tokens
- OAuth 2.0
- Refactorización de endpoints

## 🔄 Compatibilidad

### Compatibilidad Hacia Atrás

- **Versiones PATCH**: 100% compatibles
- **Versiones MINOR**: Compatibles, nuevas funcionalidades opcionales
- **Versiones MAJOR**: Pueden romper compatibilidad

### Deprecación

Cuando un endpoint o campo se depreca:

1. Se marca como `deprecated: true` en OpenAPI
2. Se documenta en CHANGELOG
3. Se mantiene por al menos 2 versiones MINOR
4. Se elimina en la siguiente versión MAJOR

**Ejemplo**:
```yaml
/deprecated-endpoint:
  get:
    deprecated: true
    summary: Este endpoint será removido en v2.0.0
```

## 📊 Historial de Versiones

| Versión | Fecha | Cambios Principales |
|---------|-------|---------------------|
| 1.0.0 | 2025-01-15 | Versión inicial |

## 🚀 Migración Entre Versiones

### De 1.0.0 a 1.1.0

**Sin cambios requeridos**: Compatible hacia atrás

### De 1.X.X a 2.0.0

**Cambios requeridos**:
- Actualizar URLs de endpoints
- Actualizar estructuras de respuesta
- Actualizar autenticación (JWT)

**Guía de migración**: Se publicará cuando esté disponible

## 📝 Notas de Versión

Cada versión incluye:
- Lista de cambios (CHANGELOG.md)
- Guía de migración (si aplica)
- Ejemplos actualizados
- Documentación actualizada

## 🔍 Verificar Versión

### Desde la API

```bash
curl https://acees-group-backend-production.up.railway.app/api/health
```

**Response**:
```json
{
  "status": "OK",
  "version": "1.0.0",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Desde la Documentación

- Ver `openapi.yaml` → `info.version`
- Ver `CHANGELOG.md` → Última versión documentada

## 📞 Soporte

Para preguntas sobre versionado:
- Consulta el [CHANGELOG.md](./CHANGELOG.md)
- Revisa la [Documentación OpenAPI](./openapi.yaml)
- Contacta al equipo de desarrollo

---

**Última actualización**: Enero 2025

