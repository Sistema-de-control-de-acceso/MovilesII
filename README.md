# Sistema de Control de Acceso NFC

Sistema completo de detección automática de pulseras NFC para identificar estudiantes en proximidad (10cm).

## 🚀 Características Principales

- ✅ **Detección Automática**: Detecta pulseras NFC automáticamente a 10cm
- ✅ **Lectura Precisa de ID Único**: Lee IDs únicos con precisión a 10cm
- ✅ **Validación de ID**: Valida formato y contenido de IDs únicos
- ✅ **Lectura Sin Contacto**: No requiere tocar el dispositivo
- ✅ **Feedback Multimodal**: Visual, sonoro y háptico
- ✅ **Calibración Precisa**: Sistema de calibración para mejorar precisión
- ✅ **Algoritmo Avanzado**: Múltiples métodos de cálculo de distancia
- ✅ **Manejo Robusto de Errores**: Captura y manejo completo de errores
- ✅ **Logging Completo**: Registro de todos los eventos NFC

## 📋 Requisitos

- Flutter SDK 3.7.2+
- Dispositivo con NFC habilitado
- Android 6.0+ o iOS 11.0+

## 🔧 Instalación

1. Clonar repositorio:
```bash
git clone <repository-url>
cd MovilesII
```

2. Instalar dependencias:
```bash
flutter pub get
```

3. Configurar permisos (ver `docs/NFC_AUTO_DETECTION.md`)

4. Ejecutar aplicación:
```bash
flutter run
```

## 📱 Uso

### Pantalla Principal

La aplicación incluye una pantalla de detección automática (`NFCAutoDetectionScreen`) que permite:

1. **Iniciar Detección**: Presionar botón "Iniciar" para comenzar a escanear
2. **Ver Estado**: El indicador visual muestra el estado de detección
3. **Calibrar**: Usar el botón de configuración para calibrar distancia

### Integración en tu App

```dart
import 'package:moviles2/screens/nfc_auto_detection_screen.dart';

// Navegar a la pantalla
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => NFCAutoDetectionScreen(),
  ),
);
```

## 🧪 Pruebas

### Tests Unitarios

```bash
flutter test test/nfc_auto_detection_test.dart
```

### Pruebas de Hardware

Ver `docs/NFC_AUTO_DETECTION.md` para instrucciones detalladas de pruebas de hardware.

## 📚 Documentación

- **Detección Automática NFC**: `docs/NFC_AUTO_DETECTION.md`
  - Arquitectura del sistema
  - Algoritmo de detección de proximidad
  - Guía de calibración
  - Troubleshooting

- **Lectura Precisa de ID Único**: `docs/NFC_PRECISE_READING.md`
  - Lectura precisa a 10cm
  - Validación de ID único
  - Manejo de errores
  - Sistema de logging

## 🏗️ Estructura del Proyecto

```
lib/
├── services/
│   ├── nfc_auto_detection_service.dart    # Servicio principal
│   ├── nfc_precise_reader_service.dart   # Lectura precisa de ID único
│   ├── nfc_proximity_algorithm.dart      # Algoritmo de distancia
│   ├── nfc_calibration_service.dart      # Calibración
│   └── nfc_event_logger.dart             # Logging de eventos
├── widgets/
│   ├── nfc_detection_widget.dart         # Widget de UI
│   └── nfc_reading_status_widget.dart    # Estado de lectura
└── screens/
    ├── nfc_auto_detection_screen.dart    # Pantalla principal
    └── nfc_precise_reading_screen.dart   # Pantalla de lectura precisa
```

## 🔍 Troubleshooting

### NFC no disponible
- Verificar que el dispositivo tiene NFC
- Verificar permisos en AndroidManifest.xml / Info.plist
- Reiniciar dispositivo

### Detección imprecisa
- Ejecutar calibración (mínimo 3 puntos)
- Asegurar que puntos están en diferentes distancias
- Verificar que tag es compatible

## 📄 Licencia

[Especificar licencia]

## 👥 Contribuidores

[Especificar contribuidores]
