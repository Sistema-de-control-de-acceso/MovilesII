/**
 * Servicio de Auditoría - Triggers y registro de cambios
 * Registra todos los cambios en eventos para auditoría completa
 */

const mongoose = require('mongoose');

class AuditService {
  constructor(EventoModel) {
    this.Evento = EventoModel;
    this.auditLog = [];
  }

  /**
   * Registra un evento de auditoría
   */
  async logEvent(eventData) {
    try {
      const {
        estudiante_id,
        estudiante_dni,
        estudiante_nombre,
        guardia_id,
        guardia_nombre,
        decision,
        tipo_evento,
        razon,
        metadata = {}
      } = eventData;

      const evento = new this.Evento({
        _id: require('uuid').v4(),
        estudiante_id,
        estudiante_dni,
        estudiante_nombre,
        guardia_id,
        guardia_nombre,
        fecha: new Date(),
        hora: new Date().toTimeString().split(' ')[0],
        timestamp: new Date(),
        decision: decision || 'pendiente',
        tipo_evento: tipo_evento || 'otro',
        razon,
        ...metadata,
        created_by: guardia_id,
        updated_by: guardia_id
      });

      // Validar integridad referencial antes de guardar
      await evento.validateReferentialIntegrity();

      const saved = await evento.save();
      
      // Registrar en log en memoria (para debugging)
      this.auditLog.push({
        id: saved._id,
        timestamp: saved.timestamp,
        estudiante: estudiante_nombre,
        guardia: guardia_nombre,
        decision
      });

      return saved;
    } catch (error) {
      console.error('Error registrando evento de auditoría:', error);
      throw error;
    }
  }

  /**
   * Crea un trigger de auditoría para un modelo
   */
  setupAuditTriggers(Model, collectionName) {
    // Pre-save hook
    Model.schema.pre('save', async function(next) {
      try {
        // Si es un modelo de asistencia, crear evento
        if (collectionName === 'asistencias') {
          const AuditService = require('./audit_service');
          const Evento = require('../models/Evento');
          const auditService = new AuditService(Evento);
          
          await auditService.logEvent({
            estudiante_id: this.codigo_universitario || this.dni,
            estudiante_dni: this.dni,
            estudiante_nombre: `${this.nombre} ${this.apellido}`,
            guardia_id: this.guardia_id,
            guardia_nombre: this.guardia_nombre,
            decision: this.autorizacion_manual ? 'autorizado' : 'pendiente',
            tipo_evento: 'entrada',
            razon: this.razon_decision,
            metadata: {
              asistencia_id: this._id,
              punto_control_id: this.punto_control_id,
              autorizacion_manual: this.autorizacion_manual
            }
          });
        }
        
        next();
      } catch (error) {
        console.error('Error en trigger de auditoría:', error);
        // No bloquear el guardado si falla la auditoría
        next();
      }
    });

    // Post-save hook
    Model.schema.post('save', async function(doc) {
      try {
        // Registrar evento post-guardado si es necesario
        console.log(`Registro guardado en ${collectionName}:`, doc._id);
      } catch (error) {
        console.error('Error en post-save hook:', error);
      }
    });

    // Pre-remove hook
    Model.schema.pre('remove', async function(next) {
      try {
        // Registrar evento de eliminación
        const AuditService = require('./audit_service');
        const Evento = require('../models/Evento');
        const auditService = new AuditService(Evento);
        
        await auditService.logEvent({
          estudiante_id: this.codigo_universitario || this.dni || this.estudiante_id,
          estudiante_dni: this.dni || this.estudiante_dni,
          estudiante_nombre: this.nombre || this.estudiante_nombre,
          guardia_id: this.guardia_id || 'system',
          guardia_nombre: this.guardia_nombre || 'Sistema',
          decision: 'eliminado',
          tipo_evento: 'eliminacion',
          razon: 'Registro eliminado',
          metadata: {
            registro_id: this._id,
            collection: collectionName
          }
        });
        
        next();
      } catch (error) {
        console.error('Error en pre-remove hook:', error);
        next();
      }
    });
  }

  /**
   * Obtiene eventos de auditoría por criterios
   */
  async getAuditEvents(filters = {}) {
    try {
      const {
        estudiante_id,
        guardia_id,
        decision,
        tipo_evento,
        start_date,
        end_date,
        limit = 100,
        skip = 0
      } = filters;

      const query = {};

      if (estudiante_id) query.estudiante_id = estudiante_id;
      if (guardia_id) query.guardia_id = guardia_id;
      if (decision) query.decision = decision;
      if (tipo_evento) query.tipo_evento = tipo_evento;
      if (start_date || end_date) {
        query.timestamp = {};
        if (start_date) query.timestamp.$gte = new Date(start_date);
        if (end_date) query.timestamp.$lte = new Date(end_date);
      }

      const eventos = await this.Evento.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      const total = await this.Evento.countDocuments(query);

      return {
        eventos,
        total,
        limit,
        skip
      };
    } catch (error) {
      throw new Error(`Error obteniendo eventos de auditoría: ${error.message}`);
    }
  }

  /**
   * Valida integridad de eventos
   */
  async validateEventIntegrity(eventId) {
    try {
      const evento = await this.Evento.findById(eventId);
      if (!evento) {
        throw new Error('Evento no encontrado');
      }

      await evento.validateReferentialIntegrity();
      await evento.save();

      return {
        valid: evento.referential_integrity.validation_errors.length === 0,
        errors: evento.referential_integrity.validation_errors,
        estudiante_exists: evento.referential_integrity.estudiante_exists,
        guardia_exists: evento.referential_integrity.guardia_exists
      };
    } catch (error) {
      throw new Error(`Error validando integridad: ${error.message}`);
    }
  }

  /**
   * Obtiene estadísticas de auditoría
   */
  async getAuditStatistics(startDate, endDate) {
    try {
      const query = {
        timestamp: {
          $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          $lte: endDate || new Date()
        }
      };

      const stats = await this.Evento.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            total_eventos: { $sum: 1 },
            por_decision: {
              $push: '$decision'
            },
            por_tipo: {
              $push: '$tipo_evento'
            },
            por_guardia: {
              $push: '$guardia_id'
            }
          }
        }
      ]);

      if (stats.length === 0) {
        return {
          total_eventos: 0,
          por_decision: {},
          por_tipo: {},
          por_guardia: {},
          eventos_con_errores: 0
        };
      }

      const stat = stats[0];
      
      // Contar por decisión
      const porDecision = {};
      stat.por_decision.forEach(d => {
        porDecision[d] = (porDecision[d] || 0) + 1;
      });

      // Contar por tipo
      const porTipo = {};
      stat.por_tipo.forEach(t => {
        porTipo[t] = (porTipo[t] || 0) + 1;
      });

      // Contar por guardia
      const porGuardia = {};
      stat.por_guardia.forEach(g => {
        porGuardia[g] = (porGuardia[g] || 0) + 1;
      });

      // Contar eventos con errores de integridad
      const eventosConErrores = await this.Evento.countDocuments({
        ...query,
        'referential_integrity.validation_errors': { $exists: true, $ne: [] }
      });

      return {
        total_eventos: stat.total_eventos,
        por_decision: porDecision,
        por_tipo: porTipo,
        por_guardia: porGuardia,
        eventos_con_errores
      };
    } catch (error) {
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }
  }
}

module.exports = AuditService;

