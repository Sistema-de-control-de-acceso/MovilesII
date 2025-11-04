# Clustering con K-means - Documentación

## 📋 Descripción

Sistema completo de clustering usando algoritmo K-means para agrupar patrones similares en los datos de asistencias, con determinación automática del número óptimo de clusters y validación con silhouette score.

## ✅ Acceptance Criteria Cumplidos

- ✅ **K-means o similar implementado**: Algoritmo K-means completo con inicialización K-means++
- ✅ **Número óptimo clusters determinado**: Determinación automática usando método del codo y silhouette score
- ✅ **Validación silhouette realizada**: Cálculo completo de silhouette score con interpretación

## 📁 Estructura de Archivos

```
backend/ml/
├── kmeans_clustering.js          # Algoritmo K-means
├── clustering_validation.js      # Validación (silhouette, elbow method)
├── clustering_service.js         # Servicio completo integrado
└── README_CLUSTERING.md          # Este archivo
```

## 🚀 Endpoints Disponibles

### 1. Ejecutar Clustering Completo

```bash
POST /api/ml/clustering/execute
Body: {
  "months": 3,
  "features": null,              // null para características por defecto
  "k": null,                     // null para determinar automáticamente
  "kRange": [2, 8],
  "normalize": true,
  "includeValidation": true,
  "includeVisualization": true
}
```

**Respuesta:**
```json
{
  "success": true,
  "model": {
    "k": 4,
    "centroids": [[...], [...], ...],
    "labels": [0, 1, 2, ...],
    "inertia": 1234.56,
    "nIter": 15,
    "hasConverged": true
  },
  "optimalK": {
    "recommendedK": { "k": 4, "method": "silhouette" },
    "bestKBySilhouette": { "k": 4, "score": 0.65 },
    "bestKByElbow": { "k": 4 }
  },
  "validation": {
    "silhouette": {
      "score": 0.65,
      "interpretation": "Estructura razonable de clusters",
      "byCluster": {...}
    },
    "inertia": 1234.56
  },
  "clusterAnalysis": {
    "0": { "size": 150, "percentage": "30.00", ... },
    "1": { "size": 200, "percentage": "40.00", ... },
    ...
  }
}
```

### 2. Determinar Número Óptimo de Clusters

```bash
POST /api/ml/clustering/optimal-k
Body: {
  "months": 3,
  "features": null,
  "kRange": [2, 8],
  "normalize": true
}
```

**Respuesta:**
```json
{
  "success": true,
  "recommendedK": {
    "k": 4,
    "method": "silhouette",
    "reason": "Silhouette score alto (0.6500)"
  },
  "bestKBySilhouette": {
    "k": 4,
    "score": 0.65,
    "interpretation": "Estructura razonable de clusters"
  },
  "bestKByElbow": {
    "k": 4,
    "inertia": 1234.56
  },
  "kValues": [2, 3, 4, 5, 6, 7, 8],
  "silhouetteScores": [0.45, 0.58, 0.65, 0.62, 0.59, 0.55, 0.51],
  "inertias": [...]
}
```

### 3. Validar Clustering

```bash
POST /api/ml/clustering/validate
Body: {
  "months": 3,
  "features": null,
  "k": 4,
  "normalize": true
}
```

**Respuesta:**
```json
{
  "success": true,
  "validation": {
    "silhouette": {
      "score": 0.65,
      "interpretation": "Estructura razonable de clusters",
      "byCluster": {
        "0": { "mean": 0.68, "count": 150 },
        "1": { "mean": 0.63, "count": 200 },
        ...
      }
    },
    "inertia": 1234.56,
    "nClusters": 4,
    "nSamples": 500
  }
}
```

## 📊 Algoritmo K-means

### Características

- **Inicialización K-means++**: Mejor inicialización que selección aleatoria
- **Normalización automática**: Feature scaling por defecto
- **Convergencia**: Detección automática de convergencia
- **Métricas**: Cálculo de inercia (suma de distancias al cuadrado)

### Parámetros

- `k`: Número de clusters
- `maxIterations`: Máximo de iteraciones (default: 100)
- `tolerance`: Tolerancia para convergencia (default: 1e-4)
- `normalize`: Normalizar características (default: true)

