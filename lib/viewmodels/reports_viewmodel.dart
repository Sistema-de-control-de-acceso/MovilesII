import 'package:flutter/foundation.dart';
import '../models/asistencia_model.dart';
import '../models/facultad_escuela_model.dart';
import '../models/alumno_model.dart';
import '../services/hybrid_api_service.dart';

class ReportsViewModel extends ChangeNotifier {
  final HybridApiService _apiService = HybridApiService();

  List<AsistenciaModel> _asistencias = [];
  List<FacultadModel> _facultades = [];
  List<EscuelaModel> _escuelas = [];
  List<AlumnoModel> _alumnos = [];

  bool _isLoading = false;
  String? _errorMessage;

  // Filtros activos
  DateTime? _fechaInicioFilter;
  DateTime? _fechaFinFilter;
  String? _carreraFilter;
  String? _facultadFilter;

  // Getters
  List<AsistenciaModel> get asistencias => _asistencias;
  List<FacultadModel> get facultades => _facultades;
  List<EscuelaModel> get escuelas => _escuelas;
  List<AlumnoModel> get alumnos => _alumnos;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // Getters para datos filtrados
  List<AsistenciaModel> get asistenciasFiltradas => _applyFilters(_asistencias);
  List<AlumnoModel> get alumnosFiltrados {
    if (_carreraFilter == null && _facultadFilter == null) {
      return _alumnos;
    }
    return _alumnos.where((alumno) {
      bool matches = true;
      if (_facultadFilter != null) {
        matches = matches && alumno.siglasFacultad == _facultadFilter;
      }
      if (_carreraFilter != null) {
        matches = matches && alumno.siglasEscuela == _carreraFilter;
      }
      return matches;
    }).toList();
  }

  // Lista de siglas de escuelas (carreras) para dropdown
  List<String> get listaCarreras {
    return _escuelas.map((e) => e.siglas ?? e.nombre ?? '').where((s) => s.isNotEmpty).toSet().toList()..sort();
  }

  // Lista de siglas de facultades para dropdown
  List<String> get listaFacultades {
    return _facultades.map((f) => f.siglas ?? f.nombre ?? '').where((s) => s.isNotEmpty).toSet().toList()..sort();
  }

  // Cargar todos los datos
  Future<void> loadAllData() async {
    _setLoading(true);
    _clearError();

    try {
      // Cargar datos en paralelo
      final futures = await Future.wait([
        _apiService.getAsistencias(),
        _apiService.getFacultades(),
        _apiService.getEscuelas(),
        _apiService.getAlumnos(),
      ]);

      _asistencias = futures[0] as List<AsistenciaModel>;
      _facultades = futures[1] as List<FacultadModel>;
      _escuelas = futures[2] as List<EscuelaModel>;
      _alumnos = futures[3] as List<AlumnoModel>;

      _setLoading(false);
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
    }
  }

  // Cargar solo asistencias
  Future<void> loadAsistencias() async {
    _setLoading(true);
    _clearError();

    try {
      _asistencias = await _apiService.getAsistencias();
      _setLoading(false);
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
    }
  }

  // Filtros y análisis

  // Asistencias por fecha
  List<AsistenciaModel> getAsistenciasByDate(DateTime date, {List<AsistenciaModel>? asistencias}) {
    final listaAsistencias = asistencias ?? _asistencias;
    return listaAsistencias.where((asistencia) {
      return asistencia.fechaHora.year == date.year &&
          asistencia.fechaHora.month == date.month &&
          asistencia.fechaHora.day == date.day;
    }).toList();
  }

  // Asistencias por rango de fechas
  List<AsistenciaModel> getAsistenciasByDateRange(
    DateTime start,
    DateTime end, {
    List<AsistenciaModel>? asistencias,
  }) {
    final listaAsistencias = asistencias ?? _asistencias;
    return listaAsistencias.where((asistencia) {
      return asistencia.fechaHora.isAfter(start) &&
          asistencia.fechaHora.isBefore(end.add(Duration(days: 1)));
    }).toList();
  }

