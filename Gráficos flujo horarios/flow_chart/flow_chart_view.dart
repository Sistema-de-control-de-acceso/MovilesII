
import 'package:flutter/material.dart';
import 'widgets/flow_chart_widget.dart';
import 'dart:typed_data';
import 'package:path_provider/path_provider.dart';
import 'package:csv/csv.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:pdf/pdf.dart';
import 'package:flutter/rendering.dart';
import 'dart:ui' as ui;
import 'package:flutter/foundation.dart';
import 'web_export.dart';
import 'dart:io'; // Solo se usa en plataformas compatibles (no web)

/// Modelo de evento para el calendario de accesos.
class CalendarEvent {
  final DateTime date;
  final String title;
  CalendarEvent(this.date, this.title);
}

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
  // Eventos de ejemplo para el calendario
  final List<CalendarEvent> eventos = [
    CalendarEvent(DateTime(2025, 10, 7, 9), 'Reunión de equipo'),
    CalendarEvent(DateTime(2025, 10, 7, 12), 'Mantenimiento'),
    CalendarEvent(DateTime(2025, 10, 7, 14), 'Visita auditoría'),
    CalendarEvent(DateTime(2025, 10, 8, 10), 'Capacitación'),
  ];

  /// Tipo de gráfico seleccionado
  String chartType = 'barras'; // 'barras', 'lineas', 'area'

  /// Filtrado de datos según lógica de negocio (puedes personalizar)
  List<FlowChartData> get filteredData => widget.data;

  /// Total de accesos en el periodo mostrado
  int get totalAccesos => filteredData.fold(0, (a, b) => a + b.value);

  /// Promedio de accesos
  double get promedioAccesos => filteredData.isEmpty ? 0 : totalAccesos / filteredData.length;

  /// Hora con mayor cantidad de accesos
  FlowChartData? get horaPico => filteredData.isEmpty ? null : filteredData.reduce((a, b) => a.value > b.value ? a : b);

  /// Usuario con más accesos
  String get topUsuario {
    if (filteredData.isEmpty) return '';
    final Map<String, int> conteo = {};
    for (var d in filteredData) {
      conteo[d.userType ?? 'Desconocido'] = (conteo[d.userType ?? 'Desconocido'] ?? 0) + d.value;
    }
    return conteo.entries.reduce((a, b) => a.value > b.value ? a : b).key;
  }

  /// Ubicación más frecuente
  String get topUbicacion {
    if (filteredData.isEmpty) return '';
    final Map<String, int> conteo = {};
    for (var d in filteredData) {
      conteo[d.location ?? 'Desconocida'] = (conteo[d.location ?? 'Desconocida'] ?? 0) + d.value;
    }
    return conteo.entries.reduce((a, b) => a.value > b.value ? a : b).key;
  }

  /// Detecta si hay un pico inusual de accesos
  bool get hayPicoInusual {
    if (filteredData.isEmpty) return false;
    final max = filteredData.map((e) => e.value).fold(0, (a, b) => a > b ? a : b);
    final avg = promedioAccesos;
    return max > avg * 2 && max > 10; // Ejemplo: pico si es más del doble del promedio y mayor a 10
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Total accesos: $totalAccesos'),
              Text('Promedio: ${promedioAccesos.toStringAsFixed(2)}'),
              if (horaPico != null) Text('Hora pico: ${horaPico!.label}'),
              if (hayPicoInusual)
                const Icon(Icons.warning, color: Colors.red, size: 28, semanticLabel: 'Pico inusual'),
            ],
          ),
        ),
        Expanded(
          child: FlowChartWidget(
            data: filteredData,
            chartType: chartType,
            onBarTap: (item) {
              // Ejemplo de interacción: mostrar detalles
              showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: Text('Detalle de acceso'),
                  content: Text('Hora: ${item.label}\nAccesos: ${item.value}\nUsuario: ${item.userType ?? '-'}\nUbicación: ${item.location ?? '-'}'),
                  actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cerrar'))],
                ),
              );
            },
          ),
        ),
        // Puedes agregar aquí más widgets, como exportar, filtrar, etc.
      ],
    );
  }
}

