import 'package:flutter/foundation.dart';

class NfcViewModel extends ChangeNotifier {
  bool _isReading = false;
  String? _lastScannedData;
  String? _errorMessage;

  // Getters
  bool get isReading => _isReading;
  String? get lastScannedData => _lastScannedData;
  String? get errorMessage => _errorMessage;

  // US002: Funcionalidad NFC para guardias y administradores
  Future<void> startNfcReading() async {
    _setReading(true);
    _clearError();

    try {
      // Placeholder - implementar cuando se integre con NfcService
      await Future.delayed(Duration(seconds: 2));
      _lastScannedData = 'Datos NFC simulados';
      _setReading(false);
    } catch (e) {
      _setError(e.toString());
      _setReading(false);
    }
  }

  void stopNfcReading() {
    _setReading(false);
    _clearError();
  }

  // Métodos privados
  void _setReading(bool reading) {
    _isReading = reading;
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
