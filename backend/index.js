// Backend completo con autenticación segura
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const PuntoControl = require('./models/PuntoControl');
const Asignacion = require('./models/Asignacion');
const { Bus, ViajeBus } = require('./models/Bus');
const SugerenciaBus = require('./models/SugerenciaBus');
const { BaselineData, ProjectCost } = require('./models/BaselineData');
const { DataVersion, DeviceSync, PendingChange } = require('./models/DataVersion');
const Evento = require('./models/Evento');
// ==================== ENDPOINTS PUNTOS DE CONTROL ====================

// Listar todos los puntos de control
app.get('/puntos-control', async (req, res) => {
  try {
    const puntos = await PuntoControl.find();
    res.json(puntos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener puntos de control' });
  }
});

// Crear un nuevo punto de control
app.post('/puntos-control', async (req, res) => {
  try {
    const { nombre, ubicacion, descripcion, coordenadas_lat, coordenadas_lng, coordenadas } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
    
    // Procesar coordenadas GPS
    let lat = coordenadas_lat;
    let lng = coordenadas_lng;
    let coordString = coordenadas;
    
    // Si se proporcionan coordenadas en formato string, parsearlas
    if (coordenadas && typeof coordenadas === 'string' && !lat && !lng) {
      const coords = coordenadas.split(',');
      if (coords.length === 2) {
        lat = parseFloat(coords[0].trim());
        lng = parseFloat(coords[1].trim());
        coordString = coordenadas;
      }
    }
    
    // Si se proporcionan lat/lng pero no string, crear el string
    if (lat && lng && !coordString) {
      coordString = `${lat},${lng}`;
    }
    
    const punto = new PuntoControl({
      _id: uuidv4(),
      nombre,
      ubicacion,
      descripcion,
      coordenadas_lat: lat,
      coordenadas_lng: lng,
      coordenadas: coordString,
      activo: true,
      fecha_creacion: new Date(),
      fecha_actualizacion: new Date()
    });
    await punto.save();
    res.status(201).json(punto);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear punto de control', details: err.message });
  }
});

// Actualizar punto de control
app.put('/puntos-control/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Procesar coordenadas si se proporcionan
    if (updateData.coordenadas && typeof updateData.coordenadas === 'string' && 
        !updateData.coordenadas_lat && !updateData.coordenadas_lng) {
      const coords = updateData.coordenadas.split(',');
      if (coords.length === 2) {
        updateData.coordenadas_lat = parseFloat(coords[0].trim());
        updateData.coordenadas_lng = parseFloat(coords[1].trim());
      }
    }
    
    // Actualizar fecha de actualización
    updateData.fecha_actualizacion = new Date();
    
    const punto = await PuntoControl.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!punto) return res.status(404).json({ error: 'Punto de control no encontrado' });
    res.json(punto);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar punto de control', details: err.message });
  }
});

// Eliminar punto de control
app.delete('/puntos-control/:id', async (req, res) => {
  try {
    const punto = await PuntoControl.findByIdAndDelete(req.params.id);
    if (!punto) return res.status(404).json({ error: 'Punto de control no encontrado' });
    res.json({ message: 'Punto de control eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar punto de control' });
  }
});

// Obtener punto de control por ID
app.get('/puntos-control/:id', async (req, res) => {
  try {
    const punto = await PuntoControl.findById(req.params.id);
    if (!punto) return res.status(404).json({ error: 'Punto de control no encontrado' });
    res.json(punto);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener punto de control', details: err.message });
  }
});

// Obtener mapa de puntos de control (con coordenadas GPS)
app.get('/puntos-control/mapa', async (req, res) => {
  try {
    const { activo = true } = req.query;
    
    // Obtener puntos de control con coordenadas
    const query = activo === 'true' || activo === true 
      ? { activo: true, coordenadas_lat: { $exists: true, $ne: null }, coordenadas_lng: { $exists: true, $ne: null } }
      : { coordenadas_lat: { $exists: true, $ne: null }, coordenadas_lng: { $exists: true, $ne: null } };
    
    const puntos = await PuntoControl.find(query);
    
    // Formatear datos para mapa
    const mapaData = puntos.map(punto => ({
      id: punto._id,
      nombre: punto.nombre,
      ubicacion: punto.ubicacion,
      descripcion: punto.descripcion,
      coordenadas: {
        lat: punto.coordenadas_lat,
        lng: punto.coordenadas_lng
      },
      activo: punto.activo
    }));
    
    res.json({
      success: true,
      puntos: mapaData,
      total: mapaData.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener mapa de puntos de control', details: err.message });
  }
});

// Obtener asistencias por punto de control
app.get('/asistencias/por-punto-control/:puntoControlId', async (req, res) => {
  try {
    const { puntoControlId } = req.params;
    const { fechaInicio, fechaFin, limit = 100 } = req.query;
    
    // Construir query
    const query = { punto_control_id: puntoControlId };
    
    if (fechaInicio || fechaFin) {
      query.fecha_hora = {};
      if (fechaInicio) query.fecha_hora.$gte = new Date(fechaInicio);
      if (fechaFin) query.fecha_hora.$lte = new Date(fechaFin);
    }
    
    const asistencias = await Asistencia.find(query)
      .sort({ fecha_hora: -1 })
      .limit(parseInt(limit));
    
    // Obtener información del punto de control
    const puntoControl = await PuntoControl.findById(puntoControlId);
    
    res.json({
      success: true,
      punto_control: puntoControl,
      asistencias: asistencias,
      total: asistencias.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener asistencias por punto de control', details: err.message });
  }
});

// ==================== ENDPOINTS ASIGNACIONES ====================

// Listar todas las asignaciones
app.get('/asignaciones', async (req, res) => {
  try {
    const asignaciones = await Asignacion.find();
    res.json(asignaciones);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener asignaciones' });
  }
});

// Crear asignación múltiple de guardias a puntos
app.post('/asignaciones', async (req, res) => {
  try {
    const { asignaciones } = req.body; // [{ guardia_id, punto_id, fecha_inicio, fecha_fin }]
    if (!Array.isArray(asignaciones) || asignaciones.length === 0) {
      return res.status(400).json({ error: 'Se requiere al menos una asignación' });
    }
    const nuevas = [];
    for (const asignacion of asignaciones) {
      if (!asignacion.guardia_id || !asignacion.punto_id || !asignacion.fecha_inicio) {
        return res.status(400).json({ error: 'Datos incompletos en asignación' });
      }
      // Validación de conflicto: no permitir asignación activa duplicada
      const conflicto = await Asignacion.findOne({
        guardia_id: asignacion.guardia_id,
        punto_id: asignacion.punto_id,
        estado: 'activa'
      });
      if (conflicto) {
        return res.status(409).json({ error: `Conflicto: Guardia ya asignado a este punto` });
      }
      const nueva = new Asignacion({
        _id: uuidv4(),
        ...asignacion,
        estado: 'activa'
      });
      await nueva.save();
      nuevas.push(nueva);
    }
    res.status(201).json(nuevas);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear asignaciones' });
  }
});

// Finalizar (desasignar) una asignación
app.put('/asignaciones/:id/finalizar', async (req, res) => {
  try {
    const asignacion = await Asignacion.findByIdAndUpdate(
      req.params.id,
      { estado: 'finalizada', fecha_fin: new Date() },
      { new: true }
    );
    if (!asignacion) return res.status(404).json({ error: 'Asignación no encontrada' });
    res.json(asignacion);
  } catch (err) {
    res.status(500).json({ error: 'Error al finalizar asignación' });
  }
});

// Visualización de asignaciones por punto
app.get('/puntos-control/:id/asignaciones', async (req, res) => {
  try {
    const asignaciones = await Asignacion.find({ punto_id: req.params.id, estado: 'activa' });
    res.json(asignaciones);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener asignaciones del punto' });
  }
});
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();

// Configuración CORS para web y app móvil
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (app móvil, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Lista de orígenes permitidos
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'https://movilesii.onrender.com',
      /^https?:\/\/192\.168\.\d+\.\d+:\d+$/, // IPs locales para desarrollo móvil
      /^https?:\/\/10\.\d+\.\d+\.\d+:\d+$/, // IPs de red local
    ];
    
    // Verificar si el origen está permitido
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      // En desarrollo, permitir todos los orígenes
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('No permitido por CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Type', 'X-Device-ID'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static('public'));

// Conexión a MongoDB Atlas - ESPECIFICAR BASE DE DATOS ASISTENCIA
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'ASISTENCIA'
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Error de conexión a MongoDB:'));
db.once('open', () => {
  console.log('Conectado exitosamente a MongoDB> Atlas');
});

// Modelo de facultad - EXACTO como en MongoDB Atlas (campos como strings)
const FacultadSchema = new mongoose.Schema({
  _id: String,
  siglas: String,
  nombre: String
}, { collection: 'facultades', strict: false, _id: false });
const Facultad = mongoose.model('facultades', FacultadSchema);

// Modelo de escuela - EXACTO como en MongoDB Atlas
const EscuelaSchema = new mongoose.Schema({
  _id: String,
  nombre: String,
  siglas: String,
  siglas_facultad: String
}, { collection: 'escuelas', strict: false, _id: false });
const Escuela = mongoose.model('escuelas', EscuelaSchema);

// Modelo de asistencias - EXACTO como en MongoDB Atlas con nuevos campos
const AsistenciaSchema = new mongoose.Schema({
  _id: String,
  nombre: String,
  apellido: String,
  dni: String,
  codigo_universitario: String,
  siglas_facultad: String,
  siglas_escuela: String,
  tipo: String,
  fecha_hora: Date,
  entrada_tipo: String,
  puerta: String,
  // Nuevos campos para US025-US030
  guardia_id: String,
  guardia_nombre: String,
  autorizacion_manual: Boolean,
  razon_decision: String,
  timestamp_decision: Date,
  coordenadas: String,
  descripcion_ubicacion: String
}, { collection: 'asistencias', strict: false, _id: false });
const Asistencia = mongoose.model('asistencias', AsistenciaSchema);

// Modelo para decisiones manuales (US024-US025)
const DecisionManualSchema = new mongoose.Schema({
  _id: String,
  estudiante_id: String,
  estudiante_dni: String,
  estudiante_nombre: String,
  guardia_id: String,
  guardia_nombre: String,
  autorizado: Boolean,
  razon: String,
  timestamp: { type: Date, default: Date.now },
  punto_control: String,
  tipo_acceso: String,
  datos_estudiante: Object
}, { collection: 'decisiones_manuales', strict: false, _id: false });
const DecisionManual = mongoose.model('decisiones_manuales', DecisionManualSchema);

// Modelo para control de presencia (US026-US030)
const PresenciaSchema = new mongoose.Schema({
  _id: String,
  estudiante_id: String,
  estudiante_dni: String,
  estudiante_nombre: String,
  facultad: String,
  escuela: String,
  hora_entrada: Date,
  hora_salida: Date,
  punto_entrada: String,
  punto_salida: String,
  esta_dentro: { type: Boolean, default: true },
  guardia_entrada: String,
  guardia_salida: String,
  tiempo_en_campus: Number
}, { collection: 'presencia', strict: false, _id: false });
const Presencia = mongoose.model('presencia', PresenciaSchema);

// Modelo para sesiones activas de guardias (US059 - Múltiples guardias simultáneos)
const SessionGuardSchema = new mongoose.Schema({
  _id: String,
  guardia_id: String,
  guardia_nombre: String,
  punto_control: String,
  session_token: String,
  last_activity: { type: Date, default: Date.now },
  is_active: { type: Boolean, default: true },
  device_info: {
    platform: String,
    device_id: String,
    app_version: String
  },
  fecha_inicio: { type: Date, default: Date.now },
  fecha_fin: Date
}, { collection: 'sesiones_guardias', strict: false, _id: false });
const SessionGuard = mongoose.model('sesiones_guardias', SessionGuardSchema);

// Modelo de usuarios mejorado con validaciones - EXACTO como MongoDB Atlas
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

// Middleware para hashear contraseña antes de guardar
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

// Método para comparar contraseñas
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('usuarios', UserSchema);

// Modelo de alumnos - EXACTO como en MongoDB Atlas
const AlumnoSchema = new mongoose.Schema({
  _id: String,
  _identificacion: String,
  nombre: String,
  apellido: String,
  dni: String,
  codigo_universitario: { type: String, unique: true, index: true },
  escuela_profesional: String,
  facultad: String,
  siglas_escuela: String,
  siglas_facultad: String,
  estado: { type: Boolean, default: true }
}, { collection: 'alumnos', strict: false, _id: false });
const Alumno = mongoose.model('alumnos', AlumnoSchema);

// Modelo de externos - EXACTO como en MongoDB Atlas
const ExternoSchema = new mongoose.Schema({
  _id: String,
  nombre: String,
  dni: { type: String, unique: true, index: true }
}, { collection: 'externos', strict: false, _id: false });
const Externo = mongoose.model('externos', ExternoSchema);

// Modelo de visitas - EXACTO como en MongoDB Atlas
const VisitaSchema = new mongoose.Schema({
  _id: String,
  puerta: String,
  guardia_nombre: String,
  asunto: String,
  fecha_hora: Date,
  nombre: String,
  dni: String,
  facultad: String
}, { collection: 'visitas', strict: false, _id: false });
const Visita = mongoose.model('visitas', VisitaSchema);

// ==================== RUTAS ====================

// Ruta de prueba raíz
app.get('/', (req, res) => {
  res.json({
    message: "API Sistema Control Acceso NFC - FUNCIONANDO ✅",
    endpoints: {
      alumnos: "/alumnos",
      facultades: "/facultades", 
      usuarios: "/usuarios",
      asistencias: "/asistencias",
      externos: "/externos",
      visitas: "/visitas",
      login: "/login"
    },
    database: "ASISTENCIA - MongoDB Atlas",
    status: "Sprint 1 Completo 🚀"
  });
});

// Ruta para obtener asistencias
app.get('/asistencias', async (req, res) => {
  try {
    const { punto_control_id, con_punto_control = false } = req.query;
    
    let query = {};
    if (punto_control_id) {
      query.punto_control_id = punto_control_id;
    }
    
    const asistencias = await Asistencia.find(query).sort({ fecha_hora: -1 });
    
    // Si se solicita información de punto de control, agregarla
    if (con_punto_control === 'true' || con_punto_control === true) {
      const asistenciasConPunto = await Promise.all(
        asistencias.map(async (asistencia) => {
          const asistenciaObj = asistencia.toObject();
          if (asistencia.punto_control_id) {
            const puntoControl = await PuntoControl.findById(asistencia.punto_control_id);
            asistenciaObj.punto_control = puntoControl || null;
          }
          return asistenciaObj;
        })
      );
      return res.json(asistenciasConPunto);
    }
    
    res.json(asistencias);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener asistencias', details: err.message });
  }
});

// Ruta para obtener facultades - FIXED
app.get('/facultades', async (req, res) => {
  try {
    const facultades = await Facultad.find();
    res.json(facultades);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener facultades' });
  }
});

// Ruta para obtener escuelas por facultad
app.get('/escuelas', async (req, res) => {
  const { siglas_facultad } = req.query;
  try {
    let escuelas;
    if (siglas_facultad) {
      escuelas = await Escuela.find({ siglas_facultad });
    } else {
      escuelas = await Escuela.find();
    }
    res.json(escuelas);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener escuelas' });
  }
});

// Ruta para obtener usuarios (sin contraseñas)
app.get('/usuarios', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Importar servicio de notificaciones
const NotificationService = require('./services/notification_service');
const notificationService = new NotificationService();

// Ruta para crear usuario con contraseña encriptada
app.post('/usuarios', async (req, res) => {
  try {
    const { nombre, apellido, dni, email, password, rango, puerta_acargo, telefono, send_notification } = req.body;
    
    // Validar campos requeridos
    if (!nombre || !apellido || !dni || !email || !password) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Validar formato de DNI (8 dígitos)
    if (!/^\d{8}$/.test(dni)) {
      return res.status(400).json({ error: 'DNI debe tener 8 dígitos' });
    }

    // Validar formato de email
    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    // Validar contraseña (mínimo 8 caracteres)
    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    // Crear usuario (la contraseña se hashea automáticamente)
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
    
    // Enviar notificación si está habilitada
    if (send_notification !== false) {
      try {
        await notificationService.sendCredentialsToUser({
          email,
          password, // Enviar contraseña antes de hashearla (solo en creación)
          nombre: `${nombre} ${apellido}`
        });
      } catch (notifError) {
        // No fallar la creación si falla la notificación
        console.error('Error enviando notificación:', notifError);
      }
    }
    
    // Responder sin la contraseña
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json({
      ...userResponse,
      credentials_sent: send_notification !== false
    });
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ error: 'DNI o email ya existe' });
    } else {
      res.status(500).json({ error: 'Error al crear usuario', details: err.message });
    }
  }
});

// Endpoint para enviar notificación a usuario existente
app.post('/usuarios/:id/notify', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, nombre } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await notificationService.sendCredentialsToUser({
      email: email || user.email,
      password: password || 'Contacte al administrador',
      nombre: nombre || `${user.nombre} ${user.apellido}`
    });

    res.json({ 
      success: true, 
      message: 'Notificación enviada exitosamente' 
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error enviando notificación', 
      details: err.message 
    });
  }
});

// Ruta para cambiar contraseña
app.put('/usuarios/:id/password', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Contraseña requerida' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    user.password = password; // Se hashea automáticamente
    user.fecha_actualizacion = new Date();
    await user.save();

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar contraseña' });
  }
});

