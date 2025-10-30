'use strict';

const fs = require('fs');
const path = require('path');

function extractRoutesFromSource(source) {
  const routes = [];
  // Regex simple para capturar app.METHOD('/ruta'
  const routeRegex = /app\.(get|post|put|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  let match;
  while ((match = routeRegex.exec(source)) !== null) {
    const method = match[1].toUpperCase();
    const route = match[2];
    // Ignorar assets estáticos
    if (route.startsWith('/public')) continue;
    routes.push({ method, route });
  }

  // Quitar duplicados conservando orden
  const seen = new Set();
  const unique = [];
  for (const r of routes) {
    const key = `${r.method} ${r.route}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(r);
    }
  }
  return unique;
}

function groupRoutes(routes) {
  // Agrupar por primer segmento (/ml/..., /usuarios, etc.)
  const groups = {};
  for (const r of routes) {
    const seg = r.route.split('/').filter(Boolean);
    const group = seg.length ? seg[0] : 'root';
    if (!groups[group]) groups[group] = [];
    groups[group].push(r);
  }
  // Ordenar rutas por path
  Object.values(groups).forEach(arr => arr.sort((a, b) => a.route.localeCompare(b.route)));
  return groups;
}

function renderMarkdown(baseUrlProd, baseUrlDev, groups) {
  const header = `# Documentación de API\n\n## Base URL\n\n\`\`\`\nProducción: ${baseUrlProd}\nDesarrollo: ${baseUrlDev}\n\`\`\`\n\n`;
  const authNote = `> Nota: Algunas rutas pueden requerir autenticación y validaciones adicionales.\n\n`;

  const sections = Object.keys(groups).sort().map(groupName => {
    const items = groups[groupName].map(r => `- **${r.method}** \\ \`${r.route}\``).join('\n');
    return `## ${groupName}\n\n${items}\n`;
  }).join('\n');

  const status = `\n## Códigos de Estado\n\n- \`200\`: Éxito\n- \`201\`: Creado\n- \`400\`: Error de validación\n- \`401\`: No autorizado\n- \`404\`: No encontrado\n- \`500\`: Error del servidor\n`;

  return header + authNote + sections + status;
}

function main() {
  const backendIndex = path.resolve(__dirname, '..', 'index.js');
  const docsPath = path.resolve(__dirname, '..', '..', 'docs', 'API.md');

  if (!fs.existsSync(backendIndex)) {
    console.error('No se encontró backend/index.js');
    process.exit(1);
  }

  const src = fs.readFileSync(backendIndex, 'utf8');
  const routes = extractRoutesFromSource(src);
  const groups = groupRoutes(routes);

  const baseProd = 'https://tu-backend.onrender.com';
  const baseDev = 'http://localhost:3000';
  const md = renderMarkdown(baseProd, baseDev, groups);

  // Asegurar carpeta docs
  const docsDir = path.dirname(docsPath);
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

  fs.writeFileSync(docsPath, md, 'utf8');
  console.log(`Docs generadas en: ${docsPath}`);
}

main();


