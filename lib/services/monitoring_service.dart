import 'package:sentry_flutter/sentry_flutter.dart';
import 'package:flutter/foundation.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'logging_service.dart';

/// Servicio de Monitoreo para App Mobile
/// 
/// Integra Sentry para:
/// - Captura de crashes
/// - Tracking de errores
/// - Métricas de performance
/// - ANR (Application Not Responding) detection
class MonitoringService {
  static final MonitoringService _instance = MonitoringService._internal();
  factory MonitoringService() => _instance;
  MonitoringService._internal();

  bool _initialized = false;
  String? _userId;
  String? _deviceId;
  String? _appVersion;
  String? _environment;

  /// Inicializar servicio de monitoreo
  Future<void> initialize({
    required String dsn,
    String? environment,
    bool enablePerformanceMonitoring = true,
  }) async {
    if (_initialized) return;

    _environment = environment ?? (kDebugMode ? 'development' : 'staging');

    try {
      // Obtener información del dispositivo
      final deviceInfo = DeviceInfoPlugin();
      if (await deviceInfo.isAndroid()) {
        final androidInfo = await deviceInfo.androidInfo;
        _deviceId = androidInfo.id;
      } else if (await deviceInfo.isIOS()) {
        final iosInfo = await deviceInfo.iosInfo;
        _deviceId = iosInfo.identifierForVendor;
      }

      // Obtener información de la app
      final packageInfo = await PackageInfo.fromPlatform();
      _appVersion = packageInfo.version;

      // Configurar Sentry
      await SentryFlutter.init(
        (options) {
          options.dsn = dsn;
          options.environment = _environment;
          options.release = '${packageInfo.packageName}@${packageInfo.version}+${packageInfo.buildNumber}';
          
          // Configuración de performance
          if (enablePerformanceMonitoring) {
            options.tracesSampleRate = 1.0; // 100% en staging para debugging
            options.profilesSampleRate = 1.0;
          } else {
            options.tracesSampleRate = 0.1; // 10% en producción
            options.profilesSampleRate = 0.1;
          }

          // Configuración de errores
          options.beforeSend = (event, {hint}) {
            // Agregar contexto adicional
            event.contexts.device?.id = _deviceId;
            event.contexts.app?.version = _appVersion;
            
            // Filtrar errores en desarrollo si es necesario
            if (kDebugMode && _environment == 'development') {
              // En desarrollo, solo enviar errores críticos
              if (event.level == SentryLevel.fatal || event.level == SentryLevel.error) {
                return event;
              }
              return null; // No enviar warnings/info en desarrollo
            }
            
            return event;
          };

          // Configuración de breadcrumbs
          options.beforeBreadcrumb = (breadcrumb, {hint}) {
            // Filtrar breadcrumbs en desarrollo
            if (kDebugMode && _environment == 'development') {
              return null;
            }
            return breadcrumb;
          };

          // Tags adicionales
          options.tags = {
            'platform': defaultTargetPlatform.toString(),
            'device_id': _deviceId ?? 'unknown',
          };
        },
        appRunner: () {
          // App runner se maneja en main.dart
        },
      );

      _initialized = true;
      
      // Log de inicialización
      LoggingService().info('MonitoringService inicializado', metadata: {
        'environment': _environment,
        'device_id': _deviceId,
        'app_version': _appVersion,
      });
    } catch (e, stackTrace) {
      LoggingService().error('Error inicializando MonitoringService', error: e, stackTrace: stackTrace);
    }
  }

  /// Configurar usuario actual
  void setUser(String? userId, {String? email, String? username}) {
    _userId = userId;
    
    if (userId != null) {
      Sentry.configureScope((scope) {
        scope.setUser(SentryUser(
          id: userId,
          email: email,
          username: username,
        ));
      });
    } else {
      Sentry.configureScope((scope) {
        scope.setUser(null);
      });
    }
  }

