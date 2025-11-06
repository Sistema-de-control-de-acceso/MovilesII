import 'dart:async';
import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:flutter/foundation.dart';
import '../models/alumno_model.dart';
import '../models/asistencia_model.dart';
import '../models/usuario_model.dart';
import '../models/facultad_escuela_model.dart';
import '../models/presencia_model.dart';
import '../models/decision_manual_model.dart';

class LocalDatabaseService {
  static final LocalDatabaseService _instance = LocalDatabaseService._internal();
  factory LocalDatabaseService() => _instance;
  LocalDatabaseService._internal();

  static Database? _database;
  static const String _databaseName = 'access_control.db';
  static const int _databaseVersion = 1;

  // Nombres de tablas
  static const String _tableAlumnos = 'alumnos';
  static const String _tableAsistencias = 'asistencias';
  static const String _tableUsuarios = 'usuarios';
  static const String _tableFacultades = 'facultades';
  static const String _tableEscuelas = 'escuelas';
  static const String _tablePresencia = 'presencia';
  static const String _tableDecisiones = 'decisiones_manuales';
  static const String _tableSyncQueue = 'sync_queue';

  // Obtener instancia de la base de datos
  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  // Inicializar base de datos
  Future<Database> _initDatabase() async {
    try {
      final databasesPath = await getDatabasesPath();
      final path = join(databasesPath, _databaseName);

      return await openDatabase(
        path,
        version: _databaseVersion,
        onCreate: _onCreate,
        onUpgrade: _onUpgrade,
      );
    } catch (e) {
      debugPrint('Error inicializando base de datos: $e');
      rethrow;
    }
  }

  // Crear tablas
  Future<void> _onCreate(Database db, int version) async {
    await _createAlumnosTable(db);
    await _createAsistenciasTable(db);
    await _createUsuariosTable(db);
    await _createFacultadesTable(db);
    await _createEscuelasTable(db);
    await _createPresenciaTable(db);
    await _createDecisionesTable(db);
    await _createSyncQueueTable(db);
    await _createDataVersionsTable(db);
    await _createConflictsTable(db);
  }

