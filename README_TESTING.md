# Guía de Testing

## 📋 Resumen

Este proyecto implementa tests unitarios y end-to-end (E2E) con cobertura mínima de:
- **Backend Unit Tests**: ≥80%
- **Frontend Flutter Unit Tests**: ≥75%
- **E2E Tests**: Suite completa para flujos críticos
- **Contract Testing**: Validación de contratos API

## 🛠️ Configuración

### Backend

```bash
cd backend
npm install
npm test
```

### Frontend Flutter

```bash
flutter pub get
flutter test --coverage
```

## 📊 Ejecutar Tests

### Backend

```bash
# Ejecutar todos los tests unitarios con cobertura
npm test

# Ejecutar en modo watch
npm run test:watch

# Ejecutar para CI/CD
npm run test:ci

# Ejecutar tests E2E
npm run test:e2e

# Ejecutar contract tests
npm run test:contracts

# Ejecutar todos los tests (unitarios + E2E + contracts)
npm test && npm run test:e2e && npm run test:contracts
```

### Frontend

```bash
# Ejecutar todos los tests
flutter test

# Ejecutar con cobertura
flutter test --coverage

# Ver reporte de cobertura
genhtml coverage/lcov.info -o coverage/html
open coverage/html/index.html
```

## 📁 Estructura de Tests

```
backend/
├── test/
│   ├── setup.js                  # Configuración global de tests unitarios
│   ├── e2e/
│   │   ├── setup-e2e.js         # Configuración para tests E2E
│   │   ├── auth.e2e.test.js     # Tests E2E de autenticación
│   │   ├── users.e2e.test.js    # Tests E2E CRUD usuarios
│   │   └── dashboard.e2e.test.js # Tests E2E de dashboard
│   ├── contracts/
│   │   └── api-contracts.test.js # Contract testing (validación de schemas)
│   ├── utils/
│   │   └── mocks.js              # Mocks reutilizables
│   ├── validaciones/
│   │   ├── validar-movimiento.test.js
│   │   └── utils.test.js
│   ├── endpoints/
│   │   └── asistencias.test.js
│   └── models/
│       └── Presencia.test.js

test/
├── models/
│   └── asistencia_model_test.dart
└── utils/
    └── validaciones_test.dart
```

## ✅ Criterios de Aceptación

### Cobertura de Código
- ✅ Backend Unit Tests: ≥80% (branches, functions, lines, statements)
- ✅ Frontend Unit Tests: ≥75% (líneas de código)

### Tests Unitarios
- ✅ Tests para casos edge y manejo de errores
- ✅ Tests para funciones de negocio, validaciones y utilidades

### Tests E2E (End-to-End)
- ✅ Suite de tests E2E que cubra flujos críticos:
  - ✅ Autenticación (login)
  - ✅ CRUD usuarios (crear, leer, actualizar, eliminar)
  - ✅ Dashboard y métricas
- ✅ Tests ejecutándose contra ambiente de staging
- ✅ Verificación de contratos API (request/response esperados)

### Contract Testing
- ✅ Validación de schemas JSON con Ajv
- ✅ Verificación de tipos de datos y formatos
- ✅ Validación de estructura de respuestas API

### Mocks
- ✅ Mocks configurados para MongoDB (mongodb-memory-server)
- ✅ Mocks para servicios externos y dependencias

### CI/CD
- ✅ Tests unitarios ejecutándose automáticamente en GitHub Actions
- ✅ Tests E2E ejecutándose automáticamente
- ✅ Tests contra staging en cada push a main
- ✅ Reporte de cobertura generado y accesible
- ✅ Umbral mínimo que bloquea merges si no se cumple

## 🔍 Verificar Cobertura

### Backend

Los reportes de cobertura se generan en:
- `backend/coverage/lcov.info` - Formato LCOV
- `backend/coverage/coverage-final.json` - JSON
- `backend/coverage/lcov-report/index.html` - HTML

### Frontend

Los reportes de cobertura se generan en:
- `coverage/lcov.info` - Formato LCOV
- `coverage/html/` - HTML report

## 🚨 Umbrales de Cobertura

Si la cobertura está por debajo del umbral:
- **Backend**: El build fallará si < 80%
- **Frontend**: El build fallará si < 75%

## 📝 Escribir Nuevos Tests

### Backend (Jest)

```javascript
describe('MiFuncion', () => {
  it('debe hacer algo', () => {
    expect(miFuncion()).toBe(expected);
  });
});
```

