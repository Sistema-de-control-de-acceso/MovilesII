import 'package:flutter/foundation.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/asistencia_model.dart';
import '../models/alumno_model.dart';
import '../services/api_service.dart';
import '../services/local_database_service.dart';
import '../config/api_config.dart';

/// Resultado de validación de movimiento
class ValidacionMovimiento {
  final bool esValido;
  final TipoMovimiento tipoSugerido;
  final String? motivo;
  final bool requiereAutorizacionManual;

  ValidacionMovimiento({
    required this.esValido,
    required this.tipoSugerido,
    this.motivo,
    this.requiereAutorizacionManual = false,
  });

  factory ValidacionMovimiento.valido(TipoMovimiento tipo) {
    return ValidacionMovimiento(
      esValido: true,
      tipoSugerido: tipo,
    );
  }

  factory ValidacionMovimiento.invalido(TipoMovimiento tipoSugerido, String motivo, {bool requiereAutorizacion = false}) {
    return ValidacionMovimiento(
      esValido: false,
      tipoSugerido: tipoSugerido,
      motivo: motivo,
      requiereAutorizacionManual: requiereAutorizacion,
    );
  }
}

/// Servicio para lógica de entrada/salida del campus
class EntradaSalidaService {
  final ApiService _apiService = ApiService();
  final LocalDatabaseService _localDb = LocalDatabaseService();
  final String baseUrl = ApiConfig.baseUrl;
  
  Map<String, String> get _headers => {'Content-Type': 'application/json'};

  /// Determina el tipo de movimiento (entrada/salida) basado en el historial
  Future<TipoMovimiento> determinarTipoMovimiento(String estudianteDni) async {
    try {
      // Obtener último movimiento del estudiante
      final ultimoMovimiento = await _obtenerUltimoMovimiento(estudianteDni);
      
      if (ultimoMovimiento == null) {
        // No hay historial, asumir entrada
        return TipoMovimiento.entrada;
      }

      // Si el último fue entrada, el siguiente debe ser salida
      // Si el último fue salida, el siguiente debe ser entrada
      return ultimoMovimiento.tipo == TipoMovimiento.entrada
          ? TipoMovimiento.salida
          : TipoMovimiento.entrada;
    } catch (e) {
      debugPrint('Error determinando tipo movimiento: $e');
      // En caso de error, asumir entrada (más seguro)
      return TipoMovimiento.entrada;
    }
  }

  /// Valida la coherencia temporal del movimiento
  Future<ValidacionMovimiento> validarMovimiento({
    required String estudianteDni,
    required TipoMovimiento tipoMovimiento,
    required DateTime fechaHora,
  }) async {
    try {
      // Obtener último movimiento
      final ultimoMovimiento = await _obtenerUltimoMovimiento(estudianteDni);

      if (ultimoMovimiento == null) {
        // No hay historial previo
        if (tipoMovimiento == TipoMovimiento.salida) {
          return ValidacionMovimiento.invalido(
            TipoMovimiento.entrada,
            'No se puede registrar salida sin registro previo de entrada',
            requiereAutorizacion: true,
          );
        }
        return ValidacionMovimiento.valido(TipoMovimiento.entrada);
      }

      // Validar coherencia temporal
      if (fechaHora.isBefore(ultimoMovimiento.fechaHora)) {
        return ValidacionMovimiento.invalido(
          ultimoMovimiento.tipo == TipoMovimiento.entrada
              ? TipoMovimiento.salida
              : TipoMovimiento.entrada,
          'La fecha/hora del movimiento es anterior al último registro',
          requiereAutorizacion: true,
        );
      }

      // Validar secuencia lógica
      if (ultimoMovimiento.tipo == tipoMovimiento) {
        // Dos movimientos del mismo tipo consecutivos
        final tipoEsperado = ultimoMovimiento.tipo == TipoMovimiento.entrada
            ? TipoMovimiento.salida
            : TipoMovimiento.entrada;

        return ValidacionMovimiento.invalido(
          tipoEsperado,
          'El último movimiento fue ${ultimoMovimiento.tipo.descripcion}. '
          'El siguiente debe ser ${tipoEsperado.descripcion}',
          requiereAutorizacion: true,
        );
      }

      // Validar tiempo mínimo entre movimientos (opcional: evitar registros duplicados)
      final diferencia = fechaHora.difference(ultimoMovimiento.fechaHora);
      if (diferencia.inSeconds < 30) {
        return ValidacionMovimiento.invalido(
          tipoMovimiento,
          'Movimiento registrado muy rápido después del anterior. '
          'Esperar al menos 30 segundos',
          requiereAutorizacion: false,
        );
      }

      // Todo correcto
      return ValidacionMovimiento.valido(tipoMovimiento);
    } catch (e) {
      debugPrint('Error validando movimiento: $e');
      // En caso de error, permitir entrada como fallback seguro
      return ValidacionMovimiento.valido(TipoMovimiento.entrada);
    }
  }

