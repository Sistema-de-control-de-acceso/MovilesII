# Reportes de Sugerencias de Buses - Sugerido vs Real

## 📋 Descripción

Sistema completo para gestionar sugerencias de horarios y rutas de buses, hacer tracking de su implementación, comparar resultados sugeridos vs reales, y medir el impacto de la adopción de sugerencias mediante un dashboard completo.

## ✅ Acceptance Criteria Cumplidos

- ✅ **Comparativo horarios sugeridos vs implementados**: Comparación detallada entre sugerencias y uso real
- ✅ **Impacto medido y cuantificado**: Medición completa del impacto de adopción de sugerencias
- ✅ **Dashboard adopción sugerencias**: Dashboard completo con métricas de adopción y seguimiento

## 📁 Archivos Creados

```
backend/
├── models/
│   └── SugerenciaBus.js                    # Modelo de sugerencias
└── ml/
    └── bus_suggestions_service.js          # Servicio de sugerencias y comparación
```

## 🚀 Endpoints Disponibles

### 1. Gestión de Sugerencias

#### Listar sugerencias
```bash
GET /sugerencias-buses?bus_id=xxx&estado=pendiente&tipo_sugerencia=horario&prioridad=alta
```

#### Obtener sugerencia por ID
```bash
GET /sugerencias-buses/:id
```

#### Crear nueva sugerencia
```bash
POST /sugerencias-buses
Content-Type: application/json

{
  "bus_id": "uuid-bus",
  "ruta": "Ruta A - Centro",
  "horario_salida": "08:00",
  "horario_llegada": "09:30",
  "dia_semana": "lunes",
  "tipo_sugerencia": "horario",
  "descripcion": "Ajustar horario de salida para mejorar ocupación",
  "razon": "Análisis de datos muestra baja ocupación en horario actual",
  "prioridad": "alta",
  "impacto_esperado": {
    "aumento_pasajeros": 15,
    "reduccion_tiempo": 10,
    "reduccion_costo": 5,
    "mejora_ocupacion": 10
  },
  "fuente": {
    "tipo": "ml",
    "confianza": 85
  }
}
```

#### Actualizar sugerencia
```bash
PUT /sugerencias-buses/:id
Content-Type: application/json

{
  "descripcion": "Descripción actualizada",
  "prioridad": "media"
}
```

#### Aprobar sugerencia
```bash
POST /sugerencias-buses/:id/aprobar
Content-Type: application/json

{
  "aprobado_por": "uuid-admin"
}
```

#### Implementar sugerencia
```bash
POST /sugerencias-buses/:id/implementar
Content-Type: application/json

{
  "implementado_por": "uuid-admin",
  "fecha_inicio_seguimiento": "2024-01-15T00:00:00Z"
}
```

#### Rechazar sugerencia
```bash
POST /sugerencias-buses/:id/rechazar
```

#### Actualizar tracking de sugerencia
```bash
POST /sugerencias-buses/:id/tracking
Content-Type: application/json

{
  "startDate": "2024-01-15T00:00:00Z",
  "endDate": "2024-02-15T23:59:59Z"
}
```

### 2. Reportes y Comparativos

#### Comparativo sugerido vs real
```bash
GET /api/buses/suggestions/comparison/:id?startDate=2024-01-15&endDate=2024-02-15
```

**Respuesta:**
```json
{
  "success": true,
  "sugerencia": {
    "id": "uuid-sugerencia",
    "ruta": "Ruta A - Centro",
    "horario_salida": "08:00",
    "dia_semana": "lunes",
    "tipo": "horario",
    "descripcion": "Ajustar horario de salida"
  },
  "tracking": {
    "viajes_planificados": 8,
    "viajes_realizados": 7,
    "tasa_adopcion": 87.50,
    "cumplimiento_horario": 85.71,
    "periodo": {
      "inicio": "2024-01-15T00:00:00.000Z",
      "fin": "2024-02-15T23:59:59.999Z"
    }
  },
  "impacto": {
    "esperado": {
      "aumento_pasajeros": 15,
      "reduccion_tiempo": 10,
      "reduccion_costo": 5,
      "mejora_ocupacion": 10
    },
    "real": {
      "aumento_pasajeros": 12.5,
      "reduccion_tiempo": 8,
      "reduccion_costo": 4.2,
      "mejora_ocupacion": 8.5
    },
    "diferencia": {
      "aumento_pasajeros": -2.5,
      "reduccion_tiempo": -2,
      "reduccion_costo": -0.8,
      "mejora_ocupacion": -1.5
    },
    "cumplimiento": {
      "aumento_pasajeros": 83.33,
      "reduccion_tiempo": 80.00,
      "reduccion_costo": 84.00,
      "mejora_ocupacion": 85.00
    }
  },
  "evaluacion": {
    "adopcion_exitosa": true,
    "cumplimiento_aceptable": true,
    "impacto_positivo": true,
    "cumplimiento_objetivos": true
  }
}
```

