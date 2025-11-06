/// Configuración de Monitoreo
/// 
/// Configuración centralizada para Sentry y monitoreo
class MonitoringConfig {
  // DSN de Sentry (obtener de https://sentry.io)
  // Para staging, usar DSN de proyecto de staging
  static const String sentryDsn = String.fromEnvironment(
    'SENTRY_DSN',
    defaultValue: '', // Configurar en CI/CD o .env
  );

  // Ambiente actual
  static const String environment = String.fromEnvironment(
    'ENVIRONMENT',
    defaultValue: 'staging',
  );

  // Sample rate para traces (0.0 - 1.0)
  // En staging: 1.0 (100%) para debugging completo
  // En producción: 0.1 (10%) para reducir overhead
  static const double tracesSampleRate = double.fromEnvironment(
    'SENTRY_TRACES_SAMPLE_RATE',
    defaultValue: 1.0,
  );

  // Sample rate para profiles (0.0 - 1.0)
  static const double profilesSampleRate = double.fromEnvironment(
    'SENTRY_PROFILES_SAMPLE_RATE',
    defaultValue: 1.0,
  );

  // Umbrales de alerta
  static const double crashRateThreshold = 0.01; // 1% de sesiones con crash
  static const double errorRateThreshold = 0.05; // 5% de requests con error
  static const int latencyThresholdMs = 2000; // 2 segundos
  static const int anrThresholdMs = 5000; // 5 segundos sin respuesta

  // URLs de dashboards y documentación
  static const String sentryDashboardUrl = 'https://sentry.io/organizations/YOUR_ORG/projects/YOUR_PROJECT/';
  static const String monitoringDocsUrl = 'https://docs.example.com/monitoring';
}

