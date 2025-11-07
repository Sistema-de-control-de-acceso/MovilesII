# 🔐 Guía de Autenticación - API Acees Group

## 📋 Información General

Actualmente, la API utiliza autenticación basada en **email y contraseña** sin tokens JWT. La autenticación se realiza mediante el endpoint `/login` y las credenciales se mantienen en el cliente.

## 🔑 Autenticación Actual

### Endpoint de Login

**POST** `/login`

### Request

```json
{
  "email": "guardia@ejemplo.com",
  "password": "contraseña123"
}
```

### Response Exitosa (200)

```json
{
  "id": "user_id_123",
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "guardia@ejemplo.com",
  "dni": "12345678",
  "rango": "guardia",
  "puerta_acargo": "Puerta Principal",
  "estado": "activo"
}
```

### Response de Error (401)

```json
{
  "error": "Credenciales incorrectas"
}
```

## 🔒 Seguridad de Contraseñas

- Las contraseñas se encriptan automáticamente con **bcrypt** (10 salt rounds)
- Las contraseñas nunca se devuelven en las respuestas
- Las contraseñas se hashean antes de guardarse en la base de datos

## 👥 Rangos de Usuario

### Admin

- Acceso completo a todos los endpoints
- Puede crear, actualizar y eliminar usuarios
- Puede forzar finalización de sesiones de guardias

### Guardia

- Acceso limitado a endpoints operativos
- Puede registrar asistencias
- Puede iniciar sesiones de guardia
- No puede gestionar usuarios

## 🚫 Endpoints que Requieren Autenticación

Actualmente, la mayoría de endpoints no requieren autenticación explícita. Sin embargo, se recomienda:

1. Realizar login antes de usar la API
2. Mantener las credenciales seguras en el cliente
3. No exponer credenciales en logs o código fuente

## 🔄 Flujo de Autenticación Recomendado

### 1. Login Inicial

```javascript
// Ejemplo en JavaScript
const response = await fetch('https://acees-group-backend-production.up.railway.app/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'guardia@ejemplo.com',
    password: 'contraseña123'
  })
});

const user = await response.json();
// Guardar información del usuario en el cliente
localStorage.setItem('currentUser', JSON.stringify(user));
```

### 2. Verificar Estado del Usuario

```javascript
// Verificar si el usuario está activo
if (user.estado === 'inactivo') {
  // Usuario inactivo, no permitir acceso
  throw new Error('Usuario inactivo');
}
```

### 3. Usar Información del Usuario

```javascript
// Usar información del usuario en peticiones posteriores
const asistencia = {
  guardia_id: user.id,
  guardia_nombre: `${user.nombre} ${user.apellido}`,
  // ... otros campos
};
```

## 🔐 Cambio de Contraseña

### Endpoint

**PUT** `/usuarios/{id}/password`

### Request

```json
{
  "password": "nueva_contraseña123"
}
```

### Response Exitosa (200)

```json
{
  "message": "Contraseña actualizada exitosamente"
}
```

## 🛡️ Mejores Prácticas

1. **Nunca almacenes contraseñas en texto plano**
   - Siempre usa bcrypt o similar
   - Nunca envíes contraseñas en logs

2. **Mantén las credenciales seguras**
   - No las expongas en código fuente
   - Usa variables de entorno para desarrollo

3. **Valida credenciales en el cliente**
   - Verifica formato de email
   - Valida longitud mínima de contraseña

4. **Maneja errores de autenticación**
   - Muestra mensajes claros al usuario
   - No expongas detalles técnicos

## 🔮 Futuras Mejoras

### JWT Tokens (Próximamente)

Se planea implementar autenticación con JWT tokens:

1. Login retornará un token JWT
2. Token se incluirá en header `Authorization: Bearer {token}`
3. Token expirará después de un tiempo determinado
4. Refresh token para renovar sesión

### OAuth 2.0 (Futuro)

Se está considerando implementar OAuth 2.0 para:
- Integración con sistemas externos
- Autenticación de terceros
- Mayor seguridad y escalabilidad

## 📝 Ejemplo Completo

```javascript
// Clase de servicio de autenticación
class AuthService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.currentUser = null;
  }

  async login(email, password) {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.status === 401) {
        throw new Error('Credenciales incorrectas');
      }

      if (!response.ok) {
        throw new Error('Error en el servidor');
      }

      this.currentUser = await response.json();
      
      // Verificar que el usuario esté activo
      if (this.currentUser.estado !== 'activo') {
        throw new Error('Usuario inactivo');
      }

      return this.currentUser;
    } catch (error) {
      throw error;
    }
  }

  async changePassword(userId, newPassword) {
    const response = await fetch(`${this.baseUrl}/usuarios/${userId}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: newPassword })
    });

    if (!response.ok) {
      throw new Error('Error al cambiar contraseña');
    }

    return await response.json();
  }

  isAuthenticated() {
    return this.currentUser !== null && this.currentUser.estado === 'activo';
  }

  getCurrentUser() {
    return this.currentUser;
  }

  logout() {
    this.currentUser = null;
  }
}

// Uso
const authService = new AuthService('https://acees-group-backend-production.up.railway.app');

// Login
await authService.login('guardia@ejemplo.com', 'contraseña123');

// Verificar autenticación
if (authService.isAuthenticated()) {
  const user = authService.getCurrentUser();
  console.log(`Usuario autenticado: ${user.nombre} ${user.apellido}`);
}
```

## 🆘 Troubleshooting

### Error: "Credenciales incorrectas"

**Causas posibles**:
- Email o contraseña incorrectos
- Usuario inactivo
- Usuario no existe

**Soluciones**:
- Verificar credenciales
- Contactar administrador si el usuario está inactivo

### Error: "Usuario no encontrado"

**Causas posibles**:
- Email no existe en la base de datos
- ID de usuario inválido

**Soluciones**:
- Verificar que el email sea correcto
- Contactar administrador para crear usuario

---

**Última actualización**: Enero 2025

