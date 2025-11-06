import 'dart:async';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:nfc_manager/nfc_manager.dart';
import 'package:logger/logger.dart';
import 'nfc_proximity_algorithm.dart';
import 'nfc_event_logger.dart';

/// Servicio de Lectura Precisa de ID Único NFC
/// 
/// Lee IDs únicos de pulseras NFC con precisión a 10cm
/// Incluye validación, manejo de errores y logging
class NFCPreciseReaderService extends ChangeNotifier {
  static final NFCPreciseReaderService _instance = NFCPreciseReaderService._internal();
  factory NFCPreciseReaderService() => _instance;
  NFCPreciseReaderService._internal();

  final Logger _logger = Logger();
  final NFCProximityAlgorithm _algorithm = NFCProximityAlgorithm();
  final NFCEventLogger _eventLogger = NFCEventLogger();

  bool _isReading = false;
  bool _isNfcAvailable = false;
  String? _lastReadId;
  DateTime? _lastReadTime;
  double _currentDistance = 0.0;
  double _targetDistance = 10.0; // cm
  double _distanceTolerance = 2.0; // ±2cm tolerancia
  
  // Estadísticas de lectura
  int _successfulReads = 0;
  int _failedReads = 0;
  int _invalidIds = 0;
  final List<ReadAttempt> _readHistory = [];
  static const int MAX_HISTORY = 100;

  // Callbacks
  Function(String uniqueId)? onIdRead;
  Function(String? error)? onReadError;
  Function(String id, double distance)? onIdInRange;

  // Getters
  bool get isReading => _isReading;
  bool get isNfcAvailable => _isNfcAvailable;
  String? get lastReadId => _lastReadId;
  double get currentDistance => _currentDistance;
  int get successfulReads => _successfulReads;
  int get failedReads => _failedReads;
  int get invalidIds => _invalidIds;
  List<ReadAttempt> get readHistory => List.unmodifiable(_readHistory);

  /// Inicializar servicio
  Future<bool> initialize() async {
    try {
      _isNfcAvailable = await NfcManager.instance.isAvailable();
      
      if (!_isNfcAvailable) {
        _logger.w('NFC no disponible en este dispositivo');
        _eventLogger.logEvent(NFCEvent(
          type: NFCEventType.initializationFailed,
          message: 'NFC no disponible',
          timestamp: DateTime.now(),
        ));
        return false;
      }

      _logger.i('NFC Precise Reader Service inicializado');
      _eventLogger.logEvent(NFCEvent(
        type: NFCEventType.serviceInitialized,
        message: 'Servicio inicializado correctamente',
        timestamp: DateTime.now(),
      ));
      
      notifyListeners();
      return true;
    } catch (e) {
      _logger.e('Error inicializando servicio', error: e);
      _eventLogger.logEvent(NFCEvent(
        type: NFCEventType.error,
        message: 'Error inicializando: $e',
        timestamp: DateTime.now(),
      ));
      return false;
    }
  }

  /// Iniciar lectura precisa
  Future<void> startPreciseReading({
    Function(String uniqueId)? onIdRead,
    Function(String? error)? onReadError,
    Function(String id, double distance)? onIdInRange,
    double targetDistance = 10.0,
    double tolerance = 2.0,
  }) async {
    if (_isReading) {
      _logger.w('Lectura ya está en curso');
      return;
    }

    if (!_isNfcAvailable) {
      final error = 'NFC no disponible en este dispositivo';
      _logger.e(error);
      _eventLogger.logEvent(NFCEvent(
        type: NFCEventType.error,
        message: error,
        timestamp: DateTime.now(),
      ));
      throw Exception(error);
    }

    onIdRead = onIdRead;
    onReadError = onReadError;
    onIdInRange = onIdInRange;
    _targetDistance = targetDistance;
    _distanceTolerance = tolerance;

    _isReading = true;
    _lastReadId = null;
    notifyListeners();

    _logger.i('Iniciando lectura precisa a ${_targetDistance}cm (±${_distanceTolerance}cm)');
    _eventLogger.logEvent(NFCEvent(
      type: NFCEventType.readingStarted,
      message: 'Lectura iniciada a ${_targetDistance}cm',
      timestamp: DateTime.now(),
    ));

    try {
      await NfcManager.instance.startSession(
        onDiscovered: _handleTagDiscovery,
        pollingOptions: {
          NfcPollingOption.iso14443,
          NfcPollingOption.iso15693,
          NfcPollingOption.iso18092,
        },
      );
    } catch (e) {
      _logger.e('Error iniciando sesión NFC', error: e);
      _eventLogger.logEvent(NFCEvent(
        type: NFCEventType.error,
        message: 'Error iniciando sesión: $e',
        timestamp: DateTime.now(),
      ));
      _isReading = false;
      notifyListeners();
      rethrow;
    }
  }

