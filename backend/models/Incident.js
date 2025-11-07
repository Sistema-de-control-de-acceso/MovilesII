/**
 * Modelo de Incidente para persistencia en BD
 * (Opcional - puede usarse para almacenar incidentes históricos)
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const IncidentSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => uuidv4()
  },
  status: {
    type: String,
    enum: ['healthy', 'degraded', 'unhealthy'],
    required: true
  },
  issues: [{
    type: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['warning', 'critical'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    value: Number,
    threshold: Number,
    source: String
  }],
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: Date,
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  collection: 'incidents',
  timestamps: true,
  _id: false
});

// Índices para consultas rápidas
IncidentSchema.index({ timestamp: -1 });
IncidentSchema.index({ status: 1, resolved: 1 });
IncidentSchema.index({ 'issues.severity': 1 });

module.exports = mongoose.model('Incident', IncidentSchema);

