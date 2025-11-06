# Pruebas de Carga y Análisis de Performance

Sistema completo de pruebas de carga y análisis de performance para garantizar que el sistema soporte la carga esperada y mantenga tiempos de respuesta óptimos.

## 📋 Características

- ✅ Tests de carga para escenarios de uso pico (horario de entrada/salida)
- ✅ Simulación de carga concurrente (mínimo 500 usuarios simultáneos)
- ✅ Tiempo de respuesta promedio < 200ms para operaciones críticas
- ✅ Tasa de éxito > 99.5% bajo carga normal
- ✅ Identificación de cuellos de botella
- ✅ Reporte de métricas de performance (latencia P50, P95, P99)
- ✅ Tests de stress para identificar punto de quiebre
- ✅ Pruebas de resistencia (soak tests) de 24 horas
- ✅ Plan de optimización basado en resultados

## 🛠️ Instalación

### K6

**macOS:**
```bash
brew install k6
```

**Windows:**
```bash
choco install k6
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Descarga directa:**
https://k6.io/docs/getting-started/installation/

## 📁 Estructura

```
load-testing/
├── k6.config.js              # Configuración base
├── scenarios/
│   ├── peak-hours.js         # Horario pico entrada/salida
│   ├── concurrent-users.js    # 500 usuarios simultáneos
│   ├── stress-test.js        # Test de stress (punto de quiebre)
│   └── soak-test.js          # Prueba de resistencia 24h
├── scripts/
│   ├── run-load-test.sh      # Script bash para ejecutar pruebas
│   ├── run-load-test.ps1     # Script PowerShell para ejecutar pruebas
│   └── analyze-results.js    # Script de análisis de resultados
├── results/                   # Directorio de resultados (generado)
└── README.md                  # Este archivo
```

## 🚀 Uso

### Ejecutar Prueba de Carga

**Linux/macOS:**
```bash
cd backend/load-testing
chmod +x scripts/run-load-test.sh
./scripts/run-load-test.sh peak-hours http://localhost:3000
```

**Windows:**
```powershell
cd backend\load-testing
.\scripts\run-load-test.ps1 peak-hours http://localhost:3000
```

**Directo con K6:**
```bash
k6 run --env BASE_URL=http://localhost:3000 scenarios/peak-hours.js
```

### Escenarios Disponibles

#### 1. Peak Hours (Horario Pico)
Simula carga durante horarios pico con check-ins masivos.

```bash
k6 run scenarios/peak-hours.js
```

**Características:**
- Ramp up rápido a 200 usuarios
- Simula login → consulta alumno → registro asistencia
- Duración: ~12 minutos

#### 2. Concurrent Users (Usuarios Concurrentes)
Simula 500 usuarios simultáneos realizando operaciones variadas.

```bash
k6 run scenarios/concurrent-users.js
```

**Características:**
- Ramp up gradual a 500 usuarios
- Operaciones variadas (listar, consultar, registrar)
- Duración: ~24 minutos

#### 3. Stress Test (Prueba de Stress)
Identifica el punto de quiebre del sistema.

```bash
k6 run scenarios/stress-test.js
```

**Características:**
- Incremento gradual hasta 1000 usuarios
- Identifica punto de quiebre
- Duración: ~20 minutos

#### 4. Soak Test (Prueba de Resistencia)
Ejecuta carga moderada durante 24 horas.

```bash
k6 run --duration 24h scenarios/soak-test.js
```

**Características:**
- 50 usuarios constantes
- Detecta memory leaks y degradación
- Duración: 24 horas

### Análisis de Resultados

```bash
node scripts/analyze-results.js results/peak-hours-20240115-120000.json
```

El script genera:
- Reporte en consola con métricas clave
- Archivo JSON con análisis completo
- Recomendaciones de optimización

## 📊 Métricas y Thresholds

### Thresholds Configurados

```javascript
{
  // Tiempo de respuesta promedio < 200ms
  http_req_duration: ['p(50)<200', 'p(95)<500', 'p(99)<1000'],
  
  // Tasa de éxito > 99.5%
  http_req_failed: ['rate<0.005'],
  
  // Checks deben pasar
  checks: ['rate>0.995']
}
```

### Métricas Reportadas

- **Response Time**: Min, Max, Promedio, P50, P95, P99
- **Success Rate**: Total requests, Failed requests, Tasa de éxito
- **Throughput**: Requests por segundo
- **Checks**: Checks pasados/fallidos, Tasa de checks

## 🔧 Configuración

### Variables de Entorno

```bash
export BASE_URL=http://localhost:3000
export K6_VUS=500
export K6_DURATION=10m
```

### Personalizar Escenarios

Editar archivos en `scenarios/` para ajustar:
- Número de usuarios virtuales (VUs)
- Duración de cada etapa
- Operaciones a ejecutar
- Thresholds específicos

## 📈 Interpretación de Resultados

### ✅ Prueba Exitosa

- P50 < 200ms
- P95 < 500ms
- P99 < 1000ms
- Success rate > 99.5%
- Checks rate > 99.5%

### ⚠️ Problemas Detectados

**Tiempo de respuesta alto:**
- Revisar queries de BD
- Implementar caching
- Optimizar índices

**Tasa de éxito baja:**
- Revisar logs de errores
- Verificar capacidad de BD
- Revisar rate limiting

**P95 alto:**
- Identificar endpoints lentos
- Optimizar operaciones costosas
- Revisar conexiones de BD

## 🔍 Integración con Monitoreo

Las pruebas de carga se integran con el sistema de monitoreo (US061):

```bash
# Durante la prueba, monitorear en otra terminal:
curl http://localhost:3000/health/detailed
```

O acceder al dashboard:
```
http://localhost:3000/dashboard/health.html
```

## 📝 Reportes

### Generar Reporte Completo

```bash
# Ejecutar prueba y generar reporte
k6 run --out json=results/test.json scenarios/peak-hours.js
node scripts/analyze-results.js results/test.json results/report.json
```

### Visualizar Resultados

Los resultados se guardan en formato:
- **JSON**: Para análisis programático
- **CSV**: Para análisis en Excel/Google Sheets

## 🎯 Escenarios de Prueba

### Escenario 1: Check-in Masivo (Horario Pico)

**Simula:**
- 200 usuarios simultáneos
- Login → Consulta alumno → Registro asistencia
- Durante horario de entrada (7-9 AM)

**Objetivo:**
- Verificar que el sistema maneje picos de tráfico
- Tiempo de respuesta < 200ms para registro de asistencia

### Escenario 2: Carga Concurrente

**Simula:**
- 500 usuarios simultáneos
- Operaciones variadas (listar, consultar, registrar)
- Carga sostenida

**Objetivo:**
- Verificar capacidad del sistema bajo carga normal
- Tasa de éxito > 99.5%

### Escenario 3: Stress Test

**Simula:**
- Incremento gradual hasta 1000 usuarios
- Operación crítica (registro asistencia)

**Objetivo:**
- Identificar punto de quiebre
- Determinar capacidad máxima

### Escenario 4: Soak Test

**Simula:**
- 50 usuarios constantes
- Operaciones variadas
- Durante 24 horas

**Objetivo:**
- Detectar memory leaks
- Identificar degradación de performance
- Verificar estabilidad a largo plazo

## 🚨 Troubleshooting

### K6 no está instalado

```bash
# Verificar instalación
k6 version

