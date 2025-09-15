#!/bin/bash

# Jenkins Setup Script for Playwright Framework
# This script sets up Jenkins with all required plugins and configurations

set -e

echo "🎭 Setting up Jenkins for Playwright Framework..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
JENKINS_HOME=${JENKINS_HOME:-"/var/lib/jenkins"}
JENKINS_USER=${JENKINS_USER:-"jenkins"}
JENKINS_URL=${JENKINS_URL:-"http://localhost:8080"}
JENKINS_CLI_JAR="$JENKINS_HOME/jenkins-cli.jar"

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

# Check if Jenkins is running
check_jenkins() {
    print_status "Checking Jenkins status..."
    
    if curl -s "$JENKINS_URL" > /dev/null; then
        print_success "Jenkins is running at $JENKINS_URL"
    else
        print_error "Jenkins is not accessible at $JENKINS_URL"
        print_error "Please ensure Jenkins is running and accessible"
        exit 1
    fi
}

# Download Jenkins CLI
download_jenkins_cli() {
    print_status "Downloading Jenkins CLI..."
    
    if [ ! -f "$JENKINS_CLI_JAR" ]; then
        wget -q "$JENKINS_URL/jnlpJars/jenkins-cli.jar" -O "$JENKINS_CLI_JAR"
        print_success "Jenkins CLI downloaded"
    else
        print_status "Jenkins CLI already exists"
    fi
}

# Install required plugins
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
        "performance"
        "jira"
        "multi-branch-project-plugin"
        "job-dsl"
        "matrix-project"
        "parallel-test-executor"
        "test-results-analyzer"
    )
    
    for plugin in "${plugins[@]}"; do
        print_status "Installing plugin: $plugin"
        java -jar "$JENKINS_CLI_JAR" -s "$JENKINS_URL" install-plugin "$plugin" || true
    done
    
    print_success "All plugins installation attempted"
    print_warning "Please restart Jenkins to activate new plugins"
}

# Setup Node.js tool
setup_nodejs() {
    print_status "Setting up Node.js tool configuration..."
    
    cat > "$JENKINS_HOME/nodejs-tool-config.xml" << 'EOF'
<?xml version='1.1' encoding='UTF-8'?>
<jenkins.plugins.nodejs.tools.NodeJSInstallation_-DescriptorImpl>
  <installations>
    <jenkins.plugins.nodejs.tools.NodeJSInstallation>
      <name>NodeJS-18</name>
      <home></home>
      <properties>
        <jenkins.plugins.nodejs.tools.NodeJSInstallation_-DownloadInstaller>
          <id>18.18.0</id>
          <npmPackages>
            <jenkins.plugins.nodejs.tools.NPMPackage>
              <name>playwright</name>
              <version></version>
            </jenkins.plugins.nodejs.tools.NPMPackage>
            <jenkins.plugins.nodejs.tools.NPMPackage>
              <name>@playwright/test</name>
              <version></version>
            </jenkins.plugins.nodejs.tools.NPMPackage>
          </npmPackages>
        </jenkins.plugins.nodejs.tools.NodeJSInstallation_-DownloadInstaller>
      </properties>
    </jenkins.plugins.nodejs.tools.NodeJSInstallation>
  </installations>
</jenkins.plugins.nodejs.tools.NodeJSInstallation_-DescriptorImpl>
EOF

    print_success "Node.js tool configuration created"
}

