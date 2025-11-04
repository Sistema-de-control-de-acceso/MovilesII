/**
 * Validación de Clustering
 * Implementa métodos para validar calidad de clusters: silhouette score, método del codo, etc.
 */

const ss = require('simple-statistics');

class ClusteringValidation {
  constructor() {
    this.methods = ['silhouette', 'elbow', 'gap_statistic'];
  }

  /**
   * Calcula silhouette score para validar calidad de clusters
   * Silhouette score: -1 (malo) a 1 (excelente)
   */
  calculateSilhouetteScore(X, labels) {
    if (!Array.isArray(X) || X.length === 0) {
      throw new Error('X debe ser un array no vacío');
    }

    if (labels.length !== X.length) {
      throw new Error('Labels debe tener la misma longitud que X');
    }

    const n = X.length;
    const clusters = [...new Set(labels)];
    const k = clusters.length;

    if (k < 2) {
      return {
        score: -1,
        message: 'Se requiere al menos 2 clusters para calcular silhouette score'
      };
    }

    // Calcular distancia euclidiana
    const euclideanDistance = (p1, p2) => {
      let sum = 0;
      for (let i = 0; i < p1.length; i++) {
        sum += Math.pow(p1[i] - p2[i], 2);
      }
      return Math.sqrt(sum);
    };

    // Calcular silhouette para cada punto
    const silhouetteScores = [];
    const clusterPoints = {};

    // Agrupar puntos por cluster
    clusters.forEach(cluster => {
      clusterPoints[cluster] = X.filter((_, idx) => labels[idx] === cluster);
    });

    for (let i = 0; i < n; i++) {
      const point = X[i];
      const cluster = labels[i];
      const clusterSize = clusterPoints[cluster].length;

      // a(i): distancia promedio a otros puntos en el mismo cluster
      let a = 0;
      if (clusterSize > 1) {
        const distances = clusterPoints[cluster]
          .filter((_, idx) => {
            const pointIdx = X.findIndex(p => p === clusterPoints[cluster][idx]);
            return pointIdx !== i;
          })
          .map(otherPoint => euclideanDistance(point, otherPoint));
        
        a = distances.length > 0 ? ss.mean(distances) : 0;
      } else {
        a = 0; // Si el cluster tiene solo un punto, a = 0
      }

      // b(i): distancia promedio mínima a puntos en otros clusters
      let minB = Infinity;
      for (const otherCluster of clusters) {
        if (otherCluster === cluster) continue;

        const otherClusterPoints = clusterPoints[otherCluster];
        if (otherClusterPoints.length === 0) continue;

        const distances = otherClusterPoints.map(otherPoint => 
          euclideanDistance(point, otherPoint)
        );
        const avgDist = ss.mean(distances);
        minB = Math.min(minB, avgDist);
      }

      // Si no hay otros clusters, b = 0
      if (minB === Infinity) {
        minB = 0;
      }

      // Calcular silhouette para este punto
      const silhouette = (minB - a) / Math.max(a, minB);
      silhouetteScores.push(silhouette);
    }

    // Silhouette score promedio
    const avgSilhouette = ss.mean(silhouetteScores);

    // Silhouette por cluster
    const silhouetteByCluster = {};
    clusters.forEach(cluster => {
      const clusterIndices = labels.map((l, idx) => l === cluster ? idx : -1)
        .filter(idx => idx !== -1);
      const clusterScores = clusterIndices.map(idx => silhouetteScores[idx]);
      silhouetteByCluster[cluster] = {
        mean: ss.mean(clusterScores),
        count: clusterIndices.length
      };
    });

    return {
      score: parseFloat(avgSilhouette.toFixed(4)),
      scores: silhouetteScores,
      byCluster: silhouetteByCluster,
      interpretation: this.interpretSilhouetteScore(avgSilhouette)
    };
  }

  /**
   * Interpreta el silhouette score
   */
  interpretSilhouetteScore(score) {
    if (score >= 0.7) return 'Estructura fuerte de clusters';
    if (score >= 0.5) return 'Estructura razonable de clusters';
    if (score >= 0.25) return 'Estructura débil de clusters';
    return 'No hay estructura de clusters evidente';
  }