#### Dashboard de adopción de sugerencias
```bash
GET /api/buses/suggestions/dashboard?startDate=2024-01-01&endDate=2024-01-31&busId=xxx&tipoSugerencia=horario&estado=implementada
```

**Respuesta:**
```json
{
  "success": true,
  "periodo": {
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-01-31T23:59:59.999Z"
  },
  "filtros": {
    "busId": "xxx",
    "tipoSugerencia": "horario",
    "estado": "implementada"
  },
  "estadisticas": {
    "total": 25,
    "implementadas": 15,
    "aprobadas": 20,
    "pendientes": 5,
    "rechazadas": 0,
    "tasaAprobacion": 80.00,
    "tasaImplementacion": 60.00,
    "tasaRechazo": 0.00
  },
  "metricasAdopcion": {
    "tasaAdopcionPromedio": 82.50,
    "cumplimientoHorarioPromedio": 85.20,
    "impactoPromedio": {
      "aumento_pasajeros": 12.30,
      "reduccion_tiempo": 8.50,
      "reduccion_costo": 4.80,
      "mejora_ocupacion": 9.20
    },
    "sugerenciasExitosas": 12,
    "sugerenciasFallidas": 3,
    "tasaExito": 80.00
  },
  "sugerencias": {
    "total": 25,
    "porEstado": {
      "implementada": 15,
      "aprobada": 5,
      "pendiente": 5
    },
    "porTipo": {
      "horario": 10,
      "ruta": 8,
      "frecuencia": 5,
      "capacidad": 2
    },
    "porPrioridad": {
      "alta": 8,
      "media": 12,
      "baja": 5
    }
  },
  "comparativos": [...]
}
```

#### Métricas de impacto de adopción
```bash
GET /api/buses/suggestions/impact?startDate=2024-01-01&endDate=2024-01-31&busId=xxx
```

## 📊 Métricas Calculadas

### Tracking de Implementación

1. **Tasa de Adopción**: Porcentaje de viajes realizados vs planificados
   - Fórmula: `(Viajes Realizados / Viajes Planificados) * 100`

2. **Cumplimiento de Horario**: Porcentaje de viajes que cumplen el horario sugerido (tolerancia ±15 min)
   - Fórmula: `(Viajes en Horario / Total Viajes) * 100`

3. **Viajes Planificados**: Número de viajes que deberían realizarse según la sugerencia

4. **Viajes Realizados**: Número de viajes realmente completados

### Impacto Real vs Esperado

Compara el impacto real con el impacto esperado en:
- **Aumento de Pasajeros**: Porcentaje de aumento
- **Reducción de Tiempo**: Minutos reducidos
- **Reducción de Costo**: Porcentaje de reducción
- **Mejora de Ocupación**: Porcentaje de mejora

### Evaluación de Sugerencias

- **Adopción Exitosa**: Tasa de adopción ≥ 70%
- **Cumplimiento Aceptable**: Cumplimiento de horario ≥ 80%
- **Impacto Positivo**: Al menos una métrica de impacto es positiva
- **Cumplimiento de Objetivos**: Al menos 50% de los objetivos cumplidos al 70%

## 🔧 Modelo de Datos

### SugerenciaBus

