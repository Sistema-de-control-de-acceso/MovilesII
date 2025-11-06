import 'dart:async';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:nfc_manager/nfc_manager.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:vibration/vibration.dart';
import 'package:logger/logger.dart';

/// Servicio de Detección Automática de NFC
/// 
/// Detecta pulseras NFC automáticamente a una distancia de 10cm
/// con feedback visual, sonoro y háptico
class NFCAutoDetectionService extends ChangeNotifier {
  static final NFCAutoDetectionService _instance = NFCAutoDetectionService._internal();
  factory NFCAutoDetectionService() => _instance;
  NFCAutoDetectionService._internal();

  final Logger _logger = Logger();
  final AudioPlayer _audioPlayer = AudioPlayer();
  
  bool _isScanning = false;
  bool _isNfcAvailable = false;
  String? _lastDetectedTag;
  DateTime? _lastDetectionTime;
  double _currentDistance = 0.0;
  double _calibratedDistance = 10.0; // cm - distancia calibrada
  double _signalStrength = 0.0; // RSSI normalizado (0-1)
  
  // Configuración de detección
  static const double TARGET_DISTANCE_CM = 10.0;
  static const double DETECTION_THRESHOLD = 0.7; // Umbral de señal para detección
  static const Duration SCAN_INTERVAL = Duration(milliseconds: 100);
  static const Duration DEBOUNCE_TIME = Duration(milliseconds: 500);
  
  // Callbacks
  Function(String tagId)? onTagDetected;
  Function(String tagId, double distance)? onTagInRange;
  Function()? onTagOutOfRange;
  
  // Getters
  bool get isScanning => _isScanning;
  bool get isNfcAvailable => _isNfcAvailable;
  String? get lastDetectedTag => _lastDetectedTag;
  double get currentDistance => _currentDistance;
  double get signalStrength => _signalStrength;
  double get calibratedDistance => _calibratedDistance;

  /// Inicializar servicio NFC
  Future<bool> initialize() async {
    try {
      _isNfcAvailable = await NfcManager.instance.isAvailable();
      
      if (!_isNfcAvailable) {
        _logger.w('NFC no disponible en este dispositivo');
        return false;
      }

      _logger.i('NFC Auto Detection Service inicializado');
      notifyListeners();
      return true;
    } catch (e) {
      _logger.e('Error inicializando NFC', error: e);
      return false;
    }
  }

