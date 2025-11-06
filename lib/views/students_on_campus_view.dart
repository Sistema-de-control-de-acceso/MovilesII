import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../viewmodels/students_on_campus_viewmodel.dart';
import '../widgets/status_widgets.dart';
import '../widgets/student_basic_info_widget.dart';
import '../models/alumno_model.dart';

class StudentsOnCampusView extends StatefulWidget {
  @override
  _StudentsOnCampusViewState createState() => _StudentsOnCampusViewState();
}

class _StudentsOnCampusViewState extends State<StudentsOnCampusView> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedFacultad = '';
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => StudentsOnCampusViewModel()
        ..iniciarActualizacionAutomatica(),
      child: Consumer<StudentsOnCampusViewModel>(
        builder: (context, viewModel, _) {
          return Scaffold(
            appBar: AppBar(
              title: Text('Estudiantes en Campus'),
              backgroundColor: Colors.blue[700],
              foregroundColor: Colors.white,
              actions: [
                IconButton(
                  icon: Icon(Icons.refresh),
                  onPressed: () => viewModel.refrescar(),
                  tooltip: 'Actualizar',
                ),
              ],
            ),
            body: _buildBody(context, viewModel),
          );
        },
      ),
    );
  }

  Widget _buildBody(BuildContext context, StudentsOnCampusViewModel viewModel) {
    if (viewModel.isLoading && viewModel.estudiantes.isEmpty) {
      return LoadingWidget(message: 'Cargando estudiantes en campus...');
    }

    if (viewModel.errorMessage != null && viewModel.estudiantes.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
            SizedBox(height: 16),
            Text(
              'Error',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 32),
              child: Text(
                viewModel.errorMessage!,
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey[600]),
              ),
            ),
            SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => viewModel.refrescar(),
              icon: Icon(Icons.refresh),
              label: Text('Reintentar'),
            ),
          ],
        ),
      );
    }

    // Obtener estudiantes filtrados
    var estudiantesFiltrados = viewModel.estudiantes;
    
    if (_selectedFacultad.isNotEmpty) {
      estudiantesFiltrados = viewModel.filtrarPorFacultad(_selectedFacultad);
    }
    
    if (_searchQuery.isNotEmpty) {
      estudiantesFiltrados = estudiantesFiltrados
          .where((e) =>
              e.nombre.toLowerCase().contains(_searchQuery.toLowerCase()) ||
              e.dni.contains(_searchQuery))
          .toList();
    }

    return RefreshIndicator(
      onRefresh: () => viewModel.refrescar(),
      child: CustomScrollView(
        slivers: [
          // Contador total y estadísticas
          SliverToBoxAdapter(
            child: _buildHeaderCards(viewModel),
          ),

          // Distribución por facultad
          if (viewModel.estudiantesPorFacultad.isNotEmpty)
            SliverToBoxAdapter(
              child: _buildFacultadesSection(viewModel),
            ),

          // Barra de búsqueda y filtros
          SliverToBoxAdapter(
            child: _buildSearchAndFilters(viewModel),
          ),

          // Lista de estudiantes
          if (estudiantesFiltrados.isEmpty)
            SliverFillRemaining(
              child: _buildEmptyState(),
            )
          else
            SliverPadding(
              padding: EdgeInsets.all(8),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final estudiante = estudiantesFiltrados[index];
                    return _buildStudentCard(estudiante);
                  },
                  childCount: estudiantesFiltrados.length,
                ),
              ),
            ),

          // Indicador de última actualización
          SliverToBoxAdapter(
            child: _buildLastUpdateIndicator(viewModel),
          ),
        ],
      ),
    );
  }

  Widget _buildHeaderCards(StudentsOnCampusViewModel viewModel) {
    return Container(
      padding: EdgeInsets.all(16),
      child: Column(
        children: [
          // Contador principal
          Card(
            elevation: 4,
            color: Colors.blue[700],
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Column(
                children: [
                  Icon(
                    Icons.people,
                    size: 48,
                    color: Colors.white,
                  ),
                  SizedBox(height: 12),
                  Text(
                    '${viewModel.totalEstudiantes}',
                    style: TextStyle(
                      fontSize: 48,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    'Estudiantes en Campus',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
            ),
          ),

          SizedBox(height: 12),

          // Estadísticas del día
          if (viewModel.estadisticasHoy != null)
            Row(
              children: [
                Expanded(
                  child: _buildStatCard(
                    'Entradas Hoy',
                    '${viewModel.estadisticasHoy!.entradas}',
                    Icons.login,
                    Colors.green,
                  ),
                ),
                SizedBox(width: 8),
                Expanded(
                  child: _buildStatCard(
                    'Salidas Hoy',
                    '${viewModel.estadisticasHoy!.salidas}',
                    Icons.logout,
                    Colors.red,
                  ),
                ),
                SizedBox(width: 8),
                Expanded(
                  child: _buildStatCard(
                    'Total Hoy',
                    '${viewModel.estadisticasHoy!.totalAsistencias}',
                    Icons.today,
                    Colors.blue,
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(12),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            SizedBox(height: 4),
            Text(
              title,
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFacultadesSection(StudentsOnCampusViewModel viewModel) {
    return Card(
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Distribución por Facultad',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                // Botón "Todas"
                FilterChip(
                  label: Text('Todas (${viewModel.totalEstudiantes})'),
                  selected: _selectedFacultad.isEmpty,
                  onSelected: (selected) {
                    setState(() {
                      _selectedFacultad = '';
                    });
                  },
                ),
                // Chips por facultad
                ...viewModel.estudiantesPorFacultad.entries.map((entry) {
                  return FilterChip(
                    label: Text('${entry.key} (${entry.value})'),
                    selected: _selectedFacultad == entry.key,
                    onSelected: (selected) {
                      setState(() {
                        _selectedFacultad = selected ? entry.key : '';
                      });
                    },
                  );
                }),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchAndFilters(StudentsOnCampusViewModel viewModel) {
    return Container(
      padding: EdgeInsets.all(16),
      child: Column(
        children: [
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Buscar por nombre o DNI...',
              prefixIcon: Icon(Icons.search),
              suffixIcon: _searchQuery.isNotEmpty
                  ? IconButton(
                      icon: Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
                        setState(() {
                          _searchQuery = '';
                        });
                      },
                    )
                  : null,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            onChanged: (value) {
              setState(() {
                _searchQuery = value;
              });
            },
          ),
        ],
      ),
    );
  }

  Widget _buildStudentCard(EstudianteEnCampus estudiante) {
    // Convertir EstudianteEnCampus a AlumnoModel para usar el widget
    final alumno = _convertEstudianteEnCampusToAlumno(estudiante);
    
    return Container(
      margin: EdgeInsets.only(bottom: 12),
      child: Column(
        children: [
          // Usar el widget compacto de información básica
          StudentBasicInfoCompactWidget(
            estudiante: alumno,
            onTap: null, // No hay acción al tocar en esta vista
          ),
          // Información adicional de presencia
          Container(
            margin: EdgeInsets.only(top: 8),
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.green[50],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.green[200]!),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.access_time, size: 16, color: Colors.grey[700]),
                    SizedBox(width: 8),
                    Text(
                      'Tiempo en campus: ${estudiante.tiempoEnCampusFormateado}',
                      style: TextStyle(
                        color: Colors.grey[700],
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.location_on, size: 16, color: Colors.grey[700]),
                    SizedBox(width: 8),
                    Text(
                      'Punto de entrada: ${estudiante.puntoEntrada}',
                      style: TextStyle(
                        color: Colors.grey[700],
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.schedule, size: 16, color: Colors.grey[700]),
                    SizedBox(width: 8),
                    Text(
                      'Desde: ${_formatDateTime(estudiante.horaEntrada)}',
                      style: TextStyle(
                        color: Colors.grey[700],
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.people_outline, size: 64, color: Colors.grey[400]),
          SizedBox(height: 16),
          Text(
            _searchQuery.isNotEmpty || _selectedFacultad.isNotEmpty
                ? 'No se encontraron estudiantes'
                : 'No hay estudiantes en campus',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey[600],
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 8),
          if (_searchQuery.isNotEmpty || _selectedFacultad.isNotEmpty)
            TextButton(
              onPressed: () {
                _searchController.clear();
                setState(() {
                  _searchQuery = '';
                  _selectedFacultad = '';
                });
              },
              child: Text('Limpiar filtros'),
            ),
        ],
      ),
    );
  }

  Widget _buildLastUpdateIndicator(StudentsOnCampusViewModel viewModel) {
    return Container(
      padding: EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (viewModel.isLoading)
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          else
            Icon(Icons.check_circle, size: 16, color: Colors.green),
          SizedBox(width: 8),
          Text(
            viewModel.ultimaActualizacion != null
                ? 'Actualizado: ${_formatTime(viewModel.ultimaActualizacion!)}'
                : 'Esperando actualización...',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  // Helper para convertir EstudianteEnCampus a AlumnoModel
  AlumnoModel _convertEstudianteEnCampusToAlumno(EstudianteEnCampus estudiante) {
    // Extraer nombre y apellido del nombre completo
    final partesNombre = estudiante.nombre.split(' ');
    final nombre = partesNombre.isNotEmpty ? partesNombre[0] : '';
    final apellido = partesNombre.length > 1 ? partesNombre.sublist(1).join(' ') : '';

    return AlumnoModel(
      id: estudiante.estudianteId,
      identificacion: estudiante.dni,
      nombre: nombre,
      apellido: apellido,
      dni: estudiante.dni,
      codigoUniversitario: estudiante.estudianteId, // Usar estudianteId como código
      escuelaProfesional: estudiante.escuela,
      facultad: estudiante.facultad,
      siglasEscuela: '', // No disponible en EstudianteEnCampus
      siglasFacultad: '', // No disponible en EstudianteEnCampus
      estado: true, // Si está en campus, está activo
    );
  }

  String _formatDateTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inMinutes < 60) {
      return 'Hace ${difference.inMinutes}m';
    } else if (difference.inHours < 24) {
      return 'Hace ${difference.inHours}h';
    } else {
      return '${dateTime.day}/${dateTime.month} ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
    }
  }

  String _formatTime(DateTime dateTime) {
    return '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}:${dateTime.second.toString().padLeft(2, '0')}';
  }
}
