/**
 * Servicio de Alertas Automáticas
 * 
 * Proporciona sistema de alertas configurables para problemas del sistema
 */

const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class AlertService {
  constructor() {
    this.alertChannels = [];
    this.alertHistory = [];
    this.maxHistory = 1000;
    this.cooldownPeriod = 5 * 60 * 1000; // 5 minutos entre alertas del mismo tipo
    this.lastAlerts = new Map(); // Para tracking de cooldown
  }

  /**
   * Registrar canal de alerta
   */
  registerChannel(channel) {
    this.alertChannels.push(channel);
    logger.info('Canal de alerta registrado', { type: channel.type });
  }

  /**
   * Enviar alerta
   */
  async sendAlert(alert) {
    const alertKey = `${alert.type}-${alert.severity}`;
    const lastAlert = this.lastAlerts.get(alertKey);
    const now = Date.now();

    // Verificar cooldown
    if (lastAlert && (now - lastAlert) < this.cooldownPeriod) {
      logger.debug('Alerta en cooldown, ignorando', { alertKey });
      return;
    }

    // Actualizar último tiempo de alerta
    this.lastAlerts.set(alertKey, now);

    // Registrar en historial
    const alertRecord = {
      id: uuidv4(),
      ...alert,
      timestamp: new Date().toISOString(),
      sent: false
    };

    this.alertHistory.unshift(alertRecord);
    if (this.alertHistory.length > this.maxHistory) {
      this.alertHistory = this.alertHistory.slice(0, this.maxHistory);
    }

    // Enviar a todos los canales registrados
    const results = await Promise.allSettled(
      this.alertChannels.map(channel => channel.send(alert))
    );

    // Actualizar estado de envío
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    alertRecord.sent = successCount > 0;
    alertRecord.channelsSent = successCount;
    alertRecord.channelsTotal = this.alertChannels.length;

    if (successCount > 0) {
      logger.info('Alerta enviada', {
        alertId: alertRecord.id,
        type: alert.type,
        severity: alert.severity,
        channelsSent: successCount
      });
    } else {
      logger.error('Error enviando alerta', null, {
        alertId: alertRecord.id,
        type: alert.type,
        errors: results.filter(r => r.status === 'rejected').map(r => r.reason)
      });
    }

    return alertRecord;
  }

  /**
   * Crear alerta de CPU alta
   */
  async alertHighCpu(cpuPercent, threshold) {
    return await this.sendAlert({
      type: 'cpu',
      severity: cpuPercent >= threshold.critical ? 'critical' : 'warning',
      title: 'Uso de CPU Alto',
      message: `El uso de CPU es ${cpuPercent.toFixed(2)}% (umbral: ${cpuPercent >= threshold.critical ? threshold.critical : threshold.warning}%)`,
      value: cpuPercent,
      threshold: cpuPercent >= threshold.critical ? threshold.critical : threshold.warning,
      metadata: {
        metric: 'cpu',
        unit: 'percent'
      }
    });
  }

  /**
   * Crear alerta de memoria alta
   */
  async alertHighMemory(memoryPercent, threshold) {
    return await this.sendAlert({
      type: 'memory',
      severity: memoryPercent >= threshold.critical ? 'critical' : 'warning',
      title: 'Uso de Memoria Alto',
      message: `El uso de memoria es ${memoryPercent.toFixed(2)}% (umbral: ${memoryPercent >= threshold.critical ? threshold.critical : threshold.warning}%)`,
      value: memoryPercent,
      threshold: memoryPercent >= threshold.critical ? threshold.critical : threshold.warning,
      metadata: {
        metric: 'memory',
        unit: 'percent'
      }
    });
  }

  /**
   * Crear alerta de BD desconectada
   */
  async alertDatabaseDisconnected() {
    return await this.sendAlert({
      type: 'database',
      severity: 'critical',
      title: 'Base de Datos Desconectada',
      message: 'La conexión a la base de datos se ha perdido',
      metadata: {
        metric: 'database_connection',
        state: 'disconnected'
      }
    });
  }

  /**
   * Crear alerta de queries lentas
   */
  async alertSlowQueries(count, threshold) {
    return await this.sendAlert({
      type: 'slowQueries',
      severity: count >= threshold.critical ? 'critical' : 'warning',
      title: 'Queries Lentas Detectadas',
      message: `${count} queries lentas detectadas en la última hora (umbral: ${count >= threshold.critical ? threshold.critical : threshold.warning})`,
      value: count,
      threshold: count >= threshold.critical ? threshold.critical : threshold.warning,
      metadata: {
        metric: 'slow_queries',
        unit: 'count'
      }
    });
  }

  /**
   * Obtener historial de alertas
   */
  getAlertHistory(limit = 50, filters = {}) {
    let filtered = [...this.alertHistory];

    if (filters.type) {
      filtered = filtered.filter(a => a.type === filters.type);
    }

    if (filters.severity) {
      filtered = filtered.filter(a => a.severity === filters.severity);
    }

    if (filters.since) {
      const sinceDate = new Date(filters.since);
      filtered = filtered.filter(a => new Date(a.timestamp) >= sinceDate);
    }

    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      alerts: filtered.slice(0, limit),
      total: filtered.length,
      filters
    };
  }

  /**
   * Limpiar historial antiguo
   */
  clearOldAlerts(olderThanHours = 24) {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - olderThanHours);

    this.alertHistory = this.alertHistory.filter(alert => {
      return new Date(alert.timestamp) > cutoff;
    });
  }
}

/**
 * Canal de alerta por log
 */
class LogAlertChannel {
  constructor() {
    this.type = 'log';
  }

  async send(alert) {
    const level = alert.severity === 'critical' ? 'error' : 'warn';
    logger[level](`ALERTA: ${alert.title}`, {
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      value: alert.value,
      threshold: alert.threshold
    });
    return true;
  }
}

/**
 * Canal de alerta por email (placeholder)
 */
class EmailAlertChannel {
  constructor(config = {}) {
    this.type = 'email';
    this.config = config;
  }

  async send(alert) {
    // Implementar envío de email
    // Por ahora, solo log
    logger.info('Email alert (not implemented)', {
      to: this.config.to,
      subject: alert.title,
      message: alert.message
    });
    return true;
  }
}

module.exports = {
  AlertService,
  LogAlertChannel,
  EmailAlertChannel
};

