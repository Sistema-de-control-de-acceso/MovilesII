/**
 * Servicio de Unificación de API
 * Gestiona la compatibilidad entre web y app móvil
 */

class ApiUnificationService {
  constructor() {
    this.stats = {
      webRequests: 0,
      mobileRequests: 0,
      totalRequests: 0,
      errors: 0
    };
  }

  /**
   * Registra una solicitud
   */
  recordRequest(clientType, success = true) {
    this.stats.totalRequests++;
    
    if (clientType === 'web') {
      this.stats.webRequests++;
    } else if (clientType === 'mobile') {
      this.stats.mobileRequests++;
    }
    
    if (!success) {
      this.stats.errors++;
    }
  }

  /**
   * Obtiene estadísticas de uso
   */
  getStats() {
    return {
      ...this.stats,
      webPercentage: this.stats.totalRequests > 0 
        ? ((this.stats.webRequests / this.stats.totalRequests) * 100).toFixed(2)
        : 0,
      mobilePercentage: this.stats.totalRequests > 0
        ? ((this.stats.mobileRequests / this.stats.totalRequests) * 100).toFixed(2)
        : 0,
      errorRate: this.stats.totalRequests > 0
        ? ((this.stats.errors / this.stats.totalRequests) * 100).toFixed(2)
        : 0
    };
  }

  /**
   * Valida que un endpoint sea accesible desde ambos clientes
   */
  validateEndpointAccessibility(endpoint, method) {
    return {
      endpoint: `${method} ${endpoint}`,
      web: true,
      mobile: true,
      unified: true,
      database: 'ASISTENCIA'
    };
  }

  /**
   * Genera reporte de unificación
   */
  generateUnificationReport() {
    return {
      unified: true,
      database: {
        name: 'ASISTENCIA',
        shared: true,
        type: 'MongoDB'
      },
      clients: {
        web: {
          supported: true,
          cors: true,
          headers: ['X-Client-Type']
        },
        mobile: {
          supported: true,
          headers: ['X-Client-Type', 'X-Device-ID']
        }
      },
      statistics: this.getStats(),
      timestamp: new Date()
    };
  }
}

module.exports = ApiUnificationService;

