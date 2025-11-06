/**
 * Generador de Documentación Unificada de API
 * Genera documentación compatible con web y app móvil
 */

const fs = require('fs').promises;
const path = require('path');

class ApiDocumentationGenerator {
  constructor() {
    this.endpoints = [];
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  }

  /**
   * Registra un endpoint para documentación
   */
  registerEndpoint(endpoint) {
    this.endpoints.push(endpoint);
  }

  /**
   * Genera documentación en formato Markdown
   */
  async generateMarkdown(outputPath) {
    const sections = [
      this.generateHeader(),
      this.generateOverview(),
      this.generateAuthentication(),
      this.generateEndpointsByCategory(),
      this.generateResponseFormats(),
      this.generateErrorCodes(),
      this.generateClientCompatibility(),
      this.generateExamples()
    ];

    const content = sections.join('\n\n');
    await fs.writeFile(outputPath, content, 'utf8');
    return outputPath;
  }

  /**
   * Genera documentación en formato OpenAPI/Swagger
   */
  async generateOpenAPI(outputPath) {
    const openApi = {
      openapi: '3.0.0',
      info: {
        title: 'API Unificada - Sistema de Asistencia',
        version: '1.0.0',
        description: 'API unificada para web y app móvil'
      },
      servers: [
        {
          url: this.baseUrl,
          description: 'Servidor de desarrollo'
        },
        {
          url: 'https://movilesii.onrender.com',
          description: 'Servidor de producción'
        }
      ],
      paths: this.generateOpenAPIPaths(),
      components: {
        schemas: this.generateOpenAPISchemas(),
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    };

    await fs.writeFile(outputPath, JSON.stringify(openApi, null, 2), 'utf8');
    return outputPath;
  }

  /**
   * Genera header de documentación
   */
  generateHeader() {
    return `# API Unificada - Sistema de Asistencia

## 📋 Descripción

API REST unificada para consumo desde aplicación web y aplicación móvil Flutter. Todos los endpoints son compatibles con ambos clientes.

**Base URL**: \`${this.baseUrl}\`

**Versión**: 1.0.0

**Última actualización**: ${new Date().toISOString()}`;
  }

  /**
   * Genera sección de overview
   */
  generateOverview() {
    return `## 📖 Overview

Esta API proporciona endpoints unificados para:

- ✅ **Aplicación Web**: Consumo desde navegadores web
- ✅ **Aplicación Móvil**: Consumo desde app Flutter (iOS/Android)

### Características

- **RESTful**: Todos los endpoints siguen principios REST
- **JSON**: Todas las respuestas en formato JSON
- **CORS**: Configurado para permitir requests desde web y móvil
- **Autenticación**: Sistema de autenticación unificado
- **Versionado**: Preparado para versionado de API

### Compatibilidad

| Cliente | Estado | Notas |
|---------|--------|-------|
| Web | ✅ Compatible | CORS configurado |
| Mobile (Flutter) | ✅ Compatible | Headers personalizados soportados |
| Postman/Insomnia | ✅ Compatible | Sin restricciones |
`;
  }

  /**
   * Genera sección de autenticación
   */
  generateAuthentication() {
    return `## 🔐 Autenticación

### Login

\`\`\`http
POST /login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "contraseña"
}
\`\`\`

**Respuesta exitosa**:
\`\`\`json
{
  "user": {
    "_id": "user_id",
    "nombre": "Nombre",
    "email": "usuario@example.com",
    "rango": "guardia"
  },
  "token": "jwt_token_here"
}
\`\`\`

### Headers de Autenticación

Para endpoints protegidos, incluir el token en el header:

\`\`\`http
Authorization: Bearer <token>
\`\`\`

### Headers de Cliente

Opcionalmente, especificar el tipo de cliente:

\`\`\`http
X-Client-Type: web|mobile
X-Device-ID: device_unique_id
\`\`\`
`;
  }

  /**
   * Genera endpoints agrupados por categoría
   */
  generateEndpointsByCategory() {
    const categories = this.groupEndpointsByCategory();
    let content = '## 📚 Endpoints\n\n';

    for (const [category, endpoints] of Object.entries(categories)) {
      content += `### ${category}\n\n`;
      
      for (const endpoint of endpoints) {
        content += this.formatEndpoint(endpoint);
      }
    }

    return content;
  }

  /**
   * Agrupa endpoints por categoría
   */
  groupEndpointsByCategory() {
    const categories = {};

    for (const endpoint of this.endpoints) {
      const category = endpoint.category || 'Otros';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(endpoint);
    }

    return categories;
  }

  /**
   * Formatea un endpoint para documentación
   */
  formatEndpoint(endpoint) {
    let content = `#### ${endpoint.method} ${endpoint.path}\n\n`;
    
    if (endpoint.description) {
      content += `${endpoint.description}\n\n`;
    }

    if (endpoint.parameters && endpoint.parameters.length > 0) {
      content += '**Parámetros**:\n\n';
      content += '| Parámetro | Tipo | Requerido | Descripción |\n';
      content += '|-----------|------|-----------|-------------|\n';
      
      for (const param of endpoint.parameters) {
        content += `| ${param.name} | ${param.type} | ${param.required ? 'Sí' : 'No'} | ${param.description || ''} |\n`;
      }
      content += '\n';
    }

    if (endpoint.requestBody) {
      content += '**Body**:\n\n';
      content += '```json\n';
      content += JSON.stringify(endpoint.requestBody, null, 2);
      content += '\n```\n\n';
    }

    if (endpoint.response) {
      content += '**Respuesta**:\n\n';
      content += '```json\n';
      content += JSON.stringify(endpoint.response, null, 2);
      content += '\n```\n\n';
    }

    if (endpoint.compatible) {
      const clients = [];
      if (endpoint.compatible.web) clients.push('Web');
      if (endpoint.compatible.mobile) clients.push('Mobile');
      content += `**Compatible con**: ${clients.join(', ')}\n\n`;
    }

    content += '---\n\n';
    return content;
  }

  /**
   * Genera sección de formatos de respuesta
   */
  generateResponseFormats() {
    return `## 📦 Formatos de Respuesta

### Respuesta Exitosa

Todos los endpoints devuelven respuestas en formato JSON:

\`\`\`json
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa"
}
\`\`\`

### Respuesta con Lista

\`\`\`json
{
  "success": true,
  "data": [ ... ],
  "total": 100,
  "limit": 20,
  "skip": 0
}
\`\`\`

### Respuesta de Error

\`\`\`json
{
  "success": false,
  "error": "Mensaje de error",
  "details": "Detalles adicionales del error"
}
\`\`\`
`;
  }

  /**
   * Genera sección de códigos de error
   */
  generateErrorCodes() {
    return `## ❌ Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado exitosamente |
| 400 | Bad Request - Error en la solicitud |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - No autorizado |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |
`;
  }

  /**
   * Genera sección de compatibilidad de clientes
   */
  generateClientCompatibility() {
    return `## 🔄 Compatibilidad de Clientes

### Web

- **CORS**: Configurado para permitir requests desde cualquier origen en desarrollo
- **Headers**: Soporta headers estándar de navegadores
- **Cookies**: Soporta cookies para sesiones (opcional)

### Mobile (Flutter)

- **Headers personalizados**: Soporta \`X-Client-Type: mobile\`
- **Device ID**: Soporta \`X-Device-ID\` para identificación de dispositivo
- **Offline**: La app móvil tiene soporte offline con sincronización

### Ejemplo de Request desde Flutter

\`\`\`dart
final response = await http.post(
  Uri.parse('\${ApiConfig.baseUrl}/asistencias'),
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Type': 'mobile',
    'X-Device-ID': deviceId,
  },
  body: jsonEncode(data),
);
\`\`\`

### Ejemplo de Request desde Web

\`\`\`javascript
fetch('\${this.baseUrl}/asistencias', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Type': 'web',
  },
  body: JSON.stringify(data),
});
\`\`\`
`;
  }

  /**
   * Genera sección de ejemplos
   */
  generateExamples() {
    return `## 💡 Ejemplos

### Ejemplo: Crear Asistencia

**Request**:
\`\`\`http
POST /asistencias
Content-Type: application/json
X-Client-Type: mobile

{
  "nombre": "Juan",
  "apellido": "Pérez",
  "dni": "12345678",
  "codigo_universitario": "20201234",
  "tipo": "entrada",
  "puerta": "Puerta Principal",
  "guardia_id": "guardia_id",
  "guardia_nombre": "Carlos López"
}
\`\`\`

**Response**:
\`\`\`json
{
  "success": true,
  "asistencia": {
    "_id": "asistencia_id",
    "nombre": "Juan",
    "apellido": "Pérez",
    "fecha_hora": "2024-01-15T08:00:00Z",
    ...
  }
}
\`\`\`
`;
  }

  /**
   * Genera paths para OpenAPI
   */
  generateOpenAPIPaths() {
    const paths = {};

    for (const endpoint of this.endpoints) {
      const path = endpoint.path.replace(/:(\w+)/g, '{$1}');
      if (!paths[path]) {
        paths[path] = {};
      }

      paths[path][endpoint.method.toLowerCase()] = {
        summary: endpoint.description || '',
        tags: [endpoint.category || 'Otros'],
        parameters: endpoint.parameters?.map(p => ({
          name: p.name,
          in: p.in || 'query',
          required: p.required,
          schema: { type: p.type },
          description: p.description
        })) || [],
        requestBody: endpoint.requestBody ? {
          required: true,
          content: {
            'application/json': {
              schema: endpoint.requestBody
            }
          }
        } : undefined,
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: endpoint.response || {}
              }
            }
          }
        }
      };
    }

    return paths;
  }

  /**
   * Genera schemas para OpenAPI
   */
  generateOpenAPISchemas() {
    return {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
          details: { type: 'string' }
        }
      },
      Success: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' }
        }
      }
    };
  }
}

module.exports = ApiDocumentationGenerator;

