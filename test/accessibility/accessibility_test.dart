import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:moviles2/viewmodels/auth_viewmodel.dart';
import 'package:moviles2/viewmodels/admin_viewmodel.dart';
import '../utils/accessibility_helpers.dart';

/// Tests de accesibilidad automatizados
void main() {
  group('Tests de Accesibilidad', () {
    testWidgets('Verifica labels de accesibilidad en widgets interactivos', (tester) async {
      // Widget de prueba simple con botones
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            appBar: AppBar(title: const Text('Test')),
            body: Column(
              children: [
                ElevatedButton(
                  onPressed: () {},
                  child: const Text('Botón'),
                ),
                IconButton(
                  icon: const Icon(Icons.add),
                  onPressed: () {},
                  tooltip: 'Agregar',
                ),
                TextButton(
                  onPressed: () {},
                  child: const Text('Texto'),
                ),
              ],
            ),
          ),
        ),
      );

      // Verificar que no se lance excepción
      expect(() => AccessibilityHelpers.verifyAccessibilityLabels(tester), returnsNormally);
    });

    testWidgets('Verifica contraste de colores según WCAG', (tester) async {
      // Texto negro sobre fondo blanco
      final blackOnWhite = AccessibilityHelpers.verifyContrastRatio(
        foreground: Colors.black,
        background: Colors.white,
      );
      expect(blackOnWhite, isTrue, reason: 'Negro sobre blanco debe tener buen contraste');

      // Texto blanco sobre fondo blanco (malo)
      final whiteOnWhite = AccessibilityHelpers.verifyContrastRatio(
        foreground: Colors.white,
        background: Colors.white,
      );
      expect(whiteOnWhite, isFalse, reason: 'Blanco sobre blanco no debe tener buen contraste');

      // Texto azul oscuro sobre blanco (bueno)
      final blueOnWhite = AccessibilityHelpers.verifyContrastRatio(
        foreground: Colors.blue.shade900,
        background: Colors.white,
      );
      expect(blueOnWhite, isTrue, reason: 'Azul oscuro sobre blanco debe tener buen contraste');
    });

    testWidgets('Verifica tamaños de texto accesibles', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Column(
              children: [
                const Text('Texto normal', style: TextStyle(fontSize: 14)),
                const Text('Texto grande', style: TextStyle(fontSize: 18)),
                Text('Texto pequeño', style: TextStyle(fontSize: 12)), // Este debería fallar
              ],
            ),
          ),
        ),
      );

      // Verificar tamaños mínimos
      expect(
        () => AccessibilityHelpers.verifyTextSizes(tester),
        throwsA(isA<TestFailure>()),
      );
    });

    testWidgets('Verifica tamaños de targets táctiles (mínimo 48x48dp)', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Column(
              children: [
                SizedBox(
                  width: 48,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () {},
                    child: const Text('OK'),
                  ),
                ),
                SizedBox(
                  width: 40,
                  height: 40,
                  child: IconButton(
                    icon: const Icon(Icons.add),
                    onPressed: () {},
                  ),
                ),
              ],
            ),
          ),
        ),
      );

      // Verificar que detecte el botón pequeño
      expect(
        () => AccessibilityHelpers.verifyTouchTargetSizes(tester),
        throwsA(isA<TestFailure>()),
      );
    });

    testWidgets('Verifica labels en TextFields', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Column(
              children: [
                TextField(
                  decoration: const InputDecoration(
                    labelText: 'Usuario',
                  ),
                ),
                TextField(
                  decoration: const InputDecoration(
                    hintText: 'Contraseña',
                  ),
                ),
                const TextField(), // Sin label ni hint - debería fallar
              ],
            ),
          ),
        ),
      );

      expect(
        () => AccessibilityHelpers.verifyTextFieldLabels(tester),
        throwsA(isA<TestFailure>()),
      );
    });

    testWidgets('Verifica que los widgets tengan semantic labels', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            appBar: AppBar(
              title: const Text('Test'),
              semanticLabel: 'Barra de aplicación',
            ),
            body: Semantics(
              label: 'Contenido principal',
              child: const Text('Hola'),
            ),
          ),
        ),
      );

      // Verificar que los semantic labels existan
      expect(find.bySemanticsLabel('Barra de aplicación'), findsOneWidget);
      expect(find.bySemanticsLabel('Contenido principal'), findsOneWidget);
    });
  });

  group('Tests de Contraste en Widgets Reales', () {
    testWidgets('Verifica contraste en AppBar', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData(
            appBarTheme: const AppBarTheme(
              backgroundColor: Colors.blue,
              foregroundColor: Colors.white,
            ),
          ),
          home: Scaffold(
            appBar: AppBar(title: const Text('Test')),
          ),
        ),
      );

      final appBar = tester.widget<AppBar>(find.byType(AppBar));
      final hasGoodContrast = AccessibilityHelpers.verifyContrastRatio(
        foreground: appBar.foregroundColor ?? Colors.white,
        background: appBar.backgroundColor ?? Colors.blue,
      );

      expect(hasGoodContrast, isTrue, reason: 'AppBar debe tener buen contraste');
    });
  });
}
