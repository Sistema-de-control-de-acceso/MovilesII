# Monitoreo y Alertas para App Mobile

Sistema completo de monitoreo y alertas para la aplicación mobile en staging.

## 📋 Características

- ✅ Métricas clave (crashes, ANR, latencia, error rate) reportadas a sistema de monitoring
- ✅ Alertas mínimas configuradas (aumento de crash rate, error rate > umbral)
- ✅ Pruebas que disparan alertas en staging y validan notificaciones
- ✅ Dashboard básico disponible para el equipo

## 🛠️ Herramientas Utilizadas

### Sentry (App Mobile)
- **Crashes**: Captura automática de crashes y excepciones
- **Performance**: Monitoreo de latencia y transacciones
- **ANR Detection**: Detección de Application Not Responding
- **Error Tracking**: Seguimiento de errores y excepciones

### Backend Monitoring
- **Alert Service**: Sistema de alertas integrado
- **Mobile Alert Service**: Servicio específico para métricas mobile
- **Health Monitoring**: Integración con sistema de monitoreo de salud

## 📱 Configuración en Flutter

### 1. Variables de Entorno

Configurar DSN de Sentry en `lib/config/monitoring_config.dart`:

```dart
static const String sentryDsn = 'YOUR_SENTRY_DSN_HERE';
```

O usar variables de entorno:

```bash
flutter run --dart-define=SENTRY_DSN=your_dsn_here --dart-define=ENVIRONMENT=staging
```

### 2. Inicialización

Sentry se inicializa automáticamente en `main.dart`. No requiere configuración adicional.

### 3. Uso en Código

```dart
import 'services/monitoring_service.dart';

// Capturar excepción
try {
  // código
} catch (e, stackTrace) {
  await MonitoringService().captureException(
    e,
    stackTrace: stackTrace,
    extra: {'operation': 'login'},
  );
}

// Medir latencia
final result = await MonitoringService().measureOperation(
  'getAlumno',
  () => apiService.getAlumno(codigo),
);

// Reportar métrica
MonitoringService().reportLatency('operation', 1500);
MonitoringService().reportErrorRate(0.05);
```

## 🔧 Configuración en Backend

### Endpoints Disponibles

#### Reportar Crash
```bash
POST /api/mobile/monitoring/crash
Body: {
  "deviceId": "device-123",
  "appVersion": "1.0.0",
  "platform": "android",
  "error": "Crash message",
  "stackTrace": "Stack trace",
  "context": {}
}
```

#### Reportar Error
```bash
POST /api/mobile/monitoring/error
Body: {
  "deviceId": "device-123",
  "appVersion": "1.0.0",
  "error": "Error message",
  "operation": "login",
  "context": {}
}
```

#### Reportar Latencia
```bash
POST /api/mobile/monitoring/latency
Body: {
  "deviceId": "device-123",
  "appVersion": "1.0.0",
  "operation": "getAlumno",
  "milliseconds": 1500
}
```

#### Reportar ANR
```bash
POST /api/mobile/monitoring/anr
Body: {
  "deviceId": "device-123",
  "appVersion": "1.0.0",
  "reason": "UI thread blocked",
  "context": {}
}
```

#### Obtener Métricas
```bash
GET /api/mobile/monitoring/metrics
```

#### Configurar Umbrales
```bash
POST /api/mobile/monitoring/thresholds
Body: {
  "crashRate": 0.01,
  "errorRate": 0.05,
  "latencyP95": 2000,
  "anrCount": 5
}
```

## 📊 Umbrales de Alerta

### Por Defecto

```javascript
{
  crashRate: 0.01,      // 1% de sesiones con crash
  errorRate: 0.05,      // 5% de requests con error
  latencyP95: 2000,     // P95 < 2 segundos
  anrCount: 5,          // Máximo 5 ANRs por hora
}
```

### Alertas

- **Crash Rate**: Alerta cuando > 1% de sesiones tienen crash
- **Error Rate**: Alerta cuando > 5% de requests tienen error
- **Latency**: Alerta cuando P95 > 2 segundos
- **ANR**: Alerta cuando > 5 ANRs en la última hora

