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
  // Punto de control y ubicación
  punto_control_id: String, // ID del punto de control
  coordenadas: String, // Coordenadas GPS (formato: "lat,lng" o similar)
  coordenadas_lat: Number, // Latitud GPS (opcional)
  coordenadas_lng: Number, // Longitud GPS (opcional)
  descripcion_ubicacion: String, // Descripción de la ubicación
  // Campos de archivado
  archived: Boolean, // Si el registro está archivado
  archived_at: Date, // Fecha de archivado
  archive_file: String, // Nombre del archivo de archivo
}, { collection: 'asistencias', strict: false, _id: false });

module.exports = mongoose.model('asistencias', AsistenciaSchema);

