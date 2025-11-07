import 'package:flutter/material.dart';
import '../models/pulsera_asociacion_model.dart';
import '../services/pulsera_asociacion_service.dart';
import '../services/nfc_precise_reader_service.dart';

/// Pantalla de Gestión de Asociaciones Pulsera-Estudiante
class PulseraAsociacionScreen extends StatefulWidget {
  const PulseraAsociacionScreen({Key? key}) : super(key: key);

  @override
  State<PulseraAsociacionScreen> createState() => _PulseraAsociacionScreenState();
}

class _PulseraAsociacionScreenState extends State<PulseraAsociacionScreen> {
  final PulseraAsociacionService _service = PulseraAsociacionService();
  final NFCPreciseReaderService _nfcService = NFCPreciseReaderService();
  
  List<PulseraAsociacion> _asociaciones = [];
  AsociacionesStats? _stats;
  bool _isLoading = false;
  String? _selectedFilter;

  @override
  void initState() {
    super.initState();
    _cargarDatos();
  }

  Future<void> _cargarDatos() async {
    setState(() => _isLoading = true);

    try {
      final asociaciones = await _service.listarAsociaciones(
        estado: _selectedFilter,
      );
      final stats = await _service.obtenerEstadisticas();

      setState(() {
        _asociaciones = asociaciones;
        _stats = stats;
      });
    } catch (e) {
      _mostrarError('Error cargando datos: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _mostrarDialogoNuevaAsociacion() async {
    final pulseraIdController = TextEditingController();
    final codigoController = TextEditingController();
    bool usarNFC = false;

    await showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Nueva Asociación'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Opción de lectura NFC
              SwitchListTile(
                title: const Text('Leer con NFC'),
                value: usarNFC,
                onChanged: (value) {
                  setDialogState(() => usarNFC = value);
                  if (value) {
                    _leerPulseraConNFC(pulseraIdController);
                  }
                },
              ),
              
              const SizedBox(height: 16),
              
              // ID de pulsera
              TextField(
                controller: pulseraIdController,
                decoration: const InputDecoration(
                  labelText: 'ID de Pulsera',
                  hintText: '04:12:34:56:78:90:AB:CD',
                  helperText: 'Formato hexadecimal',
                ),
                enabled: !usarNFC,
              ),
              
              const SizedBox(height: 16),
              
              // Código universitario
              TextField(
                controller: codigoController,
                decoration: const InputDecoration(
                  labelText: 'Código Universitario',
                  hintText: 'Ej: 2020001234',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancelar'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (pulseraIdController.text.isEmpty || 
                    codigoController.text.isEmpty) {
                  _mostrarError('Complete todos los campos');
                  return;
                }

                try {
                  await _service.crearAsociacion(
                    pulseraId: pulseraIdController.text,
                    codigoUniversitario: codigoController.text,
                  );

                  Navigator.of(context).pop();
                  _mostrarExito('Asociación creada exitosamente');
                  _cargarDatos();
                } catch (e) {
                  _mostrarError(e.toString());
                }
              },
              child: const Text('Crear'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _leerPulseraConNFC(TextEditingController controller) async {
    try {
      await _nfcService.initialize();
      
      await _nfcService.startPreciseReading(
        onIdRead: (uniqueId) {
          controller.text = uniqueId;
          _nfcService.stopReading();
        },
        onReadError: (error) {
          _mostrarError('Error leyendo NFC: $error');
        },
      );
    } catch (e) {
      _mostrarError('Error iniciando NFC: $e');
    }
  }

  Future<void> _verificarPulsera() async {
    final controller = TextEditingController();

    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Verificar Pulsera'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            labelText: 'ID de Pulsera',
            hintText: '04:12:34:56:78:90:AB:CD',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () async {
              try {
                final resultado = await _service.verificarPulsera(
                  controller.text,
                );

                Navigator.of(context).pop();
                _mostrarResultadoVerificacion(resultado);
              } catch (e) {
                _mostrarError('Error verificando: $e');
              }
            },
            child: const Text('Verificar'),
          ),
        ],
      ),
    );
  }

