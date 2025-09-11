import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../viewmodels/auth_viewmodel.dart';
import '../../viewmodels/admin_viewmodel.dart';

class AdminView extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer2<AuthViewModel, AdminViewModel>(
      builder: (context, authViewModel, adminViewModel, child) {
        
        // RESTRICCIÓN POR ROL - US002: Solo administradores
        if (!authViewModel.isAdmin) {
          return Scaffold(
            appBar: AppBar(
              title: Text('Acceso Denegado'),
            ),
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.access_time,
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
                    'Solo usuarios con rol "Administrador" pueden acceder a esta sección.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => authViewModel.logout(),
                    child: Text('Volver al Login'),
                  ),
                ],
              ),
            ),
          );
        }

        return Scaffold(
          appBar: AppBar(
            title: Text('Panel de Administración'),
            backgroundColor: Theme.of(context).colorScheme.primaryContainer,
            actions: [
              // MOSTRAR ROL ACTUAL - US002
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: Center(
                  child: Chip(
                    avatar: Icon(Icons.admin_panel_settings, size: 18),
                    label: Text('${authViewModel.userRole}'),
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    labelStyle: TextStyle(
                      color: Theme.of(context).colorScheme.onPrimary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              // US005: Opción de cambio de contraseña
              PopupMenuButton<String>(
                icon: Icon(Icons.account_circle),
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
                // Bienvenida con rol
                _buildWelcomeCard(context, authViewModel),
                
                SizedBox(height: 24),
                
                // FUNCIONALIDADES EXCLUSIVAS PARA ADMINISTRADOR - US002
                Text(
                  'Funciones Administrativas',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                
                SizedBox(height: 16),
                
                GridView.count(
                  shrinkWrap: true,
                  physics: NeverScrollableScrollPhysics(),
                  crossAxisCount: 2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  children: [
                    _buildAdminFeatureCard(
                      context,
                      'Gestión de Usuarios',
                      'Administrar usuarios del sistema',
                      Icons.people,
                      () => Navigator.pushNamed(context, '/user-management'),
                    ),
                    _buildAdminFeatureCard(
                      context,
                      'Reportes',
                      'Ver estadísticas y reportes',
                      Icons.analytics,
                      () => Navigator.pushNamed(context, '/reports'),
                    ),
                    _buildAdminFeatureCard(
                      context,
                      'Control NFC',
                      'Supervisar accesos NFC',
                      Icons.nfc,
                      () => Navigator.pushNamed(context, '/user'),
                    ),
                    _buildAdminFeatureCard(
                      context,
                      'Configuración',
                      'Ajustes del sistema',
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
                Icons.admin_panel_settings,
                color: Theme.of(context).colorScheme.onPrimary,
                size: 32,
              ),
            ),
            SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Bienvenido, ${authViewModel.currentUser?.nombre ?? "Administrador"}',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Rol: ${authViewModel.userRole}',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.primary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  Text(
                    'Acceso completo al sistema',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
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

  Widget _buildAdminFeatureCard(
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

  void _showLogoutDialog(BuildContext context, AuthViewModel authViewModel) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Cerrar Sesión'),
        content: Text('¿Estás seguro de que quieres cerrar sesión?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              authViewModel.logout();
              Navigator.pushReplacementNamed(context, '/login');
            },
            child: Text('Cerrar Sesión'),
          ),
        ],
      ),
    );
  }

  void _showComingSoon(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Función próximamente disponible')),
    );
  }
}