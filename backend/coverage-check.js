// Script Node.js para verificar cobertura mínima y alertar si baja del umbral
const fs = require('fs');
const path = require('path');

const LCOV_PATH = path.join(__dirname, '..', '..', '..', '..', 'coverage', 'lcov.info');
const UMBRAL = 80; // Cobertura mínima requerida (%)

if (!fs.existsSync(LCOV_PATH)) {
  console.error('No se encontró el archivo lcov.info');
  process.exit(1);
}

const lcov = fs.readFileSync(LCOV_PATH, 'utf8');
const totalLine = lcov.match(/LF:(\d+)\nLH:(\d+)/g);
let total = 0, covered = 0;
if (totalLine) {
  totalLine.forEach(line => {
    const [, lf, lh] = line.match(/LF:(\d+)\nLH:(\d+)/) || [];
    if (lf && lh) {
      total += parseInt(lf);
      covered += parseInt(lh);
    }
  });
}
const percent = total ? (covered / total) * 100 : 0;
console.log(`Cobertura total: ${percent.toFixed(2)}%`);
if (percent < UMBRAL) {
  console.error(`Cobertura por debajo del umbral (${UMBRAL}%)`);
  process.exit(1);
} else {
  console.log('Cobertura OK');
}
