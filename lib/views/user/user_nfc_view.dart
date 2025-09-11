import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../viewmodels/auth_viewmodel.dart';
import '../../viewmodels/nfc_viewmodel.dart';

class UserNfcView extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer2<AuthViewModel, NfcViewModel>(
      builder: (context, authViewModel, nfcViewModel, child) {
        
        // US002: Restricción de acceso - Solo Guardias y Administradores
        if (!authViewModel.hasGuardPermissions) {
          return Scaffold(
            appBar: AppBar(
              title: Text('Acceso Denegado'),
            ),
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.block,
                    size: 64,
                    color: Theme.of(context).colorScheme.error,
                  ),
                  SizedBox(height: 16),
                  Text(
                    'Acceso Restringido',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: Theme.of(context).colorScheme.error,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Solo usuarios con rol "Guardia" o "Administrador" pueden acceder al control NFC.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => _showLogoutDialog(context, authViewModel),
                    child: Text('Cerrar Sesión'),
                  ),
                ],
              ),
            ),
          );
        }

        return Scaffold(
          appBar: AppBar(
            title: Text('Control de Acceso NFC'),
            backgroundColor: Theme.of(context).colorScheme.primaryContainer,
            actions: [
              // US002: Mostrar rol actual del usuario
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: Center(
                  child: Chip(
                    avatar: Icon(
                      authViewModel.isGuardia ? Icons.security : Icons.admin_panel_settings,
                      size: 18,
                    ),
                    label: Text('${authViewModel.userRole}'),
                    backgroundColor: authViewModel.isGuardia 
                        ? Colors.green 
                        : Theme.of(context).colorScheme.primary,
                    labelStyle: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              // US005: Menú de usuario con cambio de contraseña
              PopupMenuButton<String>(
                icon: Icon(Icons.account_circle),
                tooltip: 'Opciones de Usuario',
                onSelected: (value) {
                  switch (value) {
                    case 'change_password':
                      Navigator.pushNamed(context, '/change-password');
                      break;
                    case 'logout':
                      _showLogoutDialog(context, authViewModel);
                      break;
                  }
                },
                itemBuilder: (context) => [
                  PopupMenuItem(
                    value: 'change_password',
                    child: Row(
                      children: [
                        Icon(Icons.lock, size: 20),
                        SizedBox(width: 8),
                        Text('Cambiar Contraseña'),
                      ],
                    ),
                  ),
                  PopupMenuDivider(),
                  PopupMenuItem(
                    value: 'logout',
                    child: Row(
                      children: [
                        Icon(Icons.logout, size: 20, color: Colors.red),
                        SizedBox(width: 8),
                        Text('Cerrar Sesión', style: TextStyle(color: Colors.red)),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
          body: SingleChildScrollView(
            padding: EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Bienvenida personalizada por rol
                _buildWelcomeCard(context, authViewModel),
                
                SizedBox(height: 24),
                
                // Funciones disponibles según rol
                Text(
                  'Funciones Disponibles',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                
                SizedBox(height: 16),
                
                // Cards de funcionalidades
                GridView.count(
                  shrinkWrap: true,
                  physics: NeverScrollableScrollPhysics(),
                  crossAxisCount: 2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  children: [
                    _buildFeatureCard(
                      context,
                      'Leer NFC',
                      'Escanear tarjetas NFC',
                      Icons.nfc,
                      () => _handleNfcScan(context, nfcViewModel),
                    ),
                    _buildFeatureCard(
                      context,
                      'Historial',
                      'Ver últimos accesos',
                      Icons.history,
                      () => _showComingSoon(context),
                    ),
                    // Solo para administradores
                    if (authViewModel.isAdmin) ...[
                      _buildFeatureCard(
                        context,
                        'Admin Panel',
                        'Panel administrativo',
                        Icons.admin_panel_settings,
                        () => Navigator.pushNamed(context, '/admin'),
                      ),
                    ],
                    _buildFeatureCard(
                      context,
                      'Configuración',
                      'Ajustes personales',
                      Icons.settings,
                      () => _showComingSoon(context),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildWelcomeCard(BuildContext context, AuthViewModel authViewModel) {
    return Card(
      elevation: 4,
      child: Padding(
        padding: EdgeInsets.all(20),
        child: Row(
          children: [
            CircleAvatar(
              radius: 30,
              backgroundColor: Theme.of(context).colorScheme.primary,
              child: Icon(
                authViewModel.isGuardia ? Icons.security : Icons.admin_panel_settings,
                size: 32,
                color: Colors.white,
              ),
            ),
            SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Bienvenido, ${authViewModel.currentUser?.nombre ?? "Usuario"}',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    authViewModel.getRoleDescription(),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureCard(
    BuildContext context,
    String title,
    String subtitle,
    IconData icon,
    VoidCallback onTap,
  ) {
    return Card(
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 48,
                color: Theme.of(context).colorScheme.primary,
              ),
              SizedBox(height: 12),
              Text(
                title,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              SizedBox(height: 4),
              Text(
                subtitle,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _handleNfcScan(BuildContext context, NfcViewModel nfcViewModel) {
    // Funcionalidad de escaneo NFC - placeholder
    _showComingSoon(context);
  }

  // US003: Dialog de logout seguro
  void _showLogoutDialog(BuildContext context, AuthViewModel authViewModel) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.logout, color: Theme.of(context).colorScheme.error),
            SizedBox(width: 8),
            Text('Cerrar Sesión'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('¿Estás seguro de que quieres cerrar sesión?'),
            SizedBox(height: 8),
            Text(
              'Perderás el acceso a todas las funcionalidades del sistema.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('Cancelar'),
          ),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.of(context).pop();
              authViewModel.logout();
              Navigator.pushReplacementNamed(context, '/login');
            },
            icon: Icon(Icons.logout),
            label: Text('Cerrar Sesión'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  void _showComingSoon(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(Icons.construction, color: Colors.white),
            SizedBox(width: 8),
            Text('Función próximamente disponible'),
          ],
        ),
        backgroundColor: Colors.orange,
      ),
    );
  }
}
