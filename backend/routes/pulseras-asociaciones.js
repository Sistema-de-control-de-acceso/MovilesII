/**
 * Rutas para gestión de asociaciones pulsera-estudiante
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const PulseraAsociacion = require('../models/PulseraAsociacion');
const mongoose = require('mongoose');

// Obtener modelo de Alumno
let Alumno;
try {
  Alumno = mongoose.model('alumnos');
} catch {
  // Modelo se cargará más tarde
}

/**
 * POST /api/pulseras-asociaciones
 * Crear nueva asociación pulsera-estudiante
 */
router.post('/', async (req, res) => {
  try {
    const { pulsera_id, codigo_universitario, usuario } = req.body;

    // Validar campos requeridos
    if (!pulsera_id || !codigo_universitario) {
      return res.status(400).json({
        error: 'pulsera_id y codigo_universitario son requeridos'
      });
    }

    // Validar formato de pulsera_id
    if (!/^[0-9A-F:]+$/i.test(pulsera_id)) {
      return res.status(400).json({
        error: 'Formato de pulsera_id inválido. Debe ser hexadecimal (ej: 04:12:34:56)'
      });
    }

    // Verificar si la pulsera ya está asociada
    const pulseraExistente = await PulseraAsociacion.findOne({
      pulsera_id: pulsera_id,
      estado: { $in: ['activa', 'suspendida'] }
    });

    if (pulseraExistente) {
      return res.status(409).json({
        error: 'Esta pulsera ya está asociada a otro estudiante',
        asociacion_existente: {
          estudiante: pulseraExistente.estudiante,
          estado: pulseraExistente.estado,
          fecha_asociacion: pulseraExistente.fecha_asociacion
        }
      });
    }

    // Buscar estudiante en la base de datos
    if (!Alumno) {
      Alumno = mongoose.model('alumnos');
    }
    
    const estudiante = await Alumno.findOne({
      codigo_universitario: codigo_universitario,
      estado: true
    });

    if (!estudiante) {
      return res.status(404).json({
        error: 'Estudiante no encontrado o inactivo',
        codigo_universitario: codigo_universitario
      });
    }

    // Crear nueva asociación
    const asociacion = new PulseraAsociacion({
      _id: uuidv4(),
      pulsera_id: pulsera_id.toUpperCase(),
      estudiante_id: estudiante._id,
      estudiante: {
        codigo_universitario: estudiante.codigo_universitario,
        dni: estudiante.dni,
        nombre: estudiante.nombre,
        apellido: estudiante.apellido,
        facultad: estudiante.facultad,
        escuela: estudiante.escuela_profesional
      },
      estado: 'activa',
      fecha_asociacion: new Date(),
      fecha_activacion: new Date(),
      creado_por: {
        usuario_id: usuario?._id || 'system',
        usuario_nombre: usuario?.nombre || 'Sistema',
        fecha: new Date()
      },
      historial: [{
        accion: 'creacion',
        estado_nuevo: 'activa',
        usuario_id: usuario?._id || 'system',
        usuario_nombre: usuario?.nombre || 'Sistema',
        fecha: new Date()
      }]
    });

    await asociacion.save();

    res.status(201).json({
      success: true,
      message: 'Asociación creada exitosamente',
      asociacion: asociacion
    });

  } catch (error) {
    console.error('Error creando asociación:', error);
    res.status(500).json({
      error: 'Error creando asociación',
      details: error.message
    });
  }
});

/**
 * GET /api/pulseras-asociaciones
 * Listar todas las asociaciones con filtros opcionales
 */
