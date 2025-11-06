# Integración de Pruebas de Carga en CI/CD

Esta guía explica cómo integrar las pruebas de carga en diferentes sistemas de CI/CD.

## 📋 Sistemas Soportados

- ✅ GitHub Actions
- ✅ GitLab CI
- ✅ Jenkins
- ✅ Scripts genéricos (cualquier CI/CD)

## 🚀 GitHub Actions

### Configuración Automática

El workflow está configurado en `.github/workflows/load-testing.yml` y se ejecuta automáticamente en:

- Push a `main`, `master`, `develop`
- Pull requests a `main`, `master`
- Manualmente desde la pestaña "Actions"

### Uso Manual

1. Ir a **Actions** → **Load Testing**
2. Click en **Run workflow**
3. Seleccionar:
   - Escenario: `peak-hours`, `concurrent-users`, o `stress-test`
   - URL base: `http://localhost:3000` (default)

### Variables de Entorno

El workflow usa las siguientes variables:

- `MONGODB_URI`: URI de MongoDB (default: `mongodb://localhost:27017/ASISTENCIA`)
- `BASE_URL`: URL del servidor (default: `http://localhost:3000`)
- `SCENARIO`: Escenario de prueba (default: `peak-hours`)

### Artifacts

Los resultados se guardan como artifacts y están disponibles por 30 días:

- Archivos JSON con métricas
- Archivos CSV con datos detallados
- Reportes de análisis

### Comentarios en PRs

Cuando se ejecuta en un Pull Request, el workflow automáticamente comenta con:

- Métricas de performance (P50, P95, P99)
- Tasa de éxito
- Estado de thresholds
- Link al reporte completo

## 🔧 GitLab CI

### Configuración

El archivo `.gitlab-ci.yml` está configurado con:

- **Stage**: `load-test`
- **Jobs**:
  - `load-test:peak-hours` - Ejecuta automáticamente en main/master/develop
  - `load-test:concurrent-users` - Ejecución manual
  - `load-test:stress` - Ejecución manual

### Ejecución Automática

Se ejecuta automáticamente en:
- Push a `main`, `master`, `develop`
- Merge requests

### Ejecución Manual

1. Ir a **CI/CD** → **Pipelines**
2. Click en **Run pipeline**
3. Seleccionar el job deseado

### Artifacts

Los resultados se guardan como artifacts por 30 días.

## 🏗️ Jenkins

### Configuración

1. Crear un nuevo **Pipeline Job**
2. Configurar para usar el `Jenkinsfile` del repositorio
3. Configurar parámetros:
   - `SCENARIO`: Escenario de prueba
   - `BASE_URL`: URL del servidor

### Ejecución

1. Ir al job de Jenkins
2. Click en **Build with Parameters**
3. Seleccionar parámetros
4. Click en **Build**

### Artifacts

Los resultados se archivan automáticamente y están disponibles en la página del build.

## 📜 Scripts Genéricos

### Bash Script

```bash
./backend/load-testing/scripts/ci-run.sh [scenario] [base_url] [mongodb_uri]
```

**Ejemplo:**
```bash
./backend/load-testing/scripts/ci-run.sh peak-hours http://localhost:3000 mongodb://localhost:27017/ASISTENCIA
```

### PowerShell Script

```powershell
.\backend\load-testing\scripts\ci-run.ps1 -Scenario peak-hours -BaseUrl http://localhost:3000 -MongoDbUri mongodb://localhost:27017/ASISTENCIA
```

### Variables de Entorno

Los scripts detectan automáticamente el Build ID de:
- `CI_PIPELINE_ID` (GitLab)
- `GITHUB_RUN_ID` (GitHub Actions)
- `BUILD_NUMBER` (Jenkins)
- Timestamp (fallback)

## ⚙️ Configuración Avanzada

### Personalizar Thresholds

Editar `backend/load-testing/k6.config.js`:

```javascript
thresholds: {
  http_req_duration: ['p(50)<200', 'p(95)<500', 'p(99)<1000'],
  http_req_failed: ['rate<0.005'],
  checks: ['rate>0.995']
}
```

### Agregar Nuevos Escenarios

1. Crear archivo en `backend/load-testing/scenarios/`
2. Agregar job en `.gitlab-ci.yml` o `.github/workflows/load-testing.yml`
3. Actualizar scripts de CI si es necesario

### Notificaciones

#### GitHub Actions

Agregar step de notificación:

```yaml
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Load test failed'
```

#### GitLab CI

Agregar notificaciones en `.gitlab-ci.yml`:

```yaml
notification:
  script:
    - curl -X POST $SLACK_WEBHOOK_URL -d "Load test completed"
```

#### Jenkins

Usar plugins de notificación (Email, Slack, etc.) en el `post` section del `Jenkinsfile`.

## 📊 Integración con Monitoreo

Durante las pruebas de carga, se puede monitorear el sistema:

```yaml
# En GitHub Actions
- name: Monitor during test
  run: |
    while true; do
      curl -s http://localhost:3000/health/detailed | jq '.status'
      sleep 10
    done &
```

## 🔍 Troubleshooting

### El servidor no inicia

**Problema**: El servidor no responde después de iniciar.

**Solución**:
- Verificar que MongoDB esté corriendo
- Verificar logs del servidor
- Aumentar tiempo de espera en scripts

### K6 no está instalado

**Problema**: Error "k6: command not found"

**Solución**: 
- Verificar que el step de instalación de K6 se ejecute
- Verificar permisos de instalación

### Thresholds fallan

**Problema**: Los thresholds fallan pero el sistema funciona.

**Solución**:
- Revisar métricas reales
- Ajustar thresholds en `k6.config.js`
- Verificar que el ambiente de staging sea similar a producción

### Resultados no se generan

**Problema**: No se encuentran archivos de resultados.

**Solución**:
- Verificar permisos de escritura
- Verificar que el directorio `results/` exista
- Revisar logs de K6

## 📈 Mejores Prácticas

1. **Ejecutar en staging**: Nunca ejecutar pruebas de carga en producción
2. **Datos de prueba**: Asegurar que existan datos representativos
3. **Monitoreo**: Monitorear sistema durante pruebas
4. **Thresholds realistas**: Basar thresholds en métricas reales
5. **Resultados históricos**: Comparar resultados entre ejecuciones
6. **Alertas**: Configurar alertas para thresholds críticos
7. **Optimización continua**: Usar resultados para optimizar

## 🔄 Automatización Avanzada

### Ejecutar en Schedule

#### GitHub Actions

Descomentar en `.github/workflows/load-testing.yml`:

```yaml
schedule:
  - cron: '0 2 * * *' # Diario a las 2 AM
```

#### GitLab CI

Usar **CI/CD Schedules** en GitLab UI.

#### Jenkins

Usar **Build Triggers** → **Build periodically**.

### Comparación de Resultados

Crear script para comparar resultados:

```bash
node scripts/compare-results.js results/report-123.json results/report-124.json
```

### Integración con Dashboards

Exportar métricas a sistemas de monitoreo:

- Datadog
- New Relic
- Grafana
- Prometheus

## 📚 Referencias

- [K6 CI/CD Integration](https://k6.io/docs/results-output/real-time/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitLab CI Documentation](https://docs.gitlab.com/ee/ci/)
- [Jenkins Pipeline Documentation](https://www.jenkins.io/doc/book/pipeline/)

