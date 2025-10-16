
import 'package:flutter/material.dart';
import 'flow_chart/flow_chart_view.dart';

/// Punto de entrada principal de la aplicación de gráficos de flujo de horarios.
void main() {
  runApp(const MainApp());
}

/// Widget principal que configura el tema y la vista inicial.
class MainApp extends StatelessWidget {
  const MainApp({super.key});

  // Datos de ejemplo para el gráfico de flujo
  static const List<FlowChartData> sampleData = [
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

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gráficos de Flujo de Horarios',
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
      home: const FlowChartHome(),
      debugShowCheckedModeBanner: false,
    );
  }
}

/// Pantalla inicial que muestra el gráfico de flujo con datos de ejemplo.
class FlowChartHome extends StatelessWidget {
  const FlowChartHome({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Gráfico de Flujo de Horarios'),
      ),
      body: FlowChartView(data: MainApp.sampleData),
    );
  }
}
