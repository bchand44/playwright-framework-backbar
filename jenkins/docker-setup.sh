#!/bin/bash

# Jenkins Docker Setup Script for Playwright Framework
# This script configures your existing Jenkins Docker instance

set -e

echo "🎭 Setting up Jenkins Docker for Playwright Framework..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
JENKINS_CONTAINER=${JENKINS_CONTAINER:-"jenkins"}
JENKINS_URL=${JENKINS_URL:-"http://localhost:8080"}
HOST_WORKSPACE_DIR="$(pwd)"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Jenkins container is running
check_jenkins_container() {
    print_status "Checking Jenkins Docker container..."
    
    if docker ps | grep -q "$JENKINS_CONTAINER"; then
        print_success "Jenkins container is running"
    else
        print_error "Jenkins container is not running"
        print_status "Starting Jenkins container..."
        docker start "$JENKINS_CONTAINER" || {
            print_error "Failed to start Jenkins container"
            exit 1
        }
        sleep 10
    fi
}

# Wait for Jenkins to be ready
wait_for_jenkins() {
    print_status "Waiting for Jenkins to be ready..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$JENKINS_URL" > /dev/null 2>&1; then
            print_success "Jenkins is ready at $JENKINS_URL"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts - Jenkins not ready yet..."
        sleep 10
        ((attempt++))
    done
    
    print_error "Jenkins failed to start within expected time"
    exit 1
}

# Install plugins using Jenkins CLI
install_plugins() {
    print_status "Installing required Jenkins plugins..."
    
    local plugins=(
        "workflow-aggregator"
        "pipeline-stage-view"
        "pipeline-github-lib"
        "pipeline-npm"
        "nodejs"
        "github"
        "github-branch-source"
        "allure-jenkins-plugin"
        "html-publisher"
        "junit"
        "slack"
        "email-ext"
        "build-timeout"
        "timestamper"
        "ansicolor"
        "workspace-cleanup"
        "docker-workflow"
        "docker-plugin"
        "credentials-binding"
        "ssh-credentials"
        "git"
        "job-dsl"
        "matrix-project"
        "parallel-test-executor"
    )
    
    # Download Jenkins CLI into container
    docker exec "$JENKINS_CONTAINER" wget -q http://localhost:8080/jnlpJars/jenkins-cli.jar -O /tmp/jenkins-cli.jar
    
    for plugin in "${plugins[@]}"; do
        print_status "Installing plugin: $plugin"
        docker exec "$JENKINS_CONTAINER" java -jar /tmp/jenkins-cli.jar -s http://localhost:8080 install-plugin "$plugin" || true
    done
    
    print_success "Plugins installation completed"
    print_warning "Jenkins restart required to activate plugins"
}

# Copy framework files to Jenkins container
copy_framework_files() {
    print_status "Copying Playwright framework files to Jenkins..."
    
    # Create jenkins jobs directory in container
    docker exec "$JENKINS_CONTAINER" mkdir -p /var/jenkins_home/jobs
    docker exec "$JENKINS_CONTAINER" mkdir -p /var/jenkins_home/playwright-framework
    
    # Copy our framework files
    docker cp . "$JENKINS_CONTAINER:/var/jenkins_home/playwright-framework/"
    
    print_success "Framework files copied to Jenkins container"
}