// Ruta de login segura
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Buscar usuario por email
    const user = await User.findOne({ email, estado: 'activo' });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Verificar contraseña con bcrypt
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Enviar datos del usuario (sin contraseña)
    res.json({
      id: user._id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      dni: user.dni,
      rango: user.rango,
      puerta_acargo: user.puerta_acargo,
      estado: user.estado
    });
  } catch (err) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Ruta para actualizar usuario
app.put('/usuarios/:id', async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    
    updateData.fecha_actualizacion = new Date();
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// Ruta para obtener usuario por ID
app.get('/usuarios/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// ==================== ENDPOINTS ALUMNOS ====================

// Ruta para buscar alumno por código universitario (CRÍTICO para NFC)
app.get('/alumnos/:codigo', async (req, res) => {
  try {
    const alumno = await Alumno.findOne({ 
      codigo_universitario: req.params.codigo 
    });
    
    if (!alumno) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    // Validar que el alumno esté matriculado (estado = true)
    if (!alumno.estado) {
      return res.status(403).json({ 
        error: 'Alumno no matriculado o inactivo',
        alumno: {
          nombre: alumno.nombre,
          apellido: alumno.apellido,
          codigo_universitario: alumno.codigo_universitario
        }
      });
    }

    res.json(alumno);
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar alumno' });
  }
});

// Ruta para obtener todos los alumnos
app.get('/alumnos', async (req, res) => {
  try {
    const alumnos = await Alumno.find();
    res.json(alumnos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener alumnos' });
  }
});

// ==================== ENDPOINTS EXTERNOS ====================

// Ruta para buscar externo por DNI
app.get('/externos/:dni', async (req, res) => {
  try {
    const externo = await Externo.findOne({ dni: req.params.dni });
    if (!externo) {
      return res.status(404).json({ error: 'Externo no encontrado' });
    }
    res.json(externo);
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar externo' });
  }
});

// Ruta para obtener todos los externos
app.get('/externos', async (req, res) => {
  try {
    const externos = await Externo.find();
    res.json(externos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener externos' });
  }
});

// Ruta para registrar asistencia completa (US025-US030)
app.post('/asistencias/completa', async (req, res) => {
  try {
    const asistenciaData = req.body;
    
    // Validar y preparar datos de punto de control si se proporciona
    if (asistenciaData.punto_control_id) {
      // Verificar que el punto de control existe
      const puntoControl = await PuntoControl.findById(asistenciaData.punto_control_id);
      if (!puntoControl) {
        return res.status(400).json({ 
          error: 'Punto de control no encontrado', 
          punto_control_id: asistenciaData.punto_control_id 
        });
      }
      
      // Si el punto de control tiene coordenadas y no se proporcionan, usar las del punto de control
      if (!asistenciaData.coordenadas_lat && !asistenciaData.coordenadas_lng) {
        if (puntoControl.coordenadas_lat && puntoControl.coordenadas_lng) {
          asistenciaData.coordenadas_lat = puntoControl.coordenadas_lat;
          asistenciaData.coordenadas_lng = puntoControl.coordenadas_lng;
          asistenciaData.coordenadas = `${puntoControl.coordenadas_lat},${puntoControl.coordenadas_lng}`;
        }
      }
      
      // Si no hay descripción de ubicación, usar la del punto de control
      if (!asistenciaData.descripcion_ubicacion && puntoControl.ubicacion) {
        asistenciaData.descripcion_ubicacion = puntoControl.ubicacion;
      }
    }
    
    // Procesar coordenadas si vienen en formato string
    if (asistenciaData.coordenadas && typeof asistenciaData.coordenadas === 'string' && 
        !asistenciaData.coordenadas_lat && !asistenciaData.coordenadas_lng) {
      const coords = asistenciaData.coordenadas.split(',');
      if (coords.length === 2) {
        asistenciaData.coordenadas_lat = parseFloat(coords[0].trim());
        asistenciaData.coordenadas_lng = parseFloat(coords[1].trim());
      }
    }
    
    const asistencia = new Asistencia(asistenciaData);
    await asistencia.save();
    res.status(201).json(asistencia);
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar asistencia completa', details: err.message });
  }
});

// Determinar último tipo de acceso para entrada/salida inteligente (US028)
// Mejorado para usar estado de presencia actual
app.get('/asistencias/ultimo-acceso/:dni', async (req, res) => {
  try {
    const { dni } = req.params;
    
    // Primero verificar estado de presencia actual (más confiable)
    const presenciaActual = await Presencia.findOne({ estudiante_dni: dni, esta_dentro: true });
    
    if (presenciaActual) {
      // Si está dentro según presencia, el siguiente movimiento debe ser salida
      res.json({ 
        ultimo_tipo: 'entrada',
        esta_dentro: true,
        hora_entrada: presenciaActual.hora_entrada,
        punto_entrada: presenciaActual.punto_entrada,
        fuente: 'presencia'
      });
      return;
    }
    
    // Si no hay presencia activa, verificar último movimiento en asistencias
    const ultimaAsistencia = await Asistencia.findOne({ dni }).sort({ fecha_hora: -1 });
    
    if (ultimaAsistencia) {
      res.json({ 
        ultimo_tipo: ultimaAsistencia.tipo,
        esta_dentro: ultimaAsistencia.tipo === 'entrada',
        ultima_fecha: ultimaAsistencia.fecha_hora,
        fuente: 'asistencias'
      });
    } else {
      // Si no hay registros, próximo debería ser entrada
      res.json({ 
        ultimo_tipo: 'salida',
        esta_dentro: false,
        ultima_fecha: null,
        fuente: 'sin_registros'
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error al determinar último acceso', details: err.message });
  }
});

// Obtener historial de movimientos de un estudiante
app.get('/asistencias/historial/:dni', async (req, res) => {
  try {
    const { dni } = req.params;
    const { limit } = req.query;
    
    let query = Asistencia.find({ dni }).sort({ fecha_hora: -1 });
    
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    
    const historial = await query;
    res.json({
      success: true,
      historial,
      count: historial.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// Validar coherencia de movimiento - Mejorado con validación temporal y estado de presencia
app.post('/asistencias/validar-movimiento', async (req, res) => {
  try {
    const { dni, tipo, fecha_hora } = req.body;
    
    if (!dni || !tipo || !fecha_hora) {
      return res.status(400).json({ 
        error: 'Faltan parámetros requeridos: dni, tipo, fecha_hora' 
      });
    }

    const fechaMovimiento = new Date(fecha_hora);
    
    // 1. Verificar estado de presencia actual (fuente más confiable)
    const presenciaActual = await Presencia.findOne({ estudiante_dni: dni, esta_dentro: true });
    
    if (presenciaActual) {
      // Estudiante está registrado como dentro del campus
      if (tipo === 'entrada') {
        return res.json({
          es_valido: false,
          tipo_sugerido: 'salida',
          motivo: 'El estudiante ya se encuentra registrado dentro del campus. No se puede registrar otra entrada.',
          requiere_autorizacion_manual: true,
          presencia_actual: {
            hora_entrada: presenciaActual.hora_entrada,
            punto_entrada: presenciaActual.punto_entrada
          }
        });
      }
      // Si es salida, validar coherencia temporal con la entrada
      if (fechaMovimiento < presenciaActual.hora_entrada) {
        return res.json({
          es_valido: false,
          tipo_sugerido: 'salida',
          motivo: 'La fecha/hora de salida no puede ser anterior a la hora de entrada',
          requiere_autorizacion_manual: true
        });
      }
    } else {
      // Estudiante NO está registrado como dentro
      if (tipo === 'salida') {
        return res.json({
          es_valido: false,
          tipo_sugerido: 'entrada',
          motivo: 'No se puede registrar salida sin registro previo de entrada',
          requiere_autorizacion_manual: true
        });
      }
    }

    // 2. Validar con último movimiento en asistencias (para coherencia adicional)
    const ultimaAsistencia = await Asistencia.findOne({ dni }).sort({ fecha_hora: -1 });
    
    if (ultimaAsistencia) {
      // Validar coherencia temporal - fecha no puede ser anterior al último registro
      if (fechaMovimiento < ultimaAsistencia.fecha_hora) {
        return res.json({
          es_valido: false,
          tipo_sugerido: ultimaAsistencia.tipo === 'entrada' ? 'salida' : 'entrada',
          motivo: 'La fecha/hora del movimiento es anterior al último registro',
          requiere_autorizacion_manual: true,
          ultimo_registro: {
            tipo: ultimaAsistencia.tipo,
            fecha_hora: ultimaAsistencia.fecha_hora
          }
        });
      }

      // Validar secuencia lógica - no puede haber dos movimientos del mismo tipo consecutivos
      if (ultimaAsistencia.tipo === tipo) {
        const tipoEsperado = ultimaAsistencia.tipo === 'entrada' ? 'salida' : 'entrada';
        return res.json({
          es_valido: false,
          tipo_sugerido: tipoEsperado,
          motivo: `El último movimiento fue ${ultimaAsistencia.tipo}. El siguiente debe ser ${tipoEsperado}`,
          requiere_autorizacion_manual: true
        });
      }

      // Validar tiempo mínimo entre movimientos (30 segundos)
      const diferencia = fechaMovimiento.getTime() - ultimaAsistencia.fecha_hora.getTime();
      if (diferencia < 30000) { // 30 segundos en milisegundos
        return res.json({
          es_valido: false,
          tipo_sugerido: tipo,
          motivo: 'Movimiento registrado muy rápido después del anterior. Esperar al menos 30 segundos',
          requiere_autorizacion_manual: false,
          diferencia_segundos: Math.floor(diferencia / 1000)
        });
      }
    }

    // 3. Todo correcto - validación pasada
    return res.json({
      es_valido: true,
      tipo_sugerido: tipo,
      motivo: null,
      requiere_autorizacion_manual: false,
      estado_presencia: presenciaActual ? 'dentro' : 'fuera'
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al validar movimiento',
      details: err.message 
    });
  }
});

// Calcular estudiantes en campus - Mejorado usando colección de Presencia
app.get('/asistencias/estudiantes-en-campus', async (req, res) => {
  try {
    // Usar la colección de Presencia como fuente principal (más confiable)
    const presenciasActivas = await Presencia.find({ esta_dentro: true })
      .sort({ hora_entrada: -1 });
    
    const estudiantesEnCampus = [];
    const estudiantesPorFacultad = {};
    let estudiantesDentro = 0;

    // Procesar cada presencia activa
    for (const presencia of presenciasActivas) {
      estudiantesDentro++;
      
      // Calcular tiempo en campus
      const ahora = new Date();
      const tiempoEnCampus = ahora - presencia.hora_entrada;
      const horas = Math.floor(tiempoEnCampus / (1000 * 60 * 60));
      const minutos = Math.floor((tiempoEnCampus % (1000 * 60 * 60)) / (1000 * 60));
      
      estudiantesEnCampus.push({
        dni: presencia.estudiante_dni,
        estudiante_id: presencia.estudiante_id,
        nombre: presencia.estudiante_nombre,
        facultad: presencia.facultad,
        escuela: presencia.escuela,
        hora_entrada: presencia.hora_entrada,
        punto_entrada: presencia.punto_entrada,
        guardia_entrada: presencia.guardia_entrada,
        tiempo_en_campus_minutos: Math.floor(tiempoEnCampus / (1000 * 60)),
        tiempo_en_campus_formateado: `${horas}h ${minutos}m`
      });

      // Contar por facultad
      const facultad = presencia.facultad || 'N/A';
      estudiantesPorFacultad[facultad] = (estudiantesPorFacultad[facultad] || 0) + 1;
    }

    // Obtener estadísticas adicionales de asistencias del día
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    const asistenciasHoy = await Asistencia.countDocuments({
      fecha_hora: { $gte: hoy, $lt: mañana }
    });

    const entradasHoy = await Asistencia.countDocuments({
      fecha_hora: { $gte: hoy, $lt: mañana },
      tipo: 'entrada'
    });

    const salidasHoy = await Asistencia.countDocuments({
      fecha_hora: { $gte: hoy, $lt: mañana },
      tipo: 'salida'
    });

    res.json({
      success: true,
      total_estudiantes_en_campus: estudiantesDentro,
      estudiantes: estudiantesEnCampus,
      por_facultad: estudiantesPorFacultad,
      estadisticas_hoy: {
        total_asistencias: asistenciasHoy,
        entradas: entradasHoy,
        salidas: salidasHoy,
        fecha: hoy.toISOString().split('T')[0]
      },
      ultima_actualizacion: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al calcular estudiantes en campus',
      details: err.message 
    });
  }
});

// Verificar si estudiante está en campus - Mejorado usando Presencia
app.get('/asistencias/esta-en-campus/:dni', async (req, res) => {
  try {
    const { dni } = req.params;
    
    // Verificar en colección de Presencia (fuente principal)
    const presencia = await Presencia.findOne({ estudiante_dni: dni, esta_dentro: true });
    
    if (presencia) {
      const ahora = new Date();
      const tiempoEnCampus = ahora - presencia.hora_entrada;
      
      return res.json({
        esta_en_campus: true,
        hora_entrada: presencia.hora_entrada,
        punto_entrada: presencia.punto_entrada,
        tiempo_en_campus_minutos: Math.floor(tiempoEnCampus / (1000 * 60)),
        fuente: 'presencia'
      });
    }
    
    // Si no hay presencia activa, verificar último movimiento
    const ultimaAsistencia = await Asistencia.findOne({ dni }).sort({ fecha_hora: -1 });
    
    const estaDentro = ultimaAsistencia && ultimaAsistencia.tipo === 'entrada';
    
    res.json({
      success: true,
      esta_en_campus: estaDentro,
      ultimo_movimiento: ultimaAsistencia ? {
        tipo: ultimaAsistencia.tipo,
        fecha_hora: ultimaAsistencia.fecha_hora
      } : null
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al verificar si está en campus' });
  }
});

// ==================== ENDPOINTS DECISIONES MANUALES (US024-US025) ====================

// Registrar decisión manual del guardia
app.post('/decisiones-manuales', async (req, res) => {
  try {
    const decision = new DecisionManual(req.body);
    await decision.save();
    res.status(201).json(decision);
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar decisión manual', details: err.message });
  }
});

// Obtener decisiones de un guardia específico
app.get('/decisiones-manuales/guardia/:guardiaId', async (req, res) => {
  try {
    const { guardiaId } = req.params;
    const decisiones = await DecisionManual.find({ guardia_id: guardiaId }).sort({ timestamp: -1 });
    res.json(decisiones);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener decisiones del guardia' });
  }
});

// Obtener todas las decisiones manuales (para reportes)
app.get('/decisiones-manuales', async (req, res) => {
  try {
    const decisiones = await DecisionManual.find().sort({ timestamp: -1 });
    res.json(decisiones);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener decisiones manuales' });
  }
});

// ==================== ENDPOINTS CONTROL DE PRESENCIA (US026-US030) ====================

// Obtener presencia actual en el campus
app.get('/presencia', async (req, res) => {
  try {
    const presencias = await Presencia.find({ esta_dentro: true });
    res.json(presencias);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener presencia actual' });
  }
});

// Actualizar presencia de un estudiante
app.post('/presencia/actualizar', async (req, res) => {
  try {
    const { estudiante_dni, tipo_acceso, punto_control, guardia_id } = req.body;
    
    if (tipo_acceso === 'entrada') {
      // Crear nueva presencia o actualizar existente
      const presenciaExistente = await Presencia.findOne({ estudiante_dni, esta_dentro: true });
      
      if (presenciaExistente) {
        // Ya está dentro, posible error
        res.status(400).json({ error: 'El estudiante ya se encuentra en el campus' });
        return;
      }
      
      // Obtener datos del estudiante para la presencia
      const estudiante = await Alumno.findOne({ dni: estudiante_dni });
      if (!estudiante) {
        res.status(404).json({ error: 'Estudiante no encontrado' });
        return;
      }
      
      const nuevaPresencia = new Presencia({
        _id: new mongoose.Types.ObjectId().toString(),
        estudiante_id: estudiante._id,
        estudiante_dni,
        estudiante_nombre: `${estudiante.nombre} ${estudiante.apellido}`,
        facultad: estudiante.siglas_facultad,
        escuela: estudiante.siglas_escuela,
        hora_entrada: new Date(),
        punto_entrada: punto_control,
        esta_dentro: true,
        guardia_entrada: guardia_id
      });
      
      await nuevaPresencia.save();
      res.json(nuevaPresencia);
      
    } else if (tipo_acceso === 'salida') {
      // Actualizar presencia existente
      const presencia = await Presencia.findOne({ estudiante_dni, esta_dentro: true });
      
      if (!presencia) {
        res.status(400).json({ error: 'El estudiante no se encuentra registrado como presente' });
        return;
      }
      
      const horaSalida = new Date();
      const tiempoEnCampus = horaSalida - presencia.hora_entrada;
      
      presencia.hora_salida = horaSalida;
      presencia.punto_salida = punto_control;
      presencia.esta_dentro = false;
      presencia.guardia_salida = guardia_id;
      presencia.tiempo_en_campus = tiempoEnCampus;
      
      await presencia.save();
      res.json(presencia);
    }
    
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar presencia', details: err.message });
  }
});

// Obtener historial completo de presencia
app.get('/presencia/historial', async (req, res) => {
  try {
    const historial = await Presencia.find().sort({ hora_entrada: -1 });
    res.json(historial);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener historial de presencia' });
  }
});

// Obtener personas que llevan mucho tiempo en campus
app.get('/presencia/largo-tiempo', async (req, res) => {
  try {
    const ahora = new Date();
    const hace8Horas = new Date(ahora - 8 * 60 * 60 * 1000);
    
    const presenciasLargas = await Presencia.find({
      esta_dentro: true,
      hora_entrada: { $lte: hace8Horas }
    });
    
    res.json(presenciasLargas);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener presencias de largo tiempo' });
  }
});

// ==================== ENDPOINTS SESIONES GUARDIAS (US059) ====================

// Middleware de concurrencia para verificar conflictos
const concurrencyMiddleware = async (req, res, next) => {
  try {
    const { guardia_id, punto_control } = req.body;
    
    // Verificar si otro guardia está activo en el mismo punto de control
    const sessionActiva = await SessionGuard.findOne({
      punto_control,
      is_active: true,
      guardia_id: { $ne: guardia_id }
    });
    
    if (sessionActiva) {
      return res.status(409).json({ 
        error: 'Otro guardia está activo en este punto de control',
        conflict: true,
        active_guard: {
          guardia_id: sessionActiva.guardia_id,
          guardia_nombre: sessionActiva.guardia_nombre,
          session_start: sessionActiva.fecha_inicio,
          last_activity: sessionActiva.last_activity
        }
      });
    }
    
    next();
  } catch (err) {
    res.status(500).json({ error: 'Error verificando concurrencia', details: err.message });
  }
};

// Iniciar sesión de guardia
app.post('/sesiones/iniciar', concurrencyMiddleware, async (req, res) => {
  try {
    const { guardia_id, guardia_nombre, punto_control, device_info } = req.body;
    
    // Finalizar cualquier sesión anterior del mismo guardia
    await SessionGuard.updateMany(
      { guardia_id, is_active: true },
      { 
        is_active: false, 
        fecha_fin: new Date() 
      }
    );
    
    // Crear nueva sesión
    const sessionToken = require('crypto').randomUUID();
    const nuevaSesion = new SessionGuard({
      _id: sessionToken,
      guardia_id,
      guardia_nombre,
      punto_control,
      session_token: sessionToken,
      device_info: device_info || {},
      last_activity: new Date(),
      is_active: true
    });
    
    await nuevaSesion.save();
    
    res.status(201).json({
      session_token: sessionToken,
      message: 'Sesión iniciada exitosamente',
      session: nuevaSesion
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al iniciar sesión', details: err.message });
  }
});

// Heartbeat - Mantener sesión activa
app.post('/sesiones/heartbeat', async (req, res) => {
  try {
    const { session_token } = req.body;
    
    const sesion = await SessionGuard.findOneAndUpdate(
      { session_token, is_active: true },
      { last_activity: new Date() },
      { new: true }
    );
    
    if (!sesion) {
      return res.status(404).json({ 
        error: 'Sesión no encontrada o inactiva',
        session_expired: true
      });
    }
    
    res.json({ 
      message: 'Heartbeat registrado',
      last_activity: sesion.last_activity
    });
  } catch (err) {
    res.status(500).json({ error: 'Error en heartbeat', details: err.message });
  }
});

// Finalizar sesión
app.post('/sesiones/finalizar', async (req, res) => {
  try {
    const { session_token } = req.body;
    
    const sesion = await SessionGuard.findOneAndUpdate(
      { session_token, is_active: true },
      { 
        is_active: false,
        fecha_fin: new Date()
      },
      { new: true }
    );
    
    if (!sesion) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
    res.json({ message: 'Sesión finalizada exitosamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al finalizar sesión', details: err.message });
  }
});

// Obtener sesiones activas
app.get('/sesiones/activas', async (req, res) => {
  try {
    const sesionesActivas = await SessionGuard.find({ is_active: true });
    res.json(sesionesActivas);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener sesiones activas' });
  }
});

// Forzar finalización de sesión (para administradores)
app.post('/sesiones/forzar-finalizacion', async (req, res) => {
  try {
    const { guardia_id, admin_id } = req.body;
    
    // Verificar que quien hace la petición es admin
    const admin = await User.findOne({ _id: admin_id, rango: 'admin' });
    if (!admin) {
      return res.status(403).json({ error: 'Solo administradores pueden forzar finalización' });
    }
    
    const resultado = await SessionGuard.updateMany(
      { guardia_id, is_active: true },
      { 
        is_active: false,
        fecha_fin: new Date()
      }
    );
    
    res.json({ 
      message: 'Sesiones finalizadas por administrador',
      sessions_affected: resultado.modifiedCount
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al forzar finalización', details: err.message });
  }
});

// ==================== ENDPOINTS ASISTENCIAS EXISTENTES ====================

// ==================== COLA Y PROCESAMIENTO SECUENCIAL DE ASISTENCIAS ====================
const asistenciaQueue = [];
let processing = false;

async function processAsistenciaQueue() {
  if (processing) return;
  processing = true;
  while (asistenciaQueue.length > 0) {
    const { req, res } = asistenciaQueue.shift();
    try {
      const asistencia = new Asistencia(req.body);
      await asistencia.save();
      res.status(201).json(asistencia);
    } catch (err) {
      res.status(500).json({ error: 'Error al registrar asistencia', details: err.message });
    }
  }
  processing = false;
}

// Endpoint para crear nueva asistencia (procesamiento encolado y secuencial)
app.post('/asistencias', (req, res) => {
  asistenciaQueue.push({ req, res });
  processAsistenciaQueue();
});

// ==================== ENDPOINTS VISITAS ====================

// Ruta para crear nueva visita
app.post('/visitas', async (req, res) => {
  try {
    const visita = new Visita(req.body);
    await visita.save();
    res.status(201).json(visita);
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar visita', details: err.message });
  }
});

// Ruta para obtener todas las visitas
app.get('/visitas', async (req, res) => {
  try {
    const visitas = await Visita.find();
    res.json(visitas);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener visitas' });
  }
});

// ==================== ENDPOINTS DE SINCRONIZACIÓN Y BACKUP ====================

// Sincronización bidireccional - obtener cambios desde timestamp
// ==================== ENDPOINTS DE SINCRONIZACIÓN BIDIRECCIONAL ====================

// Importar servicio de sincronización bidireccional
const BidirectionalSyncService = require('./services/bidirectional_sync_service');

// Instancia de servicio
const syncService = new BidirectionalSyncService(
  DataVersion,
  DeviceSync,
  PendingChange,
  Asistencia,
  Presencia
);

// Registrar dispositivo
app.post('/sync/register-device', async (req, res) => {
  try {
    const { device_id, device_name, device_type, app_version } = req.body;
    
    if (!device_id) {
      return res.status(400).json({ error: 'device_id es requerido' });
    }

    const device = await syncService.registerDevice(device_id, {
      device_name,
      device_type,
      app_version
    });

    res.json({
      success: true,
      device,
      sync_token: device.sync_token
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error registrando dispositivo', 
      details: err.message 
    });
  }
});

// Obtener cambios del servidor (pull)
app.get('/sync/pull', async (req, res) => {
  try {
    const { device_id, last_sync, collections } = req.query;
    
    if (!device_id) {
      return res.status(400).json({ error: 'device_id es requerido' });
    }

    const collectionsArray = collections ? collections.split(',') : [];
    const lastSync = last_sync ? new Date(last_sync) : null;

    const result = await syncService.getServerChanges(device_id, lastSync, collectionsArray);

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo cambios del servidor', 
      details: err.message 
    });
  }
});

// Subir cambios del cliente (push)
app.post('/sync/push', async (req, res) => {
  try {
    const { device_id, changes } = req.body;
    
    if (!device_id || !changes) {
      return res.status(400).json({ 
        error: 'device_id y changes son requeridos' 
      });
    }

    const result = await syncService.uploadClientChanges(device_id, changes);

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error subiendo cambios', 
      details: err.message 
    });
  }
});

// Sincronización bidireccional completa
app.post('/sync/bidirectional', async (req, res) => {
  try {
    const { 
      device_id, 
      device_info, 
      last_sync, 
      client_changes 
    } = req.body;
    
    if (!device_id) {
      return res.status(400).json({ error: 'device_id es requerido' });
    }

    const result = await syncService.performBidirectionalSync(
      device_id,
      device_info || {},
      last_sync ? new Date(last_sync) : null,
      client_changes || []
    );

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error en sincronización bidireccional', 
      details: err.message 
    });
  }
});

// Obtener conflictos pendientes
app.get('/sync/conflicts', async (req, res) => {
  try {
    const { device_id } = req.query;
    
    const conflicts = await syncService.getPendingConflicts(device_id || null);

    res.json({
      success: true,
      conflicts,
      count: conflicts.length
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo conflictos', 
      details: err.message 
    });
  }
});

// Resolver conflicto
app.post('/sync/conflicts/:conflictId/resolve', async (req, res) => {
  try {
    const { conflictId } = req.params;
    const { strategy, resolved_by, resolution_data } = req.body;
    
    if (!strategy || !resolved_by) {
      return res.status(400).json({ 
        error: 'strategy y resolved_by son requeridos' 
      });
    }

    const result = await syncService.resolveConflict(
      conflictId,
      strategy,
      resolved_by,
      resolution_data
    );

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error resolviendo conflicto', 
      details: err.message 
    });
  }
});

// Obtener versión de un registro
app.get('/sync/version/:collection/:recordId', async (req, res) => {
  try {
    const { collection, recordId } = req.params;
    
    const version = await syncService.getOrCreateVersion(collection, recordId);

    res.json({
      success: true,
      version
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo versión', 
      details: err.message 
    });
  }
});

// Endpoints legacy (mantener compatibilidad)
app.get('/sync/changes/:timestamp', async (req, res) => {
  try {
    const timestamp = new Date(req.params.timestamp);
    
    const changes = {
      asistencias: await Asistencia.find({ fecha_hora: { $gte: timestamp } }),
      usuarios: await Usuario.find({ updatedAt: { $gte: timestamp } }),
      decisiones_manuales: await DecisionManual.find({ fecha_hora: { $gte: timestamp } }),
      presencias: await Presencia.find({ ultima_actualizacion: { $gte: timestamp } })
    };
    
    res.json({
      timestamp: new Date(),
      changes: changes
    });
  } catch (err) {
    res.status(500).json({ error: 'Error en sincronización', details: err.message });
  }
});

app.post('/sync/upload', async (req, res) => {
  try {
    const { changes } = req.body;
    const conflicts = [];
    const processed = {
      asistencias: 0,
      usuarios: 0,
      decisiones_manuales: 0
    };

    // Procesar asistencias
    if (changes.asistencias) {
      for (let asistencia of changes.asistencias) {
        try {
          await Asistencia.findByIdAndUpdate(
            asistencia._id,
            asistencia,
            { upsert: true, new: true }
          );
          processed.asistencias++;
        } catch (error) {
          conflicts.push({
            type: 'asistencia',
            id: asistencia._id,
            error: error.message
          });
        }
      }
    }

    res.json({
      success: true,
      processed: processed,
      conflicts: conflicts,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ error: 'Error procesando sincronización', details: err.message });
  }
});

// Backup automático de datos
app.post('/backup/create', async (req, res) => {
  try {
    const backupData = {
      timestamp: new Date(),
      version: '1.0',
      collections: {
        asistencias: await Asistencia.find(),
        usuarios: await Usuario.find(),
        alumnos: await Alumno.find(),
        decisiones_manuales: await DecisionManual.find(),
        presencias: await Presencia.find(),
        sesiones_guardias: await SesionGuardia.find()
      }
    };

    res.json({
      success: true,
      backup_id: `backup_${Date.now()}`,
      size: JSON.stringify(backupData).length,
      collections_count: Object.keys(backupData.collections).length,
      timestamp: backupData.timestamp
    });
  } catch (err) {
    res.status(500).json({ error: 'Error creando backup', details: err.message });
  }
});

// ==================== ENDPOINTS DE REPORTES ====================

// Reporte de asistencias por rango de fechas
app.get('/reportes/asistencias', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, carrera, facultad } = req.query;
    
    let query = {};
    
    // Filtro por fechas
    if (fecha_inicio || fecha_fin) {
      query.fecha_hora = {};
      if (fecha_inicio) query.fecha_hora.$gte = new Date(fecha_inicio);
      if (fecha_fin) query.fecha_hora.$lte = new Date(fecha_fin);
    }
    
    // Filtros adicionales
    if (carrera) query.siglas_escuela = carrera;
    if (facultad) query.siglas_facultad = facultad;
    
    const asistencias = await Asistencia.find(query).sort({ fecha_hora: -1 });
    
    // Estadísticas del reporte
    const stats = {
      total_registros: asistencias.length,
      entradas: asistencias.filter(a => a.tipo_movimiento === 'entrada').length,
      salidas: asistencias.filter(a => a.tipo_movimiento === 'salida').length,
      por_facultad: {}
    };
    
    // Agrupar por facultad
    asistencias.forEach(a => {
      const fac = a.siglas_facultad || 'Sin especificar';
      stats.por_facultad[fac] = (stats.por_facultad[fac] || 0) + 1;
    });
    
    res.json({
      data: asistencias,
      estadisticas: stats,
      filtros_aplicados: { fecha_inicio, fecha_fin, carrera, facultad },
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ error: 'Error generando reporte', details: err.message });
  }
});

// Reporte de actividad de guardias
app.get('/reportes/guardias', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    
    let query = {};
    if (fecha_inicio || fecha_fin) {
      query.inicio_sesion = {};
      if (fecha_inicio) query.inicio_sesion.$gte = new Date(fecha_inicio);
      if (fecha_fin) query.inicio_sesion.$lte = new Date(fecha_fin);
    }
    
    const sesiones = await SesionGuardia.find(query).sort({ inicio_sesion: -1 });
    const decisiones = await DecisionManual.find(query).sort({ fecha_hora: -1 });
    
    // Estadísticas por guardia
    const stats_guardias = {};
    
    sesiones.forEach(s => {
      if (!stats_guardias[s.guardia_id]) {
        stats_guardias[s.guardia_id] = {
          nombre: s.guardia_nombre,
          sesiones_total: 0,
          tiempo_total_minutos: 0,
          decisiones_manuales: 0
        };
      }
      
      stats_guardias[s.guardia_id].sesiones_total++;
      
      if (s.fin_sesion) {
        const duracion = (new Date(s.fin_sesion) - new Date(s.inicio_sesion)) / (1000 * 60);
        stats_guardias[s.guardia_id].tiempo_total_minutos += duracion;
      }
    });
    
    // Contar decisiones manuales por guardia
    decisiones.forEach(d => {
      if (stats_guardias[d.guardia_id]) {
        stats_guardias[d.guardia_id].decisiones_manuales++;
      }
    });
    
    res.json({
      sesiones: sesiones,
      estadisticas_guardias: stats_guardias,
      resumen: {
        total_sesiones: sesiones.length,
        total_decisiones_manuales: decisiones.length,
        guardias_activos: Object.keys(stats_guardias).length
      },
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ error: 'Error generando reporte de guardias', details: err.message });
  }
});

// ==================== ENDPOINTS DE MACHINE LEARNING ====================

// Importar servicios de ML
const DatasetCollector = require('./ml/dataset_collector');
const TrainTestSplit = require('./ml/train_test_split');
const TrainingPipeline = require('./ml/training_pipeline');
const ModelValidator = require('./ml/model_validator');
const fs = require('fs').promises;
const path = require('path');

// Instancias de servicios ML (pasar modelo Asistencia)
const datasetCollector = new DatasetCollector(Asistencia);
const trainingPipeline = new TrainingPipeline({ collector: datasetCollector });

// Validar disponibilidad de dataset (≥3 meses)
app.get('/ml/dataset/validate', async (req, res) => {
  try {
    const validation = await datasetCollector.validateDatasetAvailability();
    const statistics = await datasetCollector.getDatasetStatistics();
    
    res.json({
      success: true,
      validation,
      statistics,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error validando dataset', 
      details: err.message 
    });
  }
});

// Recopilar dataset histórico
app.post('/ml/dataset/collect', async (req, res) => {
  try {
    const { months = 3, includeFeatures = true, outputFormat = 'json' } = req.body;
    
    const result = await datasetCollector.collectHistoricalDataset({
      months,
      includeFeatures,
      outputFormat
    });
    
    res.json({
      success: true,
      ...result,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error recopilando dataset', 
      details: err.message 
    });
  }
});

// Obtener estadísticas del dataset
app.get('/ml/dataset/statistics', async (req, res) => {
  try {
    const statistics = await datasetCollector.getDatasetStatistics();
    
    res.json({
      success: true,
      statistics,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo estadísticas', 
      details: err.message 
    });
  }
});

// Ejecutar pipeline completo de entrenamiento
app.post('/ml/pipeline/train', async (req, res) => {
  try {
    const { 
      months = 3, 
      testSize = 0.2, 
      modelType = 'logistic_regression',
      stratify = 'target'
    } = req.body;
    
    // Ejecutar pipeline asíncrono (puede tardar)
    res.json({
      success: true,
      message: 'Pipeline de entrenamiento iniciado. Verifique el endpoint /ml/pipeline/status para el progreso.',
      timestamp: new Date()
    });
    
    // Ejecutar en segundo plano
    trainingPipeline.executePipeline({
      months,
      testSize,
      modelType,
      stratify,
      collector: datasetCollector
    }).then(result => {
      console.log('✅ Pipeline completado:', result);
    }).catch(error => {
      console.error('❌ Error en pipeline:', error);
    });
    
  } catch (err) {
    res.status(500).json({ 
      error: 'Error iniciando pipeline', 
      details: err.message 
    });
  }
});

// Obtener modelos entrenados disponibles
app.get('/ml/models', async (req, res) => {
  try {
    const modelsDir = path.join(__dirname, 'data/models');
    
    try {
      const files = await fs.readdir(modelsDir);
      const models = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(modelsDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const modelData = JSON.parse(content);
          
          models.push({
            filename: file,
            modelType: modelData.modelType,
            createdAt: modelData.createdAt,
            version: modelData.version,
            validation: {
              accuracy: modelData.validation?.accuracy,
              f1Score: modelData.validation?.f1Score
            }
          });
        }
      }
      
      res.json({
        success: true,
        models,
        count: models.length,
        timestamp: new Date()
      });
    } catch (err) {
      if (err.code === 'ENOENT') {
        res.json({
          success: true,
          models: [],
          count: 0,
          message: 'No hay modelos entrenados aún',
          timestamp: new Date()
        });
      } else {
        throw err;
      }
    }
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo modelos', 
      details: err.message 
    });
  }
});

// Hacer predicción con modelo entrenado
app.post('/ml/models/predict', async (req, res) => {
  try {
    const { modelFilename, features } = req.body;
    
    if (!modelFilename || !features) {
      return res.status(400).json({ 
        error: 'modelFilename y features son requeridos' 
      });
    }
    
    const modelPath = path.join(__dirname, 'data/models', modelFilename);
    const modelContent = await fs.readFile(modelPath, 'utf8');
    const modelData = JSON.parse(modelContent);
    
    // Realizar predicción (simplificada)
    const prediction = predictWithModel(modelData.model, features, modelData.features);
    
    res.json({
      success: true,
      prediction,
      modelType: modelData.modelType,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error en predicción', 
      details: err.message 
    });
  }
});

// Función auxiliar para predicción
function predictWithModel(model, features, featureNames) {
  // Implementación simplificada
  if (model.type === 'logistic_regression' || model.weights) {
    const linearCombination = features.reduce((sum, val, i) => 
      sum + val * (model.weights[i] || 0), 0) + (model.bias || 0);
    const probability = 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, linearCombination))));
    return {
      prediction: probability >= 0.5 ? 1 : 0,
      probability: probability,
      confidence: Math.abs(probability - 0.5) * 2
    };
  }
  
  return { prediction: 0, probability: 0.5, confidence: 0 };
}

