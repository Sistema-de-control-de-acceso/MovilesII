import 'dart:math';
import 'package:logger/logger.dart';

/// Algoritmo de Detección de Proximidad NFC
/// 
/// Calcula la distancia de tags NFC basándose en múltiples factores:
/// - RSSI (Received Signal Strength Indicator)
/// - Amplitud de señal
/// - Tiempo de respuesta
/// - Características del tag
class NFCProximityAlgorithm {
  final Logger _logger = Logger();

  // Parámetros de calibración
  double _txPower = 0.0; // dBm - Potencia de transmisión
  double _pathLossExponent = 2.5; // Exponente de pérdida de trayectoria
  double _referenceDistance = 1.0; // cm - Distancia de referencia
  double _referenceRssi = -40.0; // dBm - RSSI a distancia de referencia

  // Historial para filtrado
  final List<ProximityReading> _readings = [];
  static const int MAX_READINGS = 10;

  /// Calcular distancia basada en múltiples factores
  double calculateDistance(ProximityData data) {
    try {
      final List<double> distances = [];

      // Método 1: Path Loss Model (RSSI)
      if (data.rssi != null) {
        final distanceRssi = _calculateDistanceFromRssi(data.rssi!);
        distances.add(distanceRssi);
        _logger.d('Distancia desde RSSI: ${distanceRssi.toStringAsFixed(2)}cm');
      }

      // Método 2: Amplitud de señal
      if (data.amplitude != null) {
        final distanceAmp = _calculateDistanceFromAmplitude(data.amplitude!);
        distances.add(distanceAmp);
        _logger.d('Distancia desde amplitud: ${distanceAmp.toStringAsFixed(2)}cm');
      }

      // Método 3: Tiempo de respuesta
      if (data.responseTime != null) {
        final distanceTime = _calculateDistanceFromResponseTime(data.responseTime!);
        distances.add(distanceTime);
        _logger.d('Distancia desde tiempo: ${distanceTime.toStringAsFixed(2)}cm');
      }

      // Método 4: Ancho de banda (si disponible)
      if (data.bandwidth != null) {
        final distanceBw = _calculateDistanceFromBandwidth(data.bandwidth!);
        distances.add(distanceBw);
        _logger.d('Distancia desde ancho de banda: ${distanceBw.toStringAsFixed(2)}cm');
      }

      if (distances.isEmpty) {
        _logger.w('No hay datos suficientes para calcular distancia');
        return 10.0; // Valor por defecto
      }

      // Promediar distancias (peso según confiabilidad)
      final double weightedDistance = _calculateWeightedAverage(distances, data);
      
      // Filtrar con historial para suavizar
      final double filteredDistance = _applyFilter(weightedDistance);

      return filteredDistance.clamp(0.0, 50.0);
    } catch (e) {
      _logger.e('Error calculando distancia', error: e);
      return 10.0;
    }
  }

  /// Calcular distancia desde RSSI usando Path Loss Model
  double _calculateDistanceFromRssi(double rssi) {
    // Fórmula: d = d0 * 10^((RSSI0 - RSSI) / (10 * n))
    // donde:
    // - d0: distancia de referencia (1cm)
    // - RSSI0: RSSI a distancia de referencia
    // - n: exponente de pérdida de trayectoria
    
    final double ratio = (_referenceRssi - rssi) / (10 * _pathLossExponent);
    final double distance = _referenceDistance * pow(10, ratio);
    
    return distance;
  }

  /// Calcular distancia desde amplitud de señal
  double _calculateDistanceFromAmplitude(double amplitude) {
    // Amplitud es inversamente proporcional a distancia^2
    // A = k / d^2
    // d = sqrt(k / A)
    
    // Calibración: a 10cm, amplitud = 1.0
    const double k = 100.0; // k = A * d^2 = 1.0 * 10^2
    final double distance = sqrt(k / amplitude);
    
    return distance;
  }

  /// Calcular distancia desde tiempo de respuesta
  double _calculateDistanceFromResponseTime(double responseTime) {
    // Tags más cercanos responden más rápido
    // Modelo lineal simplificado: d = a * t + b
    
    // Calibración empírica:
    // A 1cm: ~5ms
    // A 10cm: ~15ms
    // A 50cm: ~50ms (o timeout)
    
    const double a = 0.4; // cm/ms
    const double b = -1.0; // cm
    
    final double distance = a * (responseTime * 1000) + b; // responseTime en segundos
    
    return distance.clamp(1.0, 50.0);
  }

