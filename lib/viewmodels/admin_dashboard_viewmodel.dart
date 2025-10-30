import 'dart:async';
import '../services/metrics_service.dart';

class AdminDashboardViewModel {
  final MetricsService metricsService;

  int totalAccesses = 0;
  int activeUsers = 0;
  List<int> accessesHistory = [];

  final StreamController<void> _metricsUpdated = StreamController.broadcast();
  Stream<void> get metricsUpdated => _metricsUpdated.stream;

  AdminDashboardViewModel(this.metricsService);

  Future<void> fetchMetrics() async {
    final metrics = await metricsService.getMetrics();
    totalAccesses = metrics['totalAccesses'] ?? 0;
    activeUsers = metrics['activeUsers'] ?? 0;
    accessesHistory = List<int>.from(metrics['accessesHistory'] ?? []);
    _metricsUpdated.add(null);
  }

  void startRealtimeUpdates({Duration interval = const Duration(seconds: 2)}) {
    Timer.periodic(interval, (_) => fetchMetrics());
  }

  void dispose() {
    _metricsUpdated.close();
  }
}
