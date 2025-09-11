import 'package:flutter/material.dart';
import 'punto_control_service.dart';

class PuntosControlScreen extends StatefulWidget {
  const PuntosControlScreen({Key? key}) : super(key: key);

  @override
  State<PuntosControlScreen> createState() => _PuntosControlScreenState();
}

class _PuntosControlScreenState extends State<PuntosControlScreen> {
  late Future<List<PuntoControl>> _futurePuntos;

  @override
  void initState() {
    super.initState();
    _futurePuntos = PuntoControlService.fetchPuntos();
  }

  void _refresh() {
    setState(() {
      _futurePuntos = PuntoControlService.fetchPuntos();
    });
  }

  void _showForm({PuntoControl? punto}) async {
    final nombreController = TextEditingController(text: punto?.nombre ?? '');
    final ubicacionController = TextEditingController(text: punto?.ubicacion ?? '');
    final descripcionController = TextEditingController(text: punto?.descripcion ?? '');
    final isEdit = punto != null;

    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(isEdit ? 'Editar Punto' : 'Nuevo Punto'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: nombreController, decoration: InputDecoration(labelText: 'Nombre')),
            TextField(controller: ubicacionController, decoration: InputDecoration(labelText: 'Ubicación')),
            TextField(controller: descripcionController, decoration: InputDecoration(labelText: 'Descripción')),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () async {
              final nuevo = PuntoControl(
                id: punto?.id ?? '',
                nombre: nombreController.text,
                ubicacion: ubicacionController.text,
                descripcion: descripcionController.text,
              );
              try {
                if (isEdit) {
                  await PuntoControlService.actualizarPunto(nuevo);
                } else {
                  await PuntoControlService.crearPunto(nuevo);
                }
                Navigator.pop(context);
                _refresh();
              } catch (e) {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
              }
            },
            child: Text(isEdit ? 'Guardar' : 'Crear'),
          ),
        ],
      ),
    );
  }

  void _eliminarPunto(String id) async {
    try {
      await PuntoControlService.eliminarPunto(id);
      _refresh();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Puntos de Control')),
      body: FutureBuilder<List<PuntoControl>>(
        future: _futurePuntos,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text('No hay puntos de control.'));
          }
          final puntos = snapshot.data!;
          return ListView.builder(
            itemCount: puntos.length,
            itemBuilder: (context, i) {
              final punto = puntos[i];
              return ListTile(
                title: Text(punto.nombre),
                subtitle: Text(punto.ubicacion ?? ''),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.edit),
                      onPressed: () => _showForm(punto: punto),
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete),
                      onPressed: () => _eliminarPunto(punto.id),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showForm(),
        child: const Icon(Icons.add),
      ),
    );
  }
}
