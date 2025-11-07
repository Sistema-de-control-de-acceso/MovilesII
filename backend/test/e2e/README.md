# Tests End-to-End (E2E)

## Descripción

Suite de tests E2E que verifica el funcionamiento completo del sistema backend y frontend mobile trabajando juntos.

## Flujos Cubiertos

### 1. Autenticación (`auth.e2e.test.js`)
- ✅ Login exitoso con credenciales válidas
- ✅ Rechazo de login con email incorrecto
- ✅ Rechazo de login con contraseña incorrecta
- ✅ Rechazo de login de usuario inactivo
- ✅ Validación de campos requeridos

### 2. Gestión de Usuarios (`users.e2e.test.js`)
- ✅ Listar todos los usuarios (GET /usuarios)
- ✅ Crear nuevo usuario (POST /usuarios)
- ✅ Obtener usuario por ID (GET /usuarios/:id)
- ✅ Actualizar usuario (PUT /usuarios/:id)
- ✅ Eliminar usuario (DELETE /usuarios/:id)
- ✅ Validación de duplicados y campos requeridos

### 3. Dashboard y Métricas (`dashboard.e2e.test.js`)
- ✅ Obtener métricas del dashboard (GET /dashboard/metrics)
- ✅ Obtener accesos recientes (GET /dashboard/recent-access)
- ✅ Validar diferentes periodos de tiempo
- ✅ Validar estructura de respuestas

## Ejecución

```bash
# Ejecutar todos los tests E2E
npm run test:e2e

# Ejecutar test específico
npm run test:e2e -- auth.e2e.test.js

# Ejecutar en modo watch
npm run test:e2e -- --watch
```

## Configuración

Los tests E2E utilizan:
- **MongoDB Memory Server**: Base de datos en memoria para tests aislados
- **Supertest**: Para hacer peticiones HTTP a la API
- **Jest**: Framework de testing

## Estructura

```
test/e2e/
├── setup-e2e.js          # Configuración y rutas para tests E2E
├── auth.e2e.test.js      # Tests de autenticación
├── users.e2e.test.js     # Tests CRUD usuarios
└── dashboard.e2e.test.js # Tests de dashboard
```

