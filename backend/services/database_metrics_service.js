/**
 * Servicio de Métricas de Base de Datos
 * 
 * Proporciona métricas de conexiones, queries lentas y estado de BD
 */

const mongoose = require('mongoose');

class DatabaseMetricsService {
  constructor() {
    this.slowQueries = [];
    this.queryStats = {
      total: 0,
      slow: 0,
      errors: 0,
      averageTime: 0
    };
    this.maxSlowQueries = 100; // Mantener solo las últimas 100 queries lentas
  }

  /**
   * Obtener estado de conexión
   */
  getConnectionStatus() {
    const connection = mongoose.connection;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
      99: 'uninitialized'
    };

    const readyState = connection.readyState;
    const stateName = states[readyState] || 'unknown';

    return {
      state: readyState,
      stateName,
      isConnected: readyState === 1,
      host: connection.host,
      port: connection.port,
      name: connection.name,
      db: connection.db?.databaseName || null
    };
  }

  /**
   * Obtener estadísticas de conexiones
   */
  async getConnectionStats() {
    const connection = mongoose.connection;
    const db = connection.db;

    if (!db || connection.readyState !== 1) {
      return {
        available: false,
        message: 'Database not connected'
      };
    }

    try {
      // Obtener estadísticas del servidor
      const serverStatus = await db.admin().serverStatus();
      
      // Estadísticas de conexiones
      const connections = serverStatus.connections || {};
      const network = serverStatus.network || {};
      const opcounters = serverStatus.opcounters || {};

      return {
        available: true,
        connections: {
          current: connections.current || 0,
          available: connections.available || 0,
          active: connections.active || 0,
          totalCreated: connections.totalCreated || 0
        },
        network: {
          bytesIn: network.bytesIn || 0,
          bytesOut: network.bytesOut || 0,
          numRequests: network.numRequests || 0
        },
        operations: {
          insert: opcounters.insert || 0,
          query: opcounters.query || 0,
          update: opcounters.update || 0,
          delete: opcounters.delete || 0,
          getmore: opcounters.getmore || 0,
          command: opcounters.command || 0
        },
        uptime: serverStatus.uptime || 0,
        version: serverStatus.version || 'unknown'
      };
    } catch (error) {
      return {
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener estadísticas de colecciones
   */
  async getCollectionStats() {
    const connection = mongoose.connection;
    const db = connection.db;

    if (!db || connection.readyState !== 1) {
      return {
        available: false,
        collections: []
      };
    }

    try {
      const collections = await db.listCollections().toArray();
      const stats = [];

      for (const collection of collections) {
        try {
          const collStats = await db.collection(collection.name).stats();
          stats.push({
            name: collection.name,
            count: collStats.count || 0,
            size: collStats.size || 0,
            sizeMB: (collStats.size || 0) / 1024 / 1024,
            storageSize: collStats.storageSize || 0,
            storageSizeMB: (collStats.storageSize || 0) / 1024 / 1024,
            indexes: collStats.nindexes || 0,
            indexSize: collStats.totalIndexSize || 0,
            indexSizeMB: (collStats.totalIndexSize || 0) / 1024 / 1024
          });
        } catch (err) {
          // Ignorar errores de colecciones sin permisos
          stats.push({
            name: collection.name,
            error: 'No access'
          });
        }
      }

      return {
        available: true,
        collections: stats,
        totalCollections: collections.length
      };
    } catch (error) {
      return {
        available: false,
        error: error.message,
        collections: []
      };
    }
  }

  /**
   * Registrar query lenta
   */
  recordSlowQuery(query, duration, error = null) {
    const slowQuery = {
      query: typeof query === 'string' ? query : JSON.stringify(query),
      duration,
      timestamp: new Date().toISOString(),
      error: error ? error.message : null
    };

    this.slowQueries.unshift(slowQuery);
    
    // Mantener solo las últimas N queries
    if (this.slowQueries.length > this.maxSlowQueries) {
      this.slowQueries = this.slowQueries.slice(0, this.maxSlowQueries);
    }

    // Actualizar estadísticas
    this.queryStats.total++;
    if (duration > 1000) { // Más de 1 segundo
      this.queryStats.slow++;
    }
    if (error) {
      this.queryStats.errors++;
    }

    // Actualizar tiempo promedio (simple moving average)
    const totalTime = this.queryStats.averageTime * (this.queryStats.total - 1) + duration;
    this.queryStats.averageTime = totalTime / this.queryStats.total;
  }

  /**
   * Obtener queries lentas
   */
  getSlowQueries(limit = 10) {
    return {
      queries: this.slowQueries.slice(0, limit),
      total: this.slowQueries.length,
      stats: this.queryStats
    };
  }

  /**
   * Limpiar queries lentas antiguas
   */
  clearSlowQueries(olderThanHours = 24) {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - olderThanHours);

    this.slowQueries = this.slowQueries.filter(query => {
      return new Date(query.timestamp) > cutoff;
    });
  }

  /**
   * Obtener todas las métricas de BD
   */
  async getAllMetrics() {
    const connectionStatus = this.getConnectionStatus();
    const connectionStats = await this.getConnectionStats();
    const collectionStats = await this.getCollectionStats();
    const slowQueries = this.getSlowQueries(20);

    return {
      connection: connectionStatus,
      stats: connectionStats,
      collections: collectionStats,
      slowQueries,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Verificar salud de la BD
   */
  async checkHealth(thresholds = {}) {
    const defaults = {
      maxConnections: 100,
      slowQueryThreshold: 1000, // ms
      maxSlowQueries: 10
    };

    const config = { ...defaults, ...thresholds };
    const metrics = await this.getAllMetrics();
    
    const issues = [];
    let status = 'healthy';

    // Verificar conexión
    if (!metrics.connection.isConnected) {
      issues.push({
        type: 'connection',
        severity: 'critical',
        message: `Database is ${metrics.connection.stateName}`,
        value: metrics.connection.stateName
      });
      status = 'unhealthy';
      return { status, metrics, issues, timestamp: new Date().toISOString() };
    }

    // Verificar conexiones activas
    if (metrics.stats.available && metrics.stats.connections) {
      const activeConnections = metrics.stats.connections.active || 0;
      if (activeConnections > config.maxConnections) {
        issues.push({
          type: 'connections',
          severity: 'warning',
          message: `Active connections: ${activeConnections} (threshold: ${config.maxConnections})`,
          value: activeConnections,
          threshold: config.maxConnections
        });
        status = 'degraded';
      }
    }

    // Verificar queries lentas recientes
    const recentSlowQueries = metrics.slowQueries.queries.filter(q => {
      const queryTime = new Date(q.timestamp);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return queryTime > oneHourAgo && q.duration > config.slowQueryThreshold;
    });

    if (recentSlowQueries.length > config.maxSlowQueries) {
      issues.push({
        type: 'slowQueries',
        severity: 'warning',
        message: `${recentSlowQueries.length} slow queries in the last hour (threshold: ${config.maxSlowQueries})`,
        value: recentSlowQueries.length,
        threshold: config.maxSlowQueries
      });
      status = 'degraded';
    }

    return {
      status,
      metrics,
      issues,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = DatabaseMetricsService;

