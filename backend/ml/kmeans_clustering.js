/**
 * Algoritmo K-means para Clustering
 * Implementa clustering K-means con inicialización K-means++
 */

const ss = require('simple-statistics');

class KMeansClustering {
  constructor(k = 3, options = {}) {
    this.k = k; // Número de clusters
    this.maxIterations = options.maxIterations || 100;
    this.tolerance = options.tolerance || 1e-4;
    this.randomState = options.randomState || null;
    this.centroids = null;
    this.labels = null;
    this.inertia = null;
    this.nIter = 0;
    this.featureMeans = null;
    this.featureStds = null;
  }

  /**
   * Normaliza características (feature scaling)
   */
  normalizeFeatures(X) {
    if (!Array.isArray(X) || X.length === 0) {
      throw new Error('X debe ser un array no vacío');
    }

    const n = X.length;
    const m = X[0].length;

    if (!this.featureMeans || !this.featureStds) {
      this.featureMeans = [];
      this.featureStds = [];

      for (let j = 0; j < m; j++) {
        const column = X.map(row => row[j]);
        const mean = ss.mean(column);
        const std = ss.standardDeviation(column);
        
        this.featureMeans.push(mean);
        this.featureStds.push(std === 0 ? 1 : std); // Evitar división por cero
      }
    }

    // Normalizar
    return X.map(row =>
      row.map((val, j) => (val - this.featureMeans[j]) / this.featureStds[j])
    );
  }

  /**
   * Inicializa centroides usando K-means++ (mejor inicialización)
   */
  initializeCentroids(X) {
    const n = X.length;
    const m = X[0].length;
    const centroids = [];

    // Primer centroide aleatorio
    let randomIndex = this.randomState !== null 
      ? this.randomState % n 
      : Math.floor(Math.random() * n);
    centroids.push([...X[randomIndex]]);

    // K-means++: seleccionar centroides restantes
    for (let i = 1; i < this.k; i++) {
      const distances = X.map(point => {
        // Distancia al centroide más cercano
        const minDist = centroids.reduce((min, centroid) => {
          const dist = this.euclideanDistance(point, centroid);
          return Math.min(min, dist);
        }, Infinity);
        return minDist * minDist; // Distancia al cuadrado para K-means++
      });

      // Seleccionar punto con probabilidad proporcional a distancia^2
      const sumDistances = distances.reduce((sum, d) => sum + d, 0);
      let random = this.randomState !== null 
        ? (this.randomState + i) % 1 
        : Math.random();
      random *= sumDistances;

      let cumulative = 0;
      let selectedIndex = 0;
      for (let j = 0; j < n; j++) {
        cumulative += distances[j];
        if (cumulative >= random) {
          selectedIndex = j;
          break;
        }
      }

      centroids.push([...X[selectedIndex]]);
    }

    return centroids;
  }

  /**
   * Calcula distancia euclidiana entre dos puntos
   */
  euclideanDistance(point1, point2) {
    if (point1.length !== point2.length) {
      throw new Error('Los puntos deben tener la misma dimensión');
    }

    let sum = 0;
    for (let i = 0; i < point1.length; i++) {
      sum += Math.pow(point1[i] - point2[i], 2);
    }
    return Math.sqrt(sum);
  }

  /**
   * Asigna cada punto al cluster más cercano
   */
  assignClusters(X, centroids) {
    const labels = [];
    
    for (let i = 0; i < X.length; i++) {
      let minDist = Infinity;
      let closestCluster = 0;

      for (let j = 0; j < centroids.length; j++) {
        const dist = this.euclideanDistance(X[i], centroids[j]);
        if (dist < minDist) {
          minDist = dist;
          closestCluster = j;
        }
      }

      labels.push(closestCluster);
    }

    return labels;
  }

