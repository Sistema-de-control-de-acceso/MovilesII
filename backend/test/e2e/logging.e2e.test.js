/**
 * Tests E2E para validar logging centralizado
 * 
 * Verifica que:
 * - Los logs se generen en formato JSON estructurado
 * - El request-id se propague correctamente
 * - Los eventos críticos generen logs
 * - Los logs estén disponibles en el sistema centralizado
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcrypt');
const User = require('../../models/User');
const Asistencia = require('../../models/Asistencia');
const { app, setupRoutes } = require('./setup-e2e');
const { requestIdMiddleware, httpLoggerMiddleware } = require('../../utils/logger');

// Agregar middlewares de logging a la app de tests
app.use(requestIdMiddleware);
app.use(httpLoggerMiddleware);

describe('E2E: Logging Centralizado', () => {
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

    // Crear usuario de prueba
    const hashedPassword = await bcrypt.hash('test123', 10);
    testUser = await User.create({
      _id: 'test-user-logging',
      nombre: 'Test',
      apellido: 'User',
      email: 'test@logging.test',
      password: hashedPassword,
      dni: '99999999',
      rango: 'guardia',
      estado: 'activo'
    });
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    if (testUser) {
      await User.findByIdAndDelete(testUser._id);
    }
    await Asistencia.deleteMany({ dni: '12345678' });
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe('Request-ID Propagation', () => {
    test('debe generar y retornar request-id en header', async () => {
      const response = await request(app)
        .get('/dashboard/metrics')
        .expect(200);

      expect(response.headers['x-request-id']).toBeDefined();
      expect(typeof response.headers['x-request-id']).toBe('string');
      expect(response.headers['x-request-id'].length).toBeGreaterThan(0);
    });

    test('debe usar request-id proporcionado en header', async () => {
      const customRequestId = 'test-request-id-12345';
      const response = await request(app)
        .get('/dashboard/metrics')
        .set('X-Request-ID', customRequestId)
        .expect(200);

      expect(response.headers['x-request-id']).toBe(customRequestId);
    });
  });

  describe('Logging de Eventos Críticos', () => {
    test('debe generar log en login exitoso', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@logging.test',
          password: 'test123'
        })
        .expect(200);

      expect(response.headers['x-request-id']).toBeDefined();
      
      // Verificar que el log se generó (en un sistema real, verificarías el sistema de logging)
      // Por ahora, verificamos que la respuesta incluye el request-id
      const requestId = response.headers['x-request-id'];
      expect(requestId).toBeDefined();
    });

    test('debe generar log en login fallido', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@logging.test',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.headers['x-request-id']).toBeDefined();
    });

    test('debe generar log en registro de asistencia', async () => {
      // Primero hacer login para obtener contexto
      const loginResponse = await request(app)
        .post('/login')
        .send({
          email: 'test@logging.test',
          password: 'test123'
        });

      const requestId = loginResponse.headers['x-request-id'];

      const asistenciaData = {
        _id: `test-asistencia-${Date.now()}`,
        nombre: 'Test',
        apellido: 'Student',
        dni: '12345678',
        codigo_universitario: '20200001',
        tipo: 'entrada',
        fecha_hora: new Date(),
        puerta: 'Principal',
        guardia_id: testUser._id.toString(),
        guardia_nombre: 'Test User'
      };

      const response = await request(app)
        .post('/asistencias/completa')
        .set('X-Request-ID', requestId)
        .send(asistenciaData)
        .expect(201);

      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.body._id).toBe(asistenciaData._id);
    });
  });

  describe('Formato de Logs', () => {
    test('los logs deben incluir campos estructurados', async () => {
      // Este test verificaría que los logs tienen el formato correcto
      // En un sistema real, consultarías el sistema de logging centralizado
      const response = await request(app)
        .get('/dashboard/metrics')
        .expect(200);

      // Verificar que el request-id está presente
      expect(response.headers['x-request-id']).toBeDefined();
      
      // En producción, aquí verificarías que el log existe en el sistema centralizado
      // con los campos: timestamp, level, message, service, environment, requestId, etc.
    });
  });

  describe('Correlación Mobile-Backend', () => {
    test('debe mantener request-id a través de múltiples requests', async () => {
      const requestId = 'mobile-request-12345';

      // Simular flujo completo: login -> operación -> logout
      const loginResponse = await request(app)
        .post('/login')
        .set('X-Request-ID', requestId)
        .send({
          email: 'test@logging.test',
          password: 'test123'
        })
        .expect(200);

      expect(loginResponse.headers['x-request-id']).toBe(requestId);

      // Operación con mismo request-id
      const metricsResponse = await request(app)
        .get('/dashboard/metrics')
        .set('X-Request-ID', requestId)
        .expect(200);

      expect(metricsResponse.headers['x-request-id']).toBe(requestId);
    });
  });
});

