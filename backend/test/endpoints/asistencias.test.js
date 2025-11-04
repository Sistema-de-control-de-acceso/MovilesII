const request = require('supertest');
const mongoose = require('mongoose');
// Necesitamos crear un wrapper para el app ya que index.js no lo exporta
// Por ahora, crearemos la app directamente para tests
const express = require('express');
const app = express();
app.use(express.json());

// Importar los modelos necesarios
const Asistencia = require('../../models/Asistencia');
const Presencia = require('../../models/Presencia');

// Mock de los endpoints que necesitamos testear
// En producción, estos endpoints están en index.js
app.post('/asistencias/completa', async (req, res) => {
  try {
    const asistencia = new Asistencia(req.body);
    await asistencia.save();
    res.status(201).json(asistencia);
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar asistencia completa', details: err.message });
  }
});

app.get('/asistencias/ultimo-acceso/:dni', async (req, res) => {
  try {
    const { dni } = req.params;
    const presenciaActual = await Presencia.findOne({ estudiante_dni: dni, esta_dentro: true });
    
    if (presenciaActual) {
      return res.json({ 
        ultimo_tipo: 'entrada',
        esta_dentro: true,
        hora_entrada: presenciaActual.hora_entrada,
        punto_entrada: presenciaActual.punto_entrada,
        fuente: 'presencia'
      });
    }
    
    const ultimaAsistencia = await Asistencia.findOne({ dni }).sort({ fecha_hora: -1 });
    
    if (ultimaAsistencia) {
      return res.json({ 
        ultimo_tipo: ultimaAsistencia.tipo,
        esta_dentro: ultimaAsistencia.tipo === 'entrada',
        ultima_fecha: ultimaAsistencia.fecha_hora,
        fuente: 'asistencias'
      });
    }
    
    res.json({ 
      ultimo_tipo: 'salida',
      esta_dentro: false,
      ultima_fecha: null,
      fuente: 'sin_registros'
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al determinar último acceso', details: err.message });
  }
});

app.post('/asistencias/validar-movimiento', async (req, res) => {
  try {
    const { dni, tipo, fecha_hora } = req.body;
    
    if (!dni || !tipo || !fecha_hora) {
      return res.status(400).json({ 
        error: 'Faltan parámetros requeridos: dni, tipo, fecha_hora' 
      });
    }

    const fechaMovimiento = new Date(fecha_hora);
    const presenciaActual = await Presencia.findOne({ estudiante_dni: dni, esta_dentro: true });
    
    if (presenciaActual) {
      if (tipo === 'entrada') {
        return res.json({
          es_valido: false,
          tipo_sugerido: 'salida',
          motivo: 'El estudiante ya se encuentra registrado dentro del campus. No se puede registrar otra entrada.',
          requiere_autorizacion_manual: true,
          presencia_actual: {
            hora_entrada: presenciaActual.hora_entrada,
            punto_entrada: presenciaActual.punto_entrada
          }
        });
      }
      if (fechaMovimiento < presenciaActual.hora_entrada) {
        return res.json({
          es_valido: false,
          tipo_sugerido: 'salida',
          motivo: 'La fecha/hora de salida no puede ser anterior a la hora de entrada',
          requiere_autorizacion_manual: true
        });
      }
    } else {
      if (tipo === 'salida') {
        return res.json({
          es_valido: false,
          tipo_sugerido: 'entrada',
          motivo: 'No se puede registrar salida sin registro previo de entrada',
          requiere_autorizacion_manual: true
        });
      }
    }

    const ultimaAsistencia = await Asistencia.findOne({ dni }).sort({ fecha_hora: -1 });
    
    if (ultimaAsistencia) {
      if (fechaMovimiento < ultimaAsistencia.fecha_hora) {
        return res.json({
          es_valido: false,
          tipo_sugerido: ultimaAsistencia.tipo === 'entrada' ? 'salida' : 'entrada',
          motivo: 'La fecha/hora del movimiento es anterior al último registro',
          requiere_autorizacion_manual: true,
          ultimo_registro: {
            tipo: ultimaAsistencia.tipo,
            fecha_hora: ultimaAsistencia.fecha_hora
          }
        });
      }

      if (ultimaAsistencia.tipo === tipo) {
        const tipoEsperado = ultimaAsistencia.tipo === 'entrada' ? 'salida' : 'entrada';
        return res.json({
          es_valido: false,
          tipo_sugerido: tipoEsperado,
          motivo: `El último movimiento fue ${ultimaAsistencia.tipo}. El siguiente debe ser ${tipoEsperado}`,
          requiere_autorizacion_manual: true
        });
      }

      const diferencia = fechaMovimiento.getTime() - ultimaAsistencia.fecha_hora.getTime();
      if (diferencia < 30000) {
        return res.json({
          es_valido: false,
          tipo_sugerido: tipo,
          motivo: 'Movimiento registrado muy rápido después del anterior. Esperar al menos 30 segundos',
          requiere_autorizacion_manual: false,
          diferencia_segundos: Math.floor(diferencia / 1000)
        });
      }
    }

    return res.json({
      es_valido: true,
      tipo_sugerido: tipo,
      motivo: null,
      requiere_autorizacion_manual: false,
      estado_presencia: presenciaActual ? 'dentro' : 'fuera'
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al validar movimiento',
      details: err.message 
    });
  }
});

app.get('/asistencias/estudiantes-en-campus', async (req, res) => {
  try {
    const presenciasActivas = await Presencia.find({ esta_dentro: true })
      .sort({ hora_entrada: -1 });
    
    const estudiantesEnCampus = [];
    const estudiantesPorFacultad = {};

    for (const presencia of presenciasActivas) {
      const ahora = new Date();
      const tiempoEnCampus = ahora - presencia.hora_entrada;
      const horas = Math.floor(tiempoEnCampus / (1000 * 60 * 60));
      const minutos = Math.floor((tiempoEnCampus % (1000 * 60 * 60)) / (1000 * 60));
      
      estudiantesEnCampus.push({
        dni: presencia.estudiante_dni,
        estudiante_id: presencia.estudiante_id,
        nombre: presencia.estudiante_nombre,
        facultad: presencia.facultad,
        escuela: presencia.escuela,
        hora_entrada: presencia.hora_entrada,
        punto_entrada: presencia.punto_entrada,
        guardia_entrada: presencia.guardia_entrada,
        tiempo_en_campus_minutos: Math.floor(tiempoEnCampus / (1000 * 60)),
        tiempo_en_campus_formateado: `${horas}h ${minutos}m`
      });

      const facultad = presencia.facultad || 'N/A';
      estudiantesPorFacultad[facultad] = (estudiantesPorFacultad[facultad] || 0) + 1;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    const asistenciasHoy = await Asistencia.countDocuments({
      fecha_hora: { $gte: hoy, $lt: mañana }
    });

    const entradasHoy = await Asistencia.countDocuments({
      fecha_hora: { $gte: hoy, $lt: mañana },
      tipo: 'entrada'
    });

    const salidasHoy = await Asistencia.countDocuments({
      fecha_hora: { $gte: hoy, $lt: mañana },
      tipo: 'salida'
    });

    res.json({
      success: true,
      total_estudiantes_en_campus: estudiantesEnCampus.length,
      estudiantes: estudiantesEnCampus,
      por_facultad: estudiantesPorFacultad,
      estadisticas_hoy: {
        total_asistencias: asistenciasHoy,
        entradas: entradasHoy,
        salidas: salidasHoy,
        fecha: hoy.toISOString().split('T')[0]
      },
      ultima_actualizacion: new Date()
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al calcular estudiantes en campus',
      details: err.message 
    });
  }
});

app.get('/asistencias/esta-en-campus/:dni', async (req, res) => {
  try {
    const { dni } = req.params;
    const presencia = await Presencia.findOne({ estudiante_dni: dni, esta_dentro: true });
    
    if (presencia) {
      const ahora = new Date();
      const tiempoEnCampus = ahora - presencia.hora_entrada;
      
      return res.json({
        esta_en_campus: true,
        hora_entrada: presencia.hora_entrada,
        punto_entrada: presencia.punto_entrada,
        tiempo_en_campus_minutos: Math.floor(tiempoEnCampus / (1000 * 60)),
        fuente: 'presencia'
      });
    }
    
    const ultimaAsistencia = await Asistencia.findOne({ dni }).sort({ fecha_hora: -1 });
    const estaDentro = ultimaAsistencia && ultimaAsistencia.tipo === 'entrada';
    
    res.json({
      esta_en_campus: estaDentro,
      ultima_asistencia: ultimaAsistencia,
      fuente: 'asistencias'
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al verificar presencia', details: err.message });
  }
});

const { mockAsistencia, mockPresencia, mockEstudiante } = require('../utils/mocks');

describe('Endpoints de Asistencias', () => {
  beforeEach(async () => {
    // Limpiar colecciones antes de cada test
    await Asistencia.deleteMany({});
    await Presencia.deleteMany({});
  });

  describe('POST /asistencias/completa', () => {
    it('debe crear una asistencia completa correctamente', async () => {
      const asistenciaData = mockAsistencia({
        _id: undefined, // Dejar que MongoDB genere el ID
      });

      const response = await request(app)
        .post('/asistencias/completa')
        .send(asistenciaData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.dni).toBe(asistenciaData.dni);
      expect(response.body.tipo).toBe(asistenciaData.tipo);
    });

    it('debe validar campos requeridos', async () => {
      const response = await request(app)
        .post('/asistencias/completa')
        .send({ dni: '12345678' }) // Falta otros campos
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /asistencias/ultimo-acceso/:dni', () => {
    it('debe retornar último acceso cuando hay presencia activa', async () => {
      const presencia = mockPresencia({ esta_dentro: true });
      await Presencia.create(presencia);

      const response = await request(app)
        .get(`/asistencias/ultimo-acceso/${presencia.estudiante_dni}`)
        .expect(200);

      expect(response.body.ultimo_tipo).toBe('entrada');
      expect(response.body.esta_dentro).toBe(true);
      expect(response.body.fuente).toBe('presencia');
    });

    it('debe retornar último acceso desde asistencias si no hay presencia', async () => {
      const asistencia = mockAsistencia({ tipo: 'salida' });
      await Asistencia.create(asistencia);

      const response = await request(app)
        .get(`/asistencias/ultimo-acceso/${asistencia.dni}`)
        .expect(200);

      expect(response.body.ultimo_tipo).toBe('salida');
      expect(response.body.esta_dentro).toBe(false);
      expect(response.body.fuente).toBe('asistencias');
    });

    it('debe retornar salida como default si no hay registros', async () => {
      const response = await request(app)
        .get('/asistencias/ultimo-acceso/99999999')
        .expect(200);

      expect(response.body.ultimo_tipo).toBe('salida');
      expect(response.body.fuente).toBe('sin_registros');
    });
  });

  describe('POST /asistencias/validar-movimiento', () => {
    it('debe validar entrada cuando estudiante no está dentro', async () => {
      const response = await request(app)
        .post('/asistencias/validar-movimiento')
        .send({
          dni: '12345678',
          tipo: 'entrada',
          fecha_hora: new Date().toISOString(),
        })
        .expect(200);

      expect(response.body.es_valido).toBe(true);
      expect(response.body.tipo_sugerido).toBe('entrada');
    });

    it('debe rechazar entrada cuando estudiante ya está dentro', async () => {
      const presencia = mockPresencia({ esta_dentro: true });
      await Presencia.create(presencia);

      const response = await request(app)
        .post('/asistencias/validar-movimiento')
        .send({
          dni: presencia.estudiante_dni,
          tipo: 'entrada',
          fecha_hora: new Date().toISOString(),
        })
        .expect(200);

      expect(response.body.es_valido).toBe(false);
      expect(response.body.tipo_sugerido).toBe('salida');
      expect(response.body.requiere_autorizacion_manual).toBe(true);
    });

    it('debe rechazar salida cuando estudiante no está dentro', async () => {
      const response = await request(app)
        .post('/asistencias/validar-movimiento')
        .send({
          dni: '12345678',
          tipo: 'salida',
          fecha_hora: new Date().toISOString(),
        })
        .expect(200);

      expect(response.body.es_valido).toBe(false);
      expect(response.body.tipo_sugerido).toBe('entrada');
    });

    it('debe validar parámetros requeridos', async () => {
      const response = await request(app)
        .post('/asistencias/validar-movimiento')
        .send({
          dni: '12345678',
          // Falta tipo y fecha_hora
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('debe rechazar movimientos con fecha anterior', async () => {
      const fechaAnterior = new Date('2024-01-01');
      const fechaPosterior = new Date('2024-01-02');
      const asistencia = mockAsistencia({
        fecha_hora: fechaPosterior,
        tipo: 'entrada',
      });
      await Asistencia.create(asistencia);

      const response = await request(app)
        .post('/asistencias/validar-movimiento')
        .send({
          dni: asistencia.dni,
          tipo: 'salida',
          fecha_hora: fechaAnterior.toISOString(),
        })
        .expect(200);

      expect(response.body.es_valido).toBe(false);
      expect(response.body.motivo).toContain('anterior');
    });
  });

  describe('GET /asistencias/estudiantes-en-campus', () => {
    it('debe retornar lista de estudiantes en campus', async () => {
      const presencia1 = mockPresencia({
        estudiante_dni: '11111111',
        esta_dentro: true,
      });
      const presencia2 = mockPresencia({
        estudiante_dni: '22222222',
        esta_dentro: true,
      });
      await Presencia.create([presencia1, presencia2]);

      const response = await request(app)
        .get('/asistencias/estudiantes-en-campus')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.total_estudiantes_en_campus).toBe(2);
      expect(response.body.estudiantes).toHaveLength(2);
      expect(response.body).toHaveProperty('estadisticas_hoy');
    });

    it('debe retornar 0 estudiantes cuando no hay nadie en campus', async () => {
      const response = await request(app)
        .get('/asistencias/estudiantes-en-campus')
        .expect(200);

      expect(response.body.total_estudiantes_en_campus).toBe(0);
      expect(response.body.estudiantes).toHaveLength(0);
    });
  });

  describe('GET /asistencias/esta-en-campus/:dni', () => {
    it('debe retornar true cuando estudiante está en campus', async () => {
      const presencia = mockPresencia({ esta_dentro: true });
      await Presencia.create(presencia);

      const response = await request(app)
        .get(`/asistencias/esta-en-campus/${presencia.estudiante_dni}`)
        .expect(200);

      expect(response.body.esta_en_campus).toBe(true);
      expect(response.body.fuente).toBe('presencia');
    });

    it('debe retornar false cuando estudiante no está en campus', async () => {
      const response = await request(app)
        .get('/asistencias/esta-en-campus/99999999')
        .expect(200);

      expect(response.body.esta_en_campus).toBe(false);
    });
  });
});