### Frontend (Flutter Test)

```dart
void main() {
  group('MiClase', () {
    test('debe hacer algo', () {
      expect(miClase.miMetodo(), equals(expected));
    });
  });
}
```

## 🔧 Troubleshooting

### Backend
- Si los tests fallan con MongoDB, verifica que `mongodb-memory-server` esté instalado
- Si hay problemas de conexión, verifica `test/setup.js`
- Para tests E2E, verifica que `test/e2e/setup-e2e.js` esté configurado correctamente

### Tests E2E
- Asegúrate de que todas las rutas estén correctamente cargadas en `setup-e2e.js`
- Verifica que los modelos de MongoDB estén correctamente importados
- Si los tests fallan por timeout, aumenta `E2E_TIMEOUT` en la configuración

### Contract Testing
- Si falla la validación de schemas, verifica que los schemas en `api-contracts.test.js` coincidan con las respuestas reales
- Usa `ajv` con `allErrors: true` para ver todos los errores de validación

### Frontend
- Si los tests fallan, ejecuta `flutter clean` y `flutter pub get`
- Verifica que todas las dependencias estén en `pubspec.yaml`

## 🌐 Ambiente de Staging

Los tests E2E se ejecutan contra un ambiente de staging configurado con:

- **Base de datos**: MongoDB separada para staging
- **API**: URL configurada en `STAGING_API_URL`
- **Configuración**: Variables de entorno en `backend/config/staging.js`

### Ejecutar Tests contra Staging

**Linux/Mac:**
```bash
# Configurar variables de entorno
export STAGING_API_URL=http://staging-api.example.com
export STAGING_MONGODB_URI=mongodb://staging-db.example.com/asistencia

# Ejecutar script
cd backend
bash scripts/run-e2e-staging.sh
```

**Windows:**
```powershell
# Configurar variables de entorno
$env:STAGING_API_URL = "http://staging-api.example.com"
$env:STAGING_MONGODB_URI = "mongodb://staging-db.example.com/asistencia"

# Ejecutar script
cd backend
.\scripts\run-e2e-staging.ps1
```

**Directo con npm:**
```bash
cd backend
npm run test:e2e:staging
```

### Configurar Variables de Staging

Crear archivo `.env.staging` en `backend/`:

```env
NODE_ENV=staging
MONGODB_URI=mongodb+srv://user:pass@staging-cluster.mongodb.net/ASISTENCIA_STAGING
PORT=3001
API_URL=http://staging-api.example.com
```

## 📋 Flujos E2E Cubiertos

### 1. Autenticación
- Login exitoso
- Validación de credenciales
- Manejo de usuarios inactivos

### 2. CRUD Usuarios
- Crear usuario
- Listar usuarios
- Obtener usuario por ID
- Actualizar usuario
- Eliminar usuario
- Validación de duplicados

### 3. Dashboard y Métricas
- Métricas generales
- Accesos recientes
- Diferentes periodos de tiempo
- Validación de estructura de datos

### 4. Flujo Completo
- Secuencia completa: Login → Dashboard → Gestión → Métricas
- Manejo de errores en flujos

## 🔍 Contract Testing

Los contract tests validan que las respuestas de la API cumplan con los schemas esperados:

- **Schemas JSON**: Definidos con JSON Schema
- **Validación**: Usando Ajv (Another JSON Schema Validator)
- **Formatos**: Validación de emails, fechas ISO 8601, etc.

### Ejecutar Contract Tests

```bash
cd backend
npm run test:contracts
```

### Agregar Nuevo Schema

Editar `backend/test/contracts/api-contracts.test.js` y agregar el schema:

```javascript
const schemas = {
  nuevoEndpoint: {
    type: 'object',
    required: ['campo1', 'campo2'],
    properties: {
      campo1: { type: 'string' },
      campo2: { type: 'number' },
    },
  },
};
```

## 📊 Logging Centralizado

El sistema implementa logging estructurado en formato JSON para facilitar debugging y correlación entre mobile y backend.

### Características

- **Logs estructurados (JSON)**: Formato estándar para ELK/Datadog/Cloud Logging
- **Request-ID propagation**: Correlación entre mobile y backend
- **Eventos críticos instrumentados**: Login, asistencias, errores, etc.
- **Retención configurada**: Logs disponibles en staging

### Estructura de Logs

Los logs incluyen los siguientes campos:

