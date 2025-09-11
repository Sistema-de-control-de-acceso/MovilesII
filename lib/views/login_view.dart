import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../viewmodels/auth_viewmodel.dart';
import '../widgets/custom_text_field.dart';
import '../widgets/custom_button.dart';
import 'admin/admin_view.dart';
import 'user/user_nfc_view.dart';

class LoginView extends StatefulWidget {
  @override
  _LoginViewState createState() => _LoginViewState();
}

class _LoginViewState extends State<LoginView> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      body: SafeArea(
        child: Consumer<AuthViewModel>(
          builder: (context, authViewModel, child) {
            return Center(
              child: SingleChildScrollView(
                padding: EdgeInsets.all(24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Logo o título
                      Card(
                        elevation: 4,
                        child: Padding(
                          padding: EdgeInsets.all(24),
                          child: Column(
                            children: [
                              Icon(
                                Icons.security,
                                size: 64,
                                color: Theme.of(context).colorScheme.primary,
                              ),
                              SizedBox(height: 16),
                              Text(
                                'Control de Acceso NFC',
                                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              SizedBox(height: 8),
                              Text(
                                'Sistema de autenticación por roles',
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                      ),

                      SizedBox(height: 32),

                      // Formulario de login
                      CustomTextField(
                        controller: _emailController,
                        labelText: 'Email',
                        prefixIcon: Icons.email,
                        keyboardType: TextInputType.emailAddress,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Por favor ingresa tu email';
                          }
                          if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                            return 'Por favor ingresa un email válido';
                          }
                          return null;
                        },
                      ),

                      SizedBox(height: 16),

                      CustomTextField(
                        controller: _passwordController,
                        labelText: 'Contraseña',
                        prefixIcon: Icons.lock,
                        obscureText: true,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Por favor ingresa tu contraseña';
                          }
                          return null;
                        },
                      ),

                      SizedBox(height: 24),

                      // Botón de login
                      SizedBox(
                        width: double.infinity,
                        child: CustomButton(
                          text: 'Iniciar Sesión',
                          isLoading: authViewModel.isLoading,
                          onPressed: () => _handleLogin(context, authViewModel),
                        ),
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
              ),
            );
          },
        ),
      ),
    );
  }

  // FUNCIONALIDAD PRINCIPAL US002: Navegación adaptativa basada en rol
  Future<void> _handleLogin(BuildContext context, AuthViewModel authViewModel) async {
    if (!_formKey.currentState!.validate()) return;

    final success = await authViewModel.login(
      _emailController.text.trim(),
      _passwordController.text,
    );

    if (success && mounted) {
      // Navegación adaptativa según rol identificado post-login
      if (authViewModel.isAdmin) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => AdminView()),
        );
      } else if (authViewModel.isGuardia) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => UserNfcView()),
        );
      } else {
        // Rol no reconocido o sin permisos
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                Icon(Icons.warning, color: Colors.white),
                SizedBox(width: 8),
                Expanded(
                  child: Text('Rol no reconocido. Contacte al administrador.'),
                ),
              ],
            ),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
        authViewModel.logout(); // Logout automático por seguridad
      }
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}