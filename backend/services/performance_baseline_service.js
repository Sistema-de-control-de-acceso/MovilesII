/**
 * Servicio de Baseline de Rendimiento
 * 
 * Crea y mantiene baselines de rendimiento para consultas críticas
 * Permite comparar métricas antes y después de optimizaciones
 */

const { logger } = require('../utils/logger');

class PerformanceBaselineService {
  constructor() {
    this.baselines = new Map();
    this.measurements = new Map();
  }

  /**
   * Crear baseline para una consulta crítica
   */
  async createBaseline(queryName, queryFunction, options = {}) {
    const {
      iterations = 10,
      warmup = 2,
      description = '',
    } = options;

    logger.info(`Creando baseline para: ${queryName}`, { iterations, warmup });

    // Warmup
    for (let i = 0; i < warmup; i++) {
      try {
        await queryFunction();
      } catch (error) {
        logger.warn(`Error en warmup ${i + 1} para ${queryName}`, error);
      }
    }

    // Mediciones
    const measurements = [];
    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      let error = null;
      let result = null;

      try {
        result = await queryFunction();
      } catch (e) {
        error = e.message;
      }

      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1000000; // Convertir a ms

      measurements.push({
        iteration: i + 1,
        durationMs,
        error,
        success: !error,
      });
    }

    // Calcular estadísticas
    const successful = measurements.filter(m => m.success);
    const durations = successful.map(m => m.durationMs);

    const baseline = {
      queryName,
      description,
      timestamp: new Date().toISOString(),
      iterations,
      successful: successful.length,
      failed: measurements.length - successful.length,
      stats: {
        min: durations.length > 0 ? Math.min(...durations) : 0,
        max: durations.length > 0 ? Math.max(...durations) : 0,
        avg: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
        p50: this._percentile(durations, 50),
        p95: this._percentile(durations, 95),
        p99: this._percentile(durations, 99),
      },
      measurements,
    };

    this.baselines.set(queryName, baseline);
    logger.info(`Baseline creado para ${queryName}`, {
      avg: baseline.stats.avg.toFixed(2),
      p95: baseline.stats.p95.toFixed(2),
    });

    return baseline;
  }

  /**
   * Medir rendimiento de una consulta y comparar con baseline
   */
  async measureQuery(queryName, queryFunction, options = {}) {
    const {
      iterations = 5,
      warmup = 1,
    } = options;

    // Warmup
    for (let i = 0; i < warmup; i++) {
      try {
        await queryFunction();
      } catch (error) {
        // Ignorar errores en warmup
      }
    }

    // Mediciones
    const measurements = [];
    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      let error = null;
      let result = null;

      try {
        result = await queryFunction();
      } catch (e) {
        error = e.message;
      }

      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1000000;

      measurements.push({
        iteration: i + 1,
        durationMs,
        error,
        success: !error,
      });
    }

    const successful = measurements.filter(m => m.success);
    const durations = successful.map(m => m.durationMs);

    const measurement = {
      queryName,
      timestamp: new Date().toISOString(),
      iterations,
      successful: successful.length,
      failed: measurements.length - successful.length,
      stats: {
        min: durations.length > 0 ? Math.min(...durations) : 0,
        max: durations.length > 0 ? Math.max(...durations) : 0,
        avg: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
        p50: this._percentile(durations, 50),
        p95: this._percentile(durations, 95),
        p99: this._percentile(durations, 99),
      },
      measurements,
    };

    // Comparar con baseline si existe
    const baseline = this.baselines.get(queryName);
    let comparison = null;

    if (baseline) {
      comparison = {
        avg: {
          current: measurement.stats.avg,
          baseline: baseline.stats.avg,
          improvement: ((baseline.stats.avg - measurement.stats.avg) / baseline.stats.avg * 100).toFixed(2) + '%',
          isBetter: measurement.stats.avg < baseline.stats.avg,
        },
        p95: {
          current: measurement.stats.p95,
          baseline: baseline.stats.p95,
          improvement: ((baseline.stats.p95 - measurement.stats.p95) / baseline.stats.p95 * 100).toFixed(2) + '%',
          isBetter: measurement.stats.p95 < baseline.stats.p95,
        },
        p99: {
          current: measurement.stats.p99,
          baseline: baseline.stats.p99,
          improvement: ((baseline.stats.p99 - measurement.stats.p99) / baseline.stats.p99 * 100).toFixed(2) + '%',
          isBetter: measurement.stats.p99 < baseline.stats.p99,
        },
      };
    }

    this.measurements.set(queryName, measurement);

    return {
      measurement,
      baseline,
      comparison,
    };
  }

  /**
   * Obtener baseline por nombre
   */
  getBaseline(queryName) {
    return this.baselines.get(queryName);
  }

  /**
   * Obtener todos los baselines
   */
  getAllBaselines() {
    return Array.from(this.baselines.values());
  }

  /**
   * Obtener todas las mediciones
   */
  getAllMeasurements() {
    return Array.from(this.measurements.values());
  }

  /**
   * Calcular percentil
   */
  _percentile(arr, percentile) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] || 0;
  }

  /**
   * Exportar baselines a JSON
   */
  exportBaselines() {
    return {
      baselines: this.getAllBaselines(),
      measurements: this.getAllMeasurements(),
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Importar baselines desde JSON
   */
  importBaselines(data) {
    if (data.baselines) {
      data.baselines.forEach(baseline => {
        this.baselines.set(baseline.queryName, baseline);
      });
    }
    if (data.measurements) {
      data.measurements.forEach(measurement => {
        this.measurements.set(measurement.queryName, measurement);
      });
    }
  }
}

module.exports = PerformanceBaselineService;

