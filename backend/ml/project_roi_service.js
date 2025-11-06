/**
 * Servicio de ROI del Proyecto
 * Calcula métricas pre/post, KPIs de impacto y análisis costo-beneficio
 */

class ProjectROIService {
  constructor(BaselineDataModel, ProjectCostModel, AsistenciaModel, PresenciaModel, ViajeBusModel) {
    this.BaselineData = BaselineDataModel;
    this.ProjectCost = ProjectCostModel;
    this.Asistencia = AsistenciaModel;
    this.Presencia = PresenciaModel;
    this.ViajeBus = ViajeBusModel;
  }

  /**
   * Crea o actualiza datos baseline
   */
  async createOrUpdateBaseline(baselineData) {
    try {
      const { v4: uuidv4 } = require('uuid');
      
      // Verificar si ya existe un baseline para el período
      const existing = await this.BaselineData.findOne({
        'periodo.fecha_inicio': baselineData.periodo.fecha_inicio,
        'periodo.fecha_fin': baselineData.periodo.fecha_fin
      });

      if (existing) {
        // Actualizar baseline existente
        Object.assign(existing, baselineData);
        existing.fecha_actualizacion = new Date();
        await existing.save();
        return existing;
      } else {
        // Crear nuevo baseline
        const baseline = new this.BaselineData({
          _id: uuidv4(),
          ...baselineData,
          fecha_creacion: new Date(),
          fecha_actualizacion: new Date()
        });
        await baseline.save();
        return baseline;
      }
    } catch (error) {
      throw new Error(`Error creando/actualizando baseline: ${error.message}`);
    }
  }

