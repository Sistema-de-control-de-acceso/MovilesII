# Análisis de Patrones de Flujo de Estudiantes

## 📋 Descripción

Sistema completo para analizar patrones de flujo de estudiantes, detectar tendencias automáticamente y visualizar datos en un dashboard analítico interactivo.

## ✅ Acceptance Criteria Cumplidos

- ✅ **Algoritmos análisis temporal implementados**: Análisis completo de series temporales con detección de patrones
- ✅ **Detección patrones automatizada**: Detección automática de horarios pico, tendencias, estacionalidad y anomalías
- ✅ **Visualización tendencias disponible**: Dashboard analítico completo con múltiples gráficos interactivos

## 📁 Estructura de Archivos

```
backend/ml/
├── flow_pattern_analyzer.js          # Analizador de patrones de flujo
├── trend_visualization_service.js    # Servicio de visualización de tendencias
└── README_FLOW_PATTERNS.md          # Este archivo

backend/public/dashboard/
├── analytics.html                    # Dashboard analítico
├── analytics.css                     # Estilos del dashboard
└── analytics.js                      # Lógica del dashboard
```

## 🚀 Endpoints Disponibles

### 1. Analizar Patrones de Flujo

```bash
GET /api/ml/patterns/analyze?months=3&granularity=hour
```

**Parámetros:**
- `months`: Número de meses de datos históricos (default: 3)
- `granularity`: Granularidad temporal (`hour`, `day`, `week`) (default: `hour`)
- `startDate`: Fecha de inicio (opcional)
- `endDate`: Fecha de fin (opcional)
- `includeAnomalies`: Incluir detección de anomalías (default: `true`)
- `includeTrends`: Incluir análisis de tendencias (default: `true`)
- `includeSeasonality`: Incluir análisis de estacionalidad (default: `true`)

**Respuesta:**
```json
{
  "success": true,
  "dateRange": { "start": "...", "end": "..." },
  "granularity": "hour",
  "dataPoints": 720,
  "patterns": {
    "temporal": { "hourly": {...}, "daily": {...} },
    "peaks": [...],
    "trends": { "direction": "increasing", "strength": 0.75 },
    "seasonality": { "hasSeasonality": true, "period": 24 },
    "anomalies": { "anomalies": [...], "count": 5 },
    "flowDistribution": { "entries": {...}, "exits": {...} },
    "statistics": { "mean": 45.2, "median": 42, ... }
  }
}
```

### 2. Generar Visualización de Tendencias

```bash
GET /api/ml/trends/visualize?months=3&granularity=hour&includeForecast=true
```

**Parámetros:**
- `months`: Número de meses (default: 3)
- `granularity`: Granularidad temporal (default: `hour`)
- `includePatterns`: Incluir análisis de patrones (default: `true`)
- `includeForecast`: Incluir forecast (default: `false`)
- `forecastSteps`: Pasos de forecast (default: 24)

**Respuesta:**
```json
{
  "success": true,
  "chartData": {
    "timeSeriesLine": {...},
    "hourlyBar": {...},
    "dailyBar": {...},
    "flowDistribution": {...},
    "trendLine": {...},
    "anomalies": {...},
    "heatmap": {...}
  },
  "summary": {
    "overview": {...},
    "trends": {...},
    "seasonality": {...},
    "recommendations": [...]
  }
}
```

### 3. Obtener Resumen Ejecutivo

```bash
GET /api/ml/patterns/summary?months=3&granularity=hour
```

Retorna resumen ejecutivo con insights y recomendaciones.

## 📊 Dashboard Analítico

El dashboard analítico está disponible en:
```
http://localhost:3000/dashboard/analytics.html
```

### Características del Dashboard

- **Gráficos Interactivos**:
  - Evolución temporal del flujo (línea)
  - Distribución por hora del día (barras)
  - Distribución por día de la semana (barras)
  - Entradas vs Salidas (pie)
  - Heatmap día x hora
  - Anomalías detectadas (scatter)

- **Tarjetas de Resumen**:
  - Flujo total
  - Tendencia (creciente/decreciente/estable)
  - Promedio por período
  - Número de anomalías

