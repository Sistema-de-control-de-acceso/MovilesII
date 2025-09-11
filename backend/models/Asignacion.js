// Modelo para asignaciones de guardias a puntos de control
const mongoose = require('mongoose');

const AsignacionSchema = new mongoose.Schema({
  _id: String, // UUID o identificador único
  guardia_id: { type: String, required: true }, // Referencia a usuario
  punto_id: { type: String, required: true }, // Referencia a punto de control
  fecha_inicio: { type: Date, required: true },
  fecha_fin: { type: Date },
  estado: { type: String, enum: ['activa', 'finalizada'], default: 'activa' }
}, { collection: 'asignaciones', strict: false, _id: false });

module.exports = mongoose.model('asignaciones', AsignacionSchema);