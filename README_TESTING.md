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

