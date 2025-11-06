import 'dart:convert';
import 'package:logger/logger.dart';
import 'package:uuid/uuid.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

/// Servicio de Logging Centralizado para Flutter
/// 
/// Proporciona logging estructurado en formato JSON con:
/// - Request ID para correlación con backend
/// - Niveles de log configurables
/// - Envío a sistema de logging centralizado
/// - Formato estándar para ELK/Datadog/Cloud Logging
class LoggingService {
  static final LoggingService _instance = LoggingService._internal();
  factory LoggingService() => _instance;
  LoggingService._internal();

  late Logger _logger;
  String? _currentRequestId;
  String? _userId;
  String? _deviceId;
  String? _appVersion;
  bool _initialized = false;

  /// Inicializar el servicio de logging
  Future<void> initialize() async {
    if (_initialized) return;

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

      // Configurar logger
      _logger = Logger(
        printer: PrettyPrinter(
          methodCount: 0,
          errorMethodCount: 5,
          lineLength: 120,
          colors: true,
          printEmojis: true,
          printTime: true,
        ),
        level: _getLogLevel(),
      );

      _initialized = true;
      info('LoggingService inicializado', metadata: {
        'deviceId': _deviceId,
        'appVersion': _appVersion,
      });
    } catch (e) {
      // Fallback a logger básico si hay error
      _logger = Logger();
      _logger.e('Error inicializando LoggingService', error: e);
    }
  }

  /// Determinar nivel de log según configuración
  Level _getLogLevel() {
    const env = String.fromEnvironment('ENV', defaultValue: 'development');
    if (env == 'production') {
      return Level.info;
    } else {
      return Level.debug;
    }
  }

  /// Establecer request ID para correlación
  void setRequestId(String? requestId) {
    _currentRequestId = requestId;
  }

  /// Generar nuevo request ID
  String generateRequestId() {
    _currentRequestId = const Uuid().v4();
    return _currentRequestId!;
  }

  /// Establecer usuario actual
  void setUserId(String? userId) {
    _userId = userId;
  }

  /// Crear entrada de log estructurada
  Map<String, dynamic> _createLogEntry({
    required String level,
    required String message,
    Object? error,
    StackTrace? stackTrace,
    Map<String, dynamic>? metadata,
  }) {
    final entry = <String, dynamic>{
      'timestamp': DateTime.now().toIso8601String(),
      'level': level,
      'message': message,
      'service': 'moviles2-mobile',
      'environment': const String.fromEnvironment('ENV', defaultValue: 'development'),
      'requestId': _currentRequestId,
      'userId': _userId,
      'deviceId': _deviceId,
      'appVersion': _appVersion,
    };

    if (error != null) {
      entry['error'] = {
        'type': error.runtimeType.toString(),
        'message': error.toString(),
        'stackTrace': stackTrace?.toString(),
      };
    }

    if (metadata != null && metadata.isNotEmpty) {
      entry['metadata'] = metadata;
    }

    // Limpiar campos nulos
    entry.removeWhere((key, value) => value == null);

    return entry;
  }

  /// Enviar log a sistema centralizado (opcional)
  Future<void> _sendToCentralizedLogging(Map<String, dynamic> logEntry) async {
    // Solo enviar en staging/producción y si está configurado
    const env = String.fromEnvironment('ENV', defaultValue: 'development');
    if (env == 'development') return;

    try {
      // Intentar enviar a endpoint de logging (si está configurado)
      final logEndpoint = const String.fromEnvironment('LOG_ENDPOINT', defaultValue: '');
      if (logEndpoint.isEmpty) return;

      await http.post(
        Uri.parse('$logEndpoint/logs'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(logEntry),
      ).timeout(const Duration(seconds: 2));
    } catch (e) {
      // Silenciar errores de envío de logs para no crear loops
      // Solo loggear en modo debug
      if (const String.fromEnvironment('ENV') == 'development') {
        _logger.d('Error enviando log a sistema centralizado: $e');
      }
    }
  }

  /// Log de error
  void error(
    String message, {
    Object? error,
    StackTrace? stackTrace,
    Map<String, dynamic>? metadata,
  }) {
    final logEntry = _createLogEntry(
      level: 'error',
      message: message,
      error: error,
      stackTrace: stackTrace,
      metadata: metadata,
    );

    _logger.e(message, error: error, stackTrace: stackTrace);
    _sendToCentralizedLogging(logEntry);
  }

  /// Log de advertencia
  void warn(
    String message, {
    Map<String, dynamic>? metadata,
  }) {
    final logEntry = _createLogEntry(
      level: 'warn',
      message: message,
      metadata: metadata,
    );

    _logger.w(message);
    _sendToCentralizedLogging(logEntry);
  }

  /// Log de información
  void info(
    String message, {
    Map<String, dynamic>? metadata,
  }) {
    final logEntry = _createLogEntry(
      level: 'info',
      message: message,
      metadata: metadata,
    );

    _logger.i(message);
    _sendToCentralizedLogging(logEntry);
  }

  /// Log de debug
  void debug(
    String message, {
    Map<String, dynamic>? metadata,
  }) {
    final logEntry = _createLogEntry(
      level: 'debug',
      message: message,
      metadata: metadata,
    );

    _logger.d(message);
    _sendToCentralizedLogging(logEntry);
  }

  /// Log de HTTP request
  void httpRequest({
    required String method,
    required String endpoint,
    Map<String, dynamic>? headers,
    Map<String, dynamic>? body,
    Map<String, dynamic>? metadata,
  }) {
    final logEntry = _createLogEntry(
      level: 'http',
      message: 'HTTP Request',
      metadata: {
        'method': method,
        'endpoint': endpoint,
        'headers': headers,
        'body': body,
        ...?metadata,
      },
    );

    _logger.d('HTTP $method $endpoint');
    _sendToCentralizedLogging(logEntry);
  }

  /// Log de HTTP response
  void httpResponse({
    required String method,
    required String endpoint,
    required int statusCode,
    int? durationMs,
    Map<String, dynamic>? metadata,
  }) {
    final logEntry = _createLogEntry(
      level: 'http',
      message: 'HTTP Response',
      metadata: {
        'method': method,
        'endpoint': endpoint,
        'statusCode': statusCode,
        'durationMs': durationMs,
        ...?metadata,
      },
    );

    _logger.d('HTTP $method $endpoint -> $statusCode (${durationMs}ms)');
    _sendToCentralizedLogging(logEntry);
  }

  /// Log de evento crítico
  void criticalEvent({
    required String eventType,
    required String message,
    Map<String, dynamic>? metadata,
  }) {
    final logEntry = _createLogEntry(
      level: 'error',
      message: message,
      metadata: {
        'eventType': eventType,
        'critical': true,
        ...?metadata,
      },
    );

    _logger.e('CRITICAL: $eventType - $message');
    _sendToCentralizedLogging(logEntry);
  }
}

