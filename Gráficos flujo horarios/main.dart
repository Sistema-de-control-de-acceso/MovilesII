import 'package:flutter/material.dart';
import 'flow_chart/flow_chart_view.dart';

void main() {
  runApp(const MainApp());
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Datos de ejemplo para probar el gráfico
    final List<FlowChartData> datos = [
      FlowChartData(label: '08:00', value: 12, date: DateTime(2025, 10, 7, 8), userType: 'Admin', location: 'Oficina'),
      FlowChartData(label: '09:00', value: 20, date: DateTime(2025, 10, 7, 9), userType: 'Invitado', location: 'Remoto'),
      FlowChartData(label: '10:00', value: 15, date: DateTime(2025, 10, 7, 10), userType: 'Admin', location: 'Remoto'),
      FlowChartData(label: '11:00', value: 8, date: DateTime(2025, 10, 7, 11), userType: 'Invitado', location: 'Oficina'),
      FlowChartData(label: '12:00', value: 18, date: DateTime(2025, 10, 7, 12), userType: 'Admin', location: 'Oficina'),
      FlowChartData(label: '13:00', value: 10, date: DateTime(2025, 10, 7, 13), userType: 'Invitado', location: 'Remoto'),
      FlowChartData(label: '14:00', value: 22, date: DateTime(2025, 10, 7, 14), userType: 'Admin', location: 'Oficina'),
      FlowChartData(label: '15:00', value: 7, date: DateTime(2025, 10, 7, 15), userType: 'Invitado', location: 'Oficina'),
      FlowChartData(label: '16:00', value: 19, date: DateTime(2025, 10, 7, 16), userType: 'Admin', location: 'Remoto'),
      FlowChartData(label: '17:00', value: 13, date: DateTime(2025, 10, 7, 17), userType: 'Invitado', location: 'Remoto'),
    ];
    return MaterialApp(
      theme: ThemeData.light().copyWith(
        colorScheme: ColorScheme.fromSwatch(primarySwatch: Colors.blue),
        visualDensity: VisualDensity.adaptivePlatformDensity,
        useMaterial3: true,
        pageTransitionsTheme: const PageTransitionsTheme(
          builders: {
            TargetPlatform.android: ZoomPageTransitionsBuilder(),
            TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
          },
        ),
      ),
      darkTheme: ThemeData.dark().copyWith(
        colorScheme: ColorScheme.fromSwatch(primarySwatch: Colors.blueGrey, brightness: Brightness.dark),
        useMaterial3: true,
        pageTransitionsTheme: const PageTransitionsTheme(
          builders: {
            TargetPlatform.android: ZoomPageTransitionsBuilder(),
            TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
          },
        ),
      ),
      themeMode: ThemeMode.system,
      home: FlowChartView(data: datos),
      debugShowCheckedModeBanner: false,
    );
  }
}