// ==================== ENDPOINTS DE REPORTES DE HORARIOS PICO ML ====================

// Importar servicio de reportes de horarios pico
const PeakHoursReportService = require('./ml/peak_hours_report_service');

// Instancia del servicio
const peakHoursReportService = new PeakHoursReportService(Asistencia);

// Generar reporte completo de horarios pico con ML
app.get('/ml/reports/peak-hours', async (req, res) => {
  try {
    const { startDate, endDate, days } = req.query;
    
    let dateRange;
    if (startDate && endDate) {
      dateRange = { startDate, endDate };
    } else if (days) {
      dateRange = { days: parseInt(days) };
    } else {
      dateRange = { days: 7 }; // Última semana por defecto
    }

    const report = await peakHoursReportService.generatePeakHoursReport(dateRange, {
      includeComparison: true,
      includeSuggestions: true,
      includeHourlyMetrics: true
    });

    res.json({
      success: true,
      report,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error generando reporte de horarios pico', 
      details: err.message 
    });
  }
});

// Obtener comparación ML vs Real
app.get('/ml/reports/comparison', async (req, res) => {
  try {
    const { startDate, endDate, days } = req.query;
    
    let dateRange;
    if (startDate && endDate) {
      dateRange = { startDate, endDate };
    } else if (days) {
      dateRange = { days: parseInt(days) };
    } else {
      dateRange = { days: 7 };
    }

    // Generar predicciones
    const PeakHoursPredictor = require('./ml/peak_hours_predictor');
    const predictor = new PeakHoursPredictor(null, Asistencia);
    await predictor.loadLatestModel();
    const predictions = await predictor.predictPeakHours(dateRange);

    // Comparar con datos reales
    const MLRealComparison = require('./ml/ml_real_comparison');
    const comparison = new MLRealComparison(Asistencia);
    const result = await comparison.compareMLvsReal(predictions.predictions, predictions.dateRange);

    res.json({
      success: true,
      comparison: result,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error comparando ML vs Real', 
      details: err.message 
    });
  }
});

