# Sistema de Registro de Ubicación/Punto de Control

## 📋 Descripción

Sistema completo para registrar y gestionar puntos de control con información de ubicación, coordenadas GPS y descripción, permitiendo rastrear por dónde accedieron los estudiantes.

## ✅ Acceptance Criteria Cumplidos

- ✅ **ID punto control**: Campo `punto_control_id` en eventos de asistencia
- ✅ **Coordenadas si aplica**: Coordenadas GPS opcionales (lat, lng) en puntos de control y asistencias
- ✅ **Descripción ubicación**: Campo `descripcion_ubicacion` en asistencias y `ubicacion`/`descripcion` en puntos de control

## 📁 Modelos Actualizados

### Modelo Asistencia

```javascript
{
  // ... campos existentes ...
  punto_control_id: String,        // ID del punto de control
  coordenadas: String,              // Coordenadas GPS (formato: "lat,lng")
  coordenadas_lat: Number,          // Latitud GPS (opcional)
  coordenadas_lng: Number,          // Longitud GPS (opcional)
  descripcion_ubicacion: String     // Descripción de la ubicación
}
```

### Modelo PuntoControl

```javascript
{
  _id: String,                      // ID único del punto de control
  nombre: String,                   // Nombre del punto de control
  ubicacion: String,                // Descripción textual de la ubicación
  descripcion: String,              // Descripción detallada
  coordenadas_lat: Number,          // Latitud GPS (opcional)
  coordenadas_lng: Number,          // Longitud GPS (opcional)
  coordenadas: String,              // Coordenadas en formato string
  activo: Boolean,                  // Si el punto está activo
  fecha_creacion: Date,
  fecha_actualizacion: Date
}
```

## 🚀 Endpoints Disponibles

### Puntos de Control

#### 1. Listar todos los puntos de control

```bash
GET /puntos-control
```

**Respuesta:**
```json
[
  {
    "_id": "uuid",
    "nombre": "Puerta Principal",
    "ubicacion": "Entrada principal del edificio",
    "descripcion": "Punto de control en la entrada principal",
    "coordenadas_lat": -12.0464,
    "coordenadas_lng": -77.0428,
    "coordenadas": "-12.0464,-77.0428",
    "activo": true
  }
]
```

#### 2. Obtener punto de control por ID

```bash
GET /puntos-control/:id
```

#### 3. Crear punto de control

```bash
POST /puntos-control
Body: {
  "nombre": "Puerta Principal",
  "ubicacion": "Entrada principal del edificio",
  "descripcion": "Punto de control en la entrada principal",
  "coordenadas_lat": -12.0464,
  "coordenadas_lng": -77.0428,
  "coordenadas": "-12.0464,-77.0428"  // Opcional, se parsea automáticamente
}
```

**Nota**: Las coordenadas pueden proporcionarse como:
- `coordenadas_lat` y `coordenadas_lng` (números)
- `coordenadas` (string formato "lat,lng")

#### 4. Actualizar punto de control

```bash
PUT /puntos-control/:id
Body: {
  "nombre": "Puerta Principal Actualizada",
  "coordenadas_lat": -12.0465,
  "coordenadas_lng": -77.0429
}
```

#### 5. Eliminar punto de control

```bash
DELETE /puntos-control/:id
```

#### 6. Obtener mapa de puntos de control

```bash
GET /puntos-control/mapa?activo=true
```

