import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:math';
import '../../viewmodels/admin_viewmodel.dart';
import '../../models/usuario_model.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';
import '../../widgets/status_widgets.dart';
import '../../services/api_service.dart';

/// Vista para registrar nuevos guardias
/// Incluye generación automática de credenciales y validaciones
class RegisterGuardView extends StatefulWidget {
  @override
  _RegisterGuardViewState createState() => _RegisterGuardViewState();
}

class _RegisterGuardViewState extends State<RegisterGuardView> {
  final _formKey = GlobalKey<FormState>();
  final _nombreController = TextEditingController();
  final _apellidoController = TextEditingController();
  final _dniController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _telefonoController = TextEditingController();
  final _puertaController = TextEditingController();

  bool _autoGenerateCredentials = true;
  bool _showPassword = false;
  bool _sendNotification = true;
  String? _generatedEmail;
  String? _generatedPassword;

  @override
  void dispose() {
    _nombreController.dispose();
    _apellidoController.dispose();
    _dniController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _telefonoController.dispose();
    _puertaController.dispose();
    super.dispose();
  }

  /// Genera email automáticamente basado en nombre y apellido
  void _generateEmail() {
    if (_nombreController.text.isEmpty || _apellidoController.text.isEmpty) {
      return;
    }

    final nombre = _nombreController.text.trim().toLowerCase();
    final apellido = _apellidoController.text.trim().toLowerCase();
    
    // Remover acentos y caracteres especiales
    String normalize(String text) {
      return text
          .replaceAll('á', 'a')
          .replaceAll('é', 'e')
          .replaceAll('í', 'i')
          .replaceAll('ó', 'o')
          .replaceAll('ú', 'u')
          .replaceAll('ñ', 'n')
          .replaceAll(RegExp(r'[^a-z0-9]'), '');
    }

    final nombreNormalizado = normalize(nombre);
    final apellidoNormalizado = normalize(apellido);
    
    // Generar email: nombre.apellido@universidad.edu
    final email = '${nombreNormalizado}.${apellidoNormalizado}@universidad.edu';
    
    setState(() {
      _generatedEmail = email;
      _emailController.text = email;
    });
  }

  /// Genera contraseña segura automáticamente
  void _generatePassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#\$%&*';
    final random = Random.secure();
    final password = List.generate(12, (index) => chars[random.nextInt(chars.length)]).join();
    
