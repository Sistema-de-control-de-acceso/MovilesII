const mongoose = require('mongoose');

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
  guardia_id: String,
  guardia_nombre: String,
  autorizacion_manual: Boolean,
  razon_decision: String,
  timestamp_decision: Date,
  coordenadas: String,
  descripcion_ubicacion: String,
}, { collection: 'asistencias', strict: false, _id: false });

module.exports = mongoose.model('asistencias', AsistenciaSchema);

