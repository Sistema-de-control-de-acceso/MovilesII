/**
 * Servicio de Métricas de Precisión Temporal
 * Calcula métricas específicas para validar precisión de forecasts temporales
 */

class TemporalAccuracyMetrics {
  constructor() {
    this.minAccuracy = 0.75; // Precisión mínima requerida (75%)
  }

  /**
   * Calcula todas las métricas de precisión temporal
   */
  calculateAllMetrics(forecasts, actualValues, timestamps = null) {
    if (forecasts.length !== actualValues.length) {
      throw new Error('Forecasts y valores reales deben tener la misma longitud');
    }

    const n = forecasts.length;
    
    return {
      // Métricas básicas
      mae: this.calculateMAE(forecasts, actualValues),
      rmse: this.calculateRMSE(forecasts, actualValues),
      mape: this.calculateMAPE(forecasts, actualValues),
      mse: this.calculateMSE(forecasts, actualValues),
      
      // Métricas de precisión
      accuracy: this.calculateAccuracy(forecasts, actualValues),
      r2: this.calculateR2(forecasts, actualValues),
      directionalAccuracy: this.calculateDirectionalAccuracy(forecasts, actualValues),
      
      // Métricas de error porcentual
      meanError: this.calculateMeanError(forecasts, actualValues),
      meanAbsolutePercentageError: this.calculateMAPE(forecasts, actualValues),
      symmetricMAPE: this.calculateSMAPE(forecasts, actualValues),
      
      // Métricas temporales específicas
      temporalConsistency: this.calculateTemporalConsistency(forecasts, actualValues),
      horizonAccuracy: this.calculateHorizonAccuracy(forecasts, actualValues),
      
      // Validación
      meetsMinimumAccuracy: this.calculateAccuracy(forecasts, actualValues) >= this.minAccuracy,
      
      // Estadísticas descriptivas
      forecastStats: this.calculateStats(forecasts),
      actualStats: this.calculateStats(actualValues),
      
      n,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calcula MAE (Mean Absolute Error)
   */
  calculateMAE(forecasts, actual) {
    const errors = forecasts.map((f, i) => Math.abs(f - actual[i]));
    return errors.reduce((sum, e) => sum + e, 0) / errors.length;
  }

  /**
   * Calcula MSE (Mean Squared Error)
   */
  calculateMSE(forecasts, actual) {
    const squaredErrors = forecasts.map((f, i) => Math.pow(f - actual[i], 2));
    return squaredErrors.reduce((sum, e) => sum + e, 0) / squaredErrors.length;
  }

  /**
   * Calcula RMSE (Root Mean Squared Error)
   */
  calculateRMSE(forecasts, actual) {
    return Math.sqrt(this.calculateMSE(forecasts, actual));
  }

  /**
   * Calcula MAPE (Mean Absolute Percentage Error)
   */
  calculateMAPE(forecasts, actual) {
    const errors = forecasts.map((f, i) => {
      if (actual[i] === 0) return 0;
      return Math.abs((f - actual[i]) / actual[i]) * 100;
    });
    return errors.reduce((sum, e) => sum + e, 0) / errors.length;
  }

  /**
   * Calcula SMAPE (Symmetric Mean Absolute Percentage Error)
   */
  calculateSMAPE(forecasts, actual) {
    const errors = forecasts.map((f, i) => {
      const denominator = (Math.abs(f) + Math.abs(actual[i])) / 2;
      if (denominator === 0) return 0;
      return Math.abs(f - actual[i]) / denominator * 100;
    });
    return errors.reduce((sum, e) => sum + e, 0) / errors.length;
  }

  /**
   * Calcula precisión general (1 - MAPE normalizado)
   */
  calculateAccuracy(forecasts, actual) {
    const mape = this.calculateMAPE(forecasts, actual);
    // Normalizar MAPE a escala 0-1 (asumiendo MAPE máximo razonable de 100%)
    const normalizedMAPE = Math.min(mape / 100, 1);
    return Math.max(0, 1 - normalizedMAPE);
  }

  /**
   * Calcula R² (Coeficiente de determinación)
   */
  calculateR2(forecasts, actual) {
    const meanActual = actual.reduce((sum, a) => sum + a, 0) / actual.length;
    const ssRes = forecasts.reduce((sum, f, i) => sum + Math.pow(f - actual[i], 2), 0);
    const ssTot = actual.reduce((sum, a) => sum + Math.pow(a - meanActual, 2), 0);
    return ssTot === 0 ? 0 : 1 - (ssRes / ssTot);
  }

  /**
   * Calcula error medio
   */
  calculateMeanError(forecasts, actual) {
    const errors = forecasts.map((f, i) => f - actual[i]);
    return errors.reduce((sum, e) => sum + e, 0) / errors.length;
  }

  /**
   * Calcula precisión direccional
   */
  calculateDirectionalAccuracy(forecasts, actual) {
    if (forecasts.length < 2) return 0;
    
    let correct = 0;
    for (let i = 1; i < forecasts.length; i++) {
      const forecastDirection = forecasts[i] - forecasts[i - 1];
      const actualDirection = actual[i] - actual[i - 1];
      
      if ((forecastDirection >= 0 && actualDirection >= 0) || 
          (forecastDirection < 0 && actualDirection < 0)) {
        correct++;
      }
    }
    
    return correct / (forecasts.length - 1);
  }

  /**
   * Calcula consistencia temporal (qué tan bien mantiene el modelo la consistencia en el tiempo)
   */
  calculateTemporalConsistency(forecasts, actual) {
    if (forecasts.length < 3) return 0;
    
    // Calcular variabilidad de errores
    const errors = forecasts.map((f, i) => Math.abs(f - actual[i]));
    const meanError = errors.reduce((sum, e) => sum + e, 0) / errors.length;
    
    // Calcular desviación estándar de errores
    const variance = errors.reduce((sum, e) => sum + Math.pow(e - meanError, 2), 0) / errors.length;
    const stdDev = Math.sqrt(variance);
    
    // Consistencia es inversa a la variabilidad (normalizada)
    const maxStdDev = meanError * 2; // Estimación razonable
    const consistency = maxStdDev === 0 ? 1 : Math.max(0, 1 - (stdDev / maxStdDev));
    
    return consistency;
  }

  /**
   * Calcula precisión por horizonte de forecast (más preciso en corto plazo)
   */
  calculateHorizonAccuracy(forecasts, actual) {
    if (forecasts.length === 0) return {};
    
    const horizonSteps = Math.min(5, forecasts.length); // Analizar primeros 5 pasos
    const accuracyByHorizon = {};
    
    for (let h = 1; h <= horizonSteps; h++) {
      if (h <= forecasts.length) {
        const horizonForecasts = forecasts.slice(0, h);
        const horizonActual = actual.slice(0, h);
        accuracyByHorizon[h] = this.calculateAccuracy(horizonForecasts, horizonActual);
      }
    }
    
    return accuracyByHorizon;
  }

  /**
   * Calcula estadísticas descriptivas
   */
  calculateStats(values) {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    
    return {
      mean: parseFloat(mean.toFixed(4)),
      median: parseFloat(median.toFixed(4)),
      stdDev: parseFloat(stdDev.toFixed(4)),
      variance: parseFloat(variance.toFixed(4)),
      min: parseFloat(min.toFixed(4)),
      max: parseFloat(max.toFixed(4))
    };
  }

  /**
   * Valida si el modelo cumple con los criterios de precisión mínima
   */
  validateAccuracy(forecasts, actualValues) {
    const metrics = this.calculateAllMetrics(forecasts, actualValues);
    
    return {
      passes: metrics.meetsMinimumAccuracy,
      accuracy: metrics.accuracy,
      minimumRequired: this.minAccuracy,
      message: metrics.meetsMinimumAccuracy
        ? `✅ Precisión (${(metrics.accuracy * 100).toFixed(2)}%) cumple con el mínimo requerido (${this.minAccuracy * 100}%)`
        : `❌ Precisión (${(metrics.accuracy * 100).toFixed(2)}%) no cumple con el mínimo requerido (${this.minAccuracy * 100}%)`,
      metrics
    };
  }

  /**
   * Genera reporte completo de métricas
   */
  generateReport(forecasts, actualValues, modelInfo = {}) {
    const metrics = this.calculateAllMetrics(forecasts, actualValues);
    
    return {
      summary: {
        model: modelInfo.modelType || 'ARIMA',
        order: modelInfo.order || null,
        accuracy: metrics.accuracy,
        meetsMinimumAccuracy: metrics.meetsMinimumAccuracy,
        timestamp: new Date().toISOString()
      },
      metrics: {
        errorMetrics: {
          mae: parseFloat(metrics.mae.toFixed(4)),
          rmse: parseFloat(metrics.rmse.toFixed(4)),
          mape: parseFloat(metrics.mape.toFixed(4)),
          mse: parseFloat(metrics.mse.toFixed(4))
        },
        accuracyMetrics: {
          accuracy: parseFloat(metrics.accuracy.toFixed(4)),
          r2: parseFloat(metrics.r2.toFixed(4)),
          directionalAccuracy: parseFloat(metrics.directionalAccuracy.toFixed(4)),
          temporalConsistency: parseFloat(metrics.temporalConsistency.toFixed(4))
        },
        percentageErrors: {
          mape: parseFloat(metrics.mape.toFixed(4)),
          smape: parseFloat(metrics.symmetricMAPE.toFixed(4))
        },
        horizonAccuracy: metrics.horizonAccuracy,
        statistics: {
          forecast: metrics.forecastStats,
          actual: metrics.actualStats
        }
      },
      validation: {
        passes: metrics.meetsMinimumAccuracy,
        minimumRequired: this.minAccuracy,
        currentAccuracy: metrics.accuracy
      },
      n: metrics.n
    };
  }
}

module.exports = TemporalAccuracyMetrics;
