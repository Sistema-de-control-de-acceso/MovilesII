import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

class PuntoControl {
  final String id;
  final String nombre;
  final String? ubicacion;
  final String? descripcion;

  PuntoControl({
    required this.id,
    required this.nombre,
    this.ubicacion,
    this.descripcion,
  });

  factory PuntoControl.fromJson(Map<String, dynamic> json) {
    return PuntoControl(
      id: json['_id'],
      nombre: json['nombre'],
      ubicacion: json['ubicacion'],
      descripcion: json['descripcion'],
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'nombre': nombre,
        'ubicacion': ubicacion,
        'descripcion': descripcion,
      };
}

class PuntoControlService {
  static Future<List<PuntoControl>> fetchPuntos() async {
    final response = await http.get(Uri.parse('${ApiConfig.baseUrl}/puntos-control'));
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((e) => PuntoControl.fromJson(e)).toList();
    } else {
      throw Exception('Error al cargar puntos de control');
    }
  }

  static Future<PuntoControl> crearPunto(PuntoControl punto) async {
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/puntos-control'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'nombre': punto.nombre,
        'ubicacion': punto.ubicacion,
        'descripcion': punto.descripcion,
      }),
    );
    if (response.statusCode == 201) {
      return PuntoControl.fromJson(json.decode(response.body));
    } else {
      throw Exception('Error al crear punto de control');
    }
  }

  static Future<void> eliminarPunto(String id) async {
    final response = await http.delete(Uri.parse('${ApiConfig.baseUrl}/puntos-control/$id'));
    if (response.statusCode != 200 && response.statusCode != 204) {
      throw Exception('Error al eliminar punto de control');
    }
  }

  static Future<PuntoControl> actualizarPunto(PuntoControl punto) async {
    final response = await http.put(
      Uri.parse('${ApiConfig.baseUrl}/puntos-control/${punto.id}'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'nombre': punto.nombre,
        'ubicacion': punto.ubicacion,
        'descripcion': punto.descripcion,
      }),
    );
    if (response.statusCode == 200) {
      return PuntoControl.fromJson(json.decode(response.body));
    } else {
      throw Exception('Error al actualizar punto de control');
    }
  }
}