```json
{
  "timestamp": "2024-01-15 10:30:45.123",
  "level": "info",
  "message": "Login exitoso",
  "service": "moviles2-backend",
  "environment": "staging",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user123",
  "endpoint": "/login",
  "method": "POST",
  "statusCode": 200,
  "duration": 150,
  "metadata": {
    "email": "user@example.com",
    "clientType": "mobile"
  }
}
```

### Request-ID

El sistema propaga automáticamente el `request-id` entre mobile y backend:

- **Mobile**: Genera un `request-id` único y lo envía en el header `X-Request-ID`
- **Backend**: Usa el `request-id` recibido o genera uno nuevo, lo retorna en el header `X-Request-ID`
- **Correlación**: Permite rastrear un request completo desde mobile hasta backend

### Acceso a Logs

#### En Desarrollo

Los logs se muestran en consola con formato legible:

```bash
cd backend
npm start
```

#### En Staging

Los logs están disponibles en:

1. **Archivo de logs** (si está configurado):
   ```bash
   tail -f logs/app.log
   ```

2. **Sistema de logging centralizado**:
   - Configurar `LOG_ENDPOINT` en variables de entorno
   - Los logs se envían automáticamente al endpoint configurado

### Queries Útiles

#### Buscar logs por request-id

```bash
# En archivo de logs
grep "550e8400-e29b-41d4-a716-446655440000" logs/app.log

# En sistema centralizado (ejemplo para ELK)
GET /logs/_search
{
  "query": {
    "match": {
      "requestId": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

#### Buscar logs de un usuario

```bash
# En archivo de logs
grep "\"userId\":\"user123\"" logs/app.log

# En sistema centralizado
GET /logs/_search
{
  "query": {
    "match": {
      "userId": "user123"
    }
  }
}
```

#### Buscar errores en las últimas horas

```bash
# En archivo de logs
grep "\"level\":\"error\"" logs/app.log | tail -100

# En sistema centralizado
GET /logs/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "level": "error" } },
        { "range": { "timestamp": { "gte": "now-1h" } } }
      ]
    }
  }
}
```

#### Buscar logs de eventos críticos

```bash
# Login exitoso
grep "\"message\":\"Login exitoso\"" logs/app.log

# Registro de asistencia
grep "\"message\":\"Asistencia registrada exitosamente\"" logs/app.log

# Errores de autenticación
grep "\"message\":\"Login fallido\"" logs/app.log
```

### Tests E2E de Logging

Los tests E2E validan que los logs se generen correctamente:

```bash
cd backend
npm run test:e2e -- logging.e2e.test.js
```

Los tests verifican:
- ✅ Generación y propagación de request-id
- ✅ Logs en eventos críticos (login, asistencias)
- ✅ Formato JSON estructurado
- ✅ Correlación mobile-backend

### Configuración

#### Variables de Entorno

```env
# Nivel de log (error, warn, info, http, debug)
LOG_LEVEL=info

# Ruta del archivo de logs (opcional)
LOG_FILE_PATH=logs/app.log