```javascript
{
  _id: String,
  bus_id: String,
  ruta: String (requerida),
  horario_salida: String (requerida, formato HH:MM),
  horario_llegada: String (requerida, formato HH:MM),
  dia_semana: String ('lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'),
  tipo_sugerencia: String ('horario' | 'ruta' | 'frecuencia' | 'capacidad'),
  descripcion: String,
  razon: String,
  prioridad: String ('alta' | 'media' | 'baja'),
  estado: String ('pendiente' | 'aprobada' | 'rechazada' | 'implementada' | 'cancelada'),
  fecha_sugerencia: Date,
  fecha_aprobacion: Date,
  fecha_implementacion: Date,
  fecha_rechazo: Date,
  aprobado_por: String,
  implementado_por: String,
  impacto_esperado: {
    aumento_pasajeros: Number,
    reduccion_tiempo: Number,
    reduccion_costo: Number,
    mejora_ocupacion: Number
  },
  tracking: {
    fecha_inicio_seguimiento: Date,
    fecha_fin_seguimiento: Date,
    viajes_planificados: Number,
    viajes_realizados: Number,
    tasa_adopcion: Number,
    cumplimiento_horario: Number,
    impacto_real: {
      aumento_pasajeros: Number,
      reduccion_tiempo: Number,
      reduccion_costo: Number,
      mejora_ocupacion: Number
    }
  },
  fuente: {
    tipo: String ('manual' | 'ml' | 'analisis' | 'feedback'),
    modelo_ml: String,
    confianza: Number
  },
  fecha_creacion: Date,
  fecha_actualizacion: Date
}
```

## 📝 Ejemplos de Uso

### 1. Crear y aprobar una sugerencia

```bash
# Crear sugerencia
POST /sugerencias-buses
{
  "bus_id": "uuid-bus",
  "ruta": "Ruta A",
  "horario_salida": "08:00",
  "horario_llegada": "09:30",
  "dia_semana": "lunes",
  "tipo_sugerencia": "horario",
  "descripcion": "Ajustar horario",
  "impacto_esperado": {
    "aumento_pasajeros": 15,
    "reduccion_tiempo": 10
  }
}

# Aprobar sugerencia
POST /sugerencias-buses/:id/aprobar
{
  "aprobado_por": "uuid-admin"
}

# Implementar sugerencia
POST /sugerencias-buses/:id/implementar
{
  "implementado_por": "uuid-admin",
  "fecha_inicio_seguimiento": "2024-01-15T00:00:00Z"
}
```

### 2. Actualizar tracking y obtener comparativo

```bash
# Actualizar tracking
POST /sugerencias-buses/:id/tracking
{
  "startDate": "2024-01-15T00:00:00Z",
  "endDate": "2024-02-15T23:59:59Z"
}

# Obtener comparativo
GET /api/buses/suggestions/comparison/:id?startDate=2024-01-15&endDate=2024-02-15
```

### 3. Obtener dashboard de adopción

```bash
GET /api/buses/suggestions/dashboard?startDate=2024-01-01&endDate=2024-01-31&estado=implementada
```

## 🎯 Casos de Uso

1. **Gestionar sugerencias**: Crear, aprobar, implementar y rechazar sugerencias
2. **Tracking de implementación**: Seguimiento automático de viajes realizados vs planificados
3. **Comparar resultados**: Comparar impacto esperado vs real
4. **Evaluar adopción**: Dashboard completo de adopción de sugerencias
5. **Medir impacto**: Métricas detalladas de impacto de adopción

## ⚙️ Requisitos

- MongoDB con colecciones `sugerencias_buses`, `viajes_buses` y `buses`
- Node.js >= 12.0.0
- Dependencias: mongoose, uuid
- Integración con sistema de buses existente

## ✅ Estado Final

**Story Points**: 8  
**Estimación**: 32h  
**Estado**: ✅ Implementación completa  
**Prioridad**: Media  
**Responsable**: Data Analyst  
**Dependencies**: US049

### Tareas Completadas

- ✅ Modelo SugerenciaBus creado
- ✅ Servicio de sugerencias implementado
- ✅ Tracking de implementación
- ✅ Comparativo sugerido vs real
- ✅ Medición de impacto de adopción
- ✅ Dashboard de adopción
- ✅ Endpoints API creados
- ✅ Documentación completa