# Create Docker-optimized Jenkinsfile
create_docker_jenkinsfile() {
    print_status "Creating Docker-optimized Jenkinsfile..."
    
    cat > "Jenkinsfile.docker" << 'EOF'
#!/usr/bin/env groovy

/**
 * Playwright Framework Pipeline - Docker Optimized
 * Runs Playwright tests within Docker environment
 */

pipeline {
    agent {
        docker {
            image 'mcr.microsoft.com/playwright:v1.40.0-focal'
            args '-v /var/run/docker.sock:/var/run/docker.sock -v $PWD:/workspace -w /workspace'
        }
    }
    
    parameters {
        choice(
            name: 'BROWSER',
            choices: ['chromium', 'firefox', 'webkit', 'all'],
            description: 'Browser to run tests on'
        )
        choice(
            name: 'ENVIRONMENT',
            choices: ['local', 'staging', 'production'],
            description: 'Environment to test against'
        )
        booleanParameter(
            name: 'RUN_SAMPLE_APP',
            defaultValue: true,
            description: 'Start sample app for testing'
        )
        string(
            name: 'TEST_PATTERN',
            defaultValue: 'tests/**/*.spec.ts',
            description: 'Test pattern to run'
        )
    }
    
    environment {
        NODE_VERSION = '18'
        CI = 'true'
        PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '1'
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 1, unit: 'HOURS')
        timestamps()
        ansiColor('xterm')
    }
    
    stages {
        stage('🔧 Setup') {
            steps {
                script {
                    echo "🎭 Setting up Playwright test environment..."
                    
                    // Install dependencies
                    sh 'npm ci'
                    
                    // Verify Playwright installation
                    sh 'npx playwright --version'
                    
                    // List available browsers
                    sh 'npx playwright install --dry-run'
                }
            }
        }
        
        stage('🚀 Start Sample App') {
            when {
                expression { params.RUN_SAMPLE_APP }
            }
            steps {
                script {
                    echo "🌐 Starting sample applications..."
                    
                    // Start sample web app in background
                    sh 'npm run sample:web > logs/sample-web.log 2>&1 &'
                    
                    // Start sample API in background  
                    sh 'npm run sample:api > logs/sample-api.log 2>&1 &'
                    
                    // Wait for apps to be ready
                    sh '''
                        echo "Waiting for sample apps to start..."
                        for i in {1..30}; do
                            if curl -s http://localhost:3000 > /dev/null && curl -s http://localhost:3001/health > /dev/null; then
                                echo "✅ Sample apps are ready"
                                break
                            fi
                            echo "Waiting... ($i/30)"
                            sleep 2
                        done
                    '''
                }
            }
        }
        
        stage('🧪 Run Tests') {
            parallel {
                stage('Chromium Tests') {
                    when {
                        anyOf {
                            expression { params.BROWSER == 'chromium' }
                            expression { params.BROWSER == 'all' }
                        }
                    }
                    steps {
                        script {
                            sh """
                                npx playwright test ${params.TEST_PATTERN} \
                                    --project=chromium \
                                    --reporter=html,json,junit \
                                    --output-dir=test-results/chromium
                            """
                        }
                    }
                    post {
                        always {
                            publishTestResults testResultsPattern: 'test-results/chromium/junit.xml'
                            archiveArtifacts artifacts: 'test-results/chromium/**/*', fingerprint: true
                        }
                    }
                }
                
                stage('Firefox Tests') {
                    when {
                        anyOf {
                            expression { params.BROWSER == 'firefox' }
                            expression { params.BROWSER == 'all' }
                        }
                    }
                    steps {
                        script {
                            sh """
                                npx playwright test ${params.TEST_PATTERN} \
                                    --project=firefox \
                                    --reporter=html,json,junit \
                                    --output-dir=test-results/firefox
                            """
                        }
                    }
                    post {
                        always {
                            publishTestResults testResultsPattern: 'test-results/firefox/junit.xml'
                            archiveArtifacts artifacts: 'test-results/firefox/**/*', fingerprint: true
                        }
                    }
                }
                
                stage('WebKit Tests') {
                    when {
                        anyOf {
                            expression { params.BROWSER == 'webkit' }
                            expression { params.BROWSER == 'all' }
                        }
                    }
                    steps {
                        script {
                            sh """
                                npx playwright test ${params.TEST_PATTERN} \
                                    --project=webkit \
                                    --reporter=html,json,junit \
                                    --output-dir=test-results/webkit
                            """
                        }
                    }
                    post {
                        always {
                            publishTestResults testResultsPattern: 'test-results/webkit/junit.xml'
                            archiveArtifacts artifacts: 'test-results/webkit/**/*', fingerprint: true
                        }
                    }
                }
            }
        }
        
        stage('📊 Generate Reports') {
            steps {
                script {
                    echo "📋 Generating test reports..."
                    
                    // Generate consolidated HTML report
                    sh '''
                        mkdir -p playwright-report
                        npx playwright show-report --reporter=html playwright-report
                    '''
                    
                    // Generate Allure report if available
                    script {
                        if (fileExists('allure-results')) {
                            sh 'npx allure generate allure-results --output allure-report --clean'
                        }
                    }
                }
            }
            post {
                always {
                    // Publish HTML report
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'playwright-report',
                        reportFiles: 'index.html',
                        reportName: 'Playwright Test Report'
                    ])
                    
                    // Archive all reports
                    archiveArtifacts artifacts: 'playwright-report/**/*', fingerprint: true
                    archiveArtifacts artifacts: 'logs/**/*', fingerprint: true, allowEmptyArchive: true
                }
            }
        }
    }
    
    post {
        always {
            script {
                // Stop sample apps
                sh 'pkill -f "npm run sample" || true'
                
                // Clean up
                cleanWs()
            }
        }
        
        success {
            echo "✅ Playwright tests completed successfully!"
        }
        
        failure {
            echo "❌ Playwright tests failed!"
        }
        
        unstable {
            echo "⚠️ Playwright tests completed with issues!"
        }
    }
}
EOF

    print_success "Docker-optimized Jenkinsfile created"
}

