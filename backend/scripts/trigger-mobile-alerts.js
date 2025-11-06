/**
 * Script para disparar alertas de monitoreo mobile
 * 
 * Simula condiciones que disparan alertas para pruebas
 * 
 * Uso: node scripts/trigger-mobile-alerts.js [tipo]
 * Tipos: crash-rate, error-rate, latency, anr, all
 */

const MobileAlertService = require('../services/mobile_alert_service');
const { AlertService, LogAlertChannel, EmailAlertChannel } = require('../services/alert_service');

async function triggerAlerts(type = 'all') {
  const mobileAlertService = new MobileAlertService();
  const alertService = mobileAlertService.alertService;

  // Registrar canal de log
  alertService.registerChannel(new LogAlertChannel());

  console.log('🧪 Disparando alertas de monitoreo mobile...\n');

  if (type === 'all' || type === 'crash-rate') {
    console.log('📱 Simulando crash rate alto...');
    
    // Registrar 100 sesiones
    for (let i = 0; i < 100; i++) {
      mobileAlertService.recordSession({ sessionId: `session-${i}` });
    }

    // Registrar 5 crashes (5% > 1% umbral)
    for (let i = 0; i < 5; i++) {
      await mobileAlertService.recordCrash({
        error: `Test crash ${i}`,
        stackTrace: 'Test stack trace',
        context: { test: true },
      });
    }

    console.log('✅ Crash rate simulado\n');
  }

  if (type === 'all' || type === 'error-rate') {
    console.log('📱 Simulando error rate alto...');
    
    // Registrar múltiples errores
    for (let i = 0; i < 20; i++) {
      await mobileAlertService.recordError({
        error: `Test error ${i}`,
        operation: 'test_operation',
        context: { test: true },
      });
    }

    console.log('✅ Error rate simulado\n');
  }

  if (type === 'all' || type === 'latency') {
    console.log('📱 Simulando latencia alta...');
    
    // Registrar latencias altas (P95 > 2000ms)
    const highLatencies = [2500, 3000, 2800, 2200, 2600, 2400, 2700, 2900, 2100, 2300];
    for (const latency of highLatencies) {
      await mobileAlertService.recordLatency('test_operation', latency);
    }

    console.log('✅ Latencia alta simulada\n');
  }

  if (type === 'all' || type === 'anr') {
    console.log('📱 Simulando ANRs...');
    
    // Registrar múltiples ANRs (> 5 umbral)
    for (let i = 0; i < 10; i++) {
      await mobileAlertService.recordANR({
        reason: `Test ANR ${i}`,
        context: { test: true },
      });
    }

    console.log('✅ ANRs simulados\n');
  }

  // Mostrar métricas finales
  console.log('📊 Métricas finales:');
  const metrics = mobileAlertService.getMetrics();
  console.log(JSON.stringify(metrics, null, 2));

  console.log('\n✅ Pruebas completadas');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const type = process.argv[2] || 'all';
  triggerAlerts(type)
    .then(() => {
      console.log('\n✅ Script completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error:', error);
      process.exit(1);
    });
}

module.exports = triggerAlerts;

