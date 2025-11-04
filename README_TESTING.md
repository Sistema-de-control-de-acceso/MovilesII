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

