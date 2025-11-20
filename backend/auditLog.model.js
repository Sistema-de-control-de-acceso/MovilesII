// Esquema de base de datos para logs de auditoría en MongoDB (Mongoose)
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  entity: { type: String, required: true }, // entidad afectada
  entityId: { type: String },
  action: { type: String, required: true }, // CRUD
  user: { type: String, required: true }, // usuario que realizó la acción
  timestamp: { type: Date, default: Date.now },
  ip: { type: String },
  details: { type: Object },
}, {
  collection: 'audit_logs',
  versionKey: false
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
