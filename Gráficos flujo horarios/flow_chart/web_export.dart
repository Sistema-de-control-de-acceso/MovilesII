
import 'dart:convert';
import 'dart:html' as html;
import 'dart:ui' as ui;
import 'package:flutter/widgets.dart';
import 'package:flutter/rendering.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:pdf/pdf.dart';

/// Exporta el gráfico como PDF en plataformas web.
///
/// [chartKey] es la clave global del widget a exportar.
/// [filename] es el nombre del archivo PDF a descargar.
Future<void> exportPdfWeb(
  GlobalKey chartKey, {
  String filename = 'accesos_grafico.pdf',
}) async {
  // Captura el widget como imagen PNG
  final boundary = chartKey.currentContext!.findRenderObject() as RenderRepaintBoundary;
  final image = await boundary.toImage(pixelRatio: 3.0);
  final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
  final pngBytes = byteData!.buffer.asUint8List();

  // Crea el documento PDF e inserta la imagen
  final pdf = pw.Document();
  final imageProvider = pw.MemoryImage(pngBytes);
  pdf.addPage(
    pw.Page(
      pageFormat: PdfPageFormat.a4,
      build: (pw.Context context) {
        return pw.Center(
          child: pw.Image(imageProvider),
        );
      },
    ),
  );

  // Descarga el PDF usando APIs web
  final pdfBytes = await pdf.save();
  final blob = html.Blob([pdfBytes], 'application/pdf');
  final url = html.Url.createObjectUrlFromBlob(blob);
  final anchor = html.AnchorElement(href: url)
    ..setAttribute('download', filename);
  anchor.click();
  html.Url.revokeObjectUrl(url);
}

/// Exporta datos en formato CSV y los descarga en plataformas web.
///
/// [csv] es el contenido CSV a exportar.
/// [filename] es el nombre del archivo CSV a descargar.
void exportCsvWeb(String csv, {String filename = 'accesos_export.csv'}) {
  final bytes = utf8.encode(csv);
  final blob = html.Blob([bytes], 'text/csv');
  final url = html.Url.createObjectUrlFromBlob(blob);
  final anchor = html.AnchorElement(href: url)
    ..setAttribute('download', filename);
  anchor.click();
  html.Url.revokeObjectUrl(url);
}