// Obtener métricas de precisión por horario
app.get('/ml/reports/hourly-metrics', async (req, res) => {
  try {
    const { startDate, endDate, days } = req.query;
    
    let dateRange;
    if (startDate && endDate) {
      dateRange = { startDate, endDate };
    } else if (days) {
      dateRange = { days: parseInt(days) };
    } else {
      dateRange = { days: 7 };
    }

    const report = await peakHoursReportService.generatePeakHoursReport(dateRange, {
      includeComparison: true,
      includeSuggestions: false,
      includeHourlyMetrics: true
    });

    res.json({
      success: true,
      hourlyMetrics: report.hourlyMetrics,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo métricas por horario', 
      details: err.message 
    });
  }
});

// Obtener sugerencias de ajuste
app.get('/ml/reports/suggestions', async (req, res) => {
  try {
    const { startDate, endDate, days } = req.query;
    
    let dateRange;
    if (startDate && endDate) {
      dateRange = { startDate, endDate };
    } else if (days) {
      dateRange = { days: parseInt(days) };
    } else {
      dateRange = { days: 7 };
    }

    const report = await peakHoursReportService.generatePeakHoursReport(dateRange, {
      includeComparison: true,
      includeSuggestions: true,
      includeHourlyMetrics: false
    });

    res.json({
      success: true,
      suggestions: report.suggestions,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo sugerencias', 
      details: err.message 
    });
  }
});

// Obtener resumen para dashboard
app.get('/ml/reports/dashboard-summary', async (req, res) => {
  try {
    const { startDate, endDate, days } = req.query;
    
    let dateRange;
    if (startDate && endDate) {
      dateRange = { startDate, endDate };
    } else if (days) {
      dateRange = { days: parseInt(days) };
    } else {
      dateRange = { days: 7 };
    }

    const summary = await peakHoursReportService.getDashboardSummary(dateRange);

    res.json({
      success: true,
      summary,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo resumen del dashboard', 
      details: err.message 
    });
  }
});

// ==================== ENDPOINTS DE DASHBOARD DE MONITOREO ML ====================

// Importar servicios de monitoreo ML
const MLMonitoringDashboard = require('./ml/ml_monitoring_dashboard');
const MLMetricsService = require('./ml/ml_metrics_service');
const TemporalMetricsEvolution = require('./ml/temporal_metrics_evolution');

// Instancias de servicios
const mlDashboard = new MLMonitoringDashboard(Asistencia);
const mlMetricsService = new MLMetricsService(Asistencia);
const temporalEvolution = new TemporalMetricsEvolution();

// Dashboard completo de monitoreo ML
app.get('/ml/dashboard', async (req, res) => {
  try {
    const { startDate, endDate, days, evolutionDays = 30 } = req.query;
    
    let dateRange;
    if (startDate && endDate) {
      dateRange = { startDate, endDate };
    } else if (days) {
      dateRange = { days: parseInt(days) };
    } else {
      dateRange = { days: 7 }; // Última semana por defecto
    }

    const dashboard = await mlDashboard.generateDashboard(dateRange, {
      includeEvolution: true,
      evolutionDays: parseInt(evolutionDays),
      includeComparison: true,
      includeDetailedMetrics: true
    });

    res.json({
      success: true,
      dashboard,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error generando dashboard de monitoreo ML', 
      details: err.message 
    });
  }
});

// Resumen rápido del dashboard
app.get('/ml/dashboard/summary', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const summary = await mlDashboard.getQuickSummary(parseInt(days));

    res.json({
      success: true,
      summary,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo resumen del dashboard', 
      details: err.message 
    });
  }
});

// Obtener métricas actuales
app.get('/ml/metrics/current', async (req, res) => {
  try {
    const { startDate, endDate, days } = req.query;
    
    let dateRange;
    if (startDate && endDate) {
      dateRange = { startDate, endDate };
    } else if (days) {
      dateRange = { days: parseInt(days) };
    } else {
      dateRange = { days: 7 };
    }

    // Obtener comparación
    const PeakHoursPredictor = require('./ml/peak_hours_predictor');
    const predictor = new PeakHoursPredictor(null, Asistencia);
    await predictor.loadLatestModel();
    
    const predictions = await predictor.predictPeakHours(dateRange);
    const comparison = await mlDashboard.comparison.compareMLvsReal(
      predictions.predictions,
      predictions.dateRange
    );

    // Calcular métricas
    const metrics = mlMetricsService.generateMetricsReport(comparison);

    res.json({
      success: true,
      metrics,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo métricas actuales', 
      details: err.message 
    });
  }
});

// Obtener evolución temporal de métricas
app.get('/ml/metrics/evolution', async (req, res) => {
  try {
    const { metric = 'f1Score', days = 30 } = req.query;
    
    const evolution = await temporalEvolution.getMetricEvolution(metric, parseInt(days));

    res.json({
      success: true,
      evolution,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo evolución de métricas', 
      details: err.message 
    });
  }
});

// Obtener evolución de múltiples métricas
app.get('/ml/metrics/evolution/multiple', async (req, res) => {
  try {
    const { metrics = 'accuracy,precision,recall,f1Score', days = 30 } = req.query;
    
    const metricNames = metrics.split(',').map(m => m.trim());
    const evolutions = await temporalEvolution.getMultipleMetricsEvolution(
      metricNames,
      parseInt(days)
    );

    res.json({
      success: true,
      evolutions,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo evolución de métricas múltiples', 
      details: err.message 
    });
  }
});

// Obtener historial completo de métricas
app.get('/ml/metrics/history', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    const history = await temporalEvolution.getAllMetricsHistory(parseInt(limit));

    res.json({
      success: true,
      history,
      count: history.length,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo historial de métricas', 
      details: err.message 
    });
  }
});

// Obtener última métrica guardada
app.get('/ml/metrics/latest', async (req, res) => {
  try {
    const latest = await temporalEvolution.getLatestMetrics();

    res.json({
      success: true,
      latest: latest || null,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo última métrica', 
      details: err.message 
    });
  }
});

// Comparar métricas actuales con históricas
app.get('/ml/metrics/compare-history', async (req, res) => {
  try {
    const { startDate, endDate, days = 7, comparisonDays = 30 } = req.query;
    
    let dateRange;
    if (startDate && endDate) {
      dateRange = { startDate, endDate };
    } else if (days) {
      dateRange = { days: parseInt(days) };
    } else {
      dateRange = { days: 7 };
    }

    // Obtener métricas actuales
    const PeakHoursPredictor = require('./ml/peak_hours_predictor');
    const predictor = new PeakHoursPredictor(null, Asistencia);
    await predictor.loadLatestModel();
    
    const predictions = await predictor.predictPeakHours(dateRange);
    const comparison = await mlDashboard.comparison.compareMLvsReal(
      predictions.predictions,
      predictions.dateRange
    );

    const metrics = mlMetricsService.generateMetricsReport(comparison);

    // Comparar con historial
    const historicalComparison = await temporalEvolution.compareWithHistory(
      metrics,
      parseInt(comparisonDays)
    );

    res.json({
      success: true,
      current: metrics.summary,
      comparison: historicalComparison,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error comparando con historial', 
      details: err.message 
    });
  }
});

// Obtener alertas del modelo
app.get('/ml/dashboard/alerts', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const dateRange = { days: parseInt(days) };
    const dashboard = await mlDashboard.generateDashboard(dateRange, {
      includeEvolution: true,
      evolutionDays: 30,
      includeComparison: true,
      includeDetailedMetrics: true
    });

    res.json({
      success: true,
      alerts: dashboard.dashboard.alerts,
      count: dashboard.dashboard.alerts.length,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo alertas', 
      details: err.message 
    });
  }
});

// Obtener recomendaciones
app.get('/ml/dashboard/recommendations', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const dateRange = { days: parseInt(days) };
    const dashboard = await mlDashboard.generateDashboard(dateRange, {
      includeEvolution: true,
      evolutionDays: 30,
      includeComparison: true,
      includeDetailedMetrics: true
    });

    res.json({
      success: true,
      recommendations: dashboard.dashboard.recommendations,
      count: dashboard.dashboard.recommendations.length,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo recomendaciones', 
      details: err.message 
    });
  }
});

// ==================== ENDPOINTS DE VISUALIZACIÓN DE PREDICCIONES ML ====================

// Importar servicios de visualización y actualización
const PredictionVisualizationService = require('./ml/prediction_visualization_service');
const AutoModelUpdateService = require('./ml/auto_model_update_service');

// Instancias de servicios
const visualizationService = new PredictionVisualizationService(Asistencia);
const autoUpdateService = new AutoModelUpdateService(Asistencia);

// Cargar historial de actualizaciones al iniciar
autoUpdateService.loadUpdateHistory().catch(err => 
  console.warn('Error cargando historial de actualizaciones:', err.message)
);

// Generar datos de visualización para gráficos
app.get('/ml/visualization/data', async (req, res) => {
  try {
    const { startDate, endDate, days, granularity = 'hour' } = req.query;
    
    let dateRange;
    if (startDate && endDate) {
      dateRange = { startDate, endDate };
    } else if (days) {
      dateRange = { days: parseInt(days) };
    } else {
      dateRange = { days: 7 };
    }

    const data = await visualizationService.generateVisualizationData(dateRange, {
      granularity,
      includeConfidenceIntervals: true,
      includeRealData: true
    });

    res.json({
      success: true,
      data,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error generando datos de visualización', 
      details: err.message 
    });
  }
});

// Generar datos para gráfico de líneas (predicción vs real)
app.get('/ml/visualization/line-chart', async (req, res) => {
  try {
    const { startDate, endDate, days } = req.query;
    
    let dateRange;
    if (startDate && endDate) {
      dateRange = { startDate, endDate };
    } else if (days) {
      dateRange = { days: parseInt(days) };
    } else {
      dateRange = { days: 7 };
    }

    const chartData = await visualizationService.generateLineChartData(dateRange);

    res.json({
      success: true,
      chartData,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error generando gráfico de líneas', 
      details: err.message 
    });
  }
});

// Generar datos para gráfico de barras (comparación diaria)
app.get('/ml/visualization/bar-chart', async (req, res) => {
  try {
    const { startDate, endDate, days } = req.query;
    
    let dateRange;
    if (startDate && endDate) {
      dateRange = { startDate, endDate };
    } else if (days) {
      dateRange = { days: parseInt(days) };
    } else {
      dateRange = { days: 7 };
    }

    const chartData = await visualizationService.generateBarChartData(dateRange);

    res.json({
      success: true,
      chartData,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error generando gráfico de barras', 
      details: err.message 
    });
  }
});

// Obtener datos con intervalos de confianza
app.get('/ml/visualization/confidence-intervals', async (req, res) => {
  try {
    const { startDate, endDate, days, confidenceLevel = 0.95 } = req.query;
    
    let dateRange;
    if (startDate && endDate) {
      dateRange = { startDate, endDate };
    } else if (days) {
      dateRange = { days: parseInt(days) };
    } else {
      dateRange = { days: 7 };
    }

    const data = await visualizationService.generateVisualizationData(dateRange, {
      granularity: 'hour',
      includeConfidenceIntervals: true,
      includeRealData: true
    });

    res.json({
      success: true,
      confidenceIntervals: data.confidenceIntervals,
      chartData: data.chartData.filter(d => d.confidenceInterval !== null),
      confidenceLevel: parseFloat(confidenceLevel),
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo intervalos de confianza', 
      details: err.message 
    });
  }
});

// ==================== ENDPOINTS DE ACTUALIZACIÓN AUTOMÁTICA ====================

// Configurar actualización automática
app.post('/ml/auto-update/configure', async (req, res) => {
  try {
    const config = req.body;
    
    const result = autoUpdateService.configureAutoUpdate(config);

    res.json({
      success: true,
      ...result,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error configurando actualización automática', 
      details: err.message 
    });
  }
});

// Obtener configuración de actualización automática
app.get('/ml/auto-update/config', async (req, res) => {
  try {
    const config = autoUpdateService.getConfig();

    res.json({
      success: true,
      config,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo configuración', 
      details: err.message 
    });
  }
});

// Verificar datos nuevos para actualización
app.get('/ml/auto-update/check', async (req, res) => {
  try {
    const { days } = req.query;
    
    const checkResult = await autoUpdateService.checkForNewData(
      days ? parseInt(days) : null
    );

    res.json({
      success: true,
      check: checkResult,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error verificando datos nuevos', 
      details: err.message 
    });
  }
});

// Ejecutar verificación y actualización automática
app.post('/ml/auto-update/execute', async (req, res) => {
  try {
    const result = await autoUpdateService.performAutoUpdateCheck();

    res.json({
      success: true,
      result,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error ejecutando actualización automática', 
      details: err.message 
    });
  }
});

// Programar actualización automática
app.post('/ml/auto-update/schedule', async (req, res) => {
  try {
    const schedule = autoUpdateService.scheduleAutoUpdate();

    res.json({
      success: true,
      schedule,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error programando actualización', 
      details: err.message 
    });
  }
});

// Obtener estadísticas de actualizaciones
app.get('/ml/auto-update/statistics', async (req, res) => {
  try {
    const stats = autoUpdateService.getUpdateStatistics();

    res.json({
      success: true,
      statistics: stats,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo estadísticas', 
      details: err.message 
    });
  }
});

// Ejecutar actualización manual
app.post('/ml/auto-update/manual', async (req, res) => {
  try {
    const { months = 3, testSize = 0.2, modelType = 'logistic_regression' } = req.body;
    
    // Ejecutar en segundo plano
    res.json({
      success: true,
      message: 'Actualización manual iniciada. Verifique el endpoint /ml/auto-update/statistics para el progreso.',
      timestamp: new Date()
    });

    autoUpdateService.executeManualUpdate({
      months,
      testSize,
      modelType
    }).then(result => {
      console.log('✅ Actualización manual completada:', result);
    }).catch(error => {
      console.error('❌ Error en actualización manual:', error);
    });
    
  } catch (err) {
    res.status(500).json({ 
      error: 'Error iniciando actualización manual', 
      details: err.message 
    });
  }
});