# Endpoint para logging centralizado (opcional)
LOG_ENDPOINT=https://logs.example.com/api/logs
```

#### Configuración en Staging

Editar `backend/config/staging.js`:

```javascript
module.exports = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  LOG_FILE_PATH: process.env.LOG_FILE_PATH || 'logs/staging.log',
  // ... otras configuraciones
};
```

### Instrumentación de Eventos Críticos

Los siguientes eventos generan logs automáticamente:

#### Backend

- ✅ Login (exitoso y fallido)
- ✅ Registro de asistencias
- ✅ Errores HTTP
- ✅ Requests HTTP (método, endpoint, duración, status)

#### Mobile (Flutter)

- ✅ Inicio de aplicación
- ✅ Login (exitoso y fallido)
- ✅ Logout
- ✅ Requests HTTP (request y response)
- ✅ Errores de conexión
- ✅ Eventos críticos (NFC, sincronización)

### Retención de Logs

- **Desarrollo**: Logs en consola, sin retención
- **Staging**: Logs en archivo (si está configurado) y sistema centralizado
- **Producción**: Logs solo en sistema centralizado

### Troubleshooting

#### Los logs no aparecen

1. Verificar nivel de log configurado:
   ```bash
   echo $LOG_LEVEL
   ```

2. Verificar que el logger esté inicializado:
   - Backend: Verificar que `requestIdMiddleware` esté configurado
   - Mobile: Verificar que `LoggingService().initialize()` se llame en `main()`

#### Request-ID no se propaga

1. Verificar headers en requests:
   ```bash
   curl -H "X-Request-ID: test-123" http://localhost:3000/api/info
   ```

2. Verificar que el middleware esté configurado antes de las rutas

#### Logs no se envían a sistema centralizado

1. Verificar configuración de `LOG_ENDPOINT`
2. Verificar conectividad al endpoint
3. Revisar logs de error (los errores de envío son silenciosos para evitar loops)

## 🛡️ Rate Limiting

El sistema implementa rate limiting para proteger endpoints críticos contra abuso y garantizar estabilidad.

### Características

- **Rate limiting por endpoint**: Configuraciones específicas según el tipo de endpoint
- **Respuestas HTTP 429**: Con headers explicativos (Retry-After, X-RateLimit-*)
- **Configuración por entorno**: Diferentes límites para desarrollo, staging y producción
- **Tests E2E y unitarios**: Validación del comportamiento bajo límite

### Endpoints Protegidos

#### Login
- **Límite**: 5 intentos en producción, 10 en otros ambientes
- **Ventana**: 15 minutos
- **Tracking**: Por IP + email para mayor precisión

#### Autenticación (cambio de contraseña)
- **Límite**: 20 requests en producción, 50 en otros ambientes
- **Ventana**: 15 minutos

#### CRUD Usuarios
- **Límite**: 30 requests en producción, 100 en otros ambientes
- **Ventana**: 15 minutos
- **Endpoints**: GET, POST, PUT, DELETE /usuarios

#### Dashboard/Métricas
- **Límite**: 30 requests por minuto en producción, 100 en otros ambientes
- **Ventana**: 1 minuto (más corta por ser computacionalmente costoso)
- **Endpoints**: GET /dashboard/metrics, GET /dashboard/recent-access

#### Asistencias
- **Límite**: 60 requests por minuto en producción, 200 en otros ambientes
- **Ventana**: 1 minuto
- **Endpoints**: POST /asistencias/completa, POST /asistencias/validar-movimiento

### Respuesta HTTP 429

Cuando se excede el límite, el servidor retorna:

**Status Code**: `429 Too Many Requests`

**Headers**:
```
Retry-After: 900
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2024-01-15T10:45:00.000Z
```

**Body**:
```json
{
  "error": "Demasiadas solicitudes",
  "message": "Has excedido el límite de solicitudes permitidas. Por favor, intenta nuevamente más tarde.",
  "retryAfter": 900,
  "resetTime": "2024-01-15T10:45:00.000Z",
  "limit": 5,
  "windowMs": 900000
}
```

### Configuración

#### Variables de Entorno

```env
# Deshabilitar rate limiting en desarrollo (opcional)
SKIP_RATE_LIMIT=true