  // Asistencias por facultad
  List<AsistenciaModel> getAsistenciasByFacultad(String siglasFacultad) {
    return _asistencias
        .where((asistencia) => asistencia.siglasFacultad == siglasFacultad)
        .toList();
  }

  // Asistencias por escuela
  List<AsistenciaModel> getAsistenciasByEscuela(String siglasEscuela) {
    return _asistencias
        .where((asistencia) => asistencia.siglasEscuela == siglasEscuela)
        .toList();
  }

  // ==================== FILTROS MÚLTIPLES ====================

  /// Aplicar filtros múltiples a las asistencias
  List<AsistenciaModel> _applyFilters(List<AsistenciaModel> asistencias) {
    List<AsistenciaModel> filtered = asistencias;

    // Filtro por rango de fechas
    if (_fechaInicioFilter != null || _fechaFinFilter != null) {
      final inicio = _fechaInicioFilter ?? DateTime(2000);
      final fin = _fechaFinFilter ?? DateTime.now().add(Duration(days: 365));
      
      filtered = filtered.where((asistencia) {
        final fecha = asistencia.fechaHora;
        return fecha.isAfter(inicio.subtract(Duration(days: 1))) &&
               fecha.isBefore(fin.add(Duration(days: 1)));
      }).toList();
    }

    // Filtro por facultad
    if (_facultadFilter != null) {
      filtered = filtered.where((asistencia) {
        return asistencia.siglasFacultad == _facultadFilter;
      }).toList();
    }

    // Filtro por carrera/escuela
    if (_carreraFilter != null) {
      filtered = filtered.where((asistencia) {
        return asistencia.siglasEscuela == _carreraFilter;
      }).toList();
    }

    return filtered;
  }

  /// Actualizar filtros
  void updateFilters({
    DateTime? fechaInicio,
    DateTime? fechaFin,
    String? carrera,
    String? facultad,
  }) {
    _fechaInicioFilter = fechaInicio;
    _fechaFinFilter = fechaFin;
    _carreraFilter = carrera;
    _facultadFilter = facultad;
    notifyListeners();
  }

  /// Limpiar todos los filtros
  void clearFilters() {
    _fechaInicioFilter = null;
    _fechaFinFilter = null;
    _carreraFilter = null;
    _facultadFilter = null;
    notifyListeners();
  }

  /// Verificar si hay filtros activos
  bool get tieneFiltrosActivos =>
      _fechaInicioFilter != null ||
      _fechaFinFilter != null ||
      _carreraFilter != null ||
      _facultadFilter != null;

  // Estadísticas

  // Total asistencias hoy
  int getTotalAsistenciasHoy() {
    final hoy = DateTime.now();
    final asistencias = _fechaInicioFilter != null || _fechaFinFilter != null
        ? asistenciasFiltradas
        : _asistencias;
    return getAsistenciasByDate(hoy, asistencias: asistencias).length;
  }

  // Total asistencias esta semana
  int getTotalAsistenciasEstaSemana() {
    final ahora = DateTime.now();
    final inicioSemana = ahora.subtract(Duration(days: ahora.weekday - 1));
    final asistencias = _fechaInicioFilter != null || _fechaFinFilter != null
        ? asistenciasFiltradas
        : _asistencias;
    return getAsistenciasByDateRange(inicioSemana, ahora, asistencias: asistencias).length;
  }

  // Asistencias por hora del día
  Map<int, int> getAsistenciasPorHora({List<AsistenciaModel>? asistencias}) {
    final listaAsistencias = asistencias ?? asistenciasFiltradas;
    Map<int, int> asistenciasPorHora = {};

    for (var asistencia in listaAsistencias) {
      int hora = asistencia.fechaHora.hour;
      asistenciasPorHora[hora] = (asistenciasPorHora[hora] ?? 0) + 1;
    }

    return asistenciasPorHora;
  }

