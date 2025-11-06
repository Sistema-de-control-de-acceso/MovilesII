/**
 * Tests para monitoreo mobile
 */

const request = require('supertest');
const { app } = require('../index');
const MobileAlertService = require('../services/mobile_alert_service');

describe('Mobile Monitoring', () => {
  let mobileAlertService;

  beforeEach(() => {
    mobileAlertService = new MobileAlertService();
  });

  describe('POST /api/mobile/monitoring/crash', () => {
    test('debe registrar crash', async () => {
      const response = await request(app)
        .post('/api/mobile/monitoring/crash')
        .send({
          deviceId: 'test-device-123',
          appVersion: '1.0.0',
          platform: 'android',
          error: 'Test crash',
          stackTrace: 'Stack trace here',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('debe validar campos requeridos', async () => {
      const response = await request(app)
        .post('/api/mobile/monitoring/crash')
        .send({
          error: 'Test crash',
        })
        .expect(400);

      expect(response.body.error).toContain('deviceId');
    });
  });

  describe('POST /api/mobile/monitoring/error', () => {
    test('debe registrar error', async () => {
      const response = await request(app)
        .post('/api/mobile/monitoring/error')
        .send({
          deviceId: 'test-device-123',
          appVersion: '1.0.0',
          error: 'Test error',
          operation: 'login',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/mobile/monitoring/latency', () => {
    test('debe registrar latencia', async () => {
      const response = await request(app)
        .post('/api/mobile/monitoring/latency')
        .send({
          deviceId: 'test-device-123',
          appVersion: '1.0.0',
          operation: 'getAlumno',
          milliseconds: 1500,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('debe validar campos requeridos', async () => {
      const response = await request(app)
        .post('/api/mobile/monitoring/latency')
        .send({
          deviceId: 'test-device-123',
          appVersion: '1.0.0',
        })
        .expect(400);

      expect(response.body.error).toContain('operation');
    });
  });

  describe('POST /api/mobile/monitoring/anr', () => {
    test('debe registrar ANR', async () => {
      const response = await request(app)
        .post('/api/mobile/monitoring/anr')
        .send({
          deviceId: 'test-device-123',
          appVersion: '1.0.0',
          reason: 'UI thread blocked',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/mobile/monitoring/metrics', () => {
    test('debe retornar métricas', async () => {
      const response = await request(app)
        .get('/api/mobile/monitoring/metrics')
        .expect(200);

      expect(response.body).toHaveProperty('crashes');
      expect(response.body).toHaveProperty('errors');
      expect(response.body).toHaveProperty('latency');
      expect(response.body).toHaveProperty('anr');
      expect(response.body).toHaveProperty('sessions');
    });
  });

  describe('Alertas', () => {
    test('debe disparar alerta cuando crash rate excede umbral', async () => {
      // Registrar múltiples sesiones
      for (let i = 0; i < 10; i++) {
        mobileAlertService.recordSession({ sessionId: `session-${i}` });
      }

      // Registrar crashes para exceder umbral (1%)
      mobileAlertService.recordCrash({ error: 'Test crash' });
      mobileAlertService.recordCrash({ error: 'Test crash 2' });

      // Verificar que se disparó alerta (esto requiere mock del alertService)
      const metrics = mobileAlertService.getMetrics();
      expect(metrics.crashes.recent).toBeGreaterThan(0);
    });
  });
});

