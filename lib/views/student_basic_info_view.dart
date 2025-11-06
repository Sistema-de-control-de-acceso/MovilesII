import 'package:flutter/material.dart';
import '../widgets/student_basic_info_widget.dart';
import '../models/alumno_model.dart';
import '../services/api_service.dart';
import '../widgets/status_widgets.dart';

/// Vista para mostrar datos básicos del estudiante
/// Usada por guardias para confirmar identidad visualmente
class StudentBasicInfoView extends StatefulWidget {
  final String codigoUniversitario;

  const StudentBasicInfoView({
    Key? key,
    required this.codigoUniversitario,
  }) : super(key: key);

  @override
  _StudentBasicInfoViewState createState() => _StudentBasicInfoViewState();
}

class _StudentBasicInfoViewState extends State<StudentBasicInfoView> {
  final ApiService _apiService = ApiService();
  AlumnoModel? _estudiante;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadStudentInfo();
  }

  Future<void> _loadStudentInfo() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final estudiante = await _apiService.getAlumnoByCodigo(widget.codigoUniversitario);
      setState(() {
        _estudiante = estudiante;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Información del Estudiante'),
        backgroundColor: Colors.blue[700],
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: _loadStudentInfo,
            tooltip: 'Actualizar',
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return LoadingWidget(message: 'Cargando información del estudiante...');
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline,
                size: 64,
                color: Colors.red[300],
              ),
              SizedBox(height: 16),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[700],
                ),
              ),
              SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _loadStudentInfo,
                icon: Icon(Icons.refresh),
                label: Text('Reintentar'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue[700],
                  foregroundColor: Colors.white,
                  padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_estudiante == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.person_off,
              size: 64,
              color: Colors.grey[400],
            ),
            SizedBox(height: 16),
            Text(
              'No se encontró información del estudiante',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: EdgeInsets.all(16),
      child: Column(
        children: [
          // Widget principal de información básica
          StudentBasicInfoWidget(
            estudiante: _estudiante!,
            showStatusBadge: true,
          ),
          SizedBox(height: 24),
          // Información adicional
          _buildAdditionalInfo(),
        ],
      ),
    );
  }

  Widget _buildAdditionalInfo() {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Información Adicional',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey[800],
            ),
          ),
          SizedBox(height: 16),
          _buildInfoRow(
            icon: Icons.credit_card,
            label: 'DNI',
            value: _estudiante!.dni,
          ),
          SizedBox(height: 12),
          _buildInfoRow(
            icon: Icons.badge,
            label: 'Código Universitario',
            value: _estudiante!.codigoUniversitario,
            highlight: true,
          ),
          SizedBox(height: 12),
          _buildInfoRow(
            icon: Icons.school,
            label: 'Facultad',
            value: '${_estudiante!.facultad} (${_estudiante!.siglasFacultad})',
          ),
          SizedBox(height: 12),
          _buildInfoRow(
            icon: Icons.workspace_premium,
            label: 'Escuela Profesional',
            value: '${_estudiante!.escuelaProfesional} (${_estudiante!.siglasEscuela})',
          ),
          SizedBox(height: 12),
          _buildInfoRow(
            icon: Icons.info,
            label: 'Estado',
            value: _estudiante!.isActive ? 'Activo' : 'Inactivo',
            valueColor: _estudiante!.isActive ? Colors.green[700] : Colors.red[700],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
    bool highlight = false,
    Color? valueColor,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(
          icon,
          size: 20,
          color: Colors.grey[600],
        ),
        SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
              SizedBox(height: 4),
              Container(
                padding: highlight
                    ? EdgeInsets.symmetric(horizontal: 12, vertical: 8)
                    : null,
                decoration: highlight
                    ? BoxDecoration(
                        color: Colors.blue[50],
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: Colors.blue[300]!,
                          width: 2,
                        ),
                      )
                    : null,
                child: Text(
                  value,
                  style: TextStyle(
                    fontSize: highlight ? 16 : 14,
                    fontWeight: highlight ? FontWeight.bold : FontWeight.normal,
                    color: valueColor ?? (highlight ? Colors.blue[900] : Colors.grey[800]),
                    letterSpacing: highlight ? 0.5 : 0,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

