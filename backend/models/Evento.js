/**
 * Modelo de Evento - Registro completo de eventos del sistema
 * Incluye: fecha, hora, estudiante, guardia y decisión
 * Con integridad referencial y auditoría
 */

const mongoose = require('mongoose');

const EventoSchema = new mongoose.Schema({
  _id: String, // UUID
  // Información del estudiante (referencia)
  estudiante_id: { 
    type: String, 
    required: true,
    index: true 
  },
  estudiante_dni: { 
    type: String, 
    required: true,
    index: true 
  },
  estudiante_nombre: { 
    type: String, 
    required: true 
  },
  estudiante_codigo_universitario: String,
  estudiante_facultad: String,
  estudiante_escuela: String,
  
  // Información del guardia (referencia)
  guardia_id: { 
    type: String, 
    required: true,
    index: true 
  },
  guardia_nombre: { 
    type: String, 
    required: true 
  },
  guardia_dni: String,
  
  // Información del evento
  fecha: { 
    type: Date, 
    required: true,
    index: true,
    default: Date.now 
  },
  hora: { 
    type: String, 
    required: true // Formato HH:MM:SS
  },
  timestamp: { 
    type: Date, 
    required: true,
    index: true,
    default: Date.now 
  },
  
  // Decisión tomada
  decision: { 
    type: String, 
    required: true,
    enum: ['autorizado', 'denegado', 'pendiente', 'revisar'],
    index: true
  },
  tipo_evento: {
    type: String,
    required: true,
    enum: ['entrada', 'salida', 'decision_manual', 'verificacion', 'otro'],
    index: true
  },
  
  // Detalles de la decisión
  razon: String,
  observaciones: String,
  autorizacion_manual: { 
    type: Boolean, 
    default: false 
  },
  
  // Ubicación y punto de control
  punto_control_id: String,
  punto_control_nombre: String,
  coordenadas_lat: Number,
  coordenadas_lng: Number,
  descripcion_ubicacion: String,
  
  // Referencias a otros registros
  asistencia_id: String, // Referencia a registro de asistencia
  presencia_id: String, // Referencia a registro de presencia
  decision_manual_id: String, // Referencia a decisión manual
  
  // Metadatos de auditoría
  created_at: { 
    type: Date, 
    default: Date.now,
    immutable: true 
  },
  updated_at: { 
    type: Date, 
    default: Date.now 
  },
  created_by: String, // ID del usuario/device que creó
  updated_by: String, // ID del usuario/device que actualizó
  device_id: String, // ID del dispositivo
  ip_address: String,
  
  // Integridad referencial
  referential_integrity: {
    estudiante_exists: { type: Boolean, default: false },
    guardia_exists: { type: Boolean, default: false },
    validated_at: Date,
    validation_errors: [String]
  },
  
  // Backup y archivado
  backed_up: { type: Boolean, default: false },
  backup_date: Date,
  backup_file: String,
  archived: { type: Boolean, default: false },
  archived_at: Date
}, { 
  collection: 'eventos', 
  strict: false, 
  _id: false,
  timestamps: false // Usamos campos personalizados
});

// Índices compuestos para consultas frecuentes
EventoSchema.index({ estudiante_id: 1, fecha: -1 });
EventoSchema.index({ guardia_id: 1, fecha: -1 });
EventoSchema.index({ decision: 1, fecha: -1 });
EventoSchema.index({ tipo_evento: 1, fecha: -1 });
EventoSchema.index({ timestamp: -1 });
EventoSchema.index({ backed_up: 1, backup_date: 1 });

