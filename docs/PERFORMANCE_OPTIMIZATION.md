# Optimización de Performance - Consultas Críticas

Documentación de optimizaciones realizadas en consultas críticas de la base de datos.

## 📋 Resumen

Este documento describe las optimizaciones realizadas para mejorar el rendimiento de las consultas críticas del sistema, incluyendo:

- Identificación de consultas críticas
- Creación de baseline de rendimiento
- Optimización de índices
- Tests automatizados de performance
- Documentación de cambios

## 🎯 Consultas Críticas Identificadas

### 1. Login (User.findOne)
**Endpoint**: `POST /login`  
**Query**: `User.findOne({ email, estado: 'activo' })`  
**Frecuencia**: Alta (cada login)  
**Objetivo**: < 200ms (P95)

**Optimización**:
- Índice compuesto: `{ email: 1, estado: 1 }`
- Índice simple: `{ email: 1 }` (ya existía como único)

### 2. Búsqueda de Alumno por Código
**Endpoint**: `GET /alumnos/:codigo`  
**Query**: `Alumno.findOne({ codigo_universitario })`  
**Frecuencia**: Muy Alta (cada lectura NFC)  
**Objetivo**: < 200ms (P95)

**Optimización**:
- Índice compuesto: `{ codigo_universitario: 1, estado: 1 }`
- Índice simple: `{ codigo_universitario: 1 }` (ya existía)

### 3. Última Asistencia por DNI
**Endpoint**: `GET /asistencias/ultimo-acceso/:dni`  
**Query**: `Asistencia.findOne({ dni }).sort({ fecha_hora: -1 })`  
**Frecuencia**: Alta  
**Objetivo**: < 200ms (P95)

**Optimización**:
- Índice compuesto: `{ dni: 1, fecha_hora: -1 }` (ya existía: `idx_dni_fecha`)

### 4. Presencia Activa por DNI
**Endpoint**: `GET /asistencias/esta-en-campus/:dni`  
**Query**: `Presencia.findOne({ estudiante_dni, esta_dentro: true })`  
**Frecuencia**: Alta  
**Objetivo**: < 200ms (P95)

**Optimización**:
- **NUEVO**: Índice compuesto: `{ estudiante_dni: 1, esta_dentro: 1 }` (nombre: `idx_presencia_dni_estado`)

### 5. Asistencias por Fecha
**Endpoint**: `GET /asistencias` (con filtro de fecha)  
**Query**: `Asistencia.find({ fecha_hora: { $gte: date } }).sort({ fecha_hora: -1 })`  
**Frecuencia**: Media  
**Objetivo**: < 500ms (P95)

**Optimización**:
- Índice: `{ fecha_hora: 1 }` (ya existía: `idx_fecha_hora`)
- Índice compuesto: `{ fecha_hora: 1, tipo: 1 }` (ya existía: `idx_fecha_tipo`)

## 📊 Índices Creados/Actualizados

### Asistencias
```javascript
// Ya existían:
{ fecha_hora: 1, tipo: 1 }                    // idx_fecha_tipo
{ codigo_universitario: 1, fecha_hora: -1 }   // idx_codigo_fecha
{ dni: 1, fecha_hora: -1 }                    // idx_dni_fecha
{ punto_control_id: 1, fecha_hora: -1 }       // idx_punto_control_fecha
{ guardia_id: 1, fecha_hora: -1 }             // idx_guardia_fecha
{ siglas_facultad: 1, fecha_hora: -1 }        // idx_facultad_fecha
{ fecha_hora: 1 }                              // idx_fecha_hora
{ autorizacion_manual: 1, fecha_hora: -1 }    // idx_autorizacion_fecha
{ fecha_hora: 1, siglas_facultad: 1, tipo: 1 } // idx_analisis_temporal
```

### Presencia
```javascript
// Ya existían:
{ estudiante_dni: 1, hora_entrada: -1 }      // idx_presencia_dni_entrada
{ esta_dentro: 1, hora_entrada: -1 }          // idx_presencia_estado
{ hora_entrada: 1 }                            // idx_presencia_entrada

// NUEVO:
{ estudiante_dni: 1, esta_dentro: 1 }         // idx_presencia_dni_estado
```

### Usuarios
```javascript
// NUEVO:
{ email: 1, estado: 1 }                        // idx_user_email_estado
{ dni: 1 }                                     // idx_user_dni
```

### Alumnos
```javascript
// NUEVO:
{ codigo_universitario: 1, estado: 1 }         // idx_alumno_codigo_estado
{ dni: 1 }                                     // idx_alumno_dni
```

