# Reportes Comparativos Pre/Post Implementación - ROI del Proyecto

## 📋 Descripción

Sistema completo para generar reportes comparativos antes/después de la implementación del sistema, calcular KPIs de impacto, realizar análisis costo-beneficio y demostrar el ROI del proyecto.

## ✅ Acceptance Criteria Cumplidos

- ✅ **Métricas pre/post sistema calculadas**: Cálculo completo de métricas antes y después de la implementación
- ✅ **KPIs impacto definidos y medidos**: KPIs de impacto del proyecto definidos y calculados
- ✅ **Análisis costo-beneficio realizado**: Análisis completo de costo-beneficio y ROI

## 📁 Archivos Creados

```
backend/
├── models/
│   └── BaselineData.js                    # Modelos de Baseline y ProjectCost
└── ml/
    └── project_roi_service.js             # Servicio de ROI del proyecto
```

## 🚀 Endpoints Disponibles

### 1. Gestión de Baseline Data

#### Listar baselines
```bash
GET /baseline-data
```

#### Obtener baseline por ID
```bash
GET /baseline-data/:id
```

#### Crear o actualizar baseline
```bash
POST /baseline-data
Content-Type: application/json

{
  "periodo": {
    "fecha_inicio": "2023-01-01T00:00:00Z",
    "fecha_fin": "2023-12-31T23:59:59Z",
    "descripcion": "Período baseline pre-sistema"
  },
  "metricas_acceso": {
    "total_accesos": 50000,
    "accesos_por_dia": 137,
    "accesos_entrada": 25000,
    "accesos_salida": 25000,
    "pico_horario": {
      "hora": 8,
      "cantidad": 500
    }
  },
  "metricas_operativas": {
    "tiempo_promedio_atencion": 5,
    "tiempo_espera_promedio": 10,
    "tasa_error": 5,
    "tasa_resolucion_manual": 30,
    "incidentes_seguridad": 50
  },
  "metricas_recursos": {
    "guardias_activos": 10,
    "horas_trabajo_totales": 1600,
    "costo_operacion_mensual": 50000,
    "costo_por_acceso": 1.0
  },
  "costos_sistema_anterior": {
    "costo_implementacion": 100000,
    "costo_mantenimiento_mensual": 5000,
    "costo_licencias_mensual": 2000,
    "costo_hardware_mensual": 1000,
    "costo_total_mensual": 8000
  }
}
```

### 2. Gestión de Project Costs

#### Listar costos del proyecto
```bash
GET /project-costs?tipo_costo=desarrollo&categoria=inversion_inicial&startDate=2024-01-01&endDate=2024-12-31
```

#### Crear costo del proyecto
```bash
POST /project-costs
Content-Type: application/json

{
  "tipo_costo": "desarrollo",
  "descripcion": "Desarrollo del sistema de control de acceso",
  "monto": 150000,
  "fecha": "2024-01-15T00:00:00Z",
  "periodo": {
    "tipo": "unico"
  },
  "categoria": "inversion_inicial"
}
```

#### Actualizar costo
```bash
PUT /project-costs/:id
Content-Type: application/json

{
  "monto": 160000,
  "descripcion": "Desarrollo actualizado"
}
```

### 3. Reportes y Análisis

#### Calcular métricas actuales (post-implementación)
```bash
GET /api/project/current-metrics?startDate=2024-01-01&endDate=2024-12-31
```

**Respuesta:**
```json
{
  "success": true,
  "periodo": {
    "fecha_inicio": "2024-01-01T00:00:00.000Z",
    "fecha_fin": "2024-12-31T23:59:59.999Z",
    "dias": 365
  },
  "metricas_acceso": {
    "total_accesos": 60000,
    "accesos_por_dia": 164.38,
    "accesos_entrada": 30000,
    "accesos_salida": 30000,
    "pico_horario": {
      "hora": 8,
      "cantidad": 600
    }
  },
  "metricas_operativas": {
    "tasa_resolucion_manual": 15,
    "incidentes_seguridad": 20
  },
  "metricas_presencia": {
    "total_estudiantes_campus": 5000,
    "tiempo_promedio_campus": 4.5,
    "estudiantes_activos": 2500
  },
  "metricas_buses": {
    "total_viajes": 1000,
    "pasajeros_transportados": 45000,
    "tasa_ocupacion_promedio": 90,
    "costo_operacion_buses": 15000
  }
}
```

