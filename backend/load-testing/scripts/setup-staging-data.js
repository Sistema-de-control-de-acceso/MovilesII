/**
 * Script para configurar datos de prueba en staging
 * 
 * Crea usuarios y alumnos de prueba para las pruebas de carga
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Importar modelos (ajustar rutas según estructura)
const User = require('../../models/User');
// Nota: Los alumnos se consultan desde BD externa, no se crean aquí

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ASISTENCIA';

async function setupStagingData() {
  try {
    // Conectar a BD
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Conectado a MongoDB');

    // Crear usuarios de prueba
    const testUsers = [
      { email: 'admin@test.com', password: 'admin123', rango: 'admin' },
      { email: 'guard@test.com', password: 'guard123', rango: 'guard' },
      { email: 'user1@test.com', password: 'user123', rango: 'user' },
      { email: 'user2@test.com', password: 'user123', rango: 'user' },
      { email: 'user3@test.com', password: 'user123', rango: 'user' },
    ];

    console.log('📝 Creando usuarios de prueba...');
    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`  ⏭️  Usuario ${userData.email} ya existe`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        ...userData,
        password: hashedPassword,
      });
      await user.save();
      console.log(`  ✅ Usuario ${userData.email} creado`);
    }

    // Nota: Los alumnos se consultan desde BD externa
    // Para pruebas de carga, asegurarse de que existan alumnos en la BD externa
    // con códigos: A001, A002, A003, ..., A100
    console.log('📝 Nota: Los alumnos se consultan desde BD externa');
    console.log('  ⚠️  Asegúrese de que existan alumnos con códigos A001-A100 en la BD externa');

    console.log('\n✅ Datos de staging configurados exitosamente');
    console.log('\n📋 Usuarios de prueba:');
    testUsers.forEach(u => {
      console.log(`  - ${u.email} / ${u.password}`);
    });
    console.log(`\n📋 Alumnos de prueba: Asegúrese de tener alumnos A001-A100 en BD externa`);

  } catch (error) {
    console.error('❌ Error configurando datos:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupStagingData();
}

module.exports = setupStagingData;

