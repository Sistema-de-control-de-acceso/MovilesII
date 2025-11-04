# Modelo ARIMA para Series Temporales

## 📋 Descripción

Implementación completa de modelos ARIMA (AutoRegressive Integrated Moving Average) para análisis y forecasting de series temporales en el sistema de control de asistencias.

## ✅ Acceptance Criteria Cumplidos

- ✅ **ARIMA implementado**: Modelo ARIMA completo con parámetros configurables (p, d, q)
- ✅ **Estacionalidad detectada**: Detección automática de patrones estacionales usando autocorrelación
- ✅ **Forecast precisión >75%**: Validación de precisión con métricas completas (MAE, RMSE, MAPE, R²)
- ✅ **Métricas precisión temporal**: Métricas específicas para validación de forecasts temporales

## 📁 Estructura de Archivos

```
backend/ml/
├── time_series_service.js          # Preparación y análisis de series temporales
├── arima_model.js                  # Implementación del modelo ARIMA
├── arima_forecast_service.js       # Servicio de forecast con validación
├── temporal_accuracy_metrics.js    # Métricas de precisión temporal
└── run_arima_forecast.js           # Script de ejecución desde CLI
```

## 🚀 Uso

### 1. Instalar Dependencias

```bash
cd backend
npm install
```

Las dependencias necesarias son:
- `simple-statistics`: Cálculos estadísticos
- `ml-matrix`: Operaciones matriciales

### 2. Ejecutar Forecast desde Línea de Comandos

```bash
# Forecast básico (auto-selección de orden ARIMA)
node ml/run_arima_forecast.js 3 hour 24

# Forecast con orden específico ARIMA(1,1,1)
node ml/run_arima_forecast.js 3 hour 24 1 1 1

# Forecast diario para 7 días con ARIMA(2,1,1)
node ml/run_arima_forecast.js 6 day 7 2 1 1

# Forecast semanal
node ml/run_arima_forecast.js 12 week 4
```

**Parámetros:**
- `meses`: Número de meses de datos históricos a usar (default: 3)
- `intervalo`: Intervalo de agregación (`hour`, `day`, `week`) (default: `hour`)
- `pasos_forecast`: Número de pasos a predecir (default: 24)
- `orden_p`: Orden autoregresivo (opcional, para auto-selección omitir)
- `orden_d`: Orden de diferenciación (opcional)
- `orden_q`: Orden de media móvil (opcional)

### 3. Uso Programático

```javascript
const ARIMAForecastService = require('./ml/arima_forecast_service');
const Asistencia = require('./models/Asistencia');

const forecastService = new ARIMAForecastService(Asistencia);

// Ejecutar pipeline completo
const result = await forecastService.executeForecastPipeline({
  months: 3,
  interval: 'hour',
  metric: 'count',
  forecastSteps: 24,
  arimaOrder: { p: 1, d: 1, q: 1 }, // Opcional: null para auto-selección
  validateForecast: true,
  testSize: 0.2
});

console.log('Forecast:', result.forecast);
console.log('Precisión:', result.validation.accuracy);
```

## 📊 Características

### Modelo ARIMA

El modelo ARIMA implementa:

- **AR (AutoRegressive)**: Componente autoregresivo de orden p
- **I (Integrated)**: Diferenciación de orden d para hacer la serie estacionaria
- **MA (Moving Average)**: Componente de media móvil de orden q

**Parámetros:**
- `p`: Orden autoregresivo (número de valores pasados usados)
- `d`: Orden de diferenciación (número de veces que se diferencia la serie)
- `q`: Orden de media móvil (número de errores pasados usados)

### Detección de Estacionalidad

El sistema detecta automáticamente:

- **Período estacional**: Usando análisis de autocorrelación
- **Fuerza de estacionalidad**: Medida mediante correlación
- **Picos estacionales**: Identificación de períodos significativos

**Métodos:**
- Autocorrelación (ACF) para diferentes lags
- Identificación de picos significativos
- Análisis de fuerza estacional

### Validación de Precisión

El sistema valida la precisión del forecast con:

