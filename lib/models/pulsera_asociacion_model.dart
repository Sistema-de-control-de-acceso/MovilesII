/// Modelo de Asociación Pulsera-Estudiante
class PulseraAsociacion {
  final String id;
  final String pulseraId;
  final String estudianteId;
  final EstudianteInfo estudiante;
  final String estado;
  final DateTime fechaAsociacion;
  final DateTime? fechaActivacion;
  final DateTime? fechaDesactivacion;
  final String? motivoDesactivacion;
  final UsuarioInfo? creadoPor;
  final UsuarioInfo? modificadoPor;
  final int contadorLecturas;
  final DateTime? ultimaLectura;
  final String? notas;

  PulseraAsociacion({
    required this.id,
    required this.pulseraId,
    required this.estudianteId,
    required this.estudiante,
    required this.estado,
    required this.fechaAsociacion,
    this.fechaActivacion,
    this.fechaDesactivacion,
    this.motivoDesactivacion,
    this.creadoPor,
    this.modificadoPor,
    this.contadorLecturas = 0,
    this.ultimaLectura,
    this.notas,
  });

  bool get isActiva => estado == 'activa';
  bool get isInactiva => estado == 'inactiva';
  bool get isSuspendida => estado == 'suspendida';
  bool get isPerdida => estado == 'perdida';

  factory PulseraAsociacion.fromJson(Map<String, dynamic> json) {
    return PulseraAsociacion(
      id: json['_id'] as String,
      pulseraId: json['pulsera_id'] as String,
      estudianteId: json['estudiante_id'] as String,
      estudiante: EstudianteInfo.fromJson(json['estudiante'] as Map<String, dynamic>),
      estado: json['estado'] as String,
      fechaAsociacion: DateTime.parse(json['fecha_asociacion'] as String),
      fechaActivacion: json['fecha_activacion'] != null
          ? DateTime.parse(json['fecha_activacion'] as String)
          : null,
      fechaDesactivacion: json['fecha_desactivacion'] != null
          ? DateTime.parse(json['fecha_desactivacion'] as String)
          : null,
      motivoDesactivacion: json['motivo_desactivacion'] as String?,
      creadoPor: json['creado_por'] != null
          ? UsuarioInfo.fromJson(json['creado_por'] as Map<String, dynamic>)
          : null,
      modificadoPor: json['modificado_por'] != null
          ? UsuarioInfo.fromJson(json['modificado_por'] as Map<String, dynamic>)
          : null,
      contadorLecturas: json['contador_lecturas'] as int? ?? 0,
      ultimaLectura: json['ultima_lectura'] != null
          ? DateTime.parse(json['ultima_lectura'] as String)
          : null,
      notas: json['notas'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'pulsera_id': pulseraId,
      'estudiante_id': estudianteId,
      'estudiante': estudiante.toJson(),
      'estado': estado,
      'fecha_asociacion': fechaAsociacion.toIso8601String(),
      'fecha_activacion': fechaActivacion?.toIso8601String(),
      'fecha_desactivacion': fechaDesactivacion?.toIso8601String(),
      'motivo_desactivacion': motivoDesactivacion,
      'creado_por': creadoPor?.toJson(),
      'modificado_por': modificadoPor?.toJson(),
      'contador_lecturas': contadorLecturas,
      'ultima_lectura': ultimaLectura?.toIso8601String(),
      'notas': notas,
    };
  }
}

/// Información del estudiante
class EstudianteInfo {
  final String codigoUniversitario;
  final String dni;
  final String? nombre;
  final String? apellido;
  final String? facultad;
  final String? escuela;

  EstudianteInfo({
    required this.codigoUniversitario,
    required this.dni,
    this.nombre,
    this.apellido,
    this.facultad,
    this.escuela,
  });

  String get nombreCompleto => '${nombre ?? ''} ${apellido ?? ''}'.trim();

  factory EstudianteInfo.fromJson(Map<String, dynamic> json) {
    return EstudianteInfo(
      codigoUniversitario: json['codigo_universitario'] as String,
      dni: json['dni'] as String,
      nombre: json['nombre'] as String?,
      apellido: json['apellido'] as String?,
      facultad: json['facultad'] as String?,
      escuela: json['escuela'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'codigo_universitario': codigoUniversitario,
      'dni': dni,
      'nombre': nombre,
      'apellido': apellido,
      'facultad': facultad,
      'escuela': escuela,
    };
  }
}

/// Información del usuario que realizó la acción
class UsuarioInfo {
  final String usuarioId;
  final String usuarioNombre;
  final DateTime fecha;

  UsuarioInfo({
    required this.usuarioId,
    required this.usuarioNombre,
    required this.fecha,
  });

  factory UsuarioInfo.fromJson(Map<String, dynamic> json) {
    return UsuarioInfo(
      usuarioId: json['usuario_id'] as String,
      usuarioNombre: json['usuario_nombre'] as String,
      fecha: DateTime.parse(json['fecha'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'usuario_id': usuarioId,
      'usuario_nombre': usuarioNombre,
      'fecha': fecha.toIso8601String(),
    };
  }
}

/// Resultado de verificación de pulsera
class VerificacionPulseraResult {
  final bool encontrado;
  final PulseraAsociacion? asociacion;
  final String? error;
  final String? accionRecomendada;

  VerificacionPulseraResult({
    required this.encontrado,
    this.asociacion,
    this.error,
    this.accionRecomendada,
  });

  factory VerificacionPulseraResult.fromJson(Map<String, dynamic> json) {
    return VerificacionPulseraResult(
      encontrado: json['encontrado'] as bool,
      asociacion: json['asociacion'] != null
          ? PulseraAsociacion.fromJson(json['asociacion'] as Map<String, dynamic>)
          : null,
      error: json['error'] as String?,
      accionRecomendada: json['accion_recomendada'] as String?,
    );
  }
}

/// Estadísticas de asociaciones
class AsociacionesStats {
  final int total;
  final EstadosStats porEstado;
  final double porcentajeActivas;

  AsociacionesStats({
    required this.total,
    required this.porEstado,
    required this.porcentajeActivas,
  });

  factory AsociacionesStats.fromJson(Map<String, dynamic> json) {
    return AsociacionesStats(
      total: json['total'] as int,
      porEstado: EstadosStats.fromJson(json['por_estado'] as Map<String, dynamic>),
      porcentajeActivas: double.parse(json['porcentaje_activas'].toString()),
    );
  }
}

/// Estadísticas por estado
class EstadosStats {
  final int activas;
  final int inactivas;
  final int suspendidas;
  final int perdidas;

  EstadosStats({
    required this.activas,
    required this.inactivas,
    required this.suspendidas,
    required this.perdidas,
  });

  factory EstadosStats.fromJson(Map<String, dynamic> json) {
    return EstadosStats(
      activas: json['activas'] as int,
      inactivas: json['inactivas'] as int,
      suspendidas: json['suspendidas'] as int,
      perdidas: json['perdidas'] as int,
    );
  }
}

