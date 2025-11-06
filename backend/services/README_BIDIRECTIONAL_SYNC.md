# Sincronización Bidireccional - App Móvil con Servidor Central

## 📋 Descripción

Sistema completo de sincronización bidireccional entre la app móvil y el servidor central, con versionado de datos, manejo de conflictos y sincronización automática para mantener datos consistentes.

## ✅ Acceptance Criteria Cumplidos

- ✅ **Sync bidireccional implementado**: Sincronización completa bidireccional (pull/push)
- ✅ **Manejo conflictos configurado**: Sistema completo de detección y resolución de conflictos
- ✅ **Versionado datos funcional**: Sistema de versionado para tracking de cambios

## 📁 Archivos Creados

```
backend/
├── models/
│   └── DataVersion.js                    # Modelos de versionado y sincronización
└── services/
    └── bidirectional_sync_service.js     # Servicio de sincronización bidireccional

lib/
├── models/
│   └── presencia_model.dart              # Modelo de presencia
└── services/
    ├── bidirectional_sync_service.dart   # Servicio de sincronización bidireccional
    └── local_database_service.dart       # Actualizado con versionado
```

## 🚀 Endpoints Disponibles

### 1. Registro de Dispositivos

#### Registrar dispositivo
```bash
POST /sync/register-device
Content-Type: application/json

{
  "device_id": "device-uuid",
  "device_name": "Samsung Galaxy S21",
  "device_type": "mobile",
  "app_version": "1.0.0"
}
```

**Respuesta:**
```json
{
  "success": true,
  "device": {
    "_id": "uuid",
    "device_id": "device-uuid",
    "device_name": "Samsung Galaxy S21",
    "sync_token": "token-abc123",
    "last_sync": "2024-01-15T10:00:00Z"
  },
  "sync_token": "token-abc123"
}
```

### 2. Sincronización Bidireccional

#### Obtener cambios del servidor (pull)
```bash
GET /sync/pull?device_id=xxx&last_sync=2024-01-15T10:00:00Z&collections=asistencias,presencia
```

**Respuesta:**
```json
{
  "success": true,
  "changes": [
    {
      "collection": "asistencias",
      "record_id": "uuid",
      "operation": "update",
      "data": {...},
      "version": 5,
      "last_modified": "2024-01-15T11:00:00Z",
      "hash": "abc123"
    }
  ],
  "sync_token": "token-abc123",
  "server_timestamp": "2024-01-15T12:00:00Z"
}
```

#### Subir cambios del cliente (push)
```bash
POST /sync/push
Content-Type: application/json

{
  "device_id": "device-uuid",
  "changes": [
    {
      "collection": "asistencias",
      "record_id": "uuid",
      "operation": "create",
      "data": {...},
      "version": 1,
      "hash": "def456"
    }
  ]
}
```

**Respuesta:**
```json
{
  "success": true,
  "synced": [
    {
      "status": "synced",
      "record_id": "uuid",
      "collection": "asistencias",
      "version": 2
    }
  ],
  "conflicts": [
    {
      "status": "conflict",
      "record_id": "uuid-2",
      "collection": "asistencias",
      "client_version": 3,
      "server_version": 5,
      "server_data": {...},
      "conflict_id": "conflict-uuid"
    }
  ],
  "errors": []
}
```

#### Sincronización bidireccional completa
```bash
POST /sync/bidirectional
Content-Type: application/json

{
  "device_id": "device-uuid",
  "device_info": {
    "device_name": "Samsung Galaxy S21",
    "device_type": "mobile",
    "app_version": "1.0.0"
  },
  "last_sync": "2024-01-15T10:00:00Z",
  "client_changes": [...]
}
```

**Respuesta:**
```json
{
  "success": true,
  "server_changes": {
    "changes": [...],
    "sync_token": "token-abc123",
    "server_timestamp": "2024-01-15T12:00:00Z"
  },
  "upload_results": {
    "synced": [...],
    "conflicts": [...],
    "errors": []
  },
  "sync_timestamp": "2024-01-15T12:00:00Z"
}
```

### 3. Manejo de Conflictos

#### Obtener conflictos pendientes
```bash
GET /sync/conflicts?device_id=xxx
```

**Respuesta:**
```json
{
  "success": true,
  "conflicts": [
    {
      "_id": "conflict-uuid",
      "device_id": "device-uuid",
      "collection_name": "asistencias",
      "record_id": "record-uuid",
      "client_version": 3,
      "server_version": 5,
      "server_data": {...},
      "data": {...},
      "timestamp": "2024-01-15T11:00:00Z"
    }
  ],
  "count": 1
}
```

#### Resolver conflicto
```bash
POST /sync/conflicts/:conflictId/resolve
Content-Type: application/json

{
  "strategy": "last_write_wins",
  "resolved_by": "user-uuid",
  "resolution_data": {...}
}
```

**Estrategias disponibles:**
- `server_wins`: Mantener datos del servidor
- `client_wins`: Usar datos del cliente
- `merge`: Fusionar datos
- `last_write_wins`: Usar el más reciente
- `manual`: Resolución manual