  /// Calcular distancia desde ancho de banda
  double _calculateDistanceFromBandwidth(double bandwidth) {
    // Ancho de banda disminuye con la distancia
    // Modelo: BW = BW0 * (d0 / d)^alpha
    
    // Calibración
    const double bw0 = 106.0; // kHz - ancho de banda a 1cm
    const double alpha = 1.5;
    
    final double distance = _referenceDistance * pow(bw0 / bandwidth, 1 / alpha);
    
    return distance;
  }

  /// Calcular promedio ponderado de distancias
  double _calculateWeightedAverage(List<double> distances, ProximityData data) {
    if (distances.length == 1) return distances[0];

    // Pesos basados en confiabilidad del método
    final List<double> weights = [];
    
    for (int i = 0; i < distances.length; i++) {
      double weight = 1.0;
      
      // RSSI es más confiable si está en rango razonable
      if (data.rssi != null && data.rssi! > -80 && data.rssi! < 0) {
        weight = 1.5;
      }
      
      // Amplitud es confiable si está normalizada
      if (data.amplitude != null && data.amplitude! > 0 && data.amplitude! <= 1) {
        weight = 1.2;
      }
      
      weights.add(weight);
    }

    // Normalizar pesos
    final double sumWeights = weights.reduce((a, b) => a + b);
    final List<double> normalizedWeights = weights.map((w) => w / sumWeights).toList();

    // Calcular promedio ponderado
    double weightedSum = 0.0;
    for (int i = 0; i < distances.length; i++) {
      weightedSum += distances[i] * normalizedWeights[i];
    }

    return weightedSum;
  }

  /// Aplicar filtro para suavizar lecturas
  double _applyFilter(double distance) {
    // Agregar lectura al historial
    _readings.add(ProximityReading(
      distance: distance,
      timestamp: DateTime.now(),
    ));

    // Mantener solo últimas N lecturas
    if (_readings.length > MAX_READINGS) {
      _readings.removeAt(0);
    }

    // Filtro de media móvil exponencial (EMA)
    if (_readings.length == 1) {
      return distance;
    }

    const double alpha = 0.3; // Factor de suavizado
    double ema = _readings[0].distance;

    for (int i = 1; i < _readings.length; i++) {
      ema = alpha * _readings[i].distance + (1 - alpha) * ema;
    }

    return ema;
  }

  /// Calibrar algoritmo con mediciones conocidas
  void calibrate({
    required double knownDistance,
    required double measuredRssi,
    double? measuredAmplitude,
    double? measuredResponseTime,
  }) {
    // Actualizar parámetros de calibración
    _referenceDistance = knownDistance;
    _referenceRssi = measuredRssi;
    _txPower = measuredRssi + (10 * _pathLossExponent * log10(knownDistance / 1.0));

    _logger.i('Algoritmo calibrado:');
    _logger.i('  Distancia de referencia: ${_referenceDistance}cm');
    _logger.i('  RSSI de referencia: ${_referenceRssi}dBm');
    _logger.i('  Potencia de transmisión estimada: ${_txPower.toStringAsFixed(2)}dBm');
  }

  /// Obtener parámetros de calibración
  Map<String, double> getCalibrationParams() {
    return {
      'txPower': _txPower,
      'pathLossExponent': _pathLossExponent,
      'referenceDistance': _referenceDistance,
      'referenceRssi': _referenceRssi,
    };
  }

  /// Restaurar parámetros de calibración
  void setCalibrationParams(Map<String, double> params) {
    _txPower = params['txPower'] ?? _txPower;
    _pathLossExponent = params['pathLossExponent'] ?? _pathLossExponent;
    _referenceDistance = params['referenceDistance'] ?? _referenceDistance;
    _referenceRssi = params['referenceRssi'] ?? _referenceRssi;
  }

  /// Limpiar historial
  void clearHistory() {
    _readings.clear();
  }
}

/// Datos de proximidad del tag
class ProximityData {
  final double? rssi; // dBm
  final double? amplitude; // 0-1
  final double? responseTime; // segundos
  final double? bandwidth; // kHz
  final Map<String, dynamic>? tagCharacteristics;

  ProximityData({
    this.rssi,
    this.amplitude,
    this.responseTime,
    this.bandwidth,
    this.tagCharacteristics,
  });
}

/// Lectura de proximidad con timestamp
class ProximityReading {
  final double distance;
  final DateTime timestamp;

  ProximityReading({
    required this.distance,
    required this.timestamp,
  });
}

