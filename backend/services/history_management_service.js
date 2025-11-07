/**
 * Servicio de Gestión de Historial Completo
 * Gestiona almacenamiento permanente, particionamiento y archivado de historial de movimientos
 */

const HistoryRetentionService = require('./history_retention_service');
const DatabaseIndexes = require('../utils/database_indexes');

class HistoryManagementService {
  constructor(AsistenciaModel, PresenciaModel) {
    this.Asistencia = AsistenciaModel;
    this.Presencia = PresenciaModel;
    this.retentionService = new HistoryRetentionService(AsistenciaModel, PresenciaModel);
    this.indexService = new DatabaseIndexes();
    this.initialized = false;
  }

  /**
   * Inicializa el servicio (crea índices y configura políticas)
   */
  async initialize(options = {}) {
    if (this.initialized && !options.force) {
      return { success: true, message: 'Servicio ya inicializado' };
    }

    try {
      console.log('🔧 Inicializando servicio de gestión de historial...');

      // 1. Crear índices optimizados
      console.log('📊 Creando índices optimizados...');
      const indexResults = await this.indexService.createAllIndexes(this.Asistencia, this.Presencia);
      console.log('✅ Índices creados');

      // 2. Inicializar servicio de retención
      await this.retentionService.initialize();
      console.log('✅ Servicio de retención inicializado');

      this.initialized = true;

      return {
        success: true,
        indexes: indexResults,
        message: 'Servicio de gestión de historial inicializado correctamente'
      };
    } catch (error) {
      throw new Error(`Error inicializando servicio de historial: ${error.message}`);
    }
  }

