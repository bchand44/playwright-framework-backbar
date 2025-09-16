pipeline {
    agent any
    
    parameters {
        choice(
            name: 'BROWSER',
            choices: ['chromium', 'firefox', 'webkit', 'all'],
            description: 'Browser to run tests on'
        )
        booleanParam(
            name: 'HEADLESS',
            defaultValue: true,
            description: 'Run tests in headless mode'
        )
    }
    
    environment {
        NODE_ENV = 'test'
        CI = 'true'
        PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '0'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo '📥 Checking out source code from GitHub'
                checkout scm
                sh 'ls -la'
            }
        }
        
        stage('Setup') {
            steps {
                echo '📦 Setting up Node.js and dependencies'
                sh '''
                    echo "Node version:"
                    node --version
                    echo "NPM version:"
                    npm --version
                    
                    echo "Installing dependencies..."
                    npm ci --verbose
                    
                    echo "Installing Playwright browsers (without Chrome)..."
                    npx playwright install chromium firefox webkit
                    
                    echo "System dependencies already installed manually"
                    echo "Verifying browser installation..."
                    npx playwright --version
                    echo "Available browsers:"
                    ls -la ~/.cache/ms-playwright/ || echo "Cache directory not found"
                '''
            }
        }
        
        stage('Run Tests') {
            steps {
                script {
                    echo "🧪 Running Playwright tests with ${params.BROWSER} browser(s)"
                    def browserFlag = ""
                    if (params.BROWSER != 'all') {
                        browserFlag = "--project=${params.BROWSER}"
                    }
                    
                    sh """
                        echo "Running tests with browser: ${params.BROWSER}"
                        if [ "${params.BROWSER}" = "all" ]; then
                            echo "Running tests on all browsers..."
                            npx playwright test --grep-invert "@api" --reporter=html,junit
                        else
                            echo "Running tests on ${params.BROWSER} browser..."
                            npx playwright test --project=${params.BROWSER} --grep-invert "@api" --reporter=html,junit
                        fi
                    """
                }
            }
        }
    }
    
    post {
        always {
            echo '📊 Archiving test results and reports'
            
            // Archive artifacts
            archiveArtifacts artifacts: 'playwright-report/**/*', allowEmptyArchive: true
            archiveArtifacts artifacts: 'test-results/**/*', allowEmptyArchive: true
            
            // Publish test results if JUnit XML exists
            script {
                if (fileExists('results.xml')) {
                    junit 'results.xml'
                }
            }
        }
        failure {
            echo '💥 Pipeline failed - check logs for details'
        }
        success {
            echo '✅ Pipeline completed successfully!'
        }
        cleanup {
            echo '🧽 Cleaning up workspace'
            cleanWs()
        }
    }
}
