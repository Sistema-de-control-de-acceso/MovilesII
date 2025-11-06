/**
 * Script para ejecutar pruebas de carga leve y comparar métricas
 * 
 * Compara rendimiento antes y después de optimizaciones
 * 
 * Uso: node scripts/run-performance-comparison.js
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

    User = mongoose.model('usuarios');
    Alumno = mongoose.model('alumnos');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
}

async function loadBaseline() {
  const baselinePath = path.join(__dirname, '../test/performance/baselines.json');
  
  try {
    const data = await fs.readFile(baselinePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log('⚠️  No se encontró baseline. Ejecutar create-performance-baseline.js primero.');
    return null;
  }
}

async function runPerformanceComparison() {
  const baselineService = new PerformanceBaselineService();
  const baselineData = await loadBaseline();

  if (baselineData) {
    baselineService.importBaselines(baselineData);
    console.log('📊 Baseline cargado\n');
  }

  console.log('🚀 Ejecutando pruebas de carga leve...\n');

  const results = [];

  // Test 1: Login
  console.log('1. Probando Login...');
  try {
    const testUser = await User.findOne({ estado: 'activo' });
    if (testUser) {
      const result = await baselineService.measureQuery(
        'login_query',
        async () => {
          return await User.findOne({ email: testUser.email, estado: 'activo' });
        },
        { iterations: 20 }
      );
      results.push({ query: 'login_query', ...result });
      console.log(`   ✅ Promedio: ${result.measurement.stats.avg.toFixed(2)}ms, P95: ${result.measurement.stats.p95.toFixed(2)}ms`);
      if (result.comparison) {
        console.log(`   📈 Mejora promedio: ${result.comparison.avg.improvement}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 2: Búsqueda Alumno
  console.log('2. Probando Búsqueda de Alumno...');
  try {
    const testAlumno = await Alumno.findOne({ estado: true });
    if (testAlumno) {
      const result = await baselineService.measureQuery(
        'alumno_by_codigo',
        async () => {
          return await Alumno.findOne({ codigo_universitario: testAlumno.codigo_universitario });
        },
        { iterations: 20 }
      );
      results.push({ query: 'alumno_by_codigo', ...result });
      console.log(`   ✅ Promedio: ${result.measurement.stats.avg.toFixed(2)}ms, P95: ${result.measurement.stats.p95.toFixed(2)}ms`);
      if (result.comparison) {
        console.log(`   📈 Mejora promedio: ${result.comparison.avg.improvement}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 3: Última Asistencia
  console.log('3. Probando Última Asistencia...');
  try {
    const testAsistencia = await Asistencia.findOne();
    if (testAsistencia) {
      const result = await baselineService.measureQuery(
        'ultima_asistencia',
        async () => {
          return await Asistencia.findOne({ dni: testAsistencia.dni })
            .sort({ fecha_hora: -1 })
            .lean();
        },
        { iterations: 20 }
      );
      results.push({ query: 'ultima_asistencia', ...result });
      console.log(`   ✅ Promedio: ${result.measurement.stats.avg.toFixed(2)}ms, P95: ${result.measurement.stats.p95.toFixed(2)}ms`);
      if (result.comparison) {
        console.log(`   📈 Mejora promedio: ${result.comparison.avg.improvement}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 4: Presencia Activa
  console.log('4. Probando Presencia Activa...');
  try {
    const testPresencia = await Presencia.findOne({ esta_dentro: true });
    if (testPresencia) {
      const result = await baselineService.measureQuery(
        'presencia_activa',
        async () => {
          return await Presencia.findOne({
            estudiante_dni: testPresencia.estudiante_dni,
            esta_dentro: true,
          });
        },
        { iterations: 20 }
      );
      results.push({ query: 'presencia_activa', ...result });
      console.log(`   ✅ Promedio: ${result.measurement.stats.avg.toFixed(2)}ms, P95: ${result.measurement.stats.p95.toFixed(2)}ms`);
      if (result.comparison) {
        console.log(`   📈 Mejora promedio: ${result.comparison.avg.improvement}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 5: Carga Concurrente
  console.log('5. Probando Carga Concurrente (10 queries simultáneas)...');
  try {
    const testAlumno = await Alumno.findOne({ estado: true });
    if (testAlumno) {
      const start = Date.now();
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          Alumno.findOne({ codigo_universitario: testAlumno.codigo_universitario })
        );
      }
      
      await Promise.all(promises);
      const duration = Date.now() - start;
      
      console.log(`   ✅ 10 queries concurrentes completadas en ${duration}ms`);
      console.log(`   📊 Tiempo promedio por query: ${(duration / 10).toFixed(2)}ms`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Resumen
  console.log('\n📊 Resumen de Comparación:\n');
  results.forEach(({ query, measurement, comparison }) => {
    console.log(`${query}:`);
    console.log(`  Promedio: ${measurement.stats.avg.toFixed(2)}ms`);
    console.log(`  P95: ${measurement.stats.p95.toFixed(2)}ms`);
    console.log(`  P99: ${measurement.stats.p99.toFixed(2)}ms`);
    
    if (comparison) {
      console.log(`  Comparación con baseline:`);
      console.log(`    Promedio: ${comparison.avg.improvement} ${comparison.avg.isBetter ? '✅' : '⚠️'}`);
      console.log(`    P95: ${comparison.p95.improvement} ${comparison.p95.isBetter ? '✅' : '⚠️'}`);
    }
    console.log();
  });

  // Guardar resultados
  const outputPath = path.join(__dirname, '../test/performance/comparison-results.json');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(
    outputPath,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      results,
    }, null, 2)
  );

  console.log(`💾 Resultados guardados en: ${outputPath}`);
}

async function main() {
  await connectDB();
  await runPerformanceComparison();
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

module.exports = { runPerformanceComparison, connectDB };

