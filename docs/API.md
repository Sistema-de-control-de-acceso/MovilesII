# Documentación de API

## Base URL

```
Producción: https://tu-backend.onrender.com
Desarrollo: http://localhost:3000
```

> Nota: Algunas rutas pueden requerir autenticación y validaciones adicionales.

## login

- **POST** \ `/login`

## root

- **GET** \ `/`

## usuarios

- **GET** \ `/usuarios`
- **POST** \ `/usuarios`
- **PUT** \ `/usuarios/:id/password`

## Códigos de Estado

- `200`: Éxito
- `201`: Creado
- `400`: Error de validación
- `401`: No autorizado
- `404`: No encontrado
- `500`: Error del servidor
