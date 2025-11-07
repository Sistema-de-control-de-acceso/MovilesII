# Aplicación Móvil - Flutter

## Descripción

Aplicación móvil desarrollada en Flutter para el sistema de control de acceso universitario con funcionalidad NFC y capacidades offline.

## Estructura

```
lib/
├── main.dart                    # Punto de entrada de la aplicación
├── config/                      # Configuraciones
│   └── api_config.dart        # Configuración de API
├── models/                      # Modelos de datos
│   ├── alumno_model.dart
│   ├── usuario_model.dart
│   ├── matriculation_model.dart
│   └── guard_report_model.dart
├── services/                    # Servicios de negocio
│   ├── api_service.dart        # Comunicación con API
│   ├── nfc_service.dart        # Servicio NFC
│   ├── connectivity_service.dart
│   ├── offline_sync_service.dart
│   ├── hybrid_api_service.dart
│   ├── matriculation_service.dart
│   ├── session_service.dart
│   └── guard_reports_service.dart
├── viewmodels/                   # ViewModels (MVVM)
│   ├── auth_viewmodel.dart
│   ├── nfc_viewmodel.dart
│   ├── admin_viewmodel.dart
│   ├── reports_viewmodel.dart
│   ├── guard_reports_viewmodel.dart
│   └── matriculation_viewmodel.dart
├── views/                        # Pantallas/Vistas
│   ├── admin/                   # Vistas de administrador
│   │   ├── admin_view.dart
│   │   ├── user_management_view.dart
│   │   ├── guard_reports_view.dart
│   │   └── session_config_view.dart
│   ├── user/                    # Vistas de usuario
│   │   └── user_nfc_view.dart
│   ├── student_status_view.dart
│   ├── matriculation_verification_view.dart
│   └── reports_view.dart
└── widgets/                      # Widgets reutilizables
    └── connectivity_status_widget.dart
```

## Instalación

```bash
flutter pub get
```

## Ejecución

```bash
flutter run
```

## Características

- Autenticación de usuarios
- Lectura/escritura NFC
- Funcionalidad offline
- Sincronización automática
- Gestión de estudiantes
- Reportes y estadísticas

