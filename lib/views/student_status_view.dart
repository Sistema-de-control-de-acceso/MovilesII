import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../viewmodels/student_status_viewmodel.dart';
import '../widgets/status_widgets.dart';
import '../widgets/student_basic_info_widget.dart';
import 'student_status_detail_view.dart';
import 'student_search_view.dart';

class StudentStatusView extends StatefulWidget {
  @override
  _StudentStatusViewState createState() => _StudentStatusViewState();
}

class _StudentStatusViewState extends State<StudentStatusView>
    with TickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadInitialData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    final studentStatusViewModel = Provider.of<StudentStatusViewModel>(
      context,
      listen: false,
    );
    await studentStatusViewModel.loadRecentStudents();
    await studentStatusViewModel.loadStudentsWithAlerts();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Consultar Estado Estudiante'),
        backgroundColor: Colors.blue[700],
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: 'Búsqueda', icon: Icon(Icons.search)),
            Tab(text: 'Recientes', icon: Icon(Icons.history)),
            Tab(text: 'Alertas', icon: Icon(Icons.warning)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildSearchTab(),
          _buildRecentTab(),
          _buildAlertsTab(),
        ],
      ),
    );
  }

  Widget _buildSearchTab() {
    return Consumer<StudentStatusViewModel>(
      builder: (context, studentStatusViewModel, child) {
        return Column(
          children: [
            // Barra de búsqueda
            Container(
              padding: EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      decoration: InputDecoration(
                        hintText: 'Buscar por nombre, código o DNI...',
                        prefixIcon: Icon(Icons.search),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        filled: true,
                        fillColor: Colors.grey[100],
                      ),
                      onChanged: (value) {
                        if (value.length >= 2) {
                          studentStatusViewModel.searchStudents(value);
                        } else if (value.isEmpty) {
                          studentStatusViewModel.clearSearchResults();
                        }
                      },
                    ),
                  ),
                  SizedBox(width: 12),
                  IconButton(
                    onPressed: () {
                      if (_searchController.text.isNotEmpty) {
                        studentStatusViewModel.searchStudents(_searchController.text);
                      }
                    },
                    icon: Icon(Icons.search),
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.blue[700],
                      foregroundColor: Colors.white,
                    ),
                  ),
                ],
              ),
            ),

            // Resultados de búsqueda
            Expanded(
              child: _buildSearchResults(studentStatusViewModel),
            ),
          ],
        );
      },
    );
  }

  Widget _buildSearchResults(StudentStatusViewModel studentStatusViewModel) {
    if (studentStatusViewModel.isLoading) {
      return LoadingWidget(message: 'Buscando estudiantes...');
    }

    if (studentStatusViewModel.errorMessage != null) {
      return Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
          SizedBox(height: 16),
          Text(studentStatusViewModel.errorMessage!, textAlign: TextAlign.center),
          SizedBox(height: 16),
          ElevatedButton(
            onPressed: () {
              if (_searchController.text.isNotEmpty) {
                studentStatusViewModel.searchStudents(_searchController.text);
              }
            },
            child: Text('Reintentar'),
          ),
        ],
      );
    }

    if (studentStatusViewModel.searchResults.isEmpty) {
      return Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off, size: 64, color: Colors.grey[400]),
          SizedBox(height: 16),
          Text(
            studentStatusViewModel.lastSearchQuery.isEmpty
                ? 'Ingresa un nombre, código o DNI para buscar'
                : 'No se encontraron estudiantes',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey[600]),
          ),
        ],
      );
    }

    return ListView.builder(
      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: studentStatusViewModel.searchResults.length,
      itemBuilder: (context, index) {
        final estudiante = studentStatusViewModel.searchResults[index];
        return Padding(
          padding: EdgeInsets.only(bottom: 12),
          child: StudentBasicInfoCompactWidget(
            estudiante: estudiante,
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => StudentStatusDetailView(
                    codigoUniversitario: estudiante.codigoUniversitario,
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildRecentTab() {
    return Consumer<StudentStatusViewModel>(
      builder: (context, studentStatusViewModel, child) {
        if (studentStatusViewModel.isLoading) {
          return LoadingWidget(message: 'Cargando estudiantes recientes...');
        }

        if (studentStatusViewModel.recentStudents.isEmpty) {
          return Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.history, size: 64, color: Colors.grey[400]),
              SizedBox(height: 16),
              Text(
                'No hay estudiantes recientes',
                style: TextStyle(color: Colors.grey[600]),
              ),
            ],
          );
        }

        return ListView.builder(
          padding: EdgeInsets.all(16),
          itemCount: studentStatusViewModel.recentStudents.length,
          itemBuilder: (context, index) {
            final estudiante = studentStatusViewModel.recentStudents[index];
            return Padding(
              padding: EdgeInsets.only(bottom: 12),
              child: StudentBasicInfoCompactWidget(
                estudiante: estudiante,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => StudentStatusDetailView(
                        codigoUniversitario: estudiante.codigoUniversitario,
                      ),
                    ),
                  );
                },
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildAlertsTab() {
    return Consumer<StudentStatusViewModel>(
      builder: (context, studentStatusViewModel, child) {
        if (studentStatusViewModel.isLoading) {
          return LoadingWidget(message: 'Cargando estudiantes con alertas...');
        }

        if (studentStatusViewModel.studentsWithAlerts.isEmpty) {
          return Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.check_circle, size: 64, color: Colors.green[400]),
              SizedBox(height: 16),
              Text(
                'No hay estudiantes con alertas',
                style: TextStyle(color: Colors.grey[600]),
              ),
            ],
          );
        }

        return ListView.builder(
          padding: EdgeInsets.all(16),
          itemCount: studentStatusViewModel.studentsWithAlerts.length,
          itemBuilder: (context, index) {
            final estudiante = studentStatusViewModel.studentsWithAlerts[index];
            return Padding(
              padding: EdgeInsets.only(bottom: 12),
              child: StudentBasicInfoCompactWidget(
                estudiante: estudiante,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => StudentStatusDetailView(
                        codigoUniversitario: estudiante.codigoUniversitario,
                      ),
                    ),
                  );
                },
              ),
            );
          },
        );
      },
    );
  }
}
