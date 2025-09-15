#!/bin/bash

# Quick Jenkins Job Creator for Playwright Framework
# Creates a simple pipeline job that you can run immediately

echo "🎭 Creating Playwright Pipeline Job in Jenkins..."

JENKINS_CONTAINER="jenkins"
JOB_NAME="playwright-quick-test"

# Create job directory
docker exec "$JENKINS_CONTAINER" mkdir -p "/var/jenkins_home/jobs/$JOB_NAME"

# Create job config with embedded pipeline
cat > job-config.xml << 'EOF'
<?xml version='1.1' encoding='UTF-8'?>
<flow-definition plugin="workflow-job@2.40">
  <actions/>
  <description>🎭 Playwright Framework Quick Test Pipeline</description>
  <keepDependencies>false</keepDependencies>
  <properties>
    <hudson.model.ParametersDefinitionProperty>
      <parameterDefinitions>
        <hudson.model.ChoiceParameterDefinition>
          <name>BROWSER</name>
          <description>Browser to test with</description>
          <choices class="java.util.Arrays$ArrayList">
            <a class="string-array">
              <string>chromium</string>
              <string>firefox</string>
              <string>webkit</string>
              <string>all</string>
            </a>
          </choices>
        </hudson.model.ChoiceParameterDefinition>
        <hudson.model.BooleanParameterDefinition>
          <name>RUN_SAMPLE_APP</name>
          <description>Start sample applications</description>
          <defaultValue>true</defaultValue>
        </hudson.model.BooleanParameterDefinition>
        <hudson.model.StringParameterDefinition>
          <name>TEST_PATTERN</name>
          <description>Test pattern to run</description>
          <defaultValue>tests/e2e/auth.spec.ts</defaultValue>
        </hudson.model.StringParameterDefinition>
      </parameterDefinitions>
    </hudson.model.ParametersDefinitionProperty>
  </properties>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition" plugin="workflow-cps@2.80">
    <script>
