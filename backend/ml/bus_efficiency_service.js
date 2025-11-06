/**
 * Servicio de Eficiencia de Buses
 * Calcula métricas de utilización, comparativo antes/después y ROI
 */

class BusEfficiencyService {
  constructor(BusModel, ViajeBusModel) {
    this.Bus = BusModel;
    this.ViajeBus = ViajeBusModel;
  }

  /**
   * Calcula métricas de utilización de buses
   */
  async calculateUtilizationMetrics(dateRange, options = {}) {
    const {
      busId = null,
      ruta = null,
      groupBy = 'day' // 'day', 'week', 'month', 'bus'
    } = options;

    try {
      const startDate = new Date(dateRange.startDate || dateRange.start);
      const endDate = new Date(dateRange.endDate || dateRange.end);
      endDate.setHours(23, 59, 59, 999);

      // Construir query base
      const query = {
        fecha_salida: { $gte: startDate, $lte: endDate },
        estado: 'completado'
      };

      if (busId) query.bus_id = busId;
      if (ruta) query.ruta = ruta;

      // Obtener viajes
      const viajes = await this.ViajeBus.find(query).lean();

      // Obtener información de buses
      const busIds = [...new Set(viajes.map(v => v.bus_id))];
      const buses = await this.Bus.find({ _id: { $in: busIds } }).lean();
      const busMap = {};
      buses.forEach(bus => {
        busMap[bus._id] = bus;
      });

      // Calcular métricas por grupo
      const metrics = this.groupAndCalculateMetrics(viajes, busMap, groupBy);

      // Calcular métricas agregadas
      const aggregatedMetrics = this.calculateAggregatedMetrics(viajes, busMap);

      return {
        dateRange: {
          start: startDate,
          end: endDate
        },
        filters: {
          busId,
          ruta,
          groupBy
        },
        metrics,
        aggregated: aggregatedMetrics,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Error calculando métricas de utilización: ${error.message}`);
    }
  }

  /**
   * Agrupa y calcula métricas por período
   */
  groupAndCalculateMetrics(viajes, busMap, groupBy) {
    const grouped = {};

    viajes.forEach(viaje => {
      const bus = busMap[viaje.bus_id];
      if (!bus) return;

      let key;
      const fecha = new Date(viaje.fecha_salida);

      switch (groupBy) {
        case 'day':
          key = fecha.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(fecha);
          weekStart.setDate(fecha.getDate() - fecha.getDay());
          key = `Semana ${weekStart.toISOString().split('T')[0]}`;
          break;
        case 'month':
          key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'bus':
          key = viaje.bus_id;
          break;
        default:
          key = fecha.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = {
          key,
          totalViajes: 0,
          totalPasajeros: 0,
          totalCapacidad: 0,
          totalDistancia: 0,
          totalTiempo: 0,
          totalCosto: 0,
          buses: new Set(),
          rutas: new Set()
        };
      }

      const group = grouped[key];
      group.totalViajes++;
      group.totalPasajeros += viaje.pasajeros_transportados || 0;
      group.totalCapacidad += bus.capacidad_maxima;
      group.totalDistancia += viaje.distancia_km || 0;
      group.totalTiempo += viaje.tiempo_viaje_minutos || 0;
      group.totalCosto += viaje.costo_operacion || 0;
      group.buses.add(viaje.bus_id);
      group.rutas.add(viaje.ruta);
    });

    // Calcular métricas derivadas
    return Object.values(grouped).map(group => {
      const tasaOcupacion = group.totalCapacidad > 0
        ? (group.totalPasajeros / group.totalCapacidad) * 100
        : 0;

      const promedioPasajerosPorViaje = group.totalViajes > 0
        ? group.totalPasajeros / group.totalViajes
        : 0;

      const costoPorPasajero = group.totalPasajeros > 0
        ? group.totalCosto / group.totalPasajeros
        : 0;

      const costoPorKm = group.totalDistancia > 0
        ? group.totalCosto / group.totalDistancia
        : 0;

      const velocidadPromedio = group.totalTiempo > 0
        ? (group.totalDistancia / group.totalTiempo) * 60 // km/h
        : 0;

      return {
        periodo: group.key,
        totalViajes: group.totalViajes,
        totalPasajeros: group.totalPasajeros,
        totalCapacidad: group.totalCapacidad,
        tasaOcupacion: parseFloat(tasaOcupacion.toFixed(2)),
        promedioPasajerosPorViaje: parseFloat(promedioPasajerosPorViaje.toFixed(2)),
        totalDistancia: parseFloat(group.totalDistancia.toFixed(2)),
        totalTiempo: group.totalTiempo,
        velocidadPromedio: parseFloat(velocidadPromedio.toFixed(2)),
        totalCosto: parseFloat(group.totalCosto.toFixed(2)),
        costoPorPasajero: parseFloat(costoPorPasajero.toFixed(2)),
        costoPorKm: parseFloat(costoPorKm.toFixed(2)),
        numeroBuses: group.buses.size,
        numeroRutas: group.rutas.size
      };
    });
  }

  /**
   * Calcula métricas agregadas generales
   */
  calculateAggregatedMetrics(viajes, busMap) {
    if (viajes.length === 0) {
      return {
        totalViajes: 0,
        totalPasajeros: 0,
        tasaOcupacionPromedio: 0,
        costoTotal: 0,
        distanciaTotal: 0
      };
    }

    let totalPasajeros = 0;
    let totalCapacidad = 0;
    let totalCosto = 0;
    let totalDistancia = 0;
    const busesUnicos = new Set();

    viajes.forEach(viaje => {
      const bus = busMap[viaje.bus_id];
      if (!bus) return;

      totalPasajeros += viaje.pasajeros_transportados || 0;
      totalCapacidad += bus.capacidad_maxima;
      totalCosto += viaje.costo_operacion || 0;
      totalDistancia += viaje.distancia_km || 0;
      busesUnicos.add(viaje.bus_id);
    });

    const tasaOcupacionPromedio = totalCapacidad > 0
      ? (totalPasajeros / totalCapacidad) * 100
      : 0;

    const costoPorPasajero = totalPasajeros > 0
      ? totalCosto / totalPasajeros
      : 0;

    return {
      totalViajes: viajes.length,
      totalPasajeros,
      totalCapacidad,
      tasaOcupacionPromedio: parseFloat(tasaOcupacionPromedio.toFixed(2)),
      numeroBuses: busesUnicos.size,
      costoTotal: parseFloat(totalCosto.toFixed(2)),
      costoPorPasajero: parseFloat(costoPorPasajero.toFixed(2)),
      distanciaTotal: parseFloat(totalDistancia.toFixed(2)),
      promedioPasajerosPorViaje: parseFloat((totalPasajeros / viajes.length).toFixed(2))
    };
  }

  /**
   * Genera comparativo antes/después de optimizaciones
   */
  async generateBeforeAfterComparison(busId, optimizationDate, dateRange = null) {
    try {
      const optDate = new Date(optimizationDate);
      
      // Si no se proporciona rango de fechas, usar 30 días antes y después
      let beforeStart, beforeEnd, afterStart, afterEnd;
      
      if (dateRange) {
        beforeStart = new Date(dateRange.beforeStart);
        beforeEnd = new Date(dateRange.beforeEnd);
        afterStart = new Date(dateRange.afterStart);
        afterEnd = new Date(dateRange.afterEnd);
      } else {
        // 30 días antes de la optimización
        beforeStart = new Date(optDate);
        beforeStart.setDate(beforeStart.getDate() - 30);
        beforeEnd = new Date(optDate);
        beforeEnd.setDate(beforeEnd.getDate() - 1);
        beforeEnd.setHours(23, 59, 59, 999);

        // 30 días después de la optimización
        afterStart = new Date(optDate);
        afterStart.setDate(afterStart.getDate() + 1);
        afterEnd = new Date(optDate);
        afterEnd.setDate(afterEnd.getDate() + 30);
        afterEnd.setHours(23, 59, 59, 999);
      }

      // Obtener bus y sus optimizaciones
      const bus = await this.Bus.findById(busId);
      if (!bus) {
        throw new Error('Bus no encontrado');
      }

      // Obtener viajes antes
      const viajesAntes = await this.ViajeBus.find({
        bus_id: busId,
        fecha_salida: { $gte: beforeStart, $lte: beforeEnd },
        estado: 'completado'
      }).lean();

      // Obtener viajes después
      const viajesDespues = await this.ViajeBus.find({
        bus_id: busId,
        fecha_salida: { $gte: afterStart, $lte: afterEnd },
        estado: 'completado'
      }).lean();

      // Calcular métricas antes
      const metricsAntes = this.calculateAggregatedMetrics(viajesAntes, { [busId]: bus });

      // Calcular métricas después
      const metricsDespues = this.calculateAggregatedMetrics(viajesDespues, { [busId]: bus });

      // Calcular diferencias y mejoras
      const comparativo = this.calculateComparison(metricsAntes, metricsDespues);

      return {
        bus: {
          id: bus._id,
          placa: bus.placa,
          numero_bus: bus.numero_bus,
          capacidad_maxima: bus.capacidad_maxima,
          optimizaciones: bus.optimizaciones_aplicadas || []
        },
        periodos: {
          antes: {
            start: beforeStart,
            end: beforeEnd,
            dias: Math.ceil((beforeEnd - beforeStart) / (1000 * 60 * 60 * 24))
          },
          despues: {
            start: afterStart,
            end: afterEnd,
            dias: Math.ceil((afterEnd - afterStart) / (1000 * 60 * 60 * 24))
          }
        },
        metricsAntes,
        metricsDespues,
        comparativo,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Error generando comparativo antes/después: ${error.message}`);
    }
  }