  /// Calcula cuántos estudiantes están actualmente en el campus
  Future<int> calcularEstudiantesEnCampus() async {
    try {
      final asistencias = await _apiService.getAsistencias();
      
      // Agrupar por estudiante (DNI)
      Map<String, List<AsistenciaModel>> movimientosPorEstudiante = {};
      
      for (var asistencia in asistencias) {
        if (!movimientosPorEstudiante.containsKey(asistencia.dni)) {
          movimientosPorEstudiante[asistencia.dni] = [];
        }
        movimientosPorEstudiante[asistencia.dni]!.add(asistencia);
      }

      // Para cada estudiante, determinar si está dentro
      int estudiantesDentro = 0;

      for (var movimientos in movimientosPorEstudiante.values) {
        // Ordenar por fecha más reciente
        movimientos.sort((a, b) => b.fechaHora.compareTo(a.fechaHora));
        
        final ultimoMovimiento = movimientos.first;
        
        // Si el último movimiento fue entrada, está dentro
        if (ultimoMovimiento.tipo == TipoMovimiento.entrada) {
          estudiantesDentro++;
        }
      }

      return estudiantesDentro;
    } catch (e) {
      debugPrint('Error calculando estudiantes en campus: $e');
      return 0;
    }
  }

  /// Calcula estudiantes en campus por facultad
  Future<Map<String, int>> calcularEstudiantesEnCampusPorFacultad() async {
    try {
      final asistencias = await _apiService.getAsistencias();
      
      // Agrupar por estudiante (DNI)
      Map<String, List<AsistenciaModel>> movimientosPorEstudiante = {};
      
      for (var asistencia in asistencias) {
        if (!movimientosPorEstudiante.containsKey(asistencia.dni)) {
          movimientosPorEstudiante[asistencia.dni] = [];
        }
        movimientosPorEstudiante[asistencia.dni]!.add(asistencia);
      }

      // Para cada estudiante, determinar si está dentro y su facultad
      Map<String, Set<String>> estudiantesPorFacultad = {};

      for (var entry in movimientosPorEstudiante.entries) {
        final movimientos = entry.value;
        movimientos.sort((a, b) => b.fechaHora.compareTo(a.fechaHora));
        
        final ultimoMovimiento = movimientos.first;
        
        // Si el último movimiento fue entrada, está dentro
        if (ultimoMovimiento.tipo == TipoMovimiento.entrada) {
          final facultad = ultimoMovimiento.siglasFacultad;
          if (!estudiantesPorFacultad.containsKey(facultad)) {
            estudiantesPorFacultad[facultad] = {};
          }
          estudiantesPorFacultad[facultad]!.add(entry.key);
        }
      }

      // Convertir a conteos
      Map<String, int> resultado = {};
      estudiantesPorFacultad.forEach((facultad, estudiantes) {
        resultado[facultad] = estudiantes.length;
      });

      return resultado;
    } catch (e) {
      debugPrint('Error calculando estudiantes por facultad: $e');
      return {};
    }
  }

  /// Verifica si un estudiante está actualmente en el campus
  Future<bool> estaEstudianteEnCampus(String estudianteDni) async {
    try {
      final ultimoMovimiento = await _obtenerUltimoMovimiento(estudianteDni);
      
      if (ultimoMovimiento == null) {
        return false;
      }

      return ultimoMovimiento.tipo == TipoMovimiento.entrada;
    } catch (e) {
      debugPrint('Error verificando si estudiante está en campus: $e');
      return false;
    }
  }

