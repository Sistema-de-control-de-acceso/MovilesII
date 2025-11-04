/**
 * Servicio de Políticas de Retención de Datos
 * Gestiona políticas de retención y archivado de datos históricos
 */

const fs = require('fs').promises;
const path = require('path');

class HistoryRetentionService {
  constructor(AsistenciaModel, PresenciaModel) {
    this.Asistencia = AsistenciaModel;
    this.Presencia = PresenciaModel;
    this.archiveDir = path.join(__dirname, '../data/archives');
    this.retentionPolicies = {
      default: {
        retentionDays: 365, // 1 año por defecto
        archiveAfterDays: 90, // Archivar después de 90 días
        deleteAfterDays: null // No eliminar automáticamente
      },
      asistencias: {
        retentionDays: 730, // 2 años
        archiveAfterDays: 180, // Archivar después de 6 meses
        deleteAfterDays: null
      },
      presencia: {
        retentionDays: 365,
        archiveAfterDays: 90,
        deleteAfterDays: null
      }
    };
  }

  /**
   * Inicializa el directorio de archivos
   */
  async initialize() {
    try {
      await fs.mkdir(this.archiveDir, { recursive: true });
    } catch (error) {
      console.error('Error inicializando directorio de archivos:', error);
    }
  }

  /**
   * Aplica política de retención a una colección
   */
  async applyRetentionPolicy(collectionName, policy = null) {
    const policyConfig = policy || this.retentionPolicies[collectionName] || this.retentionPolicies.default;
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policyConfig.archiveAfterDays);

      let Model;
      if (collectionName === 'asistencias') {
        Model = this.Asistencia;
      } else if (collectionName === 'presencia') {
        Model = this.Presencia;
      } else {
        throw new Error(`Colección desconocida: ${collectionName}`);
      }

      // Encontrar documentos a archivar
      const documentsToArchive = await Model.find({
        fecha_hora: { $lt: cutoffDate }
      }).sort({ fecha_hora: 1 });

      if (documentsToArchive.length === 0) {
        return {
          success: true,
          archived: 0,
          message: 'No hay documentos para archivar'
        };
      }

      // Archivar documentos
      const archiveResult = await this.archiveDocuments(collectionName, documentsToArchive, cutoffDate);

      // Eliminar documentos archivados si está configurado
      if (policyConfig.deleteAfterDays) {
        const deleteCutoffDate = new Date();
        deleteCutoffDate.setDate(deleteCutoffDate.getDate() - policyConfig.deleteAfterDays);
        
        const deletedResult = await Model.deleteMany({
          fecha_hora: { $lt: deleteCutoffDate },
          archived: true
        });

        archiveResult.deleted = deletedResult.deletedCount;
      }

