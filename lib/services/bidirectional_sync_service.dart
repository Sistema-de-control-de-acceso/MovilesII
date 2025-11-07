import 'dart:async';
import 'dart:convert';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show defaultTargetPlatform, TargetPlatform, debugPrint, ChangeNotifier;
import 'package:device_info_plus/device_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'api_service.dart';
import 'local_database_service.dart';
import 'connectivity_service.dart';
import '../models/asistencia_model.dart';
import '../models/presencia_model.dart';

/// Servicio de sincronización bidireccional con versionado y manejo de conflictos
class BidirectionalSyncService {
  static final BidirectionalSyncService _instance = BidirectionalSyncService._internal();
  factory BidirectionalSyncService() => _instance;
  BidirectionalSyncService._internal();

  final ApiService _apiService = ApiService();
  final LocalDatabaseService _localDb = LocalDatabaseService();
  final ConnectivityService _connectivityService = ConnectivityService();

  String? _deviceId;
  String? _syncToken;
  DateTime? _lastSyncTime;
  bool _isSyncing = false;
  int _conflictCount = 0;

  // Getters
  String? get deviceId => _deviceId;
  String? get syncToken => _syncToken;
  DateTime? get lastSyncTime => _lastSyncTime;
  bool get isSyncing => _isSyncing;
  int get conflictCount => _conflictCount;

  /// Inicializar servicio de sincronización
  Future<void> initialize() async {
    await _connectivityService.initialize();
    await _initializeDeviceId();
    await _registerDevice();
    await _loadSyncState();
  }

  /// Inicializar ID del dispositivo
  Future<void> _initializeDeviceId() async {
    final prefs = await SharedPreferences.getInstance();
    _deviceId = prefs.getString('device_id');

    if (_deviceId == null) {
      final deviceInfo = DeviceInfoPlugin();
      String deviceIdentifier;
      
      if (Platform.isAndroid) {
        final androidInfo = await deviceInfo.androidInfo;
        deviceIdentifier = androidInfo.id;
      } else if (Platform.isIOS) {
        final iosInfo = await deviceInfo.iosInfo;
        deviceIdentifier = iosInfo.identifierForVendor ?? 'ios-unknown';
      } else {
        deviceIdentifier = 'unknown-${DateTime.now().millisecondsSinceEpoch}';
      }

      _deviceId = deviceIdentifier;
      await prefs.setString('device_id', _deviceId!);
    }
  }

  /// Registrar dispositivo en el servidor
  Future<void> _registerDevice() async {
    try {
      final deviceInfo = DeviceInfoPlugin();
      String deviceName = 'Unknown';
      String deviceType = 'mobile';
      String appVersion = '1.0.0';
      
      try {
        final packageInfo = await PackageInfo.fromPlatform();
        appVersion = packageInfo.version;
      } catch (e) {
        debugPrint('Error obteniendo versión de app: $e');
      }
      
    if (defaultTargetPlatform == TargetPlatform.android) {
      final androidInfo = await deviceInfo.androidInfo;
      deviceName = '${androidInfo.manufacturer} ${androidInfo.model}';
      deviceType = 'mobile';
    } else if (defaultTargetPlatform == TargetPlatform.iOS) {
      final iosInfo = await deviceInfo.iosInfo;
      deviceName = '${iosInfo.name} ${iosInfo.model}';
      deviceType = 'mobile';
    }

      final response = await _apiService.post(
        '/sync/register-device',
        {
          'device_id': _deviceId,
          'device_name': deviceName,
          'device_type': deviceType,
          'app_version': appVersion,
        },
      );

      if (response['success'] == true) {
        _syncToken = response['sync_token'];
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('sync_token', _syncToken!);
      }
    } catch (e) {
      debugPrint('Error registrando dispositivo: $e');
    }
  }

  /// Cargar estado de sincronización
  Future<void> _loadSyncState() async {
    final prefs = await SharedPreferences.getInstance();
    _syncToken = prefs.getString('sync_token');
    final lastSyncString = prefs.getString('last_sync_time');
    if (lastSyncString != null) {
      _lastSyncTime = DateTime.parse(lastSyncString);
    }
    _conflictCount = prefs.getInt('conflict_count') ?? 0;
  }

  /// Guardar estado de sincronización
  Future<void> _saveSyncState() async {
    final prefs = await SharedPreferences.getInstance();
    if (_syncToken != null) {
      await prefs.setString('sync_token', _syncToken!);
    }
    if (_lastSyncTime != null) {
      await prefs.setString('last_sync_time', _lastSyncTime!.toIso8601String());
    }
    await prefs.setInt('conflict_count', _conflictCount);
  }

