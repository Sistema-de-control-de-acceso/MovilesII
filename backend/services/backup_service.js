/**
 * Servicio de Backup Automático
 * Realiza backups automáticos de eventos y datos críticos
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class BackupService {
  constructor(EventoModel, AsistenciaModel, PresenciaModel, DecisionManualModel) {
    this.Evento = EventoModel;
    this.Asistencia = AsistenciaModel;
    this.Presencia = PresenciaModel;
    this.DecisionManual = DecisionManualModel;
    this.backupDir = path.join(__dirname, '../backups');
    this.maxBackups = 30; // Mantener últimos 30 backups
  }

  /**
   * Inicializa el servicio de backup
   */
  async initialize() {
    try {
      // Crear directorio de backups si no existe
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log('Servicio de backup inicializado');
    } catch (error) {
      console.error('Error inicializando servicio de backup:', error);
      throw error;
    }
  }

  /**
   * Realiza backup completo de eventos
   */
  async backupEvents(options = {}) {
    try {
      const {
        startDate,
        endDate,
        incremental = false,
        compress = true
      } = options;

      const query = {};
      if (incremental) {
        // Solo eventos no respaldados
        query.backed_up = { $ne: true };
      }
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      const eventos = await this.Evento.find(query).lean();
      
      if (eventos.length === 0) {
        return {
          success: true,
          message: 'No hay eventos para respaldar',
          count: 0
        };
      }

      const backupId = uuidv4();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `eventos_backup_${timestamp}_${backupId}.json`;
      const filepath = path.join(this.backupDir, filename);

      const backupData = {
        backup_id: backupId,
        timestamp: new Date(),
        type: incremental ? 'incremental' : 'full',
        count: eventos.length,
        events: eventos,
        metadata: {
          startDate: startDate || null,
          endDate: endDate || null,
          version: '1.0'
        }
      };

      // Guardar backup
      await fs.writeFile(filepath, JSON.stringify(backupData, null, 2), 'utf8');

      // Marcar eventos como respaldados
      const eventIds = eventos.map(e => e._id);
      await this.Evento.updateMany(
        { _id: { $in: eventIds } },
        {
          $set: {
            backed_up: true,
            backup_date: new Date(),
            backup_file: filename
          }
        }
      );

      // Comprimir si se solicita
      let compressedFile = null;
      if (compress) {
        const zlib = require('zlib');
        const { promisify } = require('util');
        const gzip = promisify(zlib.gzip);
        
        const compressedData = await gzip(JSON.stringify(backupData));
        const compressedFilename = filename.replace('.json', '.json.gz');
        const compressedFilepath = path.join(this.backupDir, compressedFilename);
        await fs.writeFile(compressedFilepath, compressedData);
        compressedFile = compressedFilename;
      }

      // Limpiar backups antiguos
      await this.cleanupOldBackups();

      return {
        success: true,
        backup_id: backupId,
        filename,
        compressed_file: compressedFile,
        count: eventos.length,
        filepath
      };
    } catch (error) {
      console.error('Error realizando backup de eventos:', error);
      throw new Error(`Error en backup: ${error.message}`);
    }
  }

  /**
   * Realiza backup completo de todas las colecciones críticas
   */
  async backupAll(options = {}) {
    try {
      const {
        includeAsistencias = true,
        includePresencia = true,
        includeDecisiones = true,
        includeEventos = true
      } = options;

      const backupId = uuidv4();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `full_backup_${timestamp}_${backupId}.json`;
      const filepath = path.join(this.backupDir, filename);

      const backupData = {
        backup_id: backupId,
        timestamp: new Date(),
        type: 'full',
        collections: {}
      };

      // Backup de eventos
      if (includeEventos) {
        const eventos = await this.Evento.find({}).lean();
        backupData.collections.eventos = {
          count: eventos.length,
          data: eventos
        };
      }

      // Backup de asistencias
      if (includeAsistencias) {
        const asistencias = await this.Asistencia.find({}).lean();
        backupData.collections.asistencias = {
          count: asistencias.length,
          data: asistencias
        };
      }

      // Backup de presencia
      if (includePresencia) {
        const presencia = await this.Presencia.find({}).lean();
        backupData.collections.presencia = {
          count: presencia.length,
          data: presencia
        };
      }

      // Backup de decisiones manuales
      if (includeDecisiones) {
        const decisiones = await this.DecisionManual.find({}).lean();
        backupData.collections.decisiones_manuales = {
          count: decisiones.length,
          data: decisiones
        };
      }

      // Guardar backup
      await fs.writeFile(filepath, JSON.stringify(backupData, null, 2), 'utf8');

      // Limpiar backups antiguos
      await this.cleanupOldBackups();

      return {
        success: true,
        backup_id: backupId,
        filename,
        filepath,
        collections: Object.keys(backupData.collections),
        total_records: Object.values(backupData.collections).reduce((sum, col) => sum + col.count, 0)
      };
    } catch (error) {
      console.error('Error realizando backup completo:', error);
      throw new Error(`Error en backup completo: ${error.message}`);
    }
  }

  /**
   * Restaura datos desde un backup
   */
  async restoreBackup(backupFile, options = {}) {
    try {
      const {
        collection = null, // Restaurar solo una colección específica
        overwrite = false // Sobrescribir datos existentes
      } = options;

      const filepath = path.join(this.backupDir, backupFile);
      
      // Verificar si el archivo existe
      try {
        await fs.access(filepath);
      } catch {
        throw new Error(`Archivo de backup no encontrado: ${backupFile}`);
      }

      // Leer backup
      let backupData;
      if (backupFile.endsWith('.gz')) {
        // Descomprimir
        const zlib = require('zlib');
        const { promisify } = require('util');
        const gunzip = promisify(zlib.gunzip);
        
        const compressedData = await fs.readFile(filepath);
        const decompressedData = await gunzip(compressedData);
        backupData = JSON.parse(decompressedData.toString());
      } else {
        const fileContent = await fs.readFile(filepath, 'utf8');
        backupData = JSON.parse(fileContent);
      }

      const restored = {};

      // Restaurar eventos
      if (backupData.collections?.eventos && (!collection || collection === 'eventos')) {
        const eventos = backupData.collections.eventos.data || backupData.events || [];
        
        if (overwrite) {
          await this.Evento.deleteMany({ _id: { $in: eventos.map(e => e._id) } });
        }
        
        if (eventos.length > 0) {
          await this.Evento.insertMany(eventos, { ordered: false });
          restored.eventos = eventos.length;
        }
      }

      // Restaurar asistencias
      if (backupData.collections?.asistencias && (!collection || collection === 'asistencias')) {
        const asistencias = backupData.collections.asistencias.data || [];
        
        if (overwrite) {
          await this.Asistencia.deleteMany({ _id: { $in: asistencias.map(a => a._id) } });
        }
        
        if (asistencias.length > 0) {
          await this.Asistencia.insertMany(asistencias, { ordered: false });
          restored.asistencias = asistencias.length;
        }
      }

      // Restaurar presencia
      if (backupData.collections?.presencia && (!collection || collection === 'presencia')) {
        const presencia = backupData.collections.presencia.data || [];
        
        if (overwrite) {
          await this.Presencia.deleteMany({ _id: { $in: presencia.map(p => p._id) } });
        }
        
        if (presencia.length > 0) {
          await this.Presencia.insertMany(presencia, { ordered: false });
          restored.presencia = presencia.length;
        }
      }

      // Restaurar decisiones
      if (backupData.collections?.decisiones_manuales && (!collection || collection === 'decisiones_manuales')) {
        const decisiones = backupData.collections.decisiones_manuales.data || [];
        
        if (overwrite) {
          await this.DecisionManual.deleteMany({ _id: { $in: decisiones.map(d => d._id) } });
        }
        
        if (decisiones.length > 0) {
          await this.DecisionManual.insertMany(decisiones, { ordered: false });
          restored.decisiones_manuales = decisiones.length;
        }
      }

      return {
        success: true,
        backup_id: backupData.backup_id,
        restored,
        total_restored: Object.values(restored).reduce((sum, count) => sum + count, 0)
      };
    } catch (error) {
      console.error('Error restaurando backup:', error);
      throw new Error(`Error en restauración: ${error.message}`);
    }
  }

  /**
   * Limpia backups antiguos
   */
  async cleanupOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(f => f.startsWith('eventos_backup_') || f.startsWith('full_backup_'))
        .map(f => ({
          name: f,
          path: path.join(this.backupDir, f),
          stats: null
        }));

      // Obtener estadísticas de archivos
      for (const file of backupFiles) {
        try {
          file.stats = await fs.stat(file.path);
        } catch {
          // Ignorar archivos que no se pueden leer
        }
      }

      // Ordenar por fecha de modificación (más antiguos primero)
      backupFiles.sort((a, b) => {
        if (!a.stats || !b.stats) return 0;
        return a.stats.mtime.getTime() - b.stats.mtime.getTime();
      });

      // Eliminar backups antiguos
      if (backupFiles.length > this.maxBackups) {
        const toDelete = backupFiles.slice(0, backupFiles.length - this.maxBackups);
        for (const file of toDelete) {
          try {
            await fs.unlink(file.path);
            console.log(`Backup eliminado: ${file.name}`);
          } catch (error) {
            console.error(`Error eliminando backup ${file.name}:`, error);
          }
        }
      }

      return {
        total_backups: backupFiles.length,
        deleted: Math.max(0, backupFiles.length - this.maxBackups),
        kept: Math.min(backupFiles.length, this.maxBackups)
      };
    } catch (error) {
      console.error('Error limpiando backups antiguos:', error);
      return { error: error.message };
    }
  }

  /**
   * Lista backups disponibles
   */
  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = [];

      for (const file of files) {
        if (file.startsWith('eventos_backup_') || file.startsWith('full_backup_')) {
          try {
            const filepath = path.join(this.backupDir, file);
            const stats = await fs.stat(filepath);
            backupFiles.push({
              filename: file,
              size: stats.size,
              created: stats.birthtime,
              modified: stats.mtime,
              compressed: file.endsWith('.gz')
            });
          } catch {
            // Ignorar archivos que no se pueden leer
          }
        }
      }

      // Ordenar por fecha de modificación (más recientes primero)
      backupFiles.sort((a, b) => b.modified.getTime() - a.modified.getTime());

      return backupFiles;
    } catch (error) {
      throw new Error(`Error listando backups: ${error.message}`);
    }
  }

  /**
   * Programa backup automático
   */
  scheduleAutomaticBackup(intervalHours = 24) {
    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    // Backup inicial
    this.backupEvents({ incremental: true }).catch(err => {
      console.error('Error en backup automático inicial:', err);
    });

    // Programar backups periódicos
    setInterval(() => {
      this.backupEvents({ incremental: true })
        .then(result => {
          console.log(`Backup automático completado: ${result.count} eventos respaldados`);
        })
        .catch(err => {
          console.error('Error en backup automático:', err);
        });
    }, intervalMs);

    console.log(`Backup automático programado cada ${intervalHours} horas`);
  }
}

module.exports = BackupService;

