import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

/// Modelo para filtros de reportes
class ReportFilters {
  DateTime? fechaInicio;
  DateTime? fechaFin;
  String? carreraSeleccionada; // Siglas de escuela
  String? facultadSeleccionada; // Siglas de facultad
  bool aplicarFiltros;

  ReportFilters({
    this.fechaInicio,
    this.fechaFin,
    this.carreraSeleccionada,
    this.facultadSeleccionada,
    this.aplicarFiltros = false,
  });

  ReportFilters copyWith({
    DateTime? fechaInicio,
    DateTime? fechaFin,
    String? carreraSeleccionada,
    String? facultadSeleccionada,
    bool? aplicarFiltros,
  }) {
    return ReportFilters(
      fechaInicio: fechaInicio ?? this.fechaInicio,
      fechaFin: fechaFin ?? this.fechaFin,
      carreraSeleccionada: carreraSeleccionada ?? this.carreraSeleccionada,
      facultadSeleccionada: facultadSeleccionada ?? this.facultadSeleccionada,
      aplicarFiltros: aplicarFiltros ?? this.aplicarFiltros,
    );
  }

  void reset() {
    fechaInicio = null;
    fechaFin = null;
    carreraSeleccionada = null;
    facultadSeleccionada = null;
    aplicarFiltros = false;
  }

  bool get tieneFiltrosActivos =>
      fechaInicio != null ||
      fechaFin != null ||
      carreraSeleccionada != null ||
      facultadSeleccionada != null;
}

/// Widget reutilizable para filtros de reportes
class ReportFiltersWidget extends StatefulWidget {
  final ReportFilters filters;
  final List<String> carreras; // Lista de siglas de escuelas
  final List<String> facultades; // Lista de siglas de facultades
  final Function(ReportFilters) onFiltersChanged;
  final bool mostrarFacultades;

  const ReportFiltersWidget({
    Key? key,
    required this.filters,
    required this.carreras,
    required this.facultades,
    required this.onFiltersChanged,
    this.mostrarFacultades = true,
  }) : super(key: key);

  @override
  _ReportFiltersWidgetState createState() => _ReportFiltersWidgetState();
}

class _ReportFiltersWidgetState extends State<ReportFiltersWidget> {
  late ReportFilters _currentFilters;

  @override
  void initState() {
    super.initState();
    _currentFilters = widget.filters.copyWith();
  }