// ==================== ENDPOINTS DE REGRESIÓN LINEAL ====================

// Importar servicios de regresión lineal
const LinearRegressionService = require('./ml/linear_regression_service');
const CrossValidation = require('./ml/cross_validation');
const ParameterOptimizer = require('./ml/parameter_optimizer');

// Instancia del servicio
const linearRegressionService = new LinearRegressionService(Asistencia);

// Entrenar modelo de regresión lineal
app.post('/ml/regression/train', async (req, res) => {
  try {
    const {
      months = 3,
      featureColumns = null,
      targetColumn = 'target',
      testSize = 0.2,
      optimizeParams = true,
      cvFolds = 5,
      targetR2 = 0.7
    } = req.body;

    res.json({
      success: true,
      message: 'Entrenamiento de regresión lineal iniciado. Verifique el endpoint /ml/regression/status para el progreso.',
      timestamp: new Date()
    });

    // Ejecutar en segundo plano
    linearRegressionService.trainRegressionModel({
      months,
      featureColumns,
      targetColumn,
      testSize,
      optimizeParams,
      cvFolds,
      targetR2
    }).then(result => {
      console.log('✅ Regresión lineal entrenada:', result);
    }).catch(error => {
      console.error('❌ Error en entrenamiento:', error);
    });

  } catch (err) {
    res.status(500).json({ 
      error: 'Error iniciando entrenamiento de regresión lineal', 
      details: err.message 
    });
  }
});

// Obtener métricas del modelo de regresión
app.get('/ml/regression/metrics', async (req, res) => {
  try {
    const metrics = await linearRegressionService.getModelMetrics();

    res.json({
      success: true,
      metrics,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo métricas de regresión', 
      details: err.message 
    });
  }
});

// Realizar predicción con modelo de regresión
app.post('/ml/regression/predict', async (req, res) => {
  try {
    const { features } = req.body;

    if (!features || !Array.isArray(features)) {
      return res.status(400).json({ 
        error: 'features debe ser un array' 
      });
    }

    const prediction = await linearRegressionService.predict(features);

    res.json({
      success: true,
      prediction: Array.isArray(prediction) ? prediction : [prediction],
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error en predicción de regresión', 
      details: err.message 
    });
  }
});

// Ejecutar validación cruzada
app.post('/ml/regression/cross-validate', async (req, res) => {
  try {
    const {
      months = 3,
      featureColumns = null,
      targetColumn = 'target',
      k = 5,
      modelOptions = {}
    } = req.body;

    // Recopilar dataset
    const collectionResult = await linearRegressionService.collector.collectHistoricalDataset({
      months,
      includeFeatures: true,
      outputFormat: 'json'
    });

    const datasetContent = await fs.readFile(collectionResult.filepath, 'utf8');
    const dataset = JSON.parse(datasetContent);

    // Preparar datos
    const features = featureColumns || linearRegressionService.detectFeatureColumns(dataset);
    const { X, y } = linearRegressionService.prepareRegressionData(dataset, features, targetColumn);

    // Ejecutar validación cruzada
    const cvValidator = new CrossValidation({ k });
    const cvResults = cvValidator.crossValidateMultipleMetrics(X, y, modelOptions);

    res.json({
      success: true,
      crossValidation: cvResults,
      meetsR2Threshold: cvResults.summary.r2 >= 0.7,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error en validación cruzada', 
      details: err.message 
    });
  }
});

// Optimizar parámetros del modelo
app.post('/ml/regression/optimize', async (req, res) => {
  try {
    const {
      months = 3,
      featureColumns = null,
      targetColumn = 'target',
      cvFolds = 5,
      targetR2 = 0.7,
      method = 'grid' // 'grid' o 'random'
    } = req.body;

    // Recopilar dataset
    const collectionResult = await linearRegressionService.collector.collectHistoricalDataset({
      months,
      includeFeatures: true,
      outputFormat: 'json'
    });

    const datasetContent = await fs.readFile(collectionResult.filepath, 'utf8');
    const dataset = JSON.parse(datasetContent);

    // Preparar datos
    const features = featureColumns || linearRegressionService.detectFeatureColumns(dataset);
    const { X, y } = linearRegressionService.prepareRegressionData(dataset, features, targetColumn);

    // Optimizar parámetros
    const optimizer = new ParameterOptimizer();
    
    let optimizationResult;
    if (method === 'random') {
      optimizationResult = optimizer.randomSearch(X, y, {}, 20, cvFolds);
    } else {
      optimizationResult = optimizer.optimizeForR2(X, y, targetR2, cvFolds);
    }

    res.json({
      success: true,
      optimization: optimizationResult,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error optimizando parámetros', 
      details: err.message 
    });
  }
});

// Evaluar modelo con conjunto de prueba
app.post('/ml/regression/evaluate', async (req, res) => {
  try {
    const {
      months = 3,
      featureColumns = null,
      targetColumn = 'target',
      testSize = 0.2
    } = req.body;

    // Recopilar dataset
    const collectionResult = await linearRegressionService.collector.collectHistoricalDataset({
      months,
      includeFeatures: true,
      outputFormat: 'json'
    });

    const datasetContent = await fs.readFile(collectionResult.filepath, 'utf8');
    const dataset = JSON.parse(datasetContent);

    // Preparar datos
    const features = featureColumns || linearRegressionService.detectFeatureColumns(dataset);
    const { X, y } = linearRegressionService.prepareRegressionData(dataset, features, targetColumn);

    // Split train/test
    const splitIndex = Math.floor(X.length * (1 - testSize));
    const X_test = X.slice(splitIndex);
    const y_test = y.slice(splitIndex);

    // Evaluar
    const evaluation = await linearRegressionService.evaluateModel(
      X_test.map((x, i) => {
        const row = {};
        features.forEach((feat, j) => {
          row[feat] = x[j];
        });
        row[targetColumn] = y_test[i];
        return row;
      })
    );

    res.json({
      success: true,
      evaluation,
      testSize: X_test.length,
      meetsR2Threshold: evaluation.r2 >= 0.7,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error evaluando modelo', 
      details: err.message 
    });
  }
});

// ==================== ENDPOINTS DE PREDICCIÓN DE HORARIOS PICO ====================

// Importar modelo predictivo de horarios pico
const PeakHoursPredictiveModel = require('./ml/peak_hours_predictive_model');

// Instancia del modelo predictivo
const peakHoursPredictiveModel = new PeakHoursPredictiveModel(Asistencia);

// Entrenar modelo predictivo de horarios pico
app.post('/ml/prediction/peak-hours/train', async (req, res) => {
  try {
    const {
      months = 3,
      testSize = 0.2,
      optimizeParams = true,
      cvFolds = 5,
      targetAccuracy = 0.8
    } = req.body;

    res.json({
      success: true,
      message: 'Entrenamiento de modelo predictivo iniciado. Verifique el endpoint /ml/prediction/peak-hours/metrics para el progreso.',
      timestamp: new Date()
    });

    // Ejecutar en segundo plano
    peakHoursPredictiveModel.trainPredictiveModels({
      months,
      testSize,
      optimizeParams,
      cvFolds,
      targetAccuracy
    }).then(result => {
      console.log('✅ Modelo predictivo entrenado:', result);
    }).catch(error => {
      console.error('❌ Error en entrenamiento:', error);
    });

  } catch (err) {
    res.status(500).json({ 
      error: 'Error iniciando entrenamiento del modelo predictivo', 
      details: err.message 
    });
  }
});

// Predecir horarios pico para las próximas 24 horas
app.get('/ml/prediction/peak-hours/next-24h', async (req, res) => {
  try {
    const { targetDate } = req.query;
    
    const prediction = await peakHoursPredictiveModel.predictNext24Hours(
      targetDate || null
    );

    res.json({
      success: true,
      prediction,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error prediciendo próximas 24 horas', 
      details: err.message 
    });
  }
});

// Obtener métricas del modelo predictivo
app.get('/ml/prediction/peak-hours/metrics', async (req, res) => {
  try {
    const metrics = await peakHoursPredictiveModel.getModelMetrics();

    res.json({
      success: true,
      metrics,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo métricas del modelo predictivo', 
      details: err.message 
    });
  }
});

// Validar precisión del modelo
app.post('/ml/prediction/peak-hours/validate', async (req, res) => {
  try {
    const {
      months = 3,
      testSize = 0.2,
      targetAccuracy = 0.8
    } = req.body;

    const validation = await peakHoursPredictiveModel.validateAccuracy({
      months,
      testSize,
      targetAccuracy
    });

    res.json({
      success: true,
      validation,
      meetsAccuracyThreshold: validation.overall.meetsThreshold,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error validando precisión del modelo', 
      details: err.message 
    });
  }
});

// Predecir horarios pico para una fecha específica
app.get('/ml/prediction/peak-hours/date', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ 
        error: 'Parámetro date es requerido (formato: YYYY-MM-DD)' 
      });
    }

    const prediction = await peakHoursPredictiveModel.predictNext24Hours(date);

    res.json({
      success: true,
      prediction,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error prediciendo para fecha específica', 
      details: err.message 
    });
  }
});

// Obtener resumen de predicción para dashboard
app.get('/ml/prediction/peak-hours/summary', async (req, res) => {
  try {
    const prediction = await peakHoursPredictiveModel.predictNext24Hours();
    const metrics = await peakHoursPredictiveModel.getModelMetrics();

    res.json({
      success: true,
      summary: {
        next24Hours: prediction.summary,
        peakHours: prediction.peakHours,
        modelMetrics: metrics,
        timestamp: new Date()
      }
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo resumen de predicción', 
      details: err.message 
    });
  }
});

// ==================== ENDPOINTS DE ETL PARA ML ====================

// Importar servicios ETL
const MLETLService = require('./ml/ml_etl_service');
const HistoricalDataETL = require('./ml/historical_data_etl');
const DataCleaningService = require('./ml/data_cleaning_service');
const DataQualityValidator = require('./ml/data_quality_validator');
const MLDataStructure = require('./ml/ml_data_structure');

// Instancias de servicios
const mlETLService = new MLETLService(Asistencia);
const historicalETL = new HistoricalDataETL(Asistencia);
const cleaningService = new DataCleaningService();
const qualityValidator = new DataQualityValidator();
const mlStructure = new MLDataStructure();

// Ejecutar pipeline ETL completo para ML
app.post('/ml/etl/pipeline', async (req, res) => {
  try {
    const {
      months = 3,
      startDate = null,
      endDate = null,
      cleanData = true,
      validateData = true,
      aggregateByHour = true,
      normalizeStructure = true
    } = req.body;

    res.json({
      success: true,
      message: 'Pipeline ETL iniciado. El proceso puede tardar varios minutos.',
      timestamp: new Date()
    });

    // Ejecutar en segundo plano
    mlETLService.executeMLETLPipeline({
      months,
      startDate,
      endDate,
      cleanData,
      validateData,
      aggregateByHour,
      normalizeStructure
    }).then(result => {
      console.log('✅ Pipeline ETL completado:', result);
    }).catch(error => {
      console.error('❌ Error en pipeline ETL:', error);
    });

  } catch (err) {
    res.status(500).json({ 
      error: 'Error iniciando pipeline ETL', 
      details: err.message 
    });
  }
});

// Ejecutar ETL básico (extracción, transformación, carga)
app.post('/ml/etl/basic', async (req, res) => {
  try {
    const {
      months = 3,
      startDate = null,
      endDate = null,
      cleanData = true,
      validateData = true,
      aggregateByHour = true
    } = req.body;

    const result = await historicalETL.executeETLPipeline({
      months,
      startDate,
      endDate,
      cleanData,
      validateData,
      aggregateByHour
    });

    res.json({
      success: true,
      result,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error ejecutando ETL básico', 
      details: err.message 
    });
  }
});

// Limpiar datos existentes
app.post('/ml/etl/clean', async (req, res) => {
  try {
    const { dataPath, strategy = 'impute' } = req.body;

    if (!dataPath) {
      return res.status(400).json({ 
        error: 'dataPath es requerido' 
      });
    }

    const fs = require('fs').promises;
    const content = await fs.readFile(dataPath, 'utf8');
    const data = JSON.parse(content);

    const result = await cleaningService.cleanDataset(data, {
      removeOutliers: true,
      handleMissing: true,
      missingStrategy: strategy,
      normalize: false,
      encodeCategorical: false,
      validateAfterCleaning: true
    });

    res.json({
      success: true,
      cleanedData: result.cleanedData,
      report: result.report,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error limpiando datos', 
      details: err.message 
    });
  }
});

// Validar calidad de datos
app.post('/ml/etl/validate', async (req, res) => {
  try {
    const { dataPath } = req.body;

    if (!dataPath) {
      return res.status(400).json({ 
        error: 'dataPath es requerido' 
      });
    }

    const validation = await mlETLService.validateExistingDataset(dataPath);

    res.json({
      success: true,
      validation,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error validando datos', 
      details: err.message 
    });
  }
});

// Obtener estadísticas del dataset
app.get('/ml/etl/statistics', async (req, res) => {
  try {
    const { dataPath } = req.query;

    const statistics = await mlETLService.getDatasetStatistics(dataPath || null);

    res.json({
      success: true,
      statistics,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo estadísticas', 
      details: err.message 
    });
  }
});

// Obtener estructura ML definida
app.get('/ml/etl/structure', async (req, res) => {
  try {
    const structure = mlETLService.getMLStructure();

    res.json({
      success: true,
      structure,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo estructura ML', 
      details: err.message 
    });
  }
});

// Validar estructura de datos
app.post('/ml/etl/validate-structure', async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ 
        error: 'data debe ser un array' 
      });
    }

    const validation = mlStructure.validateStructure(data);

    res.json({
      success: true,
      validation,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error validando estructura', 
      details: err.message 
    });
  }
});

// Generar reporte de calidad
app.post('/ml/etl/quality-report', async (req, res) => {
  try {
    const { dataPath, data } = req.body;

    let dataset;

    if (dataPath) {
      const fs = require('fs').promises;
      const content = await fs.readFile(dataPath, 'utf8');
      dataset = JSON.parse(content);
    } else if (data && Array.isArray(data)) {
      dataset = data;
    } else {
      return res.status(400).json({ 
        error: 'dataPath o data es requerido' 
      });
    }

    const report = await mlETLService.generateQualityReport(dataset);

    res.json({
      success: true,
      report,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error generando reporte de calidad', 
      details: err.message 
    });
  }
});

// ==================== ENDPOINTS DE ACTUALIZACIÓN AUTOMÁTICA SEMANAL ====================

// Importar servicios de actualización automática
const AutomaticUpdateScheduler = require('./ml/automatic_update_scheduler');
const WeeklyModelUpdateService = require('./ml/weekly_model_update_service');
const ModelDriftMonitor = require('./ml/model_drift_monitor');

// Instancias de servicios
const updateScheduler = new AutomaticUpdateScheduler(Asistencia);
const weeklyUpdateService = new WeeklyModelUpdateService(Asistencia);
const driftMonitor = new ModelDriftMonitor();

// Configurar job automático semanal
app.post('/ml/update/schedule', async (req, res) => {
  try {
    const {
      dayOfWeek = 0,
      hour = 2,
      interval = 7,
      enabled = true
    } = req.body;

    const result = updateScheduler.scheduleWeeklyUpdate({
      dayOfWeek,
      hour,
      interval,
      enabled
    });

    res.json({
      success: true,
      result,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error configurando schedule', 
      details: err.message 
    });
  }
});

// Obtener estado del scheduler
app.get('/ml/update/schedule/status', async (req, res) => {
  try {
    const status = updateScheduler.getSchedulerStatus();

    res.json({
      success: true,
      status,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo estado del scheduler', 
      details: err.message 
    });
  }
});

// Detener scheduler
app.post('/ml/update/schedule/stop', async (req, res) => {
  try {
    const result = updateScheduler.stopScheduler();

    res.json({
      success: true,
      result,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error deteniendo scheduler', 
      details: err.message 
    });
  }
});

// Ejecutar actualización semanal manualmente
app.post('/ml/update/weekly', async (req, res) => {
  try {
    const {
      incremental = true,
      validatePerformance = true,
      checkDrift = true,
      targetR2 = 0.7
    } = req.body;

    res.json({
      success: true,
      message: 'Actualización semanal iniciada. El proceso puede tardar varios minutos.',
      timestamp: new Date()
    });

    // Ejecutar en segundo plano
    updateScheduler.executeManualUpdate({
      incremental,
      validatePerformance,
      checkDrift,
      targetR2
    }).then(result => {
      console.log('✅ Actualización semanal completada:', result);
    }).catch(error => {
      console.error('❌ Error en actualización:', error);
    });

  } catch (err) {
    res.status(500).json({ 
      error: 'Error iniciando actualización semanal', 
      details: err.message 
    });
  }
});

// Obtener historial de actualizaciones
app.get('/ml/update/history', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const history = await weeklyUpdateService.getUpdateHistory(parseInt(limit));

    res.json({
      success: true,
      history,
      count: history.length,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo historial', 
      details: err.message 
    });
  }
});

// Monitorear drift del modelo
app.get('/ml/update/drift', async (req, res) => {
  try {
    const driftResult = await updateScheduler.monitorModelDrift();

    res.json({
      success: true,
      drift: driftResult,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error monitoreando drift', 
      details: err.message 
    });
  }
});

