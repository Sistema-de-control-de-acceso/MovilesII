# Sistema de Gestión de Historial Completo

## 📋 Descripción

Sistema completo para mantener historial permanente de movimientos con almacenamiento optimizado, índices para consultas rápidas, políticas de retención y archivado automático.

## ✅ Acceptance Criteria Cumplidos

- ✅ **Almacenamiento permanente**: Sistema de almacenamiento permanente con archivado
- ✅ **Índices optimizados**: Múltiples índices compuestos para consultas rápidas
- ✅ **Políticas retención**: Políticas configurables de retención y archivado

## 📁 Estructura de Archivos

```
backend/
├── services/
│   ├── history_management_service.js    # Servicio principal de gestión
│   └── history_retention_service.js     # Políticas de retención y archivado
├── utils/
│   └── database_indexes.js              # Gestión de índices optimizados
├── scripts/
│   └── manage_history.js                # Script CLI para gestión
└── data/
    ├── archives/                        # Archivos de archivo (JSON)
    └── exports/                         # Exportaciones de historial
```

## 🚀 Endpoints Disponibles

### 1. Obtener Historial

```bash
GET /api/history?collection=asistencias&fechaInicio=2024-01-01&fechaFin=2024-12-31
```

**Parámetros:**
- `collection`: `asistencias` o `presencia` (default: `asistencias`)
- `fechaInicio`: Fecha de inicio (ISO format)
- `fechaFin`: Fecha de fin (ISO format)
- `codigoUniversitario`: Filtrar por código universitario
- `dni`: Filtrar por DNI
- `puntoControlId`: Filtrar por punto de control
- `includeArchived`: Incluir documentos archivados (default: `false`)
- `limit`: Límite de resultados (default: 1000)
- `skip`: Saltar resultados (default: 0)

**Respuesta:**
```json
{
  "success": true,
  "collection": "asistencias",
  "documents": [...],
  "total": 1500,
  "returned": 1000,
  "pagination": {
    "limit": 1000,
    "skip": 0,
    "totalPages": 2,
    "currentPage": 1
  }
}
```

### 2. Obtener Estadísticas

```bash
GET /api/history/stats
```

**Respuesta:**
```json
{
  "success": true,
  "collections": {
    "asistencias": {
      "total": 50000,
      "active": 45000,
      "archived": 5000,
      "archiveFiles": 5,
      "archiveSizeMB": "125.50",
      "lastMonth": 1500,
      "last3Months": 4500
    },
    "presencia": {...}
  }
}
```

### 3. Archivar Datos Antiguos

```bash
POST /api/history/archive
Body: {
  "collection": "asistencias",
  "dryRun": false,
  "forceDate": "2024-01-01"  // Opcional
}
```

### 4. Verificar Índices

```bash
GET /api/history/indexes
```

### 5. Ejecutar Mantenimiento

```bash
POST /api/history/maintenance
Body: {
  "createIndexes": true,
  "archiveOldData": true,
  "collections": ["asistencias", "presencia"],
  "async": false  // Si true, ejecuta en segundo plano
}
```

### 6. Exportar Historial

```bash
POST /api/history/export
Body: {
  "collection": "asistencias",
  "fechaInicio": "2024-01-01",
  "fechaFin": "2024-12-31",
  "format": "json"  // o "csv"
}
```

### 7. Listar Archivos de Archivo

```bash
GET /api/history/archives?collection=asistencias
```

### 8. Restaurar desde Archivo

```bash
POST /api/history/restore
Body: {
  "collection": "asistencias",
  "period": "2024-01"
}
```

## 📊 Índices Optimizados

### Colección Asistencias

1. **`idx_fecha_tipo`**: `{ fecha_hora: 1, tipo: 1 }`
   - Consultas por fecha y tipo de acceso

2. **`idx_codigo_fecha`**: `{ codigo_universitario: 1, fecha_hora: -1 }`
   - Consultas por estudiante ordenadas por fecha

3. **`idx_dni_fecha`**: `{ dni: 1, fecha_hora: -1 }`
   - Consultas por DNI ordenadas por fecha

4. **`idx_punto_control_fecha`**: `{ punto_control_id: 1, fecha_hora: -1 }`
   - Consultas por punto de control (sparse)

5. **`idx_guardia_fecha`**: `{ guardia_id: 1, fecha_hora: -1 }`
   - Consultas por guardia (sparse)

6. **`idx_facultad_fecha`**: `{ siglas_facultad: 1, fecha_hora: -1 }`
   - Consultas por facultad

7. **`idx_fecha_hora`**: `{ fecha_hora: 1 }`
   - Consultas temporales generales

8. **`idx_autorizacion_fecha`**: `{ autorizacion_manual: 1, fecha_hora: -1 }`
   - Consultas de autorizaciones manuales

9. **`idx_analisis_temporal`**: `{ fecha_hora: 1, siglas_facultad: 1, tipo: 1 }`
   - Análisis temporal avanzado

### Colección Presencia

1. **`idx_presencia_dni_entrada`**: `{ estudiante_dni: 1, hora_entrada: -1 }`
2. **`idx_presencia_estado`**: `{ esta_dentro: 1, hora_entrada: -1 }`
3. **`idx_presencia_entrada`**: `{ hora_entrada: 1 }`

## 🔧 Políticas de Retención

### Políticas por Defecto