  @override
  void didUpdateWidget(ReportFiltersWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.filters != widget.filters) {
      _currentFilters = widget.filters.copyWith();
    }
  }

  Future<void> _selectDateRange() async {
    final DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(Duration(days: 365)),
      initialDateRange: _currentFilters.fechaInicio != null &&
              _currentFilters.fechaFin != null
          ? DateTimeRange(
              start: _currentFilters.fechaInicio!,
              end: _currentFilters.fechaFin!,
            )
          : null,
      locale: const Locale('es', 'ES'),
      helpText: 'Seleccionar rango de fechas',
      cancelText: 'Cancelar',
      confirmText: 'Seleccionar',
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: Theme.of(context).primaryColor,
              onPrimary: Colors.white,
              onSurface: Colors.black87,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _currentFilters = _currentFilters.copyWith(
          fechaInicio: picked.start,
          fechaFin: picked.end,
        );
      });
      widget.onFiltersChanged(_currentFilters);
    }
  }

  void _clearFilters() {
    setState(() {
      _currentFilters.reset();
    });
    widget.onFiltersChanged(_currentFilters);
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      margin: EdgeInsets.all(16),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(Icons.filter_list, color: Theme.of(context).primaryColor),
                    SizedBox(width: 8),
                    Text(
                      'Filtros de Búsqueda',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey[800],
                      ),
                    ),
                  ],
                ),
                if (_currentFilters.tieneFiltrosActivos)
                  TextButton.icon(
                    onPressed: _clearFilters,
                    icon: Icon(Icons.clear, size: 18),
                    label: Text('Limpiar'),
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.red,
                    ),
                  ),
              ],
            ),
            SizedBox(height: 16),

            // Filtro de rango de fechas
            _buildDateRangeFilter(),
            SizedBox(height: 16),

            // Filtro de facultad (si está habilitado)
            if (widget.mostrarFacultades) ...[
              _buildFacultadFilter(),
              SizedBox(height: 16),
            ],

            // Filtro de carrera
            _buildCarreraFilter(),
            SizedBox(height: 16),

            // Indicador de filtros activos
            if (_currentFilters.tieneFiltrosActivos)
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue[200]!),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, color: Colors.blue[700], size: 20),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _getActiveFiltersSummary(),
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.blue[900],
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

  Widget _buildDateRangeFilter() {
    final dateFormat = DateFormat('dd/MM/yyyy');
    final fechaInicioStr = _currentFilters.fechaInicio != null
        ? dateFormat.format(_currentFilters.fechaInicio!)
        : 'Fecha inicio';
    final fechaFinStr = _currentFilters.fechaFin != null
        ? dateFormat.format(_currentFilters.fechaFin!)
        : 'Fecha fin';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Rango de Fechas',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Colors.grey[700],
          ),
        ),
        SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: InkWell(
                onTap: _selectDateRange,
                child: Container(
                  padding: EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey[300]!),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.calendar_today, size: 20, color: Colors.grey[600]),
                      SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              fechaInicioStr,
                              style: TextStyle(
                                fontSize: 14,
                                color: _currentFilters.fechaInicio != null
                                    ? Colors.black87
                                    : Colors.grey[600],
                              ),
                            ),
                            Text(
                              'hasta',
                              style: TextStyle(
                                fontSize: 10,
                                color: Colors.grey[500],
                              ),
                            ),
                            Text(
                              fechaFinStr,
                              style: TextStyle(
                                fontSize: 14,
                                color: _currentFilters.fechaFin != null
                                    ? Colors.black87
                                    : Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ),
                      Icon(Icons.arrow_drop_down, color: Colors.grey[600]),
                    ],
                  ),
                ),
              ),
            ),
            if (_currentFilters.fechaInicio != null ||
                _currentFilters.fechaFin != null)
              IconButton(
                icon: Icon(Icons.close, color: Colors.red),
                onPressed: () {
                  setState(() {
                    _currentFilters = _currentFilters.copyWith(
                      fechaInicio: null,
                      fechaFin: null,
                    );
                  });
                  widget.onFiltersChanged(_currentFilters);
                },
                tooltip: 'Limpiar fechas',
              ),
          ],
        ),
      ],
    );
  }

  Widget _buildFacultadFilter() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Facultad',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Colors.grey[700],
          ),
        ),
        SizedBox(height: 8),
        Container(
          padding: EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey[300]!),
            borderRadius: BorderRadius.circular(8),
          ),
          child: DropdownButton<String>(
            value: _currentFilters.facultadSeleccionada,
            hint: Text('Seleccionar facultad'),
            isExpanded: true,
            underline: SizedBox(),
            icon: Icon(Icons.arrow_drop_down),
            items: [
              DropdownMenuItem<String>(
                value: null,
                child: Text('Todas las facultades', style: TextStyle(color: Colors.grey[600])),
              ),
              ...widget.facultades.map((facultad) {
                return DropdownMenuItem<String>(
                  value: facultad,
                  child: Text(facultad),
                );
              }),
            ],
            onChanged: (value) {
              setState(() {
                _currentFilters = _currentFilters.copyWith(
                  facultadSeleccionada: value,
                );
              });
              widget.onFiltersChanged(_currentFilters);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildCarreraFilter() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Carrera/Escuela',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Colors.grey[700],
          ),
        ),
        SizedBox(height: 8),
        Container(
          padding: EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey[300]!),
            borderRadius: BorderRadius.circular(8),
          ),
          child: DropdownButton<String>(
            value: _currentFilters.carreraSeleccionada,
            hint: Text('Seleccionar carrera'),
            isExpanded: true,
            underline: SizedBox(),
            icon: Icon(Icons.arrow_drop_down),
            items: [
              DropdownMenuItem<String>(
                value: null,
                child: Text('Todas las carreras', style: TextStyle(color: Colors.grey[600])),
              ),
              ...widget.carreras.map((carrera) {
                return DropdownMenuItem<String>(
                  value: carrera,
                  child: Text(carrera),
                );
              }),
            ],
            onChanged: (value) {
              setState(() {
                _currentFilters = _currentFilters.copyWith(
                  carreraSeleccionada: value,
                );
              });
              widget.onFiltersChanged(_currentFilters);
            },
          ),
        ),
      ],
    );
  }

  String _getActiveFiltersSummary() {
    List<String> filters = [];
    if (_currentFilters.fechaInicio != null && _currentFilters.fechaFin != null) {
      final dateFormat = DateFormat('dd/MM/yyyy');
      filters.add(
        'Fechas: ${dateFormat.format(_currentFilters.fechaInicio!)} - ${dateFormat.format(_currentFilters.fechaFin!)}',
      );
    }
    if (_currentFilters.facultadSeleccionada != null) {
      filters.add('Facultad: ${_currentFilters.facultadSeleccionada}');
    }
    if (_currentFilters.carreraSeleccionada != null) {
      filters.add('Carrera: ${_currentFilters.carreraSeleccionada}');
    }
    return 'Filtros activos: ${filters.join(', ')}';
  }
}