# NODE_ENV determina la configuración automáticamente
NODE_ENV=staging
```

#### Configuración en Staging

Editar `backend/config/staging.js`:

```javascript
module.exports = {
  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
  },
  // ... otras configuraciones
};
```

### Tests

#### Tests Unitarios

```bash
cd backend
npm test -- rateLimiter.test.js
```

#### Tests E2E

```bash
cd backend
npm run test:e2e -- rateLimiting.e2e.test.js
```

Los tests verifican:
- ✅ Aplicación de rate limiting en endpoints críticos
- ✅ Respuesta HTTP 429 cuando se excede el límite
- ✅ Presencia de headers Retry-After y X-RateLimit-*
- ✅ Mensajes de error descriptivos

### Comportamiento en Diferentes Ambientes

#### Desarrollo
- **General**: 1000 requests por 15 minutos (muy permisivo)
- **Login**: 10 intentos por 15 minutos
- **Puede deshabilitarse**: `SKIP_RATE_LIMIT=true`

#### Staging
- **General**: 100 requests por 15 minutos
- **Login**: 10 intentos por 15 minutos
- **Configurable**: En `backend/config/staging.js`

#### Producción
- **General**: 50 requests por 15 minutos (más restrictivo)
- **Login**: 5 intentos por 15 minutos (muy restrictivo)
- **Siempre activo**: No se puede deshabilitar

### Troubleshooting

#### Rate limiting muy restrictivo

1. Verificar entorno:
   ```bash
   echo $NODE_ENV
   ```

2. Ajustar configuración en `backend/config/staging.js` si es staging

3. En desarrollo, usar `SKIP_RATE_LIMIT=true` para deshabilitar

#### No se aplica rate limiting

1. Verificar que `express-rate-limit` esté instalado:
   ```bash
   npm list express-rate-limit
   ```

2. Verificar que los middlewares estén configurados en `index.js`

3. Verificar que no esté deshabilitado en desarrollo con `SKIP_RATE_LIMIT`

#### Headers no aparecen

1. Verificar que `standardHeaders: true` esté configurado
2. Los headers solo aparecen cuando se está cerca del límite o se excede
3. Verificar en respuesta 429 que los headers estén presentes

### Mejores Prácticas

1. **Implementar retry con backoff exponencial** en el cliente cuando recibe 429
2. **Respetar el header Retry-After** para saber cuándo reintentar
3. **Monitorear logs** para detectar patrones de abuso
4. **Ajustar límites** según patrones de uso reales
5. **Usar rate limiting por IP** para endpoints públicos
6. **Usar rate limiting por usuario** para endpoints autenticados (futuro)

## 🏥 Monitoreo de Salud del Sistema

El sistema implementa monitoreo completo de salud en tiempo real para detectar problemas antes de que afecten a usuarios.

### Características

- **Dashboard de métricas**: CPU, memoria, disco, base de datos
- **Alertas automáticas**: Configurables con umbrales personalizables
- **Historial de incidentes**: Registro completo de problemas detectados
- **Métricas de performance**: API, queries, conexiones

### Endpoints Disponibles

#### GET /health/detailed
Obtiene métricas detalladas del sistema.

**Respuesta**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "system": {
    "status": "healthy",
    "metrics": {
      "cpu": {
        "process": { "usage": 15.5, "user": 2.3, "system": 1.2 },
        "system": { "loadPercent": 25.0, "cores": 4, "loadAverage": {...} }
      },
      "memory": {
        "system": { "totalMB": 8192, "usedMB": 4096, "usagePercent": 50.0 },
        "process": { "heapUsed": 128, "heapTotal": 256, "heapUsagePercent": 50.0 }
      },
      "disk": { "platform": "linux", "uptime": {...} },
      "process": { "uptime": {...}, "pid": 12345, "version": "v18.0.0" }
    },
    "issues": []
  },
  "database": {
    "status": "healthy",
    "metrics": {
      "connection": { "isConnected": true, "stateName": "connected" },
      "stats": { "connections": {...}, "operations": {...} },
      "collections": { "totalCollections": 10, "collections": [...] },
      "slowQueries": { "queries": [], "total": 0, "stats": {...} }
    },
    "issues": []
  },
  "issues": [],
  "summary": {
    "totalIssues": 0,
    "criticalIssues": 0,
    "warnings": 0
  }
}
```

#### GET /health/incidents
Obtiene historial de incidentes.

**Parámetros**:
- `limit`: Número máximo de incidentes (default: 50)
- `status`: Filtrar por estado (healthy, degraded, unhealthy)
- `resolved`: Filtrar por resuelto (true/false)
- `since`: Filtrar desde fecha (ISO format)

**Ejemplo**:
```bash
GET /health/incidents?limit=20&status=degraded&resolved=false
```

#### GET /health/incidents/stats
Obtiene estadísticas de incidentes.

**Parámetros**:
- `hours`: Período en horas (default: 24)

**Respuesta**:
```json
{
  "period": "24 hours",
  "since": "2024-01-14T10:30:45.123Z",
  "stats": {
    "total": 5,
    "byStatus": { "healthy": 0, "degraded": 3, "unhealthy": 2 },
    "bySeverity": { "critical": 2, "warning": 3 },
    "resolved": 4,
    "unresolved": 1
  }
}
```

#### POST /health/incidents/:id/resolve
Marca un incidente como resuelto.

#### GET /health/thresholds
Obtiene umbrales de alerta actuales.

#### POST /health/thresholds
Configura umbrales de alerta.

**Body**:
```json
{
  "cpu": { "warning": 80, "critical": 95 },
  "memory": { "warning": 80, "critical": 95 },
  "heap": { "warning": 80, "critical": 95 },
  "dbConnections": { "warning": 50, "critical": 100 },
  "slowQueries": { "warning": 5, "critical": 20 }
}
```

#### GET /health/summary
Obtiene resumen completo de salud (incluye métricas, incidentes, alertas).

#### GET /health/alerts
Obtiene historial de alertas enviadas.