    setState(() {
      _generatedPassword = password;
      _passwordController.text = password;
    });
  }

  /// Genera credenciales automáticamente
  void _generateCredentials() {
    _generateEmail();
    _generatePassword();
  }

  /// Valida DNI peruano (8 dígitos)
  String? _validateDNI(String? value) {
    if (value == null || value.isEmpty) {
      return 'Ingrese el DNI';
    }
    if (!RegExp(r'^\d{8}$').hasMatch(value)) {
      return 'DNI debe tener 8 dígitos';
    }
    return null;
  }

  /// Valida teléfono peruano
  String? _validateTelefono(String? value) {
    if (value == null || value.isEmpty) {
      return null; // Opcional
    }
    // Formato: 9 dígitos (puede empezar con 9)
    if (!RegExp(r'^9\d{8}$').hasMatch(value)) {
      return 'Teléfono debe tener 9 dígitos y empezar con 9';
    }
    return null;
  }

  /// Valida email
  String? _validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Ingrese el email';
    }
    if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
      return 'Email inválido';
    }
    return null;
  }

  /// Valida contraseña
  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Ingrese la contraseña';
    }
    if (value.length < 8) {
      return 'Mínimo 8 caracteres';
    }
    if (!RegExp(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)').hasMatch(value)) {
      return 'Debe contener mayúsculas, minúsculas y números';
    }
    return null;
  }

  /// Maneja el registro del guardia
  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final adminViewModel = Provider.of<AdminViewModel>(context, listen: false);

    final nuevoGuardia = UsuarioModel(
      id: '', // Se genera en el servidor
      nombre: _nombreController.text.trim(),
      apellido: _apellidoController.text.trim(),
      dni: _dniController.text.trim(),
      email: _emailController.text.trim(),
      password: _passwordController.text,
      rango: 'guardia', // Siempre guardia en este formulario
      estado: 'activo',
      telefono: _telefonoController.text.trim().isEmpty
          ? null
          : _telefonoController.text.trim(),
      puertaACargo: _puertaController.text.trim().isEmpty
          ? null
          : _puertaController.text.trim(),
    );

    // Mostrar diálogo de confirmación con credenciales
    final shouldContinue = await _showCredentialsConfirmation(nuevoGuardia);
    if (!shouldContinue) {
      return;
    }

    // Crear usuario
    final success = await adminViewModel.createUsuario(nuevoGuardia, sendNotification: _sendNotification);

    if (success && mounted) {
      // La notificación se envía automáticamente desde el backend si send_notification es true
      // Mostrar diálogo de éxito con credenciales
      await _showSuccessDialog(nuevoGuardia);
      
      // Limpiar formulario
      _resetForm();
    }
  }

  /// Muestra diálogo de confirmación con credenciales
  Future<bool> _showCredentialsConfirmation(UsuarioModel guardia) async {
    return await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.info_outline, color: Colors.blue),
            SizedBox(width: 8),
            Text('Confirmar Registro'),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Se registrará el siguiente guardia:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 12),
              _buildInfoRow('Nombre', guardia.nombreCompleto),
              _buildInfoRow('DNI', guardia.dni),
              _buildInfoRow('Email', guardia.email),
              SizedBox(height: 8),
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue[200]!),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.lock, size: 16, color: Colors.blue[700]),
                        SizedBox(width: 4),
                        Text(
                          'Contraseña generada:',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.blue[900],
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 4),
                    SelectableText(
                      guardia.password ?? '',
                      style: TextStyle(
                        fontFamily: 'monospace',
                        fontSize: 14,
                        color: Colors.blue[900],
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(height: 12),
              if (_sendNotification)
                Row(
                  children: [
                    Icon(Icons.email, size: 16, color: Colors.green),
                    SizedBox(width: 4),
                    Text(
                      'Se enviará notificación al nuevo usuario',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.green[700],
                      ),
                    ),
                  ],
                ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue[700],
              foregroundColor: Colors.white,
            ),
            child: Text('Confirmar'),
          ),
        ],
      ),
    ) ?? false;
  }

  /// Muestra diálogo de éxito con credenciales
  Future<void> _showSuccessDialog(UsuarioModel guardia) async {
    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green),
            SizedBox(width: 8),
            Text('Guardia Registrado'),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'El guardia ha sido registrado exitosamente.',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 16),
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.amber[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.amber[200]!),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.warning_amber, size: 16, color: Colors.amber[900]),
                        SizedBox(width: 4),
                        Text(
                          'Credenciales del nuevo guardia:',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.amber[900],
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 8),
                    _buildCredentialRow('Email', guardia.email),
                    _buildCredentialRow('Contraseña', guardia.password ?? ''),
                    SizedBox(height: 8),
                    Text(
                      '⚠️ Guarde estas credenciales de forma segura',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.amber[900],
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton.icon(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context); // Cerrar también el formulario
            },
            icon: Icon(Icons.copy),
            label: Text('Copiar Credenciales'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context); // Cerrar también el formulario
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green[700],
              foregroundColor: Colors.white,
            ),
            child: Text('Aceptar'),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              '$label:',
              style: TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }

  Widget _buildCredentialRow(String label, String value) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              '$label:',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.amber[900],
              ),
            ),
          ),
          Expanded(
            child: SelectableText(
              value,
              style: TextStyle(
                fontFamily: 'monospace',
                fontSize: 14,
                color: Colors.amber[900],
              ),
            ),
          ),
        ],
      ),
    );
  }


  /// Resetea el formulario
  void _resetForm() {
    _formKey.currentState?.reset();
    _nombreController.clear();
    _apellidoController.clear();
    _dniController.clear();
    _emailController.clear();
    _passwordController.clear();
    _telefonoController.clear();
    _puertaController.clear();
    setState(() {
      _generatedEmail = null;
      _generatedPassword = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Registrar Nuevo Guardia'),
        backgroundColor: Colors.blue[700],
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Container(
                padding: EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.blue[200]!),
                ),
                child: Column(
                  children: [
                    Icon(Icons.person_add, size: 48, color: Colors.blue[700]),
                    SizedBox(height: 8),
                    Text(
                      'Registro de Nuevo Guardia',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.blue[900],
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Complete el formulario para registrar un nuevo guardia',
                      style: TextStyle(color: Colors.blue[700]),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
              SizedBox(height: 24),

              // Opción de generación automática
              Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.auto_awesome, color: Colors.blue[700]),
                          SizedBox(width: 8),
                          Text(
                            'Generación Automática',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 8),
                      SwitchListTile(
                        value: _autoGenerateCredentials,
                        onChanged: (value) {
                          setState(() {
                            _autoGenerateCredentials = value;
                            if (value) {
                              _generateCredentials();
                            }
                          });
                        },
                        title: Text('Generar credenciales automáticamente'),
                        subtitle: Text(
                          'Email y contraseña se generarán automáticamente',
                        ),
                      ),
                      if (_autoGenerateCredentials) ...[
                        SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: _generateCredentials,
                                icon: Icon(Icons.refresh),
                                label: Text('Regenerar Credenciales'),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              SizedBox(height: 24),

              // Campos del formulario
              Text(
                'Información Personal',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[800],
                ),
              ),
              SizedBox(height: 16),

              CustomTextField(
                label: 'Nombre *',
                controller: _nombreController,
                onChanged: (_autoGenerateCredentials) ? (value) {
                  if (value.isNotEmpty && _apellidoController.text.isNotEmpty) {
                    _generateEmail();
                  }
                } : null,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Ingrese el nombre';
                  }
                  if (value.length < 2) {
                    return 'Nombre debe tener al menos 2 caracteres';
                  }
                  return null;
                },
              ),
              SizedBox(height: 16),

              CustomTextField(
                label: 'Apellido *',
                controller: _apellidoController,
                onChanged: (_autoGenerateCredentials) ? (value) {
                  if (value.isNotEmpty && _nombreController.text.isNotEmpty) {
                    _generateEmail();
                  }
                } : null,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Ingrese el apellido';
                  }
                  if (value.length < 2) {
                    return 'Apellido debe tener al menos 2 caracteres';
                  }
                  return null;
                },
              ),
              SizedBox(height: 16),

              CustomTextField(
                label: 'DNI *',
                controller: _dniController,
                keyboardType: TextInputType.number,
                maxLength: 8,
                validator: _validateDNI,
              ),
              SizedBox(height: 16),

              CustomTextField(
                label: 'Teléfono (Opcional)',
                controller: _telefonoController,
                keyboardType: TextInputType.phone,
                maxLength: 9,
                validator: _validateTelefono,
                helperText: 'Formato: 9XXXXXXXX',
              ),
              SizedBox(height: 24),

              Text(
                'Credenciales de Acceso',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[800],
                ),
              ),
              SizedBox(height: 16),

              CustomTextField(
                label: 'Email *',
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                enabled: !_autoGenerateCredentials,
                validator: _validateEmail,
                suffixIcon: _autoGenerateCredentials
                    ? Icon(Icons.auto_awesome, color: Colors.blue)
                    : null,
              ),
              SizedBox(height: 16),

              CustomTextField(
                label: 'Contraseña *',
                controller: _passwordController,
                isPassword: true,
                enabled: !_autoGenerateCredentials,
                obscureText: !_showPassword,
                validator: _validatePassword,
                suffixIcon: IconButton(
                  icon: Icon(
                    _showPassword ? Icons.visibility : Icons.visibility_off,
                  ),
                  onPressed: () {
                    setState(() {
                      _showPassword = !_showPassword;
                    });
                  },
                ),
                helperText: _autoGenerateCredentials
                    ? 'Contraseña generada automáticamente'
                    : 'Mínimo 8 caracteres, con mayúsculas, minúsculas y números',
              ),
              SizedBox(height: 24),

              Text(
                'Asignación',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[800],
                ),
              ),
              SizedBox(height: 16),

              CustomTextField(
                label: 'Puerta a Cargo (Opcional)',
                controller: _puertaController,
                helperText: 'Puerta o punto de control asignado',
              ),
              SizedBox(height: 24),

              // Opción de notificación
              Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon(Icons.email, color: Colors.green[700]),
                      SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Enviar notificación',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                            Text(
                              'El nuevo guardia recibirá sus credenciales por email',
                              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                            ),
                          ],
                        ),
                      ),
                      Switch(
                        value: _sendNotification,
                        onChanged: (value) {
                          setState(() {
                            _sendNotification = value;
                          });
                        },
                      ),
                    ],
                  ),
                ),
              ),
              SizedBox(height: 24),

              // Botón de registro
              Consumer<AdminViewModel>(
                builder: (context, adminViewModel, child) {
                  return CustomButton(
                    text: 'Registrar Guardia',
                    icon: Icons.person_add,
                    isLoading: adminViewModel.isLoading,
                    onPressed: _handleRegister,
                  );
                },
              ),
              SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}