  /**
   * Calcula comparación entre métricas antes y después
   */
  calculateComparison(antes, despues) {
    const cambios = {
      tasaOcupacion: {
        antes: antes.tasaOcupacionPromedio,
        despues: despues.tasaOcupacionPromedio,
        diferencia: despues.tasaOcupacionPromedio - antes.tasaOcupacionPromedio,
        porcentajeCambio: antes.tasaOcupacionPromedio > 0
          ? ((despues.tasaOcupacionPromedio - antes.tasaOcupacionPromedio) / antes.tasaOcupacionPromedio) * 100
          : 0,
        mejora: despues.tasaOcupacionPromedio > antes.tasaOcupacionPromedio
      },
      totalPasajeros: {
        antes: antes.totalPasajeros,
        despues: despues.totalPasajeros,
        diferencia: despues.totalPasajeros - antes.totalPasajeros,
        porcentajeCambio: antes.totalPasajeros > 0
          ? ((despues.totalPasajeros - antes.totalPasajeros) / antes.totalPasajeros) * 100
          : 0,
        mejora: despues.totalPasajeros > antes.totalPasajeros
      },
      costoPorPasajero: {
        antes: antes.costoPorPasajero,
        despues: despues.costoPorPasajero,
        diferencia: despues.costoPorPasajero - antes.costoPorPasajero,
        porcentajeCambio: antes.costoPorPasajero > 0
          ? ((despues.costoPorPasajero - antes.costoPorPasajero) / antes.costoPorPasajero) * 100
          : 0,
        mejora: despues.costoPorPasajero < antes.costoPorPasajero // Menor costo es mejor
      },
      promedioPasajerosPorViaje: {
        antes: antes.promedioPasajerosPorViaje,
        despues: despues.promedioPasajerosPorViaje,
        diferencia: despues.promedioPasajerosPorViaje - antes.promedioPasajerosPorViaje,
        porcentajeCambio: antes.promedioPasajerosPorViaje > 0
          ? ((despues.promedioPasajerosPorViaje - antes.promedioPasajerosPorViaje) / antes.promedioPasajerosPorViaje) * 100
          : 0,
        mejora: despues.promedioPasajerosPorViaje > antes.promedioPasajerosPorViaje
      }
    };

    // Redondear valores
    Object.keys(cambios).forEach(key => {
      cambios[key].diferencia = parseFloat(cambios[key].diferencia.toFixed(2));
      cambios[key].porcentajeCambio = parseFloat(cambios[key].porcentajeCambio.toFixed(2));
    });

    return cambios;
  }