**Parámetros**:
- `limit`: Número máximo de alertas (default: 50)
- `type`: Filtrar por tipo (cpu, memory, database, etc.)
- `severity`: Filtrar por severidad (warning, critical)
- `since`: Filtrar desde fecha (ISO format)

### Dashboard de Salud

Acceso al dashboard web:
```
http://localhost:3000/dashboard/health.html
```

**Características**:
- Métricas en tiempo real
- Auto-actualización cada 30 segundos
- Gráficos de progreso visuales
- Lista de problemas detectados
- Historial de incidentes

### Umbrales de Alerta por Defecto

```javascript
{
  cpu: { warning: 80%, critical: 95% },
  memory: { warning: 80%, critical: 95% },
  heap: { warning: 80%, critical: 95% },
  dbConnections: { warning: 50, critical: 100 },
  slowQueries: { warning: 5, critical: 20 }
}
```

### Métricas Disponibles

#### Sistema
- **CPU**: Uso del proceso, carga del sistema, núcleos
- **Memoria**: Sistema (total, usado, libre), Proceso (heap, RSS)
- **Disco**: Plataforma, arquitectura, uptime
- **Proceso**: PID, versión Node.js, uptime

#### Base de Datos
- **Conexión**: Estado, host, puerto, nombre BD
- **Estadísticas**: Conexiones activas, operaciones, red
- **Colecciones**: Conteo, tamaño, índices
- **Queries Lentas**: Historial, estadísticas

### Alertas Automáticas

El sistema envía alertas automáticamente cuando:
- CPU excede umbrales configurados
- Memoria excede umbrales configurados
- Base de datos se desconecta
- Se detectan queries lentas en exceso

**Canales de alerta**:
- **Log**: Siempre activo (registra en sistema de logging)
- **Email**: Configurable (requiere configuración adicional)

### Tests

#### Tests Unitarios

```bash
cd backend
npm test -- health_monitoring.test.js
```

#### Tests E2E

```bash
cd backend
npm run test:e2e -- health_monitoring.e2e.test.js
```

Los tests verifican:
- ✅ Obtención de métricas del sistema
- ✅ Obtención de métricas de BD
- ✅ Detección de problemas
- ✅ Registro de incidentes
- ✅ Envío de alertas
- ✅ Historial de incidentes
- ✅ Configuración de umbrales

### Configuración

#### Variables de Entorno

```env
# No requiere configuración adicional
# Los umbrales se configuran vía API o código
```

#### Configuración Programática

```javascript
const healthMonitoring = require('./services/health_monitoring_service');

// Configurar umbrales
healthMonitoring.setAlertThresholds({
  cpu: { warning: 70, critical: 90 },
  memory: { warning: 75, critical: 90 }
});

// Registrar canal de alerta personalizado
const { EmailAlertChannel } = require('./services/alert_service');
healthMonitoring.alertService.registerChannel(
  new EmailAlertChannel({ to: 'admin@example.com' })
);
```

### Queries Útiles

#### Verificar salud del sistema

```bash
curl http://localhost:3000/health/detailed
```

#### Obtener incidentes críticos

```bash
curl "http://localhost:3000/health/incidents?status=unhealthy&limit=10"
```

#### Obtener estadísticas de últimas 48 horas

```bash
curl "http://localhost:3000/health/incidents/stats?hours=48"
```

#### Configurar umbrales

```bash
curl -X POST http://localhost:3000/health/thresholds \
  -H "Content-Type: application/json" \
  -d '{
    "cpu": { "warning": 70, "critical": 90 },
    "memory": { "warning": 75, "critical": 90 }
  }'
```

### Troubleshooting

#### Las métricas no aparecen

1. Verificar que los servicios estén inicializados:
   ```javascript
   // En index.js debe estar:
   const HealthMonitoringService = require('./services/health_monitoring_service');
   const healthMonitoring = new HealthMonitoringService();
   ```

2. Verificar que los endpoints estén registrados

#### Las alertas no se envían

1. Verificar que los canales estén registrados
2. Verificar umbrales configurados
3. Revisar logs para errores de envío

#### Dashboard no carga

1. Verificar que el archivo existe: `backend/public/dashboard/health.html`
2. Verificar que el servidor esté sirviendo archivos estáticos
3. Revisar consola del navegador para errores

### Mejores Prácticas