// Ejemplo de eventos para el calendario
class CalendarEvent {
  final DateTime date;
  final String title;
  CalendarEvent(this.date, this.title);
}

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
  // Eventos de ejemplo
  final List<CalendarEvent> eventos = [
    CalendarEvent(DateTime(2025, 10, 7, 9), 'Reunión de equipo'),
    CalendarEvent(DateTime(2025, 10, 7, 12), 'Mantenimiento'),
    CalendarEvent(DateTime(2025, 10, 7, 14), 'Visita auditoría'),
    CalendarEvent(DateTime(2025, 10, 8, 10), 'Capacitación'),
  ];
  bool get hayPicoInusual {
    if (filteredData.isEmpty) return false;
    final max = filteredData.map((e) => e.value).fold(0, (a, b) => a > b ? a : b);
    final avg = promedioAccesos;
    return max > avg * 2 && max > 10; // Ejemplo: pico si es más del doble del promedio y mayor a 10
  }
  String chartType = 'barras'; // 'barras', 'lineas', 'area'

  // ...existing code...

  int get totalAccesos => filteredData.fold(0, (a, b) => a + b.value);
  double get promedioAccesos => filteredData.isEmpty ? 0 : totalAccesos / filteredData.length;
  FlowChartData? get horaPico => filteredData.isEmpty ? null : filteredData.reduce((a, b) => a.value > b.value ? a : b);
  String get topUsuario {
    if (filteredData.isEmpty) return '-';
    final counts = <String, int>{};
    for (var d in filteredData) {
      final key = d.userType ?? '-';
      counts[key] = (counts[key] ?? 0) + d.value;
    }
    final sorted = counts.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
    return sorted.first.key;
  }
  final GlobalKey chartKey = GlobalKey();
  Future<void> _exportCSV() async {
    List<List<dynamic>> rows = [
      ['Etiqueta', 'Valor', 'Fecha', 'Tipo de usuario', 'Ubicación'],
      ...filteredData.map((d) => [d.label, d.value, d.date?.toIso8601String() ?? '', d.userType ?? '', d.location ?? ''])
    ];
    String csv = const ListToCsvConverter().convert(rows);
    if (kIsWeb) {
      exportCsvWeb(csv);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('CSV descargado.')), // No hay path en web
        );
      }
    } else {
      final dir = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/accesos_export.csv');
      await file.writeAsString(csv);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('CSV exportado en: ${file.path}')),
        );
      }
    }
  }

  Future<void> _exportPDF() async {
    if (kIsWeb) {
      try {
        await exportPdfWeb(chartKey);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('PDF descargado.')),
          );
        }
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al exportar PDF: $e')),
        );
      }
      return;
    }
    try {
      RenderRepaintBoundary boundary = chartKey.currentContext!.findRenderObject() as RenderRepaintBoundary;
      var image = await boundary.toImage(pixelRatio: 3.0);
      ByteData? byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      Uint8List pngBytes = byteData!.buffer.asUint8List();
      // Crear PDF
      final pdf = pw.Document();
      final imageProvider = pw.MemoryImage(pngBytes);
      pdf.addPage(
        pw.Page(
          pageFormat: PdfPageFormat.a4,
          build: (pw.Context context) {
            return pw.Center(
              child: pw.Image(imageProvider),
            );
          },
        ),
      );
      final dir = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/accesos_grafico.pdf');
      await file.writeAsBytes(await pdf.save());
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('PDF exportado en: ${file.path}')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error al exportar PDF: $e')),
      );
    }
  }
  DateTimeRange? selectedRange;
  FlowChartData? selectedBar;
  String? selectedUserType;
  String? selectedLocation;
  List<String> get userTypes => widget.data.map((d) => d.userType ?? '').where((e) => e.isNotEmpty).toSet().toList();
  List<String> get locations => widget.data.map((d) => d.location ?? '').where((e) => e.isNotEmpty).toSet().toList();

  List<FlowChartData> get filteredData {
    return widget.data.where((d) {
      final inRange = selectedRange == null || (d.date != null && d.date!.isAfter(selectedRange!.start.subtract(const Duration(days: 1))) && d.date!.isBefore(selectedRange!.end.add(const Duration(days: 1))));
      final userTypeOk = selectedUserType == null || d.userType == selectedUserType;
      final locationOk = selectedLocation == null || d.location == selectedLocation;
      return inRange && userTypeOk && locationOk;
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
            icon: const Icon(Icons.help_outline),
            tooltip: 'Ayuda',
            onPressed: () {
              showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Ayuda'),
                  content: const Text(
                    '• Usa los filtros para analizar los accesos por usuario, ubicación y fecha.\n'
                    '• Cambia el tipo de gráfico según tu preferencia.\n'
                    '• Exporta los datos o la imagen del gráfico desde el menú.\n'
                    '• Si ves una alerta, significa que hay un pico inusual de accesos.\n'
                  ),
                  actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cerrar'))],
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.filter_alt),
            tooltip: 'Filtrar por fecha',
            onPressed: _pickDateRange,
          ),
          PopupMenuButton<String>(
            onSelected: (value) {
              if (value == 'csv') _exportCSV();
              if (value == 'pdf') _exportPDF();
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: 'csv', child: Text('Exportar CSV')),
              const PopupMenuItem(value: 'pdf', child: Text('Exportar PDF')),
            ],
            icon: const Icon(Icons.download),
            tooltip: 'Exportar',
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            // Filtros avanzados
            Row(
              children: [
                if (userTypes.isNotEmpty)
                  DropdownButton<String>(
                    value: selectedUserType,
                    hint: const Text('Tipo de usuario'),
                    items: [
                      const DropdownMenuItem(value: null, child: Text('Todos')),
                      ...userTypes.map((t) => DropdownMenuItem(value: t, child: Text(t))),
                    ],
                    onChanged: (v) => setState(() => selectedUserType = v == '' ? null : v),
                  ),
                const SizedBox(width: 12),
                if (locations.isNotEmpty)
                  DropdownButton<String>(
                    value: selectedLocation,
                    hint: const Text('Ubicación'),
                    items: [
                      const DropdownMenuItem(value: null, child: Text('Todas')),
                      ...locations.map((l) => DropdownMenuItem(value: l, child: Text(l))),
                    ],
                    onChanged: (v) => setState(() => selectedLocation = v == '' ? null : v),
                  ),
                const SizedBox(width: 12),
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
              ],
            ),
            const SizedBox(height: 8),
            // Estadísticas rápidas, selector de tipo de gráfico y alerta de pico
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Card(
                    color: Theme.of(context).colorScheme.surface,
                    margin: const EdgeInsets.only(bottom: 8),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          Column(
                            children: [
                              Text('Total', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface)),
                              Text('$totalAccesos', style: TextStyle(color: Theme.of(context).colorScheme.onSurface)),
                            ],
                          ),
                          Column(
                            children: [
                              Text('Promedio', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface)),
                              Text(promedioAccesos.toStringAsFixed(1), style: TextStyle(color: Theme.of(context).colorScheme.onSurface)),
                            ],
                          ),
                          Column(
                            children: [
                              Text('Hora pico', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface)),
                              Text(horaPico?.label ?? '-', style: TextStyle(color: Theme.of(context).colorScheme.onSurface)),
                            ],
                          ),
                          Column(
                            children: [
                              Text('Top usuario', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface)),
                              Text(topUsuario, style: TextStyle(color: Theme.of(context).colorScheme.onSurface)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                if (hayPicoInusual)
                  Padding(
                    padding: const EdgeInsets.only(left: 8.0),
                    child: Tooltip(
                      message: '¡Pico inusual de accesos detectado!',
                      child: Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 32),
                    ),
                  ),
                const SizedBox(width: 12),
                DropdownButton<String>(
                  value: chartType,
                  items: const [
                    DropdownMenuItem(value: 'barras', child: Text('Barras')),
                    DropdownMenuItem(value: 'lineas', child: Text('Líneas')),
                    DropdownMenuItem(value: 'area', child: Text('Área')),
                  ],
                  onChanged: (v) => setState(() => chartType = v ?? 'barras'),
                  underline: Container(),
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                  dropdownColor: Theme.of(context).colorScheme.surface,
                ),
              ],
            ),
            Expanded(
              child: Row(
                children: [
                  // Gráfico
                  Expanded(
                    flex: 3,
                    child: RepaintBoundary(
                      key: chartKey,
                      child: FlowChartWidget(
                        data: filteredData,
                        onBarTap: _onBarTap,
                        chartType: chartType,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  // Calendario simple
                  Expanded(
                    flex: 2,
                    child: Card(
                      margin: const EdgeInsets.symmetric(vertical: 8),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Eventos del calendario', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            const SizedBox(height: 8),
                            Expanded(
                              child: ListView(
                                children: eventos.map((e) => ListTile(
                                  leading: const Icon(Icons.event, color: Colors.blueAccent),
                                  title: Text(e.title),
                                  subtitle: Text('${e.date.day}/${e.date.month}/${e.date.year} ${e.date.hour.toString().padLeft(2, '0')}:00'),
                                )).toList(),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
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
  final String? userType; // Tipo de usuario (opcional)
  final String? location; // Ubicación (opcional)

  FlowChartData({
    required this.label,
    required this.value,
    this.date,
    this.userType,
    this.location,
  });
}