# Create seed job for Docker Jenkins
create_docker_seed_job() {
    print_status "Creating seed job configuration..."
    
    # Create job directory in container
    docker exec "$JENKINS_CONTAINER" mkdir -p /var/jenkins_home/jobs/playwright-framework-seed
    
    # Create job config
    cat > job-config.xml << 'EOF'
<?xml version='1.1' encoding='UTF-8'?>
<project>
  <description>Seed job for Playwright Framework - creates pipeline jobs</description>
  <keepDependencies>false</keepDependencies>
  <properties/>
  <scm class="hudson.plugins.git.GitSCM">
    <configVersion>2</configVersion>
    <userRemoteConfigs>
      <hudson.plugins.git.UserRemoteConfig>
        <url>https://github.com/bchand44/playwright-framework-backbar.git</url>
      </hudson.plugins.git.UserRemoteConfig>
    </userRemoteConfigs>
    <branches>
      <hudson.plugins.git.BranchSpec>
        <name>*/main</name>
      </hudson.plugins.git.BranchSpec>
    </branches>
  </scm>
  <builders>
    <javaposse.jobdsl.plugin.ExecuteDslScripts>
      <targets>jenkins/job-dsl.groovy</targets>
      <usingScriptText>false</usingScriptText>
      <sandbox>false</sandbox>
      <ignoreExisting>false</ignoreExisting>
      <ignoreMissingFiles>false</ignoreMissingFiles>
      <failOnMissingPlugin>false</failOnMissingPlugin>
      <unstableOnDeprecation>false</unstableOnDeprecation>
      <removedJobAction>IGNORE</removedJobAction>
      <removedViewAction>IGNORE</removedViewAction>
      <removedConfigFilesAction>IGNORE</removedConfigFilesAction>
      <lookupStrategy>JENKINS_ROOT</lookupStrategy>
    </javaposse.jobdsl.plugin.ExecuteDslScripts>
  </builders>
</project>
EOF

    # Copy config to container
    docker cp job-config.xml "$JENKINS_CONTAINER:/var/jenkins_home/jobs/playwright-framework-seed/config.xml"
    
    # Clean up
    rm job-config.xml
    
    print_success "Seed job created successfully"
}

# Display Jenkins access information
show_access_info() {
    print_success "🎉 Jenkins Docker setup completed!"
    
    echo ""
    echo "📋 Access Information:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🌐 Jenkins URL: $JENKINS_URL"
    echo "🐳 Container: $JENKINS_CONTAINER"
    echo ""
    
    echo "🔑 To get Jenkins admin password:"
    echo "   docker exec $JENKINS_CONTAINER cat /var/jenkins_home/secrets/initialAdminPassword"
    echo ""
    
    echo "📋 Next Steps:"
    echo "1. Open Jenkins at $JENKINS_URL"
    echo "2. Login with admin password from above command"
    echo "3. Install suggested plugins + restart Jenkins"
    echo "4. Run the 'playwright-framework-seed' job to create pipelines"
    echo "5. Configure GitHub credentials in Jenkins"
    echo "6. Set up Slack/Email notifications (optional)"
    echo ""
    
    echo "🎭 Available Pipelines:"
    echo "• playwright-automation-framework (Main pipeline)"
    echo "• playwright-nightly-regression (Nightly tests)"
    echo "• playwright-performance-baseline (Performance monitoring)"
    echo ""
    
    echo "🚀 Quick Test:"
    echo "   Navigate to any pipeline → Build with Parameters → Run!"
}

# Main execution
main() {
    print_status "Starting Jenkins Docker setup for Playwright Framework..."
    
    check_jenkins_container
    wait_for_jenkins
    copy_framework_files
    create_docker_jenkinsfile
    install_plugins
    create_docker_seed_job
    show_access_info
    
    print_success "Setup completed! Jenkins is ready for Playwright testing! 🎭"
}

# Run main function
main "$@"