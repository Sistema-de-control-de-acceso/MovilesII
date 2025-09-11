import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/usuario_model.dart';
import '../config/api_config.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  // Headers por defecto
  Map<String, String> get _headers => {'Content-Type': 'application/json'};

  // ==================== AUTENTICACIÓN ====================

  /// US001: Login con identificación de roles
  Future<UsuarioModel> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConfig.loginUrl),
        headers: _headers,
        body: json.encode({
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        // Verificar que la respuesta contenga la información del usuario
        if (data['usuario'] != null) {
          return UsuarioModel.fromJson(data['usuario']);
        } else {
          throw Exception('Respuesta de login inválida');
        }
      } else if (response.statusCode == 401) {
        throw Exception('Credenciales incorrectas');
      } else if (response.statusCode == 404) {
        throw Exception('Usuario no encontrado');
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  /// US002: Verificar permisos por rol
  Future<bool> verifyUserPermissions(String userId, String requiredRole) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.usuariosUrl}/$userId'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        final userData = json.decode(response.body);
        final userRole = userData['rango'] ?? '';
        
        // Lógica de permisos
        if (requiredRole == 'Administrador') {
          return userRole == 'Administrador';
        } else if (requiredRole == 'Guardia') {
          return userRole == 'Administrador' || userRole == 'Guardia';
        }
        
        return false;
      } else {
        throw Exception('Error al verificar permisos');
      }
    } catch (e) {
      throw Exception('Error al verificar permisos: $e');
    }
  }

  /// Cambio de contraseña - requiere contraseña actual para seguridad
  Future<void> changePassword(String userId, String currentPassword, String newPassword) async {
    try {
      final response = await http.put(
        Uri.parse('${ApiConfig.usuariosUrl}/$userId/change-password'),
        headers: _headers,
        body: json.encode({
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        }),
      );

      if (response.statusCode == 200) {
        return; // Éxito
      } else if (response.statusCode == 400) {
        final data = json.decode(response.body);
        throw Exception(data['message'] ?? 'Contraseña actual incorrecta');
      } else if (response.statusCode == 401) {
        throw Exception('Contraseña actual incorrecta');
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } catch (e) {
      if (e.toString().contains('Exception:')) {
        rethrow;
      }
      throw Exception('Error de conexión: $e');
    }
  }

  /// Validar contraseña actual del usuario
  Future<bool> validateCurrentPassword(String userId, String currentPassword) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.usuariosUrl}/$userId/validate-password'),
        headers: _headers,
        body: json.encode({
          'password': currentPassword,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // ==================== USUARIOS ====================
  
  Future<List<UsuarioModel>> getUsuarios() async {
    try {
      final response = await http.get(
        Uri.parse(ApiConfig.usuariosUrl),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        List<dynamic> data = json.decode(response.body);
        return data.map((json) => UsuarioModel.fromJson(json)).toList();
      } else {
        throw Exception('Error al obtener usuarios: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }
}