'use strict';

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, param, validationResult } = require('express-validator');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

// ==================== APP Y MIDDLEWARES ====================
const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

// Limitar intentos en endpoints sensibles
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/login', authLimiter);

// ==================== DB ====================
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'ASISTENCIA'
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Error de conexión a MongoDB:'));
db.once('open', () => {
  console.log('Conectado exitosamente a MongoDB Atlas');
});

// ==================== MODELOS ====================
const UserSchema = new mongoose.Schema({
  _id: String,
  nombre: String,
  apellido: String,
  dni: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
  rango: { type: String, enum: ['admin', 'guardia'], default: 'guardia' },
  estado: { type: String, enum: ['activo', 'inactivo'], default: 'activo' },
  puerta_acargo: String,
  telefono: String,
  fecha_creacion: { type: Date, default: Date.now },
  fecha_actualizacion: { type: Date, default: Date.now }
}, { collection: 'usuarios', strict: false, _id: false });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('usuarios', UserSchema);

// ==================== JWT ====================
function generateToken(payload) {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
  return jwt.sign(payload, secret, { expiresIn: '8h' });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// ==================== RUTAS ====================
/**
 * @openapi
 * /:
 *   get:
 *     tags: [General]
 *     summary: Información general de la API
 *     description: Endpoint raíz que muestra información sobre los endpoints disponibles
 *     responses:
 *       200:
 *         description: Información de la API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "API Sistema Control Acceso NFC - FUNCIONANDO"
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     login:
 *                       type: string
 *                       example: "/login"
 *                     usuarios:
 *                       type: string
 *                       example: "/usuarios"
 *                     docs:
 *                       type: string
 *                       example: "/api-docs"
 *                 status:
 *                   type: string
 *                   example: "OK"
 */
app.get('/', (req, res) => {
  res.json({
    message: 'API Sistema Control Acceso NFC - FUNCIONANDO',
    endpoints: {
      login: '/login',
      usuarios: '/usuarios',
      docs: '/api-docs'
    },
    status: 'OK'
  });
});

/**
 * @openapi
 * /login:
 *   post:
 *     tags: [Autenticación]
 *     summary: Iniciar sesión y obtener JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Autenticación exitosa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token para autenticación
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     nombre:
 *                       type: string
 *                     apellido:
 *                       type: string
 *                     email:
 *                       type: string
 *                     dni:
 *                       type: string
 *                     rango:
 *                       type: string
 *                     puerta_acargo:
 *                       type: string
 *                     estado:
 *                       type: string
 *       400:
 *         description: Error de validación
 *       401:
 *         description: Credenciales incorrectas
 *       500:
 *         description: Error del servidor
 */
app.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validación fallida', details: errors.array() });
    }
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email, estado: 'activo' });
      if (!user) return res.status(401).json({ error: 'Credenciales incorrectas' });
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) return res.status(401).json({ error: 'Credenciales incorrectas' });
      const token = generateToken({ id: user._id, rango: user.rango });
      res.json({
        token,
        user: {
          id: user._id,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          dni: user.dni,
          rango: user.rango,
          puerta_acargo: user.puerta_acargo,
          estado: user.estado
        }
      });
    } catch (err) {
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }
);

/**
 * @openapi
 * /usuarios:
 *   get:
 *     summary: Listar usuarios (sin contraseñas)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   nombre:
 *                     type: string
 *                   apellido:
 *                     type: string
 *                   dni:
 *                     type: string
 *                   email:
 *                     type: string
 *                   rango:
 *                     type: string
 *                     enum: [admin, guardia]
 *                   estado:
 *                     type: string
 *                     enum: [activo, inactivo]
 *                   puerta_acargo:
 *                     type: string
 *                   telefono:
 *                     type: string
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
app.get('/usuarios', authenticateToken, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

/**
 * @openapi
 * /usuarios:
 *   post:
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     summary: Crear usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, apellido, dni, email, password]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Juan
 *               apellido:
 *                 type: string
 *                 example: Pérez
 *               dni:
 *                 type: string
 *                 example: "12345678"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: juan.perez@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *               rango:
 *                 type: string
 *                 enum: [admin, guardia]
 *                 default: guardia
 *               puerta_acargo:
 *                 type: string
 *                 example: "Puerta Principal"
 *               telefono:
 *                 type: string
 *                 example: "+51987654321"
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Error de validación o DNI/email duplicado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
app.post('/usuarios',
  authenticateToken,
  body('nombre').isString().trim().notEmpty(),
  body('apellido').isString().trim().notEmpty(),
  body('dni').isString().trim().isLength({ min: 6 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 6 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validación fallida', details: errors.array() });
      }
      const { nombre, apellido, dni, email, password, rango, puerta_acargo, telefono } = req.body;
      const user = new User({
        nombre,
        apellido,
        dni,
        email,
        password,
        rango: rango || 'guardia',
        puerta_acargo,
        telefono
      });
      await user.save();
      const userResponse = user.toObject();
      delete userResponse.password;
      res.status(201).json(userResponse);
    } catch (err) {
      if (err.code === 11000) {
        res.status(400).json({ error: 'DNI o email ya existe' });
      } else {
        res.status(500).json({ error: 'Error al crear usuario' });
      }
    }
  }
);

/**
 * @openapi
 * /usuarios/{id}/password:
 *   put:
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     summary: Cambiar contraseña de usuario
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "nuevaPassword123"
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
app.put('/usuarios/:id/password',
  authenticateToken,
  param('id').isString().notEmpty(),
  body('password').isString().isLength({ min: 6 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validación fallida', details: errors.array() });
      }
      const { password } = req.body;
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
      user.password = password;
      user.fecha_actualizacion = new Date();
      await user.save();
      res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (err) {
      res.status(500).json({ error: 'Error al actualizar contraseña' });
    }
  }
);

// ==================== SWAGGER / OPENAPI ====================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Control Acceso NFC',
      version: '1.0.0',
      description: 'Sistema de control de acceso NFC para instalaciones universitarias. API completa con autenticación JWT, gestión de usuarios y validaciones de seguridad.',
      contact: {
        name: 'Equipo de Desarrollo',
        email: 'soporte@universidad.edu'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      { 
        url: process.env.SWAGGER_SERVER_URL || 'http://localhost:3000',
        description: 'Servidor de desarrollo'
      },
    ],
    tags: [
      {
        name: 'General',
        description: 'Endpoints generales'
      },
      {
        name: 'Autenticación',
        description: 'Endpoints de autenticación y login'
      },
      {
        name: 'Usuarios',
        description: 'Gestión de usuarios del sistema'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtenido del endpoint /login'
        }
      }
    }
  },
  apis: [__filename],
};
const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ==================== START ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});