```javascript
{
  asistencias: {
    retentionDays: 730,        // 2 años
    archiveAfterDays: 180,     // Archivar después de 6 meses
    deleteAfterDays: null      // No eliminar automáticamente
  },
  presencia: {
    retentionDays: 365,        // 1 año
    archiveAfterDays: 90,      // Archivar después de 3 meses
    deleteAfterDays: null
  }
}
```

### Configurar Política Personalizada

```javascript
const service = new HistoryManagementService(Asistencia, Presencia);
service.retentionService.setRetentionPolicy('asistencias', {
  retentionDays: 1095,      // 3 años
  archiveAfterDays: 365,    // Archivar después de 1 año
  deleteAfterDays: 1825     // Eliminar después de 5 años
});
```

## 📦 Archivado

### Particionamiento

Los datos se archivan en archivos particionados por año y mes:
- Formato: `{collection}_{YYYY-MM}.json`
- Ejemplo: `asistencias_2024-01.json`

### Proceso de Archivado

1. **Identificar documentos antiguos**: Según política de retención
2. **Agrupar por período**: Por año y mes
3. **Crear archivos JSON**: Un archivo por mes
4. **Marcar como archivados**: Campo `archived: true` en base de datos
5. **Mantener referencia**: Campo `archive_file` con nombre del archivo

### Campos de Archivado

Los documentos archivados incluyen:
- `archived`: `true`
- `archived_at`: Fecha de archivado
- `archive_file`: Nombre del archivo de archivo

## 🛠️ Scripts CLI

### Inicializar Servicio (Crear Índices)

```bash
npm run history:init
# o
node scripts/manage_history.js init
```

### Ver Estadísticas

```bash
npm run history:stats
# o
node scripts/manage_history.js stats
```

### Archivar Datos Antiguos

```bash
npm run history:archive
# o
node scripts/manage_history.js archive --collection=asistencias
node scripts/manage_history.js archive --collection=asistencias --dryRun=true
```

### Ejecutar Mantenimiento Completo

```bash
npm run history:maintenance
# o
node scripts/manage_history.js maintenance
```

### Verificar Índices

```bash
node scripts/manage_history.js indexes
```

### Exportar Historial

```bash
node scripts/manage_history.js export --collection=asistencias --fechaInicio=2024-01-01 --fechaFin=2024-12-31
```

## 📊 Consultas Optimizadas

Con los índices implementados, las siguientes consultas son optimizadas:

- ✅ Consultas por fecha y tipo
- ✅ Consultas por estudiante (código o DNI)
- ✅ Consultas por punto de control
- ✅ Consultas por guardia
- ✅ Consultas por facultad
- ✅ Análisis temporal
- ✅ Consultas de autorizaciones manuales

## 🔍 Almacenamiento Permanente

### Base de Datos

- **Colección activa**: Datos recientes y frecuentemente consultados
- **Datos archivados**: Marcados pero mantenidos en base de datos
- **Índices**: Solo en datos activos (sparse indexes)

### Archivos de Archivo

- **Ubicación**: `backend/data/archives/`
- **Formato**: JSON particionado por mes
- **Recuperación**: Restaurar desde archivos cuando sea necesario

## ⚙️ Configuración

### Variables de Entorno

No requiere configuración adicional. Usa la conexión MongoDB existente.

### Personalización

Las políticas de retención se pueden configurar por colección:

```javascript
service.retentionService.setRetentionPolicy('asistencias', {
  retentionDays: 1095,
  archiveAfterDays: 365,
  deleteAfterDays: null
});
```

## 📝 Ejemplo de Uso

### Obtener Historial de un Estudiante

```bash
GET /api/history?collection=asistencias&codigoUniversitario=20200001&limit=100
```

### Archivar Datos Antiguos

```bash
POST /api/history/archive
{
  "collection": "asistencias",
  "dryRun": false
}
```

### Exportar Historial Completo

```bash
POST /api/history/export
{
  "collection": "asistencias",
  "format": "json"
}
```

## 🔄 Mantenimiento Automático

### Programar Mantenimiento

Se recomienda ejecutar mantenimiento periódicamente (semanal o mensual):

```bash
# Usar cron job o task scheduler
0 2 * * 0 node scripts/manage_history.js maintenance
```

### Mantenimiento en Segundo Plano

```bash
POST /api/history/maintenance
{
  "async": true,
  "createIndexes": true,
  "archiveOldData": true
}
```

## 📈 Métricas y Monitoreo

### Estadísticas Disponibles

- Total de documentos
- Documentos activos vs archivados
- Número de archivos de archivo
- Tamaño de archivos de archivo
- Estadísticas por período

### Verificar Estado

```bash
GET /api/history/stats
GET /api/history/indexes
```

## ⚠️ Consideraciones

- **Espacio en disco**: Los archivos de archivo pueden crecer. Monitorear espacio.
- **Rendimiento**: Los índices mejoran consultas pero ocupan espacio.
- **Backup**: Los archivos de archivo deben incluirse en backups.
- **Recuperación**: Los datos archivados pueden restaurarse si es necesario.

## 📚 Referencias

- [MongoDB Indexes](https://www.mongodb.com/docs/manual/indexes/)
- [MongoDB Data Retention](https://www.mongodb.com/docs/manual/core/data-retention/)
- [Data Archiving Best Practices](https://www.mongodb.com/docs/manual/core/data-archiving/)
