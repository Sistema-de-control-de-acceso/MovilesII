# Dashboard de Accesos - Documentación

## 📋 Descripción

Dashboard web interactivo para monitorear accesos en tiempo real con métricas actualizadas, gráficos interactivos y diseño responsive.

## ✅ Acceptance Criteria Cumplidos

- ✅ **Métricas tiempo real disponibles**: WebSockets para actualizaciones en tiempo real
- ✅ **Gráficos interactivos implementados**: Chart.js para visualizaciones dinámicas
- ✅ **Responsive design funcional**: Diseño adaptativo para móviles, tablets y desktop

## 📁 Archivos Creados

```
backend/public/dashboard/
├── index.html          ✅ HTML principal del dashboard
├── styles.css          ✅ Estilos responsive
└── app.js              ✅ Lógica JavaScript y WebSockets
```

## 🚀 Acceso al Dashboard

El dashboard está disponible en:
```
http://localhost:3000/dashboard
```

## 📊 Características

### Métricas en Tiempo Real

- **Accesos Hoy**: Total de accesos del día actual
- **En Instalación**: Personas actualmente dentro (entradas - salidas)
- **Entradas Última Hora**: Entradas en la última hora
- **Salidas Última Hora**: Salidas en la última hora

### Gráficos Interactivos

1. **Gráfico de Líneas**: Accesos por hora (últimas 24 horas)
   - Filtros: 24h, 7 días, 30 días
   - Muestra entradas y salidas por separado

2. **Gráfico de Donut**: Distribución Entradas/Salidas
   - Proporción visual de entradas vs salidas

3. **Gráfico de Barras**: Accesos por día de la semana
   - Últimos 7 días

4. **Gráfico Horizontal**: Top 5 Facultades
   - Facultades con más accesos hoy

### Tabla de Accesos Recientes

- Últimos 20 accesos en tiempo real
- Actualización automática con WebSockets
- Información: hora, nombre, tipo, facultad, puerta, estado

### Diseño Responsive

- **Desktop**: Grid de 2-4 columnas
- **Tablet**: Grid adaptativo
- **Mobile**: Una columna, diseño optimizado

## 🔌 WebSockets

### Eventos Emitidos por el Servidor

- `real-time-metrics`: Métricas actualizadas cada 5 segundos
- `new-access`: Nuevo acceso detectado (tiempo real)
- `hourly-data`: Datos horarios actualizados

### Eventos del Cliente

- `connect`: Conexión establecida
- `disconnect`: Desconexión del cliente

## 📡 Endpoints API

### GET /dashboard/metrics

Obtiene todas las métricas del dashboard.

**Query Parameters:**
- `period`: `24h` (default), `7d`, `30d`

**Response:**
```json
{
  "success": true,
  "metrics": {
    "todayAccess": 1250,
    "currentInside": 85,
    "lastHourEntrances": 45,
    "lastHourExits": 32
  },
  "hourlyData": {
    "labels": ["0:00", "1:00", ...],
    "entrances": [10, 5, ...],
    "exits": [2, 3, ...]
  },
  "entranceExitData": {
    "entrances": 650,
    "exits": 565
  },
  "weeklyData": {
    "values": [180, 200, 190, ...]
  },
  "facultiesData": {
    "labels": ["FIIS", "FIA", ...],
    "values": [320, 280, ...]
  }
}
```

### GET /dashboard/recent-access

Obtiene accesos recientes (últimos 20).

**Response:**
```json
{
  "success": true,
  "access": [
    {
      "fecha_hora": "2024-01-15T08:30:00Z",
      "nombre": "Juan",
      "apellido": "Pérez",
      "tipo": "entrada",
      "siglas_facultad": "FIIS",
      "puerta": "PRINCIPAL",
      "autorizacion_manual": false
    }
  ]
}
```

## 🎨 Diseño Responsive

### Breakpoints

- **Desktop**: > 768px
- **Tablet**: 481px - 768px
- **Mobile**: ≤ 480px

### Características Responsive

- Grid adaptativo para métricas
- Gráficos responsivos con Chart.js
- Tabla con scroll horizontal en móviles
- Menú colapsable en móviles
- Fuentes y espaciados adaptativos

## 💻 Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Gráficos**: Chart.js 4.4.0
- **WebSockets**: Socket.IO 4.5.4
- **Backend**: Express.js, MongoDB Change Streams

## 🔧 Configuración

### Instalar Dependencias

```bash
cd backend
npm install socket.io
```

### Iniciar Servidor

```bash
npm start
```

El dashboard estará disponible en `http://localhost:3000/dashboard`

## 📱 Uso

1. **Abrir Dashboard**: Navegar a `/dashboard`
2. **Ver Métricas**: Las métricas se actualizan automáticamente cada 5 segundos
3. **Filtrar Gráficos**: Usar botones de filtro (24h, 7d, 30d)
4. **Actualizar Tabla**: Botón de actualizar o automático con WebSockets
5. **Monitorear Tiempo Real**: El indicador de conexión muestra el estado

## 🎯 Características Avanzadas

- **Actualización Automática**: Sin necesidad de refrescar la página
- **Animaciones Suaves**: Transiciones al actualizar datos
- **Indicador de Conexión**: Estado visual de conexión WebSocket
- **Última Actualización**: Timestamp de última actualización
- **Cambios en Tiempo Real**: Nuevos accesos aparecen instantáneamente

## 📌 Notas

- El dashboard requiere conexión activa a MongoDB
- Los WebSockets se reconectan automáticamente
- Los datos se actualizan cada 5 segundos como fallback
- Los cambios en MongoDB se propagan instantáneamente
- El diseño es completamente responsive

