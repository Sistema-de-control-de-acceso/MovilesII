const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app, setupRoutes } = require('../e2e/setup-e2e');
const bcrypt = require('bcrypt');
const User = require('../../models/User');
const Asistencia = require('../../models/Asistencia');
const { mockAsistencia } = require('../utils/mocks');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Schemas de validación para contratos API
const schemas = {
  loginResponse: {
    type: 'object',
    required: ['id', 'nombre', 'apellido', 'email', 'rango', 'estado'],
    properties: {
      id: { type: 'string' },
      nombre: { type: 'string' },
      apellido: { type: 'string' },
      email: { type: 'string', format: 'email' },
      dni: { type: 'string' },
      rango: { type: 'string', enum: ['admin', 'guardia'] },
      puerta_acargo: { type: ['string', 'null'] },
      estado: { type: 'string', enum: ['activo', 'inactivo'] },
    },
    additionalProperties: false,
  },

  userResponse: {
    type: 'object',
    required: ['_id', 'nombre', 'apellido', 'email', 'rango'],
    properties: {
      _id: { type: 'string' },
      nombre: { type: 'string' },
      apellido: { type: 'string' },
      email: { type: 'string', format: 'email' },
      dni: { type: 'string' },
      rango: { type: 'string', enum: ['admin', 'guardia'] },
      estado: { type: 'string', enum: ['activo', 'inactivo'] },
      puerta_acargo: { type: ['string', 'null'] },
      telefono: { type: ['string', 'null'] },
    },
    additionalProperties: false,
  },

  dashboardMetrics: {
    type: 'object',
    required: ['success', 'metrics', 'hourlyData', 'entranceExitData', 'weeklyData', 'facultiesData'],
    properties: {
      success: { type: 'boolean' },
      metrics: {
        type: 'object',
        required: ['total', 'today'],
        properties: {
          total: { type: 'number' },
          today: { type: 'number' },
        },
      },
      hourlyData: { type: 'array' },
      entranceExitData: {
        type: 'object',
        required: ['entrances', 'exits'],
        properties: {
          entrances: { type: 'number' },
          exits: { type: 'number' },
        },
      },
      weeklyData: {
        type: 'object',
        required: ['values'],
        properties: {
          values: { type: 'array', items: { type: 'number' }, minItems: 7, maxItems: 7 },
        },
      },
      facultiesData: {
        type: 'object',
        required: ['labels', 'values'],
        properties: {
          labels: { type: 'array', items: { type: 'string' } },
          values: { type: 'array', items: { type: 'number' } },
        },
      },
      timestamp: { type: 'string', format: 'date-time' },
    },
  },

  errorResponse: {
    type: 'object',
    required: ['error'],
    properties: {
      error: { type: 'string' },
      details: { type: 'string' },
    },
  },
};

describe('Contract Testing: Validación de Contratos API', () => {
  let mongoServer;
  let testUser;

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
    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await User.create({
      _id: 'contract-test-user',
      nombre: 'Contract',
      apellido: 'Test',
      email: 'contract@test.com',
      password: hashedPassword,
      dni: '99999999',
      rango: 'guardia',
      estado: 'activo',
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Asistencia.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe('POST /login - Contrato de Respuesta', () => {
    it('debe cumplir con el contrato de respuesta de login', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'contract@test.com',
          password: 'password123',
        })
        .expect(200);

      const validate = ajv.compile(schemas.loginResponse);
      const valid = validate(response.body);

      if (!valid) {
        console.error('Errores de validación:', validate.errors);
      }

      expect(valid).toBe(true);
      expect(validate.errors).toBeNull();
    });

    it('debe cumplir con el contrato de error de login', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'wrong@test.com',
          password: 'wrongpassword',
        })
        .expect(401);

      const validate = ajv.compile(schemas.errorResponse);
      const valid = validate(response.body);

      expect(valid).toBe(true);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /usuarios - Contrato de Respuesta', () => {
    it('debe cumplir con el contrato de respuesta de usuarios', async () => {
      const response = await request(app)
        .get('/usuarios')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        const validate = ajv.compile(schemas.userResponse);
        const valid = validate(response.body[0]);

        if (!valid) {
          console.error('Errores de validación:', validate.errors);
        }

        expect(valid).toBe(true);
      }
    });
  });

  describe('GET /dashboard/metrics - Contrato de Respuesta', () => {
    it('debe cumplir con el contrato de métricas del dashboard', async () => {
      // Crear datos de prueba
      const asistencia = mockAsistencia();
      await Asistencia.create(asistencia);

      const response = await request(app)
        .get('/dashboard/metrics')
        .expect(200);

      const validate = ajv.compile(schemas.dashboardMetrics);
      const valid = validate(response.body);

      if (!valid) {
        console.error('Errores de validación:', validate.errors);
        console.error('Respuesta recibida:', JSON.stringify(response.body, null, 2));
      }

      expect(valid).toBe(true);
    });

    it('debe mantener estructura consistente sin datos', async () => {
      await Asistencia.deleteMany({});

      const response = await request(app)
        .get('/dashboard/metrics')
        .expect(200);

      const validate = ajv.compile(schemas.dashboardMetrics);
      const valid = validate(response.body);

      expect(valid).toBe(true);
      expect(response.body.metrics.total).toBe(0);
    });
  });

  describe('GET /dashboard/recent-access - Contrato de Respuesta', () => {
    it('debe retornar array de accesos con estructura válida', async () => {
      const asistencia = mockAsistencia();
      await Asistencia.create(asistencia);

      const response = await request(app)
        .get('/dashboard/recent-access')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.access)).toBe(true);

      if (response.body.access.length > 0) {
        const access = response.body.access[0];
        expect(access).toHaveProperty('_id');
        expect(access).toHaveProperty('fecha_hora');
        expect(access).toHaveProperty('tipo');
        expect(['entrada', 'salida']).toContain(access.tipo);
      }
    });
  });

  describe('Validación de tipos de datos', () => {
    it('debe validar tipos de datos en respuestas numéricas', async () => {
      const response = await request(app)
        .get('/dashboard/metrics')
        .expect(200);

      expect(typeof response.body.metrics.total).toBe('number');
      expect(typeof response.body.entranceExitData.entrances).toBe('number');
      expect(typeof response.body.entranceExitData.exits).toBe('number');
    });

    it('debe validar formatos de fecha ISO 8601', async () => {
      const response = await request(app)
        .get('/dashboard/metrics')
        .expect(200);

      // Validar formato ISO 8601
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
      expect(iso8601Regex.test(response.body.timestamp)).toBe(true);
    });
  });
});

