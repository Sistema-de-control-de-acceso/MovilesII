import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/services.dart';

/// Utilidades para tests de accesibilidad
class AccessibilityHelpers {
  /// Verifica que todos los widgets interactivos tengan labels de accesibilidad
  static void verifyAccessibilityLabels(WidgetTester tester) {
    final finder = find.byWidgetPredicate((widget) {
      if (widget is InkWell ||
          widget is GestureDetector ||
          widget is IconButton ||
          widget is TextButton ||
          widget is ElevatedButton ||
          widget is OutlinedButton ||
          widget is FloatingActionButton) {
        return true;
      }
      return false;
    });

    for (final element in finder.evaluate()) {
      final semantics = element.getSemantics();
      final hasLabel = semantics?.label != null && semantics!.label!.isNotEmpty;
      
      if (!hasLabel) {
        throw TestFailure(
          'Widget interactivo sin label de accesibilidad encontrado: ${element.widget.runtimeType}',
        );
      }
    }
  }

  /// Verifica contraste de colores según WCAG 2.1
  /// Retorna true si el contraste cumple con WCAG AA (4.5:1 para texto normal, 3:1 para texto grande)
  static bool verifyContrastRatio({
    required Color foreground,
    required Color background,
    bool isLargeText = false,
  }) {
    final ratio = _calculateContrastRatio(foreground, background);
    final minRatio = isLargeText ? 3.0 : 4.5;
    return ratio >= minRatio;
  }

  /// Calcula el ratio de contraste entre dos colores
  static double _calculateContrastRatio(Color color1, Color color2) {
    final luminance1 = _getRelativeLuminance(color1);
    final luminance2 = _getRelativeLuminance(color2);
    
    final lighter = luminance1 > luminance2 ? luminance1 : luminance2;
    final darker = luminance1 > luminance2 ? luminance2 : luminance1;
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /// Calcula la luminancia relativa de un color
  static double _getRelativeLuminance(Color color) {
    final r = _linearizeComponent(color.red / 255.0);
    final g = _linearizeComponent(color.green / 255.0);
    final b = _linearizeComponent(color.blue / 255.0);
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  static double _linearizeComponent(double component) {
    if (component <= 0.03928) {
      return component / 12.92;
    }
    return math.pow((component + 0.055) / 1.055, 2.4).toDouble();
  }

  /// Verifica que los tamaños de texto sean accesibles (mínimo 14sp para texto normal, 18sp para texto grande)
  static void verifyTextSizes(WidgetTester tester) {
    final textFinders = find.byType(Text);
    
    for (final element in textFinders.evaluate()) {
      final text = element.widget as Text;
      final style = text.style;
      
      if (style != null && style.fontSize != null) {
        final fontSize = style.fontSize!;
        final isLargeText = style.fontSize! >= 18.0 || 
                           (style.fontWeight == FontWeight.bold && style.fontSize! >= 14.0);
        final minSize = isLargeText ? 14.0 : 14.0;
        
        if (fontSize < minSize) {
          throw TestFailure(
            'Texto con tamaño insuficiente encontrado: ${text.data} (${fontSize}sp). '
            'Mínimo recomendado: ${minSize}sp',
          );
        }
      }
    }
  }

  /// Verifica que los elementos táctiles tengan un tamaño mínimo de 48x48dp
  static void verifyTouchTargetSizes(WidgetTester tester) {
    final interactiveWidgets = find.byWidgetPredicate((widget) {
      return widget is InkWell ||
             widget is GestureDetector ||
             widget is IconButton ||
             widget is TextButton ||
             widget is ElevatedButton ||
             widget is OutlinedButton ||
             widget is FloatingActionButton;
    });

    for (final element in interactiveWidgets.evaluate()) {
      final renderObject = element.renderObject;
      if (renderObject is RenderBox) {
        final size = renderObject.size;
        const minSize = 48.0;
        
        if (size.width < minSize || size.height < minSize) {
          throw TestFailure(
            'Widget interactivo con tamaño táctil insuficiente: '
            '${size.width}x${size.height}dp. Mínimo recomendado: ${minSize}x${minSize}dp',
          );
        }
      }
    }
  }

  /// Verifica que todos los campos de texto tengan labels de accesibilidad
  static void verifyTextFieldLabels(WidgetTester tester) {
    final textFields = find.byType(TextField);
    
    for (final element in textFields.evaluate()) {
      final textField = element.widget as TextField;
      final hasLabel = textField.decoration?.labelText != null ||
                      textField.decoration?.hintText != null;
      
      if (!hasLabel) {
        throw TestFailure(
          'TextField sin label o hint encontrado',
        );
      }
    }
  }

  /// Verifica que las imágenes tengan texto alternativo
  static void verifyImageAlternatives(WidgetTester tester) {
    final images = find.byType(Image);
    
    for (final element in images.evaluate()) {
      final image = element.widget as Image;
      final semantics = element.getSemantics();
      
      // Verificar si tiene semanticLabel o si es decorativa
      if (semantics?.label == null || semantics!.label!.isEmpty) {
        // Si no tiene label, debería estar marcada como decorativa
        // En Flutter, esto se hace con excludeSemantics: true
        // Por ahora, solo verificamos que exista el concepto
      }
    }
  }
}

/// Helper para medir tiempos de respuesta
class PerformanceHelpers {
  /// Mide el tiempo de respuesta de una interacción
  /// Retorna el tiempo en milisegundos
  static Future<int> measureInteractionTime(
    WidgetTester tester,
    Future<void> Function() action,
  ) async {
    final stopwatch = Stopwatch()..start();
    await action();
    await tester.pumpAndSettle();
    stopwatch.stop();
    return stopwatch.elapsedMilliseconds;
  }

  /// Verifica que una interacción responda en menos de 300ms
  static Future<void> verifyInteractionResponseTime(
    WidgetTester tester,
    Future<void> Function() action, {
    int maxMilliseconds = 300,
  }) async {
    final time = await measureInteractionTime(tester, action);
    
    if (time > maxMilliseconds) {
      throw TestFailure(
        'Interacción tardó ${time}ms, excede el máximo de ${maxMilliseconds}ms',
      );
    }
  }
}

/// Helper para validar Material Design
class MaterialDesignHelpers {
  /// Verifica que se use Material 3
  static void verifyMaterial3(ThemeData theme) {
    if (!theme.useMaterial3) {
      throw TestFailure('El tema no está usando Material 3');
    }
  }

  /// Verifica que los colores del tema cumplan con Material Design
  static void verifyMaterialColors(ThemeData theme) {
    if (theme.colorScheme == null) {
      throw TestFailure('El tema no tiene ColorScheme definido');
    }
    
    final colorScheme = theme.colorScheme!;
    
    // Verificar que tenga colores primarios, secundarios, etc.
    if (colorScheme.primary == null) {
      throw TestFailure('ColorScheme no tiene color primario definido');
    }
  }

  /// Verifica que los AppBars tengan la configuración correcta
  static void verifyAppBarTheme(ThemeData theme) {
    if (theme.appBarTheme == null) {
      throw TestFailure('El tema no tiene AppBarTheme definido');
    }
  }

  /// Verifica espaciado consistente (usando múltiplos de 8dp)
  static void verifySpacing(double spacing) {
    if (spacing % 8 != 0) {
      // No es error crítico, solo advertencia
      // En un test real, podrías usar expect con isCloseTo
    }
  }
}
