import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/nfc_auto_detection_service.dart';

/// Widget de Detección NFC con Feedback Visual
/// 
/// Muestra estado de detección, distancia y proporciona feedback visual
class NFCDetectionWidget extends StatefulWidget {
  final Function(String tagId)? onTagDetected;
  final Function(String tagId, double distance)? onTagInRange;
  final Function()? onTagOutOfRange;

  const NFCDetectionWidget({
    Key? key,
    this.onTagDetected,
    this.onTagInRange,
    this.onTagOutOfRange,
  }) : super(key: key);

  @override
  State<NFCDetectionWidget> createState() => _NFCDetectionWidgetState();
}

class _NFCDetectionWidgetState extends State<NFCDetectionWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  late Animation<Color?> _colorAnimation;

  @override
  void initState() {
    super.initState();
    
    // Animación de pulso para feedback visual
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _colorAnimation = ColorTween(
      begin: Colors.blue,
      end: Colors.green,
    ).animate(_pulseController);

    // Escuchar cambios en el servicio
    final service = NFCAutoDetectionService();
    service.addListener(_onServiceChanged);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    final service = NFCAutoDetectionService();
    service.removeListener(_onServiceChanged);
    super.dispose();
  }

  void _onServiceChanged() {
    if (mounted) {
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    final service = NFCAutoDetectionService();

    return Consumer<NFCAutoDetectionService>(
      builder: (context, service, child) {
        return Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Indicador visual de detección
            _buildDetectionIndicator(service),
            
            const SizedBox(height: 24),
            
            // Información de estado
            _buildStatusInfo(service),
            
            const SizedBox(height: 24),
            
            // Controles
            _buildControls(service),
          ],
        );
      },
    );
  }

  Widget _buildDetectionIndicator(NFCAutoDetectionService service) {
    if (!service.isScanning) {
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

    if (service.lastDetectedTag != null) {
      // Tag detectado - animación verde pulsante
      return AnimatedBuilder(
        animation: _pulseAnimation,
        builder: (context, child) {
          return Container(
            width: 200 * _pulseAnimation.value,
            height: 200 * _pulseAnimation.value,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.green.withOpacity(0.3),
              border: Border.all(
                color: Colors.green,
                width: 4 * _pulseAnimation.value,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.green.withOpacity(0.5),
                  blurRadius: 20 * _pulseAnimation.value,
                  spreadRadius: 10 * _pulseAnimation.value,
                ),
              ],
            ),
            child: const Icon(
              Icons.check_circle,
              size: 100,
              color: Colors.green,
            ),
          );
        },
      );
    }

    // Escaneando - animación azul pulsante
    return AnimatedBuilder(
      animation: _pulseAnimation,
      builder: (context, child) {
        return Container(
          width: 200 * _pulseAnimation.value,
          height: 200 * _pulseAnimation.value,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.blue.withOpacity(0.2),
            border: Border.all(
              color: Colors.blue,
              width: 4,
            ),
          ),
          child: const Icon(
            Icons.nfc,
            size: 100,
            color: Colors.blue,
          ),
        );
      },
    );
  }

  Widget _buildStatusInfo(NFCAutoDetectionService service) {
    return Column(
      children: [
        // Estado
        Text(
          service.isScanning
              ? (service.lastDetectedTag != null
                  ? 'Tag Detectado'
                  : 'Escaneando...')
              : 'Inactivo',
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        
        const SizedBox(height: 16),
        
        // Tag ID
        if (service.lastDetectedTag != null)
          Text(
            'ID: ${service.lastDetectedTag}',
            style: const TextStyle(
              fontSize: 16,
              fontFamily: 'monospace',
            ),
          ),
        
        const SizedBox(height: 16),
        
        // Distancia
        if (service.isScanning)
          Column(
            children: [
              Text(
                'Distancia: ${service.currentDistance.toStringAsFixed(2)} cm',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              // Barra de progreso de señal
              SizedBox(
                width: 200,
                child: LinearProgressIndicator(
                  value: service.signalStrength,
                  backgroundColor: Colors.grey[300],
                  valueColor: AlwaysStoppedAnimation<Color>(
                    service.currentDistance <= 10.0
                        ? Colors.green
                        : Colors.orange,
                  ),
                ),
              ),
              Text(
                'Señal: ${(service.signalStrength * 100).toStringAsFixed(0)}%',
                style: const TextStyle(fontSize: 12),
              ),
            ],
          ),
      ],
    );
  }

  Widget _buildControls(NFCAutoDetectionService service) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        ElevatedButton.icon(
          onPressed: service.isScanning
              ? () async {
                  await service.stopAutoDetection();
                }
              : () async {
                  if (!service.isNfcAvailable) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('NFC no disponible en este dispositivo'),
                      ),
                    );
                    return;
                  }

                  await service.startAutoDetection(
                    onDetected: widget.onTagDetected,
                    onInRange: widget.onTagInRange,
                    onOutOfRange: widget.onTagOutOfRange,
                  );
                },
          icon: Icon(service.isScanning ? Icons.stop : Icons.play_arrow),
          label: Text(service.isScanning ? 'Detener' : 'Iniciar'),
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          ),
        ),
      ],
    );
  }
}

