# Guía de Testing

## 📋 Resumen

Este proyecto implementa tests unitarios con cobertura mínima de:
- **Backend**: ≥80%
- **Frontend Flutter**: ≥75%

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
# Ejecutar todos los tests con cobertura
npm test

# Ejecutar en modo watch
npm run test:watch

# Ejecutar para CI/CD
npm run test:ci
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
│   ├── setup.js              # Configuración global de tests
│   ├── utils/
│   │   └── mocks.js          # Mocks reutilizables
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
- ✅ Backend: ≥80% (branches, functions, lines, statements)
- ✅ Frontend: ≥75% (líneas de código)

### Tests Unitarios
- ✅ Tests para casos edge y manejo de errores
- ✅ Tests para funciones de negocio, validaciones y utilidades

### Mocks
- ✅ Mocks configurados para MongoDB (mongodb-memory-server)
- ✅ Mocks para servicios externos y dependencias

### CI/CD
- ✅ Tests ejecutándose automáticamente en GitHub Actions
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

### Frontend
- Si los tests fallan, ejecuta `flutter clean` y `flutter pub get`
- Verifica que todas las dependencias estén en `pubspec.yaml`