  /**
   * Obtiene historial completo con opciones de filtrado
   */
  async getHistory(options = {}) {
    const {
      collection = 'asistencias', // 'asistencias' o 'presencia'
      fechaInicio = null,
      fechaFin = null,
      codigoUniversitario = null,
      dni = null,
      puntoControlId = null,
      includeArchived = false,
      limit = 1000,
      skip = 0
    } = options;

    try {
      let Model;
      if (collection === 'asistencias') {
        Model = this.Asistencia;
      } else if (collection === 'presencia') {
        Model = this.Presencia;
      } else {
        throw new Error(`Colección desconocida: ${collection}`);
      }

      // Construir query
      const query = {};

      // Filtro de fechas
      if (fechaInicio || fechaFin) {
        const fechaField = collection === 'asistencias' ? 'fecha_hora' : 'hora_entrada';
        query[fechaField] = {};
        if (fechaInicio) {
          query[fechaField].$gte = new Date(fechaInicio);
        }
        if (fechaFin) {
          query[fechaField].$lte = new Date(fechaFin);
        }
      }

      // Filtros específicos
      if (codigoUniversitario) {
        query.codigo_universitario = codigoUniversitario;
      }

      if (dni) {
        query.dni = dni;
      }

      if (puntoControlId) {
        query.punto_control_id = puntoControlId;
      }

      // Filtro de archivado
      if (!includeArchived) {
        query.archived = { $ne: true };
      }

      // Ejecutar consulta con índices optimizados
      const documents = await Model.find(query)
        .sort({ fecha_hora: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      const total = await Model.countDocuments(query);

      return {
        success: true,
        collection,
        documents,
        total,
        returned: documents.length,
        query,
        pagination: {
          limit: parseInt(limit),
          skip: parseInt(skip),
          totalPages: Math.ceil(total / limit),
          currentPage: Math.floor(skip / limit) + 1
        }
      };
    } catch (error) {
      throw new Error(`Error obteniendo historial: ${error.message}`);
    }
  }

  /**
   * Archiva datos antiguos según políticas de retención
   */
  async archiveOldData(options = {}) {
    const {
      collection = 'asistencias',
      forceDate = null,
      dryRun = false
    } = options;

    try {
      console.log(`📦 Archiving old data from ${collection}...`);

      if (dryRun) {
        // Simular archivado sin hacer cambios
        const policy = this.retentionService.retentionPolicies[collection] || 
                      this.retentionService.retentionPolicies.default;
        const cutoffDate = forceDate || new Date();
        cutoffDate.setDate(cutoffDate.getDate() - policy.archiveAfterDays);

        let Model;
        if (collection === 'asistencias') {
          Model = this.Asistencia;
        } else {
          Model = this.Presencia;
        }

        const count = await Model.countDocuments({
          fecha_hora: { $lt: cutoffDate },
          archived: { $ne: true }
        });

        return {
          success: true,
          dryRun: true,
          collection,
          wouldArchive: count,
          cutoffDate: cutoffDate.toISOString(),
          message: `Simulación: Se archivarían ${count} documentos`
        };
      }

      // Ejecutar archivado real
      const result = await this.retentionService.applyRetentionPolicy(collection);
      console.log(`✅ Archived ${result.archived} documents from ${collection}`);

      return result;
    } catch (error) {
      throw new Error(`Error archivando datos: ${error.message}`);
    }
  }

  /**
   * Obtiene estadísticas del historial
   */
  async getHistoryStats() {
    try {
      const asistenciaStats = await this.retentionService.getRetentionStats('asistencias');
      const presenciaStats = await this.retentionService.getRetentionStats('presencia');

      // Estadísticas adicionales
      const totalAsistencias = await this.Asistencia.countDocuments();
      const totalPresencia = await this.Presencia.countDocuments();

      // Estadísticas por período
      const ahora = new Date();
      const ultimoMes = new Date(ahora.getFullYear(), ahora.getMonth() - 1, ahora.getDate());
      const ultimos3Meses = new Date(ahora.getFullYear(), ahora.getMonth() - 3, ahora.getDate());

      const asistenciasUltimoMes = await this.Asistencia.countDocuments({
        fecha_hora: { $gte: ultimoMes }
      });

      const asistenciasUltimos3Meses = await this.Asistencia.countDocuments({
        fecha_hora: { $gte: ultimos3Meses }
      });

      return {
        success: true,
        collections: {
          asistencias: {
            ...asistenciaStats,
            lastMonth: asistenciasUltimoMes,
            last3Months: asistenciasUltimos3Meses
          },
          presencia: presenciaStats
        },
        totals: {
          asistencias: totalAsistencias,
          presencia: totalPresencia
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }
  }

  /**
   * Verifica estado de índices
   */
  async checkIndexesStatus() {
    try {
      const asistenciaIndexes = await this.indexService.checkIndexes(this.Asistencia.collection);
      const presenciaIndexes = await this.indexService.checkIndexes(this.Presencia.collection);

      return {
        success: true,
        asistencias: {
          total: asistenciaIndexes.length,
          indexes: asistenciaIndexes.map(idx => ({
            name: idx.name,
            keys: idx.key,
            v: idx.v
          }))
        },
        presencia: {
          total: presenciaIndexes.length,
          indexes: presenciaIndexes.map(idx => ({
            name: idx.name,
            keys: idx.key,
            v: idx.v
          }))
        }
      };
    } catch (error) {
      throw new Error(`Error verificando índices: ${error.message}`);
    }
  }

  /**
   * Ejecuta mantenimiento completo del historial
   */
  async performMaintenance(options = {}) {
    const {
      createIndexes = true,
      archiveOldData = true,
      collections = ['asistencias', 'presencia']
    } = options;

    try {
      console.log('🔧 Iniciando mantenimiento de historial...');
      const results = {
        indexes: null,
        archiving: {}
      };

      // 1. Crear/verificar índices
      if (createIndexes) {
        console.log('📊 Verificando índices...');
        results.indexes = await this.indexService.createAllIndexes(this.Asistencia, this.Presencia);
        console.log('✅ Índices verificados');
      }

      // 2. Archivar datos antiguos
      if (archiveOldData) {
        for (const collection of collections) {
          console.log(`📦 Archivando datos antiguos de ${collection}...`);
          results.archiving[collection] = await this.archiveOldData({ collection });
          console.log(`✅ ${collection} archivado`);
        }
      }

      // 3. Obtener estadísticas finales
      const stats = await this.getHistoryStats();

      return {
        success: true,
        ...results,
        stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error en mantenimiento: ${error.message}`);
    }
  }

  /**
   * Exporta historial a archivo JSON
   */
  async exportHistory(options = {}) {
    const {
      collection = 'asistencias',
      fechaInicio = null,
      fechaFin = null,
      format = 'json'
    } = options;

    try {
      const history = await this.getHistory({
        collection,
        fechaInicio,
        fechaFin,
        includeArchived: true,
        limit: 100000 // Límite alto para exportación
      });

      const fs = require('fs').promises;
      const path = require('path');
      const exportDir = path.join(__dirname, '../data/exports');
      await fs.mkdir(exportDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `export_${collection}_${timestamp}.${format}`;
      const filepath = path.join(exportDir, filename);

      if (format === 'json') {
        await fs.writeFile(filepath, JSON.stringify(history.documents, null, 2));
      } else if (format === 'csv') {
        // Convertir a CSV (implementación básica)
        const csv = this.convertToCSV(history.documents);
        await fs.writeFile(filepath, csv);
      }

      return {
        success: true,
        filename,
        filepath,
        records: history.documents.length,
        format
      };
    } catch (error) {
      throw new Error(`Error exportando historial: ${error.message}`);
    }
  }

  /**
   * Convierte datos a CSV
   */
  convertToCSV(documents) {
    if (documents.length === 0) return '';

    const headers = Object.keys(documents[0]);
    const rows = [headers.join(',')];

    documents.forEach(doc => {
      const values = headers.map(header => {
        const value = doc[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      rows.push(values.join(','));
    });

    return rows.join('\n');
  }
}

module.exports = HistoryManagementService;
