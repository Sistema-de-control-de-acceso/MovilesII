// Script Node.js para auditar workflows de GitHub Actions
// Lista los archivos de workflows y verifica pasos clave

const fs = require('fs');
const path = require('path');

const workflowsDir = path.join(__dirname, '..', '..', '..', '..', '.github', 'workflows');

if (!fs.existsSync(workflowsDir)) {
  console.error('No se encontró la carpeta .github/workflows');
  process.exit(1);
}

const files = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));

files.forEach(file => {
  const content = fs.readFileSync(path.join(workflowsDir, file), 'utf8');
  console.log(`\n--- ${file} ---`);
  if (/test|lint|deploy/i.test(content)) {
    console.log('Incluye pasos de test/lint/deploy ✅');
  } else {
    console.log('No se detectan pasos clave ⚠️');
  }
});
