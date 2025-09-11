import 'package:flutter/foundation.dart';
import '../models/usuario_model.dart';
import '../services/api_service.dart';

class AdminViewModel extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<UsuarioModel> _usuarios = [];
  bool _isLoading = false;
  String? _errorMessage;

  // Getters
  List<UsuarioModel> get usuarios => _usuarios;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // US002: Funcionalidades específicas para administradores
  Future<void> loadUsuarios() async {
    _setLoading(true);
    _clearError();

    try {
      _usuarios = await _apiService.getUsuarios();
      _setLoading(false);
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
    }
  }

  // Métodos placeholder para funcionalidades administrativas
  Future<bool> createUser(UsuarioModel usuario) async {
    // Placeholder - implementar cuando se requiera
    return false;
  }

  Future<bool> updateUser(UsuarioModel usuario) async {
    // Placeholder - implementar cuando se requiera
    return false;
  }

  Future<bool> deleteUser(String userId) async {
    // Placeholder - implementar cuando se requiera
    return false;
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