# Si no está instalado, seguir instrucciones de instalación arriba
```

### Error de conexión

Verificar que el servidor esté corriendo:
```bash
curl http://localhost:3000/health
```

### Resultados no se generan

Verificar permisos de escritura en directorio `results/`:
```bash
mkdir -p results
chmod 755 results
```

## 📚 Referencias

- [K6 Documentation](https://k6.io/docs/)
- [K6 JavaScript API](https://k6.io/docs/javascript-api/)
- [Performance Testing Best Practices](https://k6.io/docs/test-types/)

## 🔄 Próximos Pasos

1. ✅ **Automatizar en CI/CD**: Integrar pruebas en pipeline (Ver `CI_CD_INTEGRATION.md`)
2. **Alertas automáticas**: Notificar cuando thresholds fallen
3. **Dashboards**: Visualización en tiempo real de métricas
4. **Comparación histórica**: Comparar resultados entre ejecuciones
5. **Optimización continua**: Implementar mejoras basadas en resultados

## 🚀 Integración CI/CD

Las pruebas de carga están integradas en CI/CD. Ver documentación completa en:

- **`CI_CD_INTEGRATION.md`** - Guía completa de integración
- **`.github/workflows/load-testing.yml`** - GitHub Actions
- **`.gitlab-ci.yml`** - GitLab CI
- **`Jenkinsfile`** - Jenkins Pipeline

### Quick Start CI/CD

**GitHub Actions:**
- Se ejecuta automáticamente en push/PR
- O manualmente desde Actions → Load Testing

**GitLab CI:**
- Se ejecuta automáticamente en push/merge requests
- Jobs manuales disponibles para stress tests

**Jenkins:**
- Usar el `Jenkinsfile` incluido
- Configurar como Pipeline Job

**Scripts genéricos:**
```bash
# Bash
./backend/load-testing/scripts/ci-run.sh peak-hours

# PowerShell
.\backend\load-testing\scripts\ci-run.ps1 -Scenario peak-hours
```

