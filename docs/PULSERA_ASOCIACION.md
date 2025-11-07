# Asociación Pulsera-Estudiante - Documentación

Sistema completo para asociar IDs únicos de pulseras NFC con estudiantes, vinculando identidad física con digital.

## 📋 Características

- ✅ **Mapping ID-Estudiante**: Tabla de asociaciones con información completa
- ✅ **CRUD Completo**: Crear, leer, actualizar y eliminar asociaciones
- ✅ **Validaciones de Integridad**: Validación de formato, duplicados y referencias
- ✅ **Manejo de Casos No Encontrados**: Respuestas descriptivas y acciones recomendadas

## 🏗️ Arquitectura

### Backend (Node.js + MongoDB)

#### Modelo: PulseraAsociacion
```javascript
{
  _id: UUID,
  pulsera_id: String (hexadecimal, único),
  estudiante_id: String,
  estudiante: {
    codigo_universitario: String,
    dni: String,
    nombre: String,
    apellido: String,
    facultad: String,
    escuela: String
  },
  estado: enum['activa', 'inactiva', 'suspendida', 'perdida'],
  fecha_asociacion: Date,
  fecha_activacion: Date,
  fecha_desactivacion: Date,
  contador_lecturas: Number,
  historial: Array
}
```

#### Endpoints

**POST /api/pulseras-asociaciones**
- Crear nueva asociación
- Valida formato de pulsera_id
- Verifica existencia del estudiante
- Previene duplicados

**GET /api/pulseras-asociaciones**
- Listar todas las asociaciones
- Filtros: estado, código, DNI, facultad
- Paginación incluida

**GET /api/pulseras-asociaciones/pulsera/:pulsera_id**
- Obtener asociación por ID de pulsera
- Maneja caso no encontrado

**GET /api/pulseras-asociaciones/estudiante/:codigo_universitario**
- Obtener todas las pulseras de un estudiante
- Incluye historial completo

**PUT /api/pulseras-asociaciones/:id**
- Actualizar estado de asociación
- Registra historial de cambios

**DELETE /api/pulseras-asociaciones/:id**
- Soft delete (desactivación)
- No elimina físicamente

**POST /api/pulseras-asociaciones/verificar**
- Verificar si pulsera está asociada y activa
- Incrementa contador de lecturas
- Retorna información del estudiante

**GET /api/pulseras-asociaciones/stats/general**
- Estadísticas de asociaciones
- Total por estado
- Porcentajes

### Flutter

#### Modelos
- `PulseraAsociacion`: Modelo principal
- `EstudianteInfo`: Información del estudiante
- `VerificacionPulseraResult`: Resultado de verificación
- `AsociacionesStats`: Estadísticas

#### Servicios
- `PulseraAsociacionService`: CRUD y operaciones con API
- Integración con `NFCPreciseReaderService` para lectura

#### Pantallas
- `PulseraAsociacionScreen`: Gestión completa de asociaciones
  - Lista de asociaciones con filtros
  - Estadísticas en tiempo real
  - Creación con NFC o manual
  - Verificación de pulseras
  - Actualización de estados

## 🔧 Uso

### Backend

#### Crear Asociación

```javascript
POST /api/pulseras-asociaciones
{
  "pulsera_id": "04:12:34:56:78:90:AB:CD",
  "codigo_universitario": "2020001234",
  "usuario": {
    "_id": "user123",
    "nombre": "Admin User"
  }
}
```

Respuesta exitosa (201):
```json
{
  "success": true,
  "message": "Asociación creada exitosamente",
  "asociacion": { ... }
}
```

Respuesta error - Pulsera duplicada (409):
```json
{
  "error": "Esta pulsera ya está asociada a otro estudiante",
  "asociacion_existente": {
    "estudiante": { ... },
    "estado": "activa"
  }
}
```

Respuesta error - Estudiante no encontrado (404):
```json
{
  "error": "Estudiante no encontrado o inactivo",
  "codigo_universitario": "2020001234"
}
```

#### Verificar Pulsera

```javascript
POST /api/pulseras-asociaciones/verificar
{
  "pulsera_id": "04:12:34:56:78:90:AB:CD"
}
```

Respuesta encontrada (200):
```json
{
  "encontrado": true,
  "asociacion": {
    "estudiante": {
      "codigo_universitario": "2020001234",
      "nombre": "Juan",
      "apellido": "Pérez"
    },
    "estado": "activa",
    "contador_lecturas": 42
  }
}
```

Respuesta no encontrada (404):
```json
{
  "encontrado": false,
  "error": "Pulsera no encontrada o no activa",
  "pulsera_id": "04:12:34:56:78:90:AB:CD",
  "accion_recomendada": "Asociar pulsera a un estudiante"
}
```

### Flutter

#### Crear Asociación

```dart
final service = PulseraAsociacionService();

try {
  final asociacion = await service.crearAsociacion(
    pulseraId: '04:12:34:56:78:90:AB:CD',
    codigoUniversitario: '2020001234',
  );
  print('Asociación creada: ${asociacion.id}');
} on AsociacionDuplicadaException catch (e) {
  print('Pulsera ya asociada: ${e.message}');
} on EstudianteNoEncontradoException catch (e) {
  print('Estudiante no encontrado: ${e.message}');
}
```