router.get('/', async (req, res) => {
  try {
    const {
      estado,
      codigo_universitario,
      dni,
      facultad,
      page = 1,
      limit = 50
    } = req.query;

    // Construir query
    const query = {};
    
    if (estado) {
      query.estado = estado;
    }
    
    if (codigo_universitario) {
      query['estudiante.codigo_universitario'] = codigo_universitario;
    }
    
    if (dni) {
      query['estudiante.dni'] = dni;
    }
    
    if (facultad) {
      query['estudiante.facultad'] = facultad;
    }

    // Paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const asociaciones = await PulseraAsociacion.find(query)
      .sort({ fecha_asociacion: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await PulseraAsociacion.countDocuments(query);

    res.json({
      asociaciones,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error listando asociaciones:', error);
    res.status(500).json({
      error: 'Error listando asociaciones',
      details: error.message
    });
  }
});

/**
 * GET /api/pulseras-asociaciones/:pulsera_id
 * Obtener asociación por ID de pulsera
 */
router.get('/pulsera/:pulsera_id', async (req, res) => {
  try {
    const { pulsera_id } = req.params;
    
    const asociacion = await PulseraAsociacion.findOne({
      pulsera_id: pulsera_id.toUpperCase()
    });

    if (!asociacion) {
      return res.status(404).json({
        error: 'Pulsera no encontrada',
        pulsera_id: pulsera_id,
        sugerencia: 'Verificar que el ID de pulsera sea correcto y esté asociado'
      });
    }

    res.json({
      asociacion,
      activa: asociacion.estado === 'activa'
    });

  } catch (error) {
    console.error('Error buscando asociación:', error);
    res.status(500).json({
      error: 'Error buscando asociación',
      details: error.message
    });
  }
});

/**
 * GET /api/pulseras-asociaciones/estudiante/:codigo_universitario
 * Obtener asociaciones por código universitario
 */
router.get('/estudiante/:codigo_universitario', async (req, res) => {
  try {
    const { codigo_universitario } = req.params;
    
    const asociaciones = await PulseraAsociacion.find({
      'estudiante.codigo_universitario': codigo_universitario
    }).sort({ fecha_asociacion: -1 });

    if (asociaciones.length === 0) {
      return res.status(404).json({
        error: 'No se encontraron pulseras asociadas a este estudiante',
        codigo_universitario: codigo_universitario
      });
    }

    res.json({
      codigo_universitario,
      asociaciones,
      activa: asociaciones.find(a => a.estado === 'activa')
    });

  } catch (error) {
    console.error('Error buscando asociaciones:', error);
    res.status(500).json({
      error: 'Error buscando asociaciones',
      details: error.message
    });
  }
});

/**
 * PUT /api/pulseras-asociaciones/:id
 * Actualizar asociación
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, motivo, usuario } = req.body;

    const asociacion = await PulseraAsociacion.findById(id);

    if (!asociacion) {
      return res.status(404).json({
        error: 'Asociación no encontrada'
      });
    }

    const estadoAnterior = asociacion.estado;

    // Actualizar campos
    if (estado) {
      if (estado === 'inactiva' && asociacion.estado !== 'inactiva') {
        asociacion.desactivar({
          _id: usuario?._id || 'system',
          nombre: usuario?.nombre || 'Sistema'
        }, motivo || 'Sin motivo especificado');
      } else if (estado === 'activa' && asociacion.estado !== 'activa') {
        asociacion.activar({
          _id: usuario?._id || 'system',
          nombre: usuario?.nombre || 'Sistema'
        });
      } else if (estado === 'perdida') {
        asociacion.reportarPerdida({
          _id: usuario?._id || 'system',
          nombre: usuario?.nombre || 'Sistema'
        });
      } else {
        asociacion.estado = estado;
      }
    }

    await asociacion.save();

    res.json({
      success: true,
      message: 'Asociación actualizada exitosamente',
      asociacion,
      cambio: {
        estado_anterior: estadoAnterior,
        estado_nuevo: asociacion.estado
      }
    });

  } catch (error) {
    console.error('Error actualizando asociación:', error);
    res.status(500).json({
      error: 'Error actualizando asociación',
      details: error.message
    });
  }
});

/**
 * DELETE /api/pulseras-asociaciones/:id
 * Eliminar asociación (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario } = req.body;

    const asociacion = await PulseraAsociacion.findById(id);

    if (!asociacion) {
      return res.status(404).json({
        error: 'Asociación no encontrada'
      });
    }

    // Soft delete: desactivar en lugar de eliminar
    asociacion.desactivar({
      _id: usuario?._id || 'system',
      nombre: usuario?.nombre || 'Sistema'
    }, 'Eliminada por usuario');

    await asociacion.save();

    res.json({
      success: true,
      message: 'Asociación eliminada exitosamente',
      asociacion
    });

  } catch (error) {
    console.error('Error eliminando asociación:', error);
    res.status(500).json({
      error: 'Error eliminando asociación',
      details: error.message
    });
  }
});

/**
 * POST /api/pulseras-asociaciones/verificar
 * Verificar si una pulsera está asociada y activa
 */
router.post('/verificar', async (req, res) => {
  try {
    const { pulsera_id } = req.body;

    if (!pulsera_id) {
      return res.status(400).json({
        error: 'pulsera_id es requerido'
      });
    }

    const asociacion = await PulseraAsociacion.buscarPorPulseraId(pulsera_id.toUpperCase());

    if (!asociacion) {
      return res.status(404).json({
        encontrado: false,
        error: 'Pulsera no encontrada o no activa',
        pulsera_id: pulsera_id,
        accion_recomendada: 'Asociar pulsera a un estudiante'
      });
    }

    // Registrar lectura
    asociacion.registrarLectura();
    await asociacion.save();

    res.json({
      encontrado: true,
      asociacion: {
        estudiante: asociacion.estudiante,
        estado: asociacion.estado,
        fecha_asociacion: asociacion.fecha_asociacion,
        contador_lecturas: asociacion.contador_lecturas
      }
    });

  } catch (error) {
    console.error('Error verificando asociación:', error);
    res.status(500).json({
      error: 'Error verificando asociación',
      details: error.message
    });
  }
});

/**
 * GET /api/pulseras-asociaciones/stats
 * Obtener estadísticas de asociaciones
 */
router.get('/stats/general', async (req, res) => {
  try {
    const total = await PulseraAsociacion.countDocuments();
    const activas = await PulseraAsociacion.countDocuments({ estado: 'activa' });
    const inactivas = await PulseraAsociacion.countDocuments({ estado: 'inactiva' });
    const suspendidas = await PulseraAsociacion.countDocuments({ estado: 'suspendida' });
    const perdidas = await PulseraAsociacion.countDocuments({ estado: 'perdida' });

    res.json({
      total,
      por_estado: {
        activas,
        inactivas,
        suspendidas,
        perdidas
      },
      porcentaje_activas: total > 0 ? (activas / total * 100).toFixed(2) : 0
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      error: 'Error obteniendo estadísticas',
      details: error.message
    });
  }
});

module.exports = router;

