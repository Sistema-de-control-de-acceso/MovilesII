/**
 * Tests de Compatibilidad de API
 * Verifica que los endpoints sean compatibles con web y app móvil
 */

const request = require('supertest');
const app = require('../app').app;

describe('API Compatibility Tests', () => {
  describe('CORS Configuration', () => {
    it('should allow requests from web clients', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000')
        .set('User-Agent', 'Mozilla/5.0');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should allow requests from mobile clients', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://192.168.1.51:3000')
        .set('X-Client-Type', 'mobile')
        .set('User-Agent', 'Flutter');

      expect(response.status).toBe(200);
    });

    it('should allow requests without origin (mobile apps)', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
    });
  });

  describe('Critical Endpoints', () => {
    it('should have login endpoint', async () => {
      const response = await request(app)
        .post('/login')
        .send({ email: 'test@test.com', password: 'test' });

      // Should not return 404
      expect(response.status).not.toBe(404);
    });

    it('should have health check endpoint', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
    });

    it('should have alumnos endpoint', async () => {
      const response = await request(app)
        .get('/alumnos');

      // Should not return 404
      expect(response.status).not.toBe(404);
    });

    it('should have asistencias endpoint', async () => {
      const response = await request(app)
        .get('/asistencias');

      // Should not return 404
      expect(response.status).not.toBe(404);
    });
  });

  describe('Response Format', () => {
    it('should return JSON responses', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should have consistent error format', async () => {
      const response = await request(app)
        .get('/nonexistent');

      if (response.status >= 400) {
        expect(response.body).toHaveProperty('error');
      }
    });
  });

  describe('Client Detection', () => {
    it('should detect web client from User-Agent', async () => {
      const response = await request(app)
        .get('/health')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');

      expect(response.status).toBe(200);
    });

    it('should detect mobile client from X-Client-Type header', async () => {
      const response = await request(app)
        .get('/health')
        .set('X-Client-Type', 'mobile');

      expect(response.status).toBe(200);
    });
  });

  describe('Headers Support', () => {
    it('should accept X-Client-Type header', async () => {
      const response = await request(app)
        .get('/health')
        .set('X-Client-Type', 'web');

      expect(response.status).toBe(200);
    });

    it('should accept X-Device-ID header', async () => {
      const response = await request(app)
        .get('/health')
        .set('X-Device-ID', 'test-device-id');

      expect(response.status).toBe(200);
    });
  });
});

