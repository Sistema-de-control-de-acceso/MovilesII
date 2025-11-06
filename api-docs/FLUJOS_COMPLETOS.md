# 🔄 Flujos Completos - API Acees Group

Esta guía documenta los flujos completos de uso de la API con ejemplos paso a paso.

## 📋 Tabla de Contenidos

1. [Flujo de Registro de Entrada (NFC)](#flujo-de-registro-de-entrada-nfc)
2. [Flujo de Registro de Salida](#flujo-de-registro-de-salida)
3. [Flujo de Sesión de Guardia](#flujo-de-sesión-de-guardia)
4. [Flujo de Decisión Manual](#flujo-de-decisión-manual)
5. [Flujo de Gestión de Usuarios (Admin)](#flujo-de-gestión-de-usuarios-admin)
6. [Flujo de Predicción ML](#flujo-de-predicción-ml)

---

## 🎓 Flujo de Registro de Entrada (NFC)

### Descripción

Flujo completo para registrar la entrada de un estudiante usando NFC.

### Pasos

#### 1. Login del Guardia

```http
POST /login
Content-Type: application/json

{
  "email": "guardia@ejemplo.com",
  "password": "contraseña123"
}
```

**Response**:
```json
{
  "id": "guardia_id_123",
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "guardia@ejemplo.com",
  "dni": "12345678",
  "rango": "guardia",
  "puerta_acargo": "Puerta Principal",
  "estado": "activo"
}
```

#### 2. Buscar Alumno por Código NFC

```http
GET /alumnos/20201234
```

**Response**:
```json
{
  "_id": "alumno_id_123",
  "_identificacion": "ID123",
  "nombre": "María",
  "apellido": "González",
  "dni": "87654321",
  "codigo_universitario": "20201234",
  "escuela_profesional": "Ingeniería de Sistemas",
  "facultad": "Facultad de Ciencias",
  "siglas_escuela": "IS",
  "siglas_facultad": "FC",
  "estado": true
}
```

#### 3. Determinar Tipo de Acceso Inteligente

```http
GET /asistencias/ultimo-acceso/87654321
```

**Response**:
```json
{
  "ultimo_tipo": "salida"
}
```

**Lógica**: Si último fue "salida", ahora debería ser "entrada".

#### 4. Registrar Asistencia

```http
POST /asistencias
Content-Type: application/json

{
  "_id": "asistencia_id_123",
  "nombre": "María",
  "apellido": "González",
  "dni": "87654321",
  "codigo_universitario": "20201234",
  "siglas_facultad": "FC",
  "siglas_escuela": "IS",
  "tipo": "entrada",
  "fecha_hora": "2025-01-15T10:30:00.000Z",
  "entrada_tipo": "entrada",
  "puerta": "Puerta Principal",
  "guardia_id": "guardia_id_123",
  "guardia_nombre": "Juan Pérez",
  "autorizacion_manual": false,
  "coordenadas": "-12.0464,-77.0428",
  "descripcion_ubicacion": "Campus Principal"
}
```

**Response** (201):
```json
{
  "_id": "asistencia_id_123",
  "nombre": "María",
  "apellido": "González",
  "dni": "87654321",
  "codigo_universitario": "20201234",
  "tipo": "entrada",
  "fecha_hora": "2025-01-15T10:30:00.000Z",
  "puerta": "Puerta Principal",
  "guardia_id": "guardia_id_123",
  "guardia_nombre": "Juan Pérez"
}
```

#### 5. Actualizar Presencia

```http
POST /presencia/actualizar
Content-Type: application/json

{
  "estudiante_dni": "87654321",
  "tipo_acceso": "entrada",
  "punto_control": "Puerta Principal",
  "guardia_id": "guardia_id_123"
}
```

**Response** (200):
```json
{
  "_id": "presencia_id_123",
  "estudiante_id": "alumno_id_123",
  "estudiante_dni": "87654321",
  "estudiante_nombre": "María González",
  "facultad": "FC",
  "escuela": "IS",
  "hora_entrada": "2025-01-15T10:30:00.000Z",
  "punto_entrada": "Puerta Principal",
  "esta_dentro": true,
  "guardia_entrada": "guardia_id_123"
}
```

### Diagrama de Flujo

```
[Login] → [Buscar Alumno] → [Determinar Tipo] → [Registrar Asistencia] → [Actualizar Presencia]
```

---

## 🚪 Flujo de Registro de Salida

### Descripción

Flujo completo para registrar la salida de un estudiante.

### Pasos

#### 1. Buscar Alumno

```http
GET /alumnos/20201234
```

#### 2. Verificar Presencia Actual

```http
GET /presencia
```

Buscar al estudiante en la lista de presentes.

#### 3. Registrar Asistencia (Salida)

```http
POST /asistencias
Content-Type: application/json

{
  "nombre": "María",
  "apellido": "González",
  "dni": "87654321",
  "codigo_universitario": "20201234",
  "tipo": "salida",
  "fecha_hora": "2025-01-15T18:00:00.000Z",
  "puerta": "Puerta Principal",
  "guardia_id": "guardia_id_123",
  "guardia_nombre": "Juan Pérez"
}
```

#### 4. Actualizar Presencia (Salida)

```http
POST /presencia/actualizar
Content-Type: application/json

{
  "estudiante_dni": "87654321",
  "tipo_acceso": "salida",
  "punto_control": "Puerta Principal",
  "guardia_id": "guardia_id_123"
}
```

**Response**:
```json
{
  "_id": "presencia_id_123",
  "estudiante_dni": "87654321",
  "hora_entrada": "2025-01-15T10:30:00.000Z",
  "hora_salida": "2025-01-15T18:00:00.000Z",
  "esta_dentro": false,
  "tiempo_en_campus": 27000000
}
```

---

## 👮 Flujo de Sesión de Guardia

### Descripción

Flujo completo para iniciar, mantener y finalizar una sesión de guardia.

### Pasos

#### 1. Login del Guardia

```http
POST /login
```

#### 2. Iniciar Sesión de Guardia

```http
POST /sesiones/iniciar
Content-Type: application/json

{
  "guardia_id": "guardia_id_123",
  "guardia_nombre": "Juan Pérez",
  "punto_control": "Puerta Principal",
  "device_info": {
    "platform": "Android",
    "device_id": "device_123",
    "app_version": "1.0.0"
  }
}
```

**Response** (201):
```json
{
  "session_token": "uuid-session-token-123",
  "message": "Sesión iniciada exitosamente",
  "session": {
    "_id": "uuid-session-token-123",
    "guardia_id": "guardia_id_123",
    "guardia_nombre": "Juan Pérez",
    "punto_control": "Puerta Principal",
    "is_active": true,
    "fecha_inicio": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error** (409) - Conflicto:
```json
{
  "error": "Otro guardia está activo en este punto de control",
  "conflict": true,
  "active_guard": {
    "guardia_id": "guardia_id_456",
    "guardia_nombre": "Pedro García",
    "session_start": "2025-01-15T09:00:00.000Z"
  }
}
```

#### 3. Enviar Heartbeat (cada 30 segundos)

```http
POST /sesiones/heartbeat
Content-Type: application/json

{
  "session_token": "uuid-session-token-123"
}
```

**Response** (200):
```json
{
  "message": "Heartbeat registrado",
  "last_activity": "2025-01-15T10:35:00.000Z"
}
```

#### 4. Finalizar Sesión

```http
POST /sesiones/finalizar
Content-Type: application/json

{
  "session_token": "uuid-session-token-123"
}
```

**Response** (200):
```json
{
  "message": "Sesión finalizada exitosamente"
}
```

### Diagrama de Flujo

```
[Login] → [Iniciar Sesión] → [Heartbeat Loop] → [Finalizar Sesión]
                ↓
         [Verificar Conflictos]
```

---

## ✅ Flujo de Decisión Manual

### Descripción

Flujo completo para que un guardia tome una decisión manual sobre el acceso de un estudiante.

### Pasos

#### 1. Buscar Alumno

```http
GET /alumnos/20201234
```

#### 2. Registrar Decisión Manual

```http
POST /decisiones-manuales
Content-Type: application/json

{
  "_id": "decision_id_123",
  "estudiante_id": "alumno_id_123",
  "estudiante_dni": "87654321",
  "estudiante_nombre": "María González",
  "guardia_id": "guardia_id_123",
  "guardia_nombre": "Juan Pérez",
  "autorizado": true,
  "razon": "Estudiante autorizado por administración",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "punto_control": "Puerta Principal",
  "tipo_acceso": "entrada",
  "datos_estudiante": {
    "codigo_universitario": "20201234",
    "facultad": "FC"
  }
}
```

**Response** (201):
```json
{
  "_id": "decision_id_123",
  "estudiante_dni": "87654321",
  "guardia_id": "guardia_id_123",
  "autorizado": true,
  "razon": "Estudiante autorizado por administración",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

#### 3. Registrar Asistencia Completa

```http
POST /asistencias/completa
Content-Type: application/json

{
  "nombre": "María",
  "apellido": "González",
  "dni": "87654321",
  "codigo_universitario": "20201234",
  "tipo": "entrada",
  "fecha_hora": "2025-01-15T10:30:00.000Z",
  "puerta": "Puerta Principal",
  "guardia_id": "guardia_id_123",
  "guardia_nombre": "Juan Pérez",
  "autorizacion_manual": true,
  "razon_decision": "Estudiante autorizado por administración",
  "timestamp_decision": "2025-01-15T10:30:00.000Z"
}
```

#### 4. Actualizar Presencia

```http
POST /presencia/actualizar
Content-Type: application/json

{
  "estudiante_dni": "87654321",
  "tipo_acceso": "entrada",
  "punto_control": "Puerta Principal",
  "guardia_id": "guardia_id_123"
}
```

---

## 👨‍💼 Flujo de Gestión de Usuarios (Admin)

### Descripción

Flujo completo para que un administrador gestione usuarios.

### Pasos

#### 1. Login como Admin

```http
POST /login
```

#### 2. Listar Usuarios

```http
GET /usuarios
```

#### 3. Crear Nuevo Usuario

```http
POST /usuarios
Content-Type: application/json

{
  "nombre": "Pedro",
  "apellido": "García",
  "dni": "11223344",
  "email": "pedro@ejemplo.com",
  "password": "contraseña123",
  "rango": "guardia",
  "puerta_acargo": "Puerta Secundaria",
  "telefono": "987654321"
}
```

#### 4. Actualizar Usuario

```http
PUT /usuarios/user_id_456
Content-Type: application/json

{
  "estado": "inactivo",
  "telefono": "987654322"
}
```

#### 5. Cambiar Contraseña de Usuario

```http
PUT /usuarios/user_id_456/password
Content-Type: application/json

{
  "password": "nueva_contraseña123"
}
```

#### 6. Forzar Finalización de Sesión

```http
POST /sesiones/forzar-finalizacion
Content-Type: application/json

{
  "guardia_id": "guardia_id_123",
  "admin_id": "admin_id_456"
}
```

---

## 🤖 Flujo de Predicción ML

### Descripción

Flujo completo para obtener predicciones de demanda de buses nocturnos usando Machine Learning.

### Pasos

#### 1. Obtener Datos Históricos

```http
GET /ml/datos-historicos?fecha_inicio=2024-10-01T00:00:00.000Z&fecha_fin=2025-01-15T23:59:59.999Z
```

**Response**:
```json
{
  "success": true,
  "datos_ml": {
    "total_registros": 1500,
    "salidas_por_hora": {
      "17": 50,
      "18": 120,
      "19": 200,
      "20": 180
    },
    "tiempo_promedio_campus": 6.5,
    "estudiantes_presentes": 450
  }
}
```

#### 2. Obtener Estado Actual

```http
GET /ml/estado-actual
```

**Response**:
```json
{
  "success": true,
  "estado_actual": {
    "timestamp": "2025-01-15T10:30:00.000Z",
    "hora_actual": 10,
    "presencia": {
      "total_estudiantes": 450,
      "distribucion_facultades": {
        "FC": 150,
        "FI": 120
      }
    }
  }
}
```

#### 3. Almacenar Recomendación

```http
POST /ml/recomendaciones-buses
Content-Type: application/json

{
  "horario_recomendado": "20:00",
  "numero_buses_sugeridos": 3,
  "estudiantes_esperados": 180,
  "porcentaje_ocupacion": 75,
  "facultades_principales": ["FC", "FI"],
  "justificacion": "Pico de salida histórico",
  "modelo_version": "1.0",
  "confianza_prediccion": 0.85
}
```

#### 4. Obtener Recomendaciones

```http
GET /ml/recomendaciones-buses?limite=10&solo_recientes=true
```

#### 5. Registrar Feedback

```http
POST /ml/feedback
Content-Type: application/json

{
  "recomendacion_id": "recomendacion_id_123",
  "horario_real_utilizado": "20:30",
  "buses_reales_utilizados": 4,
  "estudiantes_reales": 200,
  "efectividad_recomendacion": 0.85,
  "comentarios": "Se necesitaron más buses de lo predicho"
}
```

---

## 📊 Diagramas de Flujo Visuales

### Flujo de Entrada Completo

```
┌─────────┐
│  Login  │
└────┬────┘
     │
     ▼
┌──────────────────┐
│ Buscar Alumno    │
│ (por código NFC) │
└────┬─────────────┘
     │
     ▼
┌──────────────────────┐
│ Determinar Tipo      │
│ (entrada/salida)     │
└────┬─────────────────┘
     │
     ▼
┌──────────────────┐
│ Registrar        │
│ Asistencia       │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Actualizar       │
│ Presencia        │
└──────────────────┘
```

---

## 🎯 Casos de Uso Comunes

### Caso 1: Estudiante con NFC Válido

1. Escanear NFC → Buscar alumno → Registrar entrada → Actualizar presencia

### Caso 2: Estudiante sin NFC o Problema

1. Buscar manualmente → Decisión manual → Registrar asistencia completa

### Caso 3: Múltiples Guardias en Mismo Punto

1. Guardia 1 inicia sesión → Guardia 2 intenta iniciar → Error 409 (conflicto)

### Caso 4: Estudiante Sale del Campus

1. Buscar alumno → Verificar presencia → Registrar salida → Actualizar presencia

---

**Última actualización**: Enero 2025

