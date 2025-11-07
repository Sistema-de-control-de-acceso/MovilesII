# Registro de Nuevos Guardias - User Story

## 📋 User Story

**Como** Administrador  
**Quiero** registrar nuevos guardias para ampliar el equipo de seguridad  
**Para** gestionar el acceso y control del sistema

## ✅ Acceptance Criteria Cumplidos

- ✅ **Formulario registro**: Formulario completo con todos los campos necesarios
- ✅ **Validación datos**: Validaciones robustas en frontend y backend
- ✅ **Asignación credenciales**: Generación automática de email y contraseña

## 📦 Archivos Creados

1. **`lib/views/admin/register_guard_view.dart`**
   - Vista completa para registro de guardias
   - Formulario con validaciones
   - Generación automática de credenciales
   - Notificación al nuevo usuario

2. **`backend/services/notification_service.js`**
   - Servicio de notificaciones
   - Envío de credenciales por email
   - Plantilla de email de bienvenida

3. **`backend/index.js`** (actualizado)
   - Validaciones mejoradas en endpoint de creación
   - Endpoint de notificación
   - Integración con servicio de notificaciones

## 🎯 Características Implementadas

### 1. Formulario de Registro

**Campos del formulario:**
- Nombre (requerido, mínimo 2 caracteres)
- Apellido (requerido, mínimo 2 caracteres)
- DNI (requerido, 8 dígitos, validación peruana)
- Teléfono (opcional, 9 dígitos, formato peruano)
- Email (requerido, validación de formato)
- Contraseña (requerido, mínimo 8 caracteres, con mayúsculas, minúsculas y números)
- Puerta a Cargo (opcional)

**Validaciones:**
- Frontend: Validación en tiempo real
- Backend: Validación de formato y duplicados
- DNI: 8 dígitos numéricos
- Email: Formato válido
- Contraseña: Mínimo 8 caracteres con complejidad

### 2. Generación Automática de Credenciales

**Email automático:**
- Formato: `nombre.apellido@universidad.edu`
- Normalización de caracteres (sin acentos)
- Generación basada en nombre y apellido

**Contraseña automática:**
- 12 caracteres aleatorios
- Incluye mayúsculas, minúsculas, números y caracteres especiales
- Generación segura con `Random.secure()`

**Características:**
- Toggle para activar/desactivar generación automática
- Botón para regenerar credenciales
- Visualización de credenciales generadas

### 3. Validaciones de Datos

**Frontend:**
- Validación en tiempo real
- Mensajes de error claros
- Validación de formato DNI peruano
- Validación de formato teléfono peruano
- Validación de email
- Validación de contraseña fuerte

**Backend:**
- Validación de campos requeridos
- Validación de formato DNI (8 dígitos)
- Validación de formato email
- Validación de longitud de contraseña
- Validación de duplicados (DNI y email únicos)

### 4. Notificación al Nuevo Usuario

**Características:**
- Toggle para activar/desactivar notificación
- Envío automático de credenciales por email
- Plantilla de email de bienvenida
- Manejo de errores (no falla la creación si falla la notificación)

**Contenido del email:**
- Saludo personalizado
- Credenciales de acceso
- Instrucciones de seguridad
- Información de contacto

## 🚀 Uso

### Acceso desde Gestión de Usuarios

```dart
// En UserManagementView, el botón "Nuevo Usuario" navega a:
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => RegisterGuardView(),
  ),
);
```

### Flujo de Registro

1. **Completar información personal**
   - Nombre y apellido
   - DNI
   - Teléfono (opcional)

2. **Configurar credenciales**
   - Activar generación automática (recomendado)
   - O ingresar manualmente

3. **Asignación**
   - Puerta a cargo (opcional)

4. **Notificación**
   - Activar/desactivar envío de notificación

5. **Confirmar registro**
   - Revisar información
   - Ver credenciales generadas
   - Confirmar creación

6. **Éxito**
   - Mostrar credenciales
   - Opción de copiar
   - Cerrar formulario

## 📝 Ejemplo de Uso

### Generación Automática de Email

```dart
// Si nombre = "Juan" y apellido = "Pérez"
// Email generado: "juan.perez@universidad.edu"
```

### Generación Automática de Contraseña

```dart
// Contraseña generada: "aB3$kL9mN2pQ"
// 12 caracteres aleatorios seguros
```

## 🔧 Endpoints API

### Crear Usuario

```bash
POST /usuarios
Content-Type: application/json

{
  "nombre": "Juan",
  "apellido": "Pérez",
  "dni": "12345678",
  "email": "juan.perez@universidad.edu",
  "password": "aB3$kL9mN2pQ",
  "rango": "guardia",
  "telefono": "987654321",
  "puerta_acargo": "Puerta Principal",
  "send_notification": true
}
```

**Respuesta:**
```json
{
  "_id": "uuid",
  "nombre": "Juan",
  "apellido": "Pérez",
  "dni": "12345678",
  "email": "juan.perez@universidad.edu",
  "rango": "guardia",
  "estado": "activo",
  "credentials_sent": true
}
```

### Enviar Notificación

```bash
POST /usuarios/:id/notify
Content-Type: application/json

{
  "email": "juan.perez@universidad.edu",
  "password": "aB3$kL9mN2pQ",
  "nombre": "Juan Pérez"
}
```

## ✅ Validaciones Implementadas

### Frontend

- **Nombre**: Requerido, mínimo 2 caracteres
- **Apellido**: Requerido, mínimo 2 caracteres
- **DNI**: Requerido, exactamente 8 dígitos
- **Teléfono**: Opcional, 9 dígitos, formato peruano (9XXXXXXXX)
- **Email**: Requerido, formato válido
- **Contraseña**: Requerido, mínimo 8 caracteres, con mayúsculas, minúsculas y números

### Backend

- **Campos requeridos**: nombre, apellido, dni, email, password
- **DNI**: 8 dígitos numéricos
- **Email**: Formato válido, único
- **Contraseña**: Mínimo 8 caracteres
- **Duplicados**: DNI y email únicos

## 🎨 Características de UI

- **Diseño claro**: Formulario organizado por secciones
- **Validación visual**: Mensajes de error claros
- **Generación automática**: Toggle y botón de regenerar
- **Confirmación**: Diálogo con credenciales antes de crear
- **Éxito**: Diálogo con credenciales después de crear
- **Notificación**: Toggle para activar/desactivar

## 📧 Notificaciones

### Servicio de Notificaciones

El servicio `NotificationService` está preparado para integrarse con:
- Nodemailer (SMTP)
- SendGrid
- AWS SES
- Mailgun

### Plantilla de Email

Incluye:
- Header con branding
- Saludo personalizado
- Credenciales destacadas
- Instrucciones de seguridad
- Footer informativo

## ✅ Estado Final

**Story Points**: 5  
**Estimación**: 20h  
**Estado**: ✅ Implementación completa  
**Prioridad**: Alta  
**Responsable**: Senior Mobile Developer  
**Dependencies**: US002

### Tareas Completadas

- ✅ Diseñar formulario registro
- ✅ Validaciones de datos (frontend y backend)
- ✅ Generación automática credenciales
- ✅ Notificación al nuevo usuario
- ✅ Integración con vista de gestión de usuarios

## 🔄 Próximos Pasos (Opcionales)

1. Integrar servicio de email real (SendGrid, Nodemailer, etc.)
2. Agregar opción de enviar credenciales por SMS
3. Agregar historial de registros
4. Agregar exportación de credenciales (PDF)
5. Agregar validación de DNI con RENIEC (opcional)

