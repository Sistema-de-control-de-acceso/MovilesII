# Lectura Precisa de ID Único NFC - Documentación

Sistema completo para leer IDs únicos de pulseras NFC con precisión a 10cm, incluyendo validación, manejo de errores y logging.

## 📋 Características

- ✅ **Lectura Precisa a 10cm**: Algoritmo optimizado para detectar tags a distancia exacta
- ✅ **ID Único Válido**: Validación completa del formato y contenido del ID
- ✅ **Manejo Robusto de Errores**: Captura y manejo de todos los tipos de errores
- ✅ **Logging Completo**: Registro de todos los eventos NFC para debugging

## 🏗️ Arquitectura

### Componentes Principales

1. **NFCPreciseReaderService**: Servicio principal de lectura precisa
2. **NFCEventLogger**: Sistema de logging de eventos
3. **NFCReadingStatusWidget**: Widget de estado y estadísticas
4. **NFCPreciseReadingScreen**: Pantalla principal de lectura

## 🔧 Uso

### Inicializar Servicio

```dart
final readerService = NFCPreciseReaderService();
await readerService.initialize();
```

### Iniciar Lectura Precisa

```dart
await readerService.startPreciseReading(
  onIdRead: (uniqueId) {
    print('ID leído: $uniqueId');
    // Procesar ID único
  },
  onReadError: (error) {
    print('Error: $error');
    // Manejar error
  },
  onIdInRange: (id, distance) {
    print('ID en rango: $id a ${distance}cm');
  },
  targetDistance: 10.0,  // Distancia objetivo en cm
  tolerance: 2.0,         // Tolerancia ±2cm
);
```

### Detener Lectura

```dart
await readerService.stopReading();
```

## 🎯 Validación de ID Único

El sistema valida IDs únicos según los siguientes criterios:

### 1. Formato Hexadecimal
- Debe contener solo caracteres hexadecimales (0-9, A-F)
- Separado por dos puntos (:)
- Ejemplo válido: `04:12:34:56:78:90:AB:CD`

### 2. Longitud
- Mínimo: 4 bytes (8 caracteres hex)
- Máximo: 16 bytes (32 caracteres hex)

### 3. Contenido
- No puede estar vacío
- No puede ser todos ceros (`00:00:00:00`)

### 4. Checksum (Opcional)
- Validación adicional según tipo de tag
- Implementar según necesidad específica

## 📊 Estadísticas de Lectura

El servicio mantiene estadísticas en tiempo real:

```dart
final stats = readerService.getStatistics();

print('Total intentos: ${stats.totalAttempts}');
print('Lecturas exitosas: ${stats.successfulReads}');
print('Lecturas fallidas: ${stats.failedReads}');
print('IDs inválidos: ${stats.invalidIds}');
print('Tasa de éxito: ${stats.successRate}%');
```

## 📝 Logging de Eventos

### Tipos de Eventos

- **serviceInitialized**: Servicio inicializado
- **initializationFailed**: Error en inicialización
- **readingStarted**: Lectura iniciada
- **readingStopped**: Lectura detenida
- **idRead**: ID leído exitosamente
- **readError**: Error en lectura
- **error**: Error general
- **warning**: Advertencia

### Obtener Eventos

```dart
final eventLogger = NFCEventLogger();

// Eventos recientes
final recentEvents = eventLogger.getRecentEvents(limit: 50);

// Eventos por tipo
final readEvents = eventLogger.getEventsByType(NFCEventType.idRead);

// Solo errores
final errors = eventLogger.getErrorEvents();

// Estadísticas
final stats = eventLogger.getStatistics();
```

### Exportar Eventos

```dart
final json = await eventLogger.exportEvents(limit: 100);
// Guardar o compartir JSON
```

## ⚠️ Manejo de Errores

### Tipos de Errores

1. **NFC no disponible**
   - Verificar que el dispositivo tiene NFC
   - Verificar permisos

2. **Error extrayendo ID**
   - Tag incompatible
   - Tag dañado
   - Señal débil

3. **ID inválido**
   - Formato incorrecto
   - Longitud incorrecta
   - Contenido inválido

4. **Tag fuera de rango**
   - Distancia > 12cm o < 8cm
   - Ajustar posición del tag

### Callbacks de Error

```dart
onReadError: (error) {
  // error contiene descripción del error
  // Se registra automáticamente en el log
  // Se actualiza contador de errores
}
```

## 🧪 Pruebas

### Tests Unitarios

```bash
flutter test test/nfc_precise_reader_test.dart
```

### Pruebas de Hardware

1. **Test de Lectura Precisa**:
   - Colocar tag a exactamente 10cm
   - Verificar que se lee correctamente
   - Verificar que ID es válido

2. **Test de Validación**:
   - Probar con IDs válidos e inválidos
   - Verificar que se rechazan IDs inválidos
   - Verificar mensajes de error

3. **Test de Rango**:
   - Probar a 8cm, 10cm, 12cm (dentro de rango)
   - Probar a 5cm, 15cm (fuera de rango)
   - Verificar que solo lee dentro de rango

4. **Test de Errores**:
   - Simular tags incompatibles
   - Simular señales débiles
   - Verificar manejo de errores

## 📈 Métricas de Performance

### Objetivos

- **Precisión de distancia**: ±2cm a 10cm
- **Tasa de éxito**: > 95%
- **Tiempo de lectura**: < 200ms
- **Tasa de falsos positivos**: < 1%

### Monitoreo

El servicio registra:
- Tiempo de cada lectura
- Distancia calculada
- Éxito/fallo de cada intento
- IDs inválidos detectados

## 🔍 Troubleshooting

### No se lee ID

1. Verificar que NFC está activado
2. Verificar que tag está a ~10cm
3. Verificar que tag es compatible
4. Revisar log de eventos para errores

### IDs inválidos frecuentes

1. Verificar formato de tag
2. Revisar calibración de distancia
3. Verificar que tag no está dañado
4. Ajustar tolerancia de distancia

### Errores de lectura

1. Revisar log de eventos
2. Verificar estadísticas de lectura
3. Comprobar que dispositivo soporta NFC
4. Reiniciar servicio

## 🔄 Integración con Backend

### Enviar ID Leído

```dart
onIdRead: (uniqueId) async {
  try {
    final response = await apiService.identifyStudent(uniqueId);
    // Procesar respuesta
  } catch (e) {
    // Manejar error de API
  }
}
```

### Sincronizar Eventos

```dart
// Exportar eventos y enviar al backend
final eventsJson = await eventLogger.exportEvents();
await apiService.syncNFCEvents(eventsJson);
```

## 📚 Referencias

- [NFC Manager Package](https://pub.dev/packages/nfc_manager)
- [ISO/IEC 14443](https://www.iso.org/standard/73596.html)
- [ISO/IEC 15693](https://www.iso.org/standard/73597.html)

