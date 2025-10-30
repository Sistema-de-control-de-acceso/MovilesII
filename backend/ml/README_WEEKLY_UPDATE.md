# Actualización Automática Semanal del Modelo - Documentación

## 📋 Descripción

Sistema de actualización automática semanal del modelo ML con reentrenamiento incremental, validación de performance automatizada y monitoreo de drift.

## ✅ Acceptance Criteria Cumplidos

- ✅ **Job automático semanal configurado**: Scheduler configurado para ejecución semanal
- ✅ **Reentrenamiento incremental implementado**: Actualización con datos nuevos sin perder conocimiento anterior
- ✅ **Validación performance automatizada**: Validación automática después de cada actualización

## 📁 Archivos Creados

```
backend/ml/
├── weekly_model_update_service.js      ✅ Servicio de actualización semanal
├── model_drift_monitor.js              ✅ Monitor de drift del modelo
└── automatic_update_scheduler.js      ✅ Scheduler de jobs automáticos
```

## 🚀 Endpoints Disponibles

### 1. Configurar Job Automático Semanal

```bash
POST /ml/update/schedule
Body: {
  "dayOfWeek": 0,    // 0=Domingo, 1=Lunes, ...
  "hour": 2,        // 2 AM
  "interval": 7,    // días
  "enabled": true
}
```

### 2. Obtener Estado del Scheduler

```bash
GET /ml/update/schedule/status
```

### 3. Detener Scheduler

```bash
POST /ml/update/schedule/stop
```

### 4. Ejecutar Actualización Semanal Manualmente

```bash
POST /ml/update/weekly
Body: {
  "incremental": true,
  "validatePerformance": true,
  "checkDrift": true,
  "targetR2": 0.7
}
```

### 5. Obtener Historial de Actualizaciones

```bash
GET /ml/update/history?limit=10
```

### 6. Monitorear Drift del Modelo

```bash
GET /ml/update/drift
```

### 7. Validar Performance

```bash
POST /ml/update/validate-performance
Body: {
  "days": 7
}
```

### 8. Obtener Configuración

```bash
GET /ml/update/config
```

## 🔄 Reentrenamiento Incremental

### Características

- **Preserva conocimiento anterior**: Usa pesos del modelo anterior
- **Ajuste fino**: Learning rate reducido para ajuste suave
- **Combinación de datos**: Últimos 1000 del anterior + datos nuevos
- **Validación automática**: Verifica que el nuevo modelo no degrade

### Proceso

1. Cargar modelo actual
2. Recopilar datos nuevos (últimos 7 días)
3. Combinar con datos anteriores
4. Ajuste fino con learning rate reducido
5. Validación cruzada
6. Validación de performance
7. Guardar si mejora o mantiene calidad

### Ventajas

- Más rápido que reentrenamiento completo
- Mantiene conocimiento histórico
- Adaptación continua a nuevos patrones
- Menor riesgo de sobreajuste

## 📊 Monitoreo de Drift

### Tipos de Drift Detectados

1. **Drift Estadístico**
   - Cambios en distribución de datos
   - Método: KS-like test
   - Threshold: 0.3

2. **Drift de Características**
   - Cambios en distribución de features
   - Comparación de medias y desviaciones
   - Threshold: 0.2

3. **Drift de Performance**
   - Degradación en métricas del modelo
   - Comparación de errores
   - Threshold: 0.1

### Severidad

- **High**: Score > 0.5 → Reentrenamiento completo recomendado
- **Medium**: Score > 0.3 → Reentrenamiento incremental o completo
- **Low**: Score > 0.1 → Monitorear de cerca
- **None**: Score ≤ 0.1 → Sin drift detectado

## ✅ Validación de Performance

### Métricas Comparadas

- **R²**: Coeficiente de determinación
- **RMSE**: Root Mean Squared Error
- **MAE**: Mean Absolute Error

### Criterios de Aceptación

- R² mejorado o mantenido
- RMSE mejorado o mantenido
- Degradación < 10%

### Protección contra Degradación

Si el nuevo modelo tiene degradación > 10%:
- Se mantiene el modelo anterior
- Se registra el intento de actualización
- Se genera alerta

## ⏰ Job Automático Semanal

### Configuración

```json
{
  "enabled": true,
  "dayOfWeek": 0,    // Domingo
  "hour": 2,         // 2 AM
  "interval": 7      // días
}
```

### Ejecución Automática

1. **Programación**: Calcula próxima ejecución
2. **Ejecución**: Ejecuta actualización semanal
3. **Validación**: Valida performance automáticamente
4. **Registro**: Guarda historial de ejecuciones

### Ejemplo de Respuesta

```json
{
  "success": true,
  "previousModel": "/path/to/old_model.json",
  "updatedModel": "/path/to/new_model.json",
  "incremental": true,
  "driftDetected": false,
  "performanceValidation": {
    "r2Improvement": 0.0234,
    "rmseImprovement": 1.45,
    "isImproved": true
  },
  "newDataSize": 1250
}
```

## 📈 Historial de Actualizaciones

Cada actualización registra:

- Modelo anterior y nuevo
- Tipo de actualización (incremental/completo)
- Drift detectado
- Métricas de performance
- Tamaño de datos nuevos
- Timestamp

## 🔍 Ejemplo de Uso

### 1. Configurar Actualización Semanal Automática

```bash
POST /ml/update/schedule
Body: {
  "dayOfWeek": 0,
  "hour": 2,
  "enabled": true
}
```

### 2. Monitorear Drift

```bash
GET /ml/update/drift
```

Respuesta:
```json
{
  "driftDetected": false,
  "severity": "none",
  "score": 0.05,
  "report": {
    "statistical": { "detected": false },
    "feature": { "detected": false },
    "performance": { "detected": false }
  }
}
```

### 3. Ejecutar Actualización Manual

```bash
POST /ml/update/weekly
Body: {
  "incremental": true,
  "validatePerformance": true
}
```

## 💡 Características Avanzadas

1. **Detección Automática de Drift**: Monitor continuo de cambios
2. **Reentrenamiento Inteligente**: Incremental o completo según drift
3. **Protección contra Degradación**: Mantiene modelo anterior si es peor
4. **Historial Completo**: Registro de todas las actualizaciones
5. **Configuración Flexible**: Schedule personalizable

## ⚙️ Requisitos

- Modelo actual entrenado
- Datos nuevos disponibles (mínimo 10 registros)
- Acceso a MongoDB para datos históricos

## 📌 Notas

- El job automático se ejecuta en segundo plano
- La actualización puede tardar varios minutos
- El sistema protege contra degradación automáticamente
- El drift se monitorea antes de cada actualización
- Los historiales se guardan en `data/model_updates/`

