/**
 * Tests para Health Monitoring Service
 */

const HealthMonitoringService = require('../../services/health_monitoring_service');
const SystemMetricsService = require('../../services/system_metrics_service');
const DatabaseMetricsService = require('../../services/database_metrics_service');

describe('Health Monitoring Service', () => {
  let healthService;

  beforeEach(() => {
    healthService = new HealthMonitoringService();
  });

  describe('getDetailedHealth', () => {
    test('debe retornar objeto con status y métricas', async () => {
      const health = await healthService.getDetailedHealth();
      
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('timestamp');
      expect(health).toHaveProperty('system');
      expect(health).toHaveProperty('database');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
    });

    test('debe incluir métricas de sistema', async () => {
      const health = await healthService.getDetailedHealth();
      
      expect(health.system).toHaveProperty('status');
      expect(health.system).toHaveProperty('metrics');
      expect(health.system.metrics).toHaveProperty('cpu');
      expect(health.system.metrics).toHaveProperty('memory');
    });

    test('debe incluir métricas de base de datos', async () => {
      const health = await healthService.getDetailedHealth();
      
      expect(health.database).toHaveProperty('status');
      expect(health.database).toHaveProperty('metrics');
      expect(health.database.metrics).toHaveProperty('connection');
    });
  });

  describe('Incident Management', () => {
    test('debe registrar incidentes cuando hay problemas', async () => {
      // Simular problema configurando umbrales muy bajos
      healthService.setAlertThresholds({
        cpu: { warning: 0, critical: 0 },
        memory: { warning: 0, critical: 0 }
      });

      const health = await healthService.getDetailedHealth();
      
      // Debe haber registrado incidente si hay issues
      if (health.issues && health.issues.length > 0) {
        const history = healthService.getIncidentHistory(10);
        expect(history.incidents.length).toBeGreaterThan(0);
      }
    });

    test('debe retornar historial de incidentes', () => {
      const history = healthService.getIncidentHistory(10);
      
      expect(history).toHaveProperty('incidents');
      expect(history).toHaveProperty('total');
      expect(Array.isArray(history.incidents)).toBe(true);
    });

    test('debe filtrar incidentes por estado', () => {
      const history = healthService.getIncidentHistory(10, { status: 'degraded' });
      
      history.incidents.forEach(incident => {
        expect(incident.status).toBe('degraded');
      });
    });

    test('debe resolver incidentes', () => {
      // Crear un incidente de prueba
      const incident = healthService.recordIncident('degraded', [
        { type: 'cpu', severity: 'warning', message: 'Test' }
      ]);

      const resolved = healthService.resolveIncident(incident.id);
      
      expect(resolved).toBeDefined();
      expect(resolved.resolved).toBe(true);
      expect(resolved.resolvedAt).toBeDefined();
    });
  });

  describe('Alert Thresholds', () => {
    test('debe configurar umbrales de alerta', () => {
      const thresholds = {
        cpu: { warning: 70, critical: 90 },
        memory: { warning: 75, critical: 90 }
      };

      healthService.setAlertThresholds(thresholds);
      const current = healthService.getAlertThresholds();

      expect(current.cpu.warning).toBe(70);
      expect(current.cpu.critical).toBe(90);
    });

    test('debe retornar umbrales actuales', () => {
      const thresholds = healthService.getAlertThresholds();
      
      expect(thresholds).toHaveProperty('cpu');
      expect(thresholds).toHaveProperty('memory');
      expect(thresholds).toHaveProperty('heap');
    });
  });

  describe('Incident Statistics', () => {
    test('debe calcular estadísticas de incidentes', () => {
      const stats = healthService.getIncidentStats(24);
      
      expect(stats).toHaveProperty('period');
      expect(stats).toHaveProperty('stats');
      expect(stats.stats).toHaveProperty('total');
      expect(stats.stats).toHaveProperty('byStatus');
      expect(stats.stats).toHaveProperty('bySeverity');
    });
  });
});

describe('System Metrics Service', () => {
  let systemMetrics;

  beforeEach(() => {
    systemMetrics = new SystemMetricsService();
  });

  test('debe obtener métricas de CPU', () => {
    const cpu = systemMetrics.getCpuMetrics();
    
    expect(cpu).toHaveProperty('process');
    expect(cpu).toHaveProperty('system');
    expect(cpu.process).toHaveProperty('usage');
    expect(cpu.system).toHaveProperty('cores');
  });

  test('debe obtener métricas de memoria', () => {
    const memory = systemMetrics.getMemoryMetrics();
    
    expect(memory).toHaveProperty('system');
    expect(memory).toHaveProperty('process');
    expect(memory.system).toHaveProperty('total');
    expect(memory.process).toHaveProperty('heapUsed');
  });

  test('debe obtener todas las métricas', async () => {
    const metrics = await systemMetrics.getAllMetrics();
    
    expect(metrics).toHaveProperty('cpu');
    expect(metrics).toHaveProperty('memory');
    expect(metrics).toHaveProperty('disk');
    expect(metrics).toHaveProperty('process');
  });

  test('debe verificar salud del sistema', async () => {
    const health = await systemMetrics.checkHealth();
    
    expect(health).toHaveProperty('status');
    expect(health).toHaveProperty('metrics');
    expect(health).toHaveProperty('issues');
  });
});

describe('Database Metrics Service', () => {
  let dbMetrics;

  beforeEach(() => {
    dbMetrics = new DatabaseMetricsService();
  });

  test('debe obtener estado de conexión', () => {
    const status = dbMetrics.getConnectionStatus();
    
    expect(status).toHaveProperty('state');
    expect(status).toHaveProperty('stateName');
    expect(status).toHaveProperty('isConnected');
  });

  test('debe registrar queries lentas', () => {
    dbMetrics.recordSlowQuery('SELECT * FROM users', 1500);
    
    const slowQueries = dbMetrics.getSlowQueries();
    expect(slowQueries.queries.length).toBeGreaterThan(0);
    expect(slowQueries.queries[0].duration).toBe(1500);
  });

  test('debe obtener todas las métricas de BD', async () => {
    const metrics = await dbMetrics.getAllMetrics();
    
    expect(metrics).toHaveProperty('connection');
    expect(metrics).toHaveProperty('stats');
    expect(metrics).toHaveProperty('collections');
    expect(metrics).toHaveProperty('slowQueries');
  });
});

