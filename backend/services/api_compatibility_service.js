/**
 * Servicio de Compatibilidad de API
 * Valida que los endpoints sean compatibles con web y app móvil
 */

class ApiCompatibilityService {
  constructor() {
    this.endpoints = new Map();
    this.compatibilityIssues = [];
  }

  /**
   * Registra un endpoint y valida su compatibilidad
   */
  registerEndpoint(method, path, options = {}) {
    const key = `${method.toUpperCase()} ${path}`;
    
    const endpoint = {
      method: method.toUpperCase(),
      path,
      ...options,
      compatible: {
        web: options.web !== false,
        mobile: options.mobile !== false
      },
      registeredAt: new Date()
    };

    this.endpoints.set(key, endpoint);
    this.validateEndpoint(endpoint);
    
    return endpoint;
  }

  /**
   * Valida que un endpoint sea compatible
   */
  validateEndpoint(endpoint) {
    const issues = [];

    // Validar que el método HTTP sea estándar
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    if (!validMethods.includes(endpoint.method)) {
      issues.push({
        type: 'invalid_method',
        message: `Método HTTP no válido: ${endpoint.method}`,
        severity: 'error'
      });
    }

    // Validar que la ruta sea válida
    if (!endpoint.path || !endpoint.path.startsWith('/')) {
      issues.push({
        type: 'invalid_path',
        message: `Ruta no válida: ${endpoint.path}`,
        severity: 'error'
      });
    }

    // Validar que tenga al menos un cliente compatible
    if (!endpoint.compatible.web && !endpoint.compatible.mobile) {
      issues.push({
        type: 'no_clients',
        message: `Endpoint ${endpoint.method} ${endpoint.path} no es compatible con ningún cliente`,
        severity: 'error'
      });
    }

    // Validar formato de respuesta
    if (endpoint.expectedResponse && !endpoint.expectedResponse.format) {
      issues.push({
        type: 'missing_response_format',
        message: `Endpoint ${endpoint.method} ${endpoint.path} no especifica formato de respuesta`,
        severity: 'warning'
      });
    }

    if (issues.length > 0) {
      this.compatibilityIssues.push({
        endpoint: `${endpoint.method} ${endpoint.path}`,
        issues
      });
    }

    return issues.length === 0;
  }

  /**
   * Obtiene todos los endpoints compatibles con un cliente
   */
  getEndpointsForClient(client) {
    const compatible = [];
    
    for (const [key, endpoint] of this.endpoints.entries()) {
      if (endpoint.compatible[client]) {
        compatible.push(endpoint);
      }
    }

    return compatible;
  }

  /**
   * Valida compatibilidad de un request
   */
  validateRequest(method, path, headers = {}) {
    const key = `${method.toUpperCase()} ${path}`;
    const endpoint = this.endpoints.get(key);

    if (!endpoint) {
      return {
        valid: false,
        error: 'Endpoint no encontrado',
        suggestions: this.findSimilarEndpoints(path)
      };
    }

    // Detectar cliente desde headers
    const client = this.detectClient(headers);
    
    if (!endpoint.compatible[client]) {
      return {
        valid: false,
        error: `Endpoint no compatible con cliente: ${client}`,
        endpoint: endpoint.path,
        compatibleClients: Object.keys(endpoint.compatible).filter(k => endpoint.compatible[k])
      };
    }

    return {
      valid: true,
      endpoint,
      client
    };
  }

  /**
   * Detecta el cliente desde los headers
   */
  detectClient(headers) {
    const userAgent = headers['user-agent'] || headers['User-Agent'] || '';
    
    // Detectar app móvil
    if (userAgent.includes('Flutter') || 
        userAgent.includes('Dart') || 
        headers['x-client-type'] === 'mobile') {
      return 'mobile';
    }

    // Detectar web
    if (userAgent.includes('Mozilla') || 
        userAgent.includes('Chrome') || 
        userAgent.includes('Safari') ||
        headers['x-client-type'] === 'web') {
      return 'web';
    }

    // Por defecto, asumir web
    return 'web';
  }

  /**
   * Encuentra endpoints similares
   */
  findSimilarEndpoints(path) {
    const similar = [];
    const pathParts = path.split('/').filter(p => p);

    for (const [key, endpoint] of this.endpoints.entries()) {
      const endpointParts = endpoint.path.split('/').filter(p => p);
      const similarity = this.calculateSimilarity(pathParts, endpointParts);
      
      if (similarity > 0.5) {
        similar.push({
          endpoint: `${endpoint.method} ${endpoint.path}`,
          similarity
        });
      }
    }

    return similar.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
  }

  /**
   * Calcula similitud entre dos paths
   */
  calculateSimilarity(parts1, parts2) {
    if (parts1.length === 0 || parts2.length === 0) return 0;

    const matches = parts1.filter(p => parts2.includes(p)).length;
    return matches / Math.max(parts1.length, parts2.length);
  }

  /**
   * Genera reporte de compatibilidad
   */
  generateCompatibilityReport() {
    const report = {
      totalEndpoints: this.endpoints.size,
      compatibleWithWeb: 0,
      compatibleWithMobile: 0,
      compatibleWithBoth: 0,
      issues: this.compatibilityIssues,
      endpointsByMethod: {},
      endpointsByClient: {
        web: [],
        mobile: []
      }
    };

    for (const [key, endpoint] of this.endpoints.entries()) {
      // Contar por método
      if (!report.endpointsByMethod[endpoint.method]) {
        report.endpointsByMethod[endpoint.method] = 0;
      }
      report.endpointsByMethod[endpoint.method]++;

      // Contar compatibilidad
      if (endpoint.compatible.web) {
        report.compatibleWithWeb++;
        report.endpointsByClient.web.push(`${endpoint.method} ${endpoint.path}`);
      }
      if (endpoint.compatible.mobile) {
        report.compatibleWithMobile++;
        report.endpointsByClient.mobile.push(`${endpoint.method} ${endpoint.path}`);
      }
      if (endpoint.compatible.web && endpoint.compatible.mobile) {
        report.compatibleWithBoth++;
      }
    }

    return report;
  }

  /**
   * Valida que todos los endpoints críticos estén disponibles
   */
  validateCriticalEndpoints() {
    const criticalEndpoints = [
      { method: 'POST', path: '/login' },
      { method: 'GET', path: '/alumnos/:codigo' },
      { method: 'POST', path: '/asistencias' },
      { method: 'GET', path: '/asistencias' },
      { method: 'GET', path: '/usuarios' },
      { method: 'GET', path: '/health' }
    ];

    const missing = [];
    const incompatible = [];

    for (const critical of criticalEndpoints) {
      // Buscar endpoint exacto o con parámetros
      let found = false;
      for (const [key, endpoint] of this.endpoints.entries()) {
        if (endpoint.method === critical.method) {
          // Comparar paths (ignorando parámetros)
          const endpointPath = endpoint.path.replace(/:[^/]+/g, ':param');
          const criticalPath = critical.path.replace(/:[^/]+/g, ':param');
          
          if (endpointPath === criticalPath) {
            found = true;
            if (!endpoint.compatible.web || !endpoint.compatible.mobile) {
              incompatible.push({
                endpoint: `${critical.method} ${critical.path}`,
                compatible: endpoint.compatible
              });
            }
            break;
          }
        }
      }

      if (!found) {
        missing.push(`${critical.method} ${critical.path}`);
      }
    }

    return {
      allPresent: missing.length === 0,
      allCompatible: incompatible.length === 0,
      missing,
      incompatible
    };
  }
}

module.exports = ApiCompatibilityService;