  void _mostrarResultadoVerificacion(VerificacionPulseraResult resultado) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          resultado.encontrado ? 'Pulsera Encontrada' : 'Pulsera No Encontrada',
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (resultado.encontrado && resultado.asociacion != null) ...[
              Text('Estudiante: ${resultado.asociacion!.estudiante.nombreCompleto}'),
              Text('Código: ${resultado.asociacion!.estudiante.codigoUniversitario}'),
              Text('Estado: ${resultado.asociacion!.estado}'),
              Text('Lecturas: ${resultado.asociacion!.contadorLecturas}'),
            ] else ...[
              Text(resultado.error ?? 'Pulsera no encontrada'),
              if (resultado.accionRecomendada != null)
                Text('\n${resultado.accionRecomendada}'),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cerrar'),
          ),
        ],
      ),
    );
  }

  void _mostrarError(String mensaje) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(mensaje),
        backgroundColor: Colors.red,
      ),
    );
  }

  void _mostrarExito(String mensaje) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(mensaje),
        backgroundColor: Colors.green,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Asociaciones Pulsera-Estudiante'),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: _verificarPulsera,
            tooltip: 'Verificar Pulsera',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _cargarDatos,
          ),
        ],
      ),
      body: Column(
        children: [
          // Estadísticas
          if (_stats != null) _buildStatsCard(),
          
          // Filtros
          _buildFilters(),
          
          // Lista de asociaciones
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _asociaciones.isEmpty
                    ? const Center(child: Text('No hay asociaciones'))
                    : ListView.builder(
                        itemCount: _asociaciones.length,
                        itemBuilder: (context, index) {
                          final asociacion = _asociaciones[index];
                          return _buildAsociacionCard(asociacion);
                        },
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _mostrarDialogoNuevaAsociacion,
        child: const Icon(Icons.add),
        tooltip: 'Nueva Asociación',
      ),
    );
  }

  Widget _buildStatsCard() {
    return Card(
      margin: const EdgeInsets.all(8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildStatItem('Total', _stats!.total.toString(), Colors.blue),
            _buildStatItem('Activas', _stats!.porEstado.activas.toString(), Colors.green),
            _buildStatItem('Inactivas', _stats!.porEstado.inactivas.toString(), Colors.grey),
            _buildStatItem('Perdidas', _stats!.porEstado.perdidas.toString(), Colors.red),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(label, style: const TextStyle(fontSize: 12)),
      ],
    );
  }

  Widget _buildFilters() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          const Text('Filtrar: '),
          const SizedBox(width: 8),
          ChoiceChip(
            label: const Text('Todas'),
            selected: _selectedFilter == null,
            onSelected: (selected) {
              if (selected) {
                setState(() => _selectedFilter = null);
                _cargarDatos();
              }
            },
          ),
          const SizedBox(width: 8),
          ChoiceChip(
            label: const Text('Activas'),
            selected: _selectedFilter == 'activa',
            onSelected: (selected) {
              setState(() => _selectedFilter = selected ? 'activa' : null);
              _cargarDatos();
            },
          ),
          const SizedBox(width: 8),
          ChoiceChip(
            label: const Text('Inactivas'),
            selected: _selectedFilter == 'inactiva',
            onSelected: (selected) {
              setState(() => _selectedFilter = selected ? 'inactiva' : null);
              _cargarDatos();
            },
          ),
        ],
      ),
    );
  }

  Widget _buildAsociacionCard(PulseraAsociacion asociacion) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _getEstadoColor(asociacion.estado),
          child: Icon(
            _getEstadoIcon(asociacion.estado),
            color: Colors.white,
          ),
        ),
        title: Text(asociacion.estudiante.nombreCompleto),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Código: ${asociacion.estudiante.codigoUniversitario}'),
            Text('Pulsera: ${asociacion.pulseraId}'),
            Text('Estado: ${asociacion.estado}'),
          ],
        ),
        trailing: PopupMenuButton<String>(
          onSelected: (value) => _onMenuSelected(value, asociacion),
          itemBuilder: (context) => [
            if (asociacion.estado != 'activa')
              const PopupMenuItem(
                value: 'activar',
                child: Text('Activar'),
              ),
            if (asociacion.estado == 'activa')
              const PopupMenuItem(
                value: 'desactivar',
                child: Text('Desactivar'),
              ),
            const PopupMenuItem(
              value: 'perdida',
              child: Text('Reportar Perdida'),
            ),
            const PopupMenuItem(
              value: 'eliminar',
              child: Text('Eliminar'),
            ),
          ],
        ),
        onTap: () => _mostrarDetalles(asociacion),
      ),
    );
  }

  Color _getEstadoColor(String estado) {
    switch (estado) {
      case 'activa':
        return Colors.green;
      case 'inactiva':
        return Colors.grey;
      case 'suspendida':
        return Colors.orange;
      case 'perdida':
        return Colors.red;
      default:
        return Colors.blue;
    }
  }

  IconData _getEstadoIcon(String estado) {
    switch (estado) {
      case 'activa':
        return Icons.check_circle;
      case 'inactiva':
        return Icons.cancel;
      case 'suspendida':
        return Icons.pause_circle;
      case 'perdida':
        return Icons.warning;
      default:
        return Icons.info;
    }
  }

  Future<void> _onMenuSelected(String value, PulseraAsociacion asociacion) async {
    try {
      switch (value) {
        case 'activar':
          await _service.actualizarEstado(
            id: asociacion.id,
            estado: 'activa',
          );
          break;
        case 'desactivar':
          await _service.actualizarEstado(
            id: asociacion.id,
            estado: 'inactiva',
            motivo: 'Desactivada por usuario',
          );
          break;
        case 'perdida':
          await _service.actualizarEstado(
            id: asociacion.id,
            estado: 'perdida',
            motivo: 'Pulsera reportada como perdida',
          );
          break;
        case 'eliminar':
          await _service.eliminarAsociacion(id: asociacion.id);
          break;
      }

      _mostrarExito('Acción completada exitosamente');
      _cargarDatos();
    } catch (e) {
      _mostrarError('Error: $e');
    }
  }

  void _mostrarDetalles(PulseraAsociacion asociacion) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Detalles de Asociación'),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildDetailRow('Pulsera ID', asociacion.pulseraId),
              _buildDetailRow('Estudiante', asociacion.estudiante.nombreCompleto),
              _buildDetailRow('Código', asociacion.estudiante.codigoUniversitario),
              _buildDetailRow('DNI', asociacion.estudiante.dni),
              _buildDetailRow('Facultad', asociacion.estudiante.facultad ?? '-'),
              _buildDetailRow('Escuela', asociacion.estudiante.escuela ?? '-'),
              _buildDetailRow('Estado', asociacion.estado),
              _buildDetailRow('Fecha Asociación', 
                asociacion.fechaAsociacion.toString().substring(0, 19)),
              _buildDetailRow('Lecturas', asociacion.contadorLecturas.toString()),
              if (asociacion.ultimaLectura != null)
                _buildDetailRow('Última Lectura',
                  asociacion.ultimaLectura!.toString().substring(0, 19)),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cerrar'),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: Text(value),
          ),
        ],
      ),
    );
  }
}