  // Top facultades con más asistencias
  List<MapEntry<String, int>> getTopFacultades({int limit = 5, List<AsistenciaModel>? asistencias}) {
    final listaAsistencias = asistencias ?? asistenciasFiltradas;
    Map<String, int> asistenciasPorFacultad = {};

    for (var asistencia in listaAsistencias) {
      asistenciasPorFacultad[asistencia.siglasFacultad] =
          (asistenciasPorFacultad[asistencia.siglasFacultad] ?? 0) + 1;
    }

    var sorted =
        asistenciasPorFacultad.entries.toList()
          ..sort((a, b) => b.value.compareTo(a.value));

    return sorted.take(limit).toList();
  }

  // ==================== REPORTES DE GUARDIAS ====================

  // Obtener asistencias por guardia específico
  List<AsistenciaModel> getAsistenciasByGuardia(String guardiaId) {
    return _asistencias
        .where((asistencia) => asistencia.guardiaId == guardiaId)
        .toList();
  }

  // Obtener asistencias por guardia en un rango de fechas
  List<AsistenciaModel> getAsistenciasByGuardiaAndDateRange(
    String guardiaId,
    DateTime start,
    DateTime end,
  ) {
    return _asistencias.where((asistencia) {
      return asistencia.guardiaId == guardiaId &&
          asistencia.fechaHora.isAfter(start) &&
          asistencia.fechaHora.isBefore(end.add(Duration(days: 1)));
    }).toList();
  }

  // Obtener estadísticas de actividad por guardia
  Map<String, dynamic> getEstadisticasGuardia(String guardiaId) {
    final asistenciasGuardia = getAsistenciasByGuardia(guardiaId);
    
    if (asistenciasGuardia.isEmpty) {
      return {
        'totalAsistencias': 0,
        'entradas': 0,
        'salidas': 0,
        'autorizacionesManuales': 0,
        'puertaMasUsada': 'N/A',
        'facultadMasAtendida': 'N/A',
        'promedioDiario': 0.0,
      };
    }

    final entradas = asistenciasGuardia.where((a) => a.entradaTipo == 'entrada').length;
    final salidas = asistenciasGuardia.where((a) => a.entradaTipo == 'salida').length;
    final autorizacionesManuales = asistenciasGuardia.where((a) => a.autorizacionManual == true).length;

    // Puerta más usada
    Map<String, int> puertas = {};
    for (var asistencia in asistenciasGuardia) {
      puertas[asistencia.puerta] = (puertas[asistencia.puerta] ?? 0) + 1;
    }
    final puertaMasUsada = puertas.isNotEmpty 
        ? puertas.entries.reduce((a, b) => a.value > b.value ? a : b).key
        : 'N/A';

    // Facultad más atendida
    Map<String, int> facultades = {};
    for (var asistencia in asistenciasGuardia) {
      facultades[asistencia.siglasFacultad] = (facultades[asistencia.siglasFacultad] ?? 0) + 1;
    }
    final facultadMasAtendida = facultades.isNotEmpty
        ? facultades.entries.reduce((a, b) => a.value > b.value ? a : b).key
        : 'N/A';

    // Calcular promedio diario (últimos 30 días)
    final ahora = DateTime.now();
    final hace30Dias = ahora.subtract(Duration(days: 30));
    final asistencias30Dias = asistenciasGuardia.where((a) => 
        a.fechaHora.isAfter(hace30Dias)).length;
    final promedioDiario = asistencias30Dias / 30.0;

    return {
      'totalAsistencias': asistenciasGuardia.length,
      'entradas': entradas,
      'salidas': salidas,
      'autorizacionesManuales': autorizacionesManuales,
      'puertaMasUsada': puertaMasUsada,
      'facultadMasAtendida': facultadMasAtendida,
      'promedioDiario': promedioDiario,
    };
  }