1. **Monitorear regularmente**: Revisar dashboard diariamente
2. **Configurar alertas**: Establecer umbrales apropiados según carga esperada
3. **Revisar incidentes**: Resolver incidentes críticos inmediatamente
4. **Ajustar umbrales**: Basarse en métricas históricas reales
5. **Integrar con sistemas externos**: Conectar con sistemas de monitoreo (Datadog, New Relic, etc.)
6. **Automatizar respuestas**: Configurar acciones automáticas para incidentes críticos

## 🚀 Pruebas de Carga y Análisis de Performance

Sistema completo de pruebas de carga para garantizar que el sistema soporte la carga esperada y mantenga tiempos de respuesta óptimos.

### Características

- ✅ Tests de carga para escenarios de uso pico (horario de entrada/salida)
- ✅ Simulación de carga concurrente (mínimo 500 usuarios simultáneos)
- ✅ Tiempo de respuesta promedio < 200ms para operaciones críticas
- ✅ Tasa de éxito > 99.5% bajo carga normal
- ✅ Identificación de cuellos de botella
- ✅ Reporte de métricas de performance (latencia P50, P95, P99)
- ✅ Tests de stress para identificar punto de quiebre
- ✅ Pruebas de resistencia (soak tests) de 24 horas
- ✅ Plan de optimización basado en resultados

### Instalación

#### K6 (Herramienta de Testing)

**macOS:**
```bash
brew install k6
```

