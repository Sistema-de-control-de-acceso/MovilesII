
import 'dart:math';

class MetricsService {
  // Simulación de obtención de métricas en tiempo real
  final Random _random = Random();

  Future<Map<String, dynamic>> getMetrics() async {
    // Simula cambios en tiempo real
    await Future.delayed(const Duration(milliseconds: 500));
    return {
      'totalAccesses': 1200 + _random.nextInt(100),
      'activeUsers': 30 + _random.nextInt(10),
      'accessesHistory': List.generate(12, (i) => 100 + _random.nextInt(50)), // Para gráfico de barras
    };
  }
}
