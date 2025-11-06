import 'package:flutter/material.dart';
import '../services/nfc_auto_detection_service.dart';
import '../services/nfc_calibration_service.dart';
import '../widgets/nfc_detection_widget.dart';

/// Pantalla de Detección Automática de NFC
/// 
/// Interfaz principal para detectar pulseras NFC automáticamente
class NFCAutoDetectionScreen extends StatefulWidget {
  const NFCAutoDetectionScreen({Key? key}) : super(key: key);

  @override
  State<NFCAutoDetectionScreen> createState() => _NFCAutoDetectionScreenState();
}

class _NFCAutoDetectionScreenState extends State<NFCAutoDetectionScreen> {
  final NFCAutoDetectionService _nfcService = NFCAutoDetectionService();
  final NFCCalibrationService _calibrationService = NFCCalibrationService();
  
  String? _detectedStudentId;
  double? _detectionDistance;

  @override
  void initState() {
    super.initState();
    _initializeServices();
  }

  Future<void> _initializeServices() async {
    await _nfcService.initialize();
    await _calibrationService.loadCalibration();
    
    if (mounted) {
      setState(() {});
    }
  }

  Future<void> _handleTagDetected(String tagId) async {
    setState(() {
      _detectedStudentId = tagId;
    });

    // Aquí se podría buscar el estudiante en la base de datos
    // usando el tagId
    _showDetectionDialog(tagId);
  }

  Future<void> _handleTagInRange(String tagId, double distance) async {
    setState(() {
      _detectedStudentId = tagId;
      _detectionDistance = distance;
    });
  }

  void _handleTagOutOfRange() {
    setState(() {
      _detectedStudentId = null;
      _detectionDistance = null;
    });
  }

  void _showDetectionDialog(String tagId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Tag NFC Detectado'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('ID: $tagId'),
            if (_detectionDistance != null)
              Text('Distancia: ${_detectionDistance!.toStringAsFixed(2)} cm'),
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
              // Navegar a detalles del estudiante
            },
            child: const Text('Ver Detalles'),
          ),
        ],
      ),
    );
  }

  void _showCalibrationDialog() {
    showDialog(
      context: context,
      builder: (context) => _CalibrationDialog(
        calibrationService: _calibrationService,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Detección Automática NFC'),
        actions: [
          IconButton(
            icon: const Icon(Icons.tune),
            onPressed: _showCalibrationDialog,
            tooltip: 'Calibrar',
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              // Widget de detección
              Expanded(
                child: NFCDetectionWidget(
                  onTagDetected: _handleTagDetected,
                  onTagInRange: _handleTagInRange,
                  onTagOutOfRange: _handleTagOutOfRange,
                ),
              ),
              
              // Información adicional
              if (_detectedStudentId != null)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Estudiante Detectado',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text('ID: $_detectedStudentId'),
                        if (_detectionDistance != null)
                          Text('Distancia: ${_detectionDistance!.toStringAsFixed(2)} cm'),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _nfcService.stopAutoDetection();
    super.dispose();
  }
}

/// Diálogo de calibración
class _CalibrationDialog extends StatefulWidget {
  final NFCCalibrationService calibrationService;

  const _CalibrationDialog({
    Key? key,
    required this.calibrationService,
  }) : super(key: key);

  @override
  State<_CalibrationDialog> createState() => _CalibrationDialogState();
}

class _CalibrationDialogState extends State<_CalibrationDialog> {
  final TextEditingController _distanceController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Calibrar Distancia'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'Coloca el tag NFC a una distancia conocida y mide la señal.',
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _distanceController,
            decoration: const InputDecoration(
              labelText: 'Distancia conocida (cm)',
              hintText: '10.0',
            ),
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 16),
          if (widget.calibrationService.calibrationPoints.isNotEmpty)
            Text(
              'Puntos de calibración: ${widget.calibrationService.calibrationPoints.length}',
            ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancelar'),
        ),
        ElevatedButton(
          onPressed: () {
            final distance = double.tryParse(_distanceController.text);
            if (distance != null) {
              // Agregar punto de calibración
              // (requiere datos de proximidad del tag actual)
              Navigator.of(context).pop();
            }
          },
          child: const Text('Agregar punto'),
        ),
        if (widget.calibrationService.calibrationPoints.length >= 3)
          ElevatedButton(
            onPressed: () async {
              try {
                await widget.calibrationService.completeCalibration();
                if (mounted) {
                  Navigator.of(context).pop();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Calibración completada exitosamente'),
                    ),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Error: $e'),
                    ),
                  );
                }
              }
            },
            child: const Text('Completar'),
          ),
      ],
    );
  }

  @override
  void dispose() {
    _distanceController.dispose();
    super.dispose();
  }
}

