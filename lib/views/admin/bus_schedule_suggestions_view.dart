import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../widgets/status_widgets.dart';
import '../../widgets/custom_button.dart';

/// Vista para mostrar y gestionar sugerencias de horarios de buses
class BusScheduleSuggestionsView extends StatefulWidget {
  @override
  _BusScheduleSuggestionsViewState createState() => _BusScheduleSuggestionsViewState();
}

class _BusScheduleSuggestionsViewState extends State<BusScheduleSuggestionsView> {
  final ApiService _apiService = ApiService();
  
  bool _isLoading = false;
  String? _errorMessage;
  Map<String, dynamic>? _suggestionsData;
  Map<String, dynamic>? _efficiencyMetrics;
  Map<String, dynamic>? _demandPatterns;

  String? _selectedRuta;
  String? _selectedDiaSemana;
  List<String> _rutas = [];
  final List<String> _diasSemana = [
    'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'
  ];

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    await _loadRutas();
    await _loadEfficiencyMetrics();
  }

  Future<void> _loadRutas() async {
    try {
      // Obtener rutas desde viajes
      final response = await _apiService.get('/viajes-buses');
      if (response['success'] == true) {
        final viajes = response['viajes'] as List?;
        if (viajes != null) {
          final rutasUnicas = viajes
              .map((v) => v['ruta'] as String?)
              .where((r) => r != null)
              .toSet()
              .toList()
              .cast<String>();
          setState(() {
            _rutas = rutasUnicas;
            if (_rutas.isNotEmpty && _selectedRuta == null) {
              _selectedRuta = _rutas.first;
            }
          });
        }
      }
    } catch (e) {
      print('Error cargando rutas: $e');
    }
  }

  Future<void> _loadEfficiencyMetrics() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _apiService.get('/api/buses/optimization/transport-efficiency');
      if (response['success'] == true) {
        setState(() {
          _efficiencyMetrics = response['metrics'];
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _analyzeDemandPatterns() async {
    if (_selectedRuta == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Seleccione una ruta')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _apiService.get(
        '/api/buses/optimization/demand-patterns?ruta=$_selectedRuta'
      );
      
      if (response['success'] == true) {
        setState(() {
          _demandPatterns = response;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _generateOptimalSchedule() async {
    if (_selectedRuta == null || _selectedDiaSemana == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Seleccione ruta y día de la semana')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _apiService.post(
        '/api/buses/optimization/generate-schedule',
        {
          'ruta': _selectedRuta,
          'dia_semana': _selectedDiaSemana,
          'capacidad_bus': 50,
          'ocupacion_objetivo': 80,
        },
      );
      
      if (response['success'] == true) {
        setState(() {
          _suggestionsData = response;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _generateAllSuggestions() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _apiService.post(
        '/api/buses/optimization/generate-suggestions',
        {
          'rutas': _rutas,
          'dias_semana': ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
          'ocupacion_objetivo': 80,
          'save_suggestions': true,
        },
      );
      
      if (response['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${response['saved_count']} sugerencias generadas y guardadas'),
            backgroundColor: Colors.green,
          ),
        );
        setState(() {
          _suggestionsData = response;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Optimización de Horarios de Buses'),
        backgroundColor: Colors.blue[700],
        foregroundColor: Colors.white,
      ),
      body: _isLoading && _suggestionsData == null
          ? LoadingWidget(message: 'Generando sugerencias...')
          : SingleChildScrollView(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Métricas de eficiencia actuales
                  if (_efficiencyMetrics != null) _buildEfficiencyMetricsCard(),
                  SizedBox(height: 16),

                  // Filtros
                  _buildFiltersCard(),
                  SizedBox(height: 16),

                  // Análisis de demanda
                  if (_demandPatterns != null) _buildDemandPatternsCard(),
                  SizedBox(height: 16),

                  // Sugerencias generadas
                  if (_suggestionsData != null) _buildSuggestionsCard(),
                  
                  // Mensajes de error
                  if (_errorMessage != null)
                    Container(
                      padding: EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.red[50],
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.red[200]!),
                      ),
                      child: Text(
                        _errorMessage!,
                        style: TextStyle(color: Colors.red[700]),
                      ),
                    ),
                ],
              ),
            ),
    );
  }

  Widget _buildEfficiencyMetricsCard() {
    final metrics = _efficiencyMetrics!;
    
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.analytics, color: Colors.blue[700]),
                SizedBox(width: 8),
                Text(
                  'Métricas de Eficiencia Actuales',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildMetricItem(
                    'Ocupación Promedio',
                    '${(metrics['tasaOcupacionPromedio'] as num?)?.toStringAsFixed(1) ?? '0'}%',
                    Icons.people,
                    Colors.blue,
                  ),
                ),
                Expanded(
                  child: _buildMetricItem(
                    'Costo por Pasajero',
                    'S/ ${(metrics['costoPorPasajero'] as num?)?.toStringAsFixed(2) ?? '0'}',
                    Icons.attach_money,
                    Colors.green,
                  ),
                ),
              ],
            ),
            SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildMetricItem(
                    'Tiempo Promedio',
                    '${(metrics['tiempoViajePromedio'] as num?)?.toStringAsFixed(0) ?? '0'} min',
                    Icons.access_time,
                    Colors.orange,
                  ),
                ),
                Expanded(
                  child: _buildMetricItem(
                    'Eficiencia General',
                    '${(metrics['eficienciaGeneral'] as num?)?.toStringAsFixed(1) ?? '0'}%',
                    Icons.trending_up,
                    Colors.purple,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricItem(String label, String value, IconData icon, Color color) {
    return Container(
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: color[900],
            ),
          ),
          SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildFiltersCard() {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Filtros',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _selectedRuta,
              decoration: InputDecoration(
                labelText: 'Ruta',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.route),
              ),
              items: _rutas.map((ruta) {
                return DropdownMenuItem(
                  value: ruta,
                  child: Text(ruta),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _selectedRuta = value;
                });
              },
            ),
            SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _selectedDiaSemana,
              decoration: InputDecoration(
                labelText: 'Día de la Semana',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.calendar_today),
              ),
              items: _diasSemana.map((dia) {
                return DropdownMenuItem(
                  value: dia,
                  child: Text(dia[0].toUpperCase() + dia.substring(1)),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _selectedDiaSemana = value;
                });
              },
            ),
            SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: CustomButton(
                    text: 'Analizar Demanda',
                    icon: Icons.bar_chart,
                    onPressed: _analyzeDemandPatterns,
                  ),
                ),
                SizedBox(width: 8),
                Expanded(
                  child: CustomButton(
                    text: 'Generar Horarios',
                    icon: Icons.schedule,
                    onPressed: _generateOptimalSchedule,
                  ),
                ),
              ],
            ),
            SizedBox(height: 8),
            CustomButton(
              text: 'Generar Todas las Sugerencias',
              icon: Icons.auto_awesome,
              onPressed: _generateAllSuggestions,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDemandPatternsCard() {
    final patterns = _demandPatterns!;
    final hourlyDemand = patterns['hourlyDemand'] as Map<String, dynamic>?;
    final peakHours = patterns['peakHours'] as List?;

    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.trending_up, color: Colors.orange[700]),
                SizedBox(width: 8),
                Text(
                  'Patrones de Demanda',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            SizedBox(height: 16),
            if (peakHours != null && peakHours.isNotEmpty)
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.orange[200]!),
                ),
                child: Row(
                  children: [
                    Icon(Icons.warning_amber, color: Colors.orange[700]),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Horas Pico: ${peakHours.map((h) => '${h}:00').join(', ')}',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.orange[900],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            SizedBox(height: 16),
            if (hourlyDemand != null)
              ...hourlyDemand.entries.map((entry) {
                final hora = entry.key;
                final stats = entry.value as Map<String, dynamic>;
                return _buildHourlyDemandItem(hora, stats);
              }).toList(),
          ],
        ),
      ),
    );
  }

  Widget _buildHourlyDemandItem(String hora, Map<String, dynamic> stats) {
    final isPeak = _demandPatterns?['peakHours']?.contains(int.parse(hora)) ?? false;
    
    return Container(
      margin: EdgeInsets.only(bottom: 8),
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isPeak ? Colors.orange[50] : Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isPeak ? Colors.orange[200]! : Colors.grey[300]!,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 60,
            child: Text(
              '${hora}:00',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${stats['totalPasajeros']?.toString() ?? '0'} pasajeros',
                  style: TextStyle(fontWeight: FontWeight.w500),
                ),
                Text(
                  '${stats['numeroViajes']?.toString() ?? '0'} viajes | Ocupación: ${(stats['promedioOcupacion'] as num?)?.toStringAsFixed(1) ?? '0'}%',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSuggestionsCard() {
    final suggestions = _suggestionsData!['suggestions'] as List?;
    
    if (suggestions == null || suggestions.isEmpty) {
      return Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Text('No se generaron sugerencias'),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.lightbulb, color: Colors.amber[700]),
                SizedBox(width: 8),
                Text(
                  'Sugerencias de Horarios Optimizados',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            SizedBox(height: 8),
            Text(
              'Total: ${suggestions.length} sugerencias',
              style: TextStyle(color: Colors.grey[600]),
            ),
            SizedBox(height: 16),
            ...suggestions.take(20).map((suggestion) {
              return _buildSuggestionItem(suggestion);
            }).toList(),
            if (suggestions.length > 20)
              Padding(
                padding: EdgeInsets.only(top: 8),
                child: Text(
                  '... y ${suggestions.length - 20} sugerencias más',
                  style: TextStyle(
                    fontStyle: FontStyle.italic,
                    color: Colors.grey[600],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSuggestionItem(Map<String, dynamic> suggestion) {
    final prioridad = suggestion['prioridad'] as String?;
    final prioridadColor = {
      'alta': Colors.red,
      'media': Colors.orange,
      'baja': Colors.green,
    }[prioridad] ?? Colors.grey;

    final metrics = suggestion['metrics'] as Map<String, dynamic>?;
    final eficiencia = metrics?['eficiencia'] ?? 0;

    return Container(
      margin: EdgeInsets.only(bottom: 12),
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[300]!),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: prioridadColor[100],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: prioridadColor[400]!),
                ),
                child: Text(
                  prioridad?.toUpperCase() ?? 'MEDIA',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: prioridadColor[800],
                  ),
                ),
              ),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  suggestion['ruta'] ?? '',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ),
              Container(
                padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${(eficiencia as num).toStringAsFixed(0)}%',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue[900],
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.schedule, size: 16, color: Colors.grey[600]),
              SizedBox(width: 4),
              Text(
                '${suggestion['horario_salida']} - ${suggestion['horario_llegada']}',
                style: TextStyle(fontWeight: FontWeight.w500),
              ),
              SizedBox(width: 16),
              Icon(Icons.calendar_today, size: 16, color: Colors.grey[600]),
              SizedBox(width: 4),
              Text(
                suggestion['dia_semana'] ?? '',
                style: TextStyle(fontWeight: FontWeight.w500),
              ),
            ],
          ),
          SizedBox(height: 8),
            if (metrics != null)
              Row(
                children: [
                  _buildMiniMetric('Ocupación', '${(metrics['ocupacion_esperada'] as num?)?.toStringAsFixed(1) ?? '0'}%'),
                  SizedBox(width: 8),
                  _buildMiniMetric('Demanda', '${(metrics['demanda_esperada'] as num?)?.toStringAsFixed(0) ?? '0'}'),
                  SizedBox(width: 8),
                  _buildMiniMetric('Costo', 'S/ ${(metrics['costo_esperado'] as num?)?.toStringAsFixed(2) ?? '0'}'),
                ],
              ),
          SizedBox(height: 8),
          if (suggestion['razon'] != null)
            Container(
              padding: EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.blue[50],
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                suggestion['razon'],
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.blue[900],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildMiniMetric(String label, String value) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        '$label: $value',
        style: TextStyle(
          fontSize: 11,
          color: Colors.grey[700],
        ),
      ),
    );
  }
}

