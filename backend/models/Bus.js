// Modelo para buses y sus viajes
const mongoose = require('mongoose');

const BusSchema = new mongoose.Schema({
  _id: String, // UUID o identificador único
  placa: { type: String, required: true, unique: true }, // Placa del bus
  numero_bus: { type: String, required: true }, // Número identificador del bus
  capacidad_maxima: { type: Number, required: true, default: 50 }, // Capacidad máxima de pasajeros
  estado: { 
    type: String, 
    enum: ['activo', 'mantenimiento', 'inactivo'], 
    default: 'activo' 
  },
  tipo_bus: { 
    type: String, 
    enum: ['regular', 'express', 'especial'], 
    default: 'regular' 
  },
  fecha_creacion: { type: Date, default: Date.now },
  fecha_actualizacion: { type: Date, default: Date.now },
  // Información de optimización (para comparativo antes/después)
  fecha_optimizacion: Date, // Fecha en que se aplicó una optimización
  optimizaciones_aplicadas: [{
    tipo: String, // 'ruta', 'horario', 'capacidad', etc.
    descripcion: String,
    fecha_aplicacion: Date,
    costo: Number, // Costo de la optimización
    impacto_esperado: Number // Impacto esperado en porcentaje
  }]
}, { collection: 'buses', strict: false, _id: false });

// Modelo para viajes de buses
const ViajeBusSchema = new mongoose.Schema({
  _id: String, // UUID o identificador único
  bus_id: { type: String, required: true }, // Referencia al bus
  ruta: { type: String, required: true }, // Ruta del viaje
  fecha_salida: { type: Date, required: true },
  fecha_llegada: Date,
  pasajeros_transportados: { type: Number, default: 0 },
  capacidad_disponible: { type: Number, default: 0 },
  distancia_km: { type: Number, default: 0 },
  tiempo_viaje_minutos: { type: Number, default: 0 },
  costo_operacion: { type: Number, default: 0 }, // Costo de operación del viaje
  estado: { 
    type: String, 
    enum: ['programado', 'en_curso', 'completado', 'cancelado'], 
    default: 'programado' 
  },
  // Métricas de eficiencia
  tasa_ocupacion: { type: Number, default: 0 }, // Porcentaje de ocupación
  eficiencia_combustible: { type: Number, default: 0 }, // km/litro
  puntualidad: { type: Number, default: 0 }, // Porcentaje de puntualidad
  fecha_creacion: { type: Date, default: Date.now }
}, { collection: 'viajes_buses', strict: false, _id: false });

const Bus = mongoose.model('buses', BusSchema);
const ViajeBus = mongoose.model('viajes_buses', ViajeBusSchema);

module.exports = { Bus, ViajeBus };

