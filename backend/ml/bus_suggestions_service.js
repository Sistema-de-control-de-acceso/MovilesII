/**
 * Servicio de Sugerencias de Buses y Comparativo Sugerido vs Real
 * Gestiona sugerencias, tracking de implementación y comparación con uso real
 */

class BusSuggestionsService {
  constructor(SugerenciaBusModel, ViajeBusModel, BusModel) {
    this.SugerenciaBus = SugerenciaBusModel;
    this.ViajeBus = ViajeBusModel;
    this.Bus = BusModel;
  }

  /**
   * Crea una nueva sugerencia
   */
  async createSuggestion(suggestionData) {
    try {
      const { v4: uuidv4 } = require('uuid');
      
      const sugerencia = new this.SugerenciaBus({
        _id: uuidv4(),
        ...suggestionData,
        estado: suggestionData.estado || 'pendiente',
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      });

      await sugerencia.save();
      return sugerencia;
    } catch (error) {
      throw new Error(`Error creando sugerencia: ${error.message}`);
    }
  }

  /**
   * Aprobar una sugerencia
   */
  async approveSuggestion(suggestionId, approvedBy) {
    try {
      const sugerencia = await this.SugerenciaBus.findById(suggestionId);
      if (!sugerencia) {
        throw new Error('Sugerencia no encontrada');
      }

      sugerencia.estado = 'aprobada';
      sugerencia.fecha_aprobacion = new Date();
      sugerencia.aprobado_por = approvedBy;
      sugerencia.fecha_actualizacion = new Date();

      await sugerencia.save();
      return sugerencia;
    } catch (error) {
      throw new Error(`Error aprobando sugerencia: ${error.message}`);
    }
  }

  /**
   * Implementar una sugerencia
   */
  async implementSuggestion(suggestionId, implementedBy, trackingStartDate = null) {
    try {
      const sugerencia = await this.SugerenciaBus.findById(suggestionId);
      if (!sugerencia) {
        throw new Error('Sugerencia no encontrada');
      }

      if (sugerencia.estado !== 'aprobada') {
        throw new Error('Solo se pueden implementar sugerencias aprobadas');
      }

      sugerencia.estado = 'implementada';
      sugerencia.fecha_implementacion = new Date();
      sugerencia.implementado_por = implementedBy;
      
      // Inicializar tracking
      if (!sugerencia.tracking) {
        sugerencia.tracking = {};
      }
      sugerencia.tracking.fecha_inicio_seguimiento = trackingStartDate || new Date();
      sugerencia.tracking.viajes_planificados = 0;
      sugerencia.tracking.viajes_realizados = 0;
      sugerencia.tracking.tasa_adopcion = 0;
      sugerencia.tracking.cumplimiento_horario = 0;
      
      sugerencia.fecha_actualizacion = new Date();

      await sugerencia.save();
      return sugerencia;
    } catch (error) {
      throw new Error(`Error implementando sugerencia: ${error.message}`);
    }
  }

