/**
 * Tests para asociaciones pulsera-estudiante
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../index');
const PulseraAsociacion = require('../models/PulseraAsociacion');

describe('Pulseras Asociaciones API', () => {
  let testAsociacionId;
  let testPulseraId = '04:12:34:56:78:90:AB:CD';
  let testCodigoUniversitario = 'TEST001';

  beforeAll(async () => {
    // Limpiar asociaciones de prueba
    await PulseraAsociacion.deleteMany({
      pulsera_id: testPulseraId
    });
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await PulseraAsociacion.deleteMany({
      pulsera_id: testPulseraId
    });
  });

  describe('POST /api/pulseras-asociaciones', () => {
    test('debe crear nueva asociación exitosamente', async () => {
      const response = await request(app)
        .post('/api/pulseras-asociaciones')
        .send({
          pulsera_id: testPulseraId,
          codigo_universitario: testCodigoUniversitario,
          usuario: {
            _id: 'test-user',
            nombre: 'Test User'
          }
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.asociacion).toHaveProperty('_id');
      expect(response.body.asociacion.pulsera_id).toBe(testPulseraId);
      expect(response.body.asociacion.estado).toBe('activa');

      testAsociacionId = response.body.asociacion._id;
    });

    test('debe rechazar pulsera_id inválido', async () => {
      const response = await request(app)
        .post('/api/pulseras-asociaciones')
        .send({
          pulsera_id: 'INVALID',
          codigo_universitario: testCodigoUniversitario
        })
        .expect(400);

      expect(response.body.error).toContain('Formato de pulsera_id inválido');
    });

    test('debe rechazar asociación duplicada', async () => {
      const response = await request(app)
        .post('/api/pulseras-asociaciones')
        .send({
          pulsera_id: testPulseraId,
          codigo_universitario: testCodigoUniversitario
        })
        .expect(409);

      expect(response.body.error).toContain('ya está asociada');
    });

    test('debe manejar estudiante no encontrado', async () => {
      const response = await request(app)
        .post('/api/pulseras-asociaciones')
        .send({
          pulsera_id: 'FF:FF:FF:FF:FF:FF',
          codigo_universitario: 'NOEXISTE'
        })
        .expect(404);

      expect(response.body.error).toContain('Estudiante no encontrado');
    });
  });

  describe('GET /api/pulseras-asociaciones', () => {
    test('debe listar asociaciones', async () => {
      const response = await request(app)
        .get('/api/pulseras-asociaciones')
        .expect(200);

      expect(response.body).toHaveProperty('asociaciones');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.asociaciones)).toBe(true);
    });

    test('debe filtrar por estado', async () => {
      const response = await request(app)
        .get('/api/pulseras-asociaciones?estado=activa')
        .expect(200);

      response.body.asociaciones.forEach(a => {
        expect(a.estado).toBe('activa');
      });
    });
  });

  describe('GET /api/pulseras-asociaciones/pulsera/:pulsera_id', () => {
    test('debe obtener asociación por pulsera_id', async () => {
      const response = await request(app)
        .get(`/api/pulseras-asociaciones/pulsera/${testPulseraId}`)
        .expect(200);

      expect(response.body.asociacion.pulsera_id).toBe(testPulseraId);
    });

    test('debe manejar pulsera no encontrada', async () => {
      const response = await request(app)
        .get('/api/pulseras-asociaciones/pulsera/AA:BB:CC:DD')
        .expect(404);

      expect(response.body.error).toContain('no encontrada');
      expect(response.body).toHaveProperty('sugerencia');
    });
  });

  describe('POST /api/pulseras-asociaciones/verificar', () => {
    test('debe verificar pulsera activa', async () => {
      const response = await request(app)
        .post('/api/pulseras-asociaciones/verificar')
        .send({ pulsera_id: testPulseraId })
        .expect(200);

      expect(response.body.encontrado).toBe(true);
      expect(response.body.asociacion).toHaveProperty('estudiante');
    });

    test('debe manejar pulsera no encontrada', async () => {
      const response = await request(app)
        .post('/api/pulseras-asociaciones/verificar')
        .send({ pulsera_id: 'AA:BB:CC:DD' })
        .expect(404);

      expect(response.body.encontrado).toBe(false);
      expect(response.body).toHaveProperty('accion_recomendada');
    });
  });

  describe('PUT /api/pulseras-asociaciones/:id', () => {
    test('debe actualizar estado de asociación', async () => {
      if (!testAsociacionId) {
        return test.skip();
      }

      const response = await request(app)
        .put(`/api/pulseras-asociaciones/${testAsociacionId}`)
        .send({
          estado: 'inactiva',
          motivo: 'Prueba',
          usuario: {
            _id: 'test-user',
            nombre: 'Test User'
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.asociacion.estado).toBe('inactiva');
    });
  });

  describe('GET /api/pulseras-asociaciones/stats/general', () => {
    test('debe obtener estadísticas', async () => {
      const response = await request(app)
        .get('/api/pulseras-asociaciones/stats/general')
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('por_estado');
      expect(response.body.por_estado).toHaveProperty('activas');
    });
  });
});

