import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../viewmodels/reports_viewmodel.dart';
import '../../widgets/status_widgets.dart';
import '../../widgets/report_filters_widget.dart';
import 'guard_reports_view.dart';

class ReportsView extends StatefulWidget {
  @override
  _ReportsViewState createState() => _ReportsViewState();
}

class _ReportsViewState extends State<ReportsView>
    with TickerProviderStateMixin {
  late TabController _tabController;
  final ReportFilters _filters = ReportFilters();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadReportsData();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadReportsData() async {
    final reportsViewModel = Provider.of<ReportsViewModel>(
      context,
      listen: false,
    );
    await reportsViewModel.loadAllData();
  }

  void _onFiltersChanged(ReportFilters filters) {
    final reportsViewModel = Provider.of<ReportsViewModel>(
      context,
      listen: false,
    );
    reportsViewModel.updateFilters(
      fechaInicio: filters.fechaInicio,
      fechaFin: filters.fechaFin,
      carrera: filters.carreraSeleccionada,
      facultad: filters.facultadSeleccionada,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ReportsViewModel>(
      builder: (context, reportsViewModel, child) {
        if (reportsViewModel.isLoading) {
          return LoadingWidget(message: 'Cargando reportes...');
        }

        if (reportsViewModel.errorMessage != null) {
          return Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
              SizedBox(height: 16),
              Text(reportsViewModel.errorMessage!, textAlign: TextAlign.center),
              SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loadReportsData,
                child: Text('Reintentar'),
              ),
            ],
          );
        }

        return Column(
          children: [
            // Header con resumen
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.1),
                    spreadRadius: 1,
                    blurRadius: 4,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Reportes y Análisis',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey[800],
                    ),
                  ),
                  SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildSummaryCard(
                          'Asistencias Hoy',
                          '${reportsViewModel.getTotalAsistenciasHoy()}',
                          Colors.blue,
                          Icons.today,
                        ),
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: _buildSummaryCard(
                          'Esta Semana',
                          '${reportsViewModel.getTotalAsistenciasEstaSemana()}',
                          Colors.green,
                          Icons.date_range,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Tabs
            TabBar(
              controller: _tabController,
              isScrollable: true,
              tabs: [
                Tab(text: 'Estadísticas', icon: Icon(Icons.bar_chart)),
                Tab(text: 'Asistencias', icon: Icon(Icons.list)),
                Tab(text: 'Estudiantes', icon: Icon(Icons.school)),
                Tab(text: 'Guardias', icon: Icon(Icons.security)),
              ],
            ),

            // Tab content
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildStatisticsTab(reportsViewModel),
                  _buildAttendanceTab(reportsViewModel),
                  _buildStudentsTab(reportsViewModel),
                  GuardReportsView(),
                ],
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildFiltersSection(ReportsViewModel reportsViewModel) {
    return ReportFiltersWidget(
      filters: _filters,
      carreras: reportsViewModel.listaCarreras,
      facultades: reportsViewModel.listaFacultades,
      onFiltersChanged: _onFiltersChanged,
      mostrarFacultades: true,
    );
  }

  Widget _buildSummaryCard(
    String title,
    String value,
    Color color,
    IconData icon,
  ) {
    return Container(
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
                Text(
                  title,
                  style: TextStyle(fontSize: 12, color: Colors.grey[700]),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatisticsTab(ReportsViewModel reportsViewModel) {
    return RefreshIndicator(
      onRefresh: _loadReportsData,
      child: SingleChildScrollView(
        padding: EdgeInsets.all(0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Filtros
            _buildFiltersSection(reportsViewModel),
            SizedBox(height: 8),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Top facultades
                  _buildTopFacultades(reportsViewModel),
            SizedBox(height: 24),

                  // Distribución por hora (simplificada)
                  _buildHourDistribution(reportsViewModel),
                  SizedBox(height: 24),

                  // Resumen general
                  _buildGeneralSummary(reportsViewModel),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopFacultades(ReportsViewModel reportsViewModel) {
    final asistenciasFiltradas = reportsViewModel.asistenciasFiltradas;
    final topFacultades = _getTopFacultadesFromList(asistenciasFiltradas);

    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Top Facultades por Asistencias',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 12),
            ...topFacultades
                .map(
                  (entry) => Padding(
                    padding: EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(child: Text(entry.key)),
                        Container(
                          padding: EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.blue[100],
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            '${entry.value}',
                            style: TextStyle(
                              color: Colors.blue[700],
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
                .toList(),
          ],
        ),
      ),
    );
  }

  Widget _buildHourDistribution(ReportsViewModel reportsViewModel) {
    final asistenciasFiltradas = reportsViewModel.asistenciasFiltradas;
    final asistenciasPorHora = _getAsistenciasPorHoraFromList(asistenciasFiltradas);

    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Distribución por Horas del Día',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 12),
            Container(
              height: 200,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: 24,
                itemBuilder: (context, index) {
                  final hora = index;
                  final asistencias = asistenciasPorHora[hora] ?? 0;
                  final maxAsistencias =
                      asistenciasPorHora.values.isNotEmpty
                          ? asistenciasPorHora.values.reduce(
                            (a, b) => a > b ? a : b,
                          )
                          : 1;
                  final altura =
                      asistencias == 0
                          ? 0.0
                          : (asistencias / maxAsistencias) * 150;

                  return Container(
                    width: 30,
                    margin: EdgeInsets.symmetric(horizontal: 2),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        if (asistencias > 0)
                          Text('$asistencias', style: TextStyle(fontSize: 10)),
                        Container(
                          width: 20,
                          height: altura,
                          decoration: BoxDecoration(
                            color: Colors.blue[400],
                            borderRadius: BorderRadius.vertical(
                              top: Radius.circular(4),
                            ),
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          '${hora.toString().padLeft(2, '0')}h',
                          style: TextStyle(fontSize: 10),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGeneralSummary(ReportsViewModel reportsViewModel) {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Resumen General',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 12),
            _buildSummaryRow(
              'Total Estudiantes',
              '${reportsViewModel.alumnos.length}',
            ),
            _buildSummaryRow(
              'Total Asistencias',
              '${reportsViewModel.asistencias.length}',
            ),
            _buildSummaryRow(
              'Total Facultades',
              '${reportsViewModel.facultades.length}',
            ),
            _buildSummaryRow(
              'Total Escuelas',
              '${reportsViewModel.escuelas.length}',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(value, style: TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildAttendanceTab(ReportsViewModel reportsViewModel) {
    final asistenciasFiltradas = reportsViewModel.asistenciasFiltradas;
    
    return Column(
      children: [
        // Filtros
        _buildFiltersSection(reportsViewModel),
        // Lista de asistencias
        Expanded(
          child: RefreshIndicator(
            onRefresh: _loadReportsData,
            child: asistenciasFiltradas.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.search_off, size: 64, color: Colors.grey[400]),
                        SizedBox(height: 16),
                        Text(
                          reportsViewModel.tieneFiltrosActivos
                              ? 'No hay resultados con los filtros aplicados'
                              : 'No hay asistencias registradas',
                          style: TextStyle(color: Colors.grey[600]),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: EdgeInsets.all(16),
                    itemCount: asistenciasFiltradas.length,
                    itemBuilder: (context, index) {
                      final asistencia = asistenciasFiltradas[index];
          return Card(
            margin: EdgeInsets.only(bottom: 8),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: Colors.green[100],
                child: Icon(Icons.check, color: Colors.green),
              ),
              title: Text(asistencia.nombreCompleto),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Código: ${asistencia.codigoUniversitario}'),
                  Text('Facultad: ${asistencia.siglasFacultad}'),
                  Text('Fecha: ${asistencia.fechaFormateada}'),
                ],
              ),
              trailing: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    asistencia.tipo.descripcion,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: asistencia.tipo == TipoMovimiento.entrada ? Colors.green : Colors.red,
                    ),
                  ),
                  Text(
                    asistencia.puerta,
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildStudentsTab(ReportsViewModel reportsViewModel) {
    final alumnosFiltrados = reportsViewModel.alumnosFiltrados;
    
    return Column(
      children: [
        // Filtros
        _buildFiltersSection(reportsViewModel),
        // Lista de estudiantes
        Expanded(
          child: RefreshIndicator(
            onRefresh: _loadReportsData,
            child: alumnosFiltrados.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.search_off, size: 64, color: Colors.grey[400]),
                        SizedBox(height: 16),
                        Text(
                          reportsViewModel.tieneFiltrosActivos
                              ? 'No hay estudiantes con los filtros aplicados'
                              : 'No hay estudiantes registrados',
                          style: TextStyle(color: Colors.grey[600]),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: EdgeInsets.all(16),
                    itemCount: alumnosFiltrados.length,
                    itemBuilder: (context, index) {
                      final alumno = alumnosFiltrados[index];
          return Card(
            margin: EdgeInsets.only(bottom: 8),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor:
                    alumno.isActive ? Colors.green[100] : Colors.red[100],
                child: Icon(
                  Icons.school,
                  color: alumno.isActive ? Colors.green : Colors.red,
                ),
              ),
              title: Text(alumno.nombreCompleto),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Código: ${alumno.codigoUniversitario}'),
                  Text('Facultad: ${alumno.siglasFacultad}'),
                  Text('Escuela: ${alumno.siglasEscuela}'),
                ],
              ),
              trailing: Container(
                padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: alumno.isActive ? Colors.green[100] : Colors.red[100],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  alumno.isActive ? 'Activo' : 'Inactivo',
                  style: TextStyle(
                    color:
                        alumno.isActive ? Colors.green[700] : Colors.red[700],
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
                      ),
                    );
                  },
                ),
          ),
        ),
      ],
    );
  }

  // Métodos auxiliares para estadísticas filtradas
  List<MapEntry<String, int>> _getTopFacultadesFromList(List asistencias, {int limit = 5}) {
    Map<String, int> asistenciasPorFacultad = {};

    for (var asistencia in asistencias) {
      final siglas = asistencia.siglasFacultad ?? 'N/A';
      asistenciasPorFacultad[siglas] = (asistenciasPorFacultad[siglas] ?? 0) + 1;
    }

    var sorted = asistenciasPorFacultad.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return sorted.take(limit).toList();
  }

  Map<int, int> _getAsistenciasPorHoraFromList(List asistencias) {
    Map<int, int> asistenciasPorHora = {};

    for (var asistencia in asistencias) {
      int hora = asistencia.fechaHora.hour;
      asistenciasPorHora[hora] = (asistenciasPorHora[hora] ?? 0) + 1;
    }

    return asistenciasPorHora;
  }
}
