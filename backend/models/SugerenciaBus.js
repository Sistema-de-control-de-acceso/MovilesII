// Modelo para sugerencias de horarios y rutas de buses
const mongoose = require('mongoose');

const SugerenciaBusSchema = new mongoose.Schema({
  _id: String, // UUID o identificador único
  bus_id: { type: String, required: true }, // Referencia al bus (opcional si es sugerencia general)
  ruta: { type: String, required: true }, // Ruta sugerida
  horario_salida: { type: String, required: true }, // Horario sugerido (formato HH:MM)
  horario_llegada: { type: String, required: true }, // Horario de llegada sugerido
  dia_semana: { 
    type: String, 
    enum: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
    required: true 
  },
  tipo_sugerencia: { 
    type: String, 
    enum: ['horario', 'ruta', 'frecuencia', 'capacidad'],
    required: true 
  },
  descripcion: String, // Descripción de la sugerencia
  razon: String, // Razón de la sugerencia (basada en datos, análisis, etc.)
  prioridad: { 
    type: String, 
    enum: ['alta', 'media', 'baja'], 
    default: 'media' 
  },
  estado: { 
    type: String, 
    enum: ['pendiente', 'aprobada', 'rechazada', 'implementada', 'cancelada'], 
    default: 'pendiente' 
  },
  fecha_sugerencia: { type: Date, default: Date.now },
  fecha_aprobacion: Date,
  fecha_implementacion: Date,
  fecha_rechazo: Date,
  aprobado_por: String, // ID del administrador que aprobó
  implementado_por: String, // ID del administrador que implementó
  // Métricas esperadas de la sugerencia
  impacto_esperado: {
    aumento_pasajeros: Number, // Porcentaje esperado
    reduccion_tiempo: Number, // Minutos esperados
    reduccion_costo: Number, // Porcentaje esperado
    mejora_ocupacion: Number // Porcentaje esperado
  },
  // Tracking de implementación
  tracking: {
    fecha_inicio_seguimiento: Date,
    fecha_fin_seguimiento: Date,
    viajes_planificados: Number,
    viajes_realizados: Number,
    tasa_adopcion: Number, // Porcentaje de adopción
    cumplimiento_horario: Number, // Porcentaje de cumplimiento
    impacto_real: {
      aumento_pasajeros: Number,
      reduccion_tiempo: Number,
      reduccion_costo: Number,
      mejora_ocupacion: Number
    }
  },
  // Fuente de la sugerencia
  fuente: {
    tipo: { 
      type: String, 
      enum: ['manual', 'ml', 'analisis', 'feedback'], 
      default: 'manual' 
    },
    modelo_ml: String, // Si viene de ML, ID del modelo
    confianza: Number // Nivel de confianza (0-100)
  },
  fecha_creacion: { type: Date, default: Date.now },
  fecha_actualizacion: { type: Date, default: Date.now }
}, { collection: 'sugerencias_buses', strict: false, _id: false });

const SugerenciaBus = mongoose.model('sugerencias_buses', SugerenciaBusSchema);

module.exports = SugerenciaBus;