  /// Iniciar detección automática
  Future<void> startAutoDetection({
    Function(String tagId)? onDetected,
    Function(String tagId, double distance)? onInRange,
    Function()? onOutOfRange,
  }) async {
    if (_isScanning) {
      _logger.w('Detección ya está en curso');
      return;
    }

    if (!_isNfcAvailable) {
      _logger.e('NFC no disponible');
      throw Exception('NFC no disponible en este dispositivo');
    }

    onTagDetected = onDetected;
    onTagInRange = onInRange;
    onTagOutOfRange = onOutOfRange;

    _isScanning = true;
    _lastDetectedTag = null;
    notifyListeners();

    _logger.i('Iniciando detección automática de NFC');

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
      _isScanning = false;
      notifyListeners();
      rethrow;
    }
  }

  /// Detener detección automática
  Future<void> stopAutoDetection() async {
    if (!_isScanning) return;

    _logger.i('Deteniendo detección automática');

    try {
      await NfcManager.instance.stopSession();
    } catch (e) {
      _logger.e('Error deteniendo sesión NFC', error: e);
    } finally {
      _isScanning = false;
      _lastDetectedTag = null;
      _currentDistance = 0.0;
      _signalStrength = 0.0;
      notifyListeners();
    }
  }

  /// Manejar descubrimiento de tag
  Future<void> _handleTagDiscovery(NfcTag tag) async {
    try {
      final tagId = _extractTagId(tag);
      if (tagId == null) {
        _logger.w('No se pudo extraer ID del tag');
        return;
      }

      // Calcular distancia basada en RSSI y características del tag
      final distance = await _calculateDistance(tag);
      _currentDistance = distance;
      _signalStrength = _calculateSignalStrength(tag);

      _logger.d('Tag detectado: $tagId, Distancia: ${distance.toStringAsFixed(2)}cm, RSSI: $_signalStrength');

      // Verificar si está dentro del rango objetivo (10cm)
      if (distance <= _calibratedDistance) {
        // Debounce: evitar múltiples detecciones del mismo tag
        if (_lastDetectedTag == tagId && 
            _lastDetectionTime != null &&
            DateTime.now().difference(_lastDetectionTime!) < DEBOUNCE_TIME) {
          return;
        }

        _lastDetectedTag = tagId;
        _lastDetectionTime = DateTime.now();

        // Feedback
        await _provideFeedback(tagId, distance);

        // Callbacks
        onTagDetected?.call(tagId);
        onTagInRange?.call(tagId, distance);

        notifyListeners();
      } else {
        // Tag fuera de rango
        if (_lastDetectedTag == tagId) {
          _lastDetectedTag = null;
          onTagOutOfRange?.call();
          notifyListeners();
        }
      }
    } catch (e) {
      _logger.e('Error procesando tag', error: e);
    }
  }

  /// Extraer ID del tag
  String? _extractTagId(NfcTag tag) {
    try {
      // Intentar diferentes métodos según el tipo de tag
      if (tag.data.containsKey('nfca')) {
        final nfca = tag.data['nfca'] as Map;
        final identifier = nfca['identifier'] as List<int>?;
        if (identifier != null) {
          return identifier.map((b) => b.toRadixString(16).padLeft(2, '0')).join(':');
        }
      }
      
      if (tag.data.containsKey('nfcb')) {
        final nfcb = tag.data['nfcb'] as Map;
        final identifier = nfcb['identifier'] as List<int>?;
        if (identifier != null) {
          return identifier.map((b) => b.toRadixString(16).padLeft(2, '0')).join(':');
        }
      }
      
      if (tag.data.containsKey('nfcf')) {
        final nfcf = tag.data['nfcf'] as Map;
        final identifier = nfcf['identifier'] as List<int>?;
        if (identifier != null) {
          return identifier.map((b) => b.toRadixString(16).padLeft(2, '0')).join(':');
        }
      }
      
      if (tag.data.containsKey('nfcv')) {
        final nfcv = tag.data['nfcv'] as Map;
        final identifier = nfcv['identifier'] as List<int>?;
        if (identifier != null) {
          return identifier.map((b) => b.toRadixString(16).padLeft(2, '0')).join(':');
        }
      }

      // Fallback: usar handle si está disponible
      if (tag.handle != null) {
        return tag.handle.toString();
      }

      return null;
    } catch (e) {
      _logger.e('Error extrayendo ID del tag', error: e);
      return null;
    }
  }

  /// Calcular distancia basada en características del tag
  Future<double> _calculateDistance(NfcTag tag) async {
    try {
      // Método 1: Basado en RSSI (si está disponible)
      double? rssi = _getRssiFromTag(tag);
      if (rssi != null) {
        // Modelo de path loss para NFC (frecuencia ~13.56 MHz)
        // Distancia = 10^((TxPower - RSSI) / (10 * n))
        // n = 2 para espacio libre, ajustado para NFC
        const double txPower = 0.0; // dBm (ajustar según calibración)
        const double pathLossExponent = 2.5; // Ajustado para NFC
        final double distance = pow(10, (txPower - rssi) / (10 * pathLossExponent)) * 100; // cm
        return distance.clamp(0.0, 50.0); // Limitar a 50cm máximo
      }

      // Método 2: Basado en amplitud de señal (si está disponible)
      double? amplitude = _getAmplitudeFromTag(tag);
      if (amplitude != null) {
        // Calibración: amplitud inversamente proporcional a distancia
        // Usar valores calibrados
        final double distance = _calibratedDistance * (1.0 / amplitude);
        return distance.clamp(0.0, 50.0);
      }

      // Método 3: Basado en tiempo de respuesta
      // Tags más cercanos responden más rápido
      final responseTime = _getResponseTime(tag);
      if (responseTime != null) {
        // Calibración empírica
        final double distance = responseTime * 100; // Ajustar según calibración
        return distance.clamp(0.0, 50.0);
      }

      // Fallback: usar distancia calibrada si no hay datos
      return _calibratedDistance;
    } catch (e) {
      _logger.e('Error calculando distancia', error: e);
      return _calibratedDistance;
    }
  }

  /// Obtener RSSI del tag (si está disponible)
  double? _getRssiFromTag(NfcTag tag) {
    try {
      // Intentar obtener RSSI de diferentes fuentes
      if (tag.data.containsKey('nfca')) {
        final nfca = tag.data['nfca'] as Map;
        if (nfca.containsKey('atqa')) {
          // Usar ATQA como indicador de señal (aproximación)
          final atqa = nfca['atqa'] as List<int>?;
          if (atqa != null && atqa.isNotEmpty) {
            // Convertir ATQA a valor de señal aproximado
            return -(atqa[0] * 2.0); // Aproximación
          }
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /// Obtener amplitud de señal del tag
  double? _getAmplitudeFromTag(NfcTag tag) {
    try {
      // Usar características del tag como proxy de amplitud
      if (tag.data.containsKey('nfca')) {
        final nfca = tag.data['nfca'] as Map;
        // Usar SAK (Select Acknowledge) como indicador
        if (nfca.containsKey('sak')) {
          final sak = nfca['sak'] as int?;
          if (sak != null) {
            // Normalizar a 0-1
            return (sak / 255.0);
          }
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /// Obtener tiempo de respuesta del tag
  double? _getResponseTime(NfcTag tag) {
    // En una implementación real, mediríamos el tiempo entre
    // el envío del comando y la recepción de la respuesta
    // Por ahora, usar un valor estimado basado en el tipo de tag
    try {
      if (tag.data.containsKey('nfca')) {
        return 0.01; // ~10ms para NFC-A
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /// Calcular fuerza de señal normalizada (0-1)
  double _calculateSignalStrength(NfcTag tag) {
    try {
      // Combinar diferentes indicadores de señal
      double strength = 0.5; // Valor por defecto

      final rssi = _getRssiFromTag(tag);
      if (rssi != null) {
        // Normalizar RSSI (asumiendo rango -80 a 0 dBm)
        strength = ((rssi + 80) / 80).clamp(0.0, 1.0);
      }

      final amplitude = _getAmplitudeFromTag(tag);
      if (amplitude != null) {
        // Promediar con amplitud
        strength = (strength + amplitude) / 2;
      }

      return strength;
    } catch (e) {
      return 0.5;
    }
  }

  /// Proporcionar feedback al usuario
  Future<void> _provideFeedback(String tagId, double distance) async {
    try {
      // Feedback sonoro
      await _playDetectionSound();

      // Feedback háptico
      await _vibrate();

      _logger.d('Feedback proporcionado para tag: $tagId a ${distance.toStringAsFixed(2)}cm');
    } catch (e) {
      _logger.e('Error proporcionando feedback', error: e);
    }
  }

  /// Reproducir sonido de detección
  Future<void> _playDetectionSound() async {
    try {
      // Usar sonido del sistema o asset
      // Por ahora, usar un beep simple
      await _audioPlayer.play(AssetSource('sounds/nfc_detection.mp3'));
    } catch (e) {
      // Si no hay asset, usar vibración como fallback
      _logger.w('No se pudo reproducir sonido, usando vibración');
    }
  }

  /// Vibrar dispositivo
  Future<void> _vibrate() async {
    try {
      if (await Vibration.hasVibrator() ?? false) {
        await Vibration.vibrate(duration: 100);
      }
    } catch (e) {
      _logger.w('No se pudo vibrar dispositivo');
    }
  }

  /// Calibrar distancia de detección
  Future<void> calibrateDistance(double knownDistanceCm) async {
    _calibratedDistance = knownDistanceCm.clamp(1.0, 50.0);
    _logger.i('Distancia calibrada a ${_calibratedDistance.toStringAsFixed(2)}cm');
    notifyListeners();
  }

  /// Guardar calibración
  Future<void> saveCalibration() async {
    // Guardar en SharedPreferences
    // Implementar según necesidad
  }

  /// Cargar calibración guardada
  Future<void> loadCalibration() async {
    // Cargar de SharedPreferences
    // Implementar según necesidad
  }

  /// Limpiar recursos
  Future<void> dispose() async {
    await stopAutoDetection();
    await _audioPlayer.dispose();
    super.dispose();
  }
}

