# Guía de Testing de Accesibilidad y Usabilidad

## 📋 Resumen

Este documento describe los tests automatizados y manuales de accesibilidad y usabilidad implementados para la aplicación móvil.

## 🎯 Objetivos

- Validar que la interfaz cumple con estándares de accesibilidad (WCAG 2.1)
- Garantizar tiempos de respuesta visual < 300ms
- Verificar cumplimiento de Material Design
- Asegurar usabilidad en diferentes tamaños de dispositivos Android

## 🛠️ Tests Automatizados

### Tests de Accesibilidad

Los tests de accesibilidad verifican:

1. **Labels de accesibilidad**: Todos los widgets interactivos deben tener labels
2. **Contraste de colores**: Cumplimiento con WCAG 2.1 (ratio mínimo 4.5:1 para texto normal, 3:1 para texto grande)
3. **Tamaños de texto**: Mínimo 14sp para texto normal
4. **Tamaños de targets táctiles**: Mínimo 48x48dp
5. **Labels en campos de texto**: Todos los TextFields deben tener label o hint
6. **Texto alternativo en imágenes**: Imágenes deben tener semantic labels

#### Ejecutar tests de accesibilidad

```bash
flutter test test/accessibility/accessibility_test.dart
```

### Tests de Material Design

Los tests validan:

1. Uso de Material 3
2. ColorScheme definido
3. AppBarTheme configurado
4. Espaciado consistente (múltiplos de 8dp)
5. Tipografía Material Design
6. Elevación correcta

#### Ejecutar tests de Material Design

```bash
flutter test test/accessibility/material_design_test.dart
```

### Tests de Integración (Navegación y Flujos)

Los tests de integración verifican:

1. Flujo de autenticación completo
2. Navegación entre pantallas sin errores
3. Navegación entre tabs
4. Flujos de búsqueda y reportes
5. Tiempos de respuesta de interacciones (< 300ms)
6. Funcionamiento en diferentes tamaños de pantalla

#### Ejecutar tests de integración

```bash
flutter test integration_test/app_navigation_test.dart
```

#### Ejecutar en dispositivo físico

```bash
flutter test integration_test/app_navigation_test.dart --device-id=<DEVICE_ID>
```

## 📱 Pruebas Manuales en Dispositivos Físicos

### Dispositivos Recomendados para Pruebas

Se recomienda probar en al menos 3 dispositivos Android de diferentes tamaños:

1. **Pantalla pequeña**: 360x640dp (por ejemplo, Samsung Galaxy A10)
2. **Pantalla mediana**: 720x1280dp (por ejemplo, Samsung Galaxy A52)
3. **Pantalla grande**: 1080x1920dp o superior (por ejemplo, Samsung Galaxy S21)

### Checklist de Pruebas Manuales

#### 1. Accesibilidad Visual

- [ ] Verificar que todos los textos sean legibles sin zoom
- [ ] Verificar contraste de texto sobre fondos (usar herramientas como Accessibility Scanner)
- [ ] Verificar que los iconos sean claros y reconocibles
- [ ] Probar con modo de alto contraste (si está disponible)

#### 2. Accesibilidad de Interacción

- [ ] Verificar que todos los botones sean fácilmente presionables (mínimo 48x48dp)
- [ ] Probar navegación solo con teclado (si aplica)
- [ ] Verificar que los campos de texto tengan labels claros
- [ ] Probar con lectores de pantalla (TalkBack)

#### 3. Usabilidad en Diferentes Tamaños

- [ ] Verificar que el contenido sea visible sin scroll horizontal
- [ ] Verificar que los elementos importantes no se corten
- [ ] Verificar que los botones sean accesibles sin estirar el dedo
- [ ] Probar orientación vertical y horizontal

#### 4. Tiempos de Respuesta

- [ ] Medir tiempo de respuesta de taps (< 300ms)
- [ ] Medir tiempo de carga de pantallas
- [ ] Verificar que haya feedback visual inmediato
- [ ] Probar con conexión lenta (3G simulado)