#### Comparativo pre/post implementación
```bash
GET /api/project/pre-post-comparison?baselineId=xxx&startDate=2024-01-01&endDate=2024-12-31
```

**Respuesta:**
```json
{
  "success": true,
  "baseline": {
    "id": "uuid-baseline",
    "periodo": {...},
    "metricas": {...},
    "costos_sistema_anterior": {...}
  },
  "actual": {
    "periodo": {...},
    "metricas": {...}
  },
  "comparativo": {
    "acceso": {
      "total_accesos": {
        "antes": 50000,
        "despues": 60000,
        "diferencia": 10000,
        "porcentaje_cambio": 20.00
      },
      "accesos_por_dia": {
        "antes": 137,
        "despues": 164.38,
        "diferencia": 27.38,
        "porcentaje_cambio": 20.00
      }
    },
    "operativas": {
      "tasa_resolucion_manual": {
        "antes": 30,
        "despues": 15,
        "diferencia": -15,
        "porcentaje_cambio": -50.00,
        "mejora": true
      },
      "incidentes_seguridad": {
        "antes": 50,
        "despues": 20,
        "diferencia": -30,
        "porcentaje_cambio": -60.00,
        "mejora": true
      }
    }
  }
}
```

#### Calcular KPIs de impacto
```bash
GET /api/project/impact-kpis?baselineId=xxx&startDate=2024-01-01&endDate=2024-12-31
```

**Respuesta:**
```json
{
  "success": true,
  "kpis": {
    "eficiencia_operativa": {
      "reduccion_tiempo_atencion": 40.00,
      "reduccion_resolucion_manual": 50.00,
      "reduccion_incidentes": 60.00
    },
    "eficiencia_acceso": {
      "aumento_capacidad": 20.00,
      "mejora_velocidad": 0,
      "reduccion_errores": 0
    },
    "eficiencia_recursos": {
      "reduccion_costo_operacion": 30.00,
      "reduccion_horas_trabajo": 0,
      "mejora_productividad": 0
    },
    "eficiencia_buses": {
      "mejora_ocupacion": 10.00,
      "aumento_viajes": 15.00,
      "reduccion_costo_por_viaje": 0
    },
    "seguridad": {
      "reduccion_incidentes": 60.00,
      "mejora_trazabilidad": 100.00,
      "mejora_control_acceso": 100.00
    }
  },
  "comparativo": {...},
  "costos": {...}
}
```

#### Calcular costos del proyecto
```bash
GET /api/project/costs?startDate=2024-01-01&endDate=2024-12-31
```

**Respuesta:**
```json
{
  "success": true,
  "costo_total": 200000,
  "costo_inversion_inicial": 150000,
  "costo_operacion_mensual_actual": 35000,
  "costos_por_categoria": {
    "inversion_inicial": 150000,
    "operacion_recurrente": 420000,
    "mejora": 20000,
    "soporte": 10000
  },
  "total_costos": 15
}
```

#### Análisis costo-beneficio y ROI
```bash
GET /api/project/cost-benefit-analysis?baselineId=xxx&startDate=2024-01-01&endDate=2024-12-31&projectionMonths=24
```

**Respuesta:**
```json
{
  "success": true,
  "costos": {
    "inversion_inicial": 150000,
    "costo_operacion_mensual_actual": 35000,
    "costo_operacion_mensual_anterior": 50000,
    "costos_sistema_anterior": 8000
  },
  "ahorros": {
    "ahorro_operacion_mensual": 15000,
    "ahorro_sistema_anterior_mensual": -27000,
    "ahorro_total_mensual": -12000,
    "ahorro_anual": -144000,
    "ahorro_proyectado": -288000
  },
  "roi": {
    "porcentaje": -196.00,
    "beneficio_neto": -294000,
    "payback_period_meses": null,
    "es_positivo": false
  },
  "vpn": {
    "valor": -250000,
    "tasa_descuento": 10,
    "periodo_anos": 2
  },
  "kpis": {...},
  "proyeccion": {
    "meses": 24,
    "ahorro_total": -288000,
    "beneficio_neto_proyectado": -438000
  }
}
```