  /// Capturar excepción
  Future<void> captureException(
    dynamic exception, {
    dynamic stackTrace,
    String? hint,
    Map<String, dynamic>? extra,
    SentryLevel? level,
  }) async {
    try {
      await Sentry.captureException(
        exception,
        stackTrace: stackTrace,
        hint: hint,
        withScope: (scope) {
          if (extra != null) {
            scope.setExtras(extra);
          }
          if (level != null) {
            scope.level = level;
          }
        },
      );

      // También loggear localmente
      LoggingService().error(
        'Exception capturada por monitoreo',
        error: exception,
        stackTrace: stackTrace,
        metadata: extra,
      );
    } catch (e) {
      LoggingService().error('Error capturando excepción en Sentry', error: e);
    }
  }

  /// Capturar mensaje
  Future<void> captureMessage(
    String message, {
    SentryLevel level = SentryLevel.info,
    Map<String, dynamic>? extra,
  }) async {
    try {
      await Sentry.captureMessage(
        message,
        level: level,
        withScope: (scope) {
          if (extra != null) {
            scope.setExtras(extra);
          }
        },
      );
    } catch (e) {
      LoggingService().error('Error capturando mensaje en Sentry', error: e);
    }
  }

  /// Agregar breadcrumb
  void addBreadcrumb(
    String message, {
    String? category,
    SentryLevel level = SentryLevel.info,
    Map<String, String>? data,
  }) {
    try {
      Sentry.addBreadcrumb(
        Breadcrumb(
          message: message,
          category: category,
          level: level,
          data: data,
        ),
      );
    } catch (e) {
      LoggingService().error('Error agregando breadcrumb', error: e);
    }
  }

  /// Iniciar transacción de performance
  ISentryTransaction startTransaction(
    String name,
    String operation, {
    Map<String, dynamic>? data,
  }) {
    try {
      final transaction = Sentry.startTransaction(
        name,
        operation,
        bindToScope: true,
      );
      
      if (data != null) {
        transaction.setData('extra', data);
      }
      
      return transaction;
    } catch (e) {
      LoggingService().error('Error iniciando transacción', error: e);
      // Retornar transacción dummy si falla
      return Sentry.startTransaction(name, operation);
    }
  }

  /// Finalizar transacción
  void finishTransaction(ISentryTransaction transaction, {SpanStatus? status}) {
    try {
      transaction.setStatus(status ?? SpanStatus.ok());
      transaction.finish();
    } catch (e) {
      LoggingService().error('Error finalizando transacción', error: e);
    }
  }

  /// Medir latencia de operación
  Future<T> measureOperation<T>(
    String operationName,
    Future<T> Function() operation, {
    Map<String, dynamic>? extra,
  }) async {
    final transaction = startTransaction(operationName, 'operation', data: extra);
    final span = transaction.startChild('execute', description: operationName);

    try {
      final result = await operation();
      span.setStatus(SpanStatus.ok());
      return result;
    } catch (e, stackTrace) {
      span.setStatus(SpanStatus.internalError());
      await captureException(e, stackTrace: stackTrace, extra: extra);
      rethrow;
    } finally {
      await span.finish();
      finishTransaction(transaction);
    }
  }

  /// Reportar métrica
  void reportMetric(String name, double value, {String? unit, Map<String, String>? tags}) {
    try {
      Sentry.metrics.increment(
        name,
        value: value,
        unit: unit,
        tags: tags,
      );
    } catch (e) {
      LoggingService().error('Error reportando métrica', error: e);
    }
  }

  /// Reportar error rate
  void reportErrorRate(double rate) {
    reportMetric('error_rate', rate, unit: 'ratio');
  }

  /// Reportar latencia
  void reportLatency(String operation, int milliseconds) {
    reportMetric('latency', milliseconds.toDouble(), unit: 'millisecond', tags: {'operation': operation});
  }

  /// Reportar ANR (Application Not Responding)
  void reportANR(String reason) {
    captureMessage(
      'Application Not Responding: $reason',
      level: SentryLevel.warning,
      extra: {
        'type': 'anr',
        'reason': reason,
        'device_id': _deviceId ?? 'unknown',
      },
    );
  }

  /// Obtener información del dispositivo
  Map<String, dynamic> getDeviceInfo() {
    return {
      'device_id': _deviceId,
      'app_version': _appVersion,
      'environment': _environment,
      'platform': defaultTargetPlatform.toString(),
    };
  }

  /// Limpiar contexto (útil para logout)
  void clearContext() {
    setUser(null);
    Sentry.configureScope((scope) {
      scope.clear();
    });
  }
}

