// Mocks para servicios externos y dependencias

/**
 * Mock de respuesta HTTP
 */
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.header = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Mock de request HTTP
 */
const mockRequest = (body = {}, params = {}, query = {}, user = null) => {
  return {
    body,
    params,
    query,
    user,
    headers: {
      'content-type': 'application/json',
      authorization: user ? `Bearer ${user.token}` : null,
    },
    get: jest.fn((header) => {
      return header === 'authorization' && user ? `Bearer ${user.token}` : null;
    }),
  };
};

/**
 * Mock de modelo Mongoose
 */
const mockMongooseModel = (data = {}) => {
  return {
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnThis(),
    findByIdAndUpdate: jest.fn().mockReturnThis(),
    findByIdAndDelete: jest.fn().mockReturnThis(),
    findOneAndUpdate: jest.fn().mockReturnThis(),
    create: jest.fn(),
    save: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
    countDocuments: jest.fn(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn(),
    ...data,
  };
};

/**
 * Mock de estudiante
 */
const mockEstudiante = (overrides = {}) => {
  return {
    _id: 'estudiante123',
    nombre: 'Juan',
    apellido: 'Pérez',
    dni: '12345678',
    codigo_universitario: '20201234',
    siglas_facultad: 'FIIS',
    siglas_escuela: 'IC',
    estado: 'activo',
    ...overrides,
  };
};

/**
 * Mock de asistencia
 */
const mockAsistencia = (overrides = {}) => {
  return {
    _id: overrides._id || uuidv4(),
    nombre: 'Juan',
    apellido: 'Pérez',
    dni: '12345678',
    codigo_universitario: '20201234',
    siglas_facultad: 'FIIS',
    siglas_escuela: 'IC',
    tipo: 'entrada',
    fecha_hora: new Date(),
    entrada_tipo: 'nfc',
    puerta: 'Puerta Principal',
    guardia_id: 'guardia123',
    guardia_nombre: 'Guardia Test',
    autorizacion_manual: false,
    ...overrides,
  };
};

/**
 * Mock de presencia
 */
const mockPresencia = (overrides = {}) => {
  return {
    _id: overrides._id || uuidv4(),
    estudiante_id: 'estudiante123',
    estudiante_dni: '12345678',
    estudiante_nombre: 'Juan Pérez',
    facultad: 'FIIS',
    escuela: 'IC',
    hora_entrada: new Date(),
    hora_salida: null,
    punto_entrada: 'Puerta Principal',
    punto_salida: null,
    esta_dentro: true,
    guardia_entrada: 'guardia123',
    guardia_salida: null,
    tiempo_en_campus: null,
    ...overrides,
  };
};

/**
 * Mock de usuario/guardia
 */
const mockUsuario = (overrides = {}) => {
  return {
    _id: 'usuario123',
    nombre: 'Guardia',
    apellido: 'Test',
    dni: '87654321',
    email: 'guardia@test.com',
    password: 'hashedPassword123',
    rango: 'guardia',
    estado: 'activo',
    puerta_acargo: 'Puerta Principal',
    ...overrides,
  };
};

module.exports = {
  mockResponse,
  mockRequest,
  mockMongooseModel,
  mockEstudiante,
  mockAsistencia,
  mockPresencia,
  mockUsuario,
};

