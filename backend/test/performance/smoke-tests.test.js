/**
 * Smoke Tests de Performance
 * 
 * Tests rápidos para validar que endpoints críticos responden
 * en tiempos razonables sin regresiones funcionales
 */

const request = require('supertest');
const { app } = require('../../index');

describe('Smoke Tests - Endpoints Críticos', () => {
  const MAX_RESPONSE_TIME = 500; // ms

  describe('Endpoints de Autenticación', () => {
    test('POST /login debe responder en tiempo razonable', async () => {
      const start = Date.now();
      const response = await request(app)
        .post('/login')
        .send({ email: 'test@example.com', password: 'wrong' })
        .expect(401);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(MAX_RESPONSE_TIME);
    });
  });

  describe('Endpoints de Alumnos', () => {
    test('GET /alumnos debe responder en tiempo razonable', async () => {
      const start = Date.now();
      const response = await request(app)
        .get('/alumnos')
        .expect(200);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(MAX_RESPONSE_TIME);
    });

    test('GET /alumnos/:codigo debe responder en tiempo razonable', async () => {
      const start = Date.now();
      const response = await request(app)
        .get('/alumnos/INVALID')
        .expect(404);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(MAX_RESPONSE_TIME);
    });
  });

  describe('Endpoints de Asistencias', () => {
    test('GET /asistencias debe responder en tiempo razonable', async () => {
      const start = Date.now();
      const response = await request(app)
        .get('/asistencias')
        .expect(200);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(MAX_RESPONSE_TIME);
    });

    test('GET /asistencias/ultimo-acceso/:dni debe responder en tiempo razonable', async () => {
      const start = Date.now();
      const response = await request(app)
        .get('/asistencias/ultimo-acceso/00000000')
        .expect(200);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(MAX_RESPONSE_TIME);
    });

    test('GET /asistencias/esta-en-campus/:dni debe responder en tiempo razonable', async () => {
      const start = Date.now();
      const response = await request(app)
        .get('/asistencias/esta-en-campus/00000000')
        .expect(200);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(MAX_RESPONSE_TIME);
    });
  });

  describe('Endpoints de Dashboard', () => {
    test('GET /dashboard/metrics debe responder en tiempo razonable', async () => {
      const start = Date.now();
      const response = await request(app)
        .get('/dashboard/metrics')
        .expect(200);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(MAX_RESPONSE_TIME * 2); // Dashboard puede ser más lento
    });
  });
});

