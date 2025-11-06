/**
 * Tests para endpoints de puntos de control con ubicación
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  
  // Crear app de prueba
  const express = require('express');
  app = express();
  app.use(express.json());
  
  // Importar modelos
  const PuntoControl = require('../../models/PuntoControl');
  const Asistencia = require('../../models/Asistencia');
  
  // Mock endpoints básicos
  app.post('/puntos-control', async (req, res) => {
    try {
      const punto = new PuntoControl(req.body);
      await punto.save();
      res.status(201).json(punto);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  app.get('/puntos-control/mapa', async (req, res) => {
    try {
      const puntos = await PuntoControl.find({
        coordenadas_lat: { $exists: true, $ne: null },
        coordenadas_lng: { $exists: true, $ne: null }
      });
      res.json({ success: true, puntos, total: puntos.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  app.post('/asistencias/completa', async (req, res) => {
    try {
      const asistencia = new Asistencia(req.body);
      await asistencia.save();
      res.status(201).json(asistencia);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Endpoints de Puntos de Control con Ubicación', () => {
  test('debe crear punto de control con coordenadas GPS', async () => {
    const puntoData = {
      _id: 'test-uuid-1',
      nombre: 'Puerta Principal',
      ubicacion: 'Entrada principal',
      descripcion: 'Punto de control principal',
      coordenadas_lat: -12.0464,
      coordenadas_lng: -77.0428
    };
    
    const response = await request(app)
      .post('/puntos-control')
      .send(puntoData)
      .expect(201);
    
    expect(response.body.nombre).toBe('Puerta Principal');
    expect(response.body.coordenadas_lat).toBe(-12.0464);
    expect(response.body.coordenadas_lng).toBe(-77.0428);
  });
  
  test('debe obtener mapa de puntos de control con coordenadas', async () => {
    // Crear punto con coordenadas
    const PuntoControl = require('../../models/PuntoControl');
    await new PuntoControl({
      _id: 'test-uuid-2',
      nombre: 'Puerta Principal',
      coordenadas_lat: -12.0464,
      coordenadas_lng: -77.0428
    }).save();
    
    const response = await request(app)
      .get('/puntos-control/mapa')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.puntos.length).toBeGreaterThan(0);
    expect(response.body.puntos[0].coordenadas_lat).toBeDefined();
    expect(response.body.puntos[0].coordenadas_lng).toBeDefined();
  });
  
  test('debe registrar asistencia con punto de control', async () => {
    // Crear punto de control primero
    const PuntoControl = require('../../models/PuntoControl');
    const punto = await new PuntoControl({
      _id: 'test-punto-1',
      nombre: 'Puerta Principal',
      coordenadas_lat: -12.0464,
      coordenadas_lng: -77.0428
    }).save();
    
    const asistenciaData = {
      _id: 'test-asistencia-1',
      nombre: 'Juan',
      apellido: 'Pérez',
      dni: '12345678',
      codigo_universitario: '20200001',
      tipo: 'entrada',
      fecha_hora: new Date(),
      punto_control_id: punto._id
    };
    
    const response = await request(app)
      .post('/asistencias/completa')
      .send(asistenciaData)
      .expect(201);
    
    expect(response.body.punto_control_id).toBe(punto._id);
  });
});
