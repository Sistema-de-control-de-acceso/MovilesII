# Guía de Despliegue

## Requisitos Previos

- Node.js >= 12.0.0
- Flutter SDK >= 3.7.2
- MongoDB Atlas (o MongoDB local)
- Git

## Despliegue del Backend

### Opción 1: Render.com

1. Crear cuenta en Render
2. Conectar repositorio GitHub
3. Configurar variables de entorno:
   - `MONGODB_URI`
   - `PORT` (opcional)
4. Deploy automático

### Opción 2: Servidor VPS

```bash
# Clonar repositorio
git clone https://github.com/Sistema-de-control-de-acceso/MovilesII.git
cd MovilesII/backend

# Instalar dependencias
npm install

# Configurar variables de entorno
nano .env

# Iniciar con PM2
npm install -g pm2
pm2 start index.js --name "backend-api"
pm2 save
```

## Despliegue de la Aplicación Móvil

### Android

```bash
# Generar APK
flutter build apk --release

# Generar App Bundle (para Play Store)
flutter build appbundle --release
```

### iOS

```bash
# Generar IPA
flutter build ios --release
```

## Variables de Entorno

### Backend (.env)

```env
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/ASISTENCIA
PORT=3000
NODE_ENV=production
```

### Móvil (lib/config/api_config.dart)

```dart
static const String _baseUrlProd = 'https://tu-backend.onrender.com';
static const bool _isProduction = true;
```

## Verificación Post-Despliegue

1. Verificar endpoints del backend
2. Probar autenticación
3. Verificar dashboard web
4. Probar aplicación móvil
5. Verificar sincronización offline