// Validar performance del modelo actualizado
app.post('/ml/update/validate-performance', async (req, res) => {
  try {
    const { days = 7 } = req.body;

    const currentModel = await weeklyUpdateService.loadCurrentModel();
    if (!currentModel) {
      return res.status(404).json({ 
        error: 'No hay modelo actual para validar' 
      });
    }

    const newData = await weeklyUpdateService.collectNewData(days);
    const performanceValidation = await weeklyUpdateService.validatePerformance(
      { model: currentModel.model.save(), features: currentModel.modelData.features, targetColumn: currentModel.modelData.targetColumn },
      currentModel,
      newData
    );

    res.json({
      success: true,
      validation: performanceValidation,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error validando performance', 
      details: err.message 
    });
  }
});

// Obtener configuración de actualización
app.get('/ml/update/config', async (req, res) => {
  try {
    const config = weeklyUpdateService.getScheduleConfig();

    res.json({
      success: true,
      config,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo configuración', 
      details: err.message 
    });
  }
});

// Endpoint de salud del sistema
app.get('/health', async (req, res) => {
  try {
    // Verificar conexión a BD
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Contar registros en colecciones principales
    const stats = {
      usuarios: await User.countDocuments(),
      alumnos: await Alumno.countDocuments(),
      asistencias: await Asistencia.countDocuments(),
      sesiones_activas: await SessionGuard.countDocuments({ is_active: true })
    };

    res.json({
      status: 'healthy',
      database: dbStatus,
      timestamp: new Date(),
      stats: stats,
      version: '1.0.0'
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'unhealthy', 
      error: err.message,
      timestamp: new Date()
    });
  }
});

// ==================== ENDPOINTS DASHBOARD TIEMPO REAL ====================

// Servicio de métricas en tiempo real
class RealtimeMetricsService {
  constructor(AsistenciaModel) {
    this.Asistencia = AsistenciaModel;
  }

  async getTodayMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAccess = await this.Asistencia.countDocuments({
      fecha_hora: { $gte: today, $lt: tomorrow }
    });

    const entrances = await this.Asistencia.countDocuments({
      fecha_hora: { $gte: today, $lt: tomorrow },
      tipo: 'entrada'
    });

    const exits = await this.Asistencia.countDocuments({
      fecha_hora: { $gte: today, $lt: tomorrow },
      tipo: 'salida'
    });

    const currentInside = entrances - exits;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const lastHourEntrances = await this.Asistencia.countDocuments({
      fecha_hora: { $gte: oneHourAgo },
      tipo: 'entrada'
    });

    const lastHourExits = await this.Asistencia.countDocuments({
      fecha_hora: { $gte: oneHourAgo },
      tipo: 'salida'
    });

    return {
      todayAccess,
      currentInside: Math.max(0, currentInside),
      lastHourEntrances,
      lastHourExits
    };
  }

  async getHourlyData(hours = 24) {
    const now = new Date();
    const startDate = new Date(now.getTime() - hours * 60 * 60 * 1000);

    const asistencias = await this.Asistencia.find({
      fecha_hora: { $gte: startDate }
    }).sort({ fecha_hora: 1 }).lean();

    const hourlyData = {};
    
    asistencias.forEach(access => {
      const fecha = new Date(access.fecha_hora);
      const hour = fecha.getHours();
      const hourKey = `${fecha.toISOString().split('T')[0]}_${hour}`;

      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = { entrances: 0, exits: 0 };
      }

      if (access.tipo === 'entrada') {
        hourlyData[hourKey].entrances++;
      } else {
        hourlyData[hourKey].exits++;
      }
    });

    const labels = [];
    const entrances = [];
    const exits = [];

    for (let i = hours - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hour = date.getHours();
      const dateKey = date.toISOString().split('T')[0];
      const hourKey = `${dateKey}_${hour}`;

      labels.push(`${hour}:00`);
      entrances.push(hourlyData[hourKey]?.entrances || 0);
      exits.push(hourlyData[hourKey]?.exits || 0);
    }

    return { labels, entrances, exits };
  }

  async getWeeklyData() {
    const now = new Date();
    const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const asistencias = await this.Asistencia.find({
      fecha_hora: { $gte: startDate }
    }).lean();

    const weeklyData = [0, 0, 0, 0, 0, 0, 0];

    asistencias.forEach(access => {
      const fecha = new Date(access.fecha_hora);
      const dayOfWeek = fecha.getDay();
      weeklyData[dayOfWeek]++;
    });

    return weeklyData;
  }

  async getFacultiesData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const asistencias = await this.Asistencia.find({
      fecha_hora: { $gte: today, $lt: tomorrow }
    }).lean();

    const facultiesCount = {};

    asistencias.forEach(access => {
      const faculty = access.siglas_facultad || 'N/A';
      facultiesCount[faculty] = (facultiesCount[faculty] || 0) + 1;
    });

    const sorted = Object.entries(facultiesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      labels: sorted.map(([name]) => name),
      values: sorted.map(([, count]) => count)
    };
  }

  async getRecentAccess(limit = 20) {
    const recent = await this.Asistencia.find()
      .sort({ fecha_hora: -1 })
      .limit(limit)
      .lean();

    return recent;
  }

  async getEntranceExitData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const entrances = await this.Asistencia.countDocuments({
      fecha_hora: { $gte: today, $lt: tomorrow },
      tipo: 'entrada'
    });

    const exits = await this.Asistencia.countDocuments({
      fecha_hora: { $gte: today, $lt: tomorrow },
      tipo: 'salida'
    });

    return { entrances, exits };
  }
}

const metricsService = new RealtimeMetricsService(Asistencia);

// Endpoint para métricas del dashboard
app.get('/dashboard/metrics', async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    const hours = period === '7d' ? 168 : period === '30d' ? 720 : 24;

    const metrics = await metricsService.getTodayMetrics();
    const hourlyData = await metricsService.getHourlyData(hours);
    const entranceExitData = await metricsService.getEntranceExitData();
    const weeklyData = await metricsService.getWeeklyData();
    const facultiesData = await metricsService.getFacultiesData();

    res.json({
      success: true,
      metrics,
      hourlyData,
      entranceExitData,
      weeklyData: { values: weeklyData },
      facultiesData,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo métricas', 
      details: err.message 
    });
  }
});

// Endpoint para accesos recientes
app.get('/dashboard/recent-access', async (req, res) => {
  try {
    const access = await metricsService.getRecentAccess(20);

    res.json({
      success: true,
      access,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo accesos recientes', 
      details: err.message 
    });
  }
});

// ==================== ENDPOINTS DE ANÁLISIS DE PATRONES DE FLUJO ====================

// Importar servicios de análisis de patrones
const FlowPatternAnalyzer = require('./ml/flow_pattern_analyzer');
const TrendVisualizationService = require('./ml/trend_visualization_service');

// Instancias de servicios
const flowPatternAnalyzer = new FlowPatternAnalyzer(Asistencia);
const trendVisualizationService = new TrendVisualizationService(Asistencia);

// Analizar patrones de flujo de estudiantes
app.get('/api/ml/patterns/analyze', async (req, res) => {
  try {
    const {
      months = 3,
      granularity = 'hour',
      startDate = null,
      endDate = null,
      includeAnomalies = true,
      includeTrends = true,
      includeSeasonality = true
    } = req.query;

    const result = await flowPatternAnalyzer.analyzeFlowPatterns({
      months: parseInt(months),
      granularity,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      includeAnomalies: includeAnomalies === 'true',
      includeTrends: includeTrends === 'true',
      includeSeasonality: includeSeasonality === 'true'
    });

    res.json({
      success: true,
      ...result,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({
      error: 'Error analizando patrones de flujo',
      details: err.message
    });
  }
});

// Generar visualización de tendencias
app.get('/api/ml/trends/visualize', async (req, res) => {
  try {
    const {
      months = 3,
      granularity = 'hour',
      includePatterns = true,
      includeForecast = false,
      forecastSteps = 24
    } = req.query;

    const result = await trendVisualizationService.generateTrendVisualization({
      months: parseInt(months),
      granularity,
      includePatterns: includePatterns === 'true',
      includeForecast: includeForecast === 'true',
      forecastSteps: parseInt(forecastSteps)
    });

    res.json({
      success: true,
      ...result,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({
      error: 'Error generando visualización de tendencias',
      details: err.message
    });
  }
});

// Obtener resumen ejecutivo de patrones
app.get('/api/ml/patterns/summary', async (req, res) => {
  try {
    const {
      months = 3,
      granularity = 'hour'
    } = req.query;

    const patterns = await flowPatternAnalyzer.analyzeFlowPatterns({
      months: parseInt(months),
      granularity,
      includeAnomalies: true,
      includeTrends: true,
      includeSeasonality: true
    });

    const timeSeriesData = await trendVisualizationService.timeSeriesService.prepareTimeSeriesData({
      months: parseInt(months),
      interval: granularity,
      metric: 'count'
    });

    const summary = trendVisualizationService.generateExecutiveSummary(patterns, timeSeriesData);

    res.json({
      success: true,
      summary,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({
      error: 'Error generando resumen de patrones',
      details: err.message
    });
  }
});

// ==================== ENDPOINTS DE CLUSTERING ====================

// Importar servicios de clustering
const ClusteringService = require('./ml/clustering_service');

// Instancia de servicio
const clusteringService = new ClusteringService(Asistencia);

// Ejecutar clustering completo
app.post('/api/ml/clustering/execute', async (req, res) => {
  try {
    const {
      months = 3,
      features = null,
      k = null,
      kRange = [2, 8],
      normalize = true,
      includeValidation = true,
      includeVisualization = true
    } = req.body;

    const result = await clusteringService.executeClusteringPipeline({
      months: parseInt(months),
      features,
      k: k ? parseInt(k) : null,
      kRange: Array.isArray(kRange) ? kRange : [2, 8],
      normalize: normalize !== false,
      includeValidation: includeValidation !== false,
      includeVisualization: includeVisualization !== false
    });

    res.json({
      success: true,
      ...result,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({
      error: 'Error ejecutando clustering',
      details: err.message
    });
  }
});

// Determinar número óptimo de clusters
app.post('/api/ml/clustering/optimal-k', async (req, res) => {
  try {
    const {
      months = 3,
      features = null,
      kRange = [2, 8],
      normalize = true
    } = req.body;

    const { X } = await clusteringService.prepareData(months, features);
    
    const ClusteringValidation = require('./ml/clustering_validation');
    const validator = new ClusteringValidation();
    
    const result = validator.determineOptimalK(X, kRange, normalize);

    res.json({
      success: true,
      ...result,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({
      error: 'Error determinando número óptimo de clusters',
      details: err.message
    });
  }
});

// Validar clustering existente
app.post('/api/ml/clustering/validate', async (req, res) => {
  try {
    const {
      months = 3,
      features = null,
      k,
      normalize = true
    } = req.body;

    if (!k) {
      return res.status(400).json({
        error: 'k es requerido para validación'
      });
    }

    const { X } = await clusteringService.prepareData(months, features);
    
    const KMeansClustering = require('./ml/kmeans_clustering');
    const ClusteringValidation = require('./ml/clustering_validation');
    
    const kmeans = new KMeansClustering(parseInt(k), {
      maxIterations: 100,
      tolerance: 1e-4
    });

    const fitResult = kmeans.fit(X, normalize);
    const validator = new ClusteringValidation();
    const silhouette = validator.calculateSilhouetteScore(X, fitResult.labels);

    res.json({
      success: true,
      validation: {
        silhouette,
        inertia: fitResult.inertia,
        nClusters: k,
        nSamples: X.length,
        interpretation: silhouette.interpretation
      },
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({
      error: 'Error validando clustering',
      details: err.message
    });
  }
});

// ==================== ENDPOINTS DE EFICIENCIA DE BUSES ====================

// Importar servicio de eficiencia de buses
const BusEfficiencyService = require('./ml/bus_efficiency_service');

// Instancia de servicio
const busEfficiencyService = new BusEfficiencyService(Bus, ViajeBus);

// Endpoints CRUD para Buses
// Listar todos los buses
app.get('/buses', async (req, res) => {
  try {
    const buses = await Bus.find();
    res.json({
      success: true,
      buses,
      count: buses.length
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al obtener buses', 
      details: err.message 
    });
  }
});

// Obtener bus por ID
app.get('/buses/:id', async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ error: 'Bus no encontrado' });
    }
    res.json({
      success: true,
      bus
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al obtener bus', 
      details: err.message 
    });
  }
});

// Crear nuevo bus
app.post('/buses', async (req, res) => {
  try {
    const { placa, numero_bus, capacidad_maxima, tipo_bus, estado } = req.body;
    
    if (!placa || !numero_bus || !capacidad_maxima) {
      return res.status(400).json({ 
        error: 'Placa, número de bus y capacidad máxima son requeridos' 
      });
    }

    const bus = new Bus({
      _id: uuidv4(),
      placa,
      numero_bus,
      capacidad_maxima: parseInt(capacidad_maxima),
      tipo_bus: tipo_bus || 'regular',
      estado: estado || 'activo',
      fecha_creacion: new Date(),
      fecha_actualizacion: new Date()
    });

    await bus.save();
    res.status(201).json({
      success: true,
      bus
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al crear bus', 
      details: err.message 
    });
  }
});

// Actualizar bus
app.put('/buses/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
    updateData.fecha_actualizacion = new Date();

    const bus = await Bus.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!bus) {
      return res.status(404).json({ error: 'Bus no encontrado' });
    }
    res.json({
      success: true,
      bus
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al actualizar bus', 
      details: err.message 
    });
  }
});

// Agregar optimización a un bus
app.post('/buses/:id/optimizaciones', async (req, res) => {
  try {
    const { tipo, descripcion, costo, impacto_esperado } = req.body;
    
    if (!tipo || !descripcion) {
      return res.status(400).json({ 
        error: 'Tipo y descripción son requeridos' 
      });
    }

    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ error: 'Bus no encontrado' });
    }

    if (!bus.optimizaciones_aplicadas) {
      bus.optimizaciones_aplicadas = [];
    }

    const optimizacion = {
      tipo,
      descripcion,
      fecha_aplicacion: new Date(),
      costo: costo || 0,
      impacto_esperado: impacto_esperado || 0
    };

    bus.optimizaciones_aplicadas.push(optimizacion);
    bus.fecha_optimizacion = new Date();
    bus.fecha_actualizacion = new Date();

    await bus.save();
    res.json({
      success: true,
      bus,
      optimizacion
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al agregar optimización', 
      details: err.message 
    });
  }
});

// Endpoints CRUD para Viajes de Buses
// Listar viajes de buses
app.get('/viajes-buses', async (req, res) => {
  try {
    const { bus_id, ruta, estado, startDate, endDate } = req.query;
    const query = {};

    if (bus_id) query.bus_id = bus_id;
    if (ruta) query.ruta = ruta;
    if (estado) query.estado = estado;
    if (startDate || endDate) {
      query.fecha_salida = {};
      if (startDate) query.fecha_salida.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.fecha_salida.$lte = end;
      }
    }

    const viajes = await ViajeBus.find(query).sort({ fecha_salida: -1 });
    res.json({
      success: true,
      viajes,
      count: viajes.length
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al obtener viajes', 
      details: err.message 
    });
  }
});

// Crear nuevo viaje
app.post('/viajes-buses', async (req, res) => {
  try {
    const {
      bus_id,
      ruta,
      fecha_salida,
      fecha_llegada,
      pasajeros_transportados,
      capacidad_disponible,
      distancia_km,
      tiempo_viaje_minutos,
      costo_operacion,
      estado
    } = req.body;

    if (!bus_id || !ruta || !fecha_salida) {
      return res.status(400).json({ 
        error: 'bus_id, ruta y fecha_salida son requeridos' 
      });
    }

    // Verificar que el bus existe
    const bus = await Bus.findById(bus_id);
    if (!bus) {
      return res.status(404).json({ error: 'Bus no encontrado' });
    }

    // Calcular tasa de ocupación
    const capacidad = bus.capacidad_maxima;
    const pasajeros = pasajeros_transportados || 0;
    const tasaOcupacion = capacidad > 0 ? (pasajeros / capacidad) * 100 : 0;

    const viaje = new ViajeBus({
      _id: uuidv4(),
      bus_id,
      ruta,
      fecha_salida: new Date(fecha_salida),
      fecha_llegada: fecha_llegada ? new Date(fecha_llegada) : null,
      pasajeros_transportados: pasajeros,
      capacidad_disponible: capacidad_disponible || (capacidad - pasajeros),
      distancia_km: distancia_km || 0,
      tiempo_viaje_minutos: tiempo_viaje_minutos || 0,
      costo_operacion: costo_operacion || 0,
      estado: estado || 'programado',
      tasa_ocupacion: parseFloat(tasaOcupacion.toFixed(2)),
      fecha_creacion: new Date()
    });

    await viaje.save();
    res.status(201).json({
      success: true,
      viaje
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al crear viaje', 
      details: err.message 
    });
  }
});

// Actualizar viaje
app.put('/viajes-buses/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Si se actualiza pasajeros, recalcular tasa de ocupación
    if (updateData.pasajeros_transportados !== undefined) {
      const viaje = await ViajeBus.findById(req.params.id);
      if (viaje) {
        const bus = await Bus.findById(viaje.bus_id);
        if (bus) {
          const capacidad = bus.capacidad_maxima;
          const pasajeros = updateData.pasajeros_transportados;
          updateData.tasa_ocupacion = capacidad > 0 
            ? parseFloat(((pasajeros / capacidad) * 100).toFixed(2))
            : 0;
        }
      }
    }

    const viaje = await ViajeBus.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!viaje) {
      return res.status(404).json({ error: 'Viaje no encontrado' });
    }
    res.json({
      success: true,
      viaje
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al actualizar viaje', 
      details: err.message 
    });
  }
});

