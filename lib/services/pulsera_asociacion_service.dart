import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/pulsera_asociacion_model.dart';
import '../config/api_config.dart';

/// Servicio para gestionar asociaciones pulsera-estudiante
class PulseraAsociacionService {
  static final PulseraAsociacionService _instance = PulseraAsociacionService._internal();
  factory PulseraAsociacionService() => _instance;
  PulseraAsociacionService._internal();

  final String _baseUrl = '${ApiConfig.baseUrl}/pulseras-asociaciones';

  /// Crear nueva asociación
  Future<PulseraAsociacion> crearAsociacion({
    required String pulseraId,
    required String codigoUniversitario,
    Map<String, dynamic>? usuario,
  }) async {
    try {
      final response = await http.post(
        Uri.parse(_baseUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'pulsera_id': pulseraId,
          'codigo_universitario': codigoUniversitario,
          'usuario': usuario,
        }),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return PulseraAsociacion.fromJson(data['asociacion']);
      } else if (response.statusCode == 409) {
        final error = jsonDecode(response.body);
        throw AsociacionDuplicadaException(
          error['error'],
          error['asociacion_existente'],
        );
      } else if (response.statusCode == 404) {
        final error = jsonDecode(response.body);
        throw EstudianteNoEncontradoException(
          error['error'],
          error['codigo_universitario'],
        );
      } else {
        throw Exception('Error creando asociación: ${response.statusCode}');
      }
    } catch (e) {
      if (e is AsociacionException) rethrow;
      throw Exception('Error de conexión: $e');
    }
  }

  /// Listar asociaciones con filtros
  Future<List<PulseraAsociacion>> listarAsociaciones({
    String? estado,
    String? codigoUniversitario,
    String? dni,
    String? facultad,
    int page = 1,
    int limit = 50,
  }) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
      };

      if (estado != null) queryParams['estado'] = estado;
      if (codigoUniversitario != null) queryParams['codigo_universitario'] = codigoUniversitario;
      if (dni != null) queryParams['dni'] = dni;
      if (facultad != null) queryParams['facultad'] = facultad;

      final uri = Uri.parse(_baseUrl).replace(queryParameters: queryParams);
      final response = await http.get(uri);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final asociaciones = (data['asociaciones'] as List)
            .map((json) => PulseraAsociacion.fromJson(json))
            .toList();
        return asociaciones;
      } else {
        throw Exception('Error listando asociaciones: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  /// Obtener asociación por ID de pulsera
  Future<PulseraAsociacion?> obtenerPorPulseraId(String pulseraId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/pulsera/$pulseraId'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return PulseraAsociacion.fromJson(data['asociacion']);
      } else if (response.statusCode == 404) {
        return null;
      } else {
        throw Exception('Error obteniendo asociación: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  /// Obtener asociaciones por código universitario
  Future<List<PulseraAsociacion>> obtenerPorEstudiante(
    String codigoUniversitario,
  ) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/estudiante/$codigoUniversitario'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final asociaciones = (data['asociaciones'] as List)
            .map((json) => PulseraAsociacion.fromJson(json))
            .toList();
        return asociaciones;
      } else if (response.statusCode == 404) {
        return [];
      } else {
        throw Exception('Error obteniendo asociaciones: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  /// Verificar si una pulsera está asociada y activa
  Future<VerificacionPulseraResult> verificarPulsera(String pulseraId) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/verificar'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'pulsera_id': pulseraId}),
      );

      if (response.statusCode == 200 || response.statusCode == 404) {
        final data = jsonDecode(response.body);
        return VerificacionPulseraResult.fromJson(data);
      } else {
        throw Exception('Error verificando pulsera: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  /// Actualizar estado de asociación
  Future<PulseraAsociacion> actualizarEstado({
    required String id,
    required String estado,
    String? motivo,
    Map<String, dynamic>? usuario,
  }) async {
    try {
      final response = await http.put(
        Uri.parse('$_baseUrl/$id'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'estado': estado,
          'motivo': motivo,
          'usuario': usuario,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return PulseraAsociacion.fromJson(data['asociacion']);
      } else {
        throw Exception('Error actualizando asociación: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  /// Eliminar asociación (soft delete)
  Future<void> eliminarAsociacion({
    required String id,
    Map<String, dynamic>? usuario,
  }) async {
    try {
      final response = await http.delete(
        Uri.parse('$_baseUrl/$id'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'usuario': usuario}),
      );

      if (response.statusCode != 200) {
        throw Exception('Error eliminando asociación: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  /// Obtener estadísticas de asociaciones
  Future<AsociacionesStats> obtenerEstadisticas() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/stats/general'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return AsociacionesStats.fromJson(data);
      } else {
        throw Exception('Error obteniendo estadísticas: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }
}

/// Excepciones personalizadas
abstract class AsociacionException implements Exception {
  final String message;
  AsociacionException(this.message);

  @override
  String toString() => message;
}

class AsociacionDuplicadaException extends AsociacionException {
  final Map<String, dynamic>? asociacionExistente;

  AsociacionDuplicadaException(String message, this.asociacionExistente)
      : super(message);
}

class EstudianteNoEncontradoException extends AsociacionException {
  final String? codigoUniversitario;

  EstudianteNoEncontradoException(String message, this.codigoUniversitario)
      : super(message);
}

