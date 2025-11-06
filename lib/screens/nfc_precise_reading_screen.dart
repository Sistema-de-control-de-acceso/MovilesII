import 'package:flutter/material.dart';
import '../services/nfc_precise_reader_service.dart';
import '../widgets/nfc_reading_status_widget.dart';
import '../services/nfc_event_logger.dart';

/// Pantalla de Lectura Precisa de ID Único
/// 
/// Interfaz para leer IDs únicos de pulseras NFC con precisión a 10cm
class NFCPreciseReadingScreen extends StatefulWidget {
  const NFCPreciseReadingScreen({Key? key}) : super(key: key);

  @override
  State<NFCPreciseReadingScreen> createState() => _NFCPreciseReadingScreenState();
}

class _NFCPreciseReadingScreenState extends State<NFCPreciseReadingScreen> {
  final NFCPreciseReaderService _readerService = NFCPreciseReaderService();
  final NFCEventLogger _eventLogger = NFCEventLogger();
  
  String? _lastReadId;
  double? _lastDistance;
  String? _lastError;

  @override
  void initState() {
    super.initState();
    _initializeServices();
  }

  Future<void> _initializeServices() async {
    await _readerService.initialize();
    await _eventLogger.loadEvents();
    
    if (mounted) {
      setState(() {});
    }
  }

  Future<void> _startReading() async {
    if (!_readerService.isNfcAvailable) {
      _showError('NFC no disponible en este dispositivo');
      return;
    }

    try {
      await _readerService.startPreciseReading(
        onIdRead: _handleIdRead,
        onReadError: _handleReadError,
        onIdInRange: _handleIdInRange,
        targetDistance: 10.0,
        tolerance: 2.0,
      );
    } catch (e) {
      _showError('Error iniciando lectura: $e');
    }
  }

  Future<void> _stopReading() async {
    await _readerService.stopReading();
  }

  void _handleIdRead(String uniqueId) {
    setState(() {
      _lastReadId = uniqueId;
      _lastError = null;
    });

    _showSuccessDialog(uniqueId);
  }

  void _handleIdInRange(String id, double distance) {
    setState(() {
      _lastReadId = id;
      _lastDistance = distance;
    });
  }

  void _handleReadError(String? error) {
    setState(() {
      _lastError = error;
    });

    _showError(error ?? 'Error desconocido');
  }

  void _showSuccessDialog(String uniqueId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('ID Único Leído'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('ID: $uniqueId', style: const TextStyle(fontFamily: 'monospace')),
            if (_lastDistance != null)
              Text('Distancia: ${_lastDistance!.toStringAsFixed(2)} cm'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cerrar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              // Navegar a detalles o procesar ID
            },
            child: const Text('Procesar'),
          ),
        ],
      ),
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  void _showEventLog() {
    final events = _eventLogger.getRecentEvents(limit: 50);
    final errorEvents = _eventLogger.getErrorEvents();
    final stats = _eventLogger.getStatistics();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Log de Eventos NFC'),
        content: SizedBox(
          width: double.maxFinite,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Total: ${stats.totalEvents}'),
              Text('Errores: ${stats.errorEvents}'),
              Text('Lecturas: ${stats.readEvents}'),
              Text('Tasa de error: ${stats.errorRate.toStringAsFixed(1)}%'),
              const Divider(),
              Expanded(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: events.length,
                  itemBuilder: (context, index) {
                    final event = events[events.length - 1 - index];
                    return ListTile(
                      title: Text(event.message),
                      subtitle: Text(
                        '${event.type} - ${event.timestamp.toString().substring(11, 19)}',
                      ),
                      leading: Icon(
                        _getEventIcon(event.type),
                        color: _getEventColor(event.type),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cerrar'),
          ),
          TextButton(
            onPressed: () async {
              final exported = await _eventLogger.exportEvents();
              // Copiar al portapapeles o compartir
              Navigator.of(context).pop();
            },
            child: const Text('Exportar'),
          ),
        ],
      ),
    );
  }

  IconData _getEventIcon(NFCEventType type) {
    switch (type) {
      case NFCEventType.idRead:
        return Icons.check_circle;
      case NFCEventType.error:
      case NFCEventType.readError:
        return Icons.error;
      case NFCEventType.warning:
        return Icons.warning;
      default:
        return Icons.info;
    }
  }

  Color _getEventColor(NFCEventType type) {
    switch (type) {
      case NFCEventType.idRead:
        return Colors.green;
      case NFCEventType.error:
      case NFCEventType.readError:
        return Colors.red;
      case NFCEventType.warning:
        return Colors.orange;
      default:
        return Colors.blue;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Lectura Precisa de ID Único'),
        actions: [
          IconButton(
            icon: const Icon(Icons.history),
            onPressed: _showEventLog,
            tooltip: 'Ver log de eventos',
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              // Widget de estado
              const NFCReadingStatusWidget(),
              
              const SizedBox(height: 24),
              
              // Indicador visual
              _buildReadingIndicator(),
              
              const SizedBox(height: 24),
              
              // Último error
              if (_lastError != null)
                Card(
                  color: Colors.red[50],
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Row(
                      children: [
                        const Icon(Icons.error, color: Colors.red),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _lastError!,
                            style: const TextStyle(color: Colors.red),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              
              const Spacer(),
              
              // Controles
              _buildControls(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildReadingIndicator() {
    return Consumer<NFCPreciseReaderService>(
      builder: (context, service, child) {
        if (!service.isReading) {
          return Container(
            width: 200,
            height: 200,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.grey[300],
              border: Border.all(color: Colors.grey, width: 4),
            ),
            child: const Icon(
              Icons.nfc,
              size: 100,
              color: Colors.grey,
            ),
          );
        }

        final isInRange = service.currentDistance >= 8 && 
                         service.currentDistance <= 12;

        return Container(
          width: 200,
          height: 200,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isInRange ? Colors.green[100] : Colors.orange[100],
            border: Border.all(
              color: isInRange ? Colors.green : Colors.orange,
              width: 4,
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                isInRange ? Icons.check_circle : Icons.nfc,
                size: 80,
                color: isInRange ? Colors.green : Colors.orange,
              ),
              if (service.currentDistance > 0)
                Text(
                  '${service.currentDistance.toStringAsFixed(1)} cm',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildControls() {
    return Consumer<NFCPreciseReaderService>(
      builder: (context, service, child) {
        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton.icon(
              onPressed: service.isReading ? _stopReading : _startReading,
              icon: Icon(service.isReading ? Icons.stop : Icons.play_arrow),
              label: Text(service.isReading ? 'Detener' : 'Iniciar Lectura'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        );
      },
    );
  }

  @override
  void dispose() {
    _readerService.stopReading();
    super.dispose();
  }
}