  /**
   * Calcula ROI (Return on Investment) de optimizaciones
   */
  async calculateROI(busId, optimizationDate, dateRange = null) {
    try {
      // Obtener comparativo antes/después
      const comparativo = await this.generateBeforeAfterComparison(busId, optimizationDate, dateRange);

      // Obtener costo de optimizaciones
      const bus = comparativo.bus;
      const optimizaciones = bus.optimizaciones || [];
      
      // Filtrar optimizaciones aplicadas en o antes de la fecha de optimización
      const optDate = new Date(optimizationDate);
      const optimizacionesRelevantes = optimizaciones.filter(opt => {
        const fechaOpt = new Date(opt.fecha_aplicacion);
        return fechaOpt <= optDate;
      });

      const costoTotalOptimizaciones = optimizacionesRelevantes.reduce(
        (sum, opt) => sum + (opt.costo || 0), 0
      );

      // Calcular ahorros/ganancias
      const periodoDias = comparativo.periodos.despues.dias;
      const diasPorMes = 30;
      const meses = periodoDias / diasPorMes;

      // Ahorro en costo por pasajero (diferencia negativa significa ahorro)
      const ahorroPorPasajero = -comparativo.comparativo.costoPorPasajero.diferencia;
      const pasajerosDespues = comparativo.metricsDespues.totalPasajeros;
      const ahorroTotal = ahorroPorPasajero > 0 ? ahorroPorPasajero * pasajerosDespues : 0;

      // Proyección anual
      const ahorroAnual = (ahorroTotal / meses) * 12;

      // Calcular ROI
      const roi = costoTotalOptimizaciones > 0
        ? ((ahorroAnual - costoTotalOptimizaciones) / costoTotalOptimizaciones) * 100
        : 0;

      // Tiempo de recuperación (payback period) en meses
      const paybackPeriod = ahorroTotal > 0 && meses > 0
        ? (costoTotalOptimizaciones / (ahorroTotal / meses))
        : null;

      // Beneficio neto
      const beneficioNeto = ahorroAnual - costoTotalOptimizaciones;

      return {
        bus: {
          id: bus.id,
          placa: bus.placa,
          numero_bus: bus.numero_bus
        },
        optimizaciones: {
          total: optimizacionesRelevantes.length,
          costoTotal: parseFloat(costoTotalOptimizaciones.toFixed(2)),
          detalles: optimizacionesRelevantes.map(opt => ({
            tipo: opt.tipo,
            descripcion: opt.descripcion,
            costo: opt.costo,
            fecha: opt.fecha_aplicacion
          }))
        },
        metricas: {
          periodoAnalisis: periodoDias,
          ahorroPorPasajero: parseFloat(ahorroPorPasajero.toFixed(2)),
          ahorroTotalPeriodo: parseFloat(ahorroTotal.toFixed(2)),
          ahorroAnualProyectado: parseFloat(ahorroAnual.toFixed(2)),
          costoPorPasajeroAntes: comparativo.metricsAntes.costoPorPasajero,
          costoPorPasajeroDespues: comparativo.metricsDespues.costoPorPasajero
        },
        roi: {
          porcentaje: parseFloat(roi.toFixed(2)),
          beneficioNeto: parseFloat(beneficioNeto.toFixed(2)),
          paybackPeriodMeses: paybackPeriod ? parseFloat(paybackPeriod.toFixed(2)) : null,
          esPositivo: roi > 0
        },
        comparativo: comparativo.comparativo,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Error calculando ROI: ${error.message}`);
    }
  }

  /**
   * Genera reporte completo de eficiencia
   */
  async generateEfficiencyReport(dateRange, options = {}) {
    const {
      busId = null,
      includeComparison = false,
      includeROI = false,
      optimizationDate = null
    } = options;

    try {
      // Métricas de utilización
      const utilizationMetrics = await this.calculateUtilizationMetrics(dateRange, {
        busId,
        groupBy: 'day'
      });

      let comparison = null;
      let roi = null;

      // Comparativo antes/después si se solicita
      if (includeComparison && busId && optimizationDate) {
        comparison = await this.generateBeforeAfterComparison(busId, optimizationDate);
      }

      // ROI si se solicita
      if (includeROI && busId && optimizationDate) {
        roi = await this.calculateROI(busId, optimizationDate);
      }

      return {
        dateRange: utilizationMetrics.dateRange,
        utilization: utilizationMetrics,
        comparison,
        roi,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Error generando reporte de eficiencia: ${error.message}`);
    }
  }
}

module.exports = BusEfficiencyService;