#### 5. Navegación

- [ ] Probar todos los flujos principales sin errores
- [ ] Verificar que los botones de navegación funcionen correctamente
- [ ] Verificar que el botón "Atrás" funcione correctamente
- [ ] Probar navegación profunda (múltiples niveles)

#### 6. Material Design

- [ ] Verificar uso de Material 3
- [ ] Verificar colores del tema
- [ ] Verificar espaciado consistente
- [ ] Verificar uso de elevación correcta
- [ ] Verificar animaciones suaves

### Herramientas Recomendadas para Pruebas Manuales

1. **Accessibility Scanner** (Google): Escanea automáticamente problemas de accesibilidad
2. **TalkBack**: Lectora de pantalla para probar accesibilidad
3. **Developer Options > Show layout bounds**: Visualizar tamaños de elementos
4. **Developer Options > Pointer location**: Ver coordenadas de toques

## 📊 Métricas de Rendimiento

### Tiempos de Respuesta Esperados

- **Tap en botón**: < 300ms
- **Navegación entre pantallas**: < 300ms
- **Scroll**: < 300ms
- **Carga inicial de pantalla**: < 1000ms

### Cómo Medir Tiempos

Los tests automatizados miden tiempos usando `PerformanceHelpers.measureInteractionTime()`.

Para mediciones manuales, puedes usar:
- Flutter DevTools (Performance tab)
- Android Profiler
- `flutter run --profile` para análisis de rendimiento

## 🔍 Checklist de Material Design

### Tema

- [x] Usa Material 3 (`useMaterial3: true`)
- [x] Tiene ColorScheme definido
- [x] Tiene AppBarTheme configurado
- [x] Usa colores del tema consistentemente

### Espaciado

- [x] Usa múltiplos de 8dp para espaciado
- [x] Padding y margins consistentes
- [x] Espaciado entre elementos adecuado

### Tipografía

- [x] Usa TextTheme de Material Design
- [x] Tamaños de texto accesibles (mínimo 14sp)
- [x] Pesos de fuente apropiados

### Elevación

- [x] Usa elevaciones estándar de Material Design
- [x] AppBars tienen elevation: 2
- [x] Cards usan elevation: 1-4 según jerarquía

### Componentes

- [x] Botones usan estilos de Material Design
- [x] TextFields tienen InputDecoration apropiado
- [x] Iconos son de Material Icons

## 📝 Reportar Hallazgos

Cuando encuentres problemas de accesibilidad o usabilidad:

1. **Documentar el problema**:
   - Descripción clara del problema
   - Pasos para reproducir
   - Dispositivo y versión de Android
   - Capturas de pantalla si aplica

2. **Crear ticket** usando el formato:
   ```
   Título: [Accesibilidad/Usabilidad] Descripción breve
   
   Tipo: Bug/Mejora
   Prioridad: Alta/Media/Baja
   Dispositivo: [Modelo y tamaño de pantalla]
   
   Descripción:
   [Descripción detallada]
   
   Pasos para reproducir:
   1. ...
   2. ...
   
   Resultado esperado:
   [Lo que debería pasar]
   
   Resultado actual:
   [Lo que realmente pasa]
   ```

3. **Agregar a la lista de mejoras pendientes** en `docs/ACCESSIBILITY_IMPROVEMENTS.md`

## 🚀 Ejecutar Todos los Tests

Para ejecutar todos los tests de accesibilidad y usabilidad:

```bash
# Tests de accesibilidad
flutter test test/accessibility/

# Tests de Material Design
flutter test test/accessibility/material_design_test.dart

# Tests de integración
flutter test integration_test/app_navigation_test.dart

# Todos los tests con cobertura
flutter test --coverage
```

## 📚 Referencias

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Guidelines](https://material.io/design)
- [Flutter Accessibility](https://docs.flutter.dev/accessibility-and-localization/accessibility)
- [Accessibility Scanner (Google)](https://play.google.com/store/apps/details?id=com.google.android.apps.accessibility.auditor)