  /// Realizar sincronización bidireccional completa
  Future<SyncResult> performBidirectionalSync({bool forceSync = false}) async {
    if (_isSyncing && !forceSync) {
      return SyncResult(
        success: false,
        error: 'Sincronización ya en curso',
      );
    }

    if (!_connectivityService.isOnline && !forceSync) {
      return SyncResult(
        success: false,
        error: 'Sin conexión a internet',
      );
    }

    _isSyncing = true;
    notifyListeners();

    try {
      // 1. Obtener cambios pendientes del cliente
      final clientChanges = await _getPendingClientChanges();

      // 2. Realizar sincronización bidireccional
      final response = await _apiService.post(
        '/sync/bidirectional',
        {
          'device_id': _deviceId,
      'device_info': await _getDeviceInfo(),
          'last_sync': _lastSyncTime?.toIso8601String(),
          'client_changes': clientChanges,
        },
      );

      if (response['success'] != true) {
        throw Exception('Error en sincronización: ${response['error']}');
      }

      // 3. Procesar cambios del servidor (pull)
      final serverChanges = response['server_changes'];
      await _applyServerChanges(serverChanges);

      // 4. Procesar resultados de upload (push)
      final uploadResults = response['upload_results'];
      await _processUploadResults(uploadResults);

      // 5. Actualizar estado
      _lastSyncTime = DateTime.now();
      _conflictCount = uploadResults['conflicts']?.length ?? 0;
      await _saveSyncState();

      _isSyncing = false;

      return SyncResult(
        success: true,
        syncedCount: uploadResults['synced']?.length ?? 0,
        conflictCount: _conflictCount,
        serverChangesCount: serverChanges['changes']?.length ?? 0,
      );
    } catch (e) {
      _isSyncing = false;
      return SyncResult(
        success: false,
        error: e.toString(),
      );
    }
  }

  /// Obtener cambios pendientes del cliente
  Future<List<Map<String, dynamic>>> _getPendingClientChanges() async {
    final changes = <Map<String, dynamic>>[];

    // Obtener asistencias pendientes
    final pendingAsistencias = await _localDb.getPendingAsistencias();
    for (final asistencia in pendingAsistencias) {
      final version = await _localDb.getRecordVersion('asistencias', asistencia.id);
      changes.add({
        'collection': 'asistencias',
        'record_id': asistencia.id,
        'operation': 'create',
        'data': asistencia.toJson(),
        'version': version,
        'hash': _calculateHash(asistencia.toJson()),
      });
    }

    // Obtener presencia pendiente
    final pendingPresencia = await _localDb.getPendingPresencia();
    for (final presencia in pendingPresencia) {
      final version = await _localDb.getRecordVersion('presencia', presencia.id);
      changes.add({
        'collection': 'presencia',
        'record_id': presencia.id,
        'operation': 'create',
        'data': presencia.toJson(),
        'version': version,
        'hash': _calculateHash(presencia.toJson()),
      });
    }

    return changes;
  }

  /// Aplicar cambios del servidor
  Future<void> _applyServerChanges(Map<String, dynamic> serverChanges) async {
    final changes = serverChanges['changes'] as List?;
    if (changes == null) return;

    for (final change in changes) {
      try {
        await _applyServerChange(change);
      } catch (e) {
        debugPrint('Error aplicando cambio del servidor: $e');
      }
    }
  }

  /// Aplicar un cambio individual del servidor
  Future<void> _applyServerChange(Map<String, dynamic> change) async {
    final collection = change['collection'] as String;
    final recordId = change['record_id'] as String;
    final operation = change['operation'] as String;
    final data = change['data'] as Map<String, dynamic>;
    final version = change['version'] as int;

    switch (collection) {
      case 'asistencias':
        if (operation == 'update' || operation == 'create') {
          final asistencia = AsistenciaModel.fromJson(data);
          await _localDb.saveAsistencia(asistencia, syncStatus: 'synced');
          await _localDb.setRecordVersion('asistencias', recordId, version);
        } else if (operation == 'delete') {
          await _localDb.deleteAsistencia(recordId);
        }
        break;
      case 'presencia':
        if (operation == 'update' || operation == 'create') {
          final presencia = PresenciaModel.fromJson(data);
          await _localDb.savePresencia(presencia, syncStatus: 'synced');
          await _localDb.setRecordVersion('presencia', recordId, version);
        } else if (operation == 'delete') {
          await _localDb.deletePresencia(recordId);
        }
        break;
    }
  }

  /// Procesar resultados de upload
  Future<void> _processUploadResults(Map<String, dynamic> uploadResults) async {
    // Procesar cambios sincronizados
    final synced = uploadResults['synced'] as List?;
    if (synced != null) {
      for (final item in synced) {
        final collection = item['collection'] as String;
        final recordId = item['record_id'] as String;
        final version = item['version'] as int;

        await _localDb.markAsSynced(collection, recordId);
        await _localDb.setRecordVersion(collection, recordId, version);
      }
    }

    // Procesar conflictos
    final conflicts = uploadResults['conflicts'] as List?;
    if (conflicts != null && conflicts.isNotEmpty) {
      _conflictCount = conflicts.length;
      await _handleConflicts(conflicts);
    }
  }

