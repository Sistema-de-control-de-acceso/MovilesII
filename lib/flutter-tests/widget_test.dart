import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('Widget muestra texto esperado', (WidgetTester tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: Scaffold(body: Text('Hola Mundo')),
    ));
    expect(find.text('Hola Mundo'), findsOneWidget);
  });
}
