/**
 * Servicio de Monitoreo de Salud del Sistema
 * 
 * Integra métricas de sistema y BD, alertas y historial de incidentes
 */

const SystemMetricsService = require('./system_metrics_service');
const DatabaseMetricsService = require('./database_metrics_service');
const { AlertService, LogAlertChannel } = require('./alert_service');
const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class HealthMonitoringService {
  constructor() {
    this.systemMetrics = new SystemMetricsService();
    this.dbMetrics = new DatabaseMetricsService();
    this.alertService = new AlertService();
    this.incidents = [];
    this.maxIncidents = 1000;
    this.alertThresholds = {
      cpu: { warning: 80, critical: 95 },
      memory: { warning: 80, critical: 95 },
      heap: { warning: 80, critical: 95 },
      dbConnections: { warning: 50, critical: 100 },
      slowQueries: { warning: 5, critical: 20 }
    };

    // Registrar canal de log por defecto
    this.alertService.registerChannel(new LogAlertChannel());
  }

  /**
   * Obtener métricas detalladas del sistema
   */
  async getDetailedHealth() {
    try {
      const [systemHealth, dbHealth] = await Promise.all([
        this.systemMetrics.checkHealth(this.alertThresholds),
        this.dbMetrics.checkHealth(this.alertThresholds)
      ]);

      // Determinar estado general
      let overallStatus = 'healthy';
      if (systemHealth.status === 'unhealthy' || dbHealth.status === 'unhealthy') {
        overallStatus = 'unhealthy';
      } else if (systemHealth.status === 'degraded' || dbHealth.status === 'degraded') {
        overallStatus = 'degraded';
      }

      // Combinar issues
      const allIssues = [
        ...systemHealth.issues.map(i => ({ ...i, source: 'system' })),
        ...dbHealth.issues.map(i => ({ ...i, source: 'database' }))
      ];

    // Registrar incidentes y enviar alertas si hay problemas
    if (allIssues.length > 0) {
      this.recordIncident(overallStatus, allIssues);
      await this.sendAlertsForIssues(allIssues, systemHealth, dbHealth);
    }

      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        system: {
          status: systemHealth.status,
          metrics: systemHealth.metrics,
          issues: systemHealth.issues
        },
        database: {
          status: dbHealth.status,
          metrics: dbHealth.metrics,
          issues: dbHealth.issues
        },
        issues: allIssues,
        summary: {
          totalIssues: allIssues.length,
          criticalIssues: allIssues.filter(i => i.severity === 'critical').length,
          warnings: allIssues.filter(i => i.severity === 'warning').length
        }
      };
    } catch (error) {
      logger.error('Error obteniendo health detallado', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Registrar incidente
   */
  recordIncident(status, issues) {
    const incident = {
      id: uuidv4(),
      status,
      issues,
      timestamp: new Date().toISOString(),
      resolved: false
    };

    this.incidents.unshift(incident);

    // Mantener solo los últimos N incidentes
    if (this.incidents.length > this.maxIncidents) {
      this.incidents = this.incidents.slice(0, this.maxIncidents);
    }

    // Log del incidente
    if (status === 'unhealthy') {
      logger.error('Health check: System unhealthy', null, {
        incidentId: incident.id,
        issues: issues.map(i => i.message)
      });
    } else if (status === 'degraded') {
      logger.warn('Health check: System degraded', {
        incidentId: incident.id,
        issues: issues.map(i => i.message)
      });
    }

    return incident;
  }

  /**
   * Obtener historial de incidentes
   */
  getIncidentHistory(limit = 50, filters = {}) {
    let filtered = [...this.incidents];

    // Filtrar por estado
    if (filters.status) {
      filtered = filtered.filter(i => i.status === filters.status);
    }

    // Filtrar por resuelto
    if (filters.resolved !== undefined) {
      filtered = filtered.filter(i => i.resolved === filters.resolved);
    }

    // Filtrar por fecha
    if (filters.since) {
      const sinceDate = new Date(filters.since);
      filtered = filtered.filter(i => new Date(i.timestamp) >= sinceDate);
    }

    // Ordenar por timestamp (más recientes primero)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      incidents: filtered.slice(0, limit),
      total: filtered.length,
      filters
    };
  }

  /**
   * Marcar incidente como resuelto
   */
  resolveIncident(incidentId) {
    const incident = this.incidents.find(i => i.id === incidentId);
    if (incident) {
      incident.resolved = true;
      incident.resolvedAt = new Date().toISOString();
      logger.info('Incidente resuelto', { incidentId });
      return incident;
    }
    return null;
  }

  /**
   * Obtener estadísticas de incidentes
   */
  getIncidentStats(sinceHours = 24) {
    const since = new Date();
    since.setHours(since.getHours() - sinceHours);

    const recentIncidents = this.incidents.filter(
      i => new Date(i.timestamp) >= since
    );

    const stats = {
      total: recentIncidents.length,
      byStatus: {
        healthy: 0,
        degraded: 0,
        unhealthy: 0
      },
      bySeverity: {
        critical: 0,
        warning: 0
      },
      resolved: recentIncidents.filter(i => i.resolved).length,
      unresolved: recentIncidents.filter(i => !i.resolved).length
    };

    recentIncidents.forEach(incident => {
      stats.byStatus[incident.status] = (stats.byStatus[incident.status] || 0) + 1;
      incident.issues.forEach(issue => {
        if (issue.severity === 'critical' || issue.severity === 'warning') {
          stats.bySeverity[issue.severity] = (stats.bySeverity[issue.severity] || 0) + 1;
        }
      });
    });

    return {
      period: `${sinceHours} hours`,
      since: since.toISOString(),
      stats
    };
  }

  /**
   * Configurar umbrales de alerta
   */
  setAlertThresholds(thresholds) {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
    logger.info('Umbrales de alerta actualizados', { thresholds: this.alertThresholds });
  }

  /**
   * Obtener umbrales de alerta actuales
   */
  getAlertThresholds() {
    return { ...this.alertThresholds };
  }

  /**
   * Obtener métricas de performance de API
   */
  getApiPerformanceMetrics() {
    // Esto se puede integrar con el logger HTTP para obtener métricas reales
    // Por ahora, retornamos estructura básica
    return {
      requests: {
        total: 0, // Se actualizará con middleware
        perMinute: 0,
        averageResponseTime: 0,
        p95: 0,
        p99: 0
      },
      errors: {
        total: 0,
        rate: 0,
        byType: {}
      },
      endpoints: {
        // Se puede expandir con métricas por endpoint
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Enviar alertas para issues detectados
   */
  async sendAlertsForIssues(issues, systemHealth, dbHealth) {
    for (const issue of issues) {
      try {
        if (issue.source === 'system') {
          if (issue.type === 'cpu') {
            const cpuPercent = systemHealth.metrics?.cpu?.process?.usage || 0;
            await this.alertService.alertHighCpu(cpuPercent, this.alertThresholds.cpu);
          } else if (issue.type === 'memory' || issue.type === 'heap') {
            const memPercent = issue.type === 'memory' 
              ? systemHealth.metrics?.memory?.system?.usagePercent || 0
              : systemHealth.metrics?.memory?.process?.heapUsagePercent || 0;
            const threshold = issue.type === 'memory' 
              ? this.alertThresholds.memory 
              : this.alertThresholds.heap;
            await this.alertService.alertHighMemory(memPercent, threshold);
          }
        } else if (issue.source === 'database') {
          if (issue.type === 'connection' && !dbHealth.metrics?.connection?.isConnected) {
            await this.alertService.alertDatabaseDisconnected();
          } else if (issue.type === 'slowQueries') {
            const slowCount = issue.value || 0;
            await this.alertService.alertSlowQueries(slowCount, this.alertThresholds.slowQueries);
          }
        }
      } catch (error) {
        logger.error('Error enviando alerta', error, { issueType: issue.type });
      }
    }
  }

  /**
   * Obtener historial de alertas
   */
  getAlertHistory(limit = 50, filters = {}) {
    return this.alertService.getAlertHistory(limit, filters);
  }

  /**
   * Obtener resumen completo de salud
   */
  async getHealthSummary() {
    const detailed = await this.getDetailedHealth();
    const incidentStats = this.getIncidentStats(24);
    const apiMetrics = this.getApiPerformanceMetrics();
    const alertHistory = this.getAlertHistory(20);

    return {
      ...detailed,
      incidentHistory: incidentStats,
      apiPerformance: apiMetrics,
      alertHistory,
      thresholds: this.getAlertThresholds()
    };
  }
}

module.exports = HealthMonitoringService;