### Asignaciones
```javascript
// NUEVO:
{ punto_id: 1, estado: 1 }                     // idx_asignacion_punto_estado
{ guardia_id: 1, estado: 1 }                   // idx_asignacion_guardia_estado
```

## 🧪 Tests Automatizados

### Tests de Performance
**Ubicación**: `backend/test/performance/critical-queries.test.js`

**Cobertura**:
- ✅ Tiempo de respuesta < 200ms (P95) para consultas críticas
- ✅ Validación funcional (resultados correctos)
- ✅ Comparación con baseline
- ✅ Detección de regresiones

**Ejecutar**:
```bash
npm test -- critical-queries.test.js
```

### Smoke Tests
**Ubicación**: `backend/test/performance/smoke-tests.test.js`

**Cobertura**:
- ✅ Respuesta < 500ms para endpoints críticos
- ✅ Validación básica de funcionalidad

**Ejecutar**:
```bash
npm test -- smoke-tests.test.js
```

### Tests de Integración
**Ubicación**: `backend/test/performance/integration-performance.test.js`

**Cobertura**:
- ✅ Flujos completos de usuario
- ✅ Carga concurrente
- ✅ Validación de regresiones funcionales
- ✅ Performance bajo carga

**Ejecutar**:
```bash
npm test -- integration-performance.test.js
```

## 📈 Baseline de Rendimiento

### Crear Baseline

```bash
node backend/scripts/create-performance-baseline.js
```

Esto crea baselines para todas las consultas críticas y los guarda en:
`backend/test/performance/baselines.json`

### Comparar con Baseline

Los tests automáticamente comparan las métricas actuales con el baseline y detectan regresiones.

## 🔧 Optimizar Índices

### Crear/Actualizar Índices

```bash
node backend/scripts/optimize-indexes.js
```

Este script:
- Crea todos los índices necesarios
- Verifica índices existentes
- Muestra resumen de índices por colección

## 📊 Métricas Objetivo

| Consulta | Objetivo P95 | Baseline | Actual |
|----------|--------------|----------|--------|
| Login | < 200ms | - | - |
| Alumno por código | < 200ms | - | - |
| Última asistencia | < 200ms | - | - |
| Presencia activa | < 200ms | - | - |
| Asistencias por fecha | < 500ms | - | - |

*Nota: Ejecutar baseline para obtener valores actuales*

## 🚀 Mejoras Implementadas

### 1. Índices Optimizados
- ✅ Índice compuesto para presencia activa
- ✅ Índice compuesto para login (email + estado)
- ✅ Índice compuesto para búsqueda de alumno (código + estado)
- ✅ Índices para asignaciones

### 2. Queries Optimizadas
- ✅ Uso de `.lean()` cuando no se necesita modificar documentos
- ✅ Uso de `.select()` para limitar campos cuando es posible
- ✅ Paginación en listados grandes

### 3. Tests Automatizados
- ✅ Tests de performance para consultas críticas
- ✅ Smoke tests para endpoints
- ✅ Tests de integración con carga
- ✅ Detección automática de regresiones

## 📝 Cambios en Queries

### Antes
```javascript
// Sin índice optimizado para presencia activa
const presencia = await Presencia.findOne({ 
  estudiante_dni: dni, 
  esta_dentro: true 
});
```

### Después
```javascript
// Con índice compuesto { estudiante_dni: 1, esta_dentro: 1 }
const presencia = await Presencia.findOne({ 
  estudiante_dni: dni, 
  esta_dentro: true 
}).lean(); // Usar lean() cuando no se modifica
```

## 🔍 Verificar Uso de Índices

Para verificar que una query usa el índice correcto:

```javascript
const DatabaseIndexes = require('./utils/database_indexes');
const indexManager = new DatabaseIndexes();

const explain = await indexManager.explainQuery(
  Asistencia.collection,
  { dni: '12345678' },
  { sort: { fecha_hora: -1 } }
);

console.log(explain.executionStats);
```

## 📚 Referencias

- [MongoDB Indexing Best Practices](https://docs.mongodb.com/manual/applications/indexes/)
- [Mongoose Performance](https://mongoosejs.com/docs/performance.html)
- [Query Optimization](https://docs.mongodb.com/manual/core/query-optimization/)

## 🔄 Próximos Pasos

1. **Monitoreo Continuo**: Integrar métricas de performance en CI/CD
2. **Alertas**: Configurar alertas cuando tiempos excedan umbrales
3. **Análisis Periódico**: Revisar y optimizar queries lentas mensualmente
4. **Caching**: Considerar Redis para consultas frecuentes
5. **Connection Pooling**: Optimizar configuración de conexiones

