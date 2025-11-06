/**
 * Servicio de Alertas para App Mobile
 * 
 * Monitorea métricas de la app mobile y envía alertas cuando se exceden umbrales
 */

const { AlertService, LogAlertChannel, EmailAlertChannel } = require('./alert_service');
const { logger } = require('../utils/logger');

class MobileAlertService {
  constructor() {
    this.alertService = new AlertService();
    this.metrics = {
      crashes: [],
      errors: [],
      latency: [],
      anr: [],
      sessions: []
    };
    this.thresholds = {
      crashRate: 0.01, // 1% de sesiones con crash
      errorRate: 0.05, // 5% de requests con error
      latencyP95: 2000, // P95 < 2 segundos
      anrCount: 5, // Máximo 5 ANRs por hora
    };
    this.windowSize = 60 * 60 * 1000; // 1 hora en ms
  }

  /**
   * Registrar crash
   */
  async recordCrash(crashData) {
    const crash = {
      ...crashData,
      timestamp: new Date().toISOString(),
    };

    this.metrics.crashes.push(crash);
    
    // Mantener solo crashes de la última hora
    this._cleanOldMetrics('crashes');

    // Verificar umbral de crash rate
    await this._checkCrashRate();

    logger.warn('Crash registrado', crash);
  }

  /**
   * Registrar error
   */
  async recordError(errorData) {
    const error = {
      ...errorData,
      timestamp: new Date().toISOString(),
    };

    this.metrics.errors.push(error);
    this._cleanOldMetrics('errors');

    // Verificar umbral de error rate
    await this._checkErrorRate();

    logger.warn('Error registrado', error);
  }

  /**
   * Registrar latencia
   */
  async recordLatency(operation, milliseconds) {
    const latency = {
      operation,
      milliseconds,
      timestamp: new Date().toISOString(),
    };

    this.metrics.latency.push(latency);
    this._cleanOldMetrics('latency');

    // Verificar umbral de latencia
    await this._checkLatency();

    // Log solo si es alta
    if (milliseconds > this.thresholds.latencyP95) {
      logger.warn('Latencia alta detectada', latency);
    }
  }

  /**
   * Registrar ANR (Application Not Responding)
   */
  async recordANR(anrData) {
    const anr = {
      ...anrData,
      timestamp: new Date().toISOString(),
    };

    this.metrics.anr.push(anr);
    this._cleanOldMetrics('anr');

    // Verificar umbral de ANR
    await this._checkANR();

    logger.error('ANR registrado', anr);
  }

  /**
   * Registrar sesión
   */
  recordSession(sessionData) {
    const session = {
      ...sessionData,
      timestamp: new Date().toISOString(),
    };

    this.metrics.sessions.push(session);
    this._cleanOldMetrics('sessions');
  }

  /**
   * Verificar crash rate
   */
  async _checkCrashRate() {
    const recentSessions = this.metrics.sessions.filter(s => {
      return new Date(s.timestamp) > new Date(Date.now() - this.windowSize);
    });

    const recentCrashes = this.metrics.crashes.filter(c => {
      return new Date(c.timestamp) > new Date(Date.now() - this.windowSize);
    });

    if (recentSessions.length === 0) return;

    const crashRate = recentCrashes.length / recentSessions.length;

    if (crashRate > this.thresholds.crashRate) {
      await this.alertService.sendAlert({
        type: 'mobile_crash_rate',
        severity: crashRate > this.thresholds.crashRate * 2 ? 'critical' : 'warning',
        title: 'Crash Rate Alto en App Mobile',
        message: `Crash rate: ${(crashRate * 100).toFixed(2)}% (umbral: ${(this.thresholds.crashRate * 100).toFixed(2)}%)`,
        value: crashRate,
        threshold: this.thresholds.crashRate,
        metadata: {
          crashes: recentCrashes.length,
          sessions: recentSessions.length,
          period: '1 hour',
        },
      });
    }
  }