- **Accuracy**: Precisión general (≥75% requerido)
- **MAE**: Mean Absolute Error
- **RMSE**: Root Mean Squared Error
- **MAPE**: Mean Absolute Percentage Error
- **R²**: Coeficiente de determinación
- **Precisión direccional**: Capacidad de predecir dirección de cambios

### Métricas Temporales

Métricas específicas para series temporales:

- **Consistencia temporal**: Qué tan consistente es el error en el tiempo
- **Precisión por horizonte**: Precisión según el horizonte de forecast
- **SMAPE**: Symmetric Mean Absolute Percentage Error
- **Estadísticas descriptivas**: Media, mediana, desviación estándar

## 📈 Ejemplo de Resultados

```json
{
  "success": true,
  "forecast": [45.2, 48.5, 52.1, ...],
  "confidenceIntervals": [
    {
      "forecast": 45.2,
      "lower": 40.1,
      "upper": 50.3,
      "confidence": 0.95
    },
    ...
  ],
  "model": {
    "order": { "p": 1, "d": 1, "q": 1 },
    "isStationary": true,
    "summary": {
      "aic": 1234.56,
      "bic": 1256.78
    }
  },
  "seasonality": {
    "hasSeasonality": true,
    "period": 24,
    "strength": 0.65,
    "message": "Estacionalidad detectada con período 24 (fuerza: 0.65)"
  },
  "validation": {
    "accuracy": 0.82,
    "mae": 3.45,
    "rmse": 4.12,
    "mape": 8.23,
    "r2": 0.78,
    "directionalAccuracy": 0.75,
    "meetsMinimumAccuracy": true
  }
}
```

## 🔧 Configuración

### Orden ARIMA

El sistema puede:

1. **Auto-seleccionar**: Usa criterios de información (AIC) para encontrar el mejor orden
2. **Especificar manualmente**: Proporcionar orden ARIMA(p,d,q) específico

### Intervalos Temporales

- **`hour`**: Agregación por hora (útil para patrones diarios)
- **`day`**: Agregación por día (útil para patrones semanales)
- **`week`**: Agregación por semana (útil para patrones mensuales)

### Métricas

- **`count`**: Número de asistencias
- **`avg_authorization`**: Promedio de autorizaciones manuales
- **`authorization_count`**: Conteo de autorizaciones manuales

## 📝 Requisitos

- **Datos mínimos**: Al menos 30 puntos de datos
- **Recomendado**: Mínimo 3 meses de datos históricos
- **Para estacionalidad**: Al menos 2 períodos completos de datos

## 🧪 Validación

El sistema valida automáticamente:

1. **Disponibilidad de datos**: Verifica suficientes datos históricos
2. **Estacionariedad**: Verifica que el modelo sea estacionario
3. **Precisión mínima**: Valida que la precisión sea ≥75%
4. **Intervalos de confianza**: Calcula intervalos de confianza del 95%

## ⚠️ Limitaciones

- Implementación simplificada de ARIMA (métodos de Yule-Walker)
- Para series más complejas, considerar modelos ARIMA estacionales (SARIMA)
- La auto-selección de orden puede ser lenta con muchos datos
- Requiere datos suficientes para detectar estacionalidad

## 🔮 Mejoras Futuras

- [ ] Implementar SARIMA (ARIMA estacional)
- [ ] Auto-ARIMA con búsqueda exhaustiva
- [ ] Modelos híbridos (ARIMA + ML)
- [ ] Detección automática de outliers
- [ ] Visualización de resultados
- [ ] Integración con API REST

## 📚 Referencias

- [ARIMA Model](https://en.wikipedia.org/wiki/Autoregressive_integrated_moving_average)
- [Time Series Analysis](https://otexts.com/fpp3/)
- [Forecasting: Principles and Practice](https://otexts.com/fpp3/)

## 📞 Soporte

Para problemas o preguntas sobre el modelo ARIMA, consultar:
- Documentación del código en los archivos fuente
- Logs de ejecución en consola
- Métricas de validación en resultados