  // Obtener ranking de guardias por actividad
  List<MapEntry<String, Map<String, dynamic>>> getRankingGuardias({int limit = 10}) {
    Map<String, List<AsistenciaModel>> asistenciasPorGuardia = {};

    for (var asistencia in _asistencias) {
      if (asistencia.guardiaId != null) {
        if (asistenciasPorGuardia[asistencia.guardiaId!] == null) {
          asistenciasPorGuardia[asistencia.guardiaId!] = [];
        }
        asistenciasPorGuardia[asistencia.guardiaId!]!.add(asistencia);
      }
    }

    List<MapEntry<String, Map<String, dynamic>>> ranking = [];

    asistenciasPorGuardia.forEach((guardiaId, asistencias) {
      final estadisticas = getEstadisticasGuardia(guardiaId);
      ranking.add(MapEntry(guardiaId, estadisticas));
    });

    ranking.sort((a, b) => b.value['totalAsistencias'].compareTo(a.value['totalAsistencias']));

    return ranking.take(limit).toList();
  }

  // Obtener actividad de guardias por día de la semana
  Map<int, int> getActividadGuardiasPorDiaSemana() {
    Map<int, int> actividadPorDia = {};

    for (var asistencia in _asistencias) {
      if (asistencia.guardiaId != null) {
        int diaSemana = asistencia.fechaHora.weekday;
        actividadPorDia[diaSemana] = (actividadPorDia[diaSemana] ?? 0) + 1;
      }
    }

    return actividadPorDia;
  }

  // Obtener asistencias con autorización manual por guardia
  List<AsistenciaModel> getAutorizacionesManualesByGuardia(String guardiaId) {
    return _asistencias.where((asistencia) => 
        asistencia.guardiaId == guardiaId && 
        asistencia.autorizacionManual == true).toList();
  }

  // Obtener resumen de actividad de guardias por rango de fechas
  Map<String, dynamic> getResumenActividadGuardias(DateTime start, DateTime end) {
    final asistenciasEnRango = getAsistenciasByDateRange(start, end);
    final asistenciasConGuardia = asistenciasEnRango.where((a) => a.guardiaId != null).toList();

    if (asistenciasConGuardia.isEmpty) {
      return {
        'totalAsistencias': 0,
        'guardiasActivos': 0,
        'autorizacionesManuales': 0,
        'puertaMasUsada': 'N/A',
        'facultadMasAtendida': 'N/A',
        'promedioDiario': 0.0,
      };
    }

    final guardiasUnicos = asistenciasConGuardia.map((a) => a.guardiaId!).toSet().length;
    final autorizacionesManuales = asistenciasConGuardia.where((a) => a.autorizacionManual == true).length;

    // Puerta más usada
    Map<String, int> puertas = {};
    for (var asistencia in asistenciasConGuardia) {
      puertas[asistencia.puerta] = (puertas[asistencia.puerta] ?? 0) + 1;
    }
    final puertaMasUsada = puertas.isNotEmpty 
        ? puertas.entries.reduce((a, b) => a.value > b.value ? a : b).key
        : 'N/A';

    // Facultad más atendida
    Map<String, int> facultades = {};
    for (var asistencia in asistenciasConGuardia) {
      facultades[asistencia.siglasFacultad] = (facultades[asistencia.siglasFacultad] ?? 0) + 1;
    }
    final facultadMasAtendida = facultades.isNotEmpty
        ? facultades.entries.reduce((a, b) => a.value > b.value ? a : b).key
        : 'N/A';

    final diasDiferencia = end.difference(start).inDays + 1;
    final promedioDiario = asistenciasConGuardia.length / diasDiferencia;

    return {
      'totalAsistencias': asistenciasConGuardia.length,
      'guardiasActivos': guardiasUnicos,
      'autorizacionesManuales': autorizacionesManuales,
      'puertaMasUsada': puertaMasUsada,
      'facultadMasAtendida': facultadMasAtendida,
      'promedioDiario': promedioDiario,
    };
  }

  // Métodos privados
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _errorMessage = error;
    notifyListeners();
  }

  void _clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
