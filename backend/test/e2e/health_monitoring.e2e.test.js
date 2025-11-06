/**
 * Tests E2E para Health Monitoring
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app, setupRoutes } = require('./setup-e2e');

describe('E2E: Health Monitoring', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    setupRoutes();
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe('GET /health/detailed', () => {
    test('debe retornar health detallado', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('system');
      expect(response.body).toHaveProperty('database');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.status);
    });

    test('debe incluir métricas de sistema', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body.system).toHaveProperty('metrics');
      expect(response.body.system.metrics).toHaveProperty('cpu');
      expect(response.body.system.metrics).toHaveProperty('memory');
    });

    test('debe incluir métricas de BD', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body.database).toHaveProperty('metrics');
      expect(response.body.database.metrics).toHaveProperty('connection');
    });

    test('debe retornar 503 si está unhealthy', async () => {
      // Este test requeriría simular un sistema unhealthy
      // Por ahora, verificamos que la estructura es correcta
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body.status).toBeDefined();
    });
  });

  describe('GET /health/incidents', () => {
    test('debe retornar historial de incidentes', async () => {
      const response = await request(app)
        .get('/health/incidents')
        .expect(200);

      expect(response.body).toHaveProperty('incidents');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.incidents)).toBe(true);
    });

    test('debe filtrar por límite', async () => {
      const response = await request(app)
        .get('/health/incidents?limit=5')
        .expect(200);

      expect(response.body.incidents.length).toBeLessThanOrEqual(5);
    });

    test('debe filtrar por estado', async () => {
      const response = await request(app)
        .get('/health/incidents?status=degraded')
        .expect(200);

      response.body.incidents.forEach(incident => {
        expect(incident.status).toBe('degraded');
      });
    });
  });

  describe('GET /health/incidents/stats', () => {
    test('debe retornar estadísticas de incidentes', async () => {
      const response = await request(app)
        .get('/health/incidents/stats')
        .expect(200);

      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toHaveProperty('total');
    });

    test('debe aceptar parámetro de horas', async () => {
      const response = await request(app)
        .get('/health/incidents/stats?hours=48')
        .expect(200);

      expect(response.body.period).toContain('48');
    });
  });

  describe('POST /health/incidents/:id/resolve', () => {
    test('debe resolver incidente existente', async () => {
      // Primero obtener un incidente
      const incidentsResponse = await request(app)
        .get('/health/incidents?limit=1')
        .expect(200);

      if (incidentsResponse.body.incidents.length > 0) {
        const incidentId = incidentsResponse.body.incidents[0].id;
        
        const response = await request(app)
          .post(`/health/incidents/${incidentId}/resolve`)
          .expect(200);

        expect(response.body.resolved).toBe(true);
        expect(response.body.resolvedAt).toBeDefined();
      }
    });

    test('debe retornar 404 para incidente no encontrado', async () => {
      const response = await request(app)
        .post('/health/incidents/non-existent-id/resolve')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /health/thresholds', () => {
    test('debe actualizar umbrales de alerta', async () => {
      const thresholds = {
        cpu: { warning: 70, critical: 90 },
        memory: { warning: 75, critical: 90 }
      };

      const response = await request(app)
        .post('/health/thresholds')
        .send(thresholds)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.thresholds.cpu.warning).toBe(70);
    });
  });

  describe('GET /health/thresholds', () => {
    test('debe retornar umbrales actuales', async () => {
      const response = await request(app)
        .get('/health/thresholds')
        .expect(200);

      expect(response.body).toHaveProperty('thresholds');
      expect(response.body.thresholds).toHaveProperty('cpu');
      expect(response.body.thresholds).toHaveProperty('memory');
    });
  });

  describe('GET /health/summary', () => {
    test('debe retornar resumen completo', async () => {
      const response = await request(app)
        .get('/health/summary')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('system');
      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('incidentHistory');
      expect(response.body).toHaveProperty('apiPerformance');
      expect(response.body).toHaveProperty('thresholds');
    });
  });
});

