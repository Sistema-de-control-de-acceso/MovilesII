// Modelo para puntos de control
const mongoose = require('mongoose');

const PuntoControlSchema = new mongoose.Schema({
  _id: String, // UUID o identificador único
  nombre: { type: String, required: true },
  ubicacion: String, // Descripción textual de la ubicación
  descripcion: String, // Descripción detallada del punto de control
  // Coordenadas GPS (opcionales)
  coordenadas_lat: Number, // Latitud GPS
  coordenadas_lng: Number, // Longitud GPS
  coordenadas: String, // Coordenadas en formato string (formato: "lat,lng" para compatibilidad)
  activo: { type: Boolean, default: true }, // Si el punto de control está activo
  fecha_creacion: { type: Date, default: Date.now },
  fecha_actualizacion: { type: Date, default: Date.now }
}, { collection: 'puntos_control', strict: false, _id: false });

module.exports = mongoose.model('puntos_control', PuntoControlSchema);