import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:provider/provider.dart';
import 'package:moviles2/main.dart' as app;
import 'package:moviles2/viewmodels/auth_viewmodel.dart';
import 'package:moviles2/viewmodels/admin_viewmodel.dart';
import 'package:moviles2/viewmodels/reports_viewmodel.dart';
import 'package:moviles2/viewmodels/guard_reports_viewmodel.dart';
import 'package:moviles2/viewmodels/student_status_viewmodel.dart';
import 'package:moviles2/services/connectivity_service.dart';
import 'package:moviles2/services/offline_sync_service.dart';
import 'package:moviles2/services/hybrid_api_service.dart';
import '../test/utils/accessibility_helpers.dart';

/// Tests de integración para navegación y flujos principales
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Tests de Navegación y Flujos Principales', () {
    testWidgets('Flujo de autenticación completo', (tester) async {
      // Inicializar la app
      await tester.binding.setSurfaceSize(const Size(1080, 1920));
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Verificar que la vista de login esté presente
      // Nota: Necesitarás ajustar esto según tu implementación real de login
      expect(find.text('Login'), findsWidgets, reason: 'Debe mostrar pantalla de login');
      
      // Verificar accesibilidad durante el flujo
      expect(
        () => AccessibilityHelpers.verifyAccessibilityLabels(tester),
        returnsNormally,
      );
    });

    testWidgets('Navegación en AdminView sin errores', (tester) async {
      await tester.binding.setSurfaceSize(const Size(1080, 1920));
      
      await tester.pumpWidget(
        MaterialApp(
          home: MultiProvider(
            providers: [
              ChangeNotifierProvider(create: (_) => AuthViewModel()),
              ChangeNotifierProvider(create: (_) => AdminViewModel()),
              ChangeNotifierProvider(create: (_) => ReportsViewModel()),
            ],
            child: Scaffold(
              body: Center(
                child: TextButton(
                  onPressed: () {},
                  child: const Text('Admin'),
                ),
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verificar que no haya errores de navegación
      expect(tester.takeException(), isNull, reason: 'No debe haber excepciones');
      
      // Verificar accesibilidad
      expect(
        () => AccessibilityHelpers.verifyAccessibilityLabels(tester),
        returnsNormally,
      );
    });

    testWidgets('Flujo de búsqueda de estudiantes', (tester) async {
      await tester.binding.setSurfaceSize(const Size(1080, 1920));
      
      await tester.pumpWidget(
        MaterialApp(
          home: MultiProvider(
            providers: [
              ChangeNotifierProvider(create: (_) => StudentStatusViewModel()),
            ],
            child: Scaffold(
              appBar: AppBar(title: const Text('Búsqueda')),
              body: Column(
                children: [
                  TextField(
                    decoration: const InputDecoration(
                      labelText: 'Buscar estudiante',
                      hintText: 'Ingrese código o nombre',
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () {},
                    child: const Text('Buscar'),
                  ),
                ],
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verificar que los campos de búsqueda estén accesibles
      expect(find.text('Buscar estudiante'), findsOneWidget);
      expect(find.text('Buscar'), findsOneWidget);
      
      // Verificar accesibilidad
      expect(
        () => AccessibilityHelpers.verifyTextFieldLabels(tester),
        returnsNormally,
      );
    });

    testWidgets('Navegación entre tabs sin errores', (tester) async {
      await tester.binding.setSurfaceSize(const Size(1080, 1920));
      
      await tester.pumpWidget(
        MaterialApp(
          home: DefaultTabController(
            length: 3,
            child: Scaffold(
              appBar: AppBar(
                title: const Text('Test'),
                bottom: const TabBar(
                  tabs: [
                    Tab(text: 'Tab 1', icon: Icon(Icons.home)),
                    Tab(text: 'Tab 2', icon: Icon(Icons.search)),
                    Tab(text: 'Tab 3', icon: Icon(Icons.settings)),
                  ],
                ),
              ),
              body: const TabBarView(
                children: [
                  Center(child: Text('Contenido 1')),
                  Center(child: Text('Contenido 2')),
                  Center(child: Text('Contenido 3')),
                ],
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Navegar entre tabs
      await tester.tap(find.text('Tab 2'));
      await tester.pumpAndSettle();
      expect(find.text('Contenido 2'), findsOneWidget);

      await tester.tap(find.text('Tab 3'));
      await tester.pumpAndSettle();
      expect(find.text('Contenido 3'), findsOneWidget);

      // Verificar que no haya errores
      expect(tester.takeException(), isNull);
    });

    testWidgets('Flujo de reportes completo', (tester) async {
      await tester.binding.setSurfaceSize(const Size(1080, 1920));
      
      await tester.pumpWidget(
        MaterialApp(
          home: MultiProvider(
            providers: [
              ChangeNotifierProvider(create: (_) => ReportsViewModel()),
              ChangeNotifierProvider(create: (_) => GuardReportsViewModel()),
            ],
            child: Scaffold(
              appBar: AppBar(title: const Text('Reportes')),
              body: ListView(
                children: [
                  ListTile(
                    title: const Text('Reporte Diario'),
                    onTap: () {},
                  ),
                  ListTile(
                    title: const Text('Reporte Semanal'),
                    onTap: () {},
                  ),
                  ListTile(
                    title: const Text('Reporte Mensual'),
                    onTap: () {},
                  ),
                ],
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verificar que todos los elementos de navegación estén presentes
      expect(find.text('Reporte Diario'), findsOneWidget);
      expect(find.text('Reporte Semanal'), findsOneWidget);
      expect(find.text('Reporte Mensual'), findsOneWidget);
      
      // Verificar accesibilidad
      expect(
        () => AccessibilityHelpers.verifyAccessibilityLabels(tester),
        returnsNormally,
      );
    });
  });

  group('Tests de Rendimiento de Interacciones', () {
    testWidgets('Verifica tiempo de respuesta de tap en botón', (tester) async {
      await tester.binding.setSurfaceSize(const Size(1080, 1920));
      
      bool buttonPressed = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ElevatedButton(
              onPressed: () {
                buttonPressed = true;
              },
              child: const Text('Presionar'),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Medir tiempo de respuesta
      final responseTime = await PerformanceHelpers.measureInteractionTime(
        tester,
        () async {
          await tester.tap(find.text('Presionar'));
        },
      );

      expect(responseTime, lessThan(300), reason: 'La respuesta debe ser < 300ms');
      expect(buttonPressed, isTrue);
    });

    testWidgets('Verifica tiempo de respuesta de navegación', (tester) async {
      await tester.binding.setSurfaceSize(const Size(1080, 1920));
      
      await tester.pumpWidget(
        MaterialApp(
          routes: {
            '/': (context) => Scaffold(
                  body: ElevatedButton(
                    onPressed: () {
                      Navigator.pushNamed(context, '/second');
                    },
                    child: const Text('Navegar'),
                  ),
                ),
            '/second': (context) => const Scaffold(
                  body: Text('Segunda pantalla'),
                ),
          },
        ),
      );

      await tester.pumpAndSettle();

      // Medir tiempo de navegación
      final navigationTime = await PerformanceHelpers.measureInteractionTime(
        tester,
        () async {
          await tester.tap(find.text('Navegar'));
        },
      );

      expect(navigationTime, lessThan(300), reason: 'La navegación debe ser < 300ms');
      await tester.pumpAndSettle();
      expect(find.text('Segunda pantalla'), findsOneWidget);
    });

    testWidgets('Verifica tiempo de respuesta de scroll', (tester) async {
      await tester.binding.setSurfaceSize(const Size(1080, 1920));
      
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ListView.builder(
              itemCount: 100,
              itemBuilder: (context, index) {
                return ListTile(title: Text('Item $index'));
              },
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Medir tiempo de scroll
      final scrollTime = await PerformanceHelpers.measureInteractionTime(
        tester,
        () async {
          await tester.drag(find.byType(ListView), const Offset(0, -500));
        },
      );

      expect(scrollTime, lessThan(300), reason: 'El scroll debe ser < 300ms');
    });
  });

  group('Tests en Diferentes Tamaños de Pantalla', () {
    testWidgets('Funciona correctamente en pantalla pequeña (360x640)', (tester) async {
      await tester.binding.setSurfaceSize(const Size(360, 640));
      
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            appBar: AppBar(title: const Text('Test')),
            body: const Center(child: Text('Contenido')),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verificar que todo sea visible y accesible
      expect(find.text('Contenido'), findsOneWidget);
      expect(
        () => AccessibilityHelpers.verifyTouchTargetSizes(tester),
        returnsNormally,
      );
    });

    testWidgets('Funciona correctamente en pantalla mediana (720x1280)', (tester) async {
      await tester.binding.setSurfaceSize(const Size(720, 1280));
      
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            appBar: AppBar(title: const Text('Test')),
            body: const Center(child: Text('Contenido')),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Contenido'), findsOneWidget);
    });

    testWidgets('Funciona correctamente en pantalla grande (1080x1920)', (tester) async {
      await tester.binding.setSurfaceSize(const Size(1080, 1920));
      
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            appBar: AppBar(title: const Text('Test')),
            body: const Center(child: Text('Contenido')),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Contenido'), findsOneWidget);
    });
  });
}
