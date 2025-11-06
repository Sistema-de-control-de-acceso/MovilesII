// Jenkinsfile para pruebas de carga
pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        MONGODB_URI = 'mongodb://localhost:27017/ASISTENCIA'
        BASE_URL = 'http://localhost:3000'
        SCENARIO = params.SCENARIO ?: 'peak-hours'
    }
    
    parameters {
        choice(
            name: 'SCENARIO',
            choices: ['peak-hours', 'concurrent-users', 'stress-test'],
            description: 'Escenario de prueba de carga'
        )
        string(
            name: 'BASE_URL',
            defaultValue: 'http://localhost:3000',
            description: 'URL base del servidor'
        )
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Setup') {
            steps {
                script {
                    // Instalar Node.js
                    sh '''
                        if ! command -v node &> /dev/null; then
                            echo "Installing Node.js..."
                            # Agregar lógica de instalación según el sistema
                        fi
                        node --version
                        npm --version
                    '''
                    
                    // Instalar K6
                    sh '''
                        if ! command -v k6 &> /dev/null; then
                            echo "Installing K6..."
                            sudo gpg -k
                            sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \\
                                --keyserver hkp://keyserver.ubuntu.com:80 \\
                                --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
                            echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
                            sudo apt-get update
                            sudo apt-get install -y k6
                        fi
                        k6 version
                    '''
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                dir('backend') {
                    sh 'npm ci'
                }
            }
        }
        
        stage('Setup Test Data') {
            steps {
                dir('backend') {
                    sh '''
                        MONGODB_URI="${MONGODB_URI}" node load-testing/scripts/setup-staging-data.js || echo "Setup data failed, continuing..."
                    '''
                }
            }
        }
        
        stage('Start Backend') {
            steps {
                dir('backend') {
                    sh '''
                        MONGODB_URI="${MONGODB_URI}" NODE_ENV=test PORT=3000 npm start &
                        sleep 15
                        curl -f http://localhost:3000/health || exit 1
                    '''
                }
            }
        }
        
        stage('Run Load Test') {
            steps {
                dir('backend/load-testing') {
                    sh '''
                        mkdir -p results
                        k6 run \\
                            --env BASE_URL="${BASE_URL}" \\
                            --out json=results/${SCENARIO}-${BUILD_NUMBER}.json \\
                            --out csv=results/${SCENARIO}-${BUILD_NUMBER}.csv \\
                            scenarios/${SCENARIO}.js || true
                    '''
                }
            }
        }
        
        stage('Analyze Results') {
            steps {
                dir('backend/load-testing') {
                    sh '''
                        if [ -f results/${SCENARIO}-${BUILD_NUMBER}.json ]; then
                            node scripts/analyze-results.js results/${SCENARIO}-${BUILD_NUMBER}.json results/report-${BUILD_NUMBER}.json
                        else
                            echo "No results file found"
                        fi
                    '''
                }
            }
        }
        
        stage('Check Thresholds') {
            steps {
                dir('backend/load-testing') {
                    script {
                        def reportFile = "results/report-${env.BUILD_NUMBER}.json"
                        if (fileExists(reportFile)) {
                            def report = readJSON file: reportFile
                            def issues = report.thresholds.issues ?: []
                            def critical = issues.findAll { it.type == 'critical' }
                            def warnings = issues.findAll { it.type == 'warning' }
                            
                            if (critical.size() > 0) {
                                echo "❌ Critical thresholds failed:"
                                critical.each { issue ->
                                    echo "  - ${issue.message}"
                                }
                                currentBuild.result = 'UNSTABLE'
                            }
                            
                            if (warnings.size() > 0) {
                                echo "⚠️  Warning thresholds:"
                                warnings.each { issue ->
                                    echo "  - ${issue.message}"
                                }
                            }
                            
                            if (issues.size() == 0) {
                                echo "✅ All thresholds passed"
                            }
                        } else {
                            echo "⚠️  No report file found"
                        }
                    }
                }
            }
        }
    }
    
    post {
        always {
            // Archivar resultados
            archiveArtifacts artifacts: 'backend/load-testing/results/**/*', allowEmptyArchive: true
            
            // Publicar resultados
            publishHTML([
                reportDir: 'backend/load-testing/results',
                reportFiles: 'report-*.json',
                reportName: 'Load Test Report',
                keepAll: true
            ])
        }
        
        success {
            echo "✅ Load test completed successfully"
        }
        
        failure {
            echo "❌ Load test failed"
        }
        
        unstable {
            echo "⚠️  Load test completed with warnings"
        }
    }
}

