import 'package:flutter/foundation.dart';
import '../models/usuario_model.dart';
import '../services/api_service.dart';

class AuthViewModel extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  UsuarioModel? _currentUser;
  bool _isLoading = false;
  String? _errorMessage;

  // ==================== GETTERS ====================
  UsuarioModel? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isLoggedIn => _currentUser != null;
  
  // US002: Getters para manejo de roles
  bool get isAdmin => _currentUser?.isAdmin ?? false;
  bool get isGuardia => _currentUser?.isGuardia ?? false;
  String get userRole => _currentUser?.rango ?? '';
  
  // Verificadores de permisos
  bool get hasAdminPermissions => _currentUser?.hasAdminPermissions() ?? false;
  bool get hasGuardPermissions => _currentUser?.hasGuardPermissions() ?? false;

  // ==================== AUTENTICACIÓN ====================

  /// US001: Login con identificación de rol post-login
  Future<bool> login(String email, String password) async {
    _setLoading(true);
    _clearError();

    try {
      _currentUser = await _apiService.login(email, password);
      _setLoading(false);
      notifyListeners();
      
      // Log para debug del rol identificado
      if (kDebugMode) {
        print('Usuario logueado: ${_currentUser?.nombre}, Rol: ${_currentUser?.rango}');
      }
      
      return true;
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
      return false;
    }
  }

  /// US003: Logout seguro con limpieza de sesión
  void logout() {
    if (kDebugMode) {
      print('Cerrando sesión del usuario: ${_currentUser?.nombre}');
    }
    
    // Limpiar todos los datos de sesión
    _currentUser = null;
    _clearError();
    _isLoading = false;
    
    // Notificar a la UI para redirección
    notifyListeners();
  }

  /// Logout con confirmación (para UI)
  Future<void> logoutWithConfirmation() async {
    // Este método puede ser llamado desde la UI con un diálogo de confirmación
    logout();
  }

  // ==================== GESTIÓN DE PERMISOS ====================

  /// Verificar si el usuario actual puede acceder a una funcionalidad específica
  bool canAccess(String requiredRole) {
    if (_currentUser == null) return false;
    
    switch (requiredRole) {
      case 'Administrador':
        return isAdmin;
      case 'Guardia':
        return isAdmin || isGuardia;
      default:
        return false;
    }
  }

  /// Verificar permisos en el servidor
  Future<bool> verifyPermissions(String requiredRole) async {
    if (_currentUser == null) return false;
    
    try {
      return await _apiService.verifyUserPermissions(_currentUser!.id, requiredRole);
    } catch (e) {
      _setError(e.toString());
      return false;
    }
  }

  // ==================== GESTIÓN DE CONTRASEÑA ====================

  /// US005: Cambiar contraseña con validación de contraseña actual
  Future<bool> changePassword(String currentPassword, String newPassword) async {
    if (_currentUser == null) {
      _setError('No hay sesión activa');
      return false;
    }

    _setLoading(true);
    _clearError();

    try {
      await _apiService.changePassword(_currentUser!.id, currentPassword, newPassword);
      _setLoading(false);
      
      if (kDebugMode) {
        print('Contraseña cambiada exitosamente para: ${_currentUser!.nombre}');
      }
      
      return true;
    } catch (e) {
      _setError(e.toString().replaceAll('Exception: ', ''));
      _setLoading(false);
      return false;
    }
  }

  /// Validar contraseña actual antes del cambio
  Future<bool> validateCurrentPassword(String currentPassword) async {
    if (_currentUser == null) return false;

    try {
      return await _apiService.validateCurrentPassword(_currentUser!.id, currentPassword);
    } catch (e) {
      _setError('Error al validar contraseña');
      return false;
    }
  }

  /// Validar que la nueva contraseña sea segura
  bool isPasswordSecure(String password) {
    // Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número
    return password.length >= 8 &&
           password.contains(RegExp(r'[A-Z]')) &&
           password.contains(RegExp(r'[a-z]')) &&
           password.contains(RegExp(r'[0-9]'));
  }

  /// Obtener mensaje de requisitos de contraseña
  String getPasswordRequirements() {
    return 'La contraseña debe tener:\n'
           '• Mínimo 8 caracteres\n'
           '• Al menos una letra mayúscula\n'
           '• Al menos una letra minúscula\n'
           '• Al menos un número';
  }

  // ==================== MÉTODOS PRIVADOS ====================
  
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

  // ==================== MÉTODOS DE UTILIDAD ====================
  
  /// Obtener descripción del rol actual
  String getRoleDescription() {
    if (_currentUser == null) return 'Sin sesión';
    
    switch (_currentUser!.rango) {
      case 'Administrador':
        return 'Administrador - Acceso completo';
      case 'Guardia':
        return 'Guardia - Acceso limitado';
      default:
        return 'Rol desconocido';
    }
  }

  /// Verificar si la sesión está activa
  bool get isSessionActive => _currentUser != null && (_currentUser!.isActive);
}