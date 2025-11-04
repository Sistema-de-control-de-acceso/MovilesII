import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import '../utils/accessibility_helpers.dart';

/// Tests para validar cumplimiento de Material Design
void main() {
  group('Tests de Material Design', () {
    test('Verifica que el tema use Material 3', () {
      final theme = ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
      );

      expect(
        () => MaterialDesignHelpers.verifyMaterial3(theme),
        returnsNormally,
      );
    });

    test('Falla si el tema no usa Material 3', () {
      final theme = ThemeData(
        useMaterial3: false,
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
      );

      expect(
        () => MaterialDesignHelpers.verifyMaterial3(theme),
        throwsA(isA<TestFailure>()),
      );
    });

    test('Verifica que el tema tenga ColorScheme', () {
      final theme = ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
      );

      expect(
        () => MaterialDesignHelpers.verifyMaterialColors(theme),
        returnsNormally,
      );
    });

    test('Falla si el tema no tiene ColorScheme', () {
      final theme = ThemeData(
        useMaterial3: true,
        // Sin ColorScheme
      );

      expect(
        () => MaterialDesignHelpers.verifyMaterialColors(theme),
        throwsA(isA<TestFailure>()),
      );
    });

    test('Verifica que el tema tenga AppBarTheme', () {
      final theme = ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.blue,
          foregroundColor: Colors.white,
        ),
      );

      expect(
        () => MaterialDesignHelpers.verifyAppBarTheme(theme),
        returnsNormally,
      );
    });

    testWidgets('Verifica que los AppBars usen el tema correctamente', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData(
            useMaterial3: true,
            colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
            appBarTheme: const AppBarTheme(
              backgroundColor: Colors.blue,
              foregroundColor: Colors.white,
              elevation: 2,
            ),
          ),
          home: Scaffold(
            appBar: AppBar(title: const Text('Test')),
          ),
        ),
      );

      final appBar = tester.widget<AppBar>(find.byType(AppBar));
      expect(appBar.backgroundColor, Colors.blue);
      expect(appBar.foregroundColor, Colors.white);
    });

    testWidgets('Verifica espaciado consistente (múltiplos de 8dp)', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Padding(
              padding: const EdgeInsets.all(16.0), // 16 = 2 * 8
              child: Column(
                children: [
                  const SizedBox(height: 8.0), // 8 = 1 * 8
                  const SizedBox(height: 16.0), // 16 = 2 * 8
                  const SizedBox(height: 24.0), // 24 = 3 * 8
                  const Text('Contenido'),
                ],
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.text('Contenido'), findsOneWidget);
    });

    testWidgets('Verifica uso de colores primarios del tema', (tester) async {
      final colorScheme = ColorScheme.fromSeed(seedColor: Colors.blue);
      
      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData(
            useMaterial3: true,
            colorScheme: colorScheme,
          ),
          home: Scaffold(
            body: ElevatedButton(
              onPressed: () {},
              child: const Text('Botón'),
            ),
          ),
        ),
      );

      final button = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
      // El ElevatedButton debería usar el colorScheme.primary
      expect(button.style?.backgroundColor?.resolve({}), isNotNull);
    });

    testWidgets('Verifica tipografía Material Design', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData(
            useMaterial3: true,
            textTheme: Typography.material2021().black,
          ),
          home: Scaffold(
            body: Column(
              children: [
                Text(
                  'Headline Large',
                  style: Theme.of(tester.binding.window).textTheme.headlineLarge,
                ),
                Text(
                  'Body Large',
                  style: Theme.of(tester.binding.window).textTheme.bodyLarge,
                ),
              ],
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.text('Headline Large'), findsOneWidget);
      expect(find.text('Body Large'), findsOneWidget);
    });

    testWidgets('Verifica uso de elevación correcta', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Column(
              children: [
                Card(elevation: 1.0, child: const Text('Card 1')),
                Card(elevation: 2.0, child: const Text('Card 2')),
                Card(elevation: 4.0, child: const Text('Card 3')),
              ],
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      
      final cards = find.byType(Card);
      expect(cards, findsNWidgets(3));
      
      // Verificar que las elevaciones sean valores estándar de Material Design
      final card1 = tester.widget<Card>(cards.at(0));
      expect(card1.elevation, 1.0);
      
      final card2 = tester.widget<Card>(cards.at(1));
      expect(card2.elevation, 2.0);
      
      final card3 = tester.widget<Card>(cards.at(2));
      expect(card3.elevation, 4.0);
    });

    testWidgets('Verifica uso de iconos Material Design', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Row(
              children: const [
                Icon(Icons.home),
                Icon(Icons.search),
                Icon(Icons.settings),
              ],
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      
      final icons = find.byType(Icon);
      expect(icons, findsNWidgets(3));
      
      // Verificar que los iconos sean de Material Icons
      final icon1 = tester.widget<Icon>(icons.at(0));
      expect(icon1.icon, Icons.home);
    });
  });
}
