const mongoose = require('mongoose');

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
  tiempo_en_campus: Number,
}, { collection: 'presencia', strict: false, _id: false });

module.exports = mongoose.model('presencia', PresenciaSchema);