#### Reporte completo de ROI del proyecto
```bash
GET /api/project/roi-report?baselineId=xxx&startDate=2024-01-01&endDate=2024-12-31&includeKPIs=true&includeCostBenefit=true&projectionMonths=12
```

## 📊 KPIs de Impacto Definidos

### Eficiencia Operativa
- Reducción de tiempo de atención
- Reducción de resolución manual
- Reducción de incidentes

### Eficiencia de Acceso
- Aumento de capacidad
- Mejora de velocidad
- Reducción de errores

### Eficiencia de Recursos
- Reducción de costo de operación
- Reducción de horas de trabajo
- Mejora de productividad

### Eficiencia de Buses
- Mejora de ocupación
- Aumento de viajes
- Reducción de costo por viaje

### Seguridad
- Reducción de incidentes
- Mejora de trazabilidad
- Mejora de control de acceso

## 💰 Análisis Costo-Beneficio

### Métricas Calculadas

1. **Ahorros Mensuales**:
   - Ahorro en operación
   - Ahorro en sistema anterior
   - Ahorro total mensual

2. **Proyecciones**:
   - Ahorro anual
   - Ahorro proyectado (N meses)
   - Beneficio neto proyectado

3. **ROI**:
   - Porcentaje de ROI
   - Beneficio neto
   - Período de recuperación (payback period)

4. **Valor Presente Neto (VPN)**:
   - VPN calculado
   - Tasa de descuento aplicada
   - Período de análisis

## 📝 Ejemplos de Uso

### 1. Crear baseline y calcular comparativo

```bash
# Crear baseline
POST /baseline-data
{
  "periodo": {
    "fecha_inicio": "2023-01-01T00:00:00Z",
    "fecha_fin": "2023-12-31T23:59:59Z"
  },
  "metricas_acceso": {
    "total_accesos": 50000,
    "accesos_por_dia": 137
  },
  "metricas_operativas": {
    "tasa_resolucion_manual": 30,
    "incidentes_seguridad": 50
  },
  "metricas_recursos": {
    "costo_operacion_mensual": 50000
  }
}

# Obtener comparativo
GET /api/project/pre-post-comparison?baselineId=xxx&startDate=2024-01-01&endDate=2024-12-31
```

### 2. Registrar costos y calcular ROI

```bash
# Registrar costo de inversión inicial
POST /project-costs
{
  "tipo_costo": "desarrollo",
  "monto": 150000,
  "fecha": "2024-01-15T00:00:00Z",
  "categoria": "inversion_inicial"
}

# Calcular ROI
GET /api/project/cost-benefit-analysis?baselineId=xxx&startDate=2024-01-01&endDate=2024-12-31&projectionMonths=24
```

### 3. Obtener reporte completo

```bash
GET /api/project/roi-report?baselineId=xxx&startDate=2024-01-01&endDate=2024-12-31&includeKPIs=true&includeCostBenefit=true&projectionMonths=12
```

## 🎯 Casos de Uso

1. **Establecer baseline**: Crear datos baseline del sistema anterior
2. **Calcular métricas actuales**: Obtener métricas del sistema actual
3. **Comparar resultados**: Comparar métricas antes y después
4. **Calcular KPIs**: Obtener KPIs de impacto del proyecto
5. **Análisis ROI**: Realizar análisis costo-beneficio y ROI
6. **Reporte ejecutivo**: Generar reporte completo para stakeholders

## ⚙️ Requisitos

- MongoDB con colecciones `baseline_data`, `project_costs`, `asistencias`, `presencia`, `viajes_buses`
- Node.js >= 12.0.0
- Dependencias: mongoose, uuid
- Integración con sistema existente

## ✅ Estado Final

**Story Points**: 8  
**Estimación**: 32h  
**Estado**: ✅ Implementación completa  
**Prioridad**: Alta  
**Responsable**: Data Analyst  
**Dependencies**: US046

### Tareas Completadas

- ✅ Modelo BaselineData y ProjectCost creados
- ✅ Servicio de ROI del proyecto implementado
- ✅ Métricas pre/post calculadas
- ✅ KPIs de impacto definidos y medidos
- ✅ Análisis costo-beneficio y ROI
- ✅ Endpoints API creados
- ✅ Documentación completa

