/// Enum para tipo de movimiento en el campus
enum TipoMovimiento {
  entrada,
  salida;

  /// Convierte string a enum
  static TipoMovimiento? fromString(String? tipo) {
    if (tipo == null) return null;
    switch (tipo.toLowerCase()) {
      case 'entrada':
        return TipoMovimiento.entrada;
      case 'salida':
        return TipoMovimiento.salida;
      default:
        return null;
    }
  }

  /// Convierte enum a string para almacenamiento
  String toValue() {
    return name; // 'entrada' o 'salida'
  }

  /// Descripción legible
  String get descripcion {
    switch (this) {
      case TipoMovimiento.entrada:
        return 'Entrada';
      case TipoMovimiento.salida:
        return 'Salida';
    }
  }

  /// Icono para UI
  String get icono {
    switch (this) {
      case TipoMovimiento.entrada:
        return 'login';
      case TipoMovimiento.salida:
        return 'logout';
    }
  }
}

/// Modelo de Asistencia
class AsistenciaModel {
  final String id;
  final String nombre;
  final String apellido;
  final String dni;
  final String codigoUniversitario;
  final String siglasFacultad;
  final String siglasEscuela;
  final TipoMovimiento tipo; // Usando enum en lugar de String
  final DateTime fechaHora;
  final String entradaTipo; // 'nfc', 'manual', etc.
  final String puerta;
  
  // Campos adicionales
  final String? guardiaId;
  final String? guardiaNombre;
  final bool autorizacionManual;
  final String? razonDecision;
  final DateTime? timestampDecision;
  final String? coordenadas;
  final String? descripcionUbicacion;

  AsistenciaModel({
    required this.id,
    required this.nombre,
    required this.apellido,
    required this.dni,
    required this.codigoUniversitario,
    required this.siglasFacultad,
    required this.siglasEscuela,
    required this.tipo,
    required this.fechaHora,
    required this.entradaTipo,
    required this.puerta,
    this.guardiaId,
    this.guardiaNombre,
    this.autorizacionManual = false,
    this.razonDecision,
    this.timestampDecision,
    this.coordenadas,
    this.descripcionUbicacion,
  });

  factory AsistenciaModel.fromJson(Map<String, dynamic> json) {
    return AsistenciaModel(
      id: json['_id'] ?? json['id'] ?? '',
      nombre: json['nombre'] ?? '',
      apellido: json['apellido'] ?? '',
      dni: json['dni'] ?? '',
      codigoUniversitario: json['codigo_universitario'] ?? '',
      siglasFacultad: json['siglas_facultad'] ?? '',
      siglasEscuela: json['siglas_escuela'] ?? '',
      tipo: TipoMovimiento.fromString(json['tipo']) ?? TipoMovimiento.entrada,
      fechaHora: json['fecha_hora'] != null
          ? DateTime.parse(json['fecha_hora'])
          : DateTime.now(),
      entradaTipo: json['entrada_tipo'] ?? 'nfc',
      puerta: json['puerta'] ?? '',
      guardiaId: json['guardia_id'],
      guardiaNombre: json['guardia_nombre'],
      autorizacionManual: json['autorizacion_manual'] == true,
      razonDecision: json['razon_decision'],
      timestampDecision: json['timestamp_decision'] != null
          ? DateTime.parse(json['timestamp_decision'])
          : null,
      coordenadas: json['coordenadas'],
      descripcionUbicacion: json['descripcion_ubicacion'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'id': id,
      'nombre': nombre,
      'apellido': apellido,
      'dni': dni,
      'codigo_universitario': codigoUniversitario,
      'siglas_facultad': siglasFacultad,
      'siglas_escuela': siglasEscuela,
      'tipo': tipo.toValue(),
      'fecha_hora': fechaHora.toIso8601String(),
      'entrada_tipo': entradaTipo,
      'puerta': puerta,
      'guardia_id': guardiaId,
      'guardia_nombre': guardiaNombre,
      'autorizacion_manual': autorizacionManual,
      'razon_decision': razonDecision,
      'timestamp_decision': timestampDecision?.toIso8601String(),
      'coordenadas': coordenadas,
      'descripcion_ubicacion': descripcionUbicacion,
    };
  }

  String get nombreCompleto => '$nombre $apellido';

  String get fechaFormateada {
    return '${fechaHora.day}/${fechaHora.month}/${fechaHora.year}';
  }

  String get horaFormateada {
    return '${fechaHora.hour.toString().padLeft(2, '0')}:${fechaHora.minute.toString().padLeft(2, '0')}';
  }

  bool get esEntrada => tipo == TipoMovimiento.entrada;
  bool get esSalida => tipo == TipoMovimiento.salida;
}

