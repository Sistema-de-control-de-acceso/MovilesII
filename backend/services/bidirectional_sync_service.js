/**
 * Servicio de Sincronización Bidireccional
 * Maneja sincronización bidireccional, versionado y resolución de conflictos
 */

const crypto = require('crypto');

class BidirectionalSyncService {
  constructor(DataVersionModel, DeviceSyncModel, PendingChangeModel, AsistenciaModel, PresenciaModel) {
    this.DataVersion = DataVersionModel;
    this.DeviceSync = DeviceSyncModel;
    this.PendingChange = PendingChangeModel;
    this.Asistencia = AsistenciaModel;
    this.Presencia = PresenciaModel;
  }

  /**
   * Calcula hash de un objeto para detección de cambios
   */
  calculateHash(data) {
    const str = JSON.stringify(data);
    return crypto.createHash('md5').update(str).digest('hex');
  }

  /**
   * Obtiene o crea versión de un registro
   */
  async getOrCreateVersion(collectionName, recordId, data = null) {
    try {
      let version = await this.DataVersion.findOne({
        collection_name: collectionName,
        record_id: recordId
      });

      if (!version) {
        const { v4: uuidv4 } = require('uuid');
        const hash = data ? this.calculateHash(data) : '';
        
        version = new this.DataVersion({
          _id: uuidv4(),
          collection_name: collectionName,
          record_id: recordId,
          version: 1,
          last_modified: new Date(),
          hash: hash,
          sync_status: 'synced',
          created_at: new Date(),
          updated_at: new Date()
        });
        await version.save();
      }

      return version;
    } catch (error) {
      throw new Error(`Error obteniendo/creando versión: ${error.message}`);
    }
  }

  /**
   * Incrementa versión de un registro
   */
  async incrementVersion(collectionName, recordId, modifiedBy, deviceId, data) {
    try {
      const version = await this.getOrCreateVersion(collectionName, recordId, data);
      const newHash = this.calculateHash(data);
      
      // Si el hash cambió, incrementar versión
      if (version.hash !== newHash) {
        version.version += 1;
        version.last_modified = new Date();
        version.last_modified_by = modifiedBy;
        version.device_id = deviceId;
        version.hash = newHash;
        version.sync_status = 'synced';
        version.updated_at = new Date();
        await version.save();
      }

      return version;
    } catch (error) {
      throw new Error(`Error incrementando versión: ${error.message}`);
    }
  }

  /**
   * Registra o actualiza dispositivo
   */
  async registerDevice(deviceId, deviceInfo = {}) {
    try {
      const { v4: uuidv4 } = require('uuid');
      
      let device = await this.DeviceSync.findOne({ device_id: deviceId });
      
      if (!device) {
        device = new this.DeviceSync({
          _id: uuidv4(),
          device_id: deviceId,
          device_name: deviceInfo.device_name || 'Unknown',
          device_type: deviceInfo.device_type || 'mobile',
          app_version: deviceInfo.app_version || '1.0.0',
          last_sync: new Date(),
          last_sync_success: true,
          sync_token: this.generateSyncToken(),
          pending_changes: 0,
          conflict_count: 0,
          created_at: new Date(),
          updated_at: new Date()
        });
      } else {
        device.device_name = deviceInfo.device_name || device.device_name;
        device.device_type = deviceInfo.device_type || device.device_type;
        device.app_version = deviceInfo.app_version || device.app_version;
        device.updated_at = new Date();
      }

      await device.save();
      return device;
    } catch (error) {
      throw new Error(`Error registrando dispositivo: ${error.message}`);
    }
  }

