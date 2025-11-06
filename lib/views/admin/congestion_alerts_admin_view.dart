import 'package:flutter/material.dart';

class CongestionAlertsAdminView extends StatelessWidget {
  final List<Map<String, dynamic>> congestionAlerts;

  const CongestionAlertsAdminView({Key? key, required this.congestionAlerts}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Alertas de Congestión')),
      body: ListView.builder(
        itemCount: congestionAlerts.length,
        itemBuilder: (context, index) {
          final alert = congestionAlerts[index];
          return ListTile(
            leading: const Icon(Icons.warning, color: Colors.red),
            title: Text(alert['message'] ?? ''),
            subtitle: Text('Punto: ${alert['pointId']} - ${alert['timestamp']}'),
          );
        },
      ),
    );
  }
}
