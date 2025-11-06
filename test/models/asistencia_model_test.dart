import 'package:flutter_test/flutter_test.dart';
import 'package:moviles2/models/asistencia_model.dart';

void main() {
  group('TipoMovimiento Enum', () {
    test('fromString debe convertir "entrada" correctamente', () {
      expect(TipoMovimiento.fromString('entrada'), equals(TipoMovimiento.entrada));
    });

    test('fromString debe convertir "salida" correctamente', () {
      expect(TipoMovimiento.fromString('salida'), equals(TipoMovimiento.salida));
    });

    test('fromString debe retornar null para valores inválidos', () {
      expect(TipoMovimiento.fromString('invalido'), isNull);
      expect(TipoMovimiento.fromString(null), isNull);
    });

    test('toValue debe retornar string correcto', () {
      expect(TipoMovimiento.entrada.toValue(), equals('entrada'));
      expect(TipoMovimiento.salida.toValue(), equals('salida'));
    });

    test('descripcion debe retornar texto legible', () {
      expect(TipoMovimiento.entrada.descripcion, equals('Entrada'));
      expect(TipoMovimiento.salida.descripcion, equals('Salida'));
    });

    test('icono debe retornar nombre de icono', () {
      expect(TipoMovimiento.entrada.icono, equals('login'));
      expect(TipoMovimiento.salida.icono, equals('logout'));
    });
  });

  group('AsistenciaModel', () {
    test('debe crear instancia correctamente', () {
      final asistencia = AsistenciaModel(
        id: '123',
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '12345678',
        codigoUniversitario: '20201234',
        siglasFacultad: 'FIIS',
        siglasEscuela: 'IC',
        tipo: TipoMovimiento.entrada,
        fechaHora: DateTime(2024, 1, 1, 10, 0),
        entradaTipo: 'nfc',
        puerta: 'Puerta Principal',
      );

      expect(asistencia.id, equals('123'));
      expect(asistencia.nombre, equals('Juan'));
      expect(asistencia.tipo, equals(TipoMovimiento.entrada));
    });

    test('fromJson debe parsear JSON correctamente', () {
      final json = {
        '_id': '123',
        'nombre': 'Juan',
        'apellido': 'Pérez',
        'dni': '12345678',
        'codigo_universitario': '20201234',
        'siglas_facultad': 'FIIS',
        'siglas_escuela': 'IC',
        'tipo': 'entrada',
        'fecha_hora': '2024-01-01T10:00:00Z',
        'entrada_tipo': 'nfc',
        'puerta': 'Puerta Principal',
      };

      final asistencia = AsistenciaModel.fromJson(json);

      expect(asistencia.id, equals('123'));
      expect(asistencia.tipo, equals(TipoMovimiento.entrada));
    });

    test('toJson debe serializar correctamente', () {
      final asistencia = AsistenciaModel(
        id: '123',
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '12345678',
        codigoUniversitario: '20201234',
        siglasFacultad: 'FIIS',
        siglasEscuela: 'IC',
        tipo: TipoMovimiento.entrada,
        fechaHora: DateTime(2024, 1, 1, 10, 0),
        entradaTipo: 'nfc',
        puerta: 'Puerta Principal',
      );

      final json = asistencia.toJson();

      expect(json['tipo'], equals('entrada'));
      expect(json['dni'], equals('12345678'));
    });

    test('nombreCompleto debe combinar nombre y apellido', () {
      final asistencia = AsistenciaModel(
        id: '123',
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '12345678',
        codigoUniversitario: '20201234',
        siglasFacultad: 'FIIS',
        siglasEscuela: 'IC',
        tipo: TipoMovimiento.entrada,
        fechaHora: DateTime.now(),
        entradaTipo: 'nfc',
        puerta: 'Puerta Principal',
      );

      expect(asistencia.nombreCompleto, equals('Juan Pérez'));
    });

    test('esEntrada debe retornar true para entrada', () {
      final asistencia = AsistenciaModel(
        id: '123',
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '12345678',
        codigoUniversitario: '20201234',
        siglasFacultad: 'FIIS',
        siglasEscuela: 'IC',
        tipo: TipoMovimiento.entrada,
        fechaHora: DateTime.now(),
        entradaTipo: 'nfc',
        puerta: 'Puerta Principal',
      );

      expect(asistencia.esEntrada, isTrue);
      expect(asistencia.esSalida, isFalse);
    });

    test('esSalida debe retornar true para salida', () {
      final asistencia = AsistenciaModel(
        id: '123',
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '12345678',
        codigoUniversitario: '20201234',
        siglasFacultad: 'FIIS',
        siglasEscuela: 'IC',
        tipo: TipoMovimiento.salida,
        fechaHora: DateTime.now(),
        entradaTipo: 'nfc',
        puerta: 'Puerta Principal',
      );

      expect(asistencia.esSalida, isTrue);
      expect(asistencia.esEntrada, isFalse);
    });
  });
}

