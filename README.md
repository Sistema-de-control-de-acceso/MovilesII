# Sistema de Control de Acceso Universitario

Sistema completo de control de acceso a instalaciones universitarias con aplicación móvil Flutter y backend Node.js/Express, integrando tecnologías NFC, funcionalidad offline y dashboard web en tiempo real.

## 📋 Descripción del Proyecto

Sistema integral para gestionar el acceso de estudiantes, personal y visitantes a las instalaciones universitarias mediante tecnología NFC, con capacidades offline, sincronización automática y dashboard administrativo.

## 🏗️ Estructura del Proyecto

```
MovilesII/
├── mobile/                      # Aplicación Flutter
│   ├── lib/
│   │   ├── main.dart           # Punto de entrada
│   │   ├── config/             # Configuraciones
│   │   ├── models/             # Modelos de datos
│   │   ├── services/           # Servicios (API, NFC, Offline)
│   │   ├── viewmodels/         # ViewModels (MVVM)
│   │   ├── views/              # Vistas/Pantallas
│   │   │   ├── admin/          # Vistas de administrador
│   │   │   ├── user/           # Vistas de usuario
│   │   │   └── ...
│   │   └── widgets/            # Widgets reutilizables
│   ├── pubspec.yaml            # Dependencias Flutter
│   └── README.md               # Documentación móvil
│
├── backend/                     # Backend Node.js/Express
│   ├── index.js                # Servidor principal
│   ├── models/                 # Modelos Mongoose
│   ├── routes/                 # Rutas API (si se expande)
│   ├── public/                 # Archivos estáticos
│   │   └── dashboard/          # Dashboard web
│   ├── package.json            # Dependencias Node.js
│   └── README.md               # Documentación backend
│
├── docs/                        # Documentación del proyecto
│   ├── ARCHITECTURE.md         # Arquitectura del sistema
│   ├── API.md                  # Documentación API
│   └── DEPLOYMENT.md           # Guía de despliegue
│
├── .gitignore                   # Archivos ignorados por Git
├── LICENSE                      # Licencia del proyecto
└── README.md                    # Este archivo
```

## 🚀 Características Principales

### Aplicación Móvil (Flutter)
- ✅ Autenticación de usuarios (Admin y Guardias)
- ✅ Lectura y escritura NFC
- ✅ Funcionalidad offline completa
- ✅ Sincronización automática de datos
- ✅ Gestión de estudiantes y visitantes
- ✅ Reportes y estadísticas
- ✅ Control de presencia

### Backend (Node.js/Express)
- ✅ API REST completa
- ✅ Base de datos MongoDB Atlas
- ✅ Autenticación segura con bcrypt
- ✅ Dashboard web en tiempo real
- ✅ WebSockets para actualizaciones en vivo
- ✅ Endpoints de reportes y métricas

### Dashboard Web
- ✅ Métricas en tiempo real
- ✅ Gráficos interactivos
- ✅ Diseño responsive
- ✅ Actualizaciones automáticas

## 🛠️ Tecnologías Utilizadas

### Frontend Móvil
- **Flutter** - Framework multiplataforma
- **Provider** - Gestión de estado
- **Hive** - Base de datos local
- **flutter_nfc_kit** - Integración NFC
- **sqflite** - Base de datos SQLite offline

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB/Mongoose** - Base de datos
- **Socket.IO** - WebSockets
- **bcrypt** - Hash de contraseñas

### Dashboard Web
- **HTML5/CSS3** - Frontend
- **Chart.js** - Gráficos interactivos
- **Socket.IO Client** - Tiempo real

## 📦 Instalación

### Requisitos Previos
- Flutter SDK (>=3.7.2)
- Node.js (>=12.0.0)
- MongoDB Atlas (o MongoDB local)
- Git

### Backend

```bash
cd backend
npm install
cp .env.example .env  # Configurar variables de entorno
npm start
```

### Aplicación Móvil

```bash
flutter pub get
flutter run
```

## 🔧 Configuración

### Variables de Entorno (Backend)

Crear archivo `.env` en `backend/`:

```env
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/ASISTENCIA
PORT=3000
```

### Configuración API (Móvil)

Editar `lib/config/api_config.dart` con la URL del backend.

## 📱 Uso

1. **Backend**: Iniciar servidor en `http://localhost:3000`
2. **Dashboard**: Acceder a `http://localhost:3000/dashboard`
3. **Móvil**: Ejecutar aplicación Flutter y autenticarse

## 🧪 Testing

```bash
# Backend
cd backend
npm test

# Móvil
flutter test
```

## 📄 Licencia

Este proyecto es propiedad de la Universidad.

## 👥 Contribuidores

- @Zod0808
- @Angelhc123
- @KrCrimson
- @LunaJuarezJuan

## 📞 Contacto

Para más información, contactar al equipo de desarrollo.