  /**
   * Método del codo (Elbow Method) para determinar número óptimo de clusters
   */
  calculateElbowMethod(X, kRange = [2, 10], normalize = true) {
    if (!Array.isArray(X) || X.length === 0) {
      throw new Error('X debe ser un array no vacío');
    }

    const KMeansClustering = require('./kmeans_clustering');
    const inertias = [];
    const kValues = [];

    for (let k = kRange[0]; k <= kRange[1] && k <= X.length; k++) {
      try {
        const kmeans = new KMeansClustering(k, {
          maxIterations: 100,
          tolerance: 1e-4
        });

        const result = kmeans.fit(X, normalize);
        inertias.push(result.inertia);
        kValues.push(k);
      } catch (error) {
        console.warn(`Error con k=${k}: ${error.message}`);
        continue;
      }
    }

    // Calcular punto del codo (elbow point)
    const elbowPoint = this.findElbowPoint(kValues, inertias);

    return {
      kValues,
      inertias,
      elbowK: elbowPoint.k,
      elbowInertia: elbowPoint.inertia,
      recommendations: this.recommendKFromElbow(kValues, inertias)
    };
  }

  /**
   * Encuentra el punto del codo
   */
  findElbowPoint(kValues, inertias) {
    if (kValues.length < 3) {
      return { k: kValues[0] || 2, inertia: inertias[0] || 0 };
    }

    // Calcular tasa de cambio (derivada)
    const rates = [];
    for (let i = 1; i < inertias.length; i++) {
      const kDiff = kValues[i] - kValues[i - 1];
      const inertiaDiff = inertias[i] - inertias[i - 1];
      rates.push(inertiaDiff / kDiff);
    }

    // Encontrar el punto donde la tasa de cambio disminuye más
    let maxRateChange = -Infinity;
    let elbowIndex = 0;

    for (let i = 1; i < rates.length; i++) {
      const rateChange = rates[i - 1] - rates[i];
      if (rateChange > maxRateChange) {
        maxRateChange = rateChange;
        elbowIndex = i;
      }
    }

    return {
      k: kValues[elbowIndex + 1] || kValues[1],
      inertia: inertias[elbowIndex + 1] || inertias[1]
    };
  }

  /**
   * Recomienda k basándose en el método del codo
   */
  recommendKFromElbow(kValues, inertias) {
    if (kValues.length < 2) {
      return { recommendedK: 2, reason: 'Pocos datos para análisis' };
    }

    const elbowPoint = this.findElbowPoint(kValues, inertias);
    
    return {
      recommendedK: elbowPoint.k,
      reason: `Punto del codo identificado en k=${elbowPoint.k}`,
      alternativeK: kValues[Math.min(elbowPoint.k + 1, kValues.length - 1)]
    };
  }

  /**
   * Determina número óptimo de clusters usando múltiples métodos
   */
  determineOptimalK(X, kRange = [2, 10], normalize = true) {
    if (!Array.isArray(X) || X.length === 0) {
      throw new Error('X debe ser un array no vacío');
    }

    const KMeansClustering = require('./kmeans_clustering');
    const results = {
      kRange: [kRange[0], Math.min(kRange[1], X.length)],
      silhouetteScores: [],
      inertias: [],
      kValues: []
    };

    // Evaluar diferentes valores de k
    for (let k = kRange[0]; k <= kRange[1] && k <= X.length; k++) {
      try {
        const kmeans = new KMeansClustering(k, {
          maxIterations: 100,
          tolerance: 1e-4
        });

        const fitResult = kmeans.fit(X, normalize);
        const silhouette = this.calculateSilhouetteScore(X, fitResult.labels);

        results.kValues.push(k);
        results.inertias.push(fitResult.inertia);
        results.silhouetteScores.push(silhouette.score);
      } catch (error) {
        console.warn(`Error evaluando k=${k}: ${error.message}`);
        continue;
      }
    }

    // Encontrar k óptimo basándose en silhouette score
    let bestSilhouetteK = kRange[0];
    let bestSilhouetteScore = -1;

    results.silhouetteScores.forEach((score, idx) => {
      if (score > bestSilhouetteScore) {
        bestSilhouetteScore = score;
        bestSilhouetteK = results.kValues[idx];
      }
    });

    // Encontrar k óptimo usando método del codo
    const elbowResult = this.calculateElbowMethod(X, kRange, normalize);

    // Recomendación final
    const recommendedK = bestSilhouetteScore > 0.5 ? bestSilhouetteK : elbowResult.elbowK;

    return {
      ...results,
      bestKBySilhouette: {
        k: bestSilhouetteK,
        score: bestSilhouetteScore,
        interpretation: this.interpretSilhouetteScore(bestSilhouetteScore)
      },
      bestKByElbow: {
        k: elbowResult.elbowK,
        inertia: elbowResult.elbowInertia
      },
      recommendedK: {
        k: recommendedK,
        method: bestSilhouetteScore > 0.5 ? 'silhouette' : 'elbow',
        reason: bestSilhouetteScore > 0.5 
          ? `Silhouette score alto (${bestSilhouetteScore.toFixed(4)})`
          : `Método del codo en k=${elbowResult.elbowK}`
      },
      elbowMethod: elbowResult
    };
  }
}

module.exports = ClusteringValidation;
