/**
 * Tests de Integración y Performance
 * 
 * Valida que los endpoints críticos funcionen correctamente
 * y mantengan tiempos de respuesta adecuados
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../../index');
const PerformanceBaselineService = require('../../services/performance_baseline_service');

describe('Integration Performance Tests', () => {
  let baselineService;
  let authToken;

  beforeAll(async () => {
    baselineService = new PerformanceBaselineService();

    // Crear usuario de prueba y obtener token si es necesario
    // (ajustar según sistema de autenticación)
  });

  describe('Flujo Completo: Búsqueda de Alumno y Validación', () => {
    test('debe completar flujo en < 500ms', async () => {
      const start = Date.now();

      // 1. Buscar alumno
      const alumnoResponse = await request(app)
        .get('/alumnos/TEST001')
        .expect(200);

      // 2. Verificar último acceso
      const ultimoAccesoResponse = await request(app)
        .get(`/asistencias/ultimo-acceso/${alumnoResponse.body.dni}`)
        .expect(200);

      // 3. Verificar si está en campus
      const enCampusResponse = await request(app)
        .get(`/asistencias/esta-en-campus/${alumnoResponse.body.dni}`)
        .expect(200);

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
      expect(alumnoResponse.body).toHaveProperty('codigo_universitario');
      expect(ultimoAccesoResponse.body).toHaveProperty('fecha_hora');
      expect(enCampusResponse.body).toHaveProperty('esta_dentro');
    });
  });

  describe('Carga Concurrente: Múltiples Búsquedas', () => {
    test('debe manejar 10 búsquedas concurrentes en < 2s', async () => {
      const start = Date.now();
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .get('/alumnos/TEST001')
            .expect(200)
        );
      }

      const responses = await Promise.all(promises);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000);
      expect(responses).toHaveLength(10);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Regresión Funcional: Validar Resultados Correctos', () => {
    test('GET /alumnos/:codigo debe retornar datos correctos', async () => {
      const response = await request(app)
        .get('/alumnos/TEST001')
        .expect(200);

      expect(response.body).toHaveProperty('codigo_universitario');
      expect(response.body).toHaveProperty('nombre');
      expect(response.body).toHaveProperty('apellido');
      expect(response.body).toHaveProperty('dni');
    });

    test('GET /asistencias/ultimo-acceso/:dni debe retornar estructura correcta', async () => {
      const response = await request(app)
        .get('/asistencias/ultimo-acceso/12345678')
        .expect(200);

      // Validar estructura de respuesta
      if (response.body.fecha_hora) {
        expect(new Date(response.body.fecha_hora)).toBeInstanceOf(Date);
      }
    });

    test('GET /asistencias/esta-en-campus/:dni debe retornar boolean', async () => {
      const response = await request(app)
        .get('/asistencias/esta-en-campus/12345678')
        .expect(200);

      expect(typeof response.body.esta_dentro).toBe('boolean');
    });
  });

  describe('Performance bajo Carga', () => {
    test('debe mantener tiempos de respuesta bajo carga leve', async () => {
      const iterations = 20;
      const durations = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await request(app)
          .get('/alumnos/TEST001')
          .expect(200);
        durations.push(Date.now() - start);
      }

      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const p95 = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)];

      expect(avg).toBeLessThan(300);
      expect(p95).toBeLessThan(500);
    });
  });
});

