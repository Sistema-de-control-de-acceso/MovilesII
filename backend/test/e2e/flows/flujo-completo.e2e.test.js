/**
 * Test E2E de flujo completo: Login -> Dashboard -> Gestión de usuarios
 * Este test verifica que todos los componentes funcionen juntos
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcrypt');
const User = require('../../../models/User');
const Asistencia = require('../../../models/Asistencia');
const { app, setupRoutes } = require('../setup-e2e');
const { mockAsistencia } = require('../../utils/mocks');

describe('E2E: Flujo Completo del Sistema', () => {
  let mongoServer;
  let adminUser;
  let authToken;

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
    
    // Crear usuario admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    adminUser = await User.create({
      _id: 'admin-flow-123',
      nombre: 'Admin',
      apellido: 'Flow',
      email: 'admin@flow.com',
      password: hashedPassword,
      dni: '11111111',
      rango: 'admin',
      estado: 'activo',
    });
  });

  afterEach(async () => {
    await Asistencia.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  it('debe completar flujo completo: login -> ver dashboard -> crear usuario -> ver métricas', async () => {
    // 1. Login
    const loginResponse = await request(app)
      .post('/login')
      .send({
        email: 'admin@flow.com',
        password: 'admin123',
      })
      .expect(200);

    expect(loginResponse.body).toHaveProperty('id');
    expect(loginResponse.body.rango).toBe('admin');
    authToken = loginResponse.body.id;

    // 2. Ver dashboard
    const dashboardResponse = await request(app)
      .get('/dashboard/metrics')
      .expect(200);

    expect(dashboardResponse.body.success).toBe(true);
    expect(dashboardResponse.body).toHaveProperty('metrics');
    expect(dashboardResponse.body).toHaveProperty('entranceExitData');

    // 3. Crear datos de prueba para métricas
    const asistencia1 = mockAsistencia({
      tipo: 'entrada',
      fecha_hora: new Date(),
    });
    const asistencia2 = mockAsistencia({
      tipo: 'salida',
      dni: '22222222',
      fecha_hora: new Date(),
    });
    await Asistencia.create([asistencia1, asistencia2]);

    // 4. Ver métricas actualizadas
    const updatedMetrics = await request(app)
      .get('/dashboard/metrics')
      .expect(200);

    expect(updatedMetrics.body.metrics.total).toBeGreaterThanOrEqual(2);
    expect(updatedMetrics.body.entranceExitData.entrances).toBeGreaterThanOrEqual(1);

    // 5. Ver accesos recientes
    const recentAccess = await request(app)
      .get('/dashboard/recent-access')
      .expect(200);

    expect(recentAccess.body.success).toBe(true);
    expect(recentAccess.body.access.length).toBeGreaterThanOrEqual(2);

    // 6. Crear nuevo usuario
    const newUser = {
      nombre: 'Nuevo',
      apellido: 'Usuario',
      email: 'nuevo@flow.com',
      password: 'password123',
      dni: '33333333',
      rango: 'guardia',
      estado: 'activo',
    };

    const createUserResponse = await request(app)
      .post('/usuarios')
      .send(newUser)
      .expect(201);

    expect(createUserResponse.body.email).toBe(newUser.email);
    expect(createUserResponse.body).not.toHaveProperty('password');

    // 7. Verificar que el usuario fue creado
    const getUserResponse = await request(app)
      .get(`/usuarios/${createUserResponse.body._id}`)
      .expect(200);

    expect(getUserResponse.body.email).toBe(newUser.email);
  });

  it('debe manejar errores en flujo completo', async () => {
    // Intentar login con credenciales incorrectas
    const badLogin = await request(app)
      .post('/login')
      .send({
        email: 'wrong@test.com',
        password: 'wrongpassword',
      })
      .expect(401);

    expect(badLogin.body).toHaveProperty('error');

    // Intentar crear usuario con email duplicado
    const duplicateUser = {
      nombre: 'Duplicate',
      apellido: 'User',
      email: 'admin@flow.com', // Email ya existe
      password: 'password123',
      dni: '44444444',
      rango: 'guardia',
    };

    const duplicateResponse = await request(app)
      .post('/usuarios')
      .send(duplicateUser)
      .expect(400);

    expect(duplicateResponse.body).toHaveProperty('error');
  });
});

