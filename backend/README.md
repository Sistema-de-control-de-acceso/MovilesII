# Backend - Node.js/Express

## Descripción

Backend REST API desarrollado en Node.js con Express.js para el sistema de control de acceso universitario.

## Estructura

```
backend/
├── index.js                    # Servidor principal
├── models/                     # Modelos Mongoose
│   ├── Asignacion.js
│   └── PuntoControl.js
├── public/                     # Archivos estáticos
│   └── dashboard/              # Dashboard web
│       ├── index.html
│       ├── styles.css
│       └── app.js
├── package.json                # Dependencias
└── README.md                   # Este archivo
```

## Instalación

```bash
npm install
```

## Configuración

Crear archivo `.env`:

```env
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/ASISTENCIA
PORT=3000
```

## Ejecución

```bash
npm start
```

## Endpoints Principales

- `POST /login` - Autenticación
- `GET /asistencias` - Listar asistencias
- `POST /asistencias` - Crear asistencia
- `GET /dashboard/metrics` - Métricas del dashboard
- `GET /dashboard/recent-access` - Accesos recientes

## Características

- API REST completa
- Autenticación segura
- Dashboard web en tiempo real
- WebSockets para actualizaciones
- Integración con MongoDB Atlas
