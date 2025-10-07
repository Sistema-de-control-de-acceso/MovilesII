import 'package:flutter/material.dart';
import 'widgets/flow_chart_widget.dart';

/// Vista principal para mostrar el gráfico de flujo de accesos.
/// Recibe los datos por parámetros y muestra el gráfico interactivo.

class FlowChartView extends StatefulWidget {
  /// Lista de datos de accesos por hora/día.
  final List<FlowChartData> data;

  const FlowChartView({
    Key? key,
    required this.data,
  }) : super(key: key);

  @override
  State<FlowChartView> createState() => _FlowChartViewState();
}

class _FlowChartViewState extends State<FlowChartView> {
  DateTimeRange? selectedRange;
  FlowChartData? selectedBar;

  List<FlowChartData> get filteredData {
    if (selectedRange == null) return widget.data;
    return widget.data.where((d) {
      if (d.date == null) return true;
      return d.date!.isAfter(selectedRange!.start.subtract(const Duration(days: 1))) &&
             d.date!.isBefore(selectedRange!.end.add(const Duration(days: 1)));
    }).toList();
  }

  void _pickDateRange() async {
    final now = DateTime.now();
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 1),
      initialDateRange: selectedRange,
    );
    if (picked != null) {
      setState(() => selectedRange = picked);
    }
  }

  void _onBarTap(FlowChartData data) {
    setState(() => selectedBar = data);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Detalle: ${data.label}'),
        content: Text('Accesos: ${data.value}\nFecha: ${data.date ?? 'N/A'}'),
        actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cerrar'))],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Flujo de Accesos'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_alt),
            tooltip: 'Filtrar por fecha',
            onPressed: _pickDateRange,
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            if (selectedRange != null)
              Row(
                children: [
                  Text('Rango: ${selectedRange!.start.toString().split(' ')[0]} - ${selectedRange!.end.toString().split(' ')[0]}'),
                  IconButton(
                    icon: const Icon(Icons.clear),
                    onPressed: () => setState(() => selectedRange = null),
                  ),
                ],
              ),
            Expanded(
              child: FlowChartWidget(
                data: filteredData,
                onBarTap: _onBarTap,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Modelo de datos para el gráfico (puedes expandirlo según tus necesidades).
class FlowChartData {
  final String label; // Ej: "08:00", "Lunes", etc.
  final int value;   // Cantidad de accesos
  final DateTime? date; // Fecha/hora asociada (opcional)

  FlowChartData({required this.label, required this.value, this.date});
}