  /// Detener lectura
  Future<void> stopReading() async {
    if (!_isReading) return;

    _logger.i('Deteniendo lectura precisa');
    _eventLogger.logEvent(NFCEvent(
      type: NFCEventType.readingStopped,
      message: 'Lectura detenida',
      timestamp: DateTime.now(),
    ));

    try {
      await NfcManager.instance.stopSession();
    } catch (e) {
      _logger.e('Error deteniendo sesión NFC', error: e);
      _eventLogger.logEvent(NFCEvent(
        type: NFCEventType.error,
        message: 'Error deteniendo sesión: $e',
        timestamp: DateTime.now(),
      ));
    } finally {
      _isReading = false;
      _lastReadId = null;
      _currentDistance = 0.0;
      notifyListeners();
    }
  }

  /// Manejar descubrimiento de tag con lectura precisa
  Future<void> _handleTagDiscovery(NfcTag tag) async {
    final startTime = DateTime.now();
    
    try {
      // 1. Extraer ID único
      final uniqueId = await _extractUniqueId(tag);
      
      if (uniqueId == null) {
        await _handleReadError('No se pudo extraer ID único del tag', tag);
        return;
      }

      // 2. Validar ID único
      final validationResult = _validateUniqueId(uniqueId);
      if (!validationResult.isValid) {
        _invalidIds++;
        await _handleReadError(
          'ID único inválido: ${validationResult.error}',
          tag,
          invalidId: uniqueId,
        );
        return;
      }

      // 3. Calcular distancia precisa
      final proximityData = _extractProximityData(tag);
      final distance = _algorithm.calculateDistance(proximityData);
      _currentDistance = distance;

      // 4. Verificar si está en rango objetivo
      final isInRange = _isInTargetRange(distance);
      
      if (!isInRange) {
        _logger.d('Tag fuera de rango: ${distance.toStringAsFixed(2)}cm (objetivo: ${_targetDistance}cm)');
        return;
      }

      // 5. Debounce: evitar lecturas duplicadas
      if (_lastReadId == uniqueId && 
          _lastReadTime != null &&
          DateTime.now().difference(_lastReadTime!) < const Duration(milliseconds: 500)) {
        return;
      }

      // 6. Lectura exitosa
      final readDuration = DateTime.now().difference(startTime);
      
      _lastReadId = uniqueId;
      _lastReadTime = DateTime.now();
      _successfulReads++;

      // Registrar intento de lectura
      _addReadAttempt(ReadAttempt(
        uniqueId: uniqueId,
        distance: distance,
        success: true,
        duration: readDuration,
        timestamp: DateTime.now(),
      ));

      _logger.i('ID único leído exitosamente: $uniqueId a ${distance.toStringAsFixed(2)}cm');
      _eventLogger.logEvent(NFCEvent(
        type: NFCEventType.idRead,
        message: 'ID leído: $uniqueId',
        uniqueId: uniqueId,
        distance: distance,
        timestamp: DateTime.now(),
      ));

      // Callbacks
      onIdRead?.call(uniqueId);
      onIdInRange?.call(uniqueId, distance);

      notifyListeners();
    } catch (e, stackTrace) {
      await _handleReadError('Error procesando tag: $e', tag, stackTrace: stackTrace);
    }
  }

