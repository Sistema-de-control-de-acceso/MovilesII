const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcrypt');
const User = require('../../models/User');
const { app, setupRoutes } = require('./setup-e2e');

describe('E2E: Autenticación', () => {
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
    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await User.create({
      _id: 'test-user-123',
      nombre: 'Test',
      apellido: 'User',
      email: 'test@example.com',
      password: hashedPassword,
      dni: '12345678',
      rango: 'guardia',
      estado: 'activo',
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe('POST /login', () => {
    it('debe autenticar usuario con credenciales válidas', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      // Validar estructura de respuesta
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('nombre');
      expect(response.body).toHaveProperty('apellido');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('rango');
      expect(response.body).not.toHaveProperty('password');

      // Validar valores
      expect(response.body.email).toBe('test@example.com');
      expect(response.body.rango).toBe('guardia');
    });

    it('debe rechazar login con email incorrecto', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'wrong@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Credenciales incorrectas');
    });

    it('debe rechazar login con contraseña incorrecta', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Credenciales incorrectas');
    });

    it('debe rechazar login de usuario inactivo', async () => {
      // Crear usuario inactivo
      const inactiveUser = await User.create({
        _id: 'inactive-user-123',
        nombre: 'Inactive',
        apellido: 'User',
        email: 'inactive@example.com',
        password: await bcrypt.hash('password123', 10),
        dni: '87654321',
        rango: 'guardia',
        estado: 'inactivo',
      });

      const response = await request(app)
        .post('/login')
        .send({
          email: 'inactive@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      await User.findByIdAndDelete(inactiveUser._id);
    });

    it('debe validar campos requeridos', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          // Falta password
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});

