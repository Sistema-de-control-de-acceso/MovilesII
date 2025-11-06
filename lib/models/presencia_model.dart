/// Modelo de Presencia
class PresenciaModel {
  final String id;
  final String estudianteId;
  final String estudianteDni;
  final String estudianteNombre;
  final String facultad;
  final String escuela;
  final DateTime horaEntrada;
  final DateTime? horaSalida;
  final String puntoEntrada;
  final String? puntoSalida;
  final bool estaDentro;
  final String guardiaEntrada;
  final String? guardiaSalida;
  final int? tiempoEnCampus; // En minutos

  PresenciaModel({
    required this.id,
    required this.estudianteId,
    required this.estudianteDni,
    required this.estudianteNombre,
    required this.facultad,
    required this.escuela,
    required this.horaEntrada,
    this.horaSalida,
    required this.puntoEntrada,
    this.puntoSalida,
    this.estaDentro = true,
    required this.guardiaEntrada,
    this.guardiaSalida,
    this.tiempoEnCampus,
  });

  factory PresenciaModel.fromJson(Map<String, dynamic> json) {
    return PresenciaModel(
      id: json['_id'] ?? json['id'] ?? '',
      estudianteId: json['estudiante_id'] ?? '',
      estudianteDni: json['estudiante_dni'] ?? '',
      estudianteNombre: json['estudiante_nombre'] ?? '',
      facultad: json['facultad'] ?? '',
      escuela: json['escuela'] ?? '',
      horaEntrada: json['hora_entrada'] != null
          ? DateTime.parse(json['hora_entrada'])
          : DateTime.now(),
      horaSalida: json['hora_salida'] != null
          ? DateTime.parse(json['hora_salida'])
          : null,
      puntoEntrada: json['punto_entrada'] ?? '',
      puntoSalida: json['punto_salida'],
      estaDentro: json['esta_dentro'] ?? true,
      guardiaEntrada: json['guardia_entrada'] ?? '',
      guardiaSalida: json['guardia_salida'],
      tiempoEnCampus: json['tiempo_en_campus'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'id': id,
      'estudiante_id': estudianteId,
      'estudiante_dni': estudianteDni,
      'estudiante_nombre': estudianteNombre,
      'facultad': facultad,
      'escuela': escuela,
      'hora_entrada': horaEntrada.toIso8601String(),
      'hora_salida': horaSalida?.toIso8601String(),
      'punto_entrada': puntoEntrada,
      'punto_salida': puntoSalida,
      'esta_dentro': estaDentro,
      'guardia_entrada': guardiaEntrada,
      'guardia_salida': guardiaSalida,
      'tiempo_en_campus': tiempoEnCampus,
    };
  }

  String get nombreCompleto => estudianteNombre;
  
  String get tiempoEnCampusFormateado {
    if (tiempoEnCampus == null) return 'N/A';
    final horas = tiempoEnCampus! ~/ 60;
    final minutos = tiempoEnCampus! % 60;
    return '${horas}h ${minutos}m';
  }
}