  /**
   * Actualiza centroides basándose en los puntos asignados
   */
  updateCentroids(X, labels) {
    const newCentroids = [];
    const m = X[0].length;

    for (let i = 0; i < this.k; i++) {
      const clusterPoints = X.filter((_, idx) => labels[idx] === i);
      
      if (clusterPoints.length === 0) {
        // Si un cluster está vacío, mantener el centroide anterior
        newCentroids.push([...this.centroids[i]]);
        continue;
      }

      // Calcular media de los puntos del cluster
      const centroid = new Array(m).fill(0);
      for (let j = 0; j < m; j++) {
        const column = clusterPoints.map(point => point[j]);
        centroid[j] = ss.mean(column);
      }

      newCentroids.push(centroid);
    }

    return newCentroids;
  }

  /**
   * Calcula inercia (suma de distancias al cuadrado)
   */
  calculateInertia(X, labels, centroids) {
    let inertia = 0;

    for (let i = 0; i < X.length; i++) {
      const cluster = labels[i];
      const dist = this.euclideanDistance(X[i], centroids[cluster]);
      inertia += dist * dist;
    }

    return inertia;
  }

  /**
   * Ajusta el modelo K-means a los datos
   */
  fit(X, normalize = true) {
    if (!Array.isArray(X) || X.length === 0) {
      throw new Error('X debe ser un array no vacío');
    }

    if (X.length < this.k) {
      throw new Error(`No hay suficientes puntos (${X.length}) para ${this.k} clusters`);
    }

    // Normalizar si está habilitado
    const X_normalized = normalize ? this.normalizeFeatures(X) : X;

    // Inicializar centroides
    this.centroids = this.initializeCentroids(X_normalized);
    this.labels = new Array(X.length).fill(0);

    // Iterar hasta convergencia
    for (let iter = 0; iter < this.maxIterations; iter++) {
      // Asignar puntos a clusters
      const newLabels = this.assignClusters(X_normalized, this.centroids);

      // Actualizar centroides
      const newCentroids = this.updateCentroids(X_normalized, newLabels);

      // Calcular cambio máximo en centroides
      let maxChange = 0;
      for (let i = 0; i < this.k; i++) {
        const change = this.euclideanDistance(this.centroids[i], newCentroids[i]);
        maxChange = Math.max(maxChange, change);
      }

      this.centroids = newCentroids;
      this.labels = newLabels;
      this.nIter = iter + 1;

      // Verificar convergencia
      if (maxChange < this.tolerance) {
        break;
      }
    }

    // Calcular inercia final
    this.inertia = this.calculateInertia(X_normalized, this.labels, this.centroids);

    return {
      centroids: this.centroids,
      labels: this.labels,
      inertia: this.inertia,
      nIter: this.nIter
    };
  }

  /**
   * Predice el cluster para nuevos puntos
   */
  predict(X) {
    if (!this.centroids) {
      throw new Error('El modelo debe ser ajustado antes de predecir');
    }

    if (!Array.isArray(X)) {
      X = [X]; // Convertir punto único a array
    }

    // Normalizar usando los mismos parámetros de entrenamiento
    const X_normalized = X.map(point => {
      if (!this.featureMeans || !this.featureStds) {
        return point; // Si no se normalizó durante el entrenamiento
      }
      return point.map((val, j) => (val - this.featureMeans[j]) / this.featureStds[j]);
    });

    const labels = [];
    for (let i = 0; i < X_normalized.length; i++) {
      let minDist = Infinity;
      let closestCluster = 0;

      for (let j = 0; j < this.centroids.length; j++) {
        const dist = this.euclideanDistance(X_normalized[i], this.centroids[j]);
        if (dist < minDist) {
          minDist = dist;
          closestCluster = j;
        }
      }

      labels.push(closestCluster);
    }

    return labels.length === 1 ? labels[0] : labels;
  }

  /**
   * Obtiene resumen del modelo
   */
  getSummary() {
    return {
      k: this.k,
      centroids: this.centroids,
      nIter: this.nIter,
      inertia: this.inertia,
      hasConverged: this.nIter < this.maxIterations
    };
  }
}

module.exports = KMeansClustering;