**Respuesta:**
```json
{
  "success": true,
  "puntos": [
    {
      "id": "uuid",
      "nombre": "Puerta Principal",
      "ubicacion": "Entrada principal",
      "descripcion": "...",
      "coordenadas": {
        "lat": -12.0464,
        "lng": -77.0428
      },
      "activo": true
    }
  ],
  "total": 5,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Parámetros:**
- `activo`: Filtrar solo puntos activos (default: `true`)

### Asistencias

#### 1. Registrar asistencia con punto de control

```bash
POST /asistencias/completa
Body: {
  "_id": "uuid",
  "nombre": "Juan",
  "apellido": "Pérez",
  "dni": "12345678",
  "codigo_universitario": "20200001",
  "tipo": "entrada",
  "fecha_hora": "2024-01-15T10:30:00.000Z",
  "punto_control_id": "punto-control-uuid",
  "coordenadas_lat": -12.0464,  // Opcional, se usa del punto si no se proporciona
  "coordenadas_lng": -77.0428,  // Opcional
  "descripcion_ubicacion": "Entrada principal"  // Opcional, se usa del punto si no se proporciona
}
```

**Comportamiento:**
- Si se proporciona `punto_control_id`, se valida que exista
- Si no se proporcionan coordenadas, se usan las del punto de control
- Si no se proporciona descripción, se usa la del punto de control

#### 2. Obtener asistencias

```bash
GET /asistencias
GET /asistencias?punto_control_id=uuid
GET /asistencias?con_punto_control=true
```

**Parámetros:**
- `punto_control_id`: Filtrar por punto de control
- `con_punto_control`: Incluir información completa del punto de control

#### 3. Obtener asistencias por punto de control

```bash
GET /asistencias/por-punto-control/:puntoControlId?fechaInicio=2024-01-01&fechaFin=2024-01-31&limit=100
```

**Respuesta:**
```json
{
  "success": true,
  "punto_control": {
    "_id": "uuid",
    "nombre": "Puerta Principal",
    ...
  },
  "asistencias": [...],
  "total": 150,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 📊 Funcionalidades

### Registro de Ubicación

- **Punto de Control**: Relación directa con punto de control mediante ID
- **Coordenadas GPS**: Coordenadas opcionales (latitud, longitud)
- **Descripción**: Descripción textual de la ubicación
- **Auto-completado**: Si se proporciona punto de control, se auto-completan coordenadas y descripción

### Mapa de Puntos de Control

- Endpoint específico para obtener puntos con coordenadas GPS
- Formato optimizado para visualización en mapas
- Filtrado por puntos activos

### Consultas

- Filtrar asistencias por punto de control
- Obtener asistencias con información completa del punto de control
- Consultar asistencias de un punto de control específico con filtros de fecha

## 📝 Ejemplos de Uso

### Crear punto de control con coordenadas

```javascript
POST /puntos-control
{
  "nombre": "Puerta Principal",
  "ubicacion": "Entrada principal del edificio A",
  "descripcion": "Punto de control principal para acceso de estudiantes",
  "coordenadas_lat": -12.0464,
  "coordenadas_lng": -77.0428
}
```

### Registrar asistencia con punto de control

```javascript
POST /asistencias/completa
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "dni": "12345678",
  "codigo_universitario": "20200001",
  "tipo": "entrada",
  "fecha_hora": "2024-01-15T10:30:00.000Z",
  "punto_control_id": "punto-control-uuid"
  // Las coordenadas y descripción se obtienen automáticamente del punto de control
}
```

### Registrar asistencia con coordenadas GPS personalizadas

```javascript
POST /asistencias/completa
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "dni": "12345678",
  "codigo_universitario": "20200001",
  "tipo": "entrada",
  "fecha_hora": "2024-01-15T10:30:00.000Z",
  "punto_control_id": "punto-control-uuid",
  "coordenadas_lat": -12.0465,  // Coordenadas específicas del evento
  "coordenadas_lng": -77.0429,
  "descripcion_ubicacion": "Acceso por puerta lateral"
}
```

### Obtener mapa de puntos de control

```javascript
GET /puntos-control/mapa

// Respuesta optimizada para mapas
{
  "success": true,
  "puntos": [
    {
      "id": "uuid",
      "nombre": "Puerta Principal",
      "coordenadas": { "lat": -12.0464, "lng": -77.0428 },
      ...
    }
  ]
}
```

## 🔧 Validaciones

### Punto de Control

- `nombre` es requerido
- `coordenadas_lat` y `coordenadas_lng` son opcionales
- Si se proporcionan coordenadas en formato string, se parsean automáticamente

### Asistencia

- Si se proporciona `punto_control_id`, se valida que exista
- Si el punto de control no existe, retorna error 400
- Las coordenadas se auto-completan desde el punto de control si no se proporcionan

## 📍 Formato de Coordenadas

### Entrada

Las coordenadas pueden proporcionarse en dos formatos:

1. **Números separados**:
   ```json
   {
     "coordenadas_lat": -12.0464,
     "coordenadas_lng": -77.0428
   }
   ```

2. **String**:
   ```json
   {
     "coordenadas": "-12.0464,-77.0428"
   }
   ```

### Salida

Las coordenadas se almacenan en ambos formatos:
- `coordenadas_lat` y `coordenadas_lng` (números)
- `coordenadas` (string para compatibilidad)

## 🗺️ Visualización de Mapa

El endpoint `/puntos-control/mapa` retorna datos optimizados para visualización en mapas:

- Solo puntos con coordenadas GPS
- Formato estructurado con `lat` y `lng`
- Información relevante para marcadores
- Filtrado por puntos activos

## ⚙️ Requisitos

- MongoDB con modelos actualizados
- No requiere dependencias adicionales

## 📚 Referencias

- [Geographic Coordinate System](https://en.wikipedia.org/wiki/Geographic_coordinate_system)
- [GPS Coordinates](https://en.wikipedia.org/wiki/Global_Positioning_System)