  /// Manejar conflictos
  Future<void> _handleConflicts(List<dynamic> conflicts) async {
    for (final conflict in conflicts) {
      final conflictId = conflict['conflict_id'] as String;
      final collection = conflict['collection'] as String;
      final recordId = conflict['record_id'] as String;
      final serverData = conflict['server_data'] as Map<String, dynamic>?;
      final clientVersion = conflict['client_version'] as int;
      final serverVersion = conflict['server_version'] as int;

      // Guardar conflicto para resolución
      await _localDb.saveConflict(
        conflictId: conflictId,
        collection: collection,
        recordId: recordId,
        serverData: serverData,
        clientVersion: clientVersion,
        serverVersion: serverVersion,
      );

      // Aplicar estrategia de resolución por defecto (last_write_wins)
      // El usuario puede cambiar esto después
      await resolveConflict(
        conflictId: conflictId,
        strategy: ConflictResolutionStrategy.lastWriteWins,
      );
    }
  }

  /// Resolver conflicto
  Future<bool> resolveConflict({
    required String conflictId,
    required ConflictResolutionStrategy strategy,
    Map<String, dynamic>? resolutionData,
  }) async {
    try {
      final response = await _apiService.post(
        '/sync/conflicts/$conflictId/resolve',
        {
          'strategy': strategy.toString().split('.').last,
          'resolved_by': _deviceId,
          'resolution_data': resolutionData,
        },
      );

      if (response['success'] == true) {
        await _localDb.markConflictResolved(conflictId);
        _conflictCount = (_conflictCount > 0) ? _conflictCount - 1 : 0;
        await _saveSyncState();
        return true;
      }

      return false;
    } catch (e) {
      debugPrint('Error resolviendo conflicto: $e');
      return false;
    }
  }

  /// Obtener conflictos pendientes
  Future<List<ConflictInfo>> getPendingConflicts() async {
    try {
      final response = await _apiService.get(
        '/sync/conflicts?device_id=$_deviceId',
      );

      if (response['success'] == true) {
        final conflicts = response['conflicts'] as List;
        return conflicts.map((c) => ConflictInfo.fromJson(c)).toList();
      }

      return [];
    } catch (e) {
      debugPrint('Error obteniendo conflictos: $e');
      return [];
    }
  }

  /// Obtener información del dispositivo
  Future<Map<String, dynamic>> _getDeviceInfo() async {
    final deviceInfo = DeviceInfoPlugin();
    String deviceName = 'Unknown';
    String deviceType = 'mobile';
    String appVersion = '1.0.0';
    
    try {
      final packageInfo = await PackageInfo.fromPlatform();
      appVersion = packageInfo.version;
    } catch (e) {
      debugPrint('Error obteniendo versión de app: $e');
    }
    
    if (defaultTargetPlatform == TargetPlatform.android) {
      final androidInfo = await deviceInfo.androidInfo;
      deviceName = '${androidInfo.manufacturer} ${androidInfo.model}';
      deviceType = 'mobile';
    } else if (defaultTargetPlatform == TargetPlatform.iOS) {
      final iosInfo = await deviceInfo.iosInfo;
      deviceName = '${iosInfo.name} ${iosInfo.model}';
      deviceType = 'mobile';
    }

    return {
      'device_name': deviceName,
      'device_type': deviceType,
      'app_version': appVersion,
    };
  }

  /// Calcular hash de datos
  String _calculateHash(Map<String, dynamic> data) {
    final jsonString = jsonEncode(data);
    // Hash simple usando código de caracteres
    int hash = 0;
    for (int i = 0; i < jsonString.length; i++) {
      hash = ((hash << 5) - hash) + jsonString.codeUnitAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }
}

/// Resultado de sincronización
class SyncResult {
  final bool success;
  final String? error;
  final int syncedCount;
  final int conflictCount;
  final int serverChangesCount;

  SyncResult({
    required this.success,
    this.error,
    this.syncedCount = 0,
    this.conflictCount = 0,
    this.serverChangesCount = 0,
  });
}

/// Estrategias de resolución de conflictos
enum ConflictResolutionStrategy {
  serverWins,
  clientWins,
  merge,
  lastWriteWins,
  manual,
}

/// Información de conflicto
class ConflictInfo {
  final String conflictId;
  final String collection;
  final String recordId;
  final int clientVersion;
  final int serverVersion;
  final Map<String, dynamic>? serverData;
  final Map<String, dynamic>? clientData;

  ConflictInfo({
    required this.conflictId,
    required this.collection,
    required this.recordId,
    required this.clientVersion,
    required this.serverVersion,
    this.serverData,
    this.clientData,
  });

  factory ConflictInfo.fromJson(Map<String, dynamic> json) {
    return ConflictInfo(
      conflictId: json['_id'] ?? json['conflict_id'],
      collection: json['collection_name'] ?? json['collection'],
      recordId: json['record_id'],
      clientVersion: json['client_version'] ?? json['version'],
      serverVersion: json['server_version'],
      serverData: json['server_data'],
      clientData: json['data'],
    );
  }
}

