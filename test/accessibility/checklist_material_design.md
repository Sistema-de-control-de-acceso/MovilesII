# Checklist de Cumplimiento de Material Design

Este checklist debe ser completado durante las pruebas de usabilidad y accesibilidad.

## 📋 Tema y Colores

### Material 3
- [ ] La aplicación usa `useMaterial3: true` en ThemeData
- [ ] Los componentes usan estilos de Material 3

### ColorScheme
- [ ] El tema tiene un ColorScheme definido
- [ ] Los colores primarios están definidos
- [ ] Los colores secundarios están definidos
- [ ] Los colores de error están definidos
- [ ] Los colores de superficie están definidos
- [ ] Los colores se usan consistentemente en toda la app

### AppBarTheme
- [ ] El tema tiene AppBarTheme configurado
- [ ] Los AppBars usan colores del tema
- [ ] Los AppBars tienen elevation: 2
- [ ] El texto del AppBar tiene buen contraste

## 📐 Espaciado

### Múltiplos de 8dp
- [ ] Padding usa múltiplos de 8dp (8, 16, 24, 32, etc.)
- [ ] Margins usan múltiplos de 8dp
- [ ] Espaciado entre elementos usa múltiplos de 8dp
- [ ] No hay espaciado arbitrario (ej: 13dp, 27dp)

### Consistencia
- [ ] El espaciado es consistente en toda la app
- [ ] Los cards tienen padding consistente
- [ ] Los botones tienen padding consistente
- [ ] Las listas tienen espaciado consistente

## 📝 Tipografía

### TextTheme
- [ ] El tema usa TextTheme de Material Design
- [ ] Los tamaños de texto son accesibles (mínimo 14sp)
- [ ] Los textos grandes usan 18sp o más
- [ ] Los títulos usan tamaños apropiados (headlineLarge, headlineMedium, etc.)

### Pesos de Fuente
- [ ] Los títulos usan fontWeight apropiado (bold, medium)
- [ ] El texto del cuerpo usa fontWeight normal
- [ ] No hay uso excesivo de texto en negrita

## 🎨 Elevación y Sombras

### Elevación Estándar
- [ ] AppBars tienen elevation: 2
- [ ] Cards usan elevation: 1-4 según jerarquía
- [ ] FloatingActionButtons tienen elevation: 6
- [ ] Dialogs tienen elevation: 24

### Consistencia
- [ ] Los elementos en el mismo nivel tienen la misma elevación
- [ ] La elevación refleja la jerarquía visual correctamente

## 🧩 Componentes

### Botones
- [ ] Los botones usan estilos de Material Design (ElevatedButton, TextButton, OutlinedButton)
- [ ] Los botones tienen el tamaño mínimo táctil (48x48dp)
- [ ] Los botones tienen estados visuales (hover, pressed, disabled)
- [ ] Los botones usan colores del tema

### TextFields
- [ ] Los TextFields usan InputDecoration
- [ ] Los TextFields tienen labels o hints
- [ ] Los TextFields tienen estados visuales (error, focused, disabled)
- [ ] Los TextFields usan colores del tema

### Cards
- [ ] Los Cards usan el widget Card de Material Design
- [ ] Los Cards tienen padding apropiado
- [ ] Los Cards tienen elevation apropiada
- [ ] Los Cards tienen esquinas redondeadas (borderRadius)

### Iconos
- [ ] Los iconos son de Material Icons
- [ ] Los iconos tienen el tamaño apropiado (24dp por defecto)
- [ ] Los iconos tienen color del tema
- [ ] Los iconos tienen tooltips cuando es necesario

### Listas
- [ ] Las listas usan ListTile o widgets similares
- [ ] Los ListTiles tienen padding apropiado
- [ ] Los ListTiles tienen divisores cuando es necesario
- [ ] Los ListTiles son accesibles (mínimo 48dp de altura)

## 🎭 Animaciones

### Transiciones
- [ ] Las transiciones de pantalla son suaves
- [ ] Las animaciones usan curvas apropiadas (Curves.easeInOut, etc.)
- [ ] Las animaciones tienen duraciones apropiadas (200-300ms)

### Feedback Visual
- [ ] Los taps tienen feedback visual (ripple effect)
- [ ] Los botones tienen estados visuales claros
- [ ] Las acciones tienen feedback inmediato

## 📱 Responsive Design

### Adaptabilidad
- [ ] La app se adapta a diferentes tamaños de pantalla
- [ ] Los layouts usan LayoutBuilder o MediaQuery cuando es necesario
- [ ] Los elementos no se cortan en pantallas pequeñas
- [ ] El contenido es accesible sin scroll horizontal

### Orientación
- [ ] La app funciona en orientación vertical
- [ ] La app funciona en orientación horizontal (si aplica)
- [ ] Los layouts se adaptan correctamente a la orientación

## ✅ Validación Automática

Los siguientes puntos son validados automáticamente por los tests:

- [x] Material 3 habilitado
- [x] ColorScheme definido
- [x] AppBarTheme configurado
- [x] Espaciado en múltiplos de 8dp (verificación básica)
- [x] TextTheme configurado

## 📝 Notas

_Agregar aquí cualquier observación adicional sobre el cumplimiento de Material Design:_

---

**Fecha de revisión**: _______________  
**Revisado por**: _______________  
**Versión de la app**: _______________
