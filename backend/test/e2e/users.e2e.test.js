const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcrypt');
const User = require('../../models/User');
const { app, setupRoutes } = require('./setup-e2e');

describe('E2E: Gestión de Usuarios (CRUD)', () => {
  let mongoServer;
  let adminToken;
  let testUserId;

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
    // Crear usuario admin para pruebas
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      _id: 'admin-test-123',
      nombre: 'Admin',
      apellido: 'Test',
      email: 'admin@test.com',
      password: hashedPassword,
      dni: '11111111',
      rango: 'admin',
      estado: 'activo',
    });

    // Login para obtener token (si se implementa autenticación JWT)
    const loginResponse = await request(app)
      .post('/login')
      .send({
        email: 'admin@test.com',
        password: 'admin123',
      });
    
    adminToken = loginResponse.body.id; // Usar ID como referencia
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe('GET /usuarios', () => {
    it('debe listar todos los usuarios', async () => {
      const response = await request(app)
        .get('/usuarios')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Validar estructura de cada usuario
      if (response.body.length > 0) {
        const user = response.body[0];
        expect(user).toHaveProperty('_id');
        expect(user).toHaveProperty('nombre');
        expect(user).toHaveProperty('email');
        expect(user).not.toHaveProperty('password');
      }
    });
  });

  describe('POST /usuarios', () => {
    it('debe crear un nuevo usuario', async () => {
      const newUser = {
        nombre: 'Nuevo',
        apellido: 'Usuario',
        email: 'nuevo@test.com',
        password: 'password123',
        dni: '22222222',
        rango: 'guardia',
        estado: 'activo',
      };

      const response = await request(app)
        .post('/usuarios')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.email).toBe(newUser.email);
      expect(response.body.nombre).toBe(newUser.nombre);
      expect(response.body).not.toHaveProperty('password');

      testUserId = response.body._id;
    });

    it('debe rechazar crear usuario con email duplicado', async () => {
      const duplicateUser = {
        nombre: 'Duplicate',
        apellido: 'User',
        email: 'nuevo@test.com', // Email ya existente
        password: 'password123',
        dni: '33333333',
        rango: 'guardia',
      };

      const response = await request(app)
        .post('/usuarios')
        .send(duplicateUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('debe validar campos requeridos', async () => {
      const incompleteUser = {
        nombre: 'Incomplete',
        // Faltan campos requeridos
      };

      const response = await request(app)
        .post('/usuarios')
        .send(incompleteUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /usuarios/:id', () => {
    it('debe obtener un usuario por ID', async () => {
      if (!testUserId) {
        // Crear usuario si no existe
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await User.create({
          _id: 'get-user-123',
          nombre: 'Get',
          apellido: 'User',
          email: 'get@test.com',
          password: hashedPassword,
          dni: '44444444',
          rango: 'guardia',
          estado: 'activo',
        });
        testUserId = user._id;
      }

      const response = await request(app)
        .get(`/usuarios/${testUserId}`)
        .expect(200);

      expect(response.body).toHaveProperty('_id');
      expect(response.body._id).toBe(testUserId);
      expect(response.body).not.toHaveProperty('password');
    });

    it('debe retornar 404 para usuario no encontrado', async () => {
      const response = await request(app)
        .get('/usuarios/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /usuarios/:id', () => {
    it('debe actualizar un usuario existente', async () => {
      if (!testUserId) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await User.create({
          _id: 'update-user-123',
          nombre: 'Update',
          apellido: 'User',
          email: 'update@test.com',
          password: hashedPassword,
          dni: '55555555',
          rango: 'guardia',
          estado: 'activo',
        });
        testUserId = user._id;
      }

      const updateData = {
        nombre: 'Updated',
        apellido: 'Name',
      };

      const response = await request(app)
        .put(`/usuarios/${testUserId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.nombre).toBe(updateData.nombre);
      expect(response.body.apellido).toBe(updateData.apellido);
    });

    it('debe retornar 404 para usuario no encontrado', async () => {
      const response = await request(app)
        .put('/usuarios/non-existent-id')
        .send({ nombre: 'Updated' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /usuarios/:id', () => {
    it('debe eliminar un usuario existente', async () => {
      // Crear usuario para eliminar
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userToDelete = await User.create({
        _id: 'delete-user-123',
        nombre: 'Delete',
        apellido: 'User',
        email: 'delete@test.com',
        password: hashedPassword,
        dni: '66666666',
        rango: 'guardia',
        estado: 'activo',
      });

      const response = await request(app)
        .delete(`/usuarios/${userToDelete._id}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verificar que el usuario fue eliminado
      const deletedUser = await User.findById(userToDelete._id);
      expect(deletedUser).toBeNull();
    });

    it('debe retornar 404 para usuario no encontrado', async () => {
      const response = await request(app)
        .delete('/usuarios/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});