// Endpoints de Reportes de Eficiencia
// Obtener métricas de utilización
app.get('/api/buses/efficiency/utilization', async (req, res) => {
  try {
    const { startDate, endDate, busId, ruta, groupBy } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate y endDate son requeridos' 
      });
    }

    const dateRange = {
      start: new Date(startDate),
      end: new Date(endDate)
    };

    const metrics = await busEfficiencyService.calculateUtilizationMetrics(dateRange, {
      busId,
      ruta,
      groupBy: groupBy || 'day'
    });

    res.json({
      success: true,
      ...metrics
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error calculando métricas de utilización', 
      details: err.message 
    });
  }
});

// Generar comparativo antes/después
app.get('/api/buses/efficiency/comparison', async (req, res) => {
  try {
    const { busId, optimizationDate, beforeStart, beforeEnd, afterStart, afterEnd } = req.query;

    if (!busId || !optimizationDate) {
      return res.status(400).json({ 
        error: 'busId y optimizationDate son requeridos' 
      });
    }

    const dateRange = (beforeStart && beforeEnd && afterStart && afterEnd) ? {
      beforeStart: new Date(beforeStart),
      beforeEnd: new Date(beforeEnd),
      afterStart: new Date(afterStart),
      afterEnd: new Date(afterEnd)
    } : null;

    const comparison = await busEfficiencyService.generateBeforeAfterComparison(
      busId,
      optimizationDate,
      dateRange
    );

    res.json({
      success: true,
      ...comparison
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error generando comparativo', 
      details: err.message 
    });
  }
});

// Calcular ROI
app.get('/api/buses/efficiency/roi', async (req, res) => {
  try {
    const { busId, optimizationDate, beforeStart, beforeEnd, afterStart, afterEnd } = req.query;

    if (!busId || !optimizationDate) {
      return res.status(400).json({ 
        error: 'busId y optimizationDate son requeridos' 
      });
    }

    const dateRange = (beforeStart && beforeEnd && afterStart && afterEnd) ? {
      beforeStart: new Date(beforeStart),
      beforeEnd: new Date(beforeEnd),
      afterStart: new Date(afterStart),
      afterEnd: new Date(afterEnd)
    } : null;

    const roi = await busEfficiencyService.calculateROI(
      busId,
      optimizationDate,
      dateRange
    );

    res.json({
      success: true,
      ...roi
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error calculando ROI', 
      details: err.message 
    });
  }
});

// Generar reporte completo de eficiencia
app.get('/api/buses/efficiency/report', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      busId, 
      includeComparison, 
      includeROI, 
      optimizationDate 
    } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate y endDate son requeridos' 
      });
    }

    const dateRange = {
      start: new Date(startDate),
      end: new Date(endDate)
    };

    const report = await busEfficiencyService.generateEfficiencyReport(dateRange, {
      busId: busId || null,
      includeComparison: includeComparison === 'true',
      includeROI: includeROI === 'true',
      optimizationDate: optimizationDate || null
    });

    res.json({
      success: true,
      ...report
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error generando reporte de eficiencia', 
      details: err.message 
    });
  }
});

// ==================== ENDPOINTS DE SUGERENCIAS DE BUSES ====================

// Importar servicios de sugerencias y optimización de buses
const BusSuggestionsService = require('./ml/bus_suggestions_service');
const BusScheduleOptimizer = require('./ml/bus_schedule_optimizer');

// Instancias de servicios
const busSuggestionsService = new BusSuggestionsService(SugerenciaBus, ViajeBus, Bus);
const busScheduleOptimizer = new BusScheduleOptimizer(ViajeBus, Bus, SugerenciaBus);

// Endpoints CRUD para Sugerencias
// Listar sugerencias
app.get('/sugerencias-buses', async (req, res) => {
  try {
    const { bus_id, estado, tipo_sugerencia, prioridad } = req.query;
    const query = {};

    if (bus_id) query.bus_id = bus_id;
    if (estado) query.estado = estado;
    if (tipo_sugerencia) query.tipo_sugerencia = tipo_sugerencia;
    if (prioridad) query.prioridad = prioridad;

    const sugerencias = await SugerenciaBus.find(query).sort({ fecha_sugerencia: -1 });
    res.json({
      success: true,
      sugerencias,
      count: sugerencias.length
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al obtener sugerencias', 
      details: err.message 
    });
  }
});

// Obtener sugerencia por ID
app.get('/sugerencias-buses/:id', async (req, res) => {
  try {
    const sugerencia = await SugerenciaBus.findById(req.params.id);
    if (!sugerencia) {
      return res.status(404).json({ error: 'Sugerencia no encontrada' });
    }
    res.json({
      success: true,
      sugerencia
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al obtener sugerencia', 
      details: err.message 
    });
  }
});

// Crear nueva sugerencia
app.post('/sugerencias-buses', async (req, res) => {
  try {
    const sugerencia = await busSuggestionsService.createSuggestion(req.body);
    res.status(201).json({
      success: true,
      sugerencia
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al crear sugerencia', 
      details: err.message 
    });
  }
});

// Actualizar sugerencia
app.put('/sugerencias-buses/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
    updateData.fecha_actualizacion = new Date();

    const sugerencia = await SugerenciaBus.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!sugerencia) {
      return res.status(404).json({ error: 'Sugerencia no encontrada' });
    }
    res.json({
      success: true,
      sugerencia
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al actualizar sugerencia', 
      details: err.message 
    });
  }
});

// Aprobar sugerencia
app.post('/sugerencias-buses/:id/aprobar', async (req, res) => {
  try {
    const { aprobado_por } = req.body;
    
    if (!aprobado_por) {
      return res.status(400).json({ 
        error: 'aprobado_por es requerido' 
      });
    }

    const sugerencia = await busSuggestionsService.approveSuggestion(req.params.id, aprobado_por);
    res.json({
      success: true,
      sugerencia
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al aprobar sugerencia', 
      details: err.message 
    });
  }
});

// Implementar sugerencia
app.post('/sugerencias-buses/:id/implementar', async (req, res) => {
  try {
    const { implementado_por, fecha_inicio_seguimiento } = req.body;
    
    if (!implementado_por) {
      return res.status(400).json({ 
        error: 'implementado_por es requerido' 
      });
    }

    const fechaInicio = fecha_inicio_seguimiento ? new Date(fecha_inicio_seguimiento) : null;
    const sugerencia = await busSuggestionsService.implementSuggestion(
      req.params.id, 
      implementado_por,
      fechaInicio
    );
    res.json({
      success: true,
      sugerencia
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al implementar sugerencia', 
      details: err.message 
    });
  }
});

// Rechazar sugerencia
app.post('/sugerencias-buses/:id/rechazar', async (req, res) => {
  try {
    const sugerencia = await SugerenciaBus.findById(req.params.id);
    if (!sugerencia) {
      return res.status(404).json({ error: 'Sugerencia no encontrada' });
    }

    sugerencia.estado = 'rechazada';
    sugerencia.fecha_rechazo = new Date();
    sugerencia.fecha_actualizacion = new Date();
    await sugerencia.save();

    res.json({
      success: true,
      sugerencia
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al rechazar sugerencia', 
      details: err.message 
    });
  }
});

// Actualizar tracking de sugerencia
app.post('/sugerencias-buses/:id/tracking', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const dateRange = (startDate && endDate) ? {
      start: new Date(startDate),
      end: new Date(endDate)
    } : null;

    const sugerencia = await busSuggestionsService.updateTracking(req.params.id, dateRange);
    res.json({
      success: true,
      sugerencia
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al actualizar tracking', 
      details: err.message 
    });
  }
});

// Endpoints de Reportes
// Comparativo sugerido vs real
app.get('/api/buses/suggestions/comparison/:id', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateRange = (startDate && endDate) ? {
      start: new Date(startDate),
      end: new Date(endDate)
    } : null;

    const comparison = await busSuggestionsService.generateSuggestedVsRealComparison(
      req.params.id,
      dateRange
    );

    res.json({
      success: true,
      ...comparison
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error generando comparativo', 
      details: err.message 
    });
  }
});

// Dashboard de adopción de sugerencias
app.get('/api/buses/suggestions/dashboard', async (req, res) => {
  try {
    const { startDate, endDate, busId, tipoSugerencia, estado } = req.query;
    
    const dateRange = (startDate && endDate) ? {
      start: new Date(startDate),
      end: new Date(endDate)
    } : null;

    const filters = {};
    if (busId) filters.busId = busId;
    if (tipoSugerencia) filters.tipoSugerencia = tipoSugerencia;
    if (estado) filters.estado = estado;

    const dashboard = await busSuggestionsService.generateAdoptionDashboard(dateRange, filters);

    res.json({
      success: true,
      ...dashboard
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error generando dashboard', 
      details: err.message 
    });
  }
});

// Obtener métricas de impacto de adopción
app.get('/api/buses/suggestions/impact', async (req, res) => {
  try {
    const { startDate, endDate, busId } = req.query;
    
    const dateRange = (startDate && endDate) ? {
      start: new Date(startDate),
      end: new Date(endDate)
    } : null;

    const filters = {};
    if (busId) filters.busId = busId;
    filters.estado = 'implementada';

    const result = await busSuggestionsService.calculateAdoptionImpact(
      startDate,
      endDate,
      busId || null
    );

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo métricas de impacto', 
      details: err.message 
    });
  }
});

// ==================== ENDPOINTS DE OPTIMIZACIÓN DE HORARIOS ====================

// Analizar patrones de demanda
app.get('/api/buses/optimization/demand-patterns', async (req, res) => {
  try {
    const { ruta, days_of_week, start_date, end_date } = req.query;
    
    if (!ruta) {
      return res.status(400).json({ error: 'ruta es requerido' });
    }

    const daysOfWeek = days_of_week ? days_of_week.split(',') : null;
    const dateRange = (start_date && end_date) ? {
      start: new Date(start_date),
      end: new Date(end_date)
    } : null;

    const result = await busScheduleOptimizer.analyzeDemandPatterns(
      ruta,
      daysOfWeek,
      dateRange
    );

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error analizando patrones de demanda', 
      details: err.message 
    });
  }
});

// Generar horarios óptimos para una ruta
app.post('/api/buses/optimization/generate-schedule', async (req, res) => {
  try {
    const { ruta, dia_semana, capacidad_bus, ocupacion_objetivo } = req.body;
    
    if (!ruta || !dia_semana) {
      return res.status(400).json({ 
        error: 'ruta y dia_semana son requeridos' 
      });
    }

    const capacidad = capacidad_bus || 50;
    const ocupacion = ocupacion_objetivo || 80;

    const result = await busScheduleOptimizer.generateOptimalSchedule(
      ruta,
      dia_semana,
      capacidad,
      ocupacion
    );

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error generando horarios óptimos', 
      details: err.message 
    });
  }
});

// Generar sugerencias de horarios optimizados (múltiples rutas)
app.post('/api/buses/optimization/generate-suggestions', async (req, res) => {
  try {
    const { rutas, dias_semana, ocupacion_objetivo, save_suggestions } = req.body;
    
    const ocupacion = ocupacion_objetivo || 80;
    const save = save_suggestions !== false; // Por defecto guardar

    const result = await busScheduleOptimizer.generateOptimalScheduleSuggestions(
      rutas || null,
      dias_semana || null,
      ocupacion
    );

    // Guardar sugerencias si se solicita
    let savedSuggestions = [];
    if (save && result.suggestions.length > 0) {
      savedSuggestions = await busScheduleOptimizer.saveSuggestions(
        result.suggestions,
        req.user?.id || 'system'
      );
    }

    res.json({
      success: true,
      ...result,
      saved_count: savedSuggestions.length
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error generando sugerencias de horarios', 
      details: err.message 
    });
  }
});

// Calcular métricas de eficiencia para un horario
app.get('/api/buses/optimization/schedule-efficiency', async (req, res) => {
  try {
    const { ruta, horario_salida, dia_semana, capacidad_bus } = req.query;
    
    if (!ruta || !horario_salida || !dia_semana) {
      return res.status(400).json({ 
        error: 'ruta, horario_salida y dia_semana son requeridos' 
      });
    }

    const capacidad = capacidad_bus ? parseInt(capacidad_bus) : 50;

    const metrics = await busScheduleOptimizer.calculateScheduleEfficiencyMetrics(
      ruta,
      horario_salida,
      dia_semana,
      capacidad
    );

    res.json({
      success: true,
      metrics
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error calculando métricas de eficiencia', 
      details: err.message 
    });
  }
});

// Obtener métricas de eficiencia del transporte
app.get('/api/buses/optimization/transport-efficiency', async (req, res) => {
  try {
    const { start_date, end_date, ruta } = req.query;
    
    const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = end_date ? new Date(end_date) : new Date();

    // Obtener viajes en el período
    const query = {
      estado: 'completado',
      fecha_salida: { $gte: startDate, $lte: endDate }
    };
    if (ruta) {
      query.ruta = ruta;
    }

    const viajes = await ViajeBus.find(query).lean();
    const buses = await Bus.find({ estado: 'activo' }).lean();

    if (viajes.length === 0) {
      return res.json({
        success: true,
        metrics: {
          tasaOcupacionPromedio: 0,
          costoPorPasajero: 0,
          tiempoViajePromedio: 0,
          eficienciaGeneral: 0,
          totalViajes: 0,
          totalPasajeros: 0,
          totalCosto: 0
        }
      });
    }

    // Calcular métricas agregadas
    const totalViajes = viajes.length;
    const totalPasajeros = viajes.reduce((sum, v) => sum + (v.pasajeros_transportados || 0), 0);
    const totalCosto = viajes.reduce((sum, v) => sum + (v.costo_operacion || 0), 0);
    const totalTiempo = viajes.reduce((sum, v) => sum + (v.tiempo_viaje_minutos || 0), 0);
    const totalOcupacion = viajes.reduce((sum, v) => sum + (v.tasa_ocupacion || 0), 0);

    const capacidadPromedio = buses.length > 0
      ? buses.reduce((sum, b) => sum + (b.capacidad_maxima || 50), 0) / buses.length
      : 50;

    const tasaOcupacionPromedio = totalOcupacion / totalViajes;
    const costoPorPasajero = totalPasajeros > 0 ? totalCosto / totalPasajeros : 0;
    const tiempoViajePromedio = totalTiempo / totalViajes;

    // Calcular eficiencia general (0-100)
    const eficienciaGeneral = (
      (tasaOcupacionPromedio / 100) * 0.5 + // 50% peso en ocupación
      (1 - Math.min(costoPorPasajero / 10, 1)) * 0.3 + // 30% peso en costo
      (1 - Math.min(tiempoViajePromedio / 60, 1)) * 0.2 // 20% peso en tiempo
    ) * 100;

    res.json({
      success: true,
      metrics: {
        tasaOcupacionPromedio: parseFloat(tasaOcupacionPromedio.toFixed(2)),
        costoPorPasajero: parseFloat(costoPorPasajero.toFixed(2)),
        tiempoViajePromedio: parseFloat(tiempoViajePromedio.toFixed(2)),
        eficienciaGeneral: parseFloat(eficienciaGeneral.toFixed(2)),
        totalViajes,
        totalPasajeros,
        totalCosto: parseFloat(totalCosto.toFixed(2)),
        capacidadPromedio: parseFloat(capacidadPromedio.toFixed(2)),
        promedioPasajerosPorViaje: parseFloat((totalPasajeros / totalViajes).toFixed(2))
      }
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error calculando métricas de eficiencia del transporte', 
      details: err.message 
    });
  }
});

// ==================== ENDPOINTS DE EVENTOS Y AUDITORÍA ====================

// Importar servicios de eventos, auditoría, backup y validación
const AuditService = require('./services/audit_service');
const BackupService = require('./services/backup_service');
const DataValidationService = require('./services/data_validation_service');

// Instancias de servicios
const auditService = new AuditService(Evento);
const backupService = new BackupService(Evento, Asistencia, Presencia, DecisionManual);

// Obtener modelo de Alumno para validación
let AlumnoModel = null;
try {
  AlumnoModel = mongoose.model('alumnos');
} catch {
  // Modelo no existe, se manejará en el servicio
}

const dataValidationService = new DataValidationService(
  Evento,
  Asistencia,
  Presencia,
  DecisionManual,
  User,
  AlumnoModel
);

// Inicializar servicios
backupService.initialize().then(() => {
  console.log('Servicio de backup inicializado');
  // Programar backup automático cada 24 horas
  backupService.scheduleAutomaticBackup(24);
}).catch(err => {
  console.error('Error inicializando servicio de backup:', err);
});

// Configurar triggers de auditoría
auditService.setupAuditTriggers(Asistencia, 'asistencias');
auditService.setupAuditTriggers(DecisionManual, 'decisiones_manuales');
auditService.setupAuditTriggers(Presencia, 'presencia');

// Endpoints de Eventos
// Crear evento
app.post('/eventos', async (req, res) => {
  try {
    const eventoData = req.body;
    
    if (!eventoData.estudiante_id || !eventoData.guardia_id || !eventoData.decision) {
      return res.status(400).json({ 
        error: 'estudiante_id, guardia_id y decision son requeridos' 
      });
    }

    const evento = new Evento({
      _id: uuidv4(),
      ...eventoData,
      fecha: eventoData.fecha ? new Date(eventoData.fecha) : new Date(),
      hora: eventoData.hora || new Date().toTimeString().split(' ')[0],
      timestamp: eventoData.timestamp ? new Date(eventoData.timestamp) : new Date(),
      created_at: new Date(),
      updated_at: new Date()
    });

    await evento.save();
    res.status(201).json({
      success: true,
      evento
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error creando evento', 
      details: err.message 
    });
  }
});

