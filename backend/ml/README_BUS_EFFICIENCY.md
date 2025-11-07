# Reportes de Eficiencia de Buses

## 📋 Descripción

Sistema completo para generar reportes de eficiencia de buses que permite evaluar el impacto de optimizaciones mediante métricas de utilización, comparativos antes/después y cálculo automático de ROI (Return on Investment).

## ✅ Acceptance Criteria Cumplidos

- ✅ **Métricas de utilización calculadas**: Sistema completo de cálculo de métricas de utilización de buses
- ✅ **Comparativo antes/después disponible**: Comparación detallada entre períodos antes y después de optimizaciones
- ✅ **ROI calculado automáticamente**: Cálculo automático de ROI basado en ahorros y costos de optimización

## 📁 Archivos Creados

```
backend/
├── models/
│   └── Bus.js                          # Modelos de Bus y ViajeBus
└── ml/
    └── bus_efficiency_service.js       # Servicio de eficiencia de buses
```

## 🚀 Endpoints Disponibles

### 1. Gestión de Buses

#### Listar todos los buses
```bash
GET /buses
```

#### Obtener bus por ID
```bash
GET /buses/:id
```

#### Crear nuevo bus
```bash
POST /buses
Content-Type: application/json

{
  "placa": "ABC-123",
  "numero_bus": "BUS-001",
  "capacidad_maxima": 50,
  "tipo_bus": "regular",
  "estado": "activo"
}
```

#### Actualizar bus
```bash
PUT /buses/:id
Content-Type: application/json

{
  "estado": "mantenimiento",
  "capacidad_maxima": 55
}
```

#### Agregar optimización a un bus
```bash
POST /buses/:id/optimizaciones
Content-Type: application/json

{
  "tipo": "ruta",
  "descripcion": "Optimización de ruta para reducir tiempo de viaje",
  "costo": 5000,
  "impacto_esperado": 15
}
```

### 2. Gestión de Viajes

#### Listar viajes de buses
```bash
GET /viajes-buses?bus_id=xxx&ruta=Ruta1&estado=completado&startDate=2024-01-01&endDate=2024-01-31
```

#### Crear nuevo viaje
```bash
POST /viajes-buses
Content-Type: application/json

{
  "bus_id": "uuid-bus",
  "ruta": "Ruta A - Centro",
  "fecha_salida": "2024-01-15T08:00:00Z",
  "fecha_llegada": "2024-01-15T09:30:00Z",
  "pasajeros_transportados": 45,
  "distancia_km": 25,
  "tiempo_viaje_minutos": 90,
  "costo_operacion": 150,
  "estado": "completado"
}
```

#### Actualizar viaje
```bash
PUT /viajes-buses/:id
Content-Type: application/json

{
  "pasajeros_transportados": 48,
  "estado": "completado"
}
```

### 3. Reportes de Eficiencia

#### Obtener métricas de utilización
```bash
GET /api/buses/efficiency/utilization?startDate=2024-01-01&endDate=2024-01-31&busId=xxx&ruta=Ruta1&groupBy=day
```

**Parámetros:**
- `startDate` (requerido): Fecha de inicio (ISO 8601)
- `endDate` (requerido): Fecha de fin (ISO 8601)
- `busId` (opcional): Filtrar por ID de bus
- `ruta` (opcional): Filtrar por ruta
- `groupBy` (opcional): Agrupar por 'day', 'week', 'month' o 'bus' (default: 'day')

**Respuesta:**
```json
{
  "success": true,
  "dateRange": {
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-01-31T23:59:59.999Z"
  },
  "filters": {
    "busId": null,
    "ruta": null,
    "groupBy": "day"
  },
  "metrics": [
    {
      "periodo": "2024-01-15",
      "totalViajes": 10,
      "totalPasajeros": 450,
      "totalCapacidad": 500,
      "tasaOcupacion": 90.00,
      "promedioPasajerosPorViaje": 45.00,
      "totalDistancia": 250.00,
      "totalTiempo": 900,
      "velocidadPromedio": 16.67,
      "totalCosto": 1500.00,
      "costoPorPasajero": 3.33,
      "costoPorKm": 6.00,
      "numeroBuses": 1,
      "numeroRutas": 1
    }
  ],
  "aggregated": {
    "totalViajes": 310,
    "totalPasajeros": 13950,
    "totalCapacidad": 15500,
    "tasaOcupacionPromedio": 90.00,
    "numeroBuses": 5,
    "costoTotal": 46500.00,
    "costoPorPasajero": 3.33,
    "distanciaTotal": 7750.00,
    "promedioPasajerosPorViaje": 45.00
  }
}
```

#### Generar comparativo antes/después
```bash
GET /api/buses/efficiency/comparison?busId=xxx&optimizationDate=2024-01-15&beforeStart=2023-12-15&beforeEnd=2024-01-14&afterStart=2024-01-16&afterEnd=2024-02-15
```