      return archiveResult;
    } catch (error) {
      throw new Error(`Error aplicando política de retención: ${error.message}`);
    }
  }

  /**
   * Archiva documentos a archivos JSON
   */
  async archiveDocuments(collectionName, documents, cutoffDate) {
    await this.initialize();

    // Agrupar por año y mes para particionamiento
    const grouped = {};
    documents.forEach(doc => {
      const fecha = new Date(doc.fecha_hora);
      const year = fecha.getFullYear();
      const month = fecha.getMonth() + 1;
      const key = `${year}-${month.toString().padStart(2, '0')}`;
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(doc.toObject());
    });

    const archiveResults = [];
    const archiveIds = [];

    // Crear archivo por mes
    for (const [key, docs] of Object.entries(grouped)) {
      const filename = `${collectionName}_${key}.json`;
      const filepath = path.join(this.archiveDir, filename);

      // Verificar si el archivo ya existe para agregar datos
      let existingData = [];
      try {
        const existingContent = await fs.readFile(filepath, 'utf8');
        existingData = JSON.parse(existingContent);
      } catch (error) {
        // Archivo no existe, continuar
      }

      // Combinar datos existentes con nuevos
      const combinedData = [...existingData, ...docs];
      
      // Guardar archivo
      await fs.writeFile(filepath, JSON.stringify(combinedData, null, 2));

      // Marcar documentos como archivados en la base de datos
      const ids = docs.map(doc => doc._id);
      if (collectionName === 'asistencias') {
        await this.Asistencia.updateMany(
          { _id: { $in: ids } },
          { $set: { archived: true, archived_at: new Date(), archive_file: filename } }
        );
      } else if (collectionName === 'presencia') {
        await this.Presencia.updateMany(
          { _id: { $in: ids } },
          { $set: { archived: true, archived_at: new Date(), archive_file: filename } }
        );
      }

      archiveResults.push({
        period: key,
        filename,
        count: docs.length,
        totalInFile: combinedData.length
      });

      archiveIds.push(...ids);
    }

    return {
      success: true,
      archived: documents.length,
      archivedIds: archiveIds,
      files: archiveResults,
      cutoffDate: cutoffDate.toISOString()
    };
  }

  /**
   * Restaura documentos desde archivos de archivo
   */
  async restoreFromArchive(collectionName, period) {
    await this.initialize();

    const filename = `${collectionName}_${period}.json`;
    const filepath = path.join(this.archiveDir, filename);

    try {
      const content = await fs.readFile(filepath, 'utf8');
      const documents = JSON.parse(content);

      let Model;
      if (collectionName === 'asistencias') {
        Model = this.Asistencia;
      } else if (collectionName === 'presencia') {
        Model = this.Presencia;
      } else {
        throw new Error(`Colección desconocida: ${collectionName}`);
      }

      // Restaurar documentos
      const restored = [];
      for (const doc of documents) {
        try {
          // Remover campos de archivado
          delete doc.archived;
          delete doc.archived_at;
          delete doc.archive_file;

          const restoredDoc = new Model(doc);
          await restoredDoc.save();
          restored.push(restoredDoc._id);
        } catch (error) {
          console.warn(`Error restaurando documento ${doc._id}:`, error.message);
        }
      }

      return {
        success: true,
        restored: restored.length,
        total: documents.length,
        restoredIds: restored
      };
    } catch (error) {
      throw new Error(`Error restaurando desde archivo: ${error.message}`);
    }
  }

  /**
   * Obtiene estadísticas de retención
   */
  async getRetentionStats(collectionName) {
    let Model;
    if (collectionName === 'asistencias') {
      Model = this.Asistencia;
    } else if (collectionName === 'presencia') {
      Model = this.Presencia;
    } else {
      throw new Error(`Colección desconocida: ${collectionName}`);
    }

    const total = await Model.countDocuments();
    const archived = await Model.countDocuments({ archived: true });
    const active = total - archived;

    // Obtener rango de fechas
    const oldest = await Model.findOne().sort({ fecha_hora: 1 });
    const newest = await Model.findOne().sort({ fecha_hora: -1 });

    // Obtener tamaño de archivos
    let archiveSize = 0;
    let archiveFiles = 0;
    try {
      const files = await fs.readdir(this.archiveDir);
      const archiveFilesList = files.filter(f => f.startsWith(collectionName) && f.endsWith('.json'));
      archiveFiles = archiveFilesList.length;

      for (const file of archiveFilesList) {
        const filepath = path.join(this.archiveDir, file);
        const stats = await fs.stat(filepath);
        archiveSize += stats.size;
      }
    } catch (error) {
      // Directorio no existe o error
    }

    return {
      collection: collectionName,
      total,
      active,
      archived,
      archiveFiles,
      archiveSizeMB: (archiveSize / (1024 * 1024)).toFixed(2),
      dateRange: {
        oldest: oldest ? oldest.fecha_hora : null,
        newest: newest ? newest.fecha_hora : null
      },
      policy: this.retentionPolicies[collectionName] || this.retentionPolicies.default
    };
  }

  /**
   * Configura política de retención personalizada
   */
  setRetentionPolicy(collectionName, policy) {
    this.retentionPolicies[collectionName] = {
      retentionDays: policy.retentionDays || 365,
      archiveAfterDays: policy.archiveAfterDays || 90,
      deleteAfterDays: policy.deleteAfterDays || null
    };
  }

  /**
   * Lista archivos de archivo disponibles
   */
  async listArchiveFiles(collectionName = null) {
    await this.initialize();

    try {
      const files = await fs.readdir(this.archiveDir);
      let archiveFiles = files.filter(f => f.endsWith('.json'));

      if (collectionName) {
        archiveFiles = archiveFiles.filter(f => f.startsWith(collectionName));
      }

      const fileInfo = await Promise.all(
        archiveFiles.map(async (file) => {
          const filepath = path.join(this.archiveDir, file);
          const stats = await fs.stat(filepath);
          const content = await fs.readFile(filepath, 'utf8');
          const data = JSON.parse(content);

          return {
            filename: file,
            size: stats.size,
            sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
            records: data.length,
            created: stats.birthtime,
            modified: stats.mtime
          };
        })
      );

      return fileInfo.sort((a, b) => a.filename.localeCompare(b.filename));
    } catch (error) {
      throw new Error(`Error listando archivos: ${error.message}`);
    }
  }
}

module.exports = HistoryRetentionService;