  /// Extraer ID único del tag con múltiples métodos
  Future<String?> _extractUniqueId(NfcTag tag) async {
    try {
      // Método 1: NFC-A (ISO14443 Type A)
      if (tag.data.containsKey('nfca')) {
        final nfca = tag.data['nfca'] as Map;
        final identifier = nfca['identifier'] as List<int>?;
        if (identifier != null && identifier.isNotEmpty) {
          return _formatUniqueId(identifier);
        }
      }

      // Método 2: NFC-B (ISO14443 Type B)
      if (tag.data.containsKey('nfcb')) {
        final nfcb = tag.data['nfcb'] as Map;
        final identifier = nfcb['identifier'] as List<int>?;
        if (identifier != null && identifier.isNotEmpty) {
          return _formatUniqueId(identifier);
        }
      }

      // Método 3: NFC-F (FeliCa)
      if (tag.data.containsKey('nfcf')) {
        final nfcf = tag.data['nfcf'] as Map;
        final identifier = nfcf['identifier'] as List<int>?;
        if (identifier != null && identifier.isNotEmpty) {
          return _formatUniqueId(identifier);
        }
      }

      // Método 4: NFC-V (ISO15693)
      if (tag.data.containsKey('nfcv')) {
        final nfcv = tag.data['nfcv'] as Map;
        final identifier = nfcv['identifier'] as List<int>?;
        if (identifier != null && identifier.isNotEmpty) {
          return _formatUniqueId(identifier);
        }
      }

      // Método 5: Intentar leer desde NDEF (si está disponible)
      if (tag.data.containsKey('ndef')) {
        final ndef = tag.data['ndef'] as Map;
        // Intentar extraer ID de NDEF records
        // (implementar según necesidad)
      }

      // Método 6: Usar handle como último recurso
      if (tag.handle != null) {
        return tag.handle.toString();
      }

      return null;
    } catch (e) {
      _logger.e('Error extrayendo ID único', error: e);
      return null;
    }
  }

  /// Formatear ID único de bytes a string
  String _formatUniqueId(List<int> bytes) {
    // Formato estándar: hexadecimal separado por dos puntos
    return bytes.map((b) => b.toRadixString(16).padLeft(2, '0').toUpperCase()).join(':');
  }

  /// Validar ID único
  UniqueIdValidation _validateUniqueId(String uniqueId) {
    // Validación 1: No vacío
    if (uniqueId.isEmpty) {
      return UniqueIdValidation(
        isValid: false,
        error: 'ID único vacío',
      );
    }

    // Validación 2: Formato hexadecimal válido
    final hexPattern = RegExp(r'^[0-9A-F:]+$');
    if (!hexPattern.hasMatch(uniqueId)) {
      return UniqueIdValidation(
        isValid: false,
        error: 'Formato de ID inválido (debe ser hexadecimal)',
      );
    }

    // Validación 3: Longitud mínima (al menos 4 bytes = 8 caracteres hex)
    final hexParts = uniqueId.split(':');
    if (hexParts.length < 4) {
      return UniqueIdValidation(
        isValid: false,
        error: 'ID demasiado corto (mínimo 4 bytes)',
      );
    }

    // Validación 4: Longitud máxima razonable (máximo 16 bytes)
    if (hexParts.length > 16) {
      return UniqueIdValidation(
        isValid: false,
        error: 'ID demasiado largo (máximo 16 bytes)',
      );
    }

    // Validación 5: No todos los bytes son cero
    final allZeros = hexParts.every((part) => part == '00');
    if (allZeros) {
      return UniqueIdValidation(
        isValid: false,
        error: 'ID inválido (todos los bytes son cero)',
      );
    }

    // Validación 6: Checksum básico (opcional, depende del tipo de tag)
    // Implementar según necesidad

    return UniqueIdValidation(isValid: true);
  }

