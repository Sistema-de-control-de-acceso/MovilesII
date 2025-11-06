import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:sentry_flutter/sentry_flutter.dart';
import 'viewmodels/auth_viewmodel.dart';
import 'viewmodels/nfc_viewmodel.dart';
import 'viewmodels/admin_viewmodel.dart';
import 'viewmodels/reports_viewmodel.dart';
import 'viewmodels/guard_reports_viewmodel.dart';
import 'viewmodels/student_status_viewmodel.dart';
import 'services/connectivity_service.dart';
import 'services/offline_sync_service.dart';
import 'services/hybrid_api_service.dart';
import 'services/logging_service.dart';
import 'services/monitoring_service.dart';
import 'views/login_view.dart';
import 'config/monitoring_config.dart';

void main() async {
  // Inicializar Sentry antes de cualquier otra cosa
  await SentryFlutter.init(
    (options) {
      options.dsn = MonitoringConfig.sentryDsn;
      options.environment = MonitoringConfig.environment;
      options.tracesSampleRate = MonitoringConfig.tracesSampleRate;
      options.profilesSampleRate = MonitoringConfig.profilesSampleRate;
      
      // Configuración adicional
      options.beforeSend = (event, {hint}) {
        // En desarrollo, solo enviar errores críticos
        if (MonitoringConfig.environment == 'development') {
          if (event.level == SentryLevel.fatal || event.level == SentryLevel.error) {
            return event;
          }
          return null;
        }
        return event;
      };
    },
    appRunner: () async {
      WidgetsFlutterBinding.ensureInitialized();
      
      // Inicializar logging
      await LoggingService().initialize();
      final logging = LoggingService();
      logging.info('Aplicación iniciada');
      
      // Inicializar monitoreo
      await MonitoringService().initialize(
        dsn: MonitoringConfig.sentryDsn,
        environment: MonitoringConfig.environment,
        enablePerformanceMonitoring: true,
      );
      
      // Inicializar Hive para almacenamiento local
      await Hive.initFlutter();
      
      // Inicializar servicios offline
      await _initializeOfflineServices();
      
      // Configurar manejo de errores global
      FlutterError.onError = (FlutterErrorDetails details) {
        FlutterError.presentError(details);
        MonitoringService().captureException(
          details.exception,
          stackTrace: details.stack,
          hint: details.context?.toString(),
          level: SentryLevel.error,
        );
      };
      
      // Manejar errores de plataforma
      PlatformDispatcher.instance.onError = (error, stack) {
        MonitoringService().captureException(
          error,
          stackTrace: stack,
          level: SentryLevel.fatal,
        );
        return true;
      };
      
      runApp(const MyApp());
    },
  );
}

Future<void> _initializeOfflineServices() async {
  final logging = LoggingService();
  try {
    logging.info('Inicializando servicios offline');
    // Inicializar servicios en orden
    await ConnectivityService().initialize();
    await OfflineSyncService().initialize();
    await HybridApiService().initialize();
    logging.info('Servicios offline inicializados exitosamente');
  } catch (e, stackTrace) {
    logging.error('Error inicializando servicios offline', error: e, stackTrace: stackTrace);
  }
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // Servicios offline
        ChangeNotifierProvider(create: (_) => ConnectivityService()),
        ChangeNotifierProvider(create: (_) => OfflineSyncService()),
        ChangeNotifierProvider(create: (_) => HybridApiService()),
        
        // ViewModels
        ChangeNotifierProvider(create: (_) => AuthViewModel()),
        ChangeNotifierProvider(create: (_) => NfcViewModel()),
        ChangeNotifierProvider(create: (_) => AdminViewModel()),
        ChangeNotifierProvider(create: (_) => ReportsViewModel()),
        ChangeNotifierProvider(create: (_) => GuardReportsViewModel()),
        ChangeNotifierProvider(create: (_) => StudentStatusViewModel()),
      ],
      child: MaterialApp(
        title: 'Control de Acceso NFC - MVVM',
        theme: ThemeData(
          primarySwatch: Colors.blue,
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
          appBarTheme: AppBarTheme(
            backgroundColor: Colors.blue,
            foregroundColor: Colors.white,
            elevation: 2,
          ),
        ),
        home: LoginView(),
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}
