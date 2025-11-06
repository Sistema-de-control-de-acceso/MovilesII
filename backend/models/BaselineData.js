// Modelo para datos baseline (pre-sistema) para comparación
const mongoose = require('mongoose');

const BaselineDataSchema = new mongoose.Schema({
  _id: String, // UUID o identificador único
  periodo: {
    fecha_inicio: { type: Date, required: true },
    fecha_fin: { type: Date, required: true },
    descripcion: String // Descripción del período baseline
  },
  // Métricas de acceso/control
  metricas_acceso: {
    total_accesos: Number, // Total de accesos en el período
    accesos_por_dia: Number, // Promedio de accesos por día
    accesos_entrada: Number, // Total de entradas
    accesos_salida: Number, // Total de salidas
    pico_horario: {
      hora: Number, // Hora de mayor tráfico
      cantidad: Number // Cantidad de accesos en hora pico
    }
  },
  // Métricas de eficiencia operativa
  metricas_operativas: {
    tiempo_promedio_atencion: Number, // Minutos promedio de atención
    tiempo_espera_promedio: Number, // Minutos promedio de espera
    tasa_error: Number, // Porcentaje de errores
    tasa_resolucion_manual: Number, // Porcentaje de resoluciones manuales
    incidentes_seguridad: Number // Número de incidentes de seguridad
  },
  // Métricas de recursos humanos
  metricas_recursos: {
    guardias_activos: Number, // Número de guardias activos
    horas_trabajo_totales: Number, // Horas totales de trabajo
    costo_operacion_mensual: Number, // Costo de operación mensual
    costo_por_acceso: Number // Costo promedio por acceso
  },
  // Métricas de satisfacción (si aplica)
  metricas_satisfaccion: {
    satisfaccion_promedio: Number, // Escala 1-10
    quejas_recibidas: Number,
    tiempo_respuesta_quejas: Number // Días promedio
  },
  // Métricas de buses (si aplica)
  metricas_buses: {
    total_viajes: Number,
    pasajeros_transportados: Number,
    tasa_ocupacion_promedio: Number,
    costo_operacion_buses: Number,
    eficiencia_combustible: Number
  },
  // Costos del sistema anterior
  costos_sistema_anterior: {
    costo_implementacion: Number, // Costo inicial del sistema anterior
    costo_mantenimiento_mensual: Number,
    costo_licencias_mensual: Number,
    costo_hardware_mensual: Number,
    costo_total_mensual: Number
  },
  // Notas y contexto
  notas: String, // Notas adicionales sobre el período baseline
  fuente_datos: String, // Fuente de los datos (manual, sistema anterior, etc.)
  fecha_creacion: { type: Date, default: Date.now },
  fecha_actualizacion: { type: Date, default: Date.now },
  creado_por: String // ID del usuario que creó el baseline
}, { collection: 'baseline_data', strict: false, _id: false });

// Modelo para costos del proyecto actual
const ProjectCostSchema = new mongoose.Schema({
  _id: String, // UUID o identificador único
  tipo_costo: {
    type: String,
    enum: ['desarrollo', 'infraestructura', 'licencias', 'mantenimiento', 'capacitacion', 'hardware', 'otros'],
    required: true
  },
  descripcion: String,
  monto: { type: Number, required: true },
  fecha: { type: Date, required: true },
  periodo: {
    tipo: { type: String, enum: ['unico', 'mensual', 'anual'], default: 'unico' },
    fecha_inicio: Date,
    fecha_fin: Date
  },
  categoria: {
    type: String,
    enum: ['inversion_inicial', 'operacion_recurrente', 'mejora', 'soporte'],
    default: 'operacion_recurrente'
  },
  fecha_creacion: { type: Date, default: Date.now },
  fecha_actualizacion: { type: Date, default: Date.now }
}, { collection: 'project_costs', strict: false, _id: false });

const BaselineData = mongoose.model('baseline_data', BaselineDataSchema);
const ProjectCost = mongoose.model('project_costs', ProjectCostSchema);

module.exports = { BaselineData, ProjectCost };

