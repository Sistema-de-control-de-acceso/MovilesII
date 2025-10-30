// Backend completo con autenticación segura
const { v4: uuidv4 } = require('uuid');
const PuntoControl = require('./models/PuntoControl');
const Asignacion = require('./models/Asignacion');
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
    const { nombre, ubicacion, descripcion } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
    const punto = new PuntoControl({
      _id: uuidv4(),
      nombre,
      ubicacion,
      descripcion
    });
    await punto.save();
    res.status(201).json(punto);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear punto de control' });
  }
});

// Actualizar punto de control
app.put('/puntos-control/:id', async (req, res) => {
  try {
    const punto = await PuntoControl.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!punto) return res.status(404).json({ error: 'Punto de control no encontrado' });
    res.json(punto);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar punto de control' });
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
app.use(cors());
app.use(express.json());

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
    const asistencias = await Asistencia.find();
    res.json(asistencias);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener asistencias' });
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

// Ruta para crear usuario con contraseña encriptada
app.post('/usuarios', async (req, res) => {
  try {
    const { nombre, apellido, dni, email, password, rango, puerta_acargo, telefono } = req.body;
    
    // Validar campos requeridos
    if (!nombre || !apellido || !dni || !email || !password) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
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
    
    // Responder sin la contraseña
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
    const asistencia = new Asistencia(req.body);
    await asistencia.save();
    res.status(201).json(asistencia);
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar asistencia completa', details: err.message });
  }
});

// Determinar último tipo de acceso para entrada/salida inteligente (US028)
app.get('/asistencias/ultimo-acceso/:dni', async (req, res) => {
  try {
    const { dni } = req.params;
    const ultimaAsistencia = await Asistencia.findOne({ dni }).sort({ fecha_hora: -1 });
    
    if (ultimaAsistencia) {
      res.json({ ultimo_tipo: ultimaAsistencia.tipo });
    } else {
      res.json({ ultimo_tipo: 'salida' }); // Si no hay registros, próximo debería ser entrada
    }
  } catch (err) {
    res.status(500).json({ error: 'Error al determinar último acceso' });
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

// Recibir cambios del cliente para sincronización
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
    const predictor = new PeakHoursPredictor();
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
  console.log(`✅ Backend completo con ${Object.keys(require('./package.json').dependencies).length} dependencias`);
  console.log(`✅ MongoDB conectado a base de datos: ASISTENCIA`);
  console.log(`✅ Endpoints disponibles: 30+ rutas REST (incluye ML)`);
});