# Setup global pipeline libraries
setup_global_libraries() {
    print_status "Setting up global pipeline libraries..."
    
    cat > "$JENKINS_HOME/global-libraries-config.xml" << 'EOF'
<?xml version='1.1' encoding='UTF-8'?>
<org.jenkinsci.plugins.workflow.libs.GlobalLibraries>
  <libraries>
    <org.jenkinsci.plugins.workflow.libs.LibraryConfiguration>
      <name>playwright-shared-library</name>
      <retriever class="org.jenkinsci.plugins.workflow.libs.SCMSourceRetriever">
        <scm class="jenkins.plugins.git.GitSCMSource">
          <id>playwright-shared-library</id>
          <remote>https://github.com/bchand44/playwright-framework-backbar.git</remote>
          <credentialsId></credentialsId>
          <traits>
            <jenkins.plugins.git.traits.BranchDiscoveryTrait/>
          </traits>
        </scm>
      </retriever>
      <defaultVersion>main</defaultVersion>
      <allowVersionOverride>true</allowVersionOverride>
      <includeInChangesets>false</includeInChangesets>
    </org.jenkinsci.plugins.workflow.libs.LibraryConfiguration>
  </libraries>
</org.jenkinsci.plugins.workflow.libs.GlobalLibraries>
EOF

    print_success "Global pipeline libraries configuration created"
}

# Create job DSL seed job
create_seed_job() {
    print_status "Creating Job DSL seed job..."
    
    cat > "$JENKINS_HOME/jobs/playwright-seed-job/config.xml" << 'EOF'
<?xml version='1.1' encoding='UTF-8'?>
<project>
  <actions/>
  <description>Seed job for creating Playwright Framework jobs</description>
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

    mkdir -p "$JENKINS_HOME/jobs/playwright-seed-job"
    print_success "Seed job configuration created"
}

# Setup Allure configuration
setup_allure() {
    print_status "Setting up Allure configuration..."
    
    cat > "$JENKINS_HOME/allure-config.xml" << 'EOF'
<?xml version='1.1' encoding='UTF-8'?>
<ru.yandex.qatools.allure.jenkins.tools.AllureCommandlineInstallation_-DescriptorImpl>
  <installations>
    <ru.yandex.qatools.allure.jenkins.tools.AllureCommandlineInstallation>
      <name>Allure-2.20.1</name>
      <home></home>
      <properties>
        <ru.yandex.qatools.allure.jenkins.tools.AllureCommandlineInstaller>
          <id>2.20.1</id>
        </ru.yandex.qatools.allure.jenkins.tools.AllureCommandlineInstaller>
      </properties>
    </ru.yandex.qatools.allure.jenkins.tools.AllureCommandlineInstallation>
  </installations>
</ru.yandex.qatools.allure.jenkins.tools.AllureCommandlineInstallation_-DescriptorImpl>
EOF

    print_success "Allure configuration created"
}

# Setup Docker configuration
setup_docker() {
    print_status "Setting up Docker configuration..."
    
    # Add jenkins user to docker group
    if groups "$JENKINS_USER" | grep -q docker; then
        print_status "Jenkins user already in docker group"
    else
        print_status "Adding jenkins user to docker group..."
        sudo usermod -aG docker "$JENKINS_USER"
        print_success "Jenkins user added to docker group"
        print_warning "Please restart Jenkins service for changes to take effect"
    fi
    
    # Create Docker configuration
    cat > "$JENKINS_HOME/docker-config.xml" << 'EOF'
<?xml version='1.1' encoding='UTF-8'?>
<com.nirima.jenkins.plugins.docker.DockerPluginConfiguration>
  <dockerClouds>
    <com.nirima.jenkins.plugins.docker.DockerCloud>
      <name>docker-local</name>
      <dockerApi>
        <dockerHost>
          <uri>unix:///var/run/docker.sock</uri>
        </dockerHost>
      </dockerApi>
      <containerCap>10</containerCap>
      <version></version>
    </com.nirima.jenkins.plugins.docker.DockerCloud>
  </dockerClouds>
</com.nirima.jenkins.plugins.docker.DockerPluginConfiguration>
EOF

    print_success "Docker configuration created"
}

