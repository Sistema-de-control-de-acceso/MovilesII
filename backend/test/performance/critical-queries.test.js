/**
 * Tests de Performance para Consultas Críticas
 * 
 * Valida que las consultas críticas tengan tiempos de respuesta adecuados
 * y que no se introduzcan regresiones funcionales
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../../index');
const PerformanceBaselineService = require('../../services/performance_baseline_service');
const Asistencia = require('../../models/Asistencia');
const Presencia = require('../../models/Presencia');
const User = mongoose.model('usuarios');
const Alumno = mongoose.model('alumnos');

describe('Performance - Consultas Críticas', () => {
  let baselineService;
  let testUser;
  let testAlumno;
  let testAsistencia;
  let testPresencia;

  beforeAll(async () => {
    baselineService = new PerformanceBaselineService();

    // Crear datos de prueba
    testUser = new User({
      _id: 'test-user-perf',
      email: 'test-perf@example.com',
      password: 'hashedpassword',
      estado: 'activo',
      rango: 'guardia',
    });
    await testUser.save();

    testAlumno = new Alumno({
      _id: 'test-alumno-perf',
      codigo_universitario: 'TEST001',
      dni: '12345678',
      nombre: 'Test',
      apellido: 'Performance',
      estado: true,
    });
    await testAlumno.save();

    testAsistencia = new Asistencia({
      _id: 'test-asistencia-perf',
      dni: '12345678',
      codigo_universitario: 'TEST001',
      fecha_hora: new Date(),
      tipo: 'entrada',
    });
    await testAsistencia.save();

    testPresencia = new Presencia({
      _id: 'test-presencia-perf',
      estudiante_dni: '12345678',
      esta_dentro: true,
      hora_entrada: new Date(),
    });
    await testPresencia.save();
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    if (testUser) await User.deleteOne({ _id: testUser._id });
    if (testAlumno) await Alumno.deleteOne({ _id: testAlumno._id });
    if (testAsistencia) await Asistencia.deleteOne({ _id: testAsistencia._id });
    if (testPresencia) await Presencia.deleteOne({ _id: testPresencia._id });
  });

  describe('Query 1: Login (User.findOne)', () => {
    test('debe tener tiempo de respuesta < 200ms (P95)', async () => {
      const result = await baselineService.measureQuery(
        'login_query',
        async () => {
          return await User.findOne({ email: 'test-perf@example.com', estado: 'activo' });
        },
        { iterations: 10 }
      );

      expect(result.measurement.stats.p95).toBeLessThan(200);
      expect(result.measurement.successful).toBeGreaterThan(0);
    });
  });

  describe('Query 2: Buscar Alumno por Código', () => {
    test('debe tener tiempo de respuesta < 200ms (P95)', async () => {
      const result = await baselineService.measureQuery(
        'alumno_by_codigo',
        async () => {
          return await Alumno.findOne({ codigo_universitario: 'TEST001' });
        },
        { iterations: 10 }
      );

      expect(result.measurement.stats.p95).toBeLessThan(200);
      expect(result.measurement.successful).toBeGreaterThan(0);
    });

    test('debe retornar resultado correcto', async () => {
      const alumno = await Alumno.findOne({ codigo_universitario: 'TEST001' });
      expect(alumno).toBeTruthy();
      expect(alumno.codigo_universitario).toBe('TEST001');
    });
  });

  describe('Query 3: Última Asistencia por DNI', () => {
    test('debe tener tiempo de respuesta < 200ms (P95)', async () => {
      const result = await baselineService.measureQuery(
        'ultima_asistencia',
        async () => {
          return await Asistencia.findOne({ dni: '12345678' })
            .sort({ fecha_hora: -1 })
            .lean();
        },
        { iterations: 10 }
      );

      expect(result.measurement.stats.p95).toBeLessThan(200);
      expect(result.measurement.successful).toBeGreaterThan(0);
    });
  });

  describe('Query 4: Presencia Activa por DNI', () => {
    test('debe tener tiempo de respuesta < 200ms (P95)', async () => {
      const result = await baselineService.measureQuery(
        'presencia_activa',
        async () => {
          return await Presencia.findOne({ estudiante_dni: '12345678', esta_dentro: true });
        },
        { iterations: 10 }
      );

      expect(result.measurement.stats.p95).toBeLessThan(200);
      expect(result.measurement.successful).toBeGreaterThan(0);
    });
  });

  describe('Query 5: Asistencias por Fecha', () => {
    test('debe tener tiempo de respuesta < 500ms (P95)', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await baselineService.measureQuery(
        'asistencias_por_fecha',
        async () => {
          return await Asistencia.find({ fecha_hora: { $gte: today } })
            .sort({ fecha_hora: -1 })
            .limit(100)
            .lean();
        },
        { iterations: 5 }
      );

      expect(result.measurement.stats.p95).toBeLessThan(500);
      expect(result.measurement.successful).toBeGreaterThan(0);
    });
  });

  describe('Endpoints HTTP - Performance', () => {
    test('GET /alumnos/:codigo debe responder < 300ms', async () => {
      const start = Date.now();
      const response = await request(app)
        .get('/alumnos/TEST001')
        .expect(200);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(300);
      expect(response.body.codigo_universitario).toBe('TEST001');
    });

    test('GET /asistencias/ultimo-acceso/:dni debe responder < 300ms', async () => {
      const start = Date.now();
      const response = await request(app)
        .get('/asistencias/ultimo-acceso/12345678')
        .expect(200);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(300);
    });

    test('GET /asistencias/esta-en-campus/:dni debe responder < 300ms', async () => {
      const start = Date.now();
      const response = await request(app)
        .get('/asistencias/esta-en-campus/12345678')
        .expect(200);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(300);
    });
  });

  describe('Comparación con Baseline', () => {
    test('debe crear baseline y comparar mejoras', async () => {
      // Crear baseline
      const baseline = await baselineService.createBaseline(
        'alumno_by_codigo_baseline',
        async () => {
          return await Alumno.findOne({ codigo_universitario: 'TEST001' });
        },
        { iterations: 10, description: 'Baseline para búsqueda de alumno' }
      );

      expect(baseline.stats.avg).toBeGreaterThan(0);
      expect(baseline.stats.p95).toBeGreaterThan(0);

      // Medir después de optimizaciones
      const result = await baselineService.measureQuery(
        'alumno_by_codigo_baseline',
        async () => {
          return await Alumno.findOne({ codigo_universitario: 'TEST001' });
        },
        { iterations: 10 }
      );

      expect(result.comparison).toBeTruthy();
      if (result.comparison) {
        // Verificar que no hay regresión (tiempo actual no debe ser mucho peor)
        const regressionThreshold = 1.5; // 50% más lento es regresión
        expect(result.measurement.stats.avg).toBeLessThan(baseline.stats.avg * regressionThreshold);
      }
    });
  });
});

