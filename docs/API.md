# Documentación de API

## Base URL

```
Producción: https://tu-backend.onrender.com
Desarrollo: http://localhost:3000
```

## Autenticación

### Login
```
POST /login
Body: {
  "email": "usuario@example.com",
  "password": "contraseña"
}
```

## Endpoints de Asistencias

### Listar Asistencias
```
GET /asistencias
Query params:
  - fecha_inicio: YYYY-MM-DD
  - fecha_fin: YYYY-MM-DD
  - tipo: entrada|salida
```

### Crear Asistencia
```
POST /asistencias
Body: {
  "nombre": "Juan",
  "apellido": "Pérez",
  "dni": "12345678",
  "tipo": "entrada",
  ...
}
```

## Endpoints de Dashboard

### Métricas
```
GET /dashboard/metrics?period=24h
```

### Accesos Recientes
```
GET /dashboard/recent-access
```

## Endpoints de Usuarios

### Listar Usuarios
```
GET /usuarios
Query params:
  - role: admin|guardia
```

### Crear Usuario
```
POST /usuarios
Body: {
  "nombre": "Nombre",
  "email": "email@example.com",
  "password": "contraseña",
  "rango": "guardia"
}
```

## Códigos de Estado

- `200`: Éxito
- `201`: Creado
- `400`: Error de validación
- `401`: No autorizado
- `404`: No encontrado
- `500`: Error del servidor