# Create Jenkins credentials
create_credentials() {
    print_status "Creating example credentials configuration..."
    
    mkdir -p "$JENKINS_HOME/credentials"
    
    cat > "$JENKINS_HOME/credentials/example-credentials.xml" << 'EOF'
<?xml version='1.1' encoding='UTF-8'?>
<!-- Example credentials configuration -->
<!-- Replace with your actual credentials -->
<list>
  <com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>
    <scope>GLOBAL</scope>
    <id>github-credentials</id>
    <description>GitHub credentials for repository access</description>
    <username>your-github-username</username>
    <password>your-github-token</password>
  </com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>
  
  <org.jenkinsci.plugins.plaincredentials.impl.StringCredentialsImpl>
    <scope>GLOBAL</scope>
    <id>slack-token</id>
    <description>Slack bot token for notifications</description>
    <secret>your-slack-bot-token</secret>
  </org.jenkinsci.plugins.plaincredentials.impl.StringCredentialsImpl>
  
  <com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>
    <scope>GLOBAL</scope>
    <id>jira-credentials</id>
    <description>JIRA credentials for integration</description>
    <username>your-jira-username</username>
    <password>your-jira-api-token</password>
  </com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>
</list>
EOF

    print_success "Example credentials configuration created"
    print_warning "Please update credentials with your actual values"
}

# Setup security configuration
setup_security() {
    print_status "Setting up security configuration..."
    
    cat > "$JENKINS_HOME/security-config.xml" << 'EOF'
<?xml version='1.1' encoding='UTF-8'?>
<jenkins.security.DefaultSecurityRealm>
  <allowsSignup>false</allowsSignup>
  <enableCaptcha>false</enableCaptcha>
</jenkins.security.DefaultSecurityRealm>
EOF

    print_success "Security configuration created"
}

# Create maintenance scripts
create_maintenance_scripts() {
    print_status "Creating maintenance scripts..."
    
    mkdir -p "$JENKINS_HOME/maintenance"
    
    # Cleanup script
    cat > "$JENKINS_HOME/maintenance/cleanup.sh" << 'EOF'
#!/bin/bash
# Jenkins maintenance cleanup script

echo "🧹 Running Jenkins maintenance cleanup..."

# Clean old builds (keep last 30)
find /var/lib/jenkins/jobs/*/builds -maxdepth 1 -type d -name "[0-9]*" | \
    sort -V | head -n -30 | xargs rm -rf

# Clean old workspaces
find /var/lib/jenkins/workspace -maxdepth 1 -type d -mtime +7 -exec rm -rf {} \;

# Clean old logs
find /var/lib/jenkins/logs -name "*.log" -mtime +14 -delete

# Clean Docker images
docker system prune -f

echo "✅ Cleanup completed"
EOF

    chmod +x "$JENKINS_HOME/maintenance/cleanup.sh"
    
    # Backup script
    cat > "$JENKINS_HOME/maintenance/backup.sh" << 'EOF'
#!/bin/bash
# Jenkins backup script

BACKUP_DIR="/backup/jenkins"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="jenkins_backup_$DATE.tar.gz"

echo "💾 Creating Jenkins backup..."

mkdir -p "$BACKUP_DIR"

tar -czf "$BACKUP_DIR/$BACKUP_FILE" \
    --exclude="workspace" \
    --exclude="logs" \
    --exclude="caches" \
    /var/lib/jenkins

echo "✅ Backup created: $BACKUP_DIR/$BACKUP_FILE"

# Keep only last 7 backups
find "$BACKUP_DIR" -name "jenkins_backup_*.tar.gz" -mtime +7 -delete
EOF

    chmod +x "$JENKINS_HOME/maintenance/backup.sh"
    
    print_success "Maintenance scripts created"
}

# Main execution
main() {
    print_status "Starting Jenkins setup for Playwright Framework..."
    
    check_jenkins
    download_jenkins_cli
    install_plugins
    setup_nodejs
    setup_global_libraries
    create_seed_job
    setup_allure
    setup_docker
    create_credentials
    setup_security
    create_maintenance_scripts
    
    print_success "Jenkins setup completed!"
    print_warning "Please restart Jenkins to apply all configurations"
    print_status "Next steps:"
    echo "  1. Restart Jenkins service"
    echo "  2. Update credentials in Jenkins UI"
    echo "  3. Run the seed job to create Playwright jobs"
    echo "  4. Configure Slack/Email notifications"
    echo "  5. Set up your first pipeline"
}

# Run main function
main "$@"