**Parámetros:**
- `busId` (requerido): ID del bus
- `optimizationDate` (requerido): Fecha de aplicación de la optimización
- `beforeStart`, `beforeEnd` (opcionales): Rango de fechas antes (default: 30 días antes)
- `afterStart`, `afterEnd` (opcionales): Rango de fechas después (default: 30 días después)

**Respuesta:**
```json
{
  "success": true,
  "bus": {
    "id": "uuid-bus",
    "placa": "ABC-123",
    "numero_bus": "BUS-001",
    "capacidad_maxima": 50,
    "optimizaciones": [...]
  },
  "periodos": {
    "antes": {
      "start": "2023-12-15T00:00:00.000Z",
      "end": "2024-01-14T23:59:59.999Z",
      "dias": 30
    },
    "despues": {
      "start": "2024-01-16T00:00:00.000Z",
      "end": "2024-02-15T23:59:59.999Z",
      "dias": 30
    }
  },
  "metricsAntes": {
    "totalViajes": 300,
    "totalPasajeros": 12000,
    "tasaOcupacionPromedio": 80.00,
    "costoPorPasajero": 4.00,
    "promedioPasajerosPorViaje": 40.00
  },
  "metricsDespues": {
    "totalViajes": 300,
    "totalPasajeros": 13500,
    "tasaOcupacionPromedio": 90.00,
    "costoPorPasajero": 3.50,
    "promedioPasajerosPorViaje": 45.00
  },
  "comparativo": {
    "tasaOcupacion": {
      "antes": 80.00,
      "despues": 90.00,
      "diferencia": 10.00,
      "porcentajeCambio": 12.50,
      "mejora": true
    },
    "totalPasajeros": {
      "antes": 12000,
      "despues": 13500,
      "diferencia": 1500,
      "porcentajeCambio": 12.50,
      "mejora": true
    },
    "costoPorPasajero": {
      "antes": 4.00,
      "despues": 3.50,
      "diferencia": -0.50,
      "porcentajeCambio": -12.50,
      "mejora": true
    },
    "promedioPasajerosPorViaje": {
      "antes": 40.00,
      "despues": 45.00,
      "diferencia": 5.00,
      "porcentajeCambio": 12.50,
      "mejora": true
    }
  }
}
```

#### Calcular ROI
```bash
GET /api/buses/efficiency/roi?busId=xxx&optimizationDate=2024-01-15
```

**Parámetros:**
- `busId` (requerido): ID del bus
- `optimizationDate` (requerido): Fecha de aplicación de la optimización
- `beforeStart`, `beforeEnd`, `afterStart`, `afterEnd` (opcionales): Rangos de fechas personalizados

**Respuesta:**
```json
{
  "success": true,
  "bus": {
    "id": "uuid-bus",
    "placa": "ABC-123",
    "numero_bus": "BUS-001"
  },
  "optimizaciones": {
    "total": 2,
    "costoTotal": 10000.00,
    "detalles": [
      {
        "tipo": "ruta",
        "descripcion": "Optimización de ruta",
        "costo": 5000,
        "fecha": "2024-01-15T00:00:00.000Z"
      }
    ]
  },
  "metricas": {
    "periodoAnalisis": 30,
    "ahorroPorPasajero": 0.50,
    "ahorroTotalPeriodo": 675.00,
    "ahorroAnualProyectado": 8100.00
  },
  "roi": {
    "porcentaje": -19.00,
    "beneficioNeto": -1900.00,
    "paybackPeriodMeses": 14.81,
    "esPositivo": false
  },
  "comparativo": {
    "tasaOcupacion": {...},
    "totalPasajeros": {...},
    "costoPorPasajero": {...},
    "promedioPasajerosPorViaje": {...}
  }
}
```

#### Generar reporte completo de eficiencia
```bash
GET /api/buses/efficiency/report?startDate=2024-01-01&endDate=2024-01-31&busId=xxx&includeComparison=true&includeROI=true&optimizationDate=2024-01-15
```

**Parámetros:**
- `startDate` (requerido): Fecha de inicio
- `endDate` (requerido): Fecha de fin
- `busId` (opcional): Filtrar por bus
- `includeComparison` (opcional): Incluir comparativo antes/después (default: false)
- `includeROI` (opcional): Incluir cálculo de ROI (default: false)
- `optimizationDate` (opcional): Fecha de optimización (requerido si includeComparison o includeROI)

**Respuesta:**
Incluye todas las métricas de utilización, comparativo (si se solicita) y ROI (si se solicita).

## 📊 Métricas Calculadas

### Métricas de Utilización

1. **Tasa de Ocupación**: Porcentaje de capacidad utilizada
   - Fórmula: `(Pasajeros Transportados / Capacidad Máxima) * 100`

2. **Promedio de Pasajeros por Viaje**: Promedio de pasajeros transportados por viaje

3. **Costo por Pasajero**: Costo de operación dividido por número de pasajeros

4. **Costo por Kilómetro**: Costo de operación dividido por distancia recorrida

