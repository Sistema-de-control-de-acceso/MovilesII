/**
 * Script para crear/optimizar índices en MongoDB
 * 
 * Crea todos los índices necesarios para optimizar consultas críticas
 * 
 * Uso: node scripts/optimize-indexes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const DatabaseIndexes = require('../utils/database_indexes');
const Asistencia = require('../models/Asistencia');
const Presencia = require('../models/Presencia');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ASISTENCIA', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
}

async function optimizeIndexes() {
  const indexManager = new DatabaseIndexes();

  console.log('🔧 Optimizando índices...\n');

  try {
    // Obtener modelos
    const User = mongoose.model('usuarios');
    const Alumno = mongoose.model('alumnos');
    const Asignacion = mongoose.model('asignaciones');

    // Crear todos los índices
    const results = await indexManager.createAllIndexes(
      Asistencia,
      Presencia,
      User,
      Alumno,
      Asignacion
    );

    // Mostrar resultados
    console.log('\n📊 Resultados:\n');

    Object.keys(results).forEach(collection => {
      console.log(`${collection}:`);
      results[collection].forEach(result => {
        if (result.success) {
          console.log(`  ✅ ${result.name}`);
        } else {
          console.log(`  ❌ ${result.name}: ${result.error}`);
        }
      });
      console.log();
    });

    // Verificar índices existentes
    console.log('📋 Verificando índices existentes...\n');

    const collections = [
      { name: 'asistencias', model: Asistencia },
      { name: 'presencia', model: Presencia },
      { name: 'usuarios', model: User },
      { name: 'alumnos', model: Alumno },
      { name: 'asignaciones', model: Asignacion },
    ];

    for (const { name, model } of collections) {
      try {
        const indexes = await indexManager.checkIndexes(model.collection);
        console.log(`${name}: ${indexes.length} índices`);
        indexes.forEach(idx => {
          console.log(`  - ${idx.name || 'default'}: ${JSON.stringify(idx.key)}`);
        });
        console.log();
      } catch (error) {
        console.log(`${name}: Error verificando índices - ${error.message}\n`);
      }
    }

    console.log('✅ Optimización de índices completada');
  } catch (error) {
    console.error('❌ Error optimizando índices:', error);
    throw error;
  }
}

async function main() {
  await connectDB();
  await optimizeIndexes();
  await mongoose.connection.close();
  console.log('\n✅ Proceso completado');
  process.exit(0);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

module.exports = { optimizeIndexes, connectDB };

