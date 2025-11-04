import 'package:flutter_test/flutter_test.dart';

// Funciones de validación que deben estar en el código
bool validarDNI(String? dni) {
  if (dni == null || dni.isEmpty) return false;
  final dniRegex = RegExp(r'^\d{8}$');
  return dniRegex.hasMatch(dni);
}

bool validarCodigoUniversitario(String? codigo) {
  if (codigo == null || codigo.isEmpty) return false;
  final codigoRegex = RegExp(r'^[A-Z0-9]{8,}$');
  return codigoRegex.hasMatch(codigo.toUpperCase());
}

bool validarEmail(String? email) {
  if (email == null || email.isEmpty) return false;
  final emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
  return emailRegex.hasMatch(email);
}

void main() {
  group('Validaciones', () {
    group('validarDNI', () {
      test('debe aceptar DNI válido de 8 dígitos', () {
        expect(validarDNI('12345678'), isTrue);
        expect(validarDNI('87654321'), isTrue);
      });

      test('debe rechazar DNI inválido', () {
        expect(validarDNI('1234567'), isFalse); // 7 dígitos
        expect(validarDNI('123456789'), isFalse); // 9 dígitos
        expect(validarDNI('1234567a'), isFalse); // contiene letra
        expect(validarDNI(''), isFalse); // vacío
        expect(validarDNI(null), isFalse); // null
      });
    });

    group('validarCodigoUniversitario', () {
      test('debe aceptar código válido', () {
        expect(validarCodigoUniversitario('20201234'), isTrue);
        expect(validarCodigoUniversitario('20201234A'), isTrue);
        expect(validarCodigoUniversitario('ABC12345'), isTrue);
      });

      test('debe rechazar código inválido', () {
        expect(validarCodigoUniversitario('1234567'), isFalse); // menos de 8 caracteres
        expect(validarCodigoUniversitario('2020-1234'), isFalse); // contiene guión
        expect(validarCodigoUniversitario(''), isFalse); // vacío
        expect(validarCodigoUniversitario(null), isFalse); // null
      });
    });

    group('validarEmail', () {
      test('debe aceptar email válido', () {
        expect(validarEmail('usuario@example.com'), isTrue);
        expect(validarEmail('test.user@university.edu'), isTrue);
        expect(validarEmail('user+tag@domain.co.uk'), isTrue);
      });

      test('debe rechazar email inválido', () {
        expect(validarEmail('invalid-email'), isFalse);
        expect(validarEmail('@domain.com'), isFalse);
        expect(validarEmail('user@'), isFalse);
        expect(validarEmail('user @domain.com'), isFalse); // espacio
        expect(validarEmail(''), isFalse); // vacío
        expect(validarEmail(null), isFalse); // null
      });
    });
  });
}