5. **Velocidad Promedio**: Distancia total dividida por tiempo total (km/h)

### Comparativo Antes/Después

Compara las siguientes métricas entre dos períodos:
- Tasa de ocupación
- Total de pasajeros
- Costo por pasajero
- Promedio de pasajeros por viaje

Para cada métrica se calcula:
- Valor antes
- Valor después
- Diferencia absoluta
- Porcentaje de cambio
- Indicador de mejora (true/false)

### Cálculo de ROI

El ROI se calcula basándose en:

1. **Costo de Optimizaciones**: Suma de costos de todas las optimizaciones aplicadas

2. **Ahorro por Pasajero**: Diferencia en costo por pasajero entre antes y después

3. **Ahorro Total del Período**: Ahorro por pasajero multiplicado por pasajeros después

4. **Ahorro Anual Proyectado**: Proyección del ahorro a un año

5. **ROI**: `((Ahorro Anual - Costo Optimizaciones) / Costo Optimizaciones) * 100`

6. **Payback Period**: Tiempo en meses para recuperar la inversión

7. **Beneficio Neto**: Ahorro anual menos costo de optimizaciones

## 🔧 Modelos de Datos

### Bus

```javascript
{
  _id: String,
  placa: String (única, requerida),
  numero_bus: String (requerida),
  capacidad_maxima: Number (requerida),
  estado: String ('activo' | 'mantenimiento' | 'inactivo'),
  tipo_bus: String ('regular' | 'express' | 'especial'),
  fecha_creacion: Date,
  fecha_actualizacion: Date,
  fecha_optimizacion: Date,
  optimizaciones_aplicadas: [{
    tipo: String,
    descripcion: String,
    fecha_aplicacion: Date,
    costo: Number,
    impacto_esperado: Number
  }]
}
```

### ViajeBus

```javascript
{
  _id: String,
  bus_id: String (requerida),
  ruta: String (requerida),
  fecha_salida: Date (requerida),
  fecha_llegada: Date,
  pasajeros_transportados: Number,
  capacidad_disponible: Number,
  distancia_km: Number,
  tiempo_viaje_minutos: Number,
  costo_operacion: Number,
  estado: String ('programado' | 'en_curso' | 'completado' | 'cancelado'),
  tasa_ocupacion: Number (calculada automáticamente),
  eficiencia_combustible: Number,
  puntualidad: Number,
  fecha_creacion: Date
}
```

## 📝 Ejemplos de Uso

### 1. Crear un bus y registrar viajes

```bash
# Crear bus
POST /buses
{
  "placa": "ABC-123",
  "numero_bus": "BUS-001",
  "capacidad_maxima": 50,
  "tipo_bus": "regular"
}

# Registrar viaje
POST /viajes-buses
{
  "bus_id": "uuid-del-bus",
  "ruta": "Ruta A - Centro",
  "fecha_salida": "2024-01-15T08:00:00Z",
  "fecha_llegada": "2024-01-15T09:30:00Z",
  "pasajeros_transportados": 45,
  "distancia_km": 25,
  "tiempo_viaje_minutos": 90,
  "costo_operacion": 150,
  "estado": "completado"
}
```

### 2. Agregar optimización y calcular ROI

```bash
# Agregar optimización
POST /buses/:id/optimizaciones
{
  "tipo": "ruta",
  "descripcion": "Optimización de ruta para reducir tiempo",
  "costo": 5000,
  "impacto_esperado": 15
}

# Calcular ROI después de 30 días
GET /api/buses/efficiency/roi?busId=xxx&optimizationDate=2024-01-15
```

### 3. Generar reporte completo

```bash
GET /api/buses/efficiency/report?startDate=2024-01-01&endDate=2024-01-31&busId=xxx&includeComparison=true&includeROI=true&optimizationDate=2024-01-15
```

## 🎯 Casos de Uso

1. **Evaluar eficiencia de flota**: Obtener métricas de utilización de todos los buses
2. **Comparar antes/después**: Evaluar impacto de optimizaciones específicas
3. **Calcular ROI**: Determinar rentabilidad de inversiones en optimización
4. **Análisis por ruta**: Filtrar métricas por ruta específica
5. **Análisis temporal**: Agrupar métricas por día, semana o mes

## ⚙️ Requisitos

- MongoDB con colecciones `buses` y `viajes_buses`
- Node.js >= 12.0.0
- Dependencias: mongoose, uuid

## ✅ Estado Final

**Story Points**: 8  
**Estimación**: 32h  
**Estado**: ✅ Implementación completa  
**Prioridad**: Media  
**Responsable**: Data Analyst  
**Dependencies**: US039, US046

### Tareas Completadas

- ✅ Modelo Bus y ViajeBus creados
- ✅ Servicio de eficiencia de buses implementado
- ✅ Métricas de utilización calculadas
- ✅ Comparativo antes/después implementado
- ✅ Cálculo de ROI automatizado
- ✅ Endpoints API creados
- ✅ Documentación completa

