import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/nfc_precise_reader_service.dart';

/// Widget de Estado de Lectura NFC
/// 
/// Muestra información sobre el estado de lectura, estadísticas y eventos
class NFCReadingStatusWidget extends StatelessWidget {
  const NFCReadingStatusWidget({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer<NFCPreciseReaderService>(
      builder: (context, service, child) {
        final stats = service.getStatistics();
        
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Estado de Lectura',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                
                // Estado actual
                _buildStatusRow(
                  'Estado',
                  service.isReading ? 'Leyendo...' : 'Inactivo',
                  service.isReading ? Colors.green : Colors.grey,
                ),
                
                const SizedBox(height: 8),
                
                // Último ID leído
                if (service.lastReadId != null)
                  _buildStatusRow(
                    'Último ID',
                    service.lastReadId!,
                    Colors.blue,
                  ),
                
                const SizedBox(height: 8),
                
                // Distancia actual
                if (service.isReading)
                  _buildStatusRow(
                    'Distancia',
                    '${service.currentDistance.toStringAsFixed(2)} cm',
                    _getDistanceColor(service.currentDistance),
                  ),
                
                const Divider(),
                
                // Estadísticas
                const Text(
                  'Estadísticas',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                
                _buildStatRow('Lecturas exitosas', stats.successfulReads.toString()),
                _buildStatRow('Lecturas fallidas', stats.failedReads.toString()),
                _buildStatRow('IDs inválidos', stats.invalidIds.toString()),
                _buildStatRow('Tasa de éxito', '${stats.successRate.toStringAsFixed(1)}%'),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatusRow(String label, String value, Color color) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.w500),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: color),
          ),
          child: Text(
            value,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
              fontFamily: 'monospace',
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStatRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(
            value,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontFamily: 'monospace',
            ),
          ),
        ],
      ),
    );
  }

  Color _getDistanceColor(double distance) {
    if (distance >= 8 && distance <= 12) {
      return Colors.green; // En rango objetivo
    } else if (distance >= 5 && distance <= 15) {
      return Colors.orange; // Cerca del rango
    } else {
      return Colors.red; // Fuera de rango
    }
  }
}

