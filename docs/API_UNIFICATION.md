# API Unificada - Documentación

## 📋 Descripción

API REST unificada que permite que tanto la aplicación web como la aplicación móvil Flutter consuman el mismo servidor y base de datos, garantizando consistencia de datos.

## ✅ Características

- ✅ **API Centralizada**: Un solo servidor para ambos clientes
- ✅ **Base de Datos Unificada**: MongoDB `ASISTENCIA` compartida
- ✅ **CORS Configurado**: Soporte para requests desde web y móvil
- ✅ **Detección de Cliente**: Identificación automática del tipo de cliente
- ✅ **Headers Personalizados**: Soporte para `X-Client-Type` y `X-Device-ID`

## 🔧 Configuración

### Base de Datos

Ambos clientes usan la misma instancia de MongoDB:

```javascript
mongoose.connect(process.env.MONGODB_URI, {
  dbName: 'ASISTENCIA'  // Base de datos unificada
});
```

### CORS

Configuración CORS que permite:
- Requests desde navegadores web (localhost, producción)
- Requests desde app móvil (sin origin, IPs locales)
- Headers personalizados (`X-Client-Type`, `X-Device-ID`)

### Detección de Cliente

El servidor detecta automáticamente el tipo de cliente:

1. **Por Header**: `X-Client-Type: web|mobile`
2. **Por User-Agent**: Detecta "Flutter" para móvil
3. **Por defecto**: Asume "web" si no se puede detectar

## 📊 Endpoints

### Salud del Sistema

```bash
GET /health
```

**Respuesta**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00Z",
  "database": {
    "status": "connected",
    "name": "ASISTENCIA"
  },
  "client": {
    "type": "mobile",
    "deviceId": "device-123"
  },
  "api": {
    "version": "1.0.0",
    "unified": true
  }
}
```

### Verificar Compatibilidad

```bash
GET /api/compatibility/check
Headers:
  X-Client-Type: mobile
  X-Device-ID: device-123
```

**Respuesta**:
```json
{
  "success": true,
  "compatible": true,
  "client": {
    "type": "mobile",
    "deviceId": "device-123",
    "detected": true
  },
  "server": {
    "version": "1.0.0",
    "database": "ASISTENCIA",
    "unified": true
  }
}
```

### Información de API

```bash
GET /api/info
```

**Respuesta**:
```json
{
  "name": "API Unificada - Sistema de Asistencia",
  "version": "1.0.0",
  "database": {
    "type": "MongoDB",
    "name": "ASISTENCIA",
    "unified": true
  },
  "clients": {
    "web": {
      "supported": true,
      "cors": true
    },
    "mobile": {
      "supported": true
    }
  }
}
```

### Estadísticas de Unificación

```bash
GET /api/unification/stats
```

**Respuesta**:
```json
{
  "success": true,
  "unified": true,
  "database": {
    "name": "ASISTENCIA",
    "shared": true,
    "connection": "connected"
  },
  "statistics": {
    "webRequests": 150,
    "mobileRequests": 200,
    "totalRequests": 350,
    "webPercentage": "42.86",
    "mobilePercentage": "57.14"
  }
}
```

## 🔄 Uso desde Clientes

### Web (JavaScript)

```javascript
fetch('http://localhost:3000/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Type': 'web'
  },
  body: JSON.stringify(data)
});
```

### Mobile (Flutter)

```dart
final response = await http.post(
  Uri.parse('${ApiConfig.baseUrl}/api/endpoint'),
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Type': 'mobile',
    'X-Device-ID': deviceId,
  },
  body: jsonEncode(data),
);
```

## ✅ Verificación

### Verificar que ambos clientes usan la misma BD

1. Hacer request desde web a `/health`
2. Hacer request desde móvil a `/health`
3. Verificar que ambos muestran `database.name: "ASISTENCIA"`

### Verificar compatibilidad

```bash
# Desde web
curl -H "X-Client-Type: web" http://localhost:3000/api/compatibility/check

# Desde móvil
curl -H "X-Client-Type: mobile" -H "X-Device-ID: test-123" http://localhost:3000/api/compatibility/check
```

## 🧪 Tests

Ejecutar tests de unificación:

```bash
npm test -- api_unification.test.js
```

Los tests verifican:
- ✅ Configuración CORS
- ✅ Detección de clientes
- ✅ Headers personalizados
- ✅ Base de datos unificada
- ✅ Formato de respuestas

## 📝 Notas

- La base de datos `ASISTENCIA` es compartida entre ambos clientes
- Todos los endpoints son accesibles desde web y móvil
- El servidor detecta automáticamente el tipo de cliente
- Las estadísticas de uso se registran automáticamente

