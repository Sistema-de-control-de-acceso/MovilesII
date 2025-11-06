import 'package:flutter_test/flutter_test.dart';
import 'package:moviles2/services/nfc_auto_detection_service.dart';
import 'package:moviles2/services/nfc_proximity_algorithm.dart';
import 'package:moviles2/services/nfc_calibration_service.dart';

void main() {
  group('NFC Auto Detection Service', () {
    test('debe inicializar correctamente', () async {
      final service = NFCAutoDetectionService();
      // Mock NFC availability
      // En tests reales, usar mocks
    });

    test('debe calcular distancia correctamente', () {
      final algorithm = NFCProximityAlgorithm();
      
      final data = ProximityData(
        rssi: -50.0,
        amplitude: 0.8,
        responseTime: 0.01,
      );

      final distance = algorithm.calculateDistance(data);
      expect(distance, greaterThan(0));
      expect(distance, lessThan(50));
    });

    test('debe calibrar algoritmo correctamente', () {
      final algorithm = NFCProximityAlgorithm();
      
      algorithm.calibrate(
        knownDistance: 10.0,
        measuredRssi: -40.0,
        measuredAmplitude: 1.0,
      );

      final params = algorithm.getCalibrationParams();
      expect(params['referenceDistance'], equals(10.0));
      expect(params['referenceRssi'], equals(-40.0));
    });
  });

  group('NFC Calibration Service', () {
    test('debe agregar puntos de calibración', () async {
      final service = NFCCalibrationService();
      
      await service.startCalibration();
      
      await service.addCalibrationPoint(
        knownDistanceCm: 10.0,
        measuredData: ProximityData(rssi: -40.0),
      );

      expect(service.calibrationPoints.length, equals(1));
    });

    test('debe completar calibración con suficientes puntos', () async {
      final service = NFCCalibrationService();
      
      await service.startCalibration();
      
      // Agregar 3 puntos
      await service.addCalibrationPoint(
        knownDistanceCm: 5.0,
        measuredData: ProximityData(rssi: -35.0),
      );
      
      await service.addCalibrationPoint(
        knownDistanceCm: 10.0,
        measuredData: ProximityData(rssi: -40.0),
      );
      
      await service.addCalibrationPoint(
        knownDistanceCm: 15.0,
        measuredData: ProximityData(rssi: -45.0),
      );

      final result = await service.completeCalibration();
      
      expect(result.validation.isValid, isTrue);
      expect(result.calibrationPoints.length, equals(3));
    });
  });
}