**Respuesta:**
```json
{
  "success": true,
  "record_id": "record-uuid",
  "collection": "asistencias",
  "version": 6
}
```

### 4. Versionado

#### Obtener versión de un registro
```bash
GET /sync/version/:collection/:recordId
```

**Respuesta:**
```json
{
  "success": true,
  "version": {
    "_id": "version-uuid",
    "collection_name": "asistencias",
    "record_id": "record-uuid",
    "version": 5,
    "last_modified": "2024-01-15T11:00:00Z",
    "hash": "abc123",
    "sync_status": "synced"
  }
}
```

## 📊 Sistema de Versionado

### Versiones de Datos

Cada registro tiene un número de versión que se incrementa automáticamente cuando:
- Se modifica el registro
- El hash del contenido cambia
- Se detecta un cambio real en los datos

### Hash de Datos

Se calcula un hash MD5 del contenido del registro para:
- Detectar cambios reales
- Evitar incrementos de versión innecesarios
- Validar integridad de datos

## 🔄 Manejo de Conflictos

### Detección de Conflictos

Un conflicto se detecta cuando:
- El cliente intenta actualizar un registro
- El servidor tiene una versión más reciente
- Las versiones no coinciden

### Estrategias de Resolución

1. **server_wins**: Mantener datos del servidor (por defecto para datos críticos)
2. **client_wins**: Usar datos del cliente (útil para datos locales)
3. **merge**: Fusionar datos (requiere lógica específica)
4. **last_write_wins**: Usar el más reciente por timestamp
5. **manual**: Resolución manual por el usuario

### Proceso de Resolución

1. Se detecta el conflicto durante la sincronización
2. Se guarda información del conflicto (datos cliente y servidor)
3. Se notifica al usuario
4. El usuario elige estrategia de resolución
5. Se aplica la resolución
6. Se actualiza la versión

## 🔧 Modelos de Datos

### DataVersion

```javascript
{
  _id: String,
  collection_name: String,
  record_id: String,
  version: Number,
  last_modified: Date,
  last_modified_by: String,
  device_id: String,
  hash: String,
  conflict_resolution: {
    strategy: String,
    resolved_by: String,
    resolved_at: Date,
    resolution_data: Object
  },
  sync_status: String
}
```

### DeviceSync

```javascript
{
  _id: String,
  device_id: String (único),
  device_name: String,
  device_type: String,
  app_version: String,
  last_sync: Date,
  last_sync_success: Boolean,
  sync_token: String,
  pending_changes: Number,
  conflict_count: Number
}
```

### PendingChange

```javascript
{
  _id: String,
  device_id: String,
  collection_name: String,
  record_id: String,
  operation: String ('create' | 'update' | 'delete'),
  data: Object,
  version: Number,
  timestamp: Date,
  status: String,
  retry_count: Number
}
```

## 📝 Ejemplos de Uso

### 1. Inicializar sincronización en Flutter

```dart
// En main.dart o donde se inicialice la app
final syncService = BidirectionalSyncService();
await syncService.initialize();

// Realizar sincronización
final result = await syncService.performBidirectionalSync();
if (result.success) {
  print('Sincronizado: ${result.syncedCount}');
  if (result.conflictCount > 0) {
    print('Conflictos: ${result.conflictCount}');
  }
}
```

### 2. Manejar conflictos

```dart
// Obtener conflictos
final conflicts = await syncService.getPendingConflicts();

// Resolver conflicto
for (final conflict in conflicts) {
  await syncService.resolveConflict(
    conflictId: conflict.conflictId,
    strategy: ConflictResolutionStrategy.lastWriteWins,
  );
}
```

### 3. Guardar datos offline con versionado

```dart
// Al guardar una asistencia offline
final asistencia = AsistenciaModel(...);
await localDb.saveAsistencia(asistencia, syncStatus: 'pending');

// Incrementar versión local
final version = await localDb.incrementRecordVersion('asistencias', asistencia.id);
```

## 🎯 Casos de Uso

1. **Sincronización automática**: Sincronización periódica en background
2. **Sincronización manual**: Sincronización bajo demanda
3. **Resolución de conflictos**: Manejo de conflictos detectados
4. **Versionado**: Tracking de cambios en datos
5. **Multi-dispositivo**: Sincronización entre múltiples dispositivos

## ⚙️ Requisitos

- MongoDB con colecciones `data_versions`, `device_sync`, `pending_changes`
- Node.js >= 12.0.0
- Dependencias: mongoose, uuid, crypto
- Flutter: device_info_plus, package_info_plus, shared_preferences
- Integración con sistema existente

## ✅ Estado Final

**Story Points**: 13  
**Estimación**: 52h  
**Estado**: ✅ Implementación completa  
**Prioridad**: Crítica  
**Responsable**: Mobile Engineer  
**Dependencies**: -

### Tareas Completadas

- ✅ Modelo de versionado de datos creado
- ✅ Servicio de sincronización bidireccional implementado
- ✅ Manejo de conflictos configurado
- ✅ Versionado de datos funcional
- ✅ Endpoints API creados
- ✅ Servicio Flutter implementado
- ✅ Integración con sistema existente
- ✅ Documentación completa