  /**
   * Actualiza el tracking de una sugerencia implementada
   */
  async updateTracking(suggestionId, dateRange = null) {
    try {
      const sugerencia = await this.SugerenciaBus.findById(suggestionId);
      if (!sugerencia) {
        throw new Error('Sugerencia no encontrada');
      }

      if (sugerencia.estado !== 'implementada') {
        throw new Error('Solo se puede hacer tracking de sugerencias implementadas');
      }

      // Determinar rango de fechas para análisis
      const startDate = dateRange?.start || sugerencia.tracking?.fecha_inicio_seguimiento || new Date();
      const endDate = dateRange?.end || new Date();
      
      // Convertir día de la semana a número (0 = domingo, 1 = lunes, etc.)
      const diaSemanaMap = {
        'domingo': 0,
        'lunes': 1,
        'martes': 2,
        'miercoles': 3,
        'jueves': 4,
        'viernes': 5,
        'sabado': 6
      };
      const diaSemanaNum = diaSemanaMap[sugerencia.dia_semana.toLowerCase()];

      // Buscar viajes que coincidan con la sugerencia
      const viajes = await this.ViajeBus.find({
        bus_id: sugerencia.bus_id || { $exists: true },
        ruta: sugerencia.ruta,
        fecha_salida: { $gte: startDate, $lte: endDate },
        estado: 'completado'
      }).lean();

      // Filtrar viajes por día de la semana
      const viajesFiltrados = viajes.filter(viaje => {
        const fecha = new Date(viaje.fecha_salida);
        return fecha.getDay() === diaSemanaNum;
      });

      // Calcular métricas de tracking
      const viajesPlanificados = this.calculatePlannedTrips(startDate, endDate, diaSemanaNum);
      const viajesRealizados = viajesFiltrados.length;
      const tasaAdopcion = viajesPlanificados > 0 
        ? (viajesRealizados / viajesPlanificados) * 100 
        : 0;

      // Calcular cumplimiento de horario
      const cumplimientoHorario = this.calculateScheduleCompliance(
        viajesFiltrados, 
        sugerencia.horario_salida
      );

      // Calcular impacto real
      const impactoReal = await this.calculateRealImpact(
        viajesFiltrados,
        sugerencia.bus_id,
        sugerencia.ruta,
        startDate,
        endDate
      );

      // Actualizar tracking
      sugerencia.tracking.fecha_inicio_seguimiento = startDate;
      sugerencia.tracking.fecha_fin_seguimiento = endDate;
      sugerencia.tracking.viajes_planificados = viajesPlanificados;
      sugerencia.tracking.viajes_realizados = viajesRealizados;
      sugerencia.tracking.tasa_adopcion = parseFloat(tasaAdopcion.toFixed(2));
      sugerencia.tracking.cumplimiento_horario = parseFloat(cumplimientoHorario.toFixed(2));
      sugerencia.tracking.impacto_real = impactoReal;
      sugerencia.fecha_actualizacion = new Date();

      await sugerencia.save();
      return sugerencia;
    } catch (error) {
      throw new Error(`Error actualizando tracking: ${error.message}`);
    }
  }

  /**
   * Calcula número de viajes planificados en un rango de fechas
   */
  calculatePlannedTrips(startDate, endDate, dayOfWeek) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let count = 0;
    const current = new Date(start);

