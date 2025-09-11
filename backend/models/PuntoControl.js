// Modelo para puntos de control
const mongoose = require('mongoose');

const PuntoControlSchema = new mongoose.Schema({
  _id: String, // UUID o identificador único
  nombre: { type: String, required: true },
  ubicacion: String, // Descripción o coordenadas
  descripcion: String
}, { collection: 'puntos_control', strict: false, _id: false });

module.exports = mongoose.model('puntos_control', PuntoControlSchema);