  /**
   * Verificar error rate
   */
  async _checkErrorRate() {
    const recentErrors = this.metrics.errors.filter(e => {
      return new Date(e.timestamp) > new Date(Date.now() - this.windowSize);
    });

    // Asumir que cada error corresponde a una request
    // En producción, esto debería venir de métricas reales de requests
    const estimatedRequests = recentErrors.length * 20; // Estimación
    const errorRate = recentErrors.length / Math.max(estimatedRequests, 1);

    if (errorRate > this.thresholds.errorRate) {
      await this.alertService.sendAlert({
        type: 'mobile_error_rate',
        severity: errorRate > this.thresholds.errorRate * 2 ? 'critical' : 'warning',
        title: 'Error Rate Alto en App Mobile',
        message: `Error rate: ${(errorRate * 100).toFixed(2)}% (umbral: ${(this.thresholds.errorRate * 100).toFixed(2)}%)`,
        value: errorRate,
        threshold: this.thresholds.errorRate,
        metadata: {
          errors: recentErrors.length,
          estimatedRequests,
          period: '1 hour',
        },
      });
    }
  }

  /**
   * Verificar latencia
   */
  async _checkLatency() {
    const recentLatencies = this.metrics.latency.filter(l => {
      return new Date(l.timestamp) > new Date(Date.now() - this.windowSize);
    });

    if (recentLatencies.length === 0) return;

    // Calcular P95
    const sorted = recentLatencies.map(l => l.milliseconds).sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p95 = sorted[p95Index] || 0;

    if (p95 > this.thresholds.latencyP95) {
      await this.alertService.sendAlert({
        type: 'mobile_latency',
        severity: p95 > this.thresholds.latencyP95 * 2 ? 'critical' : 'warning',
        title: 'Latencia Alta en App Mobile',
        message: `P95 latency: ${p95}ms (umbral: ${this.thresholds.latencyP95}ms)`,
        value: p95,
        threshold: this.thresholds.latencyP95,
        metadata: {
          p50: sorted[Math.floor(sorted.length * 0.50)] || 0,
          p95,
          p99: sorted[Math.floor(sorted.length * 0.99)] || 0,
          samples: recentLatencies.length,
          period: '1 hour',
        },
      });
    }
  }

  /**
   * Verificar ANR
   */
  async _checkANR() {
    const recentANRs = this.metrics.anr.filter(a => {
      return new Date(a.timestamp) > new Date(Date.now() - this.windowSize);
    });

    if (recentANRs.length > this.thresholds.anrCount) {
      await this.alertService.sendAlert({
        type: 'mobile_anr',
        severity: recentANRs.length > this.thresholds.anrCount * 2 ? 'critical' : 'warning',
        title: 'ANRs Detectados en App Mobile',
        message: `${recentANRs.length} ANRs en la última hora (umbral: ${this.thresholds.anrCount})`,
        value: recentANRs.length,
        threshold: this.thresholds.anrCount,
        metadata: {
          anrs: recentANRs,
          period: '1 hour',
        },
      });
    }
  }

  /**
   * Limpiar métricas antiguas
   */
  _cleanOldMetrics(type) {
    const cutoff = Date.now() - this.windowSize;
    this.metrics[type] = this.metrics[type].filter(m => {
      return new Date(m.timestamp).getTime() > cutoff;
    });
  }

  /**
   * Obtener métricas actuales
   */
  getMetrics() {
    const recentWindow = Date.now() - this.windowSize;
    
    return {
      crashes: {
        total: this.metrics.crashes.length,
        recent: this.metrics.crashes.filter(c => new Date(c.timestamp).getTime() > recentWindow).length,
      },
      errors: {
        total: this.metrics.errors.length,
        recent: this.metrics.errors.filter(e => new Date(e.timestamp).getTime() > recentWindow).length,
      },
      latency: {
        total: this.metrics.latency.length,
        recent: this.metrics.latency.filter(l => new Date(l.timestamp).getTime() > recentWindow).length,
        p95: this._calculateP95(this.metrics.latency.filter(l => new Date(l.timestamp).getTime() > recentWindow)),
      },
      anr: {
        total: this.metrics.anr.length,
        recent: this.metrics.anr.filter(a => new Date(a.timestamp).getTime() > recentWindow).length,
      },
      sessions: {
        total: this.metrics.sessions.length,
        recent: this.metrics.sessions.filter(s => new Date(s.timestamp).getTime() > recentWindow).length,
      },
    };
  }

  /**
   * Calcular P95
   */
  _calculateP95(latencies) {
    if (latencies.length === 0) return 0;
    const sorted = latencies.map(l => l.milliseconds).sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    return sorted[p95Index] || 0;
  }

  /**
   * Configurar umbrales
   */
  setThresholds(thresholds) {
    this.thresholds = { ...this.thresholds, ...thresholds };
    logger.info('Umbrales de alerta mobile actualizados', { thresholds: this.thresholds });
  }
}

module.exports = MobileAlertService;

