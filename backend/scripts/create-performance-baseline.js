/**
 * Script para crear baseline de rendimiento
 * 
 * Ejecuta consultas críticas y crea baseline de métricas
 * 
 * Uso: node scripts/create-performance-baseline.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const PerformanceBaselineService = require('../services/performance_baseline_service');
const Asistencia = require('../models/Asistencia');
const Presencia = require('../models/Presencia');
const fs = require('fs').promises;
const path = require('path');

// Modelos
let User, Alumno;

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ASISTENCIA', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado a MongoDB');

    // Obtener modelos
    User = mongoose.model('usuarios');
    Alumno = mongoose.model('alumnos');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
}

async function createBaselines() {
  const baselineService = new PerformanceBaselineService();

  console.log('📊 Creando baselines de rendimiento...\n');

  // Query 1: Login
  console.log('1. Creando baseline para Login...');
  try {
    const testUser = await User.findOne({ estado: 'activo' });
    if (testUser) {
      await baselineService.createBaseline(
        'login_query',
        async () => {
          return await User.findOne({ email: testUser.email, estado: 'activo' });
        },
        {
          iterations: 20,
          warmup: 3,
          description: 'Búsqueda de usuario por email y estado (Login)',
        }
      );
      console.log('   ✅ Baseline creado');
    } else {
      console.log('   ⚠️  No hay usuarios de prueba disponibles');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  // Query 2: Buscar Alumno por Código
  console.log('2. Creando baseline para Búsqueda de Alumno...');
  try {
    const testAlumno = await Alumno.findOne({ estado: true });
    if (testAlumno) {
      await baselineService.createBaseline(
        'alumno_by_codigo',
        async () => {
          return await Alumno.findOne({ codigo_universitario: testAlumno.codigo_universitario });
        },
        {
          iterations: 20,
          warmup: 3,
          description: 'Búsqueda de alumno por código universitario',
        }
      );
      console.log('   ✅ Baseline creado');
    } else {
      console.log('   ⚠️  No hay alumnos de prueba disponibles');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  // Query 3: Última Asistencia
  console.log('3. Creando baseline para Última Asistencia...');
  try {
    const testAsistencia = await Asistencia.findOne();
    if (testAsistencia) {
      await baselineService.createBaseline(
        'ultima_asistencia',
        async () => {
          return await Asistencia.findOne({ dni: testAsistencia.dni })
            .sort({ fecha_hora: -1 })
            .lean();
        },
        {
          iterations: 20,
          warmup: 3,
          description: 'Búsqueda de última asistencia por DNI',
        }
      );
      console.log('   ✅ Baseline creado');
    } else {
      console.log('   ⚠️  No hay asistencias de prueba disponibles');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  // Query 4: Presencia Activa
  console.log('4. Creando baseline para Presencia Activa...');
  try {
    const testPresencia = await Presencia.findOne({ esta_dentro: true });
    if (testPresencia) {
      await baselineService.createBaseline(
        'presencia_activa',
        async () => {
          return await Presencia.findOne({
            estudiante_dni: testPresencia.estudiante_dni,
            esta_dentro: true,
          });
        },
        {
          iterations: 20,
          warmup: 3,
          description: 'Búsqueda de presencia activa por DNI',
        }
      );
      console.log('   ✅ Baseline creado');
    } else {
      console.log('   ⚠️  No hay presencias activas de prueba disponibles');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  // Query 5: Asistencias por Fecha
  console.log('5. Creando baseline para Asistencias por Fecha...');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await baselineService.createBaseline(
      'asistencias_por_fecha',
      async () => {
        return await Asistencia.find({ fecha_hora: { $gte: today } })
          .sort({ fecha_hora: -1 })
          .limit(100)
          .lean();
      },
      {
        iterations: 10,
        warmup: 2,
        description: 'Búsqueda de asistencias por fecha (últimas 100)',
      }
    );
    console.log('   ✅ Baseline creado');
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  // Exportar baselines
  console.log('\n💾 Exportando baselines...');
  const exportData = baselineService.exportBaselines();
  const outputPath = path.join(__dirname, '../test/performance/baselines.json');

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2));

  console.log(`✅ Baselines exportados a: ${outputPath}`);

  // Mostrar resumen
  console.log('\n📊 Resumen de Baselines:');
  const baselines = baselineService.getAllBaselines();
  baselines.forEach(baseline => {
    console.log(`\n${baseline.queryName}:`);
    console.log(`  Descripción: ${baseline.description}`);
    console.log(`  Promedio: ${baseline.stats.avg.toFixed(2)}ms`);
    console.log(`  P95: ${baseline.stats.p95.toFixed(2)}ms`);
    console.log(`  P99: ${baseline.stats.p99.toFixed(2)}ms`);
    console.log(`  Éxito: ${baseline.successful}/${baseline.iterations}`);
  });

  return baselineService;
}

async function main() {
  await connectDB();
  await createBaselines();
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

module.exports = { createBaselines, connectDB };