#### Verificar Pulsera

```dart
final resultado = await service.verificarPulsera('04:12:34:56:78:90:AB:CD');

if (resultado.encontrado) {
  print('Estudiante: ${resultado.asociacion!.estudiante.nombreCompleto}');
} else {
  print('Error: ${resultado.error}');
  print('Acción: ${resultado.accionRecomendada}');
}
```

#### Integración con NFC

```dart
// En la pantalla de asociación, leer con NFC
await _nfcService.initialize();
await _nfcService.startPreciseReading(
  onIdRead: (uniqueId) async {
    // Verificar si ya está asociada
    final resultado = await _asociacionService.verificarPulsera(uniqueId);
    
    if (resultado.encontrado) {
      // Ya está asociada, mostrar información
      _mostrarInfo(resultado.asociacion!);
    } else {
      // No está asociada, ofrecer crear asociación
      _crearAsociacion(uniqueId);
    }
  },
);
```

## ✅ Validaciones

### 1. Validación de Formato de Pulsera ID
- Debe ser hexadecimal: `^[0-9A-F:]+$`
- Ejemplo válido: `04:12:34:56:78:90:AB:CD`
- Ejemplo inválido: `INVALID`

### 2. Validación de Unicidad
- Una pulsera solo puede estar asociada a un estudiante activo
- Si la pulsera ya está asociada, se retorna error 409
- Se permite reasociar pulseras inactivas

### 3. Validación de Existencia de Estudiante
- Verifica que el estudiante exista en la base de datos
- Verifica que el estudiante esté activo (`estado: true`)
- Si no existe, retorna error 404

### 4. Validación de Integridad Referencial
- Al crear asociación, se copia información del estudiante
- Información desnormalizada para consultas rápidas
- Actualizaciones requieren verificación de estudiante

## 🔍 Manejo de Casos No Encontrados

### Pulsera No Encontrada

Respuesta descriptiva:
```json
{
  "error": "Pulsera no encontrada",
  "pulsera_id": "04:12:34:56:78:90:AB:CD",
  "sugerencia": "Verificar que el ID de pulsera sea correcto y esté asociado"
}
```

Acción recomendada en UI:
- Mostrar mensaje de error claro
- Ofrecer crear nueva asociación
- Sugerir verificar el ID de pulsera

### Estudiante No Encontrado

Respuesta descriptiva:
```json
{
  "error": "Estudiante no encontrado o inactivo",
  "codigo_universitario": "2020001234"
}
```

Acción recomendada en UI:
- Verificar código universitario
- Confirmar que estudiante está registrado
- Verificar estado del estudiante

### Asociación Duplicada

Respuesta con información de conflicto:
```json
{
  "error": "Esta pulsera ya está asociada a otro estudiante",
  "asociacion_existente": {
    "estudiante": { ... },
    "estado": "activa",
    "fecha_asociacion": "2024-01-15T10:30:00.000Z"
  }
}
```

Acción recomendada en UI:
- Mostrar información del estudiante actual
- Ofrecer desasociar primero
- Confirmar si se quiere reasignar

## 📊 Estados de Asociación

- **activa**: Pulsera activa y funcional
- **inactiva**: Temporalmente desactivada
- **suspendida**: Suspendida por motivo administrativo
- **perdida**: Reportada como perdida, bloqueada

## 🧪 Tests

### Tests Backend

```bash
npm test backend/test/pulseras-asociaciones.test.js
```

Cobertura:
- Creación de asociaciones
- Validación de formato
- Manejo de duplicados
- Verificación de pulseras
- Actualización de estados
- Estadísticas

### Tests Flutter

```bash
flutter test test/pulsera_asociacion_test.dart
```

## 📈 Métricas

El sistema registra:
- Total de asociaciones
- Asociaciones por estado
- Contador de lecturas por pulsera
- Última lectura de cada pulsera
- Historial de cambios de estado

## 🔄 Flujo de Trabajo

1. **Registrar Nueva Pulsera**:
   - Leer ID con NFC o ingresar manualmente
   - Verificar que no esté asociada
   - Buscar estudiante por código
   - Crear asociación

2. **Verificar Pulsera en Lectura**:
   - Leer ID con NFC
   - Verificar asociación activa
   - Incrementar contador de lecturas
   - Retornar información del estudiante

3. **Actualizar Estado**:
   - Activar/desactivar según necesidad
   - Registrar motivo si se desactiva
   - Mantener historial de cambios

4. **Reportar Perdida**:
   - Cambiar estado a "perdida"
   - Bloquear futuras lecturas
   - Notificar al administrador

## 🔐 Seguridad

- Validación de permisos en cada endpoint
- Auditoría completa de cambios
- Soft delete (no se elimina información)
- Historial inmutable de cambios

## 📚 Referencias

- Modelo: `backend/models/PulseraAsociacion.js`
- Rutas: `backend/routes/pulseras-asociaciones.js`
- Servicio Flutter: `lib/services/pulsera_asociacion_service.dart`
- Pantalla: `lib/screens/pulsera_asociacion_screen.dart`

