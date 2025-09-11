class UsuarioModel {
  final String id;
  final String nombre;
  final String email;
  final String rango; // Campo específico para rol: 'Administrador' o 'Guardia'
  final bool isActive;
  
  UsuarioModel({
    required this.id,
    required this.nombre,
    required this.email,
    required this.rango,
    required this.isActive,
  });

  factory UsuarioModel.fromJson(Map<String, dynamic> json) {
    return UsuarioModel(
      id: json['_id'] ?? '',
      nombre: json['nombre'] ?? '',
      email: json['email'] ?? '',
      rango: json['rango'] ?? '',
      isActive: json['isActive'] ?? true,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'nombre': nombre,
      'email': email,
      'rango': rango,
      'isActive': isActive,
    };
  }

  // Getters para manejo de roles - US002: Manejo de roles
  bool get isAdmin => rango == 'Administrador';
  bool get isGuardia => rango == 'Guardia';
  
  // Método para verificar si tiene permisos administrativos
  bool hasAdminPermissions() => isAdmin;
  
  // Método para verificar si puede realizar operaciones de guardia
  bool hasGuardPermissions() => isAdmin || isGuardia;

  @override
  String toString() {
    return 'UsuarioModel{id: $id, nombre: $nombre, email: $email, rango: $rango, isActive: $isActive}';
  }
}