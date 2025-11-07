const mongoose = require('mongoose');

/**
 * Modelo de Asociación Pulsera-Estudiante
 * 
 * Mapea IDs únicos de pulseras NFC con estudiantes
 */
const PulseraAsociacionSchema = new mongoose.Schema({
  _id: String, // UUID
  
  // Identificador único de la pulsera NFC
  pulsera_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
    validate: {
      validator: function(v) {
        // Validar formato hexadecimal con separadores
        return /^[0-9A-F:]+$/i.test(v);
      },
      message: 'ID de pulsera debe estar en formato hexadecimal (ej: 04:12:34:56)'
    }
  },
  
  // Referencia al estudiante
  estudiante_id: {
    type: String,
    required: true,
    index: true
  },
  
  // Información del estudiante (desnormalizada para consultas rápidas)
  estudiante: {
    codigo_universitario: {
      type: String,
      required: true,
      index: true
    },
    dni: {
      type: String,
      required: true
    },
    nombre: String,
    apellido: String,
    facultad: String,
    escuela: String
  },
  
  // Estado de la asociación
  estado: {
    type: String,
    enum: ['activa', 'inactiva', 'suspendida', 'perdida'],
    default: 'activa',
    index: true
  },
  
  // Fechas
  fecha_asociacion: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  fecha_activacion: Date,
  fecha_desactivacion: Date,
  
  // Información adicional
  motivo_desactivacion: String,
  
  // Auditoría
  creado_por: {
    usuario_id: String,
    usuario_nombre: String,
    fecha: {
      type: Date,
      default: Date.now
    }
  },
  
  modificado_por: {
    usuario_id: String,
    usuario_nombre: String,
    fecha: Date
  },
  
  // Historial de cambios
  historial: [{
    accion: {
      type: String,
      enum: ['creacion', 'activacion', 'desactivacion', 'suspension', 'reporte_perdida', 'modificacion']
    },
    estado_anterior: String,
    estado_nuevo: String,
    motivo: String,
    usuario_id: String,
    usuario_nombre: String,
    fecha: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Contador de usos
  contador_lecturas: {
    type: Number,
    default: 0
  },
  
  ultima_lectura: Date,
  
  // Metadata
  notas: String,
  tags: [String]
  
}, {
  collection: 'pulseras_asociaciones',
  strict: false,
  _id: false,
  timestamps: true
});

// Índices compuestos
PulseraAsociacionSchema.index({ pulsera_id: 1, estado: 1 });
PulseraAsociacionSchema.index({ 'estudiante.codigo_universitario': 1, estado: 1 });
PulseraAsociacionSchema.index({ 'estudiante.dni': 1, estado: 1 });
PulseraAsociacionSchema.index({ fecha_asociacion: -1 });

// Métodos del modelo
PulseraAsociacionSchema.methods.activar = function(usuario) {
  this.estado = 'activa';
  this.fecha_activacion = new Date();
  this.modificado_por = {
    usuario_id: usuario._id,
    usuario_nombre: usuario.nombre,
    fecha: new Date()
  };
  this.historial.push({
    accion: 'activacion',
    estado_anterior: this.estado,
    estado_nuevo: 'activa',
    usuario_id: usuario._id,
    usuario_nombre: usuario.nombre,
    fecha: new Date()
  });
};

PulseraAsociacionSchema.methods.desactivar = function(usuario, motivo) {
  this.estado = 'inactiva';
  this.fecha_desactivacion = new Date();
  this.motivo_desactivacion = motivo;
  this.modificado_por = {
    usuario_id: usuario._id,
    usuario_nombre: usuario.nombre,
    fecha: new Date()
  };
  this.historial.push({
    accion: 'desactivacion',
    estado_anterior: this.estado,
    estado_nuevo: 'inactiva',
    motivo: motivo,
    usuario_id: usuario._id,
    usuario_nombre: usuario.nombre,
    fecha: new Date()
  });
};

PulseraAsociacionSchema.methods.reportarPerdida = function(usuario) {
  this.estado = 'perdida';
  this.fecha_desactivacion = new Date();
  this.motivo_desactivacion = 'Pulsera reportada como perdida';
  this.modificado_por = {
    usuario_id: usuario._id,
    usuario_nombre: usuario.nombre,
    fecha: new Date()
  };
  this.historial.push({
    accion: 'reporte_perdida',
    estado_anterior: this.estado,
    estado_nuevo: 'perdida',
    motivo: 'Pulsera reportada como perdida',
    usuario_id: usuario._id,
    usuario_nombre: usuario.nombre,
    fecha: new Date()
  });
};

PulseraAsociacionSchema.methods.registrarLectura = function() {
  this.contador_lecturas += 1;
  this.ultima_lectura = new Date();
};

// Statics
PulseraAsociacionSchema.statics.buscarPorPulseraId = function(pulseraId) {
  return this.findOne({ pulsera_id: pulseraId, estado: 'activa' });
};

PulseraAsociacionSchema.statics.buscarPorEstudiante = function(codigoUniversitario) {
  return this.find({
    'estudiante.codigo_universitario': codigoUniversitario,
    estado: { $in: ['activa', 'suspendida'] }
  });
};

PulseraAsociacionSchema.statics.buscarPorDni = function(dni) {
  return this.find({
    'estudiante.dni': dni,
    estado: { $in: ['activa', 'suspendida'] }
  });
};

module.exports = mongoose.model('PulseraAsociacion', PulseraAsociacionSchema);

