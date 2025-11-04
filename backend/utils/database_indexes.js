/**
 * Utilidades para crear y gestionar índices optimizados en MongoDB
 * Índices optimizados para consultas de historial de movimientos
 */

class DatabaseIndexes {
  constructor() {
    this.indexes = {
      asistencias: [],
      presencia: []
    };
  }

  /**
   * Define todos los índices optimizados para la colección de asistencias
   */
  getAsistenciasIndexes() {
    return [
      // Índice compuesto para consultas por fecha y tipo
      {
        keys: { fecha_hora: 1, tipo: 1 },
        options: { name: 'idx_fecha_tipo', background: true }
      },
      // Índice para consultas por estudiante
      {
        keys: { codigo_universitario: 1, fecha_hora: -1 },
        options: { name: 'idx_codigo_fecha', background: true }
      },
      // Índice para consultas por DNI
      {
        keys: { dni: 1, fecha_hora: -1 },
        options: { name: 'idx_dni_fecha', background: true }
      },
      // Índice para punto de control
      {
        keys: { punto_control_id: 1, fecha_hora: -1 },
        options: { name: 'idx_punto_control_fecha', background: true, sparse: true }
      },
      // Índice para consultas por guardia
      {
        keys: { guardia_id: 1, fecha_hora: -1 },
        options: { name: 'idx_guardia_fecha', background: true, sparse: true }
      },
      // Índice para consultas por facultad
      {
        keys: { siglas_facultad: 1, fecha_hora: -1 },
        options: { name: 'idx_facultad_fecha', background: true }
      },
      // Índice para archivado (fecha_hora TTL opcional)
      {
        keys: { fecha_hora: 1 },
        options: { name: 'idx_fecha_hora', background: true }
      },
      // Índice para autorizaciones manuales
      {
        keys: { autorizacion_manual: 1, fecha_hora: -1 },
        options: { name: 'idx_autorizacion_fecha', background: true }
      },
      // Índice compuesto para análisis temporal
      {
        keys: { fecha_hora: 1, siglas_facultad: 1, tipo: 1 },
        options: { name: 'idx_analisis_temporal', background: true }
      }
    ];
  }

  /**
   * Define índices para la colección de presencia
   */
  getPresenciaIndexes() {
    return [
      {
        keys: { estudiante_dni: 1, hora_entrada: -1 },
        options: { name: 'idx_presencia_dni_entrada', background: true }
      },
      {
        keys: { esta_dentro: 1, hora_entrada: -1 },
        options: { name: 'idx_presencia_estado', background: true }
      },
      {
        keys: { hora_entrada: 1 },
        options: { name: 'idx_presencia_entrada', background: true }
      }
    ];
  }

  /**
   * Crea todos los índices optimizados para una colección
   */
  async createIndexes(collection, indexes) {
    const results = [];
    
    for (const index of indexes) {
      try {
        const result = await collection.createIndex(index.keys, index.options);
        results.push({
          name: index.options.name,
          success: true,
          result
        });
      } catch (error) {
        results.push({
          name: index.options.name,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Crea todos los índices para el sistema completo
   */
  async createAllIndexes(AsistenciaModel, PresenciaModel) {
    const results = {
      asistencias: [],
      presencia: []
    };

    // Índices para asistencias
    const asistenciaIndexes = this.getAsistenciasIndexes();
    results.asistencias = await this.createIndexes(AsistenciaModel.collection, asistenciaIndexes);

    // Índices para presencia
    const presenciaIndexes = this.getPresenciaIndexes();
    results.presencia = await this.createIndexes(PresenciaModel.collection, presenciaIndexes);

    return results;
  }

  /**
   * Verifica qué índices existen
   */
  async checkIndexes(collection) {
    return await collection.indexes();
  }

  /**
   * Elimina un índice por nombre
   */
  async dropIndex(collection, indexName) {
    try {
      await collection.dropIndex(indexName);
      return { success: true, message: `Índice ${indexName} eliminado` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Analiza el uso de índices para una consulta
   */
  async explainQuery(collection, query, options = {}) {
    try {
      const explainResult = await collection.find(query, options).explain('executionStats');
      return {
        query,
        executionStats: explainResult.executionStats,
        winningPlan: explainResult.queryPlanner.winningPlan
      };
    } catch (error) {
      throw new Error(`Error explicando query: ${error.message}`);
    }
  }
}

module.exports = DatabaseIndexes;