## 🧪 Pruebas

### Disparar Alertas Manualmente

```bash
# Todas las alertas
node backend/scripts/trigger-mobile-alerts.js all

# Crash rate
node backend/scripts/trigger-mobile-alerts.js crash-rate

# Error rate
node backend/scripts/trigger-mobile-alerts.js error-rate

# Latency
node backend/scripts/trigger-mobile-alerts.js latency

# ANR
node backend/scripts/trigger-mobile-alerts.js anr
```

### Tests Unitarios

```bash
cd backend
npm test -- mobile-monitoring.test.js
```

## 📈 Dashboard

Acceso al dashboard web:
```
http://localhost:3000/dashboard/mobile-monitoring.html
```

**Características:**
- Métricas en tiempo real
- Auto-actualización cada 30 segundos
- Indicadores de estado (OK/WARNING/CRITICAL)
- Métricas de crashes, errors, latency, ANR, sessions

## 🔔 Notificaciones

### Canales de Alerta

1. **Log** (siempre activo)
   - Registra alertas en sistema de logging
   - Disponible en logs del servidor

2. **Email** (configurable)
   ```javascript
   const { EmailAlertChannel } = require('./services/alert_service');
   mobileAlertService.alertService.registerChannel(
     new EmailAlertChannel({ to: 'team@example.com' })
   );
   ```

3. **Slack** (futuro)
   - Integración con webhooks de Slack

## 📝 Procedimientos de Respuesta

### Crash Rate Alto

1. **Verificar en Sentry**: Revisar crashes recientes
2. **Identificar patrón**: Buscar crashes similares
3. **Revisar logs**: Verificar contexto adicional
4. **Priorizar fix**: Basado en frecuencia e impacto
5. **Deploy hotfix**: Si es crítico

### Error Rate Alto

1. **Revisar errores**: Verificar tipos de error más comunes
2. **Analizar operaciones**: Identificar endpoints afectados
3. **Revisar backend**: Verificar logs del servidor
4. **Correlacionar**: Buscar cambios recientes
5. **Implementar fix**: Corregir errores identificados

### Latencia Alta

1. **Identificar operaciones**: Ver qué operaciones son lentas
2. **Revisar backend**: Verificar métricas del servidor
3. **Analizar red**: Verificar conectividad
4. **Optimizar**: Implementar mejoras de performance
5. **Monitorear**: Verificar mejoras

### ANRs Detectados

1. **Identificar causa**: Revisar razón del ANR
2. **Analizar UI thread**: Verificar operaciones bloqueantes
3. **Revisar código**: Buscar operaciones síncronas pesadas
4. **Optimizar**: Mover operaciones a background threads
5. **Validar**: Verificar que ANRs se reduzcan

## 🔍 Integración con Sentry

### Dashboard de Sentry

1. Acceder a: https://sentry.io/organizations/YOUR_ORG/projects/YOUR_PROJECT/
2. Revisar:
   - **Issues**: Crashes y errores agrupados
   - **Performance**: Transacciones y latencia
   - **Releases**: Versiones y su salud
   - **Alerts**: Alertas configuradas

### Configurar Alertas en Sentry

1. Ir a **Settings** → **Alerts**
2. Crear alerta:
   - **Tipo**: Issue, Performance, etc.
   - **Condición**: Ej. "Crash rate > 1%"
   - **Canal**: Email, Slack, etc.

## 📚 Referencias

- [Sentry Flutter Documentation](https://docs.sentry.io/platforms/flutter/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Mobile Monitoring Best Practices](https://docs.sentry.io/product/issues/)

## 🔄 Próximos Pasos

1. **Integrar con Slack**: Notificaciones en tiempo real
2. **Dashboard avanzado**: Gráficos históricos y tendencias
3. **Comparación de releases**: Métricas por versión
4. **Alertas inteligentes**: Machine learning para detectar anomalías
5. **Integración con CI/CD**: Bloquear releases con métricas malas

