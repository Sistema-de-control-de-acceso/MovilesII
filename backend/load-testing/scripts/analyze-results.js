/**
 * Script de análisis de resultados de pruebas de carga
 * 
 * Analiza archivos JSON de resultados de K6 y genera reportes
 */

const fs = require('fs');
const path = require('path');

class LoadTestAnalyzer {
  constructor(resultsFile) {
    this.results = this.loadResults(resultsFile);
    this.metrics = this.calculateMetrics();
  }

  loadResults(filePath) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error cargando resultados: ${error.message}`);
      process.exit(1);
    }
  }

  calculateMetrics() {
    const metrics = this.results.metrics || {};
    
    // Métricas de HTTP
    const httpReqDuration = metrics.http_req_duration?.values || {};
    const httpReqFailed = metrics.http_req_failed?.values || {};
    const httpReqs = metrics.http_reqs?.values || {};
    const checks = metrics.checks?.values || {};

    // Calcular percentiles
    const percentiles = this.calculatePercentiles(httpReqDuration);

    return {
      // Tiempos de respuesta
      responseTime: {
        min: httpReqDuration.min || 0,
        max: httpReqDuration.max || 0,
        avg: httpReqDuration.avg || 0,
        p50: percentiles.p50,
        p95: percentiles.p95,
        p99: percentiles.p99,
      },
      
      // Tasa de éxito
      successRate: {
        total: httpReqs.count || 0,
        failed: httpReqFailed.count || 0,
        rate: 1 - (httpReqFailed.rate || 0),
        percentage: (1 - (httpReqFailed.rate || 0)) * 100,
      },
      
      // Checks
      checks: {
        passed: checks.passes || 0,
        failed: checks.fails || 0,
        rate: checks.rate || 0,
        percentage: (checks.rate || 0) * 100,
      },
      
      // Throughput
      throughput: {
        requestsPerSecond: httpReqs.rate || 0,
        totalRequests: httpReqs.count || 0,
      },
      
      // Duración de la prueba
      duration: {
        total: this.results.root_group?.duration || 0,
        formatted: this.formatDuration(this.results.root_group?.duration || 0),
      },
    };
  }

  calculatePercentiles(values) {
    if (!values || !Array.isArray(values.values)) {
      return { p50: 0, p95: 0, p99: 0 };
    }

    const sorted = [...values.values].sort((a, b) => a - b);
    const len = sorted.length;

    return {
      p50: sorted[Math.floor(len * 0.50)] || 0,
      p95: sorted[Math.floor(len * 0.95)] || 0,
      p99: sorted[Math.floor(len * 0.99)] || 0,
    };
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  checkThresholds() {
    const issues = [];
    const m = this.metrics;

    // Verificar tiempo de respuesta promedio < 200ms
    if (m.responseTime.avg > 200) {
      issues.push({
        type: 'warning',
        metric: 'response_time_avg',
        value: m.responseTime.avg,
        threshold: 200,
        message: `Tiempo de respuesta promedio (${m.responseTime.avg.toFixed(2)}ms) excede el umbral de 200ms`,
      });
    }

    // Verificar P95 < 500ms
    if (m.responseTime.p95 > 500) {
      issues.push({
        type: 'warning',
        metric: 'response_time_p95',
        value: m.responseTime.p95,
        threshold: 500,
        message: `P95 (${m.responseTime.p95.toFixed(2)}ms) excede el umbral de 500ms`,
      });
    }

    // Verificar tasa de éxito > 99.5%
    if (m.successRate.percentage < 99.5) {
      issues.push({
        type: 'critical',
        metric: 'success_rate',
        value: m.successRate.percentage,
        threshold: 99.5,
        message: `Tasa de éxito (${m.successRate.percentage.toFixed(2)}%) está por debajo del umbral de 99.5%`,
      });
    }

    // Verificar checks > 99.5%
    if (m.checks.percentage < 99.5) {
      issues.push({
        type: 'warning',
        metric: 'checks_rate',
        value: m.checks.percentage,
        threshold: 99.5,
        message: `Tasa de checks (${m.checks.percentage.toFixed(2)}%) está por debajo del umbral de 99.5%`,
      });
    }

    return issues;
  }

  generateReport() {
    const m = this.metrics;
    const issues = this.checkThresholds();

    const report = {
      summary: {
        testDuration: m.duration.formatted,
        totalRequests: m.throughput.totalRequests,
        requestsPerSecond: m.throughput.requestsPerSecond.toFixed(2),
        successRate: `${m.successRate.percentage.toFixed(2)}%`,
        checksRate: `${m.checks.percentage.toFixed(2)}%`,
      },
      performance: {
        responseTime: {
          min: `${m.responseTime.min.toFixed(2)}ms`,
          max: `${m.responseTime.max.toFixed(2)}ms`,
          avg: `${m.responseTime.avg.toFixed(2)}ms`,
          p50: `${m.responseTime.p50.toFixed(2)}ms`,
          p95: `${m.responseTime.p95.toFixed(2)}ms`,
          p99: `${m.responseTime.p99.toFixed(2)}ms`,
        },
      },
      thresholds: {
        passed: issues.filter(i => i.type === 'warning').length === 0 && issues.filter(i => i.type === 'critical').length === 0,
        issues: issues,
      },
      recommendations: this.generateRecommendations(issues),
    };

    return report;
  }

  generateRecommendations(issues) {
    const recommendations = [];

    if (issues.some(i => i.metric === 'response_time_avg')) {
      recommendations.push({
        priority: 'high',
        issue: 'Tiempo de respuesta promedio alto',
        actions: [
          'Optimizar queries de base de datos',
          'Implementar caching para consultas frecuentes',
          'Revisar índices de base de datos',
          'Considerar escalamiento horizontal',
        ],
      });
    }

    if (issues.some(i => i.metric === 'success_rate')) {
      recommendations.push({
        priority: 'critical',
        issue: 'Tasa de éxito baja',
        actions: [
          'Revisar logs de errores',
          'Verificar capacidad de base de datos',
          'Revisar configuración de rate limiting',
          'Verificar recursos del servidor (CPU, memoria)',
        ],
      });
    }

    if (issues.some(i => i.metric === 'response_time_p95')) {
      recommendations.push({
        priority: 'medium',
        issue: 'P95 alto (algunas requests lentas)',
        actions: [
          'Identificar endpoints más lentos',
          'Optimizar operaciones costosas',
          'Implementar timeouts apropiados',
          'Revisar conexiones de base de datos',
        ],
      });
    }

    return recommendations;
  }

  printReport() {
    const report = this.generateReport();
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 REPORTE DE PRUEBAS DE CARGA');
    console.log('='.repeat(80));
    
    console.log('\n📈 RESUMEN:');
    console.log(`  Duración: ${report.summary.testDuration}`);
    console.log(`  Total de Requests: ${report.summary.totalRequests}`);
    console.log(`  Requests/segundo: ${report.summary.requestsPerSecond}`);
    console.log(`  Tasa de éxito: ${report.summary.successRate}`);
    console.log(`  Tasa de checks: ${report.summary.checksRate}`);
    
    console.log('\n⚡ PERFORMANCE:');
    console.log(`  Tiempo de respuesta:`);
    console.log(`    Min: ${report.performance.responseTime.min}`);
    console.log(`    Max: ${report.performance.responseTime.max}`);
    console.log(`    Promedio: ${report.performance.responseTime.avg}`);
    console.log(`    P50: ${report.performance.responseTime.p50}`);
    console.log(`    P95: ${report.performance.responseTime.p95}`);
    console.log(`    P99: ${report.performance.responseTime.p99}`);
    
    console.log('\n✅ THRESHOLDS:');
    if (report.thresholds.passed) {
      console.log('  ✅ Todos los thresholds pasaron');
    } else {
      console.log('  ❌ Algunos thresholds fallaron:');
      report.thresholds.issues.forEach(issue => {
        const icon = issue.type === 'critical' ? '🔴' : '🟡';
        console.log(`    ${icon} ${issue.message}`);
      });
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMENDACIONES:');
      report.recommendations.forEach((rec, idx) => {
        const priorityIcon = rec.priority === 'critical' ? '🔴' : rec.priority === 'high' ? '🟠' : '🟡';
        console.log(`\n  ${idx + 1}. ${priorityIcon} ${rec.issue}`);
        rec.actions.forEach(action => {
          console.log(`     • ${action}`);
        });
      });
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
  }

  saveReport(outputFile) {
    const report = this.generateReport();
    const output = {
      timestamp: new Date().toISOString(),
      ...report,
    };
    
    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
    console.log(`📄 Reporte guardado en: ${outputFile}`);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Uso: node analyze-results.js <archivo-resultados.json> [archivo-salida.json]');
    process.exit(1);
  }

  const resultsFile = args[0];
  const outputFile = args[1] || resultsFile.replace('.json', '-report.json');

  const analyzer = new LoadTestAnalyzer(resultsFile);
  analyzer.printReport();
  analyzer.saveReport(outputFile);
}

module.exports = LoadTestAnalyzer;