  /**
   * Genera token de sincronización
   */
  generateSyncToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Obtiene cambios desde el servidor (pull)
   */
  async getServerChanges(deviceId, lastSyncTimestamp, collections = []) {
    try {
      const device = await this.DeviceSync.findOne({ device_id: deviceId });
      if (!device) {
        throw new Error('Dispositivo no registrado');
      }

      const changes = [];
      const lastSync = lastSyncTimestamp ? new Date(lastSyncTimestamp) : new Date(0);

      // Obtener versiones modificadas después de lastSync
      const modifiedVersions = await this.DataVersion.find({
        last_modified: { $gt: lastSync },
        sync_status: { $ne: 'conflict' }
      }).sort({ last_modified: 1 });

      // Agrupar por colección y obtener datos
      const collectionsToSync = collections.length > 0 ? collections : ['asistencias', 'presencia'];
      
      for (const version of modifiedVersions) {
        if (collectionsToSync.includes(version.collection_name)) {
          // Obtener datos del registro
          const recordData = await this.getRecordData(version.collection_name, version.record_id);
          
          if (recordData) {
            changes.push({
              collection: version.collection_name,
              record_id: version.record_id,
              operation: 'update',
              data: recordData,
              version: version.version,
              last_modified: version.last_modified,
              hash: version.hash
            });
          }
        }
      }

      // Actualizar último sync del dispositivo
      device.last_sync = new Date();
      device.last_sync_success = true;
      await device.save();

      return {
        changes,
        sync_token: device.sync_token,
        server_timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Error obteniendo cambios del servidor: ${error.message}`);
    }
  }

  /**
   * Obtiene datos de un registro según la colección
   */
  async getRecordData(collectionName, recordId) {
    try {
      let Model;
      switch (collectionName) {
        case 'asistencias':
          Model = this.Asistencia;
          break;
        case 'presencia':
          Model = this.Presencia;
          break;
        default:
          return null;
      }

      const record = await Model.findById(recordId).lean();
      return record;
    } catch (error) {
      return null;
    }
  }

  /**
   * Sube cambios desde el cliente (push)
   */
  async uploadClientChanges(deviceId, changes) {
    try {
      const device = await this.DeviceSync.findOne({ device_id: deviceId });
      if (!device) {
        throw new Error('Dispositivo no registrado');
      }

      const results = {
        synced: [],
        conflicts: [],
        errors: []
      };

      for (const change of changes) {
        try {
          const result = await this.processChange(deviceId, change);
          
          if (result.status === 'conflict') {
            results.conflicts.push(result);
          } else if (result.status === 'error') {
            results.errors.push(result);
          } else {
            results.synced.push(result);
          }
        } catch (error) {
          results.errors.push({
            record_id: change.record_id,
            collection: change.collection,
            error: error.message
          });
        }
      }

      // Actualizar estadísticas del dispositivo
      device.pending_changes = results.conflicts.length;
      device.conflict_count = (device.conflict_count || 0) + results.conflicts.length;
      device.last_sync = new Date();
      device.last_sync_success = results.errors.length === 0;
      await device.save();

      return results;
    } catch (error) {
      throw new Error(`Error subiendo cambios del cliente: ${error.message}`);
    }
  }

  /**
   * Procesa un cambio individual
   */
  async processChange(deviceId, change) {
    try {
      const { collection, record_id, operation, data, version, hash } = change;

      // Obtener versión actual del servidor
      const serverVersion = await this.getOrCreateVersion(collection, record_id);

      // Verificar conflictos
      if (serverVersion.version > version) {
        // Conflicto: el servidor tiene una versión más reciente
        return await this.handleConflict(deviceId, collection, record_id, change, serverVersion);
      }

      // Aplicar cambio
      let result;
      switch (operation) {
        case 'create':
          result = await this.applyCreate(collection, data, deviceId);
          break;
        case 'update':
          result = await this.applyUpdate(collection, record_id, data, deviceId);
          break;
        case 'delete':
          result = await this.applyDelete(collection, record_id, deviceId);
          break;
        default:
          throw new Error(`Operación no soportada: ${operation}`);
      }

      // Actualizar versión
      if (result.success) {
        await this.incrementVersion(collection, record_id, data?.guardia_id || deviceId, deviceId, result.data);
      }

      return {
        status: 'synced',
        record_id: record_id,
        collection: collection,
        version: serverVersion.version + 1
      };
    } catch (error) {
      return {
        status: 'error',
        record_id: change.record_id,
        collection: change.collection,
        error: error.message
      };
    }
  }

  /**
   * Maneja conflictos
   */
  async handleConflict(deviceId, collection, recordId, clientChange, serverVersion) {
    try {
      // Obtener datos del servidor
      const serverData = await this.getRecordData(collection, recordId);

      // Marcar versión como conflicto
      serverVersion.sync_status = 'conflict';
      serverVersion.conflict_resolution = {
        strategy: 'last_write_wins', // Por defecto
        resolution_data: {
          client_data: clientChange.data,
          server_data: serverData,
          client_version: clientChange.version,
          server_version: serverVersion.version
        }
      };
      await serverVersion.save();

      // Guardar cambio pendiente para resolución
      const { v4: uuidv4 } = require('uuid');
      const pendingChange = new this.PendingChange({
        _id: uuidv4(),
        device_id: deviceId,
        collection_name: collection,
        record_id: recordId,
        operation: clientChange.operation,
        data: clientChange.data,
        version: clientChange.version,
        timestamp: new Date(),
        status: 'conflict',
        created_at: new Date()
      });
      await pendingChange.save();

      return {
        status: 'conflict',
        record_id: recordId,
        collection: collection,
        client_version: clientChange.version,
        server_version: serverVersion.version,
        server_data: serverData,
        conflict_id: pendingChange._id
      };
    } catch (error) {
      throw new Error(`Error manejando conflicto: ${error.message}`);
    }
  }

  /**
   * Aplica operación create
   */
  async applyCreate(collection, data, deviceId) {
    try {
      let Model;
      switch (collection) {
        case 'asistencias':
          Model = this.Asistencia;
          break;
        case 'presencia':
          Model = this.Presencia;
          break;
        default:
          throw new Error(`Colección no soportada: ${collection}`);
      }

      const record = new Model(data);
      await record.save();

      return {
        success: true,
        data: record.toObject()
      };
    } catch (error) {
      throw new Error(`Error aplicando create: ${error.message}`);
    }
  }

  /**
   * Aplica operación update
   */
  async applyUpdate(collection, recordId, data, deviceId) {
    try {
      let Model;
      switch (collection) {
        case 'asistencias':
          Model = this.Asistencia;
          break;
        case 'presencia':
          Model = this.Presencia;
          break;
        default:
          throw new Error(`Colección no soportada: ${collection}`);
      }

      const record = await Model.findByIdAndUpdate(recordId, data, { new: true });
      if (!record) {
        throw new Error('Registro no encontrado');
      }

      return {
        success: true,
        data: record.toObject()
      };
    } catch (error) {
      throw new Error(`Error aplicando update: ${error.message}`);
    }
  }

  /**
   * Aplica operación delete
   */
  async applyDelete(collection, recordId, deviceId) {
    try {
      let Model;
      switch (collection) {
        case 'asistencias':
          Model = this.Asistencia;
          break;
        case 'presencia':
          Model = this.Presencia;
          break;
        default:
          throw new Error(`Colección no soportada: ${collection}`);
      }

      const record = await Model.findByIdAndDelete(recordId);
      if (!record) {
        throw new Error('Registro no encontrado');
      }

      return {
        success: true,
        data: null
      };
    } catch (error) {
      throw new Error(`Error aplicando delete: ${error.message}`);
    }
  }

  /**
   * Resuelve un conflicto
   */
  async resolveConflict(conflictId, resolutionStrategy, resolvedBy, resolutionData = null) {
    try {
      const pendingChange = await this.PendingChange.findById(conflictId);
      if (!pendingChange || pendingChange.status !== 'conflict') {
        throw new Error('Conflicto no encontrado o ya resuelto');
      }

      const version = await this.DataVersion.findOne({
        collection_name: pendingChange.collection_name,
        record_id: pendingChange.record_id
      });

      if (!version) {
        throw new Error('Versión no encontrada');
      }

      let finalData;
      switch (resolutionStrategy) {
        case 'server_wins':
          // Mantener datos del servidor
          finalData = version.conflict_resolution.resolution_data.server_data;
          break;
        case 'client_wins':
          // Usar datos del cliente
          finalData = pendingChange.data;
          break;
        case 'merge':
          // Fusionar datos (requiere lógica específica)
          finalData = resolutionData || this.mergeData(
            version.conflict_resolution.resolution_data.server_data,
            pendingChange.data
          );
          break;
        case 'last_write_wins':
          // Usar el más reciente
          const clientTime = new Date(pendingChange.timestamp);
          const serverTime = version.last_modified;
          finalData = clientTime > serverTime ? pendingChange.data : version.conflict_resolution.resolution_data.server_data;
          break;
        default:
          throw new Error(`Estrategia de resolución no soportada: ${resolutionStrategy}`);
      }

      // Aplicar resolución
      await this.applyUpdate(
        pendingChange.collection_name,
        pendingChange.record_id,
        finalData,
        resolvedBy
      );

      // Actualizar versión
      version.sync_status = 'resolved';
      version.conflict_resolution.strategy = resolutionStrategy;
      version.conflict_resolution.resolved_by = resolvedBy;
      version.conflict_resolution.resolved_at = new Date();
      version.conflict_resolution.resolution_data = finalData;
      await version.save();

      // Marcar cambio como resuelto
      pendingChange.status = 'synced';
      await pendingChange.save();

      return {
        success: true,
        record_id: pendingChange.record_id,
        collection: pendingChange.collection_name,
        version: version.version + 1
      };
    } catch (error) {
      throw new Error(`Error resolviendo conflicto: ${error.message}`);
    }
  }

  /**
   * Fusiona datos de conflicto (merge básico)
   */
  mergeData(serverData, clientData) {
    // Merge simple: priorizar datos del cliente pero mantener campos del servidor que no existen en cliente
    return {
      ...serverData,
      ...clientData,
      // Mantener timestamps del servidor para campos de sistema
      fecha_creacion: serverData.fecha_creacion || clientData.fecha_creacion,
      fecha_actualizacion: new Date()
    };
  }

  /**
   * Obtiene conflictos pendientes
   */
  async getPendingConflicts(deviceId = null) {
    try {
      const query = { status: 'conflict' };
      if (deviceId) {
        query.device_id = deviceId;
      }

      const conflicts = await this.PendingChange.find(query)
        .sort({ timestamp: -1 })
        .lean();

      // Enriquecer con información de versión
      const enrichedConflicts = await Promise.all(conflicts.map(async (conflict) => {
        const version = await this.DataVersion.findOne({
          collection_name: conflict.collection_name,
          record_id: conflict.record_id
        });

        return {
          ...conflict,
          server_version: version?.version,
          server_data: version?.conflict_resolution?.resolution_data?.server_data
        };
      }));

      return enrichedConflicts;
    } catch (error) {
      throw new Error(`Error obteniendo conflictos: ${error.message}`);
    }
  }

  /**
   * Sincronización completa bidireccional
   */
  async performBidirectionalSync(deviceId, deviceInfo, lastSyncTimestamp, clientChanges) {
    try {
      // Registrar dispositivo
      await this.registerDevice(deviceId, deviceInfo);

      // Obtener cambios del servidor (pull)
      const serverChanges = await this.getServerChanges(deviceId, lastSyncTimestamp);

      // Subir cambios del cliente (push)
      const uploadResults = await this.uploadClientChanges(deviceId, clientChanges || []);

      return {
        server_changes: serverChanges,
        upload_results: uploadResults,
        sync_timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Error en sincronización bidireccional: ${error.message}`);
    }
  }
}

module.exports = BidirectionalSyncService;

