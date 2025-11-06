/**
 * Servicio de Clustering Completo
 * Integra K-means con validación y determinación de número óptimo de clusters
 */

const KMeansClustering = require('./kmeans_clustering');
const ClusteringValidation = require('./clustering_validation');

class ClusteringService {
  constructor(AsistenciaModel) {
    this.Asistencia = AsistenciaModel;
    this.validator = new ClusteringValidation();
  }

  /**
   * Ejecuta pipeline completo de clustering
   */
  async executeClusteringPipeline(options = {}) {
    const {
      months = 3,
      features = null, // Si null, usar características por defecto
      k = null, // Si null, determinar automáticamente
      kRange = [2, 8],
      normalize = true,
      includeValidation = true,
      includeVisualization = true
    } = options;

    try {
      // 1. Preparar datos
      console.log('📥 Paso 1: Preparando datos...');
      const { X, featureNames, metadata } = await this.prepareData(months, features);
      
      if (X.length < Math.max(...kRange)) {
        throw new Error(`Datos insuficientes: ${X.length} puntos. Se requieren al menos ${Math.max(...kRange)} puntos.`);
      }

      console.log(`✅ Datos preparados: ${X.length} puntos, ${X[0].length} características`);

      // 2. Determinar número óptimo de clusters si no se especifica
      let optimalK = k;
      let optimalKResult = null;

      if (!optimalK) {
        console.log('🔍 Paso 2: Determinando número óptimo de clusters...');
        optimalKResult = this.validator.determineOptimalK(X, kRange, normalize);
        optimalK = optimalKResult.recommendedK.k;
        console.log(`✅ Número óptimo de clusters: ${optimalK} (${optimalKResult.recommendedK.method})`);
      }

      // 3. Ajustar modelo K-means
      console.log(`🎯 Paso 3: Ajustando modelo K-means con k=${optimalK}...`);
      const kmeans = new KMeansClustering(optimalK, {
        maxIterations: 100,
        tolerance: 1e-4
      });

      const fitResult = kmeans.fit(X, normalize);
      console.log(`✅ Modelo ajustado en ${fitResult.nIter} iteraciones`);

      // 4. Validar clustering
      let validation = null;
      if (includeValidation) {
        console.log('✅ Paso 4: Validando calidad de clusters...');
        const silhouette = this.validator.calculateSilhouetteScore(X, fitResult.labels);
        validation = {
          silhouette,
          inertia: fitResult.inertia,
          nClusters: optimalK,
          nSamples: X.length
        };
        console.log(`✅ Silhouette score: ${silhouette.score.toFixed(4)} (${silhouette.interpretation})`);
      }

      // 5. Preparar visualización
      let visualization = null;
      if (includeVisualization) {
        console.log('📊 Paso 5: Preparando datos de visualización...');
        visualization = this.prepareVisualizationData(X, fitResult.labels, fitResult.centroids, featureNames);
      }

      // 6. Analizar clusters
      const clusterAnalysis = this.analyzeClusters(X, fitResult.labels, fitResult.centroids, featureNames, metadata);

      return {
        success: true,
        model: {
          k: optimalK,
          centroids: fitResult.centroids,
          labels: fitResult.labels,
          inertia: fitResult.inertia,
          nIter: fitResult.nIter,
          hasConverged: fitResult.nIter < 100
        },
        optimalK: optimalKResult,
        validation,
        visualization,
        clusterAnalysis,
        featureNames,
        dataInfo: {
          nSamples: X.length,
          nFeatures: X[0].length,
          features: featureNames
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error en pipeline de clustering: ${error.message}`);
    }
  }

  /**
   * Prepara datos para clustering
   */
  async prepareData(months, customFeatures = null) {
    const fechaInicio = new Date();
    fechaInicio.setMonth(fechaInicio.getMonth() - months);
    const fechaFin = new Date();

    // Obtener datos históricos
    const asistencias = await this.Asistencia.find({
      fecha_hora: { $gte: fechaInicio, $lte: fechaFin }
    }).sort({ fecha_hora: 1 });

    if (asistencias.length === 0) {
      throw new Error('No hay datos disponibles para el período especificado');
    }

    // Definir características por defecto si no se especifican
    const defaultFeatures = [
      'hora',
      'dia_semana',
      'mes',
      'es_fin_semana',
      'tipo_entrada' // Convertir tipo a numérico
    ];

    const features = customFeatures || defaultFeatures;
    const featureNames = features;

    // Extraer características
    const X = [];
    const metadata = [];

    asistencias.forEach(asistencia => {
      const fechaHora = new Date(asistencia.fecha_hora);
      const featureValues = [];

      features.forEach(featureName => {
        switch (featureName) {
          case 'hora':
            featureValues.push(fechaHora.getHours());
            break;
          case 'dia_semana':
            featureValues.push(fechaHora.getDay());
            break;
          case 'mes':
            featureValues.push(fechaHora.getMonth());
            break;
          case 'es_fin_semana':
            featureValues.push((fechaHora.getDay() === 0 || fechaHora.getDay() === 6) ? 1 : 0);
            break;
          case 'tipo_entrada':
            featureValues.push(asistencia.tipo === 'entrada' ? 1 : 0);
            break;
          default:
            // Intentar obtener valor directo
            if (asistencia[featureName] !== undefined) {
              const value = asistencia[featureName];
              featureValues.push(typeof value === 'number' ? value : (value ? 1 : 0));
            } else {
              featureValues.push(0);
            }
        }
      });

      X.push(featureValues);
      metadata.push({
        id: asistencia._id,
        fecha_hora: asistencia.fecha_hora,
        codigo_universitario: asistencia.codigo_universitario
      });
    });

    return { X, featureNames, metadata };
  }

  /**
   * Analiza características de cada cluster
   */
  analyzeClusters(X, labels, centroids, featureNames, metadata) {
    const clusters = [...new Set(labels)];
    const analysis = {};

    clusters.forEach(cluster => {
      const clusterIndices = labels.map((l, idx) => l === cluster ? idx : -1)
        .filter(idx => idx !== -1);
      const clusterPoints = clusterIndices.map(idx => X[idx]);
      const clusterMetadata = clusterIndices.map(idx => metadata[idx]);

      // Calcular estadísticas por característica
      const featureStats = {};
      featureNames.forEach((featureName, j) => {
        const values = clusterPoints.map(point => point[j]);
        featureStats[featureName] = {
          mean: this.calculateMean(values),
          median: this.calculateMedian(values),
          std: this.calculateStd(values),
          min: Math.min(...values),
          max: Math.max(...values)
        };
      });

      // Analizar distribución temporal
      const dates = clusterMetadata.map(m => new Date(m.fecha_hora));
      const hours = dates.map(d => d.getHours());
      const daysOfWeek = dates.map(d => d.getDay());

      analysis[cluster] = {
        size: clusterPoints.length,
        percentage: (clusterPoints.length / X.length * 100).toFixed(2),
        centroid: centroids[cluster],
        featureStats,
        temporalAnalysis: {
          commonHours: this.getMostFrequent(hours, 3),
          commonDays: this.getMostFrequent(daysOfWeek, 3),
          dateRange: {
            start: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null,
            end: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null
          }
        }
      };
    });

    return analysis;
  }

  /**
   * Prepara datos para visualización
   */
  prepareVisualizationData(X, labels, centroids, featureNames) {
    // Para visualización, usamos las primeras 2-3 características principales
    // o reducción de dimensionalidad (PCA simplificado)
    
    const nFeatures = X[0].length;
    const selectedFeatures = Math.min(3, nFeatures); // Máximo 3 características para visualización

    // Si hay más de 3 características, usar las primeras 3
    const visualData = {
      points: X.map((point, idx) => ({
        x: point[0],
        y: point.length > 1 ? point[1] : 0,
        z: point.length > 2 ? point[2] : 0,
        cluster: labels[idx],
        features: point.slice(0, selectedFeatures)
      })),
      centroids: centroids.map((centroid, idx) => ({
        x: centroid[0],
        y: centroid.length > 1 ? centroid[1] : 0,
        z: centroid.length > 2 ? centroid[2] : 0,
        cluster: idx,
        features: centroid.slice(0, selectedFeatures)
      })),
      featureNames: featureNames.slice(0, selectedFeatures),
      nClusters: centroids.length
    };

    return visualData;
  }

  /**
   * Calcula media
   */
  calculateMean(values) {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Calcula mediana
   */
  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Calcula desviación estándar
   */
  calculateStd(values) {
    const mean = this.calculateMean(values);
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Obtiene los valores más frecuentes
   */
  getMostFrequent(values, n = 3) {
    const frequency = {};
    values.forEach(v => {
      frequency[v] = (frequency[v] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([value, count]) => ({
        value: parseInt(value),
        count,
        percentage: (count / values.length * 100).toFixed(2)
      }));
  }
}

module.exports = ClusteringService;
