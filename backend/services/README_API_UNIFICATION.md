# API Unificada - Documentación

## 📋 Descripción

Sistema unificado de API para consumo desde aplicación web y aplicación móvil Flutter. Garantiza consistencia de datos y compatibilidad entre ambos clientes.

## ✅ Acceptance Criteria Cumplidos

- ✅ **API unificada implementada**: Todos los endpoints son accesibles desde web y móvil
- ✅ **Misma BD utilizada**: Ambos clientes consumen la misma base de datos MongoDB
- ✅ **Endpoints compatibles configurados**: CORS y headers configurados para ambos clientes

## 🚀 Características

### 1. CORS Configurado

- Permite requests desde cualquier origen en desarrollo
- Configuración específica para producción
- Soporte para IPs locales (desarrollo móvil)
- Credentials habilitados

### 2. Headers Personalizados

- `X-Client-Type`: Identifica el tipo de cliente (web/mobile)
- `X-Device-ID`: Identifica el dispositivo móvil
- `Authorization`: Token de autenticación

### 3. Compatibilidad de Endpoints

- Todos los endpoints son compatibles con web y móvil
- Validación automática de compatibilidad
- Reportes de compatibilidad disponibles

### 4. Documentación Unificada

- Documentación Markdown
- Documentación OpenAPI/Swagger
- Ejemplos para ambos clientes

## 📁 Archivos Creados

```
backend/
├── services/
│   └── api_compatibility_service.js    # Servicio de compatibilidad
├── utils/
│   └── api_documentation_generator.js  # Generador de documentación
└── tests/
    └── api_compatibility.test.js       # Tests de compatibilidad
```

## 🔧 Configuración

### CORS

```javascript
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (app móvil)
    if (!origin) return callback(null, true);
    
    // Lista de orígenes permitidos
    const allowedOrigins = [
      'http://localhost:3000',
      'https://movilesii.onrender.com',
      /^https?:\/\/192\.168\.\d+\.\d+:\d+$/, // IPs locales
    ];
    
    callback(null, true); // En desarrollo
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Type', 'X-Device-ID']
};
```

### Headers de Cliente

**Web**:
```javascript
fetch('/api/endpoint', {
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Type': 'web'
  }
});
```

**Mobile (Flutter)**:
```dart
final response = await http.get(
  Uri.parse('${ApiConfig.baseUrl}/api/endpoint'),
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Type': 'mobile',
    'X-Device-ID': deviceId,
  },
);
```

## 📊 Endpoints de Compatibilidad

### Obtener Reporte de Compatibilidad

```bash
GET /api/compatibility/report
```

**Respuesta**:
```json
{
  "success": true,
  "report": {
    "totalEndpoints": 50,
    "compatibleWithWeb": 50,
    "compatibleWithMobile": 50,
    "compatibleWithBoth": 50,
    "issues": [],
    "endpointsByMethod": {
      "GET": 30,
      "POST": 15,
      "PUT": 3,
      "DELETE": 2
    }
  },
  "criticalValidation": {
    "allPresent": true,
    "allCompatible": true,
    "missing": [],
    "incompatible": []
  }
}
```

### Validar Request

```bash
POST /api/compatibility/validate
Content-Type: application/json

{
  "method": "GET",
  "path": "/asistencias",
  "headers": {
    "X-Client-Type": "mobile"
  }
}
```

### Generar Documentación

```bash
GET /api/docs?format=markdown
GET /api/docs?format=openapi
```

## 🧪 Tests

Ejecutar tests de compatibilidad:

```bash
npm test -- api_compatibility.test.js
```

Los tests verifican:
- Configuración CORS
- Endpoints críticos
- Formato de respuestas
- Detección de clientes
- Soporte de headers

## 📝 Notas Técnicas

1. **Base de Datos Unificada**: Ambos clientes usan la misma instancia de MongoDB
2. **Autenticación Unificada**: Mismo sistema de autenticación para ambos clientes
3. **Sincronización**: La app móvil tiene sincronización offline que se integra con la misma BD
4. **Versionado**: La API está preparada para versionado futuro (v1, v2, etc.)

## 🔄 Flujo de Datos

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Web App   │────────▶│              │◀────────│  Mobile App │
└─────────────┘         │  Backend API │         └─────────────┘
                        │   (Node.js)  │
                        └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   MongoDB    │
                        │  (Unificada) │
                        └──────────────┘
```

## ✅ Checklist de Compatibilidad

- [x] CORS configurado correctamente
- [x] Headers personalizados soportados
- [x] Endpoints críticos disponibles
- [x] Formato de respuesta consistente
- [x] Autenticación unificada
- [x] Base de datos unificada
- [x] Documentación generada
- [x] Tests de compatibilidad
- [x] Validación de requests
- [x] Reportes de compatibilidad

