/**
 * Servicio de Validación de Consistencia de Datos
 * Valida integridad referencial y consistencia de datos
 */

class DataValidationService {
  constructor(EventoModel, AsistenciaModel, PresenciaModel, DecisionManualModel, UserModel, AlumnoModel) {
    this.Evento = EventoModel;
    this.Asistencia = AsistenciaModel;
    this.Presencia = PresenciaModel;
    this.DecisionManual = DecisionManualModel;
    this.User = UserModel;
    this.Alumno = AlumnoModel;
  }

  /**
   * Valida integridad referencial de eventos
   */
  async validateEventReferentialIntegrity(eventId = null) {
    try {
      const query = eventId ? { _id: eventId } : {};
      const eventos = await this.Evento.find(query).lean();

      const results = {
        total: eventos.length,
        valid: 0,
        invalid: 0,
        errors: []
      };

      for (const evento of eventos) {
        const validation = await this.validateSingleEvent(evento);
        
        if (validation.valid) {
          results.valid++;
        } else {
          results.invalid++;
          results.errors.push({
            evento_id: evento._id,
            errors: validation.errors
          });

          // Actualizar evento con errores
          await this.Evento.updateOne(
            { _id: evento._id },
            {
              $set: {
                'referential_integrity.validation_errors': validation.errors,
                'referential_integrity.validated_at': new Date()
              }
            }
          );
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Error validando integridad referencial: ${error.message}`);
    }
  }

  /**
   * Valida un evento individual
   */
  async validateSingleEvent(evento) {
    const errors = [];

    // Validar estudiante
    if (evento.estudiante_id) {
      try {
        const estudiante = await this.Alumno.findById(evento.estudiante_id);
        if (!estudiante) {
          errors.push(`Estudiante ${evento.estudiante_id} no encontrado`);
        } else if (estudiante.dni !== evento.estudiante_dni) {
          errors.push(`DNI del estudiante no coincide: esperado ${estudiante.dni}, encontrado ${evento.estudiante_dni}`);
        }
      } catch (error) {
        errors.push(`Error validando estudiante: ${error.message}`);
      }
    }

    // Validar guardia
    if (evento.guardia_id) {
      try {
        const guardia = await this.User.findById(evento.guardia_id);
        if (!guardia) {
          errors.push(`Guardia ${evento.guardia_id} no encontrado`);
        } else if (guardia.rango !== 'guardia') {
          errors.push(`Usuario ${evento.guardia_id} no es un guardia (rango: ${guardia.rango})`);
        }
      } catch (error) {
        errors.push(`Error validando guardia: ${error.message}`);
      }
    }

    // Validar fecha y hora
    if (evento.fecha && evento.hora) {
      try {
        const fechaHora = new Date(`${evento.fecha.toISOString().split('T')[0]}T${evento.hora}`);
        if (isNaN(fechaHora.getTime())) {
          errors.push('Fecha y hora no son válidas');
        }
      } catch (error) {
        errors.push(`Error validando fecha/hora: ${error.message}`);
      }
    }

    // Validar timestamp
    if (evento.timestamp && evento.fecha) {
      const diff = Math.abs(evento.timestamp.getTime() - evento.fecha.getTime());
      if (diff > 24 * 60 * 60 * 1000) {
        errors.push('Timestamp y fecha no son consistentes (diferencia > 24 horas)');
      }
    }

    // Validar referencias a otros registros
    if (evento.asistencia_id) {
      try {
        const asistencia = await this.Asistencia.findById(evento.asistencia_id);
        if (!asistencia) {
          errors.push(`Asistencia ${evento.asistencia_id} referenciada no encontrada`);
        }
      } catch (error) {
        errors.push(`Error validando asistencia: ${error.message}`);
      }
    }

    if (evento.presencia_id) {
      try {
        const presencia = await this.Presencia.findById(evento.presencia_id);
        if (!presencia) {
          errors.push(`Presencia ${evento.presencia_id} referenciada no encontrada`);
        }
      } catch (error) {
        errors.push(`Error validando presencia: ${error.message}`);
      }
    }

    if (evento.decision_manual_id) {
      try {
        const decision = await this.DecisionManual.findById(evento.decision_manual_id);
        if (!decision) {
          errors.push(`Decisión manual ${evento.decision_manual_id} referenciada no encontrada`);
        }
      } catch (error) {
        errors.push(`Error validando decisión manual: ${error.message}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida consistencia de datos entre colecciones
   */
  async validateDataConsistency() {
    try {
      const results = {
        asistencias_sin_evento: [],
        decisiones_sin_evento: [],
        eventos_huérfanos: [],
        inconsistencias_fecha: []
      };

      // Verificar asistencias sin evento
      const asistencias = await this.Asistencia.find({}).lean();
      for (const asistencia of asistencias) {
        const evento = await this.Evento.findOne({ asistencia_id: asistencia._id });
        if (!evento) {
          results.asistencias_sin_evento.push(asistencia._id);
        }
      }

      // Verificar decisiones sin evento
      const decisiones = await this.DecisionManual.find({}).lean();
      for (const decision of decisiones) {
        const evento = await this.Evento.findOne({ decision_manual_id: decision._id });
        if (!evento) {
          results.decisiones_sin_evento.push(decision._id);
        }
      }

      // Verificar eventos con referencias inválidas
      const eventos = await this.Evento.find({
        $or: [
          { asistencia_id: { $exists: true, $ne: null } },
          { presencia_id: { $exists: true, $ne: null } },
          { decision_manual_id: { $exists: true, $ne: null } }
        ]
      }).lean();

      for (const evento of eventos) {
        if (evento.asistencia_id) {
          const asistencia = await this.Asistencia.findById(evento.asistencia_id);
          if (!asistencia) {
            results.eventos_huérfanos.push({
              evento_id: evento._id,
              tipo: 'asistencia',
              referencia: evento.asistencia_id
            });
          }
        }

        if (evento.presencia_id) {
          const presencia = await this.Presencia.findById(evento.presencia_id);
          if (!presencia) {
            results.eventos_huérfanos.push({
              evento_id: evento._id,
              tipo: 'presencia',
              referencia: evento.presencia_id
            });
          }
        }

        if (evento.decision_manual_id) {
          const decision = await this.DecisionManual.findById(evento.decision_manual_id);
          if (!decision) {
            results.eventos_huérfanos.push({
              evento_id: evento._id,
              tipo: 'decision_manual',
              referencia: evento.decision_manual_id
            });
          }
        }
      }

      // Verificar inconsistencias de fecha
      const eventosConFecha = await this.Evento.find({
        fecha: { $exists: true },
        timestamp: { $exists: true }
      }).lean();

      for (const evento of eventosConFecha) {
        const diff = Math.abs(evento.timestamp.getTime() - evento.fecha.getTime());
        if (diff > 24 * 60 * 60 * 1000) {
          results.inconsistencias_fecha.push({
            evento_id: evento._id,
            diferencia_horas: diff / (60 * 60 * 1000)
          });
        }
      }

      return {
        valid: 
          results.asistencias_sin_evento.length === 0 &&
          results.decisiones_sin_evento.length === 0 &&
          results.eventos_huérfanos.length === 0 &&
          results.inconsistencias_fecha.length === 0,
        results,
        summary: {
          total_asistencias_sin_evento: results.asistencias_sin_evento.length,
          total_decisiones_sin_evento: results.decisiones_sin_evento.length,
          total_eventos_huérfanos: results.eventos_huérfanos.length,
          total_inconsistencias_fecha: results.inconsistencias_fecha.length
        }
      };
    } catch (error) {
      throw new Error(`Error validando consistencia de datos: ${error.message}`);
    }
  }

  /**
   * Repara inconsistencias encontradas
   */
  async repairInconsistencies(options = {}) {
    try {
      const {
        createMissingEvents = true,
        fixOrphanEvents = true,
        fixDateInconsistencies = true
      } = options;

      const repaired = {
        eventos_creados: 0,
        eventos_eliminados: 0,
        eventos_corregidos: 0
      };

      // Crear eventos faltantes para asistencias
      if (createMissingEvents) {
        const asistencias = await this.Asistencia.find({}).lean();
        for (const asistencia of asistencias) {
          const eventoExistente = await this.Evento.findOne({ asistencia_id: asistencia._id });
          if (!eventoExistente) {
            try {
              await this.Evento.createFromAsistencia(asistencia);
              repaired.eventos_creados++;
            } catch (error) {
              console.error(`Error creando evento para asistencia ${asistencia._id}:`, error);
            }
          }
        }

        // Crear eventos faltantes para decisiones
        const decisiones = await this.DecisionManual.find({}).lean();
        for (const decision of decisiones) {
          const eventoExistente = await this.Evento.findOne({ decision_manual_id: decision._id });
          if (!eventoExistente) {
            try {
              await this.Evento.createFromDecisionManual(decision);
              repaired.eventos_creados++;
            } catch (error) {
              console.error(`Error creando evento para decisión ${decision._id}:`, error);
            }
          }
        }
      }

      // Eliminar eventos huérfanos
      if (fixOrphanEvents) {
        const validation = await this.validateDataConsistency();
        for (const orphan of validation.results.eventos_huérfanos) {
          try {
            await this.Evento.deleteOne({ _id: orphan.evento_id });
            repaired.eventos_eliminados++;
          } catch (error) {
            console.error(`Error eliminando evento huérfano ${orphan.evento_id}:`, error);
          }
        }
      }

      // Corregir inconsistencias de fecha
      if (fixDateInconsistencies) {
        const validation = await this.validateDataConsistency();
        for (const inconsistency of validation.results.inconsistencias_fecha) {
          try {
            const evento = await this.Evento.findById(inconsistency.evento_id);
            if (evento) {
              // Ajustar fecha para que coincida con timestamp
              evento.fecha = evento.timestamp;
              await evento.save();
              repaired.eventos_corregidos++;
            }
          } catch (error) {
            console.error(`Error corrigiendo evento ${inconsistency.evento_id}:`, error);
          }
        }
      }

      return repaired;
    } catch (error) {
      throw new Error(`Error reparando inconsistencias: ${error.message}`);
    }
  }
}

module.exports = DataValidationService;

