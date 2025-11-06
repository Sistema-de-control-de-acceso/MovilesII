import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:logger/logger.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

/// Logger de Eventos NFC
/// 
/// Registra todos los eventos relacionados con NFC para debugging y análisis
class NFCEventLogger {
  final Logger _logger = Logger();
  final List<NFCEvent> _events = [];
  static const int MAX_EVENTS_IN_MEMORY = 1000;
  static const String _prefsKey = 'nfc_events';

  /// Registrar evento
  void logEvent(NFCEvent event) {
    try {
      // Agregar a memoria
      _events.add(event);
      
      // Mantener solo últimas N eventos en memoria
      if (_events.length > MAX_EVENTS_IN_MEMORY) {
        _events.removeAt(0);
      }

      // Log según nivel
      switch (event.type) {
        case NFCEventType.error:
        case NFCEventType.readError:
        case NFCEventType.initializationFailed:
          _logger.e('NFC Event: ${event.type} - ${event.message}');
          break;
        case NFCEventType.warning:
          _logger.w('NFC Event: ${event.type} - ${event.message}');
          break;
        default:
          _logger.i('NFC Event: ${event.type} - ${event.message}');
      }

      // Guardar en persistencia (asíncrono)
      _saveEventAsync(event);
    } catch (e) {
      _logger.e('Error registrando evento NFC', error: e);
    }
  }

  /// Guardar evento de forma asíncrona
  Future<void> _saveEventAsync(NFCEvent event) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final eventsJson = prefs.getStringList(_prefsKey) ?? [];
      
      // Agregar nuevo evento
      eventsJson.add(jsonEncode(event.toJson()));
      
      // Mantener solo últimos 500 eventos en persistencia
      if (eventsJson.length > 500) {
        eventsJson.removeAt(0);
      }
      
      await prefs.setStringList(_prefsKey, eventsJson);
    } catch (e) {
      _logger.w('Error guardando evento en persistencia', error: e);
    }
  }

  /// Obtener eventos recientes
  List<NFCEvent> getRecentEvents({int limit = 100}) {
    final start = _events.length > limit ? _events.length - limit : 0;
    return _events.sublist(start);
  }

  /// Obtener eventos por tipo
  List<NFCEvent> getEventsByType(NFCEventType type) {
    return _events.where((e) => e.type == type).toList();
  }

  /// Obtener eventos de error
  List<NFCEvent> getErrorEvents() {
    return _events.where((e) => 
      e.type == NFCEventType.error ||
      e.type == NFCEventType.readError ||
      e.type == NFCEventType.initializationFailed
    ).toList();
  }

  /// Obtener estadísticas de eventos
  EventStatistics getStatistics() {
    final total = _events.length;
    final errors = getErrorEvents().length;
    final reads = getEventsByType(NFCEventType.idRead).length;
    final warnings = getEventsByType(NFCEventType.warning).length;

    return EventStatistics(
      totalEvents: total,
      errorEvents: errors,
      readEvents: reads,
      warningEvents: warnings,
      errorRate: total > 0 ? (errors / total) * 100 : 0.0,
    );
  }

  /// Exportar eventos a JSON
  Future<String> exportEvents({int? limit}) async {
    final eventsToExport = limit != null 
        ? _events.sublist(_events.length - limit)
        : _events;
    
    final json = {
      'exportedAt': DateTime.now().toIso8601String(),
      'totalEvents': eventsToExport.length,
      'events': eventsToExport.map((e) => e.toJson()).toList(),
    };

    return jsonEncode(json);
  }

  /// Limpiar eventos
  Future<void> clearEvents() async {
    _events.clear();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_prefsKey);
    } catch (e) {
      _logger.w('Error limpiando eventos', error: e);
    }
  }

  /// Cargar eventos desde persistencia
  Future<void> loadEvents() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final eventsJson = prefs.getStringList(_prefsKey) ?? [];
      
      _events.clear();
      for (final jsonString in eventsJson) {
        try {
          final json = jsonDecode(jsonString) as Map<String, dynamic>;
          _events.add(NFCEvent.fromJson(json));
        } catch (e) {
          _logger.w('Error parseando evento: $e');
        }
      }
    } catch (e) {
      _logger.w('Error cargando eventos', error: e);
    }
  }
}

/// Tipo de evento NFC
enum NFCEventType {
  serviceInitialized,
  initializationFailed,
  readingStarted,
  readingStopped,
  idRead,
  readError,
  error,
  warning,
  calibrationStarted,
  calibrationCompleted,
}

/// Evento NFC
class NFCEvent {
  final NFCEventType type;
  final String message;
  final DateTime timestamp;
  final String? uniqueId;
  final double? distance;
  final Map<String, dynamic>? metadata;

  NFCEvent({
    required this.type,
    required this.message,
    required this.timestamp,
    this.uniqueId,
    this.distance,
    this.metadata,
  });

  Map<String, dynamic> toJson() {
    return {
      'type': type.toString(),
      'message': message,
      'timestamp': timestamp.toIso8601String(),
      'uniqueId': uniqueId,
      'distance': distance,
      'metadata': metadata,
    };
  }

  factory NFCEvent.fromJson(Map<String, dynamic> json) {
    return NFCEvent(
      type: NFCEventType.values.firstWhere(
        (e) => e.toString() == json['type'],
        orElse: () => NFCEventType.error,
      ),
      message: json['message'] as String,
      timestamp: DateTime.parse(json['timestamp'] as String),
      uniqueId: json['uniqueId'] as String?,
      distance: json['distance'] as double?,
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }
}

/// Estadísticas de eventos
class EventStatistics {
  final int totalEvents;
  final int errorEvents;
  final int readEvents;
  final int warningEvents;
  final double errorRate;

  EventStatistics({
    required this.totalEvents,
    required this.errorEvents,
    required this.readEvents,
    required this.warningEvents,
    required this.errorRate,
  });
}