// Listar eventos
app.get('/eventos', async (req, res) => {
  try {
    const {
      estudiante_id,
      guardia_id,
      decision,
      tipo_evento,
      start_date,
      end_date,
      limit = 100,
      skip = 0
    } = req.query;

    const query = {};
    if (estudiante_id) query.estudiante_id = estudiante_id;
    if (guardia_id) query.guardia_id = guardia_id;
    if (decision) query.decision = decision;
    if (tipo_evento) query.tipo_evento = tipo_evento;
    if (start_date || end_date) {
      query.timestamp = {};
      if (start_date) query.timestamp.$gte = new Date(start_date);
      if (end_date) query.timestamp.$lte = new Date(end_date);
    }

    const eventos = await Evento.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const total = await Evento.countDocuments(query);

    res.json({
      success: true,
      eventos,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo eventos', 
      details: err.message 
    });
  }
});

// Obtener evento por ID
app.get('/eventos/:id', async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id);
    if (!evento) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    res.json({
      success: true,
      evento
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo evento', 
      details: err.message 
    });
  }
});

// Endpoints de Auditoría
// Obtener eventos de auditoría
app.get('/api/audit/events', async (req, res) => {
  try {
    const result = await auditService.getAuditEvents(req.query);
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo eventos de auditoría', 
      details: err.message 
    });
  }
});

// Obtener estadísticas de auditoría
app.get('/api/audit/statistics', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const stats = await auditService.getAuditStatistics(start_date, end_date);
    res.json({
      success: true,
      ...stats
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error obteniendo estadísticas de auditoría', 
      details: err.message 
    });
  }
});

// Validar integridad de evento
app.get('/api/audit/validate/:id', async (req, res) => {
  try {
    const result = await auditService.validateEventIntegrity(req.params.id);
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error validando integridad', 
      details: err.message 
    });
  }
});

// Endpoints de Backup
// Realizar backup de eventos
app.post('/api/backup/events', async (req, res) => {
  try {
    const result = await backupService.backupEvents(req.body);
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error realizando backup', 
      details: err.message 
    });
  }
});

// Realizar backup completo
app.post('/api/backup/full', async (req, res) => {
  try {
    const result = await backupService.backupAll(req.body);
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error realizando backup completo', 
      details: err.message 
    });
  }
});

// Listar backups
app.get('/api/backup/list', async (req, res) => {
  try {
    const backups = await backupService.listBackups();
    res.json({
      success: true,
      backups
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error listando backups', 
      details: err.message 
    });
  }
});

// Restaurar backup
app.post('/api/backup/restore/:filename', async (req, res) => {
  try {
    const result = await backupService.restoreBackup(req.params.filename, req.body);
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error restaurando backup', 
      details: err.message 
    });
  }
});

// Endpoints de Validación
// Validar integridad referencial
app.get('/api/validation/referential-integrity', async (req, res) => {
  try {
    const { event_id } = req.query;
    const result = await dataValidationService.validateEventReferentialIntegrity(event_id);
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error validando integridad referencial', 
      details: err.message 
    });
  }
});

// Validar consistencia de datos
app.get('/api/validation/consistency', async (req, res) => {
  try {
    const result = await dataValidationService.validateDataConsistency();
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error validando consistencia', 
      details: err.message 
    });
  }
});

// Reparar inconsistencias
app.post('/api/validation/repair', async (req, res) => {
  try {
    const result = await dataValidationService.repairInconsistencies(req.body);
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error reparando inconsistencias', 
      details: err.message 
    });
  }
});

// ==================== SERVICIO DE COMPATIBILIDAD DE API ====================

// Importar servicio de compatibilidad
const ApiCompatibilityService = require('./services/api_compatibility_service');
const ApiDocumentationGenerator = require('./utils/api_documentation_generator');

// Instancias de servicios
const apiCompatibilityService = new ApiCompatibilityService();
const apiDocGenerator = new ApiDocumentationGenerator();

// Registrar endpoints críticos
apiCompatibilityService.registerEndpoint('POST', '/login', {
  category: 'Autenticación',
  description: 'Login de usuario',
  compatible: { web: true, mobile: true }
});

apiCompatibilityService.registerEndpoint('GET', '/alumnos/:codigo', {
  category: 'Alumnos',
  description: 'Obtener alumno por código',
  compatible: { web: true, mobile: true }
});

apiCompatibilityService.registerEndpoint('POST', '/asistencias', {
  category: 'Asistencias',
  description: 'Crear asistencia',
  compatible: { web: true, mobile: true }
});

apiCompatibilityService.registerEndpoint('GET', '/asistencias', {
  category: 'Asistencias',
  description: 'Listar asistencias',
  compatible: { web: true, mobile: true }
});

apiCompatibilityService.registerEndpoint('GET', '/health', {
  category: 'Sistema',
  description: 'Health check del servidor',
  compatible: { web: true, mobile: true }
});

// Endpoint para obtener reporte de compatibilidad
app.get('/api/compatibility/report', async (req, res) => {
  try {
    const report = apiCompatibilityService.generateCompatibilityReport();
    const criticalValidation = apiCompatibilityService.validateCriticalEndpoints();
    
    res.json({
      success: true,
      report,
      criticalValidation,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({
      error: 'Error generando reporte de compatibilidad',
      details: err.message
    });
  }
});

// Endpoint para validar request
app.post('/api/compatibility/validate', async (req, res) => {
  try {
    const { method, path, headers } = req.body;
    const validation = apiCompatibilityService.validateRequest(method, path, headers);
    
    res.json({
      success: true,
      ...validation
    });
  } catch (err) {
    res.status(500).json({
      error: 'Error validando compatibilidad',
      details: err.message
    });
  }
});

// Endpoint para obtener documentación de API
app.get('/api/docs', async (req, res) => {
  try {
    const format = req.query.format || 'markdown';
    const outputPath = path.join(__dirname, '../docs/API_UNIFIED.md');
    
    if (format === 'openapi') {
      const openApiPath = path.join(__dirname, '../docs/openapi.json');
      await apiDocGenerator.generateOpenAPI(openApiPath);
      return res.json({
        success: true,
        message: 'Documentación OpenAPI generada',
        path: openApiPath
      });
    } else {
      await apiDocGenerator.generateMarkdown(outputPath);
      return res.json({
        success: true,
        message: 'Documentación Markdown generada',
        path: outputPath
      });
    }
  } catch (err) {
    res.status(500).json({
      error: 'Error generando documentación',
      details: err.message
    });
  }
});

// ==================== ENDPOINTS DE ROI DEL PROYECTO ====================

// Importar servicio de ROI del proyecto
const ProjectROIService = require('./ml/project_roi_service');

// Instancia de servicio
const projectROIService = new ProjectROIService(
  BaselineData,
  ProjectCost,
  Asistencia,
  Presencia,
  ViajeBus
);

// Endpoints CRUD para Baseline Data
// Listar baselines
app.get('/baseline-data', async (req, res) => {
  try {
    const baselines = await BaselineData.find().sort({ 'periodo.fecha_inicio': -1 });
    res.json({
      success: true,
      baselines,
      count: baselines.length
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al obtener baselines', 
      details: err.message 
    });
  }
});

// Obtener baseline por ID
app.get('/baseline-data/:id', async (req, res) => {
  try {
    const baseline = await BaselineData.findById(req.params.id);
    if (!baseline) {
      return res.status(404).json({ error: 'Baseline no encontrado' });
    }
    res.json({
      success: true,
      baseline
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al obtener baseline', 
      details: err.message 
    });
  }
});

// Crear o actualizar baseline
app.post('/baseline-data', async (req, res) => {
  try {
    const baseline = await projectROIService.createOrUpdateBaseline(req.body);
    res.status(201).json({
      success: true,
      baseline
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al crear/actualizar baseline', 
      details: err.message 
    });
  }
});

// Endpoints CRUD para Project Costs
// Listar costos del proyecto
app.get('/project-costs', async (req, res) => {
  try {
    const { tipo_costo, categoria, startDate, endDate } = req.query;
    const query = {};

    if (tipo_costo) query.tipo_costo = tipo_costo;
    if (categoria) query.categoria = categoria;
    if (startDate || endDate) {
      query.fecha = {};
      if (startDate) query.fecha.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.fecha.$lte = end;
      }
    }

    const costos = await ProjectCost.find(query).sort({ fecha: -1 });
    res.json({
      success: true,
      costos,
      count: costos.length
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al obtener costos', 
      details: err.message 
    });
  }
});

// Crear costo del proyecto
app.post('/project-costs', async (req, res) => {
  try {
    const { tipo_costo, descripcion, monto, fecha, periodo, categoria } = req.body;
    
    if (!tipo_costo || !monto || !fecha) {
      return res.status(400).json({ 
        error: 'tipo_costo, monto y fecha son requeridos' 
      });
    }

    const costo = new ProjectCost({
      _id: uuidv4(),
      tipo_costo,
      descripcion,
      monto: parseFloat(monto),
      fecha: new Date(fecha),
      periodo: periodo || { tipo: 'unico' },
      categoria: categoria || 'operacion_recurrente',
      fecha_creacion: new Date(),
      fecha_actualizacion: new Date()
    });

    await costo.save();
    res.status(201).json({
      success: true,
      costo
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al crear costo', 
      details: err.message 
    });
  }
});

// Actualizar costo
app.put('/project-costs/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
    updateData.fecha_actualizacion = new Date();

    const costo = await ProjectCost.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!costo) {
      return res.status(404).json({ error: 'Costo no encontrado' });
    }
    res.json({
      success: true,
      costo
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al actualizar costo', 
      details: err.message 
    });
  }
});

// Endpoints de Reportes
// Calcular métricas actuales (post-implementación)
app.get('/api/project/current-metrics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate y endDate son requeridos' 
      });
    }

    const dateRange = {
      start: new Date(startDate),
      end: new Date(endDate)
    };

    const metrics = await projectROIService.calculateCurrentMetrics(dateRange);

    res.json({
      success: true,
      ...metrics
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error calculando métricas actuales', 
      details: err.message 
    });
  }
});

// Comparativo pre/post implementación
app.get('/api/project/pre-post-comparison', async (req, res) => {
  try {
    const { baselineId, startDate, endDate } = req.query;

    if (!baselineId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'baselineId, startDate y endDate son requeridos' 
      });
    }

    const dateRange = {
      start: new Date(startDate),
      end: new Date(endDate)
    };

    const comparison = await projectROIService.generatePrePostComparison(baselineId, dateRange);

    res.json({
      success: true,
      ...comparison
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error generando comparativo pre/post', 
      details: err.message 
    });
  }
});

// Calcular KPIs de impacto
app.get('/api/project/impact-kpis', async (req, res) => {
  try {
    const { baselineId, startDate, endDate } = req.query;

    if (!baselineId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'baselineId, startDate y endDate son requeridos' 
      });
    }

    const dateRange = {
      start: new Date(startDate),
      end: new Date(endDate)
    };

    const kpis = await projectROIService.calculateImpactKPIs(baselineId, dateRange);

    res.json({
      success: true,
      ...kpis
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error calculando KPIs de impacto', 
      details: err.message 
    });
  }
});

// Calcular costos del proyecto
app.get('/api/project/costs', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateRange = (startDate && endDate) ? {
      start: new Date(startDate),
      end: new Date(endDate)
    } : null;

    const costs = await projectROIService.calculateProjectCosts(dateRange);

    res.json({
      success: true,
      ...costs
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error calculando costos', 
      details: err.message 
    });
  }
});

// Análisis costo-beneficio y ROI
app.get('/api/project/cost-benefit-analysis', async (req, res) => {
  try {
    const { baselineId, startDate, endDate, projectionMonths } = req.query;

    if (!baselineId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'baselineId, startDate y endDate son requeridos' 
      });
    }

    const dateRange = {
      start: new Date(startDate),
      end: new Date(endDate)
    };

    const months = projectionMonths ? parseInt(projectionMonths) : 12;

    const analysis = await projectROIService.calculateCostBenefitAnalysis(
      baselineId,
      dateRange,
      months
    );

    res.json({
      success: true,
      ...analysis
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error calculando análisis costo-beneficio', 
      details: err.message 
    });
  }
});

// Reporte completo de ROI del proyecto
app.get('/api/project/roi-report', async (req, res) => {
  try {
    const { 
      baselineId, 
      startDate, 
      endDate, 
      includeKPIs, 
      includeCostBenefit, 
      projectionMonths 
    } = req.query;

    if (!baselineId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'baselineId, startDate y endDate son requeridos' 
      });
    }

    const dateRange = {
      start: new Date(startDate),
      end: new Date(endDate)
    };

    const options = {
      includeKPIs: includeKPIs !== 'false',
      includeCostBenefit: includeCostBenefit !== 'false',
      projectionMonths: projectionMonths ? parseInt(projectionMonths) : 12
    };

    const report = await projectROIService.generateProjectROIReport(
      baselineId,
      dateRange,
      options
    );

    res.json({
      success: true,
      ...report
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error generando reporte de ROI', 
      details: err.message 
    });
  }
});

// ==================== ENDPOINTS DE GESTIÓN DE HISTORIAL ====================

// Importar servicios de historial
const HistoryManagementService = require('./services/history_management_service');
const DatabaseIndexes = require('./utils/database_indexes');

// Instancias de servicios
const historyService = new HistoryManagementService(Asistencia, Presencia);
const indexService = new DatabaseIndexes();

// Inicializar servicio de historial (crear índices)
historyService.initialize().catch(err => {
  console.warn('Advertencia: Error inicializando servicio de historial:', err.message);
});

// Obtener historial con filtros
app.get('/api/history', async (req, res) => {
  try {
    const {
      collection = 'asistencias',
      fechaInicio = null,
      fechaFin = null,
      codigoUniversitario = null,
      dni = null,
      puntoControlId = null,
      includeArchived = false,
      limit = 1000,
      skip = 0
    } = req.query;

    const result = await historyService.getHistory({
      collection,
      fechaInicio,
      fechaFin,
      codigoUniversitario,
      dni,
      puntoControlId,
      includeArchived: includeArchived === 'true',
      limit: parseInt(limit),
      skip: parseInt(skip)
    });

    res.json({
      success: true,
      ...result,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({
      error: 'Error obteniendo historial',
      details: err.message
    });
  }
});

// Obtener estadísticas del historial
app.get('/api/history/stats', async (req, res) => {
  try {
    const stats = await historyService.getHistoryStats();
    res.json({
      success: true,
      ...stats
    });
  } catch (err) {
    res.status(500).json({
      error: 'Error obteniendo estadísticas',
      details: err.message
    });
  }
});

// Archivar datos antiguos
app.post('/api/history/archive', async (req, res) => {
  try {
    const {
      collection = 'asistencias',
      forceDate = null,
      dryRun = false
    } = req.body;

    const result = await historyService.archiveOldData({
      collection,
      forceDate: forceDate ? new Date(forceDate) : null,
      dryRun: dryRun === true
    });

    res.json({
      success: true,
      ...result,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({
      error: 'Error archivando datos',
      details: err.message
    });
  }
});

// Verificar estado de índices
app.get('/api/history/indexes', async (req, res) => {
  try {
    const indexesStatus = await historyService.checkIndexesStatus();
    res.json({
      success: true,
      ...indexesStatus
    });
  } catch (err) {
    res.status(500).json({
      error: 'Error verificando índices',
      details: err.message
    });
  }
});

// Ejecutar mantenimiento completo
app.post('/api/history/maintenance', async (req, res) => {
  try {
    const {
      createIndexes = true,
      archiveOldData = true,
      collections = ['asistencias', 'presencia']
    } = req.body;

    // Ejecutar en segundo plano si es solicitado
    if (req.body.async === true) {
      res.json({
        success: true,
        message: 'Mantenimiento iniciado en segundo plano',
        timestamp: new Date()
      });

      // Ejecutar en segundo plano
      historyService.performMaintenance({
        createIndexes,
        archiveOldData,
        collections
      }).then(result => {
        console.log('✅ Mantenimiento completado:', result);
      }).catch(error => {
        console.error('❌ Error en mantenimiento:', error);
      });

      return;
    }

    // Ejecutar sincrónicamente
    const result = await historyService.performMaintenance({
      createIndexes,
      archiveOldData,
      collections
    });

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({
      error: 'Error ejecutando mantenimiento',
      details: err.message
    });
  }
});

// Exportar historial
app.post('/api/history/export', async (req, res) => {
  try {
    const {
      collection = 'asistencias',
      fechaInicio = null,
      fechaFin = null,
      format = 'json'
    } = req.body;

    const result = await historyService.exportHistory({
      collection,
      fechaInicio,
      fechaFin,
      format
    });

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({
      error: 'Error exportando historial',
      details: err.message
    });
  }
});

// Listar archivos de archivo
app.get('/api/history/archives', async (req, res) => {
  try {
    const { collection = null } = req.query;
    const files = await historyService.retentionService.listArchiveFiles(collection);
    
    res.json({
      success: true,
      files,
      total: files.length,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({
      error: 'Error listando archivos',
      details: err.message
    });
  }
});

// Restaurar desde archivo de archivo
app.post('/api/history/restore', async (req, res) => {
  try {
    const { collection, period } = req.body;

    if (!collection || !period) {
      return res.status(400).json({
        error: 'collection y period son requeridos'
      });
    }

    const result = await historyService.retentionService.restoreFromArchive(collection, period);

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({
      error: 'Error restaurando desde archivo',
      details: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
  console.log(`✅ Backend completo con ${Object.keys(require('./package.json').dependencies).length} dependencias`);
  console.log(`✅ MongoDB conectado a base de datos: ASISTENCIA`);
  console.log(`✅ Dashboard disponible en http://localhost:${PORT}/dashboard`);
  console.log(`✅ Endpoints disponibles: 30+ rutas REST (incluye ML)`);
});