import 'package:flutter_test/flutter_test.dart';
import 'package:moviles2/services/nfc_precise_reader_service.dart';
import 'package:moviles2/services/nfc_event_logger.dart';

void main() {
  group('NFC Precise Reader Service', () {
    test('debe inicializar correctamente', () async {
      final service = NFCPreciseReaderService();
      // En tests reales, usar mocks para NFC
      expect(service, isNotNull);
    });

    test('debe obtener estadísticas correctamente', () {
      final service = NFCPreciseReaderService();
      
      final stats = service.getStatistics();
      
      expect(stats.totalAttempts, greaterThanOrEqualTo(0));
      expect(stats.successfulReads, greaterThanOrEqualTo(0));
      expect(stats.failedReads, greaterThanOrEqualTo(0));
      expect(stats.invalidIds, greaterThanOrEqualTo(0));
      expect(stats.successRate, greaterThanOrEqualTo(0));
      expect(stats.successRate, lessThanOrEqualTo(100));
    });
  });

  group('NFC Event Logger', () {
    test('debe registrar eventos correctamente', () {
      final logger = NFCEventLogger();
      
      logger.logEvent(NFCEvent(
        type: NFCEventType.idRead,
        message: 'Test event',
        timestamp: DateTime.now(),
        uniqueId: '04:12:34:56',
      ));
      
      final events = logger.getRecentEvents();
      expect(events.length, greaterThan(0));
      expect(events.last.message, equals('Test event'));
    });

    test('debe filtrar eventos por tipo', () {
      final logger = NFCEventLogger();
      
      logger.logEvent(NFCEvent(
        type: NFCEventType.idRead,
        message: 'Read 1',
        timestamp: DateTime.now(),
      ));
      
      logger.logEvent(NFCEvent(
        type: NFCEventType.error,
        message: 'Error 1',
        timestamp: DateTime.now(),
      ));
      
      logger.logEvent(NFCEvent(
        type: NFCEventType.idRead,
        message: 'Read 2',
        timestamp: DateTime.now(),
      ));
      
      final readEvents = logger.getEventsByType(NFCEventType.idRead);
      expect(readEvents.length, equals(2));
      
      final errorEvents = logger.getErrorEvents();
      expect(errorEvents.length, equals(1));
    });

    test('debe calcular estadísticas correctamente', () {
      final logger = NFCEventLogger();
      
      logger.logEvent(NFCEvent(
        type: NFCEventType.idRead,
        message: 'Read',
        timestamp: DateTime.now(),
      ));
      
      logger.logEvent(NFCEvent(
        type: NFCEventType.error,
        message: 'Error',
        timestamp: DateTime.now(),
      ));
      
      logger.logEvent(NFCEvent(
        type: NFCEventType.warning,
        message: 'Warning',
        timestamp: DateTime.now(),
      ));
      
      final stats = logger.getStatistics();
      expect(stats.totalEvents, equals(3));
      expect(stats.errorEvents, equals(1));
      expect(stats.readEvents, equals(1));
      expect(stats.warningEvents, equals(1));
    });
  });
}

