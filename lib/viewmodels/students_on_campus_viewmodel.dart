import 'dart:async';
import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

/// Modelo para representar un estudiante en campus
class EstudianteEnCampus {
  final String dni;
  final String estudianteId;
  final String nombre;
  final String facultad;
  final String escuela;
  final DateTime horaEntrada;
  final String puntoEntrada;
  final String? guardiaEntrada;
  final int tiempoEnCampusMinutos;
  final String tiempoEnCampusFormateado;

  EstudianteEnCampus({
    required this.dni,
    required this.estudianteId,
    required this.nombre,
    required this.facultad,
    required this.escuela,
    required this.horaEntrada,
    required this.puntoEntrada,
    this.guardiaEntrada,
    required this.tiempoEnCampusMinutos,
    required this.tiempoEnCampusFormateado,
  });

  factory EstudianteEnCampus.fromJson(Map<String, dynamic> json) {
    // Manejar parsing de fecha flexible
    DateTime parseHoraEntrada(dynamic fecha) {
      if (fecha == null) return DateTime.now();
      if (fecha is DateTime) return fecha;
      if (fecha is String) {
        try {
          return DateTime.parse(fecha);
        } catch (e) {
          debugPrint('Error parsing fecha: $fecha');
          return DateTime.now();
        }
      }
      return DateTime.now();
    }

    return EstudianteEnCampus(
      dni: json['dni'] ?? '',
      estudianteId: json['estudiante_id'] ?? '',
      nombre: json['nombre'] ?? '',
      facultad: json['facultad'] ?? 'N/A',
      escuela: json['escuela'] ?? 'N/A',
      horaEntrada: parseHoraEntrada(json['hora_entrada']),
      puntoEntrada: json['punto_entrada'] ?? 'N/A',
      guardiaEntrada: json['guardia_entrada'],
      tiempoEnCampusMinutos: json['tiempo_en_campus_minutos'] ?? 0,
      tiempoEnCampusFormateado: json['tiempo_en_campus_formateado'] ?? '0h 0m',
    );
  }
}

/// Estadísticas del día
class EstadisticasHoy {
  final int totalAsistencias;
  final int entradas;
  final int salidas;
  final String fecha;

  EstadisticasHoy({
    required this.totalAsistencias,
    required this.entradas,
    required this.salidas,
    required this.fecha,
  });

  factory EstadisticasHoy.fromJson(Map<String, dynamic> json) {
    return EstadisticasHoy(
      totalAsistencias: json['total_asistencias'] ?? 0,
      entradas: json['entradas'] ?? 0,
      salidas: json['salidas'] ?? 0,
      fecha: json['fecha'] ?? '',
    );
  }
}

/// ViewModel para estudiantes en campus
class StudentsOnCampusViewModel extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<EstudianteEnCampus> _estudiantes = [];
  Map<String, int> _estudiantesPorFacultad = {};
  int _totalEstudiantes = 0;
  EstadisticasHoy? _estadisticasHoy;
  DateTime? _ultimaActualizacion;
  bool _isLoading = false;
  String? _errorMessage;
  Timer? _updateTimer;

  // Getters
  List<EstudianteEnCampus> get estudiantes => _estudiantes;
  Map<String, int> get estudiantesPorFacultad => _estudiantesPorFacultad;
  int get totalEstudiantes => _totalEstudiantes;
  EstadisticasHoy? get estadisticasHoy => _estadisticasHoy;
  DateTime? get ultimaActualizacion => _ultimaActualizacion;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  /// Cargar estudiantes en campus
  Future<void> cargarEstudiantesEnCampus() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final data = await _apiService.obtenerEstudiantesEnCampus();

      if (data['success'] == true) {
        _totalEstudiantes = data['total_estudiantes_en_campus'] ?? 0;

        // Procesar lista de estudiantes
        if (data['estudiantes'] != null) {
          _estudiantes = (data['estudiantes'] as List)
              .map((json) => EstudianteEnCampus.fromJson(json))
              .toList();
        } else {
          _estudiantes = [];
        }

        // Procesar distribución por facultad
        _estudiantesPorFacultad = Map<String, int>.from(
          data['por_facultad'] ?? {},
        );

        // Procesar estadísticas del día
        if (data['estadisticas_hoy'] != null) {
          _estadisticasHoy = EstadisticasHoy.fromJson(data['estadisticas_hoy']);
        }

        _ultimaActualizacion = DateTime.now();
        _errorMessage = null;
      } else {
        _errorMessage = 'Error al obtener datos del servidor';
      }
    } catch (e) {
      _errorMessage = 'Error de conexión: $e';
      debugPrint('Error cargando estudiantes en campus: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Iniciar actualización automática
  void iniciarActualizacionAutomatica({Duration intervalo = const Duration(seconds: 10)}) {
    // Detener timer existente si hay uno
    detenerActualizacionAutomatica();

    // Cargar datos inmediatamente
    cargarEstudiantesEnCampus();

    // Configurar timer para actualizaciones periódicas
    _updateTimer = Timer.periodic(intervalo, (_) {
      cargarEstudiantesEnCampus();
    });
  }

  /// Detener actualización automática
  void detenerActualizacionAutomatica() {
    _updateTimer?.cancel();
    _updateTimer = null;
  }

  /// Refrescar manualmente
  Future<void> refrescar() async {
    await cargarEstudiantesEnCampus();
  }

  /// Filtrar estudiantes por facultad
  List<EstudianteEnCampus> filtrarPorFacultad(String facultad) {
    if (facultad.isEmpty) return _estudiantes;
    return _estudiantes.where((e) => e.facultad == facultad).toList();
  }

  /// Buscar estudiantes por nombre o DNI
  List<EstudianteEnCampus> buscarEstudiantes(String query) {
    if (query.isEmpty) return _estudiantes;
    final queryLower = query.toLowerCase();
    return _estudiantes.where((e) {
      return e.nombre.toLowerCase().contains(queryLower) ||
          e.dni.contains(query);
    }).toList();
  }

  @override
  void dispose() {
    detenerActualizacionAutomatica();
    super.dispose();
  }
}
