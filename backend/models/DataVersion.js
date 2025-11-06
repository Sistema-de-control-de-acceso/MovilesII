// Modelo para versionado de datos y sincronización
const mongoose = require('mongoose');

// Modelo para tracking de versiones de datos
const DataVersionSchema = new mongoose.Schema({
  _id: String, // UUID o identificador único
  collection_name: { type: String, required: true }, // Nombre de la colección
  record_id: { type: String, required: true }, // ID del registro
  version: { type: Number, required: true, default: 1 }, // Número de versión
  last_modified: { type: Date, required: true, default: Date.now }, // Última modificación
  last_modified_by: String, // ID del usuario/device que modificó
  device_id: String, // ID del dispositivo que modificó
  hash: String, // Hash del contenido para detección de cambios
  conflict_resolution: {
    strategy: { 
      type: String, 
      enum: ['server_wins', 'client_wins', 'merge', 'manual', 'last_write_wins'], 
      default: 'last_write_wins' 
    },
    resolved_by: String, // ID del usuario que resolvió
    resolved_at: Date,
    resolution_data: Object // Datos de resolución
  },
  sync_status: { 
    type: String, 
    enum: ['synced', 'pending', 'conflict', 'resolved'], 
    default: 'synced' 
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { collection: 'data_versions', strict: false, _id: false });

// Índice compuesto para búsquedas eficientes
DataVersionSchema.index({ collection_name: 1, record_id: 1 });
DataVersionSchema.index({ sync_status: 1, last_modified: 1 });

// Modelo para tracking de sincronización de dispositivos
const DeviceSyncSchema = new mongoose.Schema({
  _id: String, // UUID del dispositivo
  device_id: { type: String, required: true, unique: true },
  device_name: String,
  device_type: { type: String, enum: ['mobile', 'web', 'tablet'], default: 'mobile' },
  app_version: String,
  last_sync: { type: Date, default: Date.now },
  last_sync_success: Boolean,
  sync_token: String, // Token para sincronización incremental
  pending_changes: Number, // Número de cambios pendientes
  conflict_count: Number, // Número de conflictos
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { collection: 'device_sync', strict: false, _id: false });

// Modelo para cambios pendientes de sincronización
const PendingChangeSchema = new mongoose.Schema({
  _id: String, // UUID
  device_id: { type: String, required: true },
  collection_name: { type: String, required: true },
  record_id: { type: String, required: true },
  operation: { 
    type: String, 
    enum: ['create', 'update', 'delete'], 
    required: true 
  },
  data: Object, // Datos del cambio
  version: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['pending', 'syncing', 'synced', 'conflict', 'failed'], 
    default: 'pending' 
  },
  retry_count: { type: Number, default: 0 },
  error_message: String,
  created_at: { type: Date, default: Date.now }
}, { collection: 'pending_changes', strict: false, _id: false });

// Índices
PendingChangeSchema.index({ device_id: 1, status: 1, timestamp: 1 });
PendingChangeSchema.index({ collection_name: 1, record_id: 1 });

const DataVersion = mongoose.model('data_versions', DataVersionSchema);
const DeviceSync = mongoose.model('device_sync', DeviceSyncSchema);
const PendingChange = mongoose.model('pending_changes', PendingChangeSchema);

module.exports = { DataVersion, DeviceSync, PendingChange };