pipeline {
    agent any
    
    parameters {
        choice(name: 'BROWSER', choices: ['chromium', 'firefox', 'webkit', 'all'], description: 'Browser to test')
        booleanParam(name: 'RUN_SAMPLE_APP', defaultValue: true, description: 'Start sample app')
        string(name: 'TEST_PATTERN', defaultValue: 'tests/e2e/auth.spec.ts', description: 'Test pattern')
    }
    
    environment {
        CI = 'true'
        NODE_OPTIONS = '--max-old-space-size=4096'
    }
    
    stages {
        stage('🔧 Setup') {
            steps {
                script {
                    echo "🎭 Setting up Playwright environment..."
                    dir('/var/jenkins_home/playwright-framework') {
                        sh 'pwd && ls -la'
                        sh 'npm --version'
                        sh 'node --version'
                        
                        // Install dependencies if needed
                        sh 'npm install || npm ci || echo "Using existing node_modules"'
                        
                        // Install browsers
                        sh 'npx playwright install chromium || echo "Browser already installed"'
                        sh 'npx playwright --version'
                    }
                }
            }
        }
        
        stage('🚀 Start Sample App') {
            when { expression { params.RUN_SAMPLE_APP } }
            steps {
                script {
                    dir('/var/jenkins_home/playwright-framework') {
                        echo "🌐 Starting sample applications..."
                        
                        // Create logs directory
                        sh 'mkdir -p logs'
                        
                        // Start sample apps in background
                        sh '''
                            # Kill any existing processes
                            pkill -f "sample" || true
                            sleep 2
                            
                            # Start sample web app
                            nohup npm run sample:web > logs/sample-web.log 2>&1 &
                            echo $! > logs/sample-web.pid
                            
                            # Start sample API
                            nohup npm run sample:api > logs/sample-api.log 2>&1 &
                            echo $! > logs/sample-api.pid
                            
                            # Wait for apps to start
                            echo "Waiting for apps to start..."
                            sleep 10
                            
                            # Check if apps are running
                            if curl -s http://localhost:3000 > /dev/null; then
                                echo "✅ Web app is running on port 3000"
                            else
                                echo "⚠️ Web app not responding"
                            fi
                            
                            if curl -s http://localhost:3001/health > /dev/null; then
                                echo "✅ API is running on port 3001"
                            else
                                echo "⚠️ API not responding"
                            fi
                        '''
                    }
                }
            }
        }
        
        stage('🧪 Run Tests') {
            steps {
                script {
                    dir('/var/jenkins_home/playwright-framework') {
                        echo "🧪 Running Playwright tests..."
                        echo "Browser: ${params.BROWSER}"
                        echo "Test Pattern: ${params.TEST_PATTERN}"
                        
                        // Create test results directory
                        sh 'mkdir -p test-results'
                        
                        // Run tests based on browser selection
                        if (params.BROWSER == 'all') {
                            sh """
                                npx playwright test ${params.TEST_PATTERN} \
                                    --reporter=html,json,junit \
                                    --output-dir=test-results/all
                            """
                        } else {
                            sh """
                                npx playwright test ${params.TEST_PATTERN} \
                                    --project=${params.BROWSER} \
                                    --reporter=html,json,junit \
                                    --output-dir=test-results/${params.BROWSER}
                            """
                        }
                    }
                }
            }
        }
        
        stage('📊 Generate Reports') {
            steps {
                script {
                    dir('/var/jenkins_home/playwright-framework') {
                        echo "📋 Generating test reports..."
                        
                        // Show test results
                        sh 'find test-results -name "*.html" -type f || echo "No HTML reports found"'
                        sh 'find test-results -name "*.json" -type f || echo "No JSON reports found"'
                        
                        // Display summary
                        sh '''
                            echo "=== TEST SUMMARY ==="
                            if [ -f "test-results/results.json" ]; then
                                cat test-results/results.json | head -20
                            fi
                            
                            echo "=== PLAYWRIGHT REPORT ==="
                            if [ -f "playwright-report/index.html" ]; then
                                echo "✅ Playwright HTML report generated"
                                ls -la playwright-report/
                            fi
                            
                            echo "=== LOG FILES ==="
                            if [ -d "logs" ]; then
                                ls -la logs/
                                echo "--- Sample Web App Log (last 10 lines) ---"
                                tail -10 logs/sample-web.log 2>/dev/null || echo "No web app log"
                                echo "--- Sample API Log (last 10 lines) ---"
                                tail -10 logs/sample-api.log 2>/dev/null || echo "No API log"
                            fi
                        '''
                    }
                }
            }
        }
    }
    
    post {
        always {
            script {
                dir('/var/jenkins_home/playwright-framework') {
                    // Stop sample apps
                    sh '''
                        if [ -f "logs/sample-web.pid" ]; then
                            kill $(cat logs/sample-web.pid) 2>/dev/null || true
                        fi
                        if [ -f "logs/sample-api.pid" ]; then
                            kill $(cat logs/sample-api.pid) 2>/dev/null || true
                        fi
                        pkill -f "sample" || true
                    '''
                    
                    // Archive artifacts
                    script {
                        try {
                            archiveArtifacts artifacts: 'test-results/**/*', fingerprint: true, allowEmptyArchive: true
                            archiveArtifacts artifacts: 'playwright-report/**/*', fingerprint: true, allowEmptyArchive: true
                            archiveArtifacts artifacts: 'logs/**/*', fingerprint: true, allowEmptyArchive: true
                        } catch (Exception e) {
                            echo "Note: Some artifacts may not be available: ${e.message}"
                        }
                    }
                    
                    // Publish test results
                    script {
                        try {
                            publishTestResults testResultsPattern: 'test-results/**/junit.xml', allowEmptyResults: true
                        } catch (Exception e) {
                            echo "Note: No JUnit test results found"
                        }
                    }
                    
                    // Publish HTML report
                    script {
                        try {
                            publishHTML([
                                allowMissing: true,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'playwright-report',
                                reportFiles: 'index.html',
                                reportName: 'Playwright Test Report'
                            ])
                        } catch (Exception e) {
                            echo "Note: HTML report not available: ${e.message}"
                        }
                    }
                }
            }
        }
        
        success {
            echo "✅ Playwright tests completed successfully!"
        }
        
        failure {
            echo "❌ Playwright tests failed. Check logs for details."
        }
        
        unstable {
            echo "⚠️ Playwright tests completed with some issues."
        }
    }
}
    </script>
    <sandbox>true</sandbox>
  </definition>
  <triggers/>
  <disabled>false</disabled>
</flow-definition>
EOF

# Copy job config to Jenkins
docker cp job-config.xml "$JENKINS_CONTAINER:/var/jenkins_home/jobs/$JOB_NAME/config.xml"

# Clean up
rm job-config.xml

echo "✅ Job '$JOB_NAME' created successfully!"
echo ""
echo "🎯 Next Steps:"
echo "1. Open Jenkins at http://localhost:8080"
echo "2. Login to Jenkins (if you have credentials)"
echo "3. Look for job: '$JOB_NAME'"
echo "4. Click 'Build with Parameters'"
echo "5. Select your options and click 'Build'"
echo ""
echo "🎭 Available Parameters:"
echo "• BROWSER: chromium, firefox, webkit, or all"
echo "• RUN_SAMPLE_APP: true/false (starts sample web app & API)"
echo "• TEST_PATTERN: which tests to run (default: auth tests)"