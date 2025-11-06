// Wrapper para exportar la app Express para testing
// Este archivo debe ser importado en lugar de index.js para tests

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Solo conectar a MongoDB si no estamos en modo test
if (process.env.NODE_ENV !== 'test') {
  mongoose.set('strictQuery', false);
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'ASISTENCIA'
  });

  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'Error de conexión a MongoDB:'));
  db.once('open', () => {
    console.log('Conectado exitosamente a MongoDB Atlas');
  });
}

// Importar todos los modelos
require('./models/User');
require('./models/Asistencia');
require('./models/Presencia');
require('./models/PuntoControl');
require('./models/Asignacion');
require('./models/Bus');
require('./models/SugerenciaBus');

// Importar todas las rutas desde index.js
// Nota: En producción, las rutas están en index.js
// Para tests, necesitamos cargar las rutas de manera diferente
// Por ahora, exportamos la app para que los tests puedan configurar sus propias rutas

module.exports = { app };

