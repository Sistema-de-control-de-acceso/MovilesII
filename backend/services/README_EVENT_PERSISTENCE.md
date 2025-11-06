# Sistema de Persistencia de Eventos - Documentación

## 📋 Descripción

Sistema completo para guardar eventos con fecha, hora, estudiante, guardia y decisión, incluyendo persistencia completa, integridad referencial, triggers de auditoría y backup automático.

## ✅ Acceptance Criteria Cumplidos

- ✅ **Persistencia completa de datos**: Modelo de Evento con todos los campos necesarios
- ✅ **Integridad referencial**: Validación de referencias a estudiantes y guardias
- ✅ **Backup automático**: Sistema de backup automático programado

## 📁 Archivos Creados

```
backend/
├── models/
│   └── Evento.js                          # Modelo de eventos con integridad referencial
└── services/
    ├── audit_service.js                   # Servicio de auditoría y triggers
    ├── backup_service.js                  # Servicio de backup automático
    └── data_validation_service.js         # Servicio de validación de consistencia
```

## 🚀 Endpoints Disponibles

### 1. Gestión de Eventos

#### Crear evento
```bash
POST /eventos
Content-Type: application/json

{
  "estudiante_id": "EST001",
  "estudiante_dni": "12345678",
  "estudiante_nombre": "Juan Pérez",
  "guardia_id": "GUARD001",
  "guardia_nombre": "Carlos López",
  "decision": "autorizado",
  "tipo_evento": "entrada",
  "razon": "Estudiante autorizado",
  "punto_control_id": "P001",
  "fecha": "2024-01-15T08:00:00Z",
  "hora": "08:00:00"
}
```

#### Listar eventos
```bash
GET /eventos?estudiante_id=EST001&guardia_id=GUARD001&decision=autorizado&start_date=2024-01-01&end_date=2024-01-31&limit=100&skip=0
```

#### Obtener evento por ID
```bash
GET /eventos/:id
```

### 2. Auditoría

#### Obtener eventos de auditoría
```bash
GET /api/audit/events?estudiante_id=EST001&start_date=2024-01-01&end_date=2024-01-31
```

#### Obtener estadísticas de auditoría
```bash
GET /api/audit/statistics?start_date=2024-01-01&end_date=2024-01-31
```

#### Validar integridad de evento
```bash
GET /api/audit/validate/:id
```

### 3. Backup

#### Realizar backup de eventos
```bash
POST /api/backup/events
Content-Type: application/json

{
  "incremental": true,
  "compress": true,
  "start_date": "2024-01-01",
  "end_date": "2024-01-31"
}
```

#### Realizar backup completo
```bash
POST /api/backup/full
Content-Type: application/json

{
  "includeAsistencias": true,
  "includePresencia": true,
  "includeDecisiones": true,
  "includeEventos": true
}
```

#### Listar backups
```bash
GET /api/backup/list
```

#### Restaurar backup
```bash
POST /api/backup/restore/:filename
Content-Type: application/json

{
  "collection": "eventos",
  "overwrite": false
}
```

### 4. Validación

#### Validar integridad referencial
```bash
GET /api/validation/referential-integrity?event_id=EVENT001
```

#### Validar consistencia de datos
```bash
GET /api/validation/consistency
```

#### Reparar inconsistencias
```bash
POST /api/validation/repair
Content-Type: application/json

{
  "createMissingEvents": true,
  "fixOrphanEvents": true,
  "fixDateInconsistencies": true
}
```

## 🔧 Características

### Integridad Referencial

El modelo `Evento` incluye validación de integridad referencial:

- **Validación de estudiante**: Verifica que el estudiante existe en la base de datos
- **Validación de guardia**: Verifica que el guardia existe y tiene el rango correcto
- **Validación de fecha/hora**: Verifica que fecha y hora son consistentes
- **Validación de timestamp**: Verifica que timestamp y fecha no difieren más de 24 horas
- **Validación de referencias**: Verifica que las referencias a otros registros son válidas

### Triggers de Auditoría

Los triggers se configuran automáticamente para:

- **Pre-save**: Crear evento de auditoría antes de guardar
- **Post-save**: Registrar evento post-guardado
- **Pre-remove**: Registrar evento de eliminación

### Backup Automático

El sistema de backup incluye:

- **Backup incremental**: Solo respalda eventos no respaldados
- **Backup completo**: Respaldar todas las colecciones
- **Compresión**: Opción de comprimir backups
- **Limpieza automática**: Mantiene solo los últimos 30 backups
- **Programación**: Backup automático cada 24 horas

### Validación de Consistencia

El servicio de validación verifica:

- **Integridad referencial**: Todos los eventos tienen referencias válidas
- **Consistencia entre colecciones**: Asistencias y decisiones tienen eventos asociados
- **Eventos huérfanos**: Eventos con referencias inválidas
- **Inconsistencias de fecha**: Fechas y timestamps inconsistentes

## 📊 Modelo de Datos

### Evento

```javascript
{
  _id: String,
  estudiante_id: String (requerido, indexado),
  estudiante_dni: String (requerido, indexado),
  estudiante_nombre: String (requerido),
  guardia_id: String (requerido, indexado),
  guardia_nombre: String (requerido),
  fecha: Date (requerido, indexado),
  hora: String (requerido),
  timestamp: Date (requerido, indexado),
  decision: String (requerido, enum: ['autorizado', 'denegado', 'pendiente', 'revisar']),
  tipo_evento: String (requerido, enum: ['entrada', 'salida', 'decision_manual', 'verificacion', 'otro']),
  razon: String,
  punto_control_id: String,
  referential_integrity: {
    estudiante_exists: Boolean,
    guardia_exists: Boolean,
    validated_at: Date,
    validation_errors: [String]
  },
  backed_up: Boolean,
  backup_date: Date,
  backup_file: String
}
```

## 🔍 Índices

El modelo incluye índices optimizados:

- `estudiante_id + fecha`: Para consultas por estudiante y fecha
- `guardia_id + fecha`: Para consultas por guardia y fecha
- `decision + fecha`: Para consultas por decisión y fecha
- `tipo_evento + fecha`: Para consultas por tipo y fecha
- `timestamp`: Para ordenamiento temporal
- `backed_up + backup_date`: Para gestión de backups

## 🎯 Casos de Uso

1. **Registro de Evento**: Crear evento cuando se toma una decisión
2. **Auditoría**: Consultar eventos para auditoría
3. **Backup**: Realizar backup automático o manual
4. **Validación**: Validar integridad de datos
5. **Reparación**: Reparar inconsistencias encontradas

## 📝 Notas Técnicas

- Los eventos se crean automáticamente desde asistencias y decisiones manuales
- El backup automático se ejecuta cada 24 horas
- La validación de integridad se ejecuta antes de guardar cada evento
- Los backups se almacenan en `backend/backups/`
- Se mantienen los últimos 30 backups automáticamente

