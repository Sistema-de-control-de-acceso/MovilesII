// Setup específico para tests E2E
// Este archivo carga todas las rutas necesarias para tests E2E

const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');

// Crear app Express para tests
const app = express();
app.use(cors());
app.use(express.json());

// Función para inicializar rutas (llamada desde los tests)
function setupRoutes() {
  // Importar modelos
  require('../../models/User');
  require('../../models/Asistencia');
  require('../../models/Presencia');
  require('../../models/PuntoControl');
  require('../../models/Asignacion');
  
  // Obtener modelos de mongoose
  const User = mongoose.model('usuarios');
  const Asistencia = mongoose.model('asistencias');
  const Presencia = mongoose.model('presencia');
  const bcrypt = require('bcrypt');
  const { v4: uuidv4 } = require('uuid');

  // Rutas básicas para tests
  app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email, estado: 'activo' });
      if (!user) {
        return res.status(401).json({ error: 'Credenciales incorrectas' });
      }
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Credenciales incorrectas' });
      }
      res.json({
        id: user._id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        dni: user.dni,
        rango: user.rango,
        puerta_acargo: user.puerta_acargo,
        estado: user.estado
      });
    } catch (err) {
      res.status(500).json({ error: 'Error en el servidor' });
    }
  });

  app.get('/usuarios', async (req, res) => {
    try {
      const usuarios = await User.find().select('-password');
      res.json(usuarios);
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener usuarios' });
    }
  });

  app.post('/usuarios', async (req, res) => {
    try {
      const user = new User({
        _id: uuidv4(),
        ...req.body
      });
      await user.save();
      const userResponse = user.toObject();
      delete userResponse.password;
      res.status(201).json(userResponse);
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({ error: 'Email o DNI ya existe' });
      }
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/usuarios/:id', async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select('-password');
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener usuario' });
    }
  });

  app.put('/usuarios/:id', async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { ...req.body, fecha_actualizacion: new Date() },
        { new: true }
      ).select('-password');
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: 'Error al actualizar usuario' });
    }
  });

  app.delete('/usuarios/:id', async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
      res.json({ message: 'Usuario eliminado correctamente' });
    } catch (err) {
      res.status(500).json({ error: 'Error al eliminar usuario' });
    }
  });

  // Rutas de dashboard
  class RealtimeMetricsService {
    constructor(AsistenciaModel) {
      this.Asistencia = AsistenciaModel;
    }

    async getTodayMetrics() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayCount = await this.Asistencia.countDocuments({
        fecha_hora: { $gte: today, $lt: tomorrow }
      });

      const totalCount = await this.Asistencia.countDocuments();

      return {
        total: totalCount,
        today: todayCount
      };
    }

    async getHourlyData(hours = 24) {
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - hours);

      const asistencias = await this.Asistencia.find({
        fecha_hora: { $gte: startDate }
      }).lean();

      const hourlyData = new Array(hours).fill(0);
      asistencias.forEach(access => {
        const fecha = new Date(access.fecha_hora);
        const hourIndex = hours - Math.floor((Date.now() - fecha.getTime()) / (1000 * 60 * 60));
        if (hourIndex >= 0 && hourIndex < hours) {
          hourlyData[hourIndex]++;
        }
      });

      return hourlyData;
    }

    async getEntranceExitData() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const entrances = await this.Asistencia.countDocuments({
        fecha_hora: { $gte: today, $lt: tomorrow },
        tipo: 'entrada'
      });

      const exits = await this.Asistencia.countDocuments({
        fecha_hora: { $gte: today, $lt: tomorrow },
        tipo: 'salida'
      });

      return { entrances, exits };
    }

    async getWeeklyData() {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const asistencias = await this.Asistencia.find({
        fecha_hora: { $gte: startDate }
      }).lean();

      const weeklyData = [0, 0, 0, 0, 0, 0, 0];
      asistencias.forEach(access => {
        const fecha = new Date(access.fecha_hora);
        const dayOfWeek = fecha.getDay();
        weeklyData[dayOfWeek]++;
      });

      return weeklyData;
    }

    async getFacultiesData() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const asistencias = await this.Asistencia.find({
        fecha_hora: { $gte: today, $lt: tomorrow }
      }).lean();

      const facultiesCount = {};
      asistencias.forEach(access => {
        const faculty = access.siglas_facultad || 'N/A';
        facultiesCount[faculty] = (facultiesCount[faculty] || 0) + 1;
      });

      const sorted = Object.entries(facultiesCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      return {
        labels: sorted.map(([name]) => name),
        values: sorted.map(([, count]) => count)
      };
    }

    async getRecentAccess(limit = 20) {
      const recent = await this.Asistencia.find()
        .sort({ fecha_hora: -1 })
        .limit(limit)
        .lean();
      return recent;
    }
  }

  const metricsService = new RealtimeMetricsService(Asistencia);

  app.get('/dashboard/metrics', async (req, res) => {
    try {
      const { period = '24h' } = req.query;
      const hours = period === '7d' ? 168 : period === '30d' ? 720 : 24;

      const metrics = await metricsService.getTodayMetrics();
      const hourlyData = await metricsService.getHourlyData(hours);
      const entranceExitData = await metricsService.getEntranceExitData();
      const weeklyData = await metricsService.getWeeklyData();
      const facultiesData = await metricsService.getFacultiesData();

      res.json({
        success: true,
        metrics,
        hourlyData,
        entranceExitData,
        weeklyData: { values: weeklyData },
        facultiesData,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({ 
        error: 'Error obteniendo métricas', 
        details: err.message 
      });
    }
  });

  app.get('/dashboard/recent-access', async (req, res) => {
    try {
      const access = await metricsService.getRecentAccess(20);
      res.json({
        success: true,
        access,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({ 
        error: 'Error obteniendo accesos recientes', 
        details: err.message 
      });
    }
  });

  app.get('/ml/dashboard', async (req, res) => {
    try {
      res.json({
        success: true,
        dashboard: {
          metrics: {},
          evolution: [],
          comparison: {}
        },
        timestamp: new Date()
      });
    } catch (err) {
      res.status(500).json({ error: 'Error generando dashboard ML' });
    }
  });
}

// Exportar app y función de setup para uso en tests
module.exports = { app, setupRoutes };
