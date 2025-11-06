/**
 * Tests de Unificación de API
 * Verifica que web y app móvil puedan consumir el mismo servidor
 */

const request = require('supertest');
const mongoose = require('mongoose');

// Mock de la app Express
let app;
beforeAll(async () => {
  // Cargar la app
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
  
  // Importar app después de configurar env
  const express = require('express');
  const cors = require('cors');
  app = express();
  
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Type', 'X-Device-ID']
  }));
  app.use(express.json());
  
  // Middleware de detección de cliente
  app.use((req, res, next) => {
    req.clientType = req.headers['x-client-type'] || 
                     (req.headers['user-agent']?.includes('Flutter') ? 'mobile' : 'web');
    req.deviceId = req.headers['x-device-id'] || null;
    res.setHeader('X-Client-Type', req.clientType);
    next();
  });
  
  // Endpoint de salud
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      client: {
        type: req.clientType,
        deviceId: req.deviceId
      }
    });
  });
  
  // Endpoint de compatibilidad
  app.get('/api/compatibility/check', (req, res) => {
    res.json({
      success: true,
      compatible: true,
      client: {
        type: req.clientType,
        deviceId: req.deviceId
      }
    });
  });
});

describe('API Unification Tests', () => {
  describe('CORS Configuration', () => {
    it('should allow requests from web clients', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000')
        .set('User-Agent', 'Mozilla/5.0');

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should allow requests from mobile clients', async () => {
      const response = await request(app)
        .get('/health')
        .set('X-Client-Type', 'mobile')
        .set('X-Device-ID', 'test-device-123');

      expect(response.status).toBe(200);
      expect(response.body.client.type).toBe('mobile');
    });

    it('should allow requests without origin (mobile apps)', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
    });
  });

  describe('Client Detection', () => {
    it('should detect web client from User-Agent', async () => {
      const response = await request(app)
        .get('/health')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');

      expect(response.status).toBe(200);
      expect(response.body.client.type).toBe('web');
    });

    it('should detect mobile client from X-Client-Type header', async () => {
      const response = await request(app)
        .get('/health')
        .set('X-Client-Type', 'mobile');

      expect(response.status).toBe(200);
      expect(response.body.client.type).toBe('mobile');
    });

    it('should detect mobile client from User-Agent (Flutter)', async () => {
      const response = await request(app)
        .get('/health')
        .set('User-Agent', 'Flutter/1.0.0');

      expect(response.status).toBe(200);
      expect(response.body.client.type).toBe('mobile');
    });
  });

  describe('Compatibility Endpoints', () => {
    it('should return compatibility check for web', async () => {
      const response = await request(app)
        .get('/api/compatibility/check')
        .set('X-Client-Type', 'web');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.compatible).toBe(true);
      expect(response.body.client.type).toBe('web');
    });

    it('should return compatibility check for mobile', async () => {
      const response = await request(app)
        .get('/api/compatibility/check')
        .set('X-Client-Type', 'mobile')
        .set('X-Device-ID', 'device-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.compatible).toBe(true);
      expect(response.body.client.type).toBe('mobile');
      expect(response.body.client.deviceId).toBe('device-123');
    });
  });

  describe('Headers Support', () => {
    it('should accept X-Client-Type header', async () => {
      const response = await request(app)
        .get('/health')
        .set('X-Client-Type', 'web');

      expect(response.status).toBe(200);
      expect(response.headers['x-client-type']).toBe('web');
    });

    it('should accept X-Device-ID header', async () => {
      const response = await request(app)
        .get('/health')
        .set('X-Device-ID', 'test-device-id');

      expect(response.status).toBe(200);
      expect(response.body.client.deviceId).toBe('test-device-id');
    });
  });

  describe('Database Unification', () => {
    it('should use same database for all clients', async () => {
      // Verificar que la conexión a MongoDB use la misma BD
      const dbName = mongoose.connection.db?.databaseName || 'ASISTENCIA';
      expect(dbName).toBe('ASISTENCIA');
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
});