// Middleware pre-save para validación y auditoría
EventoSchema.pre('save', async function(next) {
  try {
    // Actualizar updated_at
    this.updated_at = new Date();
    
    // Validar integridad referencial
    await this.validateReferentialIntegrity();
    
    // Si es nuevo, establecer created_at
    if (this.isNew) {
      this.created_at = new Date();
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Método para validar integridad referencial
EventoSchema.methods.validateReferentialIntegrity = async function() {
  const errors = [];
  
  // Validar que el estudiante existe (si hay modelo de Alumno)
  try {
    const Alumno = mongoose.model('alumnos');
    const estudiante = await Alumno.findById(this.estudiante_id);
    this.referential_integrity.estudiante_exists = !!estudiante;
    if (!estudiante) {
      errors.push(`Estudiante con ID ${this.estudiante_id} no encontrado`);
    }
  } catch (error) {
    // Si no existe el modelo, solo registrar
    this.referential_integrity.estudiante_exists = false;
  }
  
  // Validar que el guardia existe
  try {
    const User = mongoose.model('usuarios');
    const guardia = await User.findById(this.guardia_id);
    this.referential_integrity.guardia_exists = !!guardia;
    if (!guardia) {
      errors.push(`Guardia con ID ${this.guardia_id} no encontrado`);
    }
    if (guardia && guardia.rango !== 'guardia') {
      errors.push(`Usuario ${this.guardia_id} no es un guardia`);
    }
  } catch (error) {
    this.referential_integrity.guardia_exists = false;
    errors.push(`Error validando guardia: ${error.message}`);
  }
  
  // Validar que la fecha y hora son consistentes
  if (this.fecha && this.hora) {
    const fechaHora = new Date(`${this.fecha.toISOString().split('T')[0]}T${this.hora}`);
    if (isNaN(fechaHora.getTime())) {
      errors.push('Fecha y hora no son válidas');
    }
  }
  
  // Validar que timestamp es consistente
  if (this.timestamp && this.fecha) {
    const diff = Math.abs(this.timestamp.getTime() - this.fecha.getTime());
    if (diff > 24 * 60 * 60 * 1000) { // Más de 24 horas de diferencia
      errors.push('Timestamp y fecha no son consistentes');
    }
  }
  
  this.referential_integrity.validation_errors = errors;
  this.referential_integrity.validated_at = new Date();
  
  // Si hay errores críticos, lanzar excepción
  if (errors.length > 0 && !this.referential_integrity.estudiante_exists) {
    throw new Error(`Errores de integridad referencial: ${errors.join(', ')}`);
  }
};

// Método estático para crear evento desde otros modelos
EventoSchema.statics.createFromAsistencia = async function(asistencia, guardiaInfo) {
  const { v4: uuidv4 } = require('uuid');
  
  const fecha = asistencia.fecha_hora ? new Date(asistencia.fecha_hora) : new Date();
  const hora = fecha.toTimeString().split(' ')[0];
  
  const evento = new this({
    _id: uuidv4(),
    estudiante_id: asistencia.codigo_universitario || asistencia.dni,
    estudiante_dni: asistencia.dni,
    estudiante_nombre: `${asistencia.nombre || ''} ${asistencia.apellido || ''}`.trim(),
    estudiante_codigo_universitario: asistencia.codigo_universitario,
    estudiante_facultad: asistencia.siglas_facultad,
    estudiante_escuela: asistencia.siglas_escuela,
    guardia_id: asistencia.guardia_id || guardiaInfo?.id,
    guardia_nombre: asistencia.guardia_nombre || guardiaInfo?.nombre,
    guardia_dni: guardiaInfo?.dni,
    fecha: fecha,
    hora: hora,
    timestamp: asistencia.timestamp_decision ? new Date(asistencia.timestamp_decision) : fecha,
    decision: asistencia.autorizacion_manual ? 'autorizado' : 'pendiente',
    tipo_evento: 'entrada',
    razon: asistencia.razon_decision,
    autorizacion_manual: asistencia.autorizacion_manual || false,
    punto_control_id: asistencia.punto_control_id,
    punto_control_nombre: asistencia.puerta,
    coordenadas_lat: asistencia.coordenadas_lat,
    coordenadas_lng: asistencia.coordenadas_lng,
    descripcion_ubicacion: asistencia.descripcion_ubicacion,
    asistencia_id: asistencia._id,
    created_by: asistencia.guardia_id,
    device_id: asistencia.device_id
  });
  
  return await evento.save();
};

EventoSchema.statics.createFromDecisionManual = async function(decisionManual, guardiaInfo) {
  const { v4: uuidv4 } = require('uuid');
  
  const fecha = decisionManual.timestamp ? new Date(decisionManual.timestamp) : new Date();
  const hora = fecha.toTimeString().split(' ')[0];
  
  const evento = new this({
    _id: uuidv4(),
    estudiante_id: decisionManual.estudiante_id,
    estudiante_dni: decisionManual.estudiante_dni,
    estudiante_nombre: decisionManual.estudiante_nombre,
    guardia_id: decisionManual.guardia_id,
    guardia_nombre: decisionManual.guardia_nombre,
    fecha: fecha,
    hora: hora,
    timestamp: fecha,
    decision: decisionManual.autorizado ? 'autorizado' : 'denegado',
    tipo_evento: 'decision_manual',
    razon: decisionManual.razon,
    autorizacion_manual: true,
    punto_control_id: decisionManual.punto_control,
    decision_manual_id: decisionManual._id,
    created_by: decisionManual.guardia_id
  });
  
  return await evento.save();
};

const Evento = mongoose.model('eventos', EventoSchema);

module.exports = Evento;

