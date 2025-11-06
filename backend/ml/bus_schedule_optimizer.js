/**
 * Algoritmo de Optimización de Horarios de Buses
 * Analiza patrones de demanda y genera sugerencias de horarios óptimos
 */

class BusScheduleOptimizer {
  constructor(ViajeBusModel, BusModel, SugerenciaBusModel) {
    this.ViajeBus = ViajeBusModel;
    this.Bus = BusModel;
    this.SugerenciaBus = SugerenciaBusModel;
  }

  /**
   * Analiza patrones de demanda por hora del día
   */
  async analyzeDemandPatterns(ruta, daysOfWeek = null, dateRange = null) {
    try {
      const query = { ruta, estado: 'completado' };
      
      if (dateRange) {
        query.fecha_salida = {
          $gte: dateRange.start,
          $lte: dateRange.end
        };
      }

      const viajes = await this.ViajeBus.find(query).lean();
      
      if (viajes.length === 0) {
        return {
          hourlyDemand: {},
          peakHours: [],
          averageOccupancy: 0,
          totalTrips: 0
        };
      }

      // Agrupar por hora del día
      const hourlyDemand = {};
      const hourlyOccupancy = {};
      const hourlyTrips = {};

      viajes.forEach(viaje => {
        const fechaSalida = new Date(viaje.fecha_salida);
        const hora = fechaSalida.getHours();
        const diaSemana = fechaSalida.getDay(); // 0 = Domingo, 1 = Lunes, etc.

        // Filtrar por días de la semana si se especifica
        if (daysOfWeek && daysOfWeek.length > 0) {
          const diasMap = {
            'lunes': 1, 'martes': 2, 'miercoles': 3, 'jueves': 4,
            'viernes': 5, 'sabado': 6, 'domingo': 0
          };
          const diaNombre = Object.keys(diasMap).find(k => diasMap[k] === diaSemana);
          if (!daysOfWeek.includes(diaNombre)) {
            return;
          }
        }

        if (!hourlyDemand[hora]) {
          hourlyDemand[hora] = 0;
          hourlyOccupancy[hora] = [];
          hourlyTrips[hora] = 0;
        }

        hourlyDemand[hora] += viaje.pasajeros_transportados || 0;
        hourlyOccupancy[hora].push(viaje.tasa_ocupacion || 0);
        hourlyTrips[hora] += 1;
      });

      // Calcular promedios y encontrar horas pico
      const hourlyStats = {};
      let totalDemand = 0;
      let totalOccupancy = 0;
      let totalTrips = 0;

      Object.keys(hourlyDemand).forEach(hora => {
        const avgOccupancy = hourlyOccupancy[hora].reduce((a, b) => a + b, 0) / hourlyOccupancy[hora].length;
        hourlyStats[hora] = {
          totalPasajeros: hourlyDemand[hora],
          promedioOcupacion: parseFloat(avgOccupancy.toFixed(2)),
          numeroViajes: hourlyTrips[hora],
          promedioPasajerosPorViaje: parseFloat((hourlyDemand[hora] / hourlyTrips[hora]).toFixed(2))
        };
        totalDemand += hourlyDemand[hora];
        totalOccupancy += avgOccupancy;
        totalTrips += hourlyTrips[hora];
      });

      // Identificar horas pico (top 3 horas con mayor demanda)
      const peakHours = Object.keys(hourlyStats)
        .sort((a, b) => hourlyStats[b].totalPasajeros - hourlyStats[a].totalPasajeros)
        .slice(0, 3)
        .map(h => parseInt(h));

      const averageOccupancy = totalTrips > 0 ? totalOccupancy / totalTrips : 0;

      return {
        hourlyDemand: hourlyStats,
        peakHours,
        averageOccupancy: parseFloat(averageOccupancy.toFixed(2)),
        totalTrips,
        totalDemand
      };
    } catch (error) {
      throw new Error(`Error analizando patrones de demanda: ${error.message}`);
    }
  }

