import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../viewmodels/auth_viewmodel.dart';
import '../widgets/custom_text_field.dart';
import '../widgets/custom_button.dart';

class ChangePasswordView extends StatefulWidget {
  @override
  _ChangePasswordViewState createState() => _ChangePasswordViewState();
}

class _ChangePasswordViewState extends State<ChangePasswordView> {
  final _formKey = GlobalKey<FormState>();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  
  bool _showCurrentPassword = false;
  bool _showNewPassword = false;
  bool _showConfirmPassword = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Cambiar Contraseña'),
        backgroundColor: Theme.of(context).colorScheme.primaryContainer,
        elevation: 0,
      ),
      body: Consumer<AuthViewModel>(
        builder: (context, authViewModel, child) {
          return SingleChildScrollView(
            padding: EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header con información del usuario
                  _buildUserInfoCard(context, authViewModel),
                  
                  SizedBox(height: 24),
                  
                  // Título y descripción
                  Text(
                    'Cambio de Contraseña',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Por tu seguridad, ingresa tu contraseña actual antes de crear una nueva.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                  
                  SizedBox(height: 24),

                  // Contraseña actual
                  CustomTextField(
                    controller: _currentPasswordController,
                    labelText: 'Contraseña Actual',
                    prefixIcon: Icons.lock_outline,
                    obscureText: !_showCurrentPassword,
                    suffixIcon: _showCurrentPassword ? Icons.visibility_off : Icons.visibility,
                    onSuffixIconPressed: () {
                      setState(() {
                        _showCurrentPassword = !_showCurrentPassword;
                      });
                    },
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Por favor ingresa tu contraseña actual';
                      }
                      return null;
                    },
                  ),

                  SizedBox(height: 16),

                  // Nueva contraseña
                  CustomTextField(
                    controller: _newPasswordController,
                    labelText: 'Nueva Contraseña',
                    prefixIcon: Icons.lock,
                    obscureText: !_showNewPassword,
                    suffixIcon: _showNewPassword ? Icons.visibility_off : Icons.visibility,
                    onSuffixIconPressed: () {
                      setState(() {
                        _showNewPassword = !_showNewPassword;
                      });
                    },
                    onChanged: (value) {
                      setState(() {}); // Actualizar indicador de fortaleza
                    },
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Por favor ingresa una nueva contraseña';
                      }
                      if (!authViewModel.isPasswordSecure(value)) {
                        return 'La contraseña no cumple los requisitos de seguridad';
                      }
                      return null;
                    },
                  ),

                  SizedBox(height: 8),

                  // Indicador de fortaleza de contraseña
                  _buildPasswordStrengthIndicator(authViewModel),

                  SizedBox(height: 16),

                  // Confirmar nueva contraseña
                  CustomTextField(
                    controller: _confirmPasswordController,
                    labelText: 'Confirmar Nueva Contraseña',
                    prefixIcon: Icons.lock_clock,
                    obscureText: !_showConfirmPassword,
                    suffixIcon: _showConfirmPassword ? Icons.visibility_off : Icons.visibility,
                    onSuffixIconPressed: () {
                      setState(() {
                        _showConfirmPassword = !_showConfirmPassword;
                      });
                    },
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Por favor confirma tu nueva contraseña';
                      }
                      if (value != _newPasswordController.text) {
                        return 'Las contraseñas no coinciden';
                      }
                      return null;
                    },
                  ),

                  SizedBox(height: 24),

                  // Requisitos de contraseña
                  _buildPasswordRequirements(context, authViewModel),

                  SizedBox(height: 32),

                  // Botones
                  Row(
                    children: [
                      Expanded(
                        child: TextButton(
                          onPressed: authViewModel.isLoading ? null : () {
                            Navigator.pop(context);
                          },
                          child: Text('Cancelar'),
                        ),
                      ),
                      SizedBox(width: 16),
                      Expanded(
                        child: CustomButton(
                          text: 'Cambiar Contraseña',
                          isLoading: authViewModel.isLoading,
                          icon: Icons.security,
                          onPressed: () => _handleChangePassword(context, authViewModel),
                        ),
                      ),
                    ],
                  ),

                  // Mostrar errores
                  if (authViewModel.errorMessage != null) ...[
                    SizedBox(height: 16),
                    Card(
                      color: Theme.of(context).colorScheme.errorContainer,
                      child: Padding(
                        padding: EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Icon(
                              Icons.error,
                              color: Theme.of(context).colorScheme.error,
                            ),
                            SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                authViewModel.errorMessage!,
                                style: TextStyle(
                                  color: Theme.of(context).colorScheme.error,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildUserInfoCard(BuildContext context, AuthViewModel authViewModel) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: Theme.of(context).colorScheme.primary,
              child: Icon(
                Icons.person,
                color: Colors.white,
              ),
            ),
            SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    authViewModel.currentUser?.nombre ?? 'Usuario',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    authViewModel.currentUser?.email ?? '',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            Chip(
              label: Text(authViewModel.userRole),
              backgroundColor: Theme.of(context).colorScheme.primary,
              labelStyle: TextStyle(color: Colors.white),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPasswordStrengthIndicator(AuthViewModel authViewModel) {
    final password = _newPasswordController.text;
    final isSecure = authViewModel.isPasswordSecure(password);
    
    return AnimatedContainer(
      duration: Duration(milliseconds: 300),
      child: Row(
        children: [
          Icon(
            isSecure ? Icons.check_circle : Icons.cancel,
            size: 16,
            color: isSecure ? Colors.green : Colors.red,
          ),
          SizedBox(width: 8),
          Text(
            isSecure ? 'Contraseña segura' : 'Contraseña débil',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: isSecure ? Colors.green : Colors.red,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPasswordRequirements(BuildContext context, AuthViewModel authViewModel) {
    return Card(
      color: Theme.of(context).colorScheme.surfaceVariant,
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.info_outline,
                  size: 20,
                  color: Theme.of(context).colorScheme.primary,
                ),
                SizedBox(width: 8),
                Text(
                  'Requisitos de Contraseña',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            SizedBox(height: 8),
            Text(
              authViewModel.getPasswordRequirements(),
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// US005: Manejar cambio de contraseña con validaciones
  Future<void> _handleChangePassword(BuildContext context, AuthViewModel authViewModel) async {
    if (!_formKey.currentState!.validate()) return;

    final success = await authViewModel.changePassword(
      _currentPasswordController.text,
      _newPasswordController.text,
    );

    if (success && mounted) {
      // Mostrar éxito y cerrar
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              Icon(Icons.check_circle, color: Colors.white),
              SizedBox(width: 8),
              Text('Contraseña cambiada exitosamente'),
            ],
          ),
          backgroundColor: Colors.green,
          duration: Duration(seconds: 3),
        ),
      );
      
      Navigator.pop(context);
    }
  }

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }
}