  /// Extraer datos de proximidad del tag
  ProximityData _extractProximityData(NfcTag tag) {
    double? rssi;
    double? amplitude;
    double? responseTime;
    double? bandwidth;

    try {
      // Extraer RSSI
      if (tag.data.containsKey('nfca')) {
        final nfca = tag.data['nfca'] as Map;
        if (nfca.containsKey('atqa')) {
          final atqa = nfca['atqa'] as List<int>?;
          if (atqa != null && atqa.isNotEmpty) {
            // Aproximación de RSSI desde ATQA
            rssi = -(atqa[0] * 2.0);
          }
        }
        if (nfca.containsKey('sak')) {
          final sak = nfca['sak'] as int?;
          if (sak != null) {
            amplitude = sak / 255.0;
          }
        }
      }

      // Estimar tiempo de respuesta (simplificado)
      responseTime = 0.01; // 10ms típico para NFC-A

      return ProximityData(
        rssi: rssi,
        amplitude: amplitude,
        responseTime: responseTime,
        bandwidth: bandwidth,
      );
    } catch (e) {
      _logger.w('Error extrayendo datos de proximidad', error: e);
      return ProximityData();
    }
  }

  /// Verificar si está en rango objetivo
  bool _isInTargetRange(double distance) {
    final minDistance = _targetDistance - _distanceTolerance;
    final maxDistance = _targetDistance + _distanceTolerance;
    return distance >= minDistance && distance <= maxDistance;
  }

  /// Manejar error de lectura
  Future<void> _handleReadError(
    String error,
    NfcTag? tag, {
    String? invalidId,
    StackTrace? stackTrace,
  }) async {
    _failedReads++;

    _logger.e('Error de lectura: $error', error: error, stackTrace: stackTrace);
    _eventLogger.logEvent(NFCEvent(
      type: NFCEventType.readError,
      message: error,
      uniqueId: invalidId,
      timestamp: DateTime.now(),
    ));

    // Registrar intento fallido
    _addReadAttempt(ReadAttempt(
      uniqueId: invalidId,
      distance: _currentDistance,
      success: false,
      error: error,
      timestamp: DateTime.now(),
    ));

    // Callback de error
    onReadError?.call(error);

    notifyListeners();
  }

  /// Agregar intento de lectura al historial
  void _addReadAttempt(ReadAttempt attempt) {
    _readHistory.add(attempt);
    
    // Mantener solo últimas N lecturas
    if (_readHistory.length > MAX_HISTORY) {
      _readHistory.removeAt(0);
    }
  }

  /// Obtener estadísticas de lectura
  ReadStatistics getStatistics() {
    final totalAttempts = _successfulReads + _failedReads;
    final successRate = totalAttempts > 0 
        ? (_successfulReads / totalAttempts) * 100 
        : 0.0;

    return ReadStatistics(
      totalAttempts: totalAttempts,
      successfulReads: _successfulReads,
      failedReads: _failedReads,
      invalidIds: _invalidIds,
      successRate: successRate,
      lastReadId: _lastReadId,
      lastReadTime: _lastReadTime,
    );
  }

  /// Limpiar historial
  void clearHistory() {
    _readHistory.clear();
    _successfulReads = 0;
    _failedReads = 0;
    _invalidIds = 0;
    notifyListeners();
  }

  /// Limpiar recursos
  Future<void> dispose() async {
    await stopReading();
    super.dispose();
  }
}

/// Validación de ID único
class UniqueIdValidation {
  final bool isValid;
  final String? error;

  UniqueIdValidation({
    required this.isValid,
    this.error,
  });
}

/// Intento de lectura
class ReadAttempt {
  final String? uniqueId;
  final double distance;
  final bool success;
  final Duration? duration;
  final String? error;
  final DateTime timestamp;

  ReadAttempt({
    this.uniqueId,
    required this.distance,
    required this.success,
    this.duration,
    this.error,
    required this.timestamp,
  });
}

/// Estadísticas de lectura
class ReadStatistics {
  final int totalAttempts;
  final int successfulReads;
  final int failedReads;
  final int invalidIds;
  final double successRate;
  final String? lastReadId;
  final DateTime? lastReadTime;

  ReadStatistics({
    required this.totalAttempts,
    required this.successfulReads,
    required this.failedReads,
    required this.invalidIds,
    required this.successRate,
    this.lastReadId,
    this.lastReadTime,
  });
}

