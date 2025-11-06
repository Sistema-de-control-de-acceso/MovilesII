# Optimización de Horarios de Buses

## 📋 Descripción

Sistema completo para sugerir horarios óptimos de buses basado en análisis de patrones de demanda, cálculo de eficiencia y algoritmos de optimización. Permite generar sugerencias automáticas de horarios que maximizan la ocupación, reducen costos y mejoran la eficiencia del transporte universitario.

## ✅ Acceptance Criteria Cumplidos

- ✅ **Algoritmo de optimización implementado**: Algoritmo completo que analiza patrones de demanda y genera horarios optimizados
- ✅ **Sugerencias de horarios generadas**: Generación automática de sugerencias basadas en datos históricos
- ✅ **Métricas de eficiencia calculadas**: Cálculo completo de métricas de eficiencia del transporte

## 📁 Archivos Creados

```
backend/
├── ml/
│   └── bus_schedule_optimizer.js    # Algoritmo de optimización de horarios
└── index.js                          # Endpoints API agregados
```

## 🚀 Endpoints Disponibles

### 1. Análisis de Patrones de Demanda

#### Analizar patrones de demanda por ruta
```bash
GET /api/buses/optimization/demand-patterns?ruta=Ruta1&days_of_week=lunes,martes&start_date=2024-01-01&end_date=2024-01-31
```

**Parámetros:**
- `ruta` (requerido): Nombre de la ruta
- `days_of_week` (opcional): Días de la semana separados por comas
- `start_date` (opcional): Fecha de inicio del análisis
- `end_date` (opcional): Fecha de fin del análisis

**Respuesta:**
```json
{
  "success": true,
  "hourlyDemand": {
    "8": {
      "totalPasajeros": 150,
      "promedioOcupacion": 75.5,
      "numeroViajes": 3,
      "promedioPasajerosPorViaje": 50
    }
  },
  "peakHours": [8, 9, 17],
  "averageOccupancy": 65.2,
  "totalTrips": 120,
  "totalDemand": 3600
}
```

### 2. Generación de Horarios Óptimos

#### Generar horarios óptimos para una ruta y día
```bash
POST /api/buses/optimization/generate-schedule
Content-Type: application/json

{
  "ruta": "Ruta A - Centro",
  "dia_semana": "lunes",
  "capacidad_bus": 50,
  "ocupacion_objetivo": 80
}
```

**Respuesta:**
```json
{
  "success": true,
  "ruta": "Ruta A - Centro",
  "diaSemana": "lunes",
  "schedules": [
    {
      "horario_salida": "08:00",
      "horario_llegada": "08:35",
      "frecuencia_minutos": 15,
      "demanda_esperada": 50,
      "ocupacion_esperada": 85.5,
      "prioridad": "alta"
    }
  ],
  "demandPattern": {...},
  "frequencies": {...},
  "metrics": {
    "totalHorarios": 20,
    "horasPico": [8, 9, 17],
    "ocupacionPromedio": 65.2,
    "ocupacionObjetivo": 80
  }
}
```

### 3. Generación Masiva de Sugerencias

#### Generar sugerencias para múltiples rutas
```bash
POST /api/buses/optimization/generate-suggestions
Content-Type: application/json

{
  "rutas": ["Ruta A", "Ruta B"],
  "dias_semana": ["lunes", "martes", "miercoles", "jueves", "viernes"],
  "ocupacion_objetivo": 80,
  "save_suggestions": true
}
```

**Respuesta:**
```json
{
  "success": true,
  "suggestions": [...],
  "total": 200,
  "rutas": 2,
  "dias": 5,
  "ocupacionObjetivo": 80,
  "saved_count": 200
}
```

### 4. Métricas de Eficiencia

#### Calcular métricas de eficiencia para un horario específico
```bash
GET /api/buses/optimization/schedule-efficiency?ruta=Ruta1&horario_salida=08:00&dia_semana=lunes&capacidad_bus=50
```

**Respuesta:**
```json
{
  "success": true,
  "metrics": {
    "eficiencia": 85.5,
    "ocupacionEsperada": 80.2,
    "costoEsperado": 2.5,
    "tiempoViajeEsperado": 35,
    "promedioPasajeros": 40.1,
    "viajesAnalizados": 15
  }
}
```

#### Obtener métricas generales de eficiencia del transporte
```bash
GET /api/buses/optimization/transport-efficiency?start_date=2024-01-01&end_date=2024-01-31&ruta=Ruta1
```

**Respuesta:**
```json
{
  "success": true,
  "metrics": {
    "tasaOcupacionPromedio": 65.2,
    "costoPorPasajero": 2.5,
    "tiempoViajePromedio": 35,
    "eficienciaGeneral": 72.5,
    "totalViajes": 120,
    "totalPasajeros": 3600,
    "totalCosto": 9000,
    "capacidadPromedio": 50,
    "promedioPasajerosPorViaje": 30
  }
}
```

## 🔧 Algoritmo de Optimización

### Análisis de Patrones de Demanda

El algoritmo analiza:
1. **Demanda por hora**: Número de pasajeros por hora del día
2. **Ocupación promedio**: Tasa de ocupación promedio por hora
3. **Horas pico**: Identificación de horas con mayor demanda
4. **Frecuencia actual**: Número de viajes por hora

### Cálculo de Frecuencia Óptima

La frecuencia óptima se calcula basándose en:
- Demanda esperada por hora
- Capacidad del bus
- Ocupación objetivo (por defecto 80%)
- Fórmula: `viajes_necesarios = demanda_hora / (capacidad * ocupacion_objetivo / 100)`

### Generación de Horarios

Los horarios se generan considerando:
- Frecuencia calculada
- Intervalos mínimos (15 minutos)
- Intervalos máximos (60 minutos)
- Redondeo a múltiplos de 5 minutos
- Priorización de horas pico

### Métricas de Eficiencia

Las métricas se calculan usando:
- **Ocupación**: Porcentaje de capacidad utilizada (50% peso)
- **Costo**: Costo por pasajero (30% peso, inverso)
- **Tiempo**: Tiempo de viaje (20% peso, inverso)

Fórmula de eficiencia:
```
eficiencia = (ocupacion/100 * 0.5) + (1 - min(costo/10, 1) * 0.3) + (1 - min(tiempo/60, 1) * 0.2) * 100
```

## 📊 Interfaz de Usuario

La interfaz Flutter (`lib/views/admin/bus_schedule_suggestions_view.dart`) permite:
- Ver métricas de eficiencia actuales
- Analizar patrones de demanda por ruta
- Generar horarios optimizados
- Visualizar sugerencias con prioridad y métricas
- Guardar sugerencias automáticamente

## 🎯 Casos de Uso

1. **Análisis de Demanda**: Identificar horas pico y patrones de uso
2. **Optimización de Horarios**: Generar horarios que maximicen ocupación
3. **Evaluación de Eficiencia**: Calcular métricas de eficiencia del transporte
4. **Generación Masiva**: Crear sugerencias para múltiples rutas y días

## 📝 Notas Técnicas

- El algoritmo utiliza datos históricos de las últimas 4 semanas por defecto
- Las sugerencias se ordenan por prioridad y eficiencia
- Se evitan duplicados al guardar sugerencias
- El sistema calcula impacto esperado para cada sugerencia
- Las métricas se actualizan en tiempo real basándose en datos históricos