  /// Obtiene el último movimiento de un estudiante
  Future<AsistenciaModel?> _obtenerUltimoMovimiento(String estudianteDni) async {
    try {
      // Usar el endpoint mejorado del backend
      final response = await http.get(
        Uri.parse('$baseUrl/asistencias/ultimo-acceso/$estudianteDni'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        
        if (data['asistencia_completa'] != null) {
          return AsistenciaModel.fromJson(data['asistencia_completa']);
        }
      }

      // Fallback: obtener todas las asistencias y filtrar
      final asistencias = await _apiService.getAsistencias();
      final asistenciasEstudiante = asistencias
          .where((a) => a.dni == estudianteDni)
          .toList();

      if (asistenciasEstudiante.isEmpty) {
        return null;
      }

      // Ordenar por fecha más reciente
      asistenciasEstudiante.sort((a, b) => b.fechaHora.compareTo(a.fechaHora));
      
      return asistenciasEstudiante.first;
    } catch (e) {
      debugPrint('Error obteniendo último movimiento: $e');
      return null;
    }
  }

  /// Valida movimiento usando el endpoint del backend
  Future<ValidacionMovimiento> validarMovimientoConBackend({
    required String estudianteDni,
    required TipoMovimiento tipoMovimiento,
    required DateTime fechaHora,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/asistencias/validar-movimiento'),
        headers: _headers,
        body: json.encode({
          'dni': estudianteDni,
          'tipo': tipoMovimiento.toValue(),
          'fecha_hora': fechaHora.toIso8601String(),
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        
        if (data['es_valido']) {
          return ValidacionMovimiento.valido(
            TipoMovimiento.fromString(data['tipo_sugerido']) ?? TipoMovimiento.entrada
          );
        } else {
          return ValidacionMovimiento.invalido(
            TipoMovimiento.fromString(data['tipo_sugerido']) ?? TipoMovimiento.entrada,
            data['motivo'] ?? 'Movimiento inválido',
            requiereAutorizacion: data['requiere_autorizacion_manual'] == true,
          );
        }
      }

      // Si falla el backend, usar validación local
      return await validarMovimiento(
        estudianteDni: estudianteDni,
        tipoMovimiento: tipoMovimiento,
        fechaHora: fechaHora,
      );
    } catch (e) {
      debugPrint('Error validando movimiento con backend: $e');
      // Fallback a validación local
      return await validarMovimiento(
        estudianteDni: estudianteDni,
        tipoMovimiento: tipoMovimiento,
        fechaHora: fechaHora,
      );
    }
  }

  /// Calcula estudiantes en campus usando el endpoint del backend
  Future<Map<String, dynamic>> calcularEstudiantesEnCampusConBackend() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/asistencias/estudiantes-en-campus'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'total': data['total_estudiantes_en_campus'] ?? 0,
          'estudiantes': data['estudiantes'] ?? [],
          'porFacultad': data['por_facultad'] ?? {},
        };
      }

      // Fallback a cálculo local
      final total = await calcularEstudiantesEnCampus();
      final porFacultad = await calcularEstudiantesEnCampusPorFacultad();
      
      return {
        'total': total,
        'estudiantes': [],
        'porFacultad': porFacultad,
      };
    } catch (e) {
      debugPrint('Error calculando estudiantes con backend: $e');
      // Fallback a cálculo local
      final total = await calcularEstudiantesEnCampus();
      final porFacultad = await calcularEstudiantesEnCampusPorFacultad();
      
      return {
        'total': total,
        'estudiantes': [],
        'porFacultad': porFacultad,
      };
    }
  }

  /// Obtiene el historial de movimientos de un estudiante
  Future<List<AsistenciaModel>> obtenerHistorialMovimientos(String estudianteDni, {int? limit}) async {
    try {
      final asistencias = await _apiService.getAsistencias();
      final historial = asistencias
          .where((a) => a.dni == estudianteDni)
          .toList();

      historial.sort((a, b) => b.fechaHora.compareTo(a.fechaHora));

      if (limit != null) {
        return historial.take(limit).toList();
      }

      return historial;
    } catch (e) {
      debugPrint('Error obteniendo historial de movimientos: $e');
      return [];
    }
  }

  /// Obtiene estadísticas de movimientos de un estudiante
  Future<Map<String, dynamic>> obtenerEstadisticasMovimientos(String estudianteDni) async {
    try {
      final historial = await obtenerHistorialMovimientos(estudianteDni);
      
      final entradas = historial.where((a) => a.tipo == TipoMovimiento.entrada).length;
      final salidas = historial.where((a) => a.tipo == TipoMovimiento.salida).length;
      
      final estaDentro = historial.isNotEmpty && historial.first.tipo == TipoMovimiento.entrada;
      
      return {
        'totalMovimientos': historial.length,
        'entradas': entradas,
        'salidas': salidas,
        'estaDentro': estaDentro,
        'ultimoMovimiento': historial.isNotEmpty ? historial.first.fechaHora.toIso8601String() : null,
      };
    } catch (e) {
      debugPrint('Error obteniendo estadísticas de movimientos: $e');
      return {
        'totalMovimientos': 0,
        'entradas': 0,
        'salidas': 0,
        'estaDentro': false,
        'ultimoMovimiento': null,
      };
    }
  }
}