    while (current <= end) {
      if (current.getDay() === dayOfWeek) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * Calcula cumplimiento de horario
   */
  calculateScheduleCompliance(viajes, horarioSugerido) {
    if (viajes.length === 0) return 0;

    const [horaSugerida, minutoSugerido] = horarioSugerido.split(':').map(Number);
    const toleranciaMinutos = 15; // Tolerancia de 15 minutos

    let cumplidos = 0;
    viajes.forEach(viaje => {
      const fechaSalida = new Date(viaje.fecha_salida);
      const horaSalida = fechaSalida.getHours();
      const minutoSalida = fechaSalida.getMinutes();

      const diferenciaMinutos = Math.abs(
        (horaSalida * 60 + minutoSalida) - (horaSugerida * 60 + minutoSugerido)
      );

      if (diferenciaMinutos <= toleranciaMinutos) {
        cumplidos++;
      }
    });

    return (cumplidos / viajes.length) * 100;
  }

  /**
   * Calcula impacto real comparando con período anterior
   */
  async calculateRealImpact(viajesActuales, busId, ruta, startDate, endDate) {
    if (viajesActuales.length === 0) {
      return {
        aumento_pasajeros: 0,
        reduccion_tiempo: 0,
        reduccion_costo: 0,
        mejora_ocupacion: 0
      };
    }

    // Calcular período anterior (misma duración)
    const duracionDias = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const anteriorStart = new Date(startDate);
    anteriorStart.setDate(anteriorStart.getDate() - duracionDias);
    const anteriorEnd = new Date(startDate);

    // Obtener viajes del período anterior
    const viajesAnteriores = await this.ViajeBus.find({
      bus_id: busId || { $exists: true },
      ruta: ruta,
      fecha_salida: { $gte: anteriorStart, $lt: anteriorEnd },
      estado: 'completado'
    }).lean();

    // Calcular métricas actuales
    const metricasActuales = await this.calculateMetrics(viajesActuales);
    
    // Calcular métricas anteriores
    const metricasAnteriores = await this.calculateMetrics(viajesAnteriores);

    // Calcular diferencias
    const aumentoPasajeros = metricasAnteriores.promedioPasajeros > 0
      ? ((metricasActuales.promedioPasajeros - metricasAnteriores.promedioPasajeros) / metricasAnteriores.promedioPasajeros) * 100
      : 0;

    const reduccionTiempo = metricasAnteriores.promedioTiempo > 0
      ? metricasAnteriores.promedioTiempo - metricasActuales.promedioTiempo
      : 0;

    const reduccionCosto = metricasAnteriores.costoPorPasajero > 0
      ? ((metricasAnteriores.costoPorPasajero - metricasActuales.costoPorPasajero) / metricasAnteriores.costoPorPasajero) * 100
      : 0;

    const mejoraOcupacion = metricasAnteriores.tasaOcupacion > 0
      ? metricasActuales.tasaOcupacion - metricasAnteriores.tasaOcupacion
      : 0;

    return {
      aumento_pasajeros: parseFloat(aumentoPasajeros.toFixed(2)),
      reduccion_tiempo: parseFloat(reduccionTiempo.toFixed(2)),
      reduccion_costo: parseFloat(reduccionCosto.toFixed(2)),
      mejora_ocupacion: parseFloat(mejoraOcupacion.toFixed(2))
    };
  }

  /**
   * Calcula métricas de un conjunto de viajes
   */
  async calculateMetrics(viajes) {
    if (viajes.length === 0) {
      return {
        promedioPasajeros: 0,
        promedioTiempo: 0,
        costoPorPasajero: 0,
        tasaOcupacion: 0
      };
    }

    const totalPasajeros = viajes.reduce((sum, v) => sum + (v.pasajeros_transportados || 0), 0);
    const totalTiempo = viajes.reduce((sum, v) => sum + (v.tiempo_viaje_minutos || 0), 0);
    const totalCosto = viajes.reduce((sum, v) => sum + (v.costo_operacion || 0), 0);
    
    // Obtener buses únicos para calcular capacidad
    const busIds = [...new Set(viajes.map(v => v.bus_id))];
    const buses = await this.Bus.find({ _id: { $in: busIds } }).lean();
    const busMap = {};
    buses.forEach(bus => {
      busMap[bus._id] = bus.capacidad_maxima;
    });

    const totalCapacidad = viajes.reduce((sum, v) => {
      const capacidad = busMap[v.bus_id] || (v.capacidad_disponible + (v.pasajeros_transportados || 0));
      return sum + capacidad;
    }, 0);

    return {
      promedioPasajeros: totalPasajeros / viajes.length,
      promedioTiempo: totalTiempo / viajes.length,
      costoPorPasajero: totalPasajeros > 0 ? totalCosto / totalPasajeros : 0,
      tasaOcupacion: totalCapacidad > 0 ? (totalPasajeros / totalCapacidad) * 100 : 0
    };
  }

  /**
   * Genera comparativo sugerido vs real
   */
  async generateSuggestedVsRealComparison(suggestionId, dateRange = null) {
    try {
      const sugerencia = await this.SugerenciaBus.findById(suggestionId);
      if (!sugerencia) {
        throw new Error('Sugerencia no encontrada');
      }

      if (sugerencia.estado !== 'implementada') {
        throw new Error('Solo se puede comparar sugerencias implementadas');
      }

      // Actualizar tracking primero
      await this.updateTracking(suggestionId, dateRange);
      
      // Obtener datos actualizados
      const sugerenciaActualizada = await this.SugerenciaBus.findById(suggestionId);
      const tracking = sugerenciaActualizada.tracking;
      const impactoEsperado = sugerencia.impacto_esperado || {};
      const impactoReal = tracking.impacto_real || {};

      // Calcular diferencias entre esperado y real
      const comparacion = {
        sugerencia: {
          id: sugerenciaActualizada._id,
          ruta: sugerenciaActualizada.ruta,
          horario_salida: sugerenciaActualizada.horario_salida,
          dia_semana: sugerenciaActualizada.dia_semana,
          tipo: sugerenciaActualizada.tipo_sugerencia,
          descripcion: sugerenciaActualizada.descripcion
        },
        tracking: {
          viajes_planificados: tracking?.viajes_planificados || 0,
          viajes_realizados: tracking?.viajes_realizados || 0,
          tasa_adopcion: tracking?.tasa_adopcion || 0,
          cumplimiento_horario: tracking?.cumplimiento_horario || 0,
          periodo: {
            inicio: tracking?.fecha_inicio_seguimiento || null,
            fin: tracking?.fecha_fin_seguimiento || null
          }
        },
        impacto: {
          esperado: impactoEsperado,
          real: impactoReal,
          diferencia: {
            aumento_pasajeros: (impactoReal?.aumento_pasajeros || 0) - (impactoEsperado?.aumento_pasajeros || 0),
            reduccion_tiempo: (impactoReal?.reduccion_tiempo || 0) - (impactoEsperado?.reduccion_tiempo || 0),
            reduccion_costo: (impactoReal?.reduccion_costo || 0) - (impactoEsperado?.reduccion_costo || 0),
            mejora_ocupacion: (impactoReal?.mejora_ocupacion || 0) - (impactoEsperado?.mejora_ocupacion || 0)
          },
          cumplimiento: {
            aumento_pasajeros: (impactoEsperado?.aumento_pasajeros || 0) > 0
              ? ((impactoReal?.aumento_pasajeros || 0) / impactoEsperado.aumento_pasajeros) * 100
              : 0,
            reduccion_tiempo: (impactoEsperado?.reduccion_tiempo || 0) > 0
              ? ((impactoReal?.reduccion_tiempo || 0) / impactoEsperado.reduccion_tiempo) * 100
              : 0,
            reduccion_costo: (impactoEsperado?.reduccion_costo || 0) > 0
              ? ((impactoReal?.reduccion_costo || 0) / impactoEsperado.reduccion_costo) * 100
              : 0,
            mejora_ocupacion: (impactoEsperado?.mejora_ocupacion || 0) > 0
              ? ((impactoReal?.mejora_ocupacion || 0) / impactoEsperado.mejora_ocupacion) * 100
              : 0
          }
        },
        evaluacion: {
          adopcion_exitosa: (tracking?.tasa_adopcion || 0) >= 70,
          cumplimiento_aceptable: (tracking?.cumplimiento_horario || 0) >= 80,
          impacto_positivo: this.evaluatePositiveImpact(impactoReal || {}),
          cumplimiento_objetivos: this.evaluateObjectiveCompliance(impactoEsperado || {}, impactoReal || {})
        }
      };

      // Redondear valores
      Object.keys(comparacion.impacto.diferencia).forEach(key => {
        comparacion.impacto.diferencia[key] = parseFloat(comparacion.impacto.diferencia[key].toFixed(2));
      });

      Object.keys(comparacion.impacto.cumplimiento).forEach(key => {
        comparacion.impacto.cumplimiento[key] = parseFloat(comparacion.impacto.cumplimiento[key].toFixed(2));
      });

      return comparacion;
    } catch (error) {
      throw new Error(`Error generando comparativo: ${error.message}`);
    }
  }

  /**
   * Evalúa si el impacto es positivo
   */
  evaluatePositiveImpact(impactoReal) {
    return (
      impactoReal.aumento_pasajeros > 0 ||
      impactoReal.reduccion_tiempo > 0 ||
      impactoReal.reduccion_costo > 0 ||
      impactoReal.mejora_ocupacion > 0
    );
  }

  /**
   * Evalúa cumplimiento de objetivos
   */
  evaluateObjectiveCompliance(impactoEsperado, impactoReal) {
    const umbral = 0.7; // 70% de cumplimiento mínimo

    const cumplimientos = [
      impactoEsperado.aumento_pasajeros > 0
        ? (impactoReal.aumento_pasajeros / impactoEsperado.aumento_pasajeros) >= umbral
        : true,
      impactoEsperado.reduccion_tiempo > 0
        ? (impactoReal.reduccion_tiempo / impactoEsperado.reduccion_tiempo) >= umbral
        : true,
      impactoEsperado.reduccion_costo > 0
        ? (impactoReal.reduccion_costo / impactoEsperado.reduccion_costo) >= umbral
        : true,
      impactoEsperado.mejora_ocupacion > 0
        ? (impactoReal.mejora_ocupacion / impactoEsperado.mejora_ocupacion) >= umbral
        : true
    ];

    return cumplimientos.filter(c => c).length / cumplimientos.length >= 0.5;
  }

  /**
   * Genera dashboard de adopción de sugerencias
   */
  async generateAdoptionDashboard(dateRange = null, filters = {}) {
    try {
      const { busId = null, tipoSugerencia = null, estado = null } = filters;

      // Construir query
      const query = {};
      if (busId) query.bus_id = busId;
      if (tipoSugerencia) query.tipo_sugerencia = tipoSugerencia;
      if (estado) query.estado = estado;

      // Obtener sugerencias
      const sugerencias = await this.SugerenciaBus.find(query).lean();

      // Filtrar por rango de fechas si se proporciona
      let sugerenciasFiltradas = sugerencias;
      if (dateRange) {
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        sugerenciasFiltradas = sugerencias.filter(s => {
          const fecha = new Date(s.fecha_sugerencia);
          return fecha >= start && fecha <= end;
        });
      }

      // Calcular estadísticas generales
      const estadisticas = this.calculateAdoptionStatistics(sugerenciasFiltradas);

      // Obtener sugerencias implementadas con tracking actualizado
      const sugerenciasImplementadas = sugerenciasFiltradas.filter(s => s.estado === 'implementada');
      
      // Actualizar tracking de sugerencias implementadas
      for (const sugerencia of sugerenciasImplementadas) {
        try {
          await this.updateTracking(sugerencia._id, dateRange);
        } catch (error) {
          console.warn(`Error actualizando tracking de sugerencia ${sugerencia._id}: ${error.message}`);
        }
      }

      // Obtener sugerencias actualizadas
      const sugerenciasActualizadas = await this.SugerenciaBus.find({
        _id: { $in: sugerenciasImplementadas.map(s => s._id) }
      }).lean();

      // Generar comparativos para sugerencias implementadas
      const comparativos = [];
      for (const sugerencia of sugerenciasActualizadas) {
        try {
          const comparativo = await this.generateSuggestedVsRealComparison(sugerencia._id, dateRange);
          comparativos.push(comparativo);
        } catch (error) {
          console.warn(`Error generando comparativo para sugerencia ${sugerencia._id}: ${error.message}`);
        }
      }

      // Calcular métricas de adopción
      const metricasAdopcion = this.calculateAdoptionMetrics(comparativos);

      return {
        periodo: dateRange || {
          start: null,
          end: null
        },
        filtros: filters,
        estadisticas,
        metricasAdopcion,
        sugerencias: {
          total: sugerenciasFiltradas.length,
          porEstado: this.groupByState(sugerenciasFiltradas),
          porTipo: this.groupByType(sugerenciasFiltradas),
          porPrioridad: this.groupByPriority(sugerenciasFiltradas)
        },
        comparativos,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Error generando dashboard de adopción: ${error.message}`);
    }
  }

  /**
   * Calcula estadísticas de adopción
   */
  calculateAdoptionStatistics(sugerencias) {
    const total = sugerencias.length;
    const porEstado = this.groupByState(sugerencias);
    const implementadas = porEstado.implementada || 0;
    const aprobadas = porEstado.aprobada || 0;
    const pendientes = porEstado.pendiente || 0;
    const rechazadas = porEstado.rechazada || 0;

    return {
      total,
      implementadas,
      aprobadas,
      pendientes,
      rechazadas,
      tasaAprobacion: total > 0 ? (aprobadas / total) * 100 : 0,
      tasaImplementacion: total > 0 ? (implementadas / total) * 100 : 0,
      tasaRechazo: total > 0 ? (rechazadas / total) * 100 : 0
    };
  }

  /**
   * Calcula métricas de adopción
   */
  calculateAdoptionMetrics(comparativos) {
    if (comparativos.length === 0) {
      return {
        tasaAdopcionPromedio: 0,
        cumplimientoHorarioPromedio: 0,
        impactoPromedio: {},
        sugerenciasExitosas: 0,
        sugerenciasFallidas: 0
      };
    }

    const tasaAdopcionPromedio = comparativos.reduce((sum, c) => 
      sum + (c.tracking.tasa_adopcion || 0), 0) / comparativos.length;

    const cumplimientoHorarioPromedio = comparativos.reduce((sum, c) => 
      sum + (c.tracking.cumplimiento_horario || 0), 0) / comparativos.length;

    const impactoPromedio = {
      aumento_pasajeros: comparativos.reduce((sum, c) => 
        sum + (c.impacto.real.aumento_pasajeros || 0), 0) / comparativos.length,
      reduccion_tiempo: comparativos.reduce((sum, c) => 
        sum + (c.impacto.real.reduccion_tiempo || 0), 0) / comparativos.length,
      reduccion_costo: comparativos.reduce((sum, c) => 
        sum + (c.impacto.real.reduccion_costo || 0), 0) / comparativos.length,
      mejora_ocupacion: comparativos.reduce((sum, c) => 
        sum + (c.impacto.real.mejora_ocupacion || 0), 0) / comparativos.length
    };

    const sugerenciasExitosas = comparativos.filter(c => 
      c.evaluacion.adopcion_exitosa && c.evaluacion.impacto_positivo
    ).length;

    const sugerenciasFallidas = comparativos.length - sugerenciasExitosas;

    return {
      tasaAdopcionPromedio: parseFloat(tasaAdopcionPromedio.toFixed(2)),
      cumplimientoHorarioPromedio: parseFloat(cumplimientoHorarioPromedio.toFixed(2)),
      impactoPromedio: {
        aumento_pasajeros: parseFloat(impactoPromedio.aumento_pasajeros.toFixed(2)),
        reduccion_tiempo: parseFloat(impactoPromedio.reduccion_tiempo.toFixed(2)),
        reduccion_costo: parseFloat(impactoPromedio.reduccion_costo.toFixed(2)),
        mejora_ocupacion: parseFloat(impactoPromedio.mejora_ocupacion.toFixed(2))
      },
      sugerenciasExitosas,
      sugerenciasFallidas,
      tasaExito: parseFloat(((sugerenciasExitosas / comparativos.length) * 100).toFixed(2))
    };
  }

  /**
   * Agrupa sugerencias por estado
   */
  groupByState(sugerencias) {
    return sugerencias.reduce((acc, s) => {
      acc[s.estado] = (acc[s.estado] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Agrupa sugerencias por tipo
   */
  groupByType(sugerencias) {
    return sugerencias.reduce((acc, s) => {
      acc[s.tipo_sugerencia] = (acc[s.tipo_sugerencia] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Agrupa sugerencias por prioridad
   */
  groupByPriority(sugerencias) {
    return sugerencias.reduce((acc, s) => {
      acc[s.prioridad] = (acc[s.prioridad] || 0) + 1;
      return acc;
    }, {});
  }
}

module.exports = BusSuggestionsService;

