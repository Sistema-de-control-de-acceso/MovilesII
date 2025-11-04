const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Asistencia = require('../../models/Asistencia');
const { app, setupRoutes } = require('./setup-e2e');
const { mockAsistencia } = require('../utils/mocks');

describe('E2E: Dashboard y Métricas', () => {
  let mongoServer;

  beforeAll(async () => {
    // Configurar MongoDB en memoria
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Inicializar rutas
    setupRoutes();
  });

  beforeEach(async () => {
    await Asistencia.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe('GET /dashboard/metrics', () => {
    it('debe retornar métricas del dashboard', async () => {
      // Crear datos de prueba
      const hoy = new Date();
      const asistencia1 = mockAsistencia({
        fecha_hora: new Date(hoy.setHours(10, 0, 0)),
        tipo: 'entrada',
      });
      const asistencia2 = mockAsistencia({
        fecha_hora: new Date(hoy.setHours(11, 0, 0)),
        tipo: 'salida',
        dni: '87654321',
      });
      await Asistencia.create([asistencia1, asistencia2]);

      const response = await request(app)
        .get('/dashboard/metrics')
        .expect(200);

      // Validar estructura de respuesta
      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('metrics');
      expect(response.body).toHaveProperty('hourlyData');
      expect(response.body).toHaveProperty('entranceExitData');
      expect(response.body).toHaveProperty('weeklyData');
      expect(response.body).toHaveProperty('facultiesData');
      expect(response.body).toHaveProperty('timestamp');

      // Validar estructura de métricas
      expect(response.body.metrics).toHaveProperty('total');
      expect(response.body.metrics).toHaveProperty('today');
      expect(typeof response.body.metrics.total).toBe('number');

      // Validar estructura de entrada/salida
      expect(response.body.entranceExitData).toHaveProperty('entrances');
      expect(response.body.entranceExitData).toHaveProperty('exits');
      expect(typeof response.body.entranceExitData.entrances).toBe('number');
      expect(typeof response.body.entranceExitData.exits).toBe('number');
    });

    it('debe soportar diferentes periodos de tiempo', async () => {
      const periods = ['24h', '7d', '30d'];

      for (const period of periods) {
        const response = await request(app)
          .get(`/dashboard/metrics?period=${period}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body).toHaveProperty('hourlyData');
      }
    });

    it('debe retornar estructura válida incluso sin datos', async () => {
      const response = await request(app)
        .get('/dashboard/metrics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.metrics.total).toBe(0);
      expect(response.body.entranceExitData.entrances).toBe(0);
      expect(response.body.entranceExitData.exits).toBe(0);
    });
  });

  describe('GET /dashboard/recent-access', () => {
    it('debe retornar accesos recientes', async () => {
      // Crear múltiples asistencias
      const asistencias = [];
      for (let i = 0; i < 5; i++) {
        asistencias.push(mockAsistencia({
          dni: `1234567${i}`,
          fecha_hora: new Date(Date.now() - i * 60000), // Diferentes tiempos
        }));
      }
      await Asistencia.create(asistencias);

      const response = await request(app)
        .get('/dashboard/recent-access')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('access');
      expect(Array.isArray(response.body.access)).toBe(true);
      expect(response.body.access.length).toBeGreaterThan(0);

      // Validar estructura de cada acceso
      if (response.body.access.length > 0) {
        const access = response.body.access[0];
        expect(access).toHaveProperty('_id');
        expect(access).toHaveProperty('fecha_hora');
        expect(access).toHaveProperty('tipo');
      }
    });

    it('debe retornar lista vacía cuando no hay accesos', async () => {
      const response = await request(app)
        .get('/dashboard/recent-access')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.access)).toBe(true);
      expect(response.body.access.length).toBe(0);
    });

    it('debe limitar resultados a 20 por defecto', async () => {
      // Crear más de 20 asistencias
      const asistencias = [];
      for (let i = 0; i < 25; i++) {
        asistencias.push(mockAsistencia({
          dni: `1234567${i}`,
          fecha_hora: new Date(Date.now() - i * 60000),
        }));
      }
      await Asistencia.create(asistencias);

      const response = await request(app)
        .get('/dashboard/recent-access')
        .expect(200);

      expect(response.body.access.length).toBeLessThanOrEqual(20);
    });
  });

  describe('GET /ml/dashboard', () => {
    it('debe retornar dashboard ML completo', async () => {
      const response = await request(app)
        .get('/ml/dashboard')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('dashboard');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('debe soportar parámetros de fecha', async () => {
      const response = await request(app)
        .get('/ml/dashboard?days=7&evolutionDays=30')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});

