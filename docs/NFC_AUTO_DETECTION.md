# Detección Automática de NFC - Documentación

Sistema completo de detección automática de pulseras NFC para identificar estudiantes en proximidad (10cm).

## 📋 Características

- ✅ Detección automática a 10cm
- ✅ Lectura automática sin necesidad de tocar
- ✅ Feedback visual, sonoro y háptico
- ✅ Calibración de distancia
- ✅ Algoritmo avanzado de detección de proximidad

## 🏗️ Arquitectura

### Componentes Principales

1. **NFCAutoDetectionService**: Servicio principal de detección automática
2. **NFCProximityAlgorithm**: Algoritmo de cálculo de distancia
3. **NFCCalibrationService**: Servicio de calibración
4. **NFCDetectionWidget**: Widget de UI con feedback visual

## 🔧 Configuración

### Dependencias

Agregar al `pubspec.yaml`:

```yaml
dependencies:
  nfc_manager: ^3.3.0
  audioplayers: ^5.2.1
  vibration: ^1.8.4
```

### Permisos

#### Android (`android/app/src/main/AndroidManifest.xml`):

```xml
<uses-permission android:name="android.permission.NFC" />
<uses-feature
    android:name="android.hardware.nfc"
    android:required="true" />
```

#### iOS (`ios/Runner/Info.plist`):

```xml
<key>NFCReaderUsageDescription</key>
<string>Necesitamos acceso a NFC para detectar pulseras de estudiantes</string>
```

## 🚀 Uso Básico

### Inicializar Servicio

```dart
final nfcService = NFCAutoDetectionService();
await nfcService.initialize();
```

### Iniciar Detección Automática

```dart
await nfcService.startAutoDetection(
  onDetected: (tagId) {
    print('Tag detectado: $tagId');
    // Buscar estudiante en base de datos
  },
  onInRange: (tagId, distance) {
    print('Tag en rango: $tagId a ${distance}cm');
  },
  onOutOfRange: () {
    print('Tag fuera de rango');
  },
);
```

### Detener Detección

```dart
await nfcService.stopAutoDetection();
```

## 📐 Algoritmo de Detección de Proximidad

El algoritmo utiliza múltiples factores para calcular la distancia:

### 1. RSSI (Received Signal Strength Indicator)

```dart
// Modelo de path loss
distance = d0 * 10^((RSSI0 - RSSI) / (10 * n))
```

Donde:
- `d0`: Distancia de referencia (1cm)
- `RSSI0`: RSSI a distancia de referencia
- `n`: Exponente de pérdida de trayectoria (2.5 para NFC)

### 2. Amplitud de Señal

```dart
// Amplitud inversamente proporcional a distancia^2
distance = sqrt(k / amplitude)
```

### 3. Tiempo de Respuesta

```dart
// Tags más cercanos responden más rápido
distance = a * responseTime + b
```

### 4. Ancho de Banda

```dart
// Ancho de banda disminuye con distancia
distance = d0 * (BW0 / BW)^(1/alpha)
```

### Promedio Ponderado

El algoritmo combina todos los métodos usando un promedio ponderado basado en la confiabilidad de cada método.

## 🎯 Calibración

### Proceso de Calibración

1. **Iniciar calibración**:
```dart
final calibrationService = NFCCalibrationService();
await calibrationService.startCalibration();
```

2. **Agregar puntos de calibración**:
```dart
// Colocar tag a distancia conocida (ej: 10cm)
await calibrationService.addCalibrationPoint(
  knownDistanceCm: 10.0,
  measuredData: ProximityData(
    rssi: -40.0,
    amplitude: 1.0,
    responseTime: 0.01,
  ),
);
```

3. **Completar calibración** (mínimo 3 puntos):
```dart
final result = await calibrationService.completeCalibration();
```

### Validación

La calibración es válida si:
- Error promedio < 2cm
- Al menos 3 puntos de calibración
- Puntos distribuidos en diferentes distancias

## 🎨 Feedback Visual

El widget `NFCDetectionWidget` proporciona:

- **Indicador circular**: Cambia de color según estado
  - Gris: Inactivo
  - Azul pulsante: Escaneando
  - Verde pulsante: Tag detectado

- **Información de estado**:
  - Tag ID detectado
  - Distancia en tiempo real
  - Barra de señal

## 🔊 Feedback Sonoro

El servicio reproduce un sonido cuando se detecta un tag. Agregar asset:

```
assets/sounds/nfc_detection.mp3
```

En `pubspec.yaml`:

```yaml
flutter:
  assets:
    - assets/sounds/
```

## 📳 Feedback Háptico

El servicio vibra el dispositivo cuando se detecta un tag usando el paquete `vibration`.

## 🧪 Pruebas

### Tests Unitarios

```bash
flutter test test/nfc_auto_detection_test.dart
```

### Pruebas de Hardware

1. **Test de Distancia**:
   - Colocar tag a 5cm, 10cm, 15cm, 20cm
   - Verificar que la distancia calculada esté dentro de ±2cm

2. **Test de Detección Automática**:
   - Iniciar detección
   - Acercar tag lentamente
   - Verificar que se detecta a ~10cm
   - Verificar feedback visual/sonoro/háptico

3. **Test de Calibración**:
   - Ejecutar proceso de calibración
   - Verificar que error promedio < 2cm
   - Verificar que calibración se guarda y carga correctamente

## 📊 Métricas de Performance

### Objetivos

- **Tiempo de detección**: < 100ms
- **Precisión de distancia**: ±2cm a 10cm
- **Rango de detección**: 1-50cm
- **Tasa de falsos positivos**: < 1%

### Monitoreo

El servicio registra:
- Tiempo de detección
- Distancia calculada
- Fuerza de señal
- Errores de calibración

## 🔍 Troubleshooting

### NFC no disponible

- Verificar que el dispositivo tiene NFC
- Verificar permisos en AndroidManifest.xml / Info.plist
- Reiniciar dispositivo

### Detección imprecisa

- Ejecutar calibración
- Verificar que hay al menos 3 puntos de calibración
- Asegurar que puntos están en diferentes distancias

### No se detecta tag

- Verificar que tag es compatible (ISO14443, ISO15693, ISO18092)
- Verificar que tag está dentro del rango (1-50cm)
- Verificar que NFC está activado en el dispositivo

## 🔄 Próximos Pasos

1. **Mejoras de Algoritmo**:
   - Machine learning para mejor precisión
   - Filtrado Kalman para suavizar lecturas
   - Compensación de temperatura

2. **Features Adicionales**:
   - Detección de múltiples tags simultáneos
   - Modo de bajo consumo
   - Historial de detecciones

3. **Integración**:
   - Conectar con API para buscar estudiantes
   - Guardar detecciones en base de datos
   - Notificaciones push

## 📚 Referencias

- [NFC Manager Package](https://pub.dev/packages/nfc_manager)
- [NFC Forum Specifications](https://nfc-forum.org/)
- [Path Loss Model](https://en.wikipedia.org/wiki/Path_loss)

