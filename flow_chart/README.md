# Gráficos de Flujo Horario - Sprint 5

## ¿Qué es?
Este módulo implementa la vista y el widget para mostrar gráficos interactivos de flujo de accesos por horarios y días, cumpliendo la historia de usuario del Sprint 5: "Como Administrador quiero ver gráficos de flujo por horarios y días para identificar patrones visualmente".

## ¿Cómo funciona?
- Utiliza la librería `fl_chart` para renderizar gráficos de barras interactivos.
- Permite filtrar los datos por rango de fechas usando un selector integrado.
- Al tocar una barra del gráfico, muestra un detalle (drill-down) con la información de ese punto.

## Estructura de Carpetas
- `lib/flow_chart/flow_chart_view.dart`: Vista principal, lista para recibir datos y mostrar el gráfico con filtros y drill-down.
- `lib/flow_chart/widgets/flow_chart_widget.dart`: Widget reutilizable que renderiza el gráfico de barras.

## ¿Cómo conectarlo con el resto del sistema?
1. **Proveer los datos:**
   - Debes pasar una lista de objetos `FlowChartData` a la vista `FlowChartView`.
   - Ejemplo:
     ```dart
     List<FlowChartData> datos = [
       FlowChartData(label: '08:00', value: 12, date: DateTime(2025, 10, 7, 8)),
       FlowChartData(label: '09:00', value: 20, date: DateTime(2025, 10, 7, 9)),
       // ...
     ];
     FlowChartView(data: datos);
     ```
2. **Integrar la vista:**
   - Puedes navegar a `FlowChartView` desde cualquier parte de tu app (por ejemplo, desde el menú de administrador).
   - Si tienes un provider, bloc o controlador, simplemente transforma tus datos a la lista esperada.

## ¿Qué se ve y qué se puede manipular?
- **Visualización:**
  - Gráfico de barras con accesos por hora/día.
  - Filtro de rango de fechas en la barra superior.
  - Al tocar una barra, aparece un modal con el detalle de ese punto (cantidad de accesos, fecha/hora).
- **Interactividad:**
  - Selección de rango de fechas (DateRangePicker).
  - Drill-down por barra (detalle al tocar).
  - Limpieza del filtro temporal con un botón.

## Personalización
- Puedes modificar el modelo `FlowChartData` para agregar más campos si lo necesitas.
- El widget de gráfico es reutilizable y puedes integrarlo en otras vistas si lo requieres.

## Dependencias
- `fl_chart: ^0.66.0` (ya incluida en `pubspec.yaml`)

## Notas
- El módulo está desacoplado: solo requiere que le pases los datos, no depende de la fuente de datos ni de la lógica de negocio.
- Puedes expandir el drill-down para mostrar más detalles o navegar a otra vista si lo deseas.

---

¿Dudas o necesitas ejemplos de integración? ¡Revisa el código o consulta a tu equipo!