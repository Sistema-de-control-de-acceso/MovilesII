import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../flow_chart_view.dart';

/// Widget que muestra el gráfico de flujo de accesos.
/// Recibe los datos y un callback para interacción (drill-down).
class FlowChartWidget extends StatelessWidget {
  final List<FlowChartData> data;
  final void Function(FlowChartData)? onBarTap;
  final String chartType; // 'barras', 'lineas', 'area'

  const FlowChartWidget({
    Key? key,
    required this.data,
    this.onBarTap,
    this.chartType = 'barras',
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final textColor = Theme.of(context).colorScheme.onSurface;
    if (data.isEmpty) {
      return Center(
        child: Text(
          'No hay datos para mostrar.',
          style: TextStyle(color: textColor),
        ),
      );
    }

    switch (chartType) {
      case 'barras':
        return _buildBarChart(context);
      case 'lineas':
        return _buildLineChart(context);
      case 'area':
        return _buildAreaChart(context);
      default:
        return _buildBarChart(context);
    }
  }

  /// Construye el gráfico de barras
  Widget _buildBarChart(BuildContext context) {
    final max = data.map((e) => e.value).fold(0, (a, b) => a > b ? a : b);
    Color barColor(int value) {
      final t = max == 0 ? 0.0 : value / max;
      return Color.lerp(Colors.lightBlue, Colors.redAccent, t)!;
    }
    return BarChart(
      BarChartData(
        alignment: BarChartAlignment.spaceAround,
        maxY: max.toDouble() + 2,
        barTouchData: BarTouchData(
          touchTooltipData: BarTouchTooltipData(
            getTooltipItem: (group, groupIndex, rod, rodIndex) {
              final item = data[groupIndex];
              return BarTooltipItem(
                '${item.label}\n',
                const TextStyle(color: Colors.amber, fontWeight: FontWeight.bold, fontSize: 14),
                children: [
                  TextSpan(text: 'Accesos: ', style: const TextStyle(color: Colors.white70)),
                  TextSpan(text: '${item.value}\n', style: const TextStyle(color: Colors.white)),
                  if (item.userType != null) TextSpan(text: 'Usuario: ${item.userType}\n', style: const TextStyle(color: Colors.lightBlueAccent)),
                  if (item.location != null) TextSpan(text: 'Ubicación: ${item.location}', style: const TextStyle(color: Colors.greenAccent)),
                ],
              );
            },
            fitInsideVertically: true,
            fitInsideHorizontally: true,
            tooltipPadding: const EdgeInsets.all(12),
            tooltipMargin: 8,
          ),
          touchCallback: (event, response) {
            if (event.isInterestedForInteractions && response != null && response.spot != null && onBarTap != null) {
              onBarTap!(data[response.spot!.touchedBarGroupIndex]);
            }
          },
        ),
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            sideTitles: SideTitles(showTitles: true),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) {
                final idx = value.toInt();
                if (idx < 0 || idx >= data.length) return const SizedBox();
                return Text(data[idx].label, style: const TextStyle(fontSize: 12));
              },
            ),
          ),
        ),
        barGroups: [
          for (int i = 0; i < data.length; i++)
            BarChartGroupData(
              x: i,
              barRods: [
                BarChartRodData(
                  toY: data[i].value.toDouble(),
                  color: barColor(data[i].value),
                  width: 18,
                  borderRadius: BorderRadius.circular(6),
                ),
              ],
            ),
        ],
      ),
    );
  }

  /// Construye el gráfico de líneas (placeholder)
  Widget _buildLineChart(BuildContext context) {
    // Implementación futura: puedes usar LineChart de fl_chart
    return Center(child: Text('Gráfico de líneas próximamente'));
  }

  /// Construye el gráfico de área (placeholder)
  Widget _buildAreaChart(BuildContext context) {
    // Implementación futura: puedes usar LineChart con área
    return Center(child: Text('Gráfico de área próximamente'));
  }
}
          ),
          titlesData: FlTitlesData(
            leftTitles: AxisTitles(
              sideTitles: SideTitles(showTitles: true, reservedSize: 28),
            ),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                getTitlesWidget: (double value, TitleMeta meta) {
                  final idx = value.toInt();
                  if (idx < 0 || idx >= data.length) return const SizedBox.shrink();
                  return SideTitleWidget(
                    child: Text(data[idx].label, style: TextStyle(fontSize: 10, color: textColor)),
                    meta: meta,
                  );
                },
              ),
            ),
          ),
          borderData: FlBorderData(show: false),
          barGroups: [
            for (int i = 0; i < data.length; i++)
              BarChartGroupData(
                x: i,
                barRods: [
                  BarChartRodData(
                    toY: data[i].value.toDouble(),
                    color: barColor(data[i].value),
                    width: 18,
                    borderRadius: BorderRadius.circular(4),
                    backDrawRodData: BackgroundBarChartRodData(show: true, toY: max.toDouble() + 2, color: Colors.grey[200]!),
                  ),
                ],
              ),
          ],
        ),
        swapAnimationDuration: const Duration(milliseconds: 600),
        swapAnimationCurve: Curves.easeInOut,
      );
    } else if (chartType == 'lineas' || chartType == 'area') {
      return LineChart(
        LineChartData(
          lineBarsData: [
            LineChartBarData(
              spots: [
                for (int i = 0; i < data.length; i++)
                  FlSpot(i.toDouble(), data[i].value.toDouble()),
              ],
              isCurved: true,
              color: chartType == 'area' ? Colors.blueAccent.withOpacity(0.6) : Colors.blueAccent,
              barWidth: 4,
              belowBarData: BarAreaData(show: chartType == 'area', color: Colors.blueAccent.withOpacity(0.2)),
              dotData: FlDotData(show: true),
            ),
          ],
          titlesData: FlTitlesData(
            leftTitles: AxisTitles(
              sideTitles: SideTitles(showTitles: true, reservedSize: 28),
            ),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                getTitlesWidget: (double value, TitleMeta meta) {
                  final idx = value.toInt();
                  if (idx < 0 || idx >= data.length) return const SizedBox.shrink();
                  return SideTitleWidget(
                    child: Text(data[idx].label, style: TextStyle(fontSize: 10, color: textColor)),
                    meta: meta,
                  );
                },
              ),
            ),
          ),
          borderData: FlBorderData(show: false),
        ),
      );
    } else {
      return const SizedBox.shrink();
    }
  }
}