  /**
   * Calcula frecuencia óptima basada en demanda
   */
  calculateOptimalFrequency(demandPattern, capacidadBus, ocupacionObjetivo = 80) {
    const frequencies = {};
    const ocupacionMaxima = (capacidadBus * ocupacionObjetivo) / 100;

    Object.keys(demandPattern.hourlyDemand).forEach(hora => {
      const stats = demandPattern.hourlyDemand[hora];
      const demandaPorHora = stats.totalPasajeros;
      
      // Calcular frecuencia necesaria para mantener ocupación objetivo
      const viajesNecesarios = Math.ceil(demandaPorHora / ocupacionMaxima);
      const frecuenciaMinutos = viajesNecesarios > 0 ? 60 / viajesNecesarios : 60;
      
      frequencies[hora] = {
        viajesPorHora: viajesNecesarios,
        frecuenciaMinutos: Math.max(15, Math.min(60, Math.round(frecuenciaMinutos / 5) * 5)), // Redondear a múltiplos de 5, mínimo 15 min
        demanda: demandaPorHora,
        ocupacionEsperada: demandaPorHora / (viajesNecesarios * capacidadBus) * 100
      };
    });

    return frequencies;
  }

  /**
   * Genera horarios óptimos para una ruta
   */
  async generateOptimalSchedule(ruta, diaSemana, capacidadBus, ocupacionObjetivo = 80) {
    try {
      // Analizar demanda para el día de la semana específico
      const diasMap = {
        'lunes': 1, 'martes': 2, 'miercoles': 3, 'jueves': 4,
        'viernes': 5, 'sabado': 6, 'domingo': 0
      };

      // Obtener datos de las últimas 4 semanas
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 28);

      const demandPattern = await this.analyzeDemandPatterns(
        ruta,
        [diaSemana],
        { start: startDate, end: endDate }
      );

      if (demandPattern.totalTrips === 0) {
        throw new Error('No hay datos suficientes para generar sugerencias');
      }

      // Calcular frecuencia óptima
      const frequencies = this.calculateOptimalFrequency(demandPattern, capacidadBus, ocupacionObjetivo);

      // Generar horarios sugeridos
      const suggestedSchedules = [];
      const horasOperacion = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

      horasOperacion.forEach(hora => {
        if (frequencies[hora]) {
          const freq = frequencies[hora];
          const numViajes = freq.viajesPorHora;
          const intervalo = freq.frecuenciaMinutos;

          // Generar horarios dentro de la hora
          for (let i = 0; i < numViajes; i++) {
            const minutos = Math.round((i * intervalo) % 60);
            const horarioSalida = `${hora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
            
            // Calcular horario de llegada estimado (asumir 30-45 min de viaje promedio)
            const tiempoViajeEstimado = 35; // minutos
            const horaLLegada = hora + Math.floor((minutos + tiempoViajeEstimado) / 60);
            const minutosLLegada = (minutos + tiempoViajeEstimado) % 60;
            const horarioLlegada = `${horaLLegada.toString().padStart(2, '0')}:${minutosLLegada.toString().padStart(2, '0')}`;

            suggestedSchedules.push({
              horario_salida: horarioSalida,
              horario_llegada: horarioLlegada,
              frecuencia_minutos: intervalo,
              demanda_esperada: freq.demanda / numViajes,
              ocupacion_esperada: parseFloat(freq.ocupacionEsperada.toFixed(2)),
              prioridad: demandPattern.peakHours.includes(hora) ? 'alta' : 'media'
            });
          }
        } else {
          // Para horas sin datos, sugerir horario estándar cada 30 minutos
          suggestedSchedules.push({
            horario_salida: `${hora.toString().padStart(2, '0')}:00`,
            horario_llegada: `${(hora + 1).toString().padStart(2, '0')}:00`,
            frecuencia_minutos: 30,
            demanda_esperada: 0,
            ocupacion_esperada: 0,
            prioridad: 'baja'
          });
        }
      });

      return {
        ruta,
        diaSemana,
        schedules: suggestedSchedules,
        demandPattern,
        frequencies,
        metrics: {
          totalHorarios: suggestedSchedules.length,
          horasPico: demandPattern.peakHours,
          ocupacionPromedio: demandPattern.averageOccupancy,
          ocupacionObjetivo
        }
      };
    } catch (error) {
      throw new Error(`Error generando horarios óptimos: ${error.message}`);
    }
  }

  /**
   * Calcula métricas de eficiencia para un horario sugerido
   */
  async calculateScheduleEfficiencyMetrics(ruta, horarioSalida, diaSemana, capacidadBus) {
    try {
      // Obtener viajes similares (misma ruta, mismo día, horario cercano)
      const [hora, minutos] = horarioSalida.split(':').map(Number);
      const horaInicio = new Date();
      horaInicio.setHours(hora - 1, minutos, 0, 0);
      const horaFin = new Date();
      horaFin.setHours(hora + 1, minutos, 0, 0);

      const diasMap = {
        'lunes': 1, 'martes': 2, 'miercoles': 3, 'jueves': 4,
        'viernes': 5, 'sabado': 6, 'domingo': 0
      };
      const diaNum = diasMap[diaSemana];

      // Obtener viajes históricos en ventana similar
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 28);

      const viajes = await this.ViajeBus.find({
        ruta,
        estado: 'completado',
        fecha_salida: {
          $gte: startDate,
          $lte: endDate
        }
      }).lean();

      // Filtrar por día de la semana y hora similar
      const viajesSimilares = viajes.filter(viaje => {
        const fecha = new Date(viaje.fecha_salida);
        const viajeHora = fecha.getHours();
        const viajeDia = fecha.getDay();
        return viajeDia === diaNum && Math.abs(viajeHora - hora) <= 1;
      });

      if (viajesSimilares.length === 0) {
        return {
          eficiencia: 0,
          ocupacionEsperada: 0,
          costoEsperado: 0,
          tiempoViajeEsperado: 0
        };
      }

      // Calcular métricas promedio
      const totalPasajeros = viajesSimilares.reduce((sum, v) => sum + (v.pasajeros_transportados || 0), 0);
      const totalCosto = viajesSimilares.reduce((sum, v) => sum + (v.costo_operacion || 0), 0);
      const totalTiempo = viajesSimilares.reduce((sum, v) => sum + (v.tiempo_viaje_minutos || 0), 0);

      const promedioPasajeros = totalPasajeros / viajesSimilares.length;
      const ocupacionEsperada = (promedioPasajeros / capacidadBus) * 100;
      const costoEsperado = totalCosto / viajesSimilares.length;
      const tiempoViajeEsperado = totalTiempo / viajesSimilares.length;

      // Calcular eficiencia (combinación de ocupación, costo y tiempo)
      const eficiencia = (
        (ocupacionEsperada / 100) * 0.5 + // 50% peso en ocupación
        (1 - Math.min(costoEsperado / 100, 1)) * 0.3 + // 30% peso en costo (inverso)
        (1 - Math.min(tiempoViajeEsperado / 60, 1)) * 0.2 // 20% peso en tiempo (inverso)
      ) * 100;

      return {
        eficiencia: parseFloat(eficiencia.toFixed(2)),
        ocupacionEsperada: parseFloat(ocupacionEsperada.toFixed(2)),
        costoEsperado: parseFloat(costoEsperado.toFixed(2)),
        tiempoViajeEsperado: parseFloat(tiempoViajeEsperado.toFixed(2)),
        promedioPasajeros: parseFloat(promedioPasajeros.toFixed(2)),
        viajesAnalizados: viajesSimilares.length
      };
    } catch (error) {
      throw new Error(`Error calculando métricas de eficiencia: ${error.message}`);
    }
  }

  /**
   * Genera sugerencias de horarios optimizados para múltiples rutas
   */
  async generateOptimalScheduleSuggestions(rutas = null, diasSemana = null, ocupacionObjetivo = 80) {
    try {
      // Obtener rutas únicas si no se especifican
      let rutasToProcess = rutas;
      if (!rutasToProcess || rutasToProcess.length === 0) {
        const viajes = await this.ViajeBus.distinct('ruta');
        rutasToProcess = viajes;
      }

      // Días de la semana por defecto (lunes a viernes)
      const diasDefault = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
      const diasToProcess = diasSemana || diasDefault;

      // Obtener buses activos
      const buses = await this.Bus.find({ estado: 'activo' }).lean();
      if (buses.length === 0) {
        throw new Error('No hay buses activos disponibles');
      }

      const capacidadPromedio = buses.reduce((sum, b) => sum + (b.capacidad_maxima || 50), 0) / buses.length;

      const suggestions = [];

      for (const ruta of rutasToProcess) {
        for (const diaSemana of diasToProcess) {
          try {
            // Generar horarios óptimos para esta ruta y día
            const optimalSchedule = await this.generateOptimalSchedule(
              ruta,
              diaSemana,
              capacidadPromedio,
              ocupacionObjetivo
            );

            // Para cada horario sugerido, calcular métricas y crear sugerencia
            for (const schedule of optimalSchedule.schedules) {
              const metrics = await this.calculateScheduleEfficiencyMetrics(
                ruta,
                schedule.horario_salida,
                diaSemana,
                capacidadPromedio
              );

              // Calcular impacto esperado
              const impactoEsperado = {
                aumento_pasajeros: schedule.ocupacion_esperada > 0 ? 
                  ((schedule.ocupacion_esperada - optimalSchedule.metrics.ocupacionPromedio) / optimalSchedule.metrics.ocupacionPromedio) * 100 : 0,
                reduccion_tiempo: 0, // Se calcularía comparando con tiempos históricos
                reduccion_costo: metrics.costoEsperado > 0 ? 
                  ((optimalSchedule.metrics.ocupacionPromedio / schedule.ocupacion_esperada) - 1) * 10 : 0,
                mejora_ocupacion: schedule.ocupacion_esperada - optimalSchedule.metrics.ocupacionPromedio
              };

              suggestions.push({
                ruta,
                dia_semana: diaSemana,
                horario_salida: schedule.horario_salida,
                horario_llegada: schedule.horario_llegada,
                tipo_sugerencia: 'horario',
                descripcion: `Horario optimizado para ${ruta} los ${diaSemana} a las ${schedule.horario_salida}`,
                razon: `Basado en análisis de demanda: ${schedule.demanda_esperada.toFixed(0)} pasajeros esperados, ocupación ${schedule.ocupacion_esperada.toFixed(1)}%`,
                prioridad: schedule.prioridad,
                impacto_esperado: impactoEsperado,
                metrics: {
                  eficiencia: metrics.eficiencia,
                  ocupacion_esperada: schedule.ocupacion_esperada,
                  demanda_esperada: schedule.demanda_esperada,
                  costo_esperado: metrics.costoEsperado,
                  tiempo_viaje_esperado: metrics.tiempoViajeEsperado
                },
                fuente: {
                  tipo: 'ml',
                  confianza: Math.min(metrics.eficiencia, 100)
                }
              });
            }
          } catch (error) {
            console.error(`Error procesando ${ruta} - ${diaSemana}: ${error.message}`);
            // Continuar con la siguiente combinación
          }
        }
      }

      // Ordenar por prioridad y eficiencia
      suggestions.sort((a, b) => {
        const prioridadOrder = { 'alta': 3, 'media': 2, 'baja': 1 };
        if (prioridadOrder[a.prioridad] !== prioridadOrder[b.prioridad]) {
          return prioridadOrder[b.prioridad] - prioridadOrder[a.prioridad];
        }
        return (b.metrics?.eficiencia || 0) - (a.metrics?.eficiencia || 0);
      });

      return {
        suggestions,
        total: suggestions.length,
        rutas: rutasToProcess.length,
        dias: diasToProcess.length,
        ocupacionObjetivo
      };
    } catch (error) {
      throw new Error(`Error generando sugerencias de horarios: ${error.message}`);
    }
  }

  /**
   * Guarda sugerencias en la base de datos
   */
  async saveSuggestions(suggestions, createdBy = 'system') {
    try {
      const { v4: uuidv4 } = require('uuid');
      const savedSuggestions = [];

      for (const suggestion of suggestions) {
        // Verificar si ya existe una sugerencia similar
        const existing = await this.SugerenciaBus.findOne({
          ruta: suggestion.ruta,
          dia_semana: suggestion.dia_semana,
          horario_salida: suggestion.horario_salida,
          estado: { $in: ['pendiente', 'aprobada'] }
        });

        if (!existing) {
          const nuevaSugerencia = new this.SugerenciaBus({
            _id: uuidv4(),
            bus_id: suggestion.bus_id || null,
            ruta: suggestion.ruta,
            horario_salida: suggestion.horario_salida,
            horario_llegada: suggestion.horario_llegada,
            dia_semana: suggestion.dia_semana,
            tipo_sugerencia: suggestion.tipo_sugerencia,
            descripcion: suggestion.descripcion,
            razon: suggestion.razon,
            prioridad: suggestion.prioridad,
            estado: 'pendiente',
            impacto_esperado: suggestion.impacto_esperado,
            fuente: suggestion.fuente,
            fecha_creacion: new Date(),
            fecha_actualizacion: new Date()
          });

          await nuevaSugerencia.save();
          savedSuggestions.push(nuevaSugerencia);
        }
      }

      return savedSuggestions;
    } catch (error) {
      throw new Error(`Error guardando sugerencias: ${error.message}`);
    }
  }
}

module.exports = BusScheduleOptimizer;

