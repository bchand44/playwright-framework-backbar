#!/usr/bin/env groovy

/**
 * Nightly Regression Test Pipeline
 * Comprehensive testing across all environments and browsers
 */

pipeline {
    agent {
        label 'docker-enabled'
    }
    
    parameters {
        choice(
            name: 'ENVIRONMENT',
            choices: ['staging', 'production', 'all'],
            description: 'Environment to test'
        )
        booleanParameter(
            name: 'FULL_REGRESSION',
            defaultValue: true,
            description: 'Run complete regression suite'
        )
        booleanParameter(
            name: 'PERFORMANCE_TESTS',
            defaultValue: true,
            description: 'Include performance tests'
        )
        booleanParameter(
            name: 'ACCESSIBILITY_TESTS',
            defaultValue: true,
            description: 'Include accessibility tests'
        )
        booleanParameter(
            name: 'SECURITY_TESTS',
            defaultValue: false,
            description: 'Include security tests'
        )
        string(
            name: 'NOTIFICATION_CHANNEL',
            defaultValue: '#qa-automation',
            description: 'Slack channel for notifications'
        )
        string(
            name: 'TEST_TAGS',
            defaultValue: '@smoke,@regression',
            description: 'Test tags to include'
        )
    }
    
    environment {
        NODE_VERSION = '18'
        PLAYWRIGHT_BROWSERS_PATH = "${WORKSPACE}/.browsers"
        ALLURE_RESULTS_DIR = "${WORKSPACE}/allure-results"
        REPORTS_DIR = "${WORKSPACE}/test-reports"
        PERFORMANCE_THRESHOLD = '95'
        ACCESSIBILITY_THRESHOLD = '90'
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '30'))
        timeout(time: 4, unit: 'HOURS')
        timestamps()
        ansiColor('xterm')
        parallelsAlwaysFailFast()
    }
    
    stages {
        stage('🚀 Setup & Preparation') {
            parallel {
                stage('Environment Setup') {
                    steps {
                        script {
                            echo "🔧 Setting up test environment..."
                            
                            // Clean workspace
                            cleanWs()
                            
                            // Checkout code
                            checkout scm
                            
                            // Setup Node.js
                            sh """
                                echo "📦 Installing Node.js ${NODE_VERSION}..."
                                export NVM_DIR="\$HOME/.nvm"
                                [ -s "\$NVM_DIR/nvm.sh" ] && . "\$NVM_DIR/nvm.sh"
                                nvm install ${NODE_VERSION}
                                nvm use ${NODE_VERSION}
                                node --version
                                npm --version
                            """
                            
                            // Install dependencies
                            sh 'npm ci --production=false'
                            
                            // Install Playwright browsers
                            sh 'npx playwright install --with-deps'
                        }
                    }
                }
                
                stage('Environment Validation') {
                    steps {
                        script {
                            echo "✅ Validating test environments..."
                            
                            def environments = params.ENVIRONMENT == 'all' ? 
                                ['staging', 'production'] : [params.ENVIRONMENT]
                            
                            environments.each { env ->
                                echo "🔍 Validating ${env} environment..."
                                
                                // Health check
                                sh """
                                    npm run health-check -- --env=${env} || {
                                        echo "❌ ${env} environment health check failed"
                                        exit 1
                                    }
                                """
                                
                                // Connectivity check
                                sh """
                                    npm run connectivity-check -- --env=${env} || {
                                        echo "❌ ${env} environment connectivity failed"
                                        exit 1
                                    }
                                """
                            }
                        }
                    }
                }
            }
        }
        
        stage('🧪 Comprehensive Testing') {
            parallel {
                stage('🔥 Smoke Tests') {
                    steps {
                        script {
                            echo "💨 Running smoke tests..."
                            sh """
                                npm run test:smoke -- \
                                    --env=${params.ENVIRONMENT} \
                                    --reporter=html,json,junit \
                                    --workers=4
                            """
                        }
                    }
                    post {
                        always {
                            publishTestResults testResultsPattern: 'test-results/smoke-junit.xml'
                            archiveArtifacts artifacts: 'test-results/smoke-report.html', fingerprint: true
                        }
                    }
                }
                
                stage('🔍 Regression Tests') {
                    when {
                        expression { params.FULL_REGRESSION }
                    }
                    steps {
                        script {
                            echo "🔄 Running regression tests..."
                            sh """
                                npm run test:regression -- \
                                    --env=${params.ENVIRONMENT} \
                                    --tags="${params.TEST_TAGS}" \
                                    --reporter=html,json,junit \
                                    --workers=6
                            """
                        }
                    }
                    post {
                        always {
                            publishTestResults testResultsPattern: 'test-results/regression-junit.xml'
                            archiveArtifacts artifacts: 'test-results/regression-report.html', fingerprint: true
                        }
                    }
                }
                
                stage('⚡ Performance Tests') {
                    when {
                        expression { params.PERFORMANCE_TESTS }
                    }
                    steps {
                        script {
                            echo "🚀 Running performance tests..."
                            sh """
                                npm run test:performance -- \
                                    --env=${params.ENVIRONMENT} \
                                    --threshold=${PERFORMANCE_THRESHOLD} \
                                    --reporter=html,json
                            """
                        }
                    }
                    post {
                        always {
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'test-results',
                                reportFiles: 'performance-report.html',
                                reportName: 'Performance Report'
                            ])
                        }
                    }
                }
                
                stage('♿ Accessibility Tests') {
                    when {
                        expression { params.ACCESSIBILITY_TESTS }
                    }
                    steps {
                        script {
                            echo "🎯 Running accessibility tests..."
                            sh """
                                npm run test:accessibility -- \
                                    --env=${params.ENVIRONMENT} \
                                    --threshold=${ACCESSIBILITY_THRESHOLD} \
                                    --reporter=html,json
                            """
                        }
                    }
                    post {
                        always {
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'test-results',
                                reportFiles: 'accessibility-report.html',
                                reportName: 'Accessibility Report'
                            ])
                        }
                    }
                }
                
                stage('🔒 Security Tests') {
                    when {
                        expression { params.SECURITY_TESTS }
                    }
                    steps {
                        script {
                            echo "🛡️ Running security tests..."
                            sh """
                                npm run test:security -- \
                                    --env=${params.ENVIRONMENT} \
                                    --reporter=html,json
                            """
                        }
                    }
                    post {
                        always {
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'test-results',
                                reportFiles: 'security-report.html',
                                reportName: 'Security Report'
                            ])
                        }
                    }
                }
            }
        }
        
        stage('📊 Cross-Browser Matrix') {
            matrix {
                axes {
                    axis {
                        name 'BROWSER'
                        values 'chromium', 'firefox', 'webkit'
                    }
                    axis {
                        name 'VIEWPORT'
                        values 'desktop', 'tablet', 'mobile'
                    }
                }
                excludes {
                    exclude {
                        axis {
                            name 'BROWSER'
                            values 'webkit'
                        }
                        axis {
                            name 'VIEWPORT'
                            values 'tablet'
                        }
                    }
                }
                stages {
                    stage('Cross-Browser Tests') {
                        steps {
                            script {
                                echo "🌐 Testing ${BROWSER} on ${VIEWPORT}..."
                                sh """
                                    npm run test:cross-browser -- \
                                        --browser=${BROWSER} \
                                        --viewport=${VIEWPORT} \
                                        --env=${params.ENVIRONMENT} \
                                        --reporter=json \
                                        --workers=2
                                """
                            }
                        }
                    }
                }
            }
        }
        
        stage('📈 Quality Analysis') {
            parallel {
                stage('Test Coverage') {
                    steps {
                        script {
                            echo "📊 Analyzing test coverage..."
                            sh 'npm run coverage:generate'
                            
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'coverage',
                                reportFiles: 'index.html',
                                reportName: 'Coverage Report'
                            ])
                        }
                    }
                }
                
                stage('Code Quality') {
                    steps {
                        script {
                            echo "🔍 Running code quality checks..."
                            sh 'npm run lint:report'
                            sh 'npm run audit:security'
                            
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'reports',
                                reportFiles: 'quality-report.html',
                                reportName: 'Quality Report'
                            ])
                        }
                    }
                }
                
                stage('Dependency Check') {
                    steps {
                        script {
                            echo "🔐 Checking dependencies..."
                            sh 'npm audit --audit-level=moderate'
                            sh 'npm run outdated:check'
                        }
                    }
                }
            }
        }
        
        stage('📑 Consolidated Reporting') {
            steps {
                script {
                    echo "📋 Generating consolidated reports..."
                    
                    // Generate Allure report
                    sh """
                        npx allure generate ${ALLURE_RESULTS_DIR} \
                            --output ${REPORTS_DIR}/allure-report \
                            --clean
                    """
                    
                    // Publish Allure report
                    allure([
                        includeProperties: false,
                        jdk: '',
                        properties: [],
                        reportBuildPolicy: 'ALWAYS',
                        results: [[path: 'allure-results']]
                    ])
                    
                    // Archive all reports
                    archiveArtifacts artifacts: 'test-reports/**/*', fingerprint: true
                    archiveArtifacts artifacts: 'playwright-report/**/*', fingerprint: true
                    archiveArtifacts artifacts: 'logs/**/*', fingerprint: true
                }
            }
        }
    }
    
    post {
        always {
            script {
                def testResults = [:]
                def reportLinks = []
                
                try {
                    // Collect test results
                    testResults = readJSON file: 'test-results/summary.json'
                    
                    // Generate report links
                    reportLinks = [
                        "📊 [Allure Report](${BUILD_URL}allure/)",
                        "🎭 [Playwright Report](${BUILD_URL}artifact/playwright-report/index.html)",
                        "📈 [Coverage Report](${BUILD_URL}htmlreports/coverage/)",
                        "🔍 [Quality Report](${BUILD_URL}htmlreports/quality/)"
                    ]
                } catch (Exception e) {
                    echo "⚠️ Error reading test results: ${e.message}"
                }
                
                // Clean up workspace
                cleanWs()
            }
        }
        
        success {
            script {
                echo "✅ Nightly regression completed successfully!"
                
                slackSend(
                    channel: params.NOTIFICATION_CHANNEL,
                    color: 'good',
                    message: """
🌙 *Nightly Regression - SUCCESS* 
📅 *Environment:* ${params.ENVIRONMENT}
🎯 *Build:* ${BUILD_NUMBER}
⏱️ *Duration:* ${currentBuild.durationString}
🔗 *Reports:* ${BUILD_URL}

✅ All tests passed
📊 Quality gates: PASSED
🚀 Ready for deployment
                    """.trim()
                )
                
                // Email notification
                emailext(
                    subject: "✅ Nightly Regression Success - Build ${BUILD_NUMBER}",
                    body: """
                    <h2>🌙 Nightly Regression Test - SUCCESS</h2>
                    <p><strong>Environment:</strong> ${params.ENVIRONMENT}</p>
                    <p><strong>Build Number:</strong> ${BUILD_NUMBER}</p>
                    <p><strong>Duration:</strong> ${currentBuild.durationString}</p>
                    
                    <h3>📊 Reports</h3>
                    <ul>
                        <li><a href="${BUILD_URL}allure/">Allure Report</a></li>
                        <li><a href="${BUILD_URL}artifact/playwright-report/index.html">Playwright Report</a></li>
                        <li><a href="${BUILD_URL}htmlreports/coverage/">Coverage Report</a></li>
                    </ul>
                    
                    <p><strong>Status:</strong> ✅ All tests passed, ready for deployment</p>
                    """,
                    to: 'qa-team@company.com,dev-team@company.com',
                    mimeType: 'text/html'
                )
            }
        }
        
        failure {
            script {
                echo "❌ Nightly regression failed!"
                
                slackSend(
                    channel: params.NOTIFICATION_CHANNEL,
                    color: 'danger',
                    message: """
🌙 *Nightly Regression - FAILED* 
📅 *Environment:* ${params.ENVIRONMENT}
🎯 *Build:* ${BUILD_NUMBER}
⏱️ *Duration:* ${currentBuild.durationString}
🔗 *Reports:* ${BUILD_URL}

❌ Tests failed - immediate attention required
📊 Check logs and reports for details
🚨 Deployment blocked
                    """.trim()
                )
                
                // Email notification with failure details
                emailext(
                    subject: "🚨 Nightly Regression FAILED - Build ${BUILD_NUMBER}",
                    body: """
                    <h2>🌙 Nightly Regression Test - FAILED</h2>
                    <p><strong>Environment:</strong> ${params.ENVIRONMENT}</p>
                    <p><strong>Build Number:</strong> ${BUILD_NUMBER}</p>
                    <p><strong>Duration:</strong> ${currentBuild.durationString}</p>
                    
                    <h3>🚨 Failure Details</h3>
                    <p>Tests have failed and require immediate attention.</p>
                    
                    <h3>📊 Reports</h3>
                    <ul>
                        <li><a href="${BUILD_URL}allure/">Allure Report</a></li>
                        <li><a href="${BUILD_URL}artifact/playwright-report/index.html">Playwright Report</a></li>
                        <li><a href="${BUILD_URL}console">Console Logs</a></li>
                    </ul>
                    
                    <p><strong>Action Required:</strong> ❌ Review failed tests and fix issues before deployment</p>
                    """,
                    to: 'qa-team@company.com,dev-team@company.com,on-call@company.com',
                    mimeType: 'text/html'
                )
            }
        }
        
        unstable {
            script {
                echo "⚠️ Nightly regression completed with warnings!"
                
                slackSend(
                    channel: params.NOTIFICATION_CHANNEL,
                    color: 'warning',
                    message: """
🌙 *Nightly Regression - UNSTABLE* 
📅 *Environment:* ${params.ENVIRONMENT}
🎯 *Build:* ${BUILD_NUMBER}
⏱️ *Duration:* ${currentBuild.durationString}
🔗 *Reports:* ${BUILD_URL}

⚠️ Some tests failed or quality gates not met
📊 Review reports for details
⚡ Manual review required before deployment
                    """.trim()
                )
            }
        }
    }
}