- **Insights y Recomendaciones**:
  - Recomendaciones automáticas basadas en patrones detectados
  - Priorización de recomendaciones (alta/media/baja)
  - Acciones sugeridas

### Controles

- **Selector de Granularidad**: Cambiar entre hora/día/semana
- **Selector de Período**: Seleccionar meses de datos (1, 3, 6, 12)
- **Botón Actualizar**: Refrescar datos

## 🔍 Funcionalidades de Análisis

### Detección de Patrones Temporales

- **Por Hora**: Promedio, mediana, min, max por hora del día
- **Por Día**: Promedio y variabilidad por día de la semana
- **Patrones Semanales**: Identificación de días pico

### Detección de Horarios Pico

- Identificación automática de períodos con flujo anormalmente alto
- Clasificación por tipo (normal/extremo)
- Contexto de cada pico (hora, día, entradas/salidas)

### Análisis de Tendencias

- Dirección: creciente, decreciente o estable
- Fuerza de la tendencia (R²)
- Pendiente e intercepto

### Detección de Estacionalidad

- **Estacionalidad Semanal**: Patrones por día de la semana
- **Estacionalidad Diaria**: Patrones por hora del día
- Fuerza de estacionalidad
- Días y horas pico identificados

### Detección de Anomalías

- Método estadístico (regla de 3-sigma)
- Anomalías altas y bajas
- Desviación estándar
- Contexto temporal

### Distribución de Flujo

- Entradas vs Salidas
- Porcentajes y ratios
- Autorizaciones manuales

## 📈 Métricas Calculadas

### Estadísticas Descriptivas
- Total de flujo
- Media, mediana, desviación estándar
- Mínimo, máximo
- Cuartiles (Q1, Q3, IQR)

### Métricas Temporales
- Promedio por hora/día/semana
- Variabilidad temporal
- Patrones cíclicos

## 🎯 Recomendaciones Automáticas

El sistema genera recomendaciones basadas en:

1. **Tendencias**: Si hay tendencia creciente, sugiere aumentar recursos
2. **Horarios Pico**: Optimización de distribución de carga
3. **Estacionalidad**: Ajuste de horarios según días pico
4. **Anomalías**: Mejora de monitoreo y detección de causas

## 📝 Ejemplo de Uso

### Desde API

```javascript
// Analizar patrones
const response = await fetch('/api/ml/patterns/analyze?months=3&granularity=hour');
const patterns = await response.json();

// Visualización
const viz = await fetch('/api/ml/trends/visualize?months=3&includeForecast=true');
const visualization = await viz.json();
```

### Desde Dashboard

1. Abrir `http://localhost:3000/dashboard/analytics.html`
2. Seleccionar granularidad y período
3. Hacer clic en "Actualizar"
4. Revisar gráficos y recomendaciones

## ⚙️ Requisitos

- Node.js >= 12.0.0
- MongoDB con datos históricos
- Mínimo 1 mes de datos para análisis básico
- Mínimo 3 meses recomendado para análisis completo

## 🔧 Configuración

No requiere configuración adicional. Los servicios se inicializan automáticamente con el modelo `Asistencia`.

## 📚 Dependencias

- `simple-statistics`: Cálculos estadísticos
- `chart.js`: Visualización de gráficos (en el frontend)

## 🎨 Personalización

El dashboard puede personalizarse modificando:
- `analytics.css`: Estilos y colores
- `analytics.js`: Lógica de visualización
- Servicios backend: Algoritmos de análisis

## 📊 Mejoras Futuras

- [ ] Exportación de reportes PDF
- [ ] Comparación de períodos
- [ ] Alertas automáticas
- [ ] Integración con modelos predictivos
- [ ] Análisis por facultad/escuela
- [ ] Predicciones interactivas

## 🔗 Referencias

- [Chart.js Documentation](https://www.chartjs.org/)
- [Time Series Analysis](https://otexts.com/fpp3/)
- [Statistical Pattern Detection](https://en.wikipedia.org/wiki/Pattern_recognition)