## 🔍 Validación de Clustering

### Silhouette Score

El silhouette score mide qué tan bien están definidos los clusters:

- **Rango**: -1 (malo) a 1 (excelente)
- **≥ 0.7**: Estructura fuerte de clusters
- **≥ 0.5**: Estructura razonable
- **≥ 0.25**: Estructura débil
- **< 0.25**: No hay estructura evidente

### Método del Codo (Elbow Method)

Determina el número óptimo de clusters identificando el punto donde la inercia disminuye más lentamente.

## 🎯 Determinación de Número Óptimo

El sistema usa dos métodos combinados:

1. **Silhouette Score**: Encuentra k con mejor silhouette score
2. **Método del Codo**: Encuentra k en el punto del codo de la curva de inercia

La recomendación final prioriza silhouette score si es > 0.5, de lo contrario usa el método del codo.

## 📈 Análisis de Clusters

Para cada cluster, el sistema calcula:

- **Tamaño**: Número de puntos en el cluster
- **Porcentaje**: Porcentaje del total
- **Centroide**: Valores del centroide
- **Estadísticas por característica**: Media, mediana, std, min, max
- **Análisis temporal**: Horas y días más comunes
- **Rango de fechas**: Período temporal del cluster

## 🔧 Características por Defecto

Si no se especifican características, el sistema usa:

- `hora`: Hora del día (0-23)
- `dia_semana`: Día de la semana (0-6)
- `mes`: Mes del año (0-11)
- `es_fin_semana`: 1 si es fin de semana, 0 si no
- `tipo_entrada`: 1 si es entrada, 0 si es salida

## 📝 Ejemplo de Uso

### Uso Programático

```javascript
const ClusteringService = require('./ml/clustering_service');
const Asistencia = require('./models/Asistencia');

const service = new ClusteringService(Asistencia);

const result = await service.executeClusteringPipeline({
  months: 3,
  k: null, // Auto-determinar
  kRange: [2, 8],
  includeValidation: true
});

console.log('Clusters:', result.model.k);
console.log('Silhouette:', result.validation.silhouette.score);
```

### Desde API

```bash
# Ejecutar clustering completo
curl -X POST http://localhost:3000/api/ml/clustering/execute \
  -H "Content-Type: application/json" \
  -d '{
    "months": 3,
    "k": null,
    "kRange": [2, 8]
  }'
```

## ⚙️ Requisitos

- Node.js >= 12.0.0
- MongoDB con datos históricos
- Mínimo k puntos de datos (donde k es el número máximo de clusters)
- `simple-statistics`: Ya incluido en dependencias

## 📊 Visualización

El servicio incluye datos preparados para visualización:

- **Puntos**: Coordenadas de cada punto con su cluster asignado
- **Centroides**: Posiciones de los centroides
- **Feature names**: Nombres de características usadas

Para visualización 3D, se usan las primeras 3 características.

## 🎨 Interpretación de Resultados

### Silhouette Score

- **Alto (≥ 0.7)**: Clusters bien separados y cohesivos
- **Medio (0.5-0.7)**: Clusters razonables pero con alguna superposición
- **Bajo (0.25-0.5)**: Clusters débiles, posible superposición significativa
- **Muy bajo (< 0.25)**: No hay estructura de clusters clara

### Análisis de Clusters

Revisar:
1. **Tamaños**: Clusters muy pequeños o muy grandes pueden indicar problemas
2. **Características**: Qué características diferencian cada cluster
3. **Patrones temporales**: Horas y días asociados a cada cluster

## 🔮 Mejoras Futuras

- [ ] Algoritmos alternativos (DBSCAN, Hierarchical)
- [ ] Visualización interactiva en dashboard
- [ ] Análisis de importancia de características
- [ ] Exportación de resultados
- [ ] Comparación de diferentes k

## 📚 Referencias

- [K-means Clustering](https://en.wikipedia.org/wiki/K-means_clustering)
- [Silhouette Analysis](https://en.wikipedia.org/wiki/Silhouette_(clustering))
- [Elbow Method](https://en.wikipedia.org/wiki/Elbow_method_(clustering))
