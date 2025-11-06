# Estructura del Proyecto Reorganizada

## 📁 Estructura Completa

```
MovilesII/
├── mobile/                          # Aplicación Flutter (renombrado de lib/)
│   ├── lib/
│   │   ├── main.dart               # ✅ Punto de entrada
│   │   ├── config/
│   │   ├── models/
│   │   ├── services/
│   │   ├── viewmodels/
│   │   ├── views/
│   │   └── widgets/
│   ├── pubspec.yaml
│   └── README.md
│
├── backend/                         # Backend Node.js
│   ├── index.js                    # ✅ Servidor principal
│   ├── models/                     # ✅ Modelos Mongoose
│   ├── routes/                     # (Para expansión futura)
│   ├── controllers/                # (Para expansión futura)
│   ├── middlewares/                # (Para expansión futura)
│   ├── public/                     # ✅ Archivos estáticos
│   │   └── dashboard/             # ✅ Dashboard web
│   ├── data/                       # Datos generados
│   │   ├── models/
│   │   ├── datasets/
│   │   └── etl/
│   ├── package.json
│   └── README.md
│
├── docs/                            # ✅ Documentación
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── DEPLOYMENT.md
│
├── .gitignore                       # ✅ Archivos ignorados
├── README.md                        # ✅ README principal
└── LICENSE                          # (Agregar si es necesario)
```

## 🗑️ Archivos Eliminados/Reorganizados

### Archivos eliminados de la raíz:
- ❌ `admin_view.dart` → Ya existe en `lib/views/admin/`
- ❌ `auth_service.dart` → Ya existe en `lib/services/`
- ❌ `login_screen.dart` → Ya existe en `lib/views/`
- ❌ `nfc_viewmodel.dart` → Ya existe en `lib/viewmodels/`
- ❌ `reports_view.dart` → Ya existe en `lib/views/`
- ❌ `historial_view.dart` → Ya existe en `lib/views/admin/`
- ❌ `presencia_dashboard_view.dart` → Funcionalidad integrada
- ❌ `user_scanner_screen.dart` → Ya existe en `lib/views/user/`
- ❌ `firebase_options.dart` → No necesario (usando MongoDB)

### Archivos duplicados eliminados:
- ❌ `lib/viewmodels/nfc_viewmodel copy.dart`
- ❌ `lib/views/admin/user_management_view copy.dart`

### Directorios a limpiar:
- ❌ `Desktop/` → Archivos temporales, no deben estar en el repo
- ❌ `node_modules/` → Debe estar en .gitignore
- ❌ `.dart_tool/` → Debe estar en .gitignore

## ✅ Archivos Organizados Correctamente

### Flutter (lib/)
- ✅ `main.dart` → Punto de entrada
- ✅ `config/` → Configuraciones
- ✅ `models/` → Modelos de datos
- ✅ `services/` → Servicios de negocio
- ✅ `viewmodels/` → ViewModels MVVM
- ✅ `views/` → Pantallas organizadas por usuario
- ✅ `widgets/` → Componentes reutilizables

### Backend
- ✅ `index.js` → Servidor principal
- ✅ `models/` → Modelos Mongoose
- ✅ `public/dashboard/` → Dashboard web

## 📝 Próximos Pasos

1. ✅ Reorganizar estructura
2. ✅ Eliminar duplicados
3. ✅ Crear documentación
4. ✅ Actualizar .gitignore
5. ⏳ Actualizar imports en archivos Dart
6. ⏳ Verificar que todo funcione

## 🔧 Comandos Útiles

```bash
# Limpiar build de Flutter
flutter clean
flutter pub get

# Verificar estructura
find . -name "*.dart" | head -20
find . -name "*.js" | grep -v node_modules

# Verificar duplicados
find . -name "*copy*" -o -name "*backup*"
```