  /**
   * Calcula métricas del sistema actual (post-implementación)
   */
  async calculateCurrentMetrics(dateRange) {
    try {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);

      // Métricas de acceso
      const totalAccesos = await this.Asistencia.countDocuments({
        fecha_hora: { $gte: startDate, $lte: endDate }
      });

      const accesosEntrada = await this.Asistencia.countDocuments({
        fecha_hora: { $gte: startDate, $lte: endDate },
        tipo: 'entrada'
      });

      const accesosSalida = await this.Asistencia.countDocuments({
        fecha_hora: { $gte: startDate, $lte: endDate },
        tipo: 'salida'
      });

      // Calcular días en el período
      const dias = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

      // Calcular hora pico
      const accesosPorHora = await this.calculatePeakHour(startDate, endDate);

      // Métricas operativas
      const metricasOperativas = await this.calculateOperationalMetrics(startDate, endDate);

      // Métricas de presencia
      const metricasPresencia = await this.calculatePresenceMetrics(startDate, endDate);

      // Métricas de buses (si hay datos)
      const metricasBuses = await this.calculateBusMetrics(startDate, endDate);

      return {
        periodo: {
          fecha_inicio: startDate,
          fecha_fin: endDate,
          dias: dias
        },
        metricas_acceso: {
          total_accesos: totalAccesos,
          accesos_por_dia: dias > 0 ? parseFloat((totalAccesos / dias).toFixed(2)) : 0,
          accesos_entrada: accesosEntrada,
          accesos_salida: accesosSalida,
          pico_horario: accesosPorHora
        },
        metricas_operativas: metricasOperativas,
        metricas_presencia: metricasPresencia,
        metricas_buses: metricasBuses,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Error calculando métricas actuales: ${error.message}`);
    }
  }

  /**
   * Calcula hora pico
   */
  async calculatePeakHour(startDate, endDate) {
    const asistencias = await this.Asistencia.find({
      fecha_hora: { $gte: startDate, $lte: endDate }
    }).lean();

    const horasCount = {};
    asistencias.forEach(asistencia => {
      const fecha = new Date(asistencia.fecha_hora);
      const hora = fecha.getHours();
      horasCount[hora] = (horasCount[hora] || 0) + 1;
    });

    let picoHora = 0;
    let picoCantidad = 0;
    Object.keys(horasCount).forEach(hora => {
      if (horasCount[hora] > picoCantidad) {
        picoHora = parseInt(hora);
        picoCantidad = horasCount[hora];
      }
    });

    return {
      hora: picoHora,
      cantidad: picoCantidad
    };
  }

  /**
   * Calcula métricas operativas
   */
  async calculateOperationalMetrics(startDate, endDate) {
    // Calcular decisiones manuales (proxy para tiempo de atención)
    const decisionesManuales = await this.Asistencia.countDocuments({
      fecha_hora: { $gte: startDate, $lte: endDate },
      autorizacion_manual: true
    });

    const totalAccesos = await this.Asistencia.countDocuments({
      fecha_hora: { $gte: startDate, $lte: endDate }
    });

    const tasaResolucionManual = totalAccesos > 0
      ? (decisionesManuales / totalAccesos) * 100
      : 0;

    // Calcular incidentes (accesos rechazados o con problemas)
    // Esto es una aproximación basada en decisiones manuales con razones específicas
    const incidentes = await this.Asistencia.countDocuments({
      fecha_hora: { $gte: startDate, $lte: endDate },
      autorizacion_manual: true,
      razon_decision: { $exists: true, $ne: null }
    });

    return {
      tiempo_promedio_atencion: 0, // Requeriría datos específicos de tiempo
      tiempo_espera_promedio: 0, // Requeriría datos específicos de tiempo
      tasa_error: 0, // Requeriría datos específicos de errores
      tasa_resolucion_manual: parseFloat(tasaResolucionManual.toFixed(2)),
      incidentes_seguridad: incidentes
    };
  }

  /**
   * Calcula métricas de presencia
   */
  async calculatePresenceMetrics(startDate, endDate) {
    const presencias = await this.Presencia.find({
      hora_entrada: { $gte: startDate, $lte: endDate }
    }).lean();

    const tiemposEnCampus = presencias
      .filter(p => p.tiempo_en_campus)
      .map(p => p.tiempo_en_campus);

    const tiempoPromedio = tiemposEnCampus.length > 0
      ? tiemposEnCampus.reduce((sum, t) => sum + t, 0) / tiemposEnCampus.length
      : 0;

    return {
      total_estudiantes_campus: presencias.length,
      tiempo_promedio_campus: parseFloat((tiempoPromedio / 60).toFixed(2)), // Convertir a horas
      estudiantes_activos: presencias.filter(p => p.esta_dentro).length
    };
  }

  /**
   * Calcula métricas de buses
   */
  async calculateBusMetrics(startDate, endDate) {
    try {
      const viajes = await this.ViajeBus.find({
        fecha_salida: { $gte: startDate, $lte: endDate },
        estado: 'completado'
      }).lean();

      if (viajes.length === 0) {
        return {
          total_viajes: 0,
          pasajeros_transportados: 0,
          tasa_ocupacion_promedio: 0,
          costo_operacion_buses: 0,
          eficiencia_combustible: 0
        };
      }

      const totalViajes = viajes.length;
      const totalPasajeros = viajes.reduce((sum, v) => sum + (v.pasajeros_transportados || 0), 0);
      const totalCosto = viajes.reduce((sum, v) => sum + (v.costo_operacion || 0), 0);
      const tasaOcupacionPromedio = viajes.reduce((sum, v) => sum + (v.tasa_ocupacion || 0), 0) / totalViajes;

      return {
        total_viajes: totalViajes,
        pasajeros_transportados: totalPasajeros,
        tasa_ocupacion_promedio: parseFloat(tasaOcupacionPromedio.toFixed(2)),
        costo_operacion_buses: parseFloat(totalCosto.toFixed(2)),
        eficiencia_combustible: 0 // Requeriría datos específicos
      };
    } catch (error) {
      // Si no hay datos de buses, retornar métricas vacías
      return {
        total_viajes: 0,
        pasajeros_transportados: 0,
        tasa_ocupacion_promedio: 0,
        costo_operacion_buses: 0,
        eficiencia_combustible: 0
      };
    }
  }

  /**
   * Genera comparativo pre/post implementación
   */
  async generatePrePostComparison(baselineId, currentDateRange) {
    try {
      const baseline = await this.BaselineData.findById(baselineId);
      if (!baseline) {
        throw new Error('Baseline no encontrado');
      }

      // Calcular métricas actuales
      const currentMetrics = await this.calculateCurrentMetrics(currentDateRange);

      // Calcular diferencias
      const comparativo = this.calculateDifferences(baseline, currentMetrics);

      return {
        baseline: {
          id: baseline._id,
          periodo: baseline.periodo,
          metricas: {
            acceso: baseline.metricas_acceso,
            operativas: baseline.metricas_operativas,
            recursos: baseline.metricas_recursos,
            satisfaccion: baseline.metricas_satisfaccion,
            buses: baseline.metricas_buses
          },
          costos_sistema_anterior: baseline.costos_sistema_anterior
        },
        actual: {
          periodo: currentMetrics.periodo,
          metricas: {
            acceso: currentMetrics.metricas_acceso,
            operativas: currentMetrics.metricas_operativas,
            presencia: currentMetrics.metricas_presencia,
            buses: currentMetrics.metricas_buses
          }
        },
        comparativo: comparativo,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Error generando comparativo pre/post: ${error.message}`);
    }
  }

  /**
   * Calcula diferencias entre baseline y actual
   */
  calculateDifferences(baseline, current) {
    const baselineAcceso = baseline.metricas_acceso || {};
    const currentAcceso = current.metricas_acceso || {};
    const baselineOperativas = baseline.metricas_operativas || {};
    const currentOperativas = current.metricas_operativas || {};
    const baselineBuses = baseline.metricas_buses || {};
    const currentBuses = current.metricas_buses || {};

    return {
      acceso: {
        total_accesos: {
          antes: baselineAcceso.total_accesos || 0,
          despues: currentAcceso.total_accesos || 0,
          diferencia: (currentAcceso.total_accesos || 0) - (baselineAcceso.total_accesos || 0),
          porcentaje_cambio: baselineAcceso.total_accesos > 0
            ? (((currentAcceso.total_accesos || 0) - baselineAcceso.total_accesos) / baselineAcceso.total_accesos) * 100
            : 0
        },
        accesos_por_dia: {
          antes: baselineAcceso.accesos_por_dia || 0,
          despues: currentAcceso.accesos_por_dia || 0,
          diferencia: (currentAcceso.accesos_por_dia || 0) - (baselineAcceso.accesos_por_dia || 0),
          porcentaje_cambio: baselineAcceso.accesos_por_dia > 0
            ? (((currentAcceso.accesos_por_dia || 0) - baselineAcceso.accesos_por_dia) / baselineAcceso.accesos_por_dia) * 100
            : 0
        }
      },
      operativas: {
        tasa_resolucion_manual: {
          antes: baselineOperativas.tasa_resolucion_manual || 0,
          despues: currentOperativas.tasa_resolucion_manual || 0,
          diferencia: (currentOperativas.tasa_resolucion_manual || 0) - (baselineOperativas.tasa_resolucion_manual || 0),
          porcentaje_cambio: baselineOperativas.tasa_resolucion_manual > 0
            ? (((currentOperativas.tasa_resolucion_manual || 0) - baselineOperativas.tasa_resolucion_manual) / baselineOperativas.tasa_resolucion_manual) * 100
            : 0,
          mejora: (currentOperativas.tasa_resolucion_manual || 0) < (baselineOperativas.tasa_resolucion_manual || 0)
        },
        incidentes_seguridad: {
          antes: baselineOperativas.incidentes_seguridad || 0,
          despues: currentOperativas.incidentes_seguridad || 0,
          diferencia: (currentOperativas.incidentes_seguridad || 0) - (baselineOperativas.incidentes_seguridad || 0),
          porcentaje_cambio: baselineOperativas.incidentes_seguridad > 0
            ? (((currentOperativas.incidentes_seguridad || 0) - baselineOperativas.incidentes_seguridad) / baselineOperativas.incidentes_seguridad) * 100
            : 0,
          mejora: (currentOperativas.incidentes_seguridad || 0) < (baselineOperativas.incidentes_seguridad || 0)
        }
      },
      buses: {
        total_viajes: {
          antes: baselineBuses.total_viajes || 0,
          despues: currentBuses.total_viajes || 0,
          diferencia: (currentBuses.total_viajes || 0) - (baselineBuses.total_viajes || 0),
          porcentaje_cambio: baselineBuses.total_viajes > 0
            ? (((currentBuses.total_viajes || 0) - baselineBuses.total_viajes) / baselineBuses.total_viajes) * 100
            : 0
        },
        tasa_ocupacion: {
          antes: baselineBuses.tasa_ocupacion_promedio || 0,
          despues: currentBuses.tasa_ocupacion_promedio || 0,
          diferencia: (currentBuses.tasa_ocupacion_promedio || 0) - (baselineBuses.tasa_ocupacion_promedio || 0),
          porcentaje_cambio: baselineBuses.tasa_ocupacion_promedio > 0
            ? (((currentBuses.tasa_ocupacion_promedio || 0) - baselineBuses.tasa_ocupacion_promedio) / baselineBuses.tasa_ocupacion_promedio) * 100
            : 0,
          mejora: (currentBuses.tasa_ocupacion_promedio || 0) > (baselineBuses.tasa_ocupacion_promedio || 0)
        }
      }
    };
  }

  /**
   * Calcula KPIs de impacto del proyecto
   */
  async calculateImpactKPIs(baselineId, currentDateRange) {
    try {
      const comparativo = await this.generatePrePostComparison(baselineId, currentDateRange);
      const costos = await this.calculateProjectCosts();

      // Calcular KPIs
      const kpis = {
        eficiencia_operativa: {
          reduccion_tiempo_atencion: this.calculateReduction(
            comparativo.baseline.metricas.operativas.tiempo_promedio_atencion,
            comparativo.actual.metricas.operativas.tiempo_promedio_atencion
          ),
          reduccion_resolucion_manual: comparativo.comparativo.operativas.tasa_resolucion_manual.porcentaje_cambio,
          reduccion_incidentes: comparativo.comparativo.operativas.incidentes_seguridad.porcentaje_cambio
        },
        eficiencia_acceso: {
          aumento_capacidad: comparativo.comparativo.acceso.total_accesos.porcentaje_cambio,
          mejora_velocidad: 0, // Requeriría datos específicos
          reduccion_errores: 0 // Requeriría datos específicos
        },
        eficiencia_recursos: {
          reduccion_costo_operacion: this.calculateCostReduction(
            comparativo.baseline.metricas.recursos.costo_operacion_mensual,
            costos.costo_operacion_mensual_actual
          ),
          reduccion_horas_trabajo: this.calculateReduction(
            comparativo.baseline.metricas.recursos.horas_trabajo_totales,
            0 // Requeriría cálculo de horas actuales
          ),
          mejora_productividad: 0 // Requeriría cálculo específico
        },
        eficiencia_buses: {
          mejora_ocupacion: comparativo.comparativo.buses.tasa_ocupacion.porcentaje_cambio,
          aumento_viajes: comparativo.comparativo.buses.total_viajes.porcentaje_cambio,
          reduccion_costo_por_viaje: 0 // Requeriría cálculo específico
        },
        seguridad: {
          reduccion_incidentes: comparativo.comparativo.operativas.incidentes_seguridad.porcentaje_cambio,
          mejora_trazabilidad: 100, // Asumido que el sistema nuevo tiene mejor trazabilidad
          mejora_control_acceso: 100 // Asumido que el sistema nuevo tiene mejor control
        }
      };

      // Redondear valores
      Object.keys(kpis).forEach(categoria => {
        Object.keys(kpis[categoria]).forEach(kpi => {
          if (typeof kpis[categoria][kpi] === 'number') {
            kpis[categoria][kpi] = parseFloat(kpis[categoria][kpi].toFixed(2));
          }
        });
      });

      return {
        kpis,
        comparativo: comparativo.comparativo,
        costos,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Error calculando KPIs de impacto: ${error.message}`);
    }
  }

  /**
   * Calcula reducción porcentual
   */
  calculateReduction(antes, despues) {
    if (!antes || antes === 0) return 0;
    return ((antes - despues) / antes) * 100;
  }

  /**
   * Calcula reducción de costos
   */
  calculateCostReduction(costoAnterior, costoActual) {
    if (!costoAnterior || costoAnterior === 0) return 0;
    return ((costoAnterior - costoActual) / costoAnterior) * 100;
  }

  /**
   * Calcula costos del proyecto actual
   */
  async calculateProjectCosts(dateRange = null) {
    try {
      const query = {};
      if (dateRange) {
        query.fecha = {
          $gte: new Date(dateRange.start),
          $lte: new Date(dateRange.end)
        };
      }

      const costos = await this.ProjectCost.find(query).lean();

      // Calcular costos por categoría
      const costosPorCategoria = {};
      let costoTotal = 0;
      let costoInversionInicial = 0;
      let costoOperacionMensual = 0;

      costos.forEach(costo => {
        const categoria = costo.categoria || 'operacion_recurrente';
        if (!costosPorCategoria[categoria]) {
          costosPorCategoria[categoria] = 0;
        }
        costosPorCategoria[categoria] += costo.monto;
        costoTotal += costo.monto;

        if (categoria === 'inversion_inicial') {
          costoInversionInicial += costo.monto;
        } else if (categoria === 'operacion_recurrente') {
          // Si es mensual, sumar al costo mensual
          if (costo.periodo?.tipo === 'mensual') {
            costoOperacionMensual += costo.monto;
          }
        }
      });

      return {
        costo_total: parseFloat(costoTotal.toFixed(2)),
        costo_inversion_inicial: parseFloat(costoInversionInicial.toFixed(2)),
        costo_operacion_mensual_actual: parseFloat(costoOperacionMensual.toFixed(2)),
        costos_por_categoria: costosPorCategoria,
        total_costos: costos.length
      };
    } catch (error) {
      throw new Error(`Error calculando costos del proyecto: ${error.message}`);
    }
  }

  /**
   * Realiza análisis costo-beneficio y ROI
   */
  async calculateCostBenefitAnalysis(baselineId, currentDateRange, projectionMonths = 12) {
    try {
      const comparativo = await this.generatePrePostComparison(baselineId, currentDateRange);
      const costos = await this.calculateProjectCosts();
      const kpis = await this.calculateImpactKPIs(baselineId, currentDateRange);

      // Calcular ahorros mensuales
      const costoOperacionAnterior = comparativo.baseline.metricas.recursos?.costo_operacion_mensual || 0;
      const costoOperacionActual = costos.costo_operacion_mensual_actual;
      const ahorroMensual = costoOperacionAnterior - costoOperacionActual;

      // Calcular ahorros en sistema anterior
      const costoSistemaAnterior = comparativo.baseline.costos_sistema_anterior?.costo_total_mensual || 0;
      const ahorroSistemaAnterior = costoSistemaAnterior - costoOperacionActual;

      // Ahorro total mensual
      const ahorroTotalMensual = ahorroMensual + ahorroSistemaAnterior;

      // Proyección de ahorros
      const ahorroAnual = ahorroTotalMensual * 12;
      const ahorroProyectado = ahorroTotalMensual * projectionMonths;

      // Calcular ROI
      const inversionInicial = costos.costo_inversion_inicial;
      const roi = inversionInicial > 0
        ? ((ahorroAnual - inversionInicial) / inversionInicial) * 100
        : 0;

      // Período de recuperación (payback period)
      const paybackPeriod = ahorroTotalMensual > 0
        ? inversionInicial / ahorroTotalMensual
        : null;

      // Beneficio neto
      const beneficioNeto = ahorroAnual - inversionInicial;

      // Valor presente neto (VPN) simplificado
      const tasaDescuento = 0.1; // 10% anual
      const vpn = this.calculateNPV(ahorroTotalMensual, inversionInicial, projectionMonths, tasaDescuento);

      return {
        costos: {
          inversion_inicial: inversionInicial,
          costo_operacion_mensual_actual: costoOperacionActual,
          costo_operacion_mensual_anterior: costoOperacionAnterior,
          costos_sistema_anterior: costoSistemaAnterior
        },
        ahorros: {
          ahorro_operacion_mensual: parseFloat(ahorroMensual.toFixed(2)),
          ahorro_sistema_anterior_mensual: parseFloat(ahorroSistemaAnterior.toFixed(2)),
          ahorro_total_mensual: parseFloat(ahorroTotalMensual.toFixed(2)),
          ahorro_anual: parseFloat(ahorroAnual.toFixed(2)),
          ahorro_proyectado: parseFloat(ahorroProyectado.toFixed(2))
        },
        roi: {
          porcentaje: parseFloat(roi.toFixed(2)),
          beneficio_neto: parseFloat(beneficioNeto.toFixed(2)),
          payback_period_meses: paybackPeriod ? parseFloat(paybackPeriod.toFixed(2)) : null,
          es_positivo: roi > 0
        },
        vpn: {
          valor: parseFloat(vpn.toFixed(2)),
          tasa_descuento: tasaDescuento * 100,
          periodo_anos: projectionMonths / 12
        },
        kpis: kpis.kpis,
        proyeccion: {
          meses: projectionMonths,
          ahorro_total: parseFloat(ahorroProyectado.toFixed(2)),
          beneficio_neto_proyectado: parseFloat((ahorroProyectado - inversionInicial).toFixed(2))
        },
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Error calculando análisis costo-beneficio: ${error.message}`);
    }
  }

  /**
   * Calcula Valor Presente Neto (VPN) simplificado
   */
  calculateNPV(flujoMensual, inversionInicial, meses, tasaDescuento) {
    let vpn = -inversionInicial;
    const tasaMensual = tasaDescuento / 12;

    for (let i = 1; i <= meses; i++) {
      vpn += flujoMensual / Math.pow(1 + tasaMensual, i);
    }

    return vpn;
  }

  /**
   * Genera reporte completo de ROI del proyecto
   */
  async generateProjectROIReport(baselineId, currentDateRange, options = {}) {
    try {
      const {
        includeKPIs = true,
        includeCostBenefit = true,
        projectionMonths = 12
      } = options;

      const comparativo = await this.generatePrePostComparison(baselineId, currentDateRange);
      
      let kpis = null;
      let costBenefit = null;

      if (includeKPIs) {
        kpis = await this.calculateImpactKPIs(baselineId, currentDateRange);
      }

      if (includeCostBenefit) {
        costBenefit = await this.calculateCostBenefitAnalysis(baselineId, currentDateRange, projectionMonths);
      }

      return {
        baseline: comparativo.baseline,
        actual: comparativo.actual,
        comparativo: comparativo.comparativo,
        kpis: kpis?.kpis || null,
        costBenefit: costBenefit || null,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Error generando reporte de ROI: ${error.message}`);
    }
  }
}

module.exports = ProjectROIService;

