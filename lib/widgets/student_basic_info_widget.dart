import 'package:flutter/material.dart';
import '../models/alumno_model.dart';
import '../config/api_config.dart';
import 'package:cached_network_image/cached_network_image.dart';

/// Widget reutilizable para mostrar datos básicos del estudiante
/// Muestra: nombre, foto, carrera, ID claramente visible
class StudentBasicInfoWidget extends StatelessWidget {
  final AlumnoModel estudiante;
  final bool showStatusBadge;
  final EdgeInsets? padding;
  final double? photoSize;
  final VoidCallback? onTap;

  const StudentBasicInfoWidget({
    Key? key,
    required this.estudiante,
    this.showStatusBadge = true,
    this.padding,
    this.photoSize,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isTablet = size.width > 600;
    final photoSizeValue = photoSize ?? (isTablet ? 120.0 : 100.0);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: padding ?? EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: estudiante.isActive ? Colors.green[200]! : Colors.grey[300]!,
            width: 2,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.1),
              spreadRadius: 2,
              blurRadius: 8,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            // Foto y nombre
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Foto del estudiante
                _buildStudentPhoto(photoSizeValue),
                SizedBox(width: 16),
                // Información del estudiante
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Nombre completo
                      Text(
                        estudiante.nombreCompleto,
                        style: TextStyle(
                          fontSize: isTablet ? 24 : 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey[900],
                          height: 1.2,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      SizedBox(height: 8),
                      // ID claramente visible
                      _buildIdDisplay(context, isTablet),
                      SizedBox(height: 8),
                      // Carrera
                      _buildCareerInfo(context, isTablet),
                      if (showStatusBadge) ...[
                        SizedBox(height: 8),
                        _buildStatusBadge(context),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  /// Construye la foto del estudiante
  Widget _buildStudentPhoto(double size) {
    // URL de la foto (puede venir del backend o ser null)
    final photoUrl = _getStudentPhotoUrl();

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: estudiante.isActive ? Colors.green[400]! : Colors.grey[400]!,
          width: 3,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.3),
            spreadRadius: 2,
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: ClipOval(
        child: photoUrl != null
            ? CachedNetworkImage(
                imageUrl: photoUrl,
                fit: BoxFit.cover,
                placeholder: (context, url) => _buildPhotoPlaceholder(),
                errorWidget: (context, url, error) => _buildPhotoPlaceholder(),
              )
            : _buildPhotoPlaceholder(),
      ),
    );
  }

  /// Construye el placeholder de la foto
  Widget _buildPhotoPlaceholder() {
    return Container(
      color: estudiante.isActive ? Colors.green[50] : Colors.grey[200],
      child: Center(
        child: Icon(
          Icons.person,
          size: 50,
          color: estudiante.isActive ? Colors.green[400] : Colors.grey[400],
        ),
      ),
    );
  }

  /// Construye el display del ID (código universitario)
  Widget _buildIdDisplay(BuildContext context, bool isTablet) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.blue[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: Colors.blue[300]!,
          width: 2,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.badge,
            size: isTablet ? 20 : 18,
            color: Colors.blue[700],
          ),
          SizedBox(width: 8),
          Text(
            'ID: ${estudiante.codigoUniversitario}',
            style: TextStyle(
              fontSize: isTablet ? 18 : 16,
              fontWeight: FontWeight.bold,
              color: Colors.blue[900],
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  /// Construye la información de carrera
  Widget _buildCareerInfo(BuildContext context, bool isTablet) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Facultad
        Row(
          children: [
            Icon(
              Icons.school,
              size: isTablet ? 18 : 16,
              color: Colors.grey[600],
            ),
            SizedBox(width: 6),
            Expanded(
              child: Text(
                estudiante.facultad,
                style: TextStyle(
                  fontSize: isTablet ? 16 : 14,
                  color: Colors.grey[700],
                  fontWeight: FontWeight.w500,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        SizedBox(height: 4),
        // Escuela profesional
        Row(
          children: [
            Icon(
              Icons.workspace_premium,
              size: isTablet ? 18 : 16,
              color: Colors.grey[600],
            ),
            SizedBox(width: 6),
            Expanded(
              child: Text(
                estudiante.escuelaProfesional,
                style: TextStyle(
                  fontSize: isTablet ? 16 : 14,
                  color: Colors.grey[700],
                  fontWeight: FontWeight.w500,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        // Siglas
        SizedBox(height: 4),
        Text(
          '${estudiante.siglasFacultad} - ${estudiante.siglasEscuela}',
          style: TextStyle(
            fontSize: isTablet ? 14 : 12,
            color: Colors.grey[500],
            fontStyle: FontStyle.italic,
          ),
        ),
      ],
    );
  }

  /// Construye el badge de estado
  Widget _buildStatusBadge(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: estudiante.isActive ? Colors.green[100] : Colors.red[100],
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: estudiante.isActive ? Colors.green[400]! : Colors.red[400]!,
          width: 1.5,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: estudiante.isActive ? Colors.green[600] : Colors.red[600],
            ),
          ),
          SizedBox(width: 6),
          Text(
            estudiante.isActive ? 'Activo' : 'Inactivo',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: estudiante.isActive ? Colors.green[800] : Colors.red[800],
            ),
          ),
        ],
      ),
    );
  }

  /// Obtiene la URL de la foto del estudiante
  /// Puede venir del backend o construirse desde el código universitario
  String? _getStudentPhotoUrl() {
    // Si el estudiante tiene una foto_url en el modelo, usarla
    if (estudiante.fotoUrl != null && estudiante.fotoUrl!.isNotEmpty) {
      // Si es una URL completa, retornarla directamente
      if (estudiante.fotoUrl!.startsWith('http')) {
        return estudiante.fotoUrl;
      }
      // Si es una ruta relativa, construir la URL completa
      return '${ApiConfig.baseUrl}${estudiante.fotoUrl}';
    }
    
    // Intentar construir desde el código universitario
    // Ejemplo: Si el backend tiene un endpoint para fotos
    // return '${ApiConfig.baseUrl}/alumnos/${estudiante.codigoUniversitario}/foto';
    
    // Por ahora retornamos null para usar el placeholder
    return null;
  }
}

/// Versión compacta del widget para usar en listas
class StudentBasicInfoCompactWidget extends StatelessWidget {
  final AlumnoModel estudiante;
  final VoidCallback? onTap;

  const StudentBasicInfoCompactWidget({
    Key? key,
    required this.estudiante,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isTablet = size.width > 600;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: estudiante.isActive ? Colors.green[200]! : Colors.grey[300]!,
            width: 1.5,
          ),
        ),
        child: Row(
          children: [
            // Foto compacta
            Container(
              width: isTablet ? 60 : 50,
              height: isTablet ? 60 : 50,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: estudiante.isActive ? Colors.green[400]! : Colors.grey[400]!,
                  width: 2,
                ),
              ),
              child: ClipOval(
                child: Container(
                  color: estudiante.isActive ? Colors.green[50] : Colors.grey[200],
                  child: Icon(
                    Icons.person,
                    size: isTablet ? 30 : 25,
                    color: estudiante.isActive ? Colors.green[400] : Colors.grey[400],
                  ),
                ),
              ),
            ),
            SizedBox(width: 12),
            // Información compacta
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    estudiante.nombreCompleto,
                    style: TextStyle(
                      fontSize: isTablet ? 18 : 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey[900],
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  SizedBox(height: 4),
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.blue[50],
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: Colors.blue[300]!,
                        width: 1,
                      ),
                    ),
                    child: Text(
                      'ID: ${estudiante.codigoUniversitario}',
                      style: TextStyle(
                        fontSize: isTablet ? 14 : 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.blue[900],
                      ),
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    estudiante.escuelaProfesional,
                    style: TextStyle(
                      fontSize: isTablet ? 14 : 12,
                      color: Colors.grey[600],
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            // Badge de estado
            Container(
              padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: estudiante.isActive ? Colors.green[100] : Colors.red[100],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                estudiante.isActive ? 'Activo' : 'Inactivo',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: estudiante.isActive ? Colors.green[800] : Colors.red[800],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

