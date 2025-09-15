#!/usr/bin/env groovy

/**
 * Performance Baseline Testing Pipeline
 * Establishes and monitors performance benchmarks
 */

pipeline {
    agent {
        label 'high-performance'
    }
    
    parameters {
        choice(
            name: 'BASELINE_ENVIRONMENT',
            choices: ['staging', 'production'],
            description: 'Environment for baseline testing'
        )
        string(
            name: 'PERFORMANCE_THRESHOLD',
            defaultValue: '95',
            description: 'Performance score threshold (%)'
        )
        booleanParameter(
            name: 'UPDATE_BASELINE',
            defaultValue: false,
            description: 'Update performance baseline'
        )
        choice(
            name: 'TEST_SCOPE',
            choices: ['critical-path', 'full-suite', 'custom'],
            description: 'Scope of performance tests'
        )
        string(
            name: 'CUSTOM_TESTS',
            defaultValue: '',
            description: 'Custom test pattern (for custom scope)'
        )
        string(
            name: 'DURATION_MINUTES',
            defaultValue: '30',
            description: 'Test duration in minutes'
        )
    }
    
    environment {
        NODE_VERSION = '18'
        PERFORMANCE_RESULTS = "${WORKSPACE}/performance-results"
        BASELINE_DIR = "${WORKSPACE}/performance-baseline"
        LIGHTHOUSE_DIR = "${WORKSPACE}/lighthouse-reports"
        K6_RESULTS = "${WORKSPACE}/k6-results"
        METRICS_THRESHOLD = "${params.PERFORMANCE_THRESHOLD}"
        
        // Performance monitoring
        MONITOR_CPU = 'true'
        MONITOR_MEMORY = 'true'
        MONITOR_NETWORK = 'true'
        COLLECT_TRACES = 'true'
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '50'))
        timeout(time: 2, unit: 'HOURS')
        timestamps()
        ansiColor('xterm')
        skipDefaultCheckout(false)
    }
    
    stages {
        stage('🚀 Performance Setup') {
            parallel {
                stage('Environment Preparation') {
                    steps {
                        script {
                            echo "🔧 Setting up performance testing environment..."
                            
                            // Clean workspace
                            cleanWs()
                            checkout scm
                            
                            // Setup directories
                            sh """
                                mkdir -p ${PERFORMANCE_RESULTS}
                                mkdir -p ${BASELINE_DIR}
                                mkdir -p ${LIGHTHOUSE_DIR}
                                mkdir -p ${K6_RESULTS}
                            """
                            
                            // Install dependencies
                            sh 'npm ci --production=false'
                            sh 'npx playwright install --with-deps chromium'
                            
                            // Install performance tools
                            sh """
                                npm install -g lighthouse k6
                                npm install --save-dev @playwright/test lighthouse clinic
                            """
                        }
                    }
                }
                
                stage('Baseline Validation') {
                    steps {
                        script {
                            echo "📊 Validating performance baseline..."
                            
                            // Check if baseline exists
                            def baselineExists = fileExists("${BASELINE_DIR}/baseline.json")
                            
                            if (!baselineExists && !params.UPDATE_BASELINE) {
                                echo "⚠️ No baseline found. This run will establish the baseline."
                                env.ESTABLISH_BASELINE = 'true'
                            } else if (params.UPDATE_BASELINE) {
                                echo "🔄 Baseline will be updated after this run."
                                env.UPDATE_BASELINE_FLAG = 'true'
                            } else {
                                echo "✅ Using existing baseline for comparison."
                                env.USE_EXISTING_BASELINE = 'true'
                            }
                        }
                    }
                }
                
                stage('System Resources Check') {
                    steps {
                        script {
                            echo "🖥️ Checking system resources..."
                            
                            sh """
                                echo "=== System Information ==="
                                uname -a
                                echo "=== CPU Information ==="
                                nproc
                                cat /proc/cpuinfo | grep "model name" | head -1
                                echo "=== Memory Information ==="
                                free -h
                                echo "=== Disk Space ==="
                                df -h
                                echo "=== Network Configuration ==="
                                ip addr show | grep inet
                            """
                        }
                    }
                }
            }
        }
        
        stage('🎯 Performance Test Selection') {
            steps {
                script {
                    echo "🎯 Configuring performance test suite..."
                    
                    def testPattern = ''
                    
                    switch(params.TEST_SCOPE) {
                        case 'critical-path':
                            testPattern = 'tests/performance/critical-path/*.spec.ts'
                            break
                        case 'full-suite':
                            testPattern = 'tests/performance/**/*.spec.ts'
                            break
                        case 'custom':
                            testPattern = params.CUSTOM_TESTS ?: 'tests/performance/**/*.spec.ts'
                            break
                        default:
                            testPattern = 'tests/performance/critical-path/*.spec.ts'
                    }
                    
                    env.TEST_PATTERN = testPattern
                    echo "📝 Test pattern: ${testPattern}"
                    echo "⏱️ Test duration: ${params.DURATION_MINUTES} minutes"
                    echo "🎯 Performance threshold: ${params.PERFORMANCE_THRESHOLD}%"
                }
            }
        }
        
        stage('🏃‍♂️ Performance Testing') {
            parallel {
                stage('🎭 Playwright Performance') {
                    steps {
                        script {
                            echo "🎭 Running Playwright performance tests..."
                            
                            sh """
                                npm run test:performance -- \
                                    --testPattern="${env.TEST_PATTERN}" \
                                    --env=${params.BASELINE_ENVIRONMENT} \
                                    --duration=${params.DURATION_MINUTES} \
                                    --threshold=${params.PERFORMANCE_THRESHOLD} \
                                    --reporter=json,html \
                                    --outputDir=${PERFORMANCE_RESULTS}/playwright \
                                    --collectTraces=${env.COLLECT_TRACES} \
                                    --monitorResources=true
                            """
                        }
                    }
                    post {
                        always {
                            archiveArtifacts artifacts: 'performance-results/playwright/**/*', fingerprint: true
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'performance-results/playwright',
                                reportFiles: 'index.html',
                                reportName: 'Playwright Performance Report'
                            ])
                        }
                    }
                }
                
                stage('💡 Lighthouse Audits') {
                    steps {
                        script {
                            echo "💡 Running Lighthouse performance audits..."
                            
                            // Define key pages to audit
                            def pages = [
                                'login': '/login',
                                'dashboard': '/dashboard',
                                'profile': '/profile',
                                'api-docs': '/api/docs'
                            ]
                            
                            pages.each { name, path ->
                                sh """
                                    lighthouse "https://${params.BASELINE_ENVIRONMENT}.example.com${path}" \
                                        --chrome-flags="--headless --no-sandbox --disable-dev-shm-usage" \
                                        --output=html,json \
                                        --output-path=${LIGHTHOUSE_DIR}/${name} \
                                        --preset=perf \
                                        --throttling-method=simulate \
                                        --form-factor=desktop \
                                        --screenEmulation.disabled \
                                        --quiet
                                """
                            }
                            
                            // Generate combined report
                            sh """
                                npm run lighthouse:combine -- \
                                    --inputDir=${LIGHTHOUSE_DIR} \
                                    --outputPath=${LIGHTHOUSE_DIR}/combined-report.html
                            """
                        }
                    }
                    post {
                        always {
                            archiveArtifacts artifacts: 'lighthouse-reports/**/*', fingerprint: true
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'lighthouse-reports',
                                reportFiles: 'combined-report.html',
                                reportName: 'Lighthouse Performance Report'
                            ])
                        }
                    }
                }
                
                stage('📊 Load Testing (K6)') {
                    steps {
                        script {
                            echo "📊 Running K6 load tests..."
                            
                            sh """
                                k6 run \
                                    --duration=${params.DURATION_MINUTES}m \
                                    --vus=50 \
                                    --rps=100 \
                                    --out json=${K6_RESULTS}/results.json \
                                    --summary-export=${K6_RESULTS}/summary.json \
                                    performance/k6-scripts/load-test.js
                            """
                            
                            // Generate K6 HTML report
                            sh """
                                npm run k6:report -- \
                                    --input=${K6_RESULTS}/results.json \
                                    --output=${K6_RESULTS}/report.html
                            """
                        }
                    }
                    post {
                        always {
                            archiveArtifacts artifacts: 'k6-results/**/*', fingerprint: true
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'k6-results',
                                reportFiles: 'report.html',
                                reportName: 'K6 Load Test Report'
                            ])
                        }
                    }
                }
                
                stage('🔬 Resource Monitoring') {
                    steps {
                        script {
                            echo "🔬 Monitoring system resources during tests..."
                            
                            // Start resource monitoring
                            sh """
                                # CPU and Memory monitoring
                                clinic doctor --on-port='npm run sample-app' -- npm start &
                                CLINIC_PID=\$!
                                
                                # Network monitoring
                                iftop -t -s 60 -L 100 > ${PERFORMANCE_RESULTS}/network-stats.txt 2>&1 &
                                IFTOP_PID=\$!
                                
                                # Wait for test duration
                                sleep ${params.DURATION_MINUTES}m
                                
                                # Stop monitoring
                                kill \$CLINIC_PID \$IFTOP_PID 2>/dev/null || true
                                
                                # Generate clinic report
                                clinic doctor --visualize --open=false
                            """
                        }
                    }
                    post {
                        always {
                            archiveArtifacts artifacts: '.clinic/**/*', fingerprint: true
                            archiveArtifacts artifacts: 'performance-results/network-stats.txt', fingerprint: true
                        }
                    }
                }
            }
        }
        
        stage('📈 Performance Analysis') {
            steps {
                script {
                    echo "📈 Analyzing performance results..."
                    
                    // Aggregate all performance data
                    sh """
                        node scripts/performance-analyzer.js \
                            --playwrightResults=${PERFORMANCE_RESULTS}/playwright \
                            --lighthouseResults=${LIGHTHOUSE_DIR} \
                            --k6Results=${K6_RESULTS} \
                            --threshold=${params.PERFORMANCE_THRESHOLD} \
                            --outputPath=${PERFORMANCE_RESULTS}/analysis.json
                    """
                    
                    // Read analysis results
                    def analysis = readJSON file: "${PERFORMANCE_RESULTS}/analysis.json"
                    
                    // Store results in environment
                    env.PERFORMANCE_SCORE = analysis.overallScore.toString()
                    env.CRITICAL_ISSUES = analysis.criticalIssues.toString()
                    env.RECOMMENDATIONS = analysis.recommendations.size().toString()
                    
                    echo "📊 Overall Performance Score: ${env.PERFORMANCE_SCORE}%"
                    echo "🚨 Critical Issues: ${env.CRITICAL_ISSUES}"
                    echo "💡 Recommendations: ${env.RECOMMENDATIONS}"
                    
                    // Performance quality gate
                    if (analysis.overallScore < params.PERFORMANCE_THRESHOLD.toInteger()) {
                        currentBuild.result = 'UNSTABLE'
                        echo "⚠️ Performance score below threshold: ${analysis.overallScore}% < ${params.PERFORMANCE_THRESHOLD}%"
                    }
                    
                    if (analysis.criticalIssues > 0) {
                        currentBuild.result = 'UNSTABLE'
                        echo "🚨 Critical performance issues detected: ${analysis.criticalIssues}"
                    }
                }
            }
        }
        
        stage('📊 Baseline Management') {
            parallel {
                stage('Baseline Comparison') {
                    when {
                        environment name: 'USE_EXISTING_BASELINE', value: 'true'
                    }
                    steps {
                        script {
                            echo "📊 Comparing with existing baseline..."
                            
                            sh """
                                node scripts/baseline-comparator.js \
                                    --currentResults=${PERFORMANCE_RESULTS}/analysis.json \
                                    --baselineResults=${BASELINE_DIR}/baseline.json \
                                    --outputPath=${PERFORMANCE_RESULTS}/comparison.json \
                                    --generateReport=true
                            """
                            
                            def comparison = readJSON file: "${PERFORMANCE_RESULTS}/comparison.json"
                            
                            env.PERFORMANCE_TREND = comparison.trend
                            env.REGRESSION_DETECTED = comparison.regressionDetected.toString()
                            env.IMPROVEMENT_PERCENTAGE = comparison.improvementPercentage.toString()
                            
                            echo "📈 Performance Trend: ${env.PERFORMANCE_TREND}"
                            echo "📉 Regression Detected: ${env.REGRESSION_DETECTED}"
                            echo "⚡ Improvement: ${env.IMPROVEMENT_PERCENTAGE}%"
                            
                            if (comparison.regressionDetected) {
                                currentBuild.result = 'UNSTABLE'
                                echo "🚨 Performance regression detected!"
                            }
                        }
                    }
                }
                
                stage('Baseline Update') {
                    when {
                        anyOf {
                            environment name: 'ESTABLISH_BASELINE', value: 'true'
                            environment name: 'UPDATE_BASELINE_FLAG', value: 'true'
                        }
                    }
                    steps {
                        script {
                            echo "🔄 Updating performance baseline..."
                            
                            sh """
                                cp ${PERFORMANCE_RESULTS}/analysis.json ${BASELINE_DIR}/baseline.json
                                
                                # Add metadata
                                node scripts/add-baseline-metadata.js \
                                    --baselineFile=${BASELINE_DIR}/baseline.json \
                                    --buildNumber=${BUILD_NUMBER} \
                                    --timestamp="\$(date -Iseconds)" \
                                    --environment=${params.BASELINE_ENVIRONMENT}
                            """
                            
                            // Archive new baseline
                            archiveArtifacts artifacts: 'performance-baseline/baseline.json', fingerprint: true
                            
                            echo "✅ Performance baseline updated successfully"
                        }
                    }
                }
            }
        }
        
        stage('📑 Performance Reporting') {
            steps {
                script {
                    echo "📑 Generating comprehensive performance report..."
                    
                    // Generate consolidated performance report
                    sh """
                        node scripts/performance-reporter.js \
                            --analysisResults=${PERFORMANCE_RESULTS}/analysis.json \
                            --comparisonResults=${PERFORMANCE_RESULTS}/comparison.json \
                            --lighthouseDir=${LIGHTHOUSE_DIR} \
                            --k6Dir=${K6_RESULTS} \
                            --outputPath=${PERFORMANCE_RESULTS}/consolidated-report.html \
                            --includeCharts=true \
                            --includeRecommendations=true
                    """
                    
                    // Publish consolidated report
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'performance-results',
                        reportFiles: 'consolidated-report.html',
                        reportName: 'Performance Dashboard'
                    ])
                    
                    // Archive all performance data
                    archiveArtifacts artifacts: 'performance-results/**/*', fingerprint: true
                }
            }
        }
    }
    
    post {
        always {
            script {
                // Clean up processes
                sh """
                    pkill -f clinic || true
                    pkill -f lighthouse || true
                    pkill -f k6 || true
                """
            }
        }
        
        success {
            script {
                def message = """
🚀 *Performance Baseline Testing - SUCCESS*
📅 *Environment:* ${params.BASELINE_ENVIRONMENT}
🎯 *Build:* ${BUILD_NUMBER}
📊 *Score:* ${env.PERFORMANCE_SCORE ?: 'N/A'}%
📈 *Trend:* ${env.PERFORMANCE_TREND ?: 'N/A'}
⏱️ *Duration:* ${currentBuild.durationString}

✅ Performance within acceptable limits
📊 Quality gates: PASSED
🔗 *Reports:* ${BUILD_URL}
                """.trim()
                
                slackSend(
                    channel: '#performance-monitoring',
                    color: 'good',
                    message: message
                )
                
                emailext(
                    subject: "🚀 Performance Baseline Success - Build ${BUILD_NUMBER}",
                    body: """
                    <h2>🚀 Performance Baseline Testing - SUCCESS</h2>
                    <p><strong>Environment:</strong> ${params.BASELINE_ENVIRONMENT}</p>
                    <p><strong>Performance Score:</strong> ${env.PERFORMANCE_SCORE ?: 'N/A'}%</p>
                    <p><strong>Performance Trend:</strong> ${env.PERFORMANCE_TREND ?: 'N/A'}</p>
                    
                    <h3>📊 Reports</h3>
                    <ul>
                        <li><a href="${BUILD_URL}htmlreports/Performance%20Dashboard/">Performance Dashboard</a></li>
                        <li><a href="${BUILD_URL}htmlreports/Lighthouse%20Performance%20Report/">Lighthouse Report</a></li>
                        <li><a href="${BUILD_URL}htmlreports/K6%20Load%20Test%20Report/">K6 Load Test Report</a></li>
                    </ul>
                    """,
                    to: 'performance-team@company.com',
                    mimeType: 'text/html'
                )
            }
        }
        
        unstable {
            script {
                def issues = []
                
                if (env.PERFORMANCE_SCORE && env.PERFORMANCE_SCORE.toInteger() < params.PERFORMANCE_THRESHOLD.toInteger()) {
                    issues.add("Performance score below threshold: ${env.PERFORMANCE_SCORE}%")
                }
                
                if (env.REGRESSION_DETECTED && env.REGRESSION_DETECTED.toBoolean()) {
                    issues.add("Performance regression detected")
                }
                
                if (env.CRITICAL_ISSUES && env.CRITICAL_ISSUES.toInteger() > 0) {
                    issues.add("${env.CRITICAL_ISSUES} critical performance issues")
                }
                
                def message = """
⚠️ *Performance Baseline Testing - UNSTABLE*
📅 *Environment:* ${params.BASELINE_ENVIRONMENT}
🎯 *Build:* ${BUILD_NUMBER}
📊 *Score:* ${env.PERFORMANCE_SCORE ?: 'N/A'}%

🚨 *Issues Detected:*
${issues.collect { "• ${it}" }.join('\n')}

🔗 *Reports:* ${BUILD_URL}
💡 *Recommendations:* ${env.RECOMMENDATIONS ?: '0'} available
                """.trim()
                
                slackSend(
                    channel: '#performance-monitoring',
                    color: 'warning',
                    message: message
                )
            }
        }
        
        failure {
            script {
                slackSend(
                    channel: '#performance-monitoring',
                    color: 'danger',
                    message: """
🚨 *Performance Baseline Testing - FAILED*
📅 *Environment:* ${params.BASELINE_ENVIRONMENT}
🎯 *Build:* ${BUILD_NUMBER}
⏱️ *Duration:* ${currentBuild.durationString}

❌ Performance testing failed
🔗 *Logs:* ${BUILD_URL}console
🚨 Immediate attention required
                    """.trim()
                )
            }
        }
    }
}