  // Actualizar base de datos
  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    // Implementar migraciones aquí cuando sea necesario
  }

  // ==================== TABLA ALUMNOS ====================

  Future<void> _createAlumnosTable(Database db) async {
    await db.execute('''
      CREATE TABLE $_tableAlumnos (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        apellido TEXT NOT NULL,
        dni TEXT UNIQUE NOT NULL,
        codigo_universitario TEXT UNIQUE NOT NULL,
        siglas_facultad TEXT NOT NULL,
        siglas_escuela TEXT NOT NULL,
        estado TEXT NOT NULL DEFAULT 'activo',
        fecha_creacion TEXT,
        fecha_actualizacion TEXT,
        sync_status TEXT DEFAULT 'synced',
        last_sync TEXT
      )
    ''');
  }

  // Guardar alumno localmente
  Future<void> saveAlumno(AlumnoModel alumno, {String syncStatus = 'pending'}) async {
    final db = await database;
    await db.insert(
      _tableAlumnos,
      {
        'id': alumno.id,
        'nombre': alumno.nombre,
        'apellido': alumno.apellido,
        'dni': alumno.dni,
        'codigo_universitario': alumno.codigoUniversitario,
        'siglas_facultad': alumno.siglasFacultad,
        'siglas_escuela': alumno.siglasEscuela,
        'estado': alumno.estado,
        'fecha_creacion': alumno.fechaCreacion?.toIso8601String(),
        'fecha_actualizacion': alumno.fechaActualizacion?.toIso8601String(),
        'sync_status': syncStatus,
        'last_sync': DateTime.now().toIso8601String(),
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  // Obtener alumno por código universitario
  Future<AlumnoModel?> getAlumnoByCodigo(String codigo) async {
    final db = await database;
    final result = await db.query(
      _tableAlumnos,
      where: 'codigo_universitario = ?',
      whereArgs: [codigo],
    );

    if (result.isEmpty) return null;
    return _alumnoFromMap(result.first);
  }

  // Obtener todos los alumnos
  Future<List<AlumnoModel>> getAllAlumnos() async {
    final db = await database;
    final result = await db.query(_tableAlumnos);
    return result.map((map) => _alumnoFromMap(map)).toList();
  }

  // ==================== TABLA ASISTENCIAS ====================

  Future<void> _createAsistenciasTable(Database db) async {
    await db.execute('''
      CREATE TABLE $_tableAsistencias (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        apellido TEXT NOT NULL,
        dni TEXT NOT NULL,
        codigo_universitario TEXT NOT NULL,
        siglas_facultad TEXT NOT NULL,
        siglas_escuela TEXT NOT NULL,
        tipo TEXT NOT NULL,
        fecha_hora TEXT NOT NULL,
        entrada_tipo TEXT NOT NULL,
        puerta TEXT NOT NULL,
        guardia_id TEXT,
        guardia_nombre TEXT,
        autorizacion_manual INTEGER DEFAULT 0,
        razon_decision TEXT,
        timestamp_decision TEXT,
        coordenadas TEXT,
        descripcion_ubicacion TEXT,
        sync_status TEXT DEFAULT 'pending',
        created_at TEXT NOT NULL
      )
    ''');
  }

  // Guardar asistencia localmente
  Future<void> saveAsistencia(AsistenciaModel asistencia, {String syncStatus = 'pending'}) async {
    final db = await database;
    await db.insert(
      _tableAsistencias,
      {
        'id': asistencia.id,
        'nombre': asistencia.nombre,
        'apellido': asistencia.apellido,
        'dni': asistencia.dni,
        'codigo_universitario': asistencia.codigoUniversitario,
        'siglas_facultad': asistencia.siglasFacultad,
        'siglas_escuela': asistencia.siglasEscuela,
      'tipo': asistencia.tipo.toValue(),
        'fecha_hora': asistencia.fechaHora.toIso8601String(),
        'entrada_tipo': asistencia.entradaTipo,
        'puerta': asistencia.puerta,
        'guardia_id': asistencia.guardiaId,
        'guardia_nombre': asistencia.guardiaNombre,
        'autorizacion_manual': asistencia.autorizacionManual == true ? 1 : 0,
        'razon_decision': asistencia.razonDecision,
        'timestamp_decision': asistencia.timestampDecision?.toIso8601String(),
        'coordenadas': asistencia.coordenadas,
        'descripcion_ubicacion': asistencia.descripcionUbicacion,
        'sync_status': syncStatus,
        'created_at': DateTime.now().toIso8601String(),
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  // Obtener asistencias pendientes de sincronización
  Future<List<AsistenciaModel>> getPendingAsistencias() async {
    final db = await database;
    final result = await db.query(
      _tableAsistencias,
      where: 'sync_status = ?',
      whereArgs: ['pending'],
      orderBy: 'created_at ASC',
    );
    return result.map((map) => _asistenciaFromMap(map)).toList();
  }

  // Obtener asistencias por rango de fechas
  Future<List<AsistenciaModel>> getAsistenciasByDateRange(
    DateTime start,
    DateTime end,
  ) async {
    final db = await database;
    final result = await db.query(
      _tableAsistencias,
      where: 'fecha_hora BETWEEN ? AND ?',
      whereArgs: [
        start.toIso8601String(),
        end.add(Duration(days: 1)).toIso8601String(),
      ],
      orderBy: 'fecha_hora DESC',
    );
    return result.map((map) => _asistenciaFromMap(map)).toList();
  }

  // ==================== TABLA USUARIOS ====================

  Future<void> _createUsuariosTable(Database db) async {
    await db.execute('''
      CREATE TABLE $_tableUsuarios (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        apellido TEXT NOT NULL,
        dni TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        rango TEXT NOT NULL DEFAULT 'guardia',
        estado TEXT NOT NULL DEFAULT 'activo',
        puerta_acargo TEXT,
        telefono TEXT,
        fecha_creacion TEXT,
        fecha_actualizacion TEXT,
        sync_status TEXT DEFAULT 'synced',
        last_sync TEXT
      )
    ''');
  }

  // ==================== TABLA FACULTADES ====================

  Future<void> _createFacultadesTable(Database db) async {
    await db.execute('''
      CREATE TABLE $_tableFacultades (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        siglas TEXT UNIQUE NOT NULL,
        descripcion TEXT,
        sync_status TEXT DEFAULT 'synced',
        last_sync TEXT
      )
    ''');
  }

  // ==================== TABLA ESCUELAS ====================

  Future<void> _createEscuelasTable(Database db) async {
    await db.execute('''
      CREATE TABLE $_tableEscuelas (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        siglas TEXT UNIQUE NOT NULL,
        siglas_facultad TEXT NOT NULL,
        descripcion TEXT,
        sync_status TEXT DEFAULT 'synced',
        last_sync TEXT
      )
    ''');
  }

  // ==================== TABLA PRESENCIA ====================

  Future<void> _createPresenciaTable(Database db) async {
    await db.execute('''
      CREATE TABLE $_tablePresencia (
        id TEXT PRIMARY KEY,
        estudiante_id TEXT NOT NULL,
        estudiante_dni TEXT NOT NULL,
        estudiante_nombre TEXT NOT NULL,
        facultad TEXT NOT NULL,
        escuela TEXT NOT NULL,
        hora_entrada TEXT NOT NULL,
        hora_salida TEXT,
        punto_entrada TEXT NOT NULL,
        punto_salida TEXT,
        esta_dentro INTEGER DEFAULT 1,
        guardia_entrada TEXT NOT NULL,
        guardia_salida TEXT,
        tiempo_en_campus INTEGER,
        sync_status TEXT DEFAULT 'pending',
        created_at TEXT NOT NULL
      )
    ''');
  }

  // ==================== TABLA DECISIONES MANUALES ====================

  Future<void> _createDecisionesTable(Database db) async {
    await db.execute('''
      CREATE TABLE $_tableDecisiones (
        id TEXT PRIMARY KEY,
        estudiante_dni TEXT NOT NULL,
        estudiante_nombre TEXT NOT NULL,
        guardia_id TEXT NOT NULL,
        guardia_nombre TEXT NOT NULL,
        tipo_acceso TEXT NOT NULL,
        autorizado INTEGER NOT NULL,
        razon TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        sync_status TEXT DEFAULT 'pending',
        created_at TEXT NOT NULL
      )
    ''');
  }

  // ==================== TABLA COLA DE SINCRONIZACIÓN ====================

  Future<void> _createSyncQueueTable(Database db) async {
    await db.execute('''
      CREATE TABLE $_tableSyncQueue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        last_retry TEXT
      )
    ''');
  }

  // ==================== TABLA VERSIONADO ====================

  static const String _tableDataVersions = 'data_versions';
  static const String _tableConflicts = 'conflicts';

  Future<void> _createDataVersionsTable(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS $_tableDataVersions (
        collection_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified TEXT,
        PRIMARY KEY (collection_name, record_id)
      )
    ''');
  }

  Future<void> _createConflictsTable(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS $_tableConflicts (
        conflict_id TEXT PRIMARY KEY,
        collection_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        client_version INTEGER NOT NULL,
        server_version INTEGER NOT NULL,
        server_data TEXT,
        client_data TEXT,
        status TEXT DEFAULT 'pending',
        created_at TEXT NOT NULL
      )
    ''');
  }

  // ==================== MÉTODOS DE CONVERSIÓN ====================

  AlumnoModel _alumnoFromMap(Map<String, dynamic> map) {
    return AlumnoModel(
      id: map['id'],
      nombre: map['nombre'],
      apellido: map['apellido'],
      dni: map['dni'],
      codigoUniversitario: map['codigo_universitario'],
      siglasFacultad: map['siglas_facultad'],
      siglasEscuela: map['siglas_escuela'],
      estado: map['estado'],
      fechaCreacion: map['fecha_creacion'] != null 
          ? DateTime.parse(map['fecha_creacion']) 
          : null,
      fechaActualizacion: map['fecha_actualizacion'] != null 
          ? DateTime.parse(map['fecha_actualizacion']) 
          : null,
    );
  }

  AsistenciaModel _asistenciaFromMap(Map<String, dynamic> map) {
    return AsistenciaModel(
      id: map['id'],
      nombre: map['nombre'],
      apellido: map['apellido'],
      dni: map['dni'],
      codigoUniversitario: map['codigo_universitario'],
      siglasFacultad: map['siglas_facultad'],
      siglasEscuela: map['siglas_escuela'],
      tipo: TipoMovimiento.fromString(map['tipo']) ?? TipoMovimiento.entrada,
      fechaHora: DateTime.parse(map['fecha_hora']),
      entradaTipo: map['entrada_tipo'],
      puerta: map['puerta'],
      guardiaId: map['guardia_id'],
      guardiaNombre: map['guardia_nombre'],
      autorizacionManual: map['autorizacion_manual'] == 1,
      razonDecision: map['razon_decision'],
      timestampDecision: map['timestamp_decision'] != null 
          ? DateTime.parse(map['timestamp_decision']) 
          : null,
      coordenadas: map['coordenadas'],
      descripcionUbicacion: map['descripcion_ubicacion'],
    );
  }

  // ==================== MÉTODOS DE SINCRONIZACIÓN ====================

  // Marcar registro como sincronizado
  Future<void> markAsSynced(String tableName, String recordId) async {
    final db = await database;
    await db.update(
      tableName,
      {
        'sync_status': 'synced',
        'last_sync': DateTime.now().toIso8601String(),
      },
      where: 'id = ?',
      whereArgs: [recordId],
    );
  }

  // Obtener estadísticas de sincronización
  Future<Map<String, int>> getSyncStats() async {
    final db = await database;
    
    final pendingAsistencias = await db.rawQuery(
      'SELECT COUNT(*) as count FROM $_tableAsistencias WHERE sync_status = ?',
      ['pending'],
    );
    
    final pendingPresencia = await db.rawQuery(
      'SELECT COUNT(*) as count FROM $_tablePresencia WHERE sync_status = ?',
      ['pending'],
    );
    
    final pendingDecisiones = await db.rawQuery(
      'SELECT COUNT(*) as count FROM $_tableDecisiones WHERE sync_status = ?',
      ['pending'],
    );

    return {
      'pending_asistencias': pendingAsistencias.first['count'] as int,
      'pending_presencia': pendingPresencia.first['count'] as int,
      'pending_decisiones': pendingDecisiones.first['count'] as int,
    };
  }

  // Limpiar datos antiguos (más de 30 días)
  Future<void> cleanupOldData() async {
    final db = await database;
    final cutoffDate = DateTime.now().subtract(Duration(days: 30));
    
    await db.delete(
      _tableAsistencias,
      where: 'created_at < ? AND sync_status = ?',
      whereArgs: [cutoffDate.toIso8601String(), 'synced'],
    );
  }

  // ==================== MÉTODOS DE VERSIONADO ====================

  /// Obtener versión de un registro
  Future<int> getRecordVersion(String collectionName, String recordId) async {
    final db = await database;
    final result = await db.query(
      _tableDataVersions,
      where: 'collection_name = ? AND record_id = ?',
      whereArgs: [collectionName, recordId],
    );

    if (result.isEmpty) {
      return 1; // Versión inicial
    }

    return result.first['version'] as int;
  }

  /// Establecer versión de un registro
  Future<void> setRecordVersion(String collectionName, String recordId, int version) async {
    final db = await database;
    await db.insert(
      _tableDataVersions,
      {
        'collection_name': collectionName,
        'record_id': recordId,
        'version': version,
        'last_modified': DateTime.now().toIso8601String(),
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  /// Incrementar versión de un registro
  Future<int> incrementRecordVersion(String collectionName, String recordId) async {
    final currentVersion = await getRecordVersion(collectionName, recordId);
    final newVersion = currentVersion + 1;
    await setRecordVersion(collectionName, recordId, newVersion);
    return newVersion;
  }

  // ==================== MÉTODOS DE CONFLICTOS ====================

  /// Guardar conflicto
  Future<void> saveConflict({
    required String conflictId,
    required String collection,
    required String recordId,
    required int clientVersion,
    required int serverVersion,
    Map<String, dynamic>? serverData,
    Map<String, dynamic>? clientData,
  }) async {
    final db = await database;
    await db.insert(
      _tableConflicts,
      {
        'conflict_id': conflictId,
        'collection_name': collection,
        'record_id': recordId,
        'client_version': clientVersion,
        'server_version': serverVersion,
        'server_data': serverData != null ? jsonEncode(serverData) : null,
        'client_data': clientData != null ? jsonEncode(clientData) : null,
        'status': 'pending',
        'created_at': DateTime.now().toIso8601String(),
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  /// Obtener conflictos pendientes
  Future<List<Map<String, dynamic>>> getPendingConflicts() async {
    final db = await database;
    final result = await db.query(
      _tableConflicts,
      where: 'status = ?',
      whereArgs: ['pending'],
      orderBy: 'created_at DESC',
    );

    return result.map((row) {
      final conflict = Map<String, dynamic>.from(row);
      if (conflict['server_data'] != null) {
        conflict['server_data'] = jsonDecode(conflict['server_data'] as String);
      }
      if (conflict['client_data'] != null) {
        conflict['client_data'] = jsonDecode(conflict['client_data'] as String);
      }
      return conflict;
    }).toList();
  }

  /// Marcar conflicto como resuelto
  Future<void> markConflictResolved(String conflictId) async {
    final db = await database;
    await db.update(
      _tableConflicts,
      {'status': 'resolved'},
      where: 'conflict_id = ?',
      whereArgs: [conflictId],
    );
  }

  // ==================== MÉTODOS ADICIONALES ====================

  /// Obtener presencia pendiente
  Future<List<PresenciaModel>> getPendingPresencia() async {
    final db = await database;
    final result = await db.query(
      _tablePresencia,
      where: 'sync_status = ?',
      whereArgs: ['pending'],
      orderBy: 'created_at ASC',
    );
    return result.map((map) => _presenciaFromMap(map)).toList();
  }

  /// Guardar presencia
  Future<void> savePresencia(PresenciaModel presencia, {String syncStatus = 'pending'}) async {
    final db = await database;
    await db.insert(
      _tablePresencia,
      {
        'id': presencia.id,
        'estudiante_id': presencia.estudianteId,
        'estudiante_dni': presencia.estudianteDni,
        'estudiante_nombre': presencia.estudianteNombre,
        'facultad': presencia.facultad,
        'escuela': presencia.escuela,
        'hora_entrada': presencia.horaEntrada.toIso8601String(),
        'hora_salida': presencia.horaSalida?.toIso8601String(),
        'punto_entrada': presencia.puntoEntrada,
        'punto_salida': presencia.puntoSalida,
        'esta_dentro': presencia.estaDentro ? 1 : 0,
        'guardia_entrada': presencia.guardiaEntrada,
        'guardia_salida': presencia.guardiaSalida,
        'tiempo_en_campus': presencia.tiempoEnCampus,
        'sync_status': syncStatus,
        'created_at': DateTime.now().toIso8601String(),
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  /// Convertir map a PresenciaModel
  PresenciaModel _presenciaFromMap(Map<String, dynamic> map) {
    return PresenciaModel(
      id: map['id'],
      estudianteId: map['estudiante_id'],
      estudianteDni: map['estudiante_dni'],
      estudianteNombre: map['estudiante_nombre'],
      facultad: map['facultad'],
      escuela: map['escuela'],
      horaEntrada: DateTime.parse(map['hora_entrada']),
      horaSalida: map['hora_salida'] != null ? DateTime.parse(map['hora_salida']) : null,
      puntoEntrada: map['punto_entrada'],
      puntoSalida: map['punto_salida'],
      estaDentro: map['esta_dentro'] == 1,
      guardiaEntrada: map['guardia_entrada'],
      guardiaSalida: map['guardia_salida'],
      tiempoEnCampus: map['tiempo_en_campus'],
    );
  }

  /// Eliminar presencia
  Future<void> deletePresencia(String recordId) async {
    final db = await database;
    await db.delete(
      _tablePresencia,
      where: 'id = ?',
      whereArgs: [recordId],
    );
  }

  /// Eliminar asistencia
  Future<void> deleteAsistencia(String recordId) async {
    final db = await database;
    await db.delete(
      _tableAsistencias,
      where: 'id = ?',
      whereArgs: [recordId],
    );
  }

  // Cerrar base de datos
  Future<void> close() async {
    final db = _database;
    if (db != null) {
      await db.close();
      _database = null;
    }
  }
}
