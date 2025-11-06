/**
 * Script para gestionar historial: crear índices, archivar datos, etc.
 * 
 * Uso:
 * node scripts/manage_history.js [accion] [opciones]
 * 
 * Acciones:
 *   init          - Inicializar servicio (crear índices)
 *   archive       - Archivar datos antiguos
 *   stats         - Mostrar estadísticas
 *   maintenance   - Ejecutar mantenimiento completo
 *   export        - Exportar historial
 * 
 * Ejemplos:
 *   node scripts/manage_history.js init
 *   node scripts/manage_history.js archive --collection=asistencias
 *   node scripts/manage_history.js stats
 *   node scripts/manage_history.js maintenance
 *   node scripts/manage_history.js export --collection=asistencias --fechaInicio=2024-01-01
 */

require('dotenv').config();
const mongoose = require('mongoose');
const HistoryManagementService = require('../services/history_management_service');
const Asistencia = require('../models/Asistencia');
const Presencia = require('../models/Presencia');

// Configuración
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/asistencia';

// Parsear argumentos
const args = process.argv.slice(2);
const action = args[0] || 'stats';
const options = {};

// Parsear opciones
args.slice(1).forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.substring(2).split('=');
    options[key] = value === undefined ? true : value;
  }
});

async function main() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const service = new HistoryManagementService(Asistencia, Presencia);

    switch (action) {
      case 'init':
        console.log('🔧 Inicializando servicio de historial...');
        const initResult = await service.initialize({ force: options.force === true });
        console.log('✅ Servicio inicializado');
        console.log('Índices creados:', JSON.stringify(initResult.indexes, null, 2));
        break;

      case 'archive':
        console.log('📦 Archiving old data...');
        const archiveResult = await service.archiveOldData({
          collection: options.collection || 'asistencias',
          dryRun: options.dryRun === true || options.dryRun === 'true'
        });
        console.log('✅ Archivado completado');
        console.log('Resultado:', JSON.stringify(archiveResult, null, 2));
        break;

      case 'stats':
        console.log('📊 Obteniendo estadísticas...');
        const stats = await service.getHistoryStats();
        console.log('\n📈 Estadísticas del Historial:');
        console.log('═'.repeat(50));
        console.log('Asistencias:');
        console.log(`  - Total: ${stats.totals.asistencias}`);
        console.log(`  - Activas: ${stats.collections.asistencias.active}`);
        console.log(`  - Archivadas: ${stats.collections.asistencias.archived}`);
        console.log(`  - Último mes: ${stats.collections.asistencias.lastMonth}`);
        console.log(`  - Últimos 3 meses: ${stats.collections.asistencias.last3Months}`);
        console.log(`  - Archivos: ${stats.collections.asistencias.archiveFiles}`);
        console.log(`  - Tamaño archivos: ${stats.collections.asistencias.archiveSizeMB} MB`);
        console.log('\nPresencia:');
        console.log(`  - Total: ${stats.totals.presencia}`);
        console.log(`  - Activas: ${stats.collections.presencia.active}`);
        console.log(`  - Archivadas: ${stats.collections.presencia.archived}`);
        break;

      case 'indexes':
        console.log('📊 Verificando índices...');
        const indexesStatus = await service.checkIndexesStatus();
        console.log('\nÍndices de Asistencias:');
        indexesStatus.asistencias.indexes.forEach(idx => {
          console.log(`  - ${idx.name}: ${Object.keys(idx.keys).join(', ')}`);
        });
        console.log('\nÍndices de Presencia:');
        indexesStatus.presencia.indexes.forEach(idx => {
          console.log(`  - ${idx.name}: ${Object.keys(idx.keys).join(', ')}`);
        });
        break;

      case 'maintenance':
        console.log('🔧 Ejecutando mantenimiento completo...');
        const maintenanceResult = await service.performMaintenance({
          createIndexes: options.indexes !== false,
          archiveOldData: options.archive !== false,
          collections: options.collections ? options.collections.split(',') : ['asistencias', 'presencia']
        });
        console.log('✅ Mantenimiento completado');
        console.log('Resultado:', JSON.stringify(maintenanceResult, null, 2));
        break;

      case 'export':
        console.log('📤 Exportando historial...');
        const exportResult = await service.exportHistory({
          collection: options.collection || 'asistencias',
          fechaInicio: options.fechaInicio || null,
          fechaFin: options.fechaFin || null,
          format: options.format || 'json'
        });
        console.log('✅ Exportación completada');
        console.log(`Archivo: ${exportResult.filepath}`);
        console.log(`Registros: ${exportResult.records}`);
        break;

      default:
        console.log('Acción desconocida:', action);
        console.log('Acciones disponibles: init, archive, stats, indexes, maintenance, export');
        process.exit(1);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();
