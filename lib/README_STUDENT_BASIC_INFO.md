# Componente de Información Básica del Estudiante

## 📋 User Story

**Como** Guardia  
**Quiero** ver datos básicos del estudiante para confirmar identidad visualmente  
**Para** validar rápidamente la identidad del estudiante

## ✅ Acceptance Criteria Cumplidos

- ✅ **Display nombre, foto, carrera**: Widget muestra nombre completo, foto (o placeholder), y carrera
- ✅ **ID claramente visible**: Código universitario destacado en un contenedor especial
- ✅ **Interfaz clara**: Diseño limpio y fácil de leer

## 📦 Archivos Creados

1. **`lib/widgets/student_basic_info_widget.dart`**
   - Widget principal `StudentBasicInfoWidget`
   - Widget compacto `StudentBasicInfoCompactWidget`
   - Carga de foto desde URL o placeholder

2. **`lib/views/student_basic_info_view.dart`**
   - Vista completa para mostrar información del estudiante
   - Carga de datos desde API
   - Manejo de errores y estados de carga

3. **`lib/models/alumno_model.dart`** (actualizado)
   - Agregado campo `fotoUrl` para soportar fotos
   - Agregado campo `accesos` (opcional)

## 🎨 Características del Widget

### StudentBasicInfoWidget

Widget principal que muestra:
- **Foto del estudiante**: Circular con borde, carga desde URL o muestra placeholder
- **Nombre completo**: Destacado y legible
- **ID (Código Universitario)**: En contenedor destacado con icono
- **Carrera**: Facultad y escuela profesional con iconos
- **Estado**: Badge de activo/inactivo
- **Diseño responsive**: Se adapta a tablets y móviles

### StudentBasicInfoCompactWidget

Versión compacta para usar en listas:
- Foto más pequeña
- Información esencial
- Ideal para listas de estudiantes

## 📱 Uso

### Widget Principal

```dart
StudentBasicInfoWidget(
  estudiante: alumno,
  showStatusBadge: true,
  photoSize: 100.0, // Opcional
  onTap: () {
    // Acción al tocar
  },
)
```

### Widget Compacto

```dart
StudentBasicInfoCompactWidget(
  estudiante: alumno,
  onTap: () {
    // Navegar a detalle
  },
)
```

### Vista Completa

```dart
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => StudentBasicInfoView(
      codigoUniversitario: '20201234',
    ),
  ),
);
```

## 🖼️ Carga de Fotos

El widget soporta:
1. **Foto desde URL**: Si el estudiante tiene `fotoUrl` en el modelo
2. **Placeholder**: Si no hay foto, muestra un icono con iniciales
3. **Caché**: Usa `cached_network_image` para optimizar carga

### Configuración de Fotos en Backend

Para habilitar fotos, el backend debe:
1. Agregar campo `foto_url` al modelo de Alumno
2. Proporcionar endpoint para servir fotos: `/alumnos/:codigo/foto`
3. O incluir `foto_url` en la respuesta del endpoint `/alumnos/:codigo`

## 🎯 Características de Diseño

### Responsive Design

- **Móvil**: Foto de 100px, texto ajustado
- **Tablet**: Foto de 120px, texto más grande
- **Adaptación automática**: Detecta tamaño de pantalla

### ID Claramente Visible

El código universitario se muestra en:
- Contenedor con fondo azul claro
- Borde azul destacado
- Icono de badge
- Texto en negrita y color oscuro
- Tamaño de fuente aumentado

### Interfaz Clara

- Colores contrastantes
- Iconos descriptivos
- Espaciado adecuado
- Tipografía legible
- Sombras y bordes para profundidad

## 📝 Ejemplo de Integración

### En vista NFC

```dart
if (nfcViewModel.scannedAlumno != null)
  StudentBasicInfoWidget(
    estudiante: nfcViewModel.scannedAlumno!,
    showStatusBadge: true,
  )
```

### En lista de estudiantes

```dart
ListView.builder(
  itemCount: estudiantes.length,
  itemBuilder: (context, index) {
    return StudentBasicInfoCompactWidget(
      estudiante: estudiantes[index],
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => StudentBasicInfoView(
              codigoUniversitario: estudiantes[index].codigoUniversitario,
            ),
          ),
        );
      },
    );
  },
)
```

## 🔧 Dependencias

- `cached_network_image: ^3.3.0` - Para carga optimizada de imágenes

## ✅ Estado Final

**Story Points**: 3  
**Estimación**: 12h  
**Estado**: ✅ Implementación completa  
**Prioridad**: Media  
**Responsable**: Mid Tester  
**Dependencies**: US014

### Tareas Completadas

- ✅ Componente display estudiante creado
- ✅ Carga de foto estudiante implementada
- ✅ Formato datos legible implementado
- ✅ Responsive design implementado