**Windows:**
```bash
choco install k6
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Descarga directa:** https://k6.io/docs/getting-started/installation/

### Estructura

```
backend/load-testing/
├── k6.config.js              # Configuración base
├── scenarios/
│   ├── peak-hours.js         # Horario pico entrada/salida
│   ├── concurrent-users.js    # 500 usuarios simultáneos
│   ├── stress-test.js        # Test de stress (punto de quiebre)
│   └── soak-test.js          # Prueba de resistencia 24h
├── scripts/
│   ├── run-load-test.sh      # Script bash
│   ├── run-load-test.ps1     # Script PowerShell
│   ├── analyze-results.js    # Análisis de resultados
│   └── setup-staging-data.js # Configurar datos de prueba
└── README.md                  # Documentación completa
```

### Uso Rápido

#### 1. Configurar Datos de Prueba

```bash
cd backend/load-testing
node scripts/setup-staging-data.js
```

#### 2. Ejecutar Prueba de Carga

**Linux/macOS:**
```bash
./scripts/run-load-test.sh peak-hours http://localhost:3000
```

**Windows:**
```powershell
.\scripts\run-load-test.ps1 peak-hours http://localhost:3000
```

**Directo:**
```bash
k6 run --env BASE_URL=http://localhost:3000 scenarios/peak-hours.js
```

#### 3. Analizar Resultados

```bash
node scripts/analyze-results.js results/peak-hours-20240115-120000.json
```

### Escenarios Disponibles

#### Peak Hours (Horario Pico)
```bash
k6 run scenarios/peak-hours.js
```
- Simula 200 usuarios durante horario pico
- Login → Consulta alumno → Registro asistencia
- Duración: ~12 minutos

#### Concurrent Users (Usuarios Concurrentes)
```bash
k6 run scenarios/concurrent-users.js
```
- Simula 500 usuarios simultáneos
- Operaciones variadas
- Duración: ~24 minutos

#### Stress Test
```bash
k6 run scenarios/stress-test.js
```
- Incremento gradual hasta 1000 usuarios
- Identifica punto de quiebre
- Duración: ~20 minutos

#### Soak Test (24 horas)
```bash
k6 run --duration 24h scenarios/soak-test.js
```
- 50 usuarios constantes
- Detecta memory leaks
- Duración: 24 horas

### Métricas y Thresholds

#### Thresholds Configurados

```javascript
{
  // Tiempo de respuesta promedio < 200ms
  http_req_duration: ['p(50)<200', 'p(95)<500', 'p(99)<1000'],
  
  // Tasa de éxito > 99.5%
  http_req_failed: ['rate<0.005'],
  
  // Checks deben pasar
  checks: ['rate>0.995']
}
```

#### Métricas Reportadas

- **Response Time**: Min, Max, Promedio, P50, P95, P99
- **Success Rate**: Total requests, Failed requests, Tasa de éxito
- **Throughput**: Requests por segundo
- **Checks**: Checks pasados/fallidos, Tasa de checks

### Interpretación de Resultados

#### ✅ Prueba Exitosa

- P50 < 200ms
- P95 < 500ms
- P99 < 1000ms
- Success rate > 99.5%
- Checks rate > 99.5%

#### ⚠️ Problemas Detectados

**Tiempo de respuesta alto:**
- Revisar queries de BD
- Implementar caching
- Optimizar índices

**Tasa de éxito baja:**
- Revisar logs de errores
- Verificar capacidad de BD
- Revisar rate limiting

**P95 alto:**
- Identificar endpoints lentos
- Optimizar operaciones costosas
- Revisar conexiones de BD

### Integración con Monitoreo

Durante las pruebas, monitorear el sistema:

```bash
# En otra terminal
curl http://localhost:3000/health/detailed
```

O acceder al dashboard:
```
http://localhost:3000/dashboard/health.html
```

### Reportes

El script de análisis genera:

1. **Reporte en consola**: Métricas clave y recomendaciones
2. **Archivo JSON**: Análisis completo para procesamiento
3. **Recomendaciones**: Plan de optimización basado en resultados

### Troubleshooting

#### K6 no está instalado
```bash
k6 version
# Si no está, seguir instrucciones de instalación
```

#### Error de conexión
```bash
curl http://localhost:3000/health
```

#### Resultados no se generan
```bash
mkdir -p results
chmod 755 results
```

### Documentación Completa

Ver `backend/load-testing/README.md` para documentación detallada.

### Integración CI/CD

Las pruebas de carga están integradas en CI/CD. Ver `backend/load-testing/CI_CD_INTEGRATION.md` para detalles completos.

**Sistemas soportados:**
- ✅ GitHub Actions (`.github/workflows/load-testing.yml`)
- ✅ GitLab CI (`.gitlab-ci.yml`)
- ✅ Jenkins (`Jenkinsfile`)
- ✅ Scripts genéricos (`scripts/ci-run.sh`, `scripts/ci-run.ps1`)

**Ejecución automática:**
- Push a main/master/develop
- Pull requests
- Manualmente desde UI

**Resultados:**
- Artifacts guardados por 30 días
- Comentarios automáticos en PRs (GitHub)
- Reportes JSON y CSV

### Próximos Pasos

1. ✅ **Automatizar en CI/CD**: Integrado (ver `CI_CD_INTEGRATION.md`)
2. ✅ **Alertas automáticas**: Integrado para app mobile (ver `docs/MOBILE_MONITORING.md`)
3. **Dashboards**: Visualización en tiempo real
4. **Comparación histórica**: Comparar resultados entre ejecuciones
5. **Optimización continua**: Implementar mejoras basadas en resultados

## 📱 Monitoreo y Alertas para App Mobile

Sistema completo de monitoreo y alertas para la aplicación mobile en staging.

### Características

- ✅ Métricas clave (crashes, ANR, latencia, error rate) reportadas a sistema de monitoring
- ✅ Alertas mínimas configuradas (aumento de crash rate, error rate > umbral)
- ✅ Pruebas que disparan alertas en staging y validan notificaciones
- ✅ Dashboard básico disponible para el equipo

### Herramientas

- **Sentry**: Crashes, errores, performance, ANR detection
- **Backend Monitoring**: Sistema de alertas integrado
- **Mobile Alert Service**: Servicio específico para métricas mobile

### Configuración Rápida

#### Flutter

1. Configurar DSN de Sentry en `lib/config/monitoring_config.dart`
2. O usar variables de entorno:
   ```bash
   flutter run --dart-define=SENTRY_DSN=your_dsn --dart-define=ENVIRONMENT=staging
   ```

#### Backend

Los endpoints están disponibles en `/api/mobile/monitoring/`:
- `POST /crash` - Reportar crash
- `POST /error` - Reportar error
- `POST /latency` - Reportar latencia
- `POST /anr` - Reportar ANR
- `GET /metrics` - Obtener métricas
- `POST /thresholds` - Configurar umbrales

### Dashboard

Acceso: `http://localhost:3000/dashboard/mobile-monitoring.html`

### Umbrales de Alerta

- **Crash Rate**: > 1% de sesiones
- **Error Rate**: > 5% de requests
- **Latency P95**: > 2 segundos
- **ANR**: > 5 por hora

### Pruebas

```bash
# Disparar alertas para pruebas
node backend/scripts/trigger-mobile-alerts.js all
```

### Documentación Completa

Ver `docs/MOBILE_MONITORING.md` para documentación detallada.

