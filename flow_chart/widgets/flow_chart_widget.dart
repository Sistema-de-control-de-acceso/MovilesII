import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../flow_chart_view.dart';

/// Widget que muestra el gráfico de flujo de accesos.
/// Recibe los datos y un callback para drill-down.
class FlowChartWidget extends StatelessWidget {
  final List<FlowChartData> data;
  final void Function(FlowChartData)? onBarTap;

  const FlowChartWidget({
    Key? key,
    required this.data,
    this.onBarTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) {
      return const Center(child: Text('No hay datos para mostrar.'));
    }
    return BarChart(
      BarChartData(
        alignment: BarChartAlignment.spaceAround,
        maxY: data.map((e) => e.value).fold(0, (a, b) => a > b ? a : b).toDouble() + 2,
        barTouchData: BarTouchData(
          touchTooltipData: BarTouchTooltipData(
            tooltipBgColor: Colors.blueGrey,
            getTooltipItem: (group, groupIndex, rod, rodIndex) {
              final item = data[groupIndex];
              return BarTooltipItem(
                '${item.label}\n',
                const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                children: [TextSpan(text: '${item.value} accesos')],
              );
            },
          ),
          touchCallback: (event, response) {
            if (event.isInterestedForInteractions && response != null && response.spot != null && onBarTap != null) {
              onBarTap!(data[response.spot!.touchedBarGroupIndex]);
            }
          },
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
                  axisSide: meta.axisSide,
                  child: Text(data[idx].label, style: const TextStyle(fontSize: 10)),
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
                  color: Colors.blueAccent,
                  width: 18,
                  borderRadius: BorderRadius.circular(4),
                ),
              ],
            ),
        ],
      ),
    );
  }
}
