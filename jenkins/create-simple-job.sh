#!/bin/bash

# Create Playwright job via Jenkins REST API
echo "🎭 Creating Playwright job via API..."

# Job XML configuration
cat > job.xml << 'EOF'
<?xml version='1.1' encoding='UTF-8'?>
<project>
  <actions/>
  <description>🎭 Playwright Framework Quick Test</description>
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
  <scm class="hudson.scm.NullSCM"/>
  <builders>
    <hudson.tasks.Shell>
      <command>
# Playwright Test Execution Script
echo "🎭 Starting Playwright test execution..."

# Navigate to framework directory
cd /var/jenkins_home/playwright-framework

# Setup environment
export CI=true
export NODE_OPTIONS="--max-old-space-size=4096"

echo "📦 Installing dependencies..."
npm install || npm ci || echo "Using existing node_modules"

echo "🎭 Installing Playwright browsers..."
npx playwright install chromium || echo "Browser already installed"

echo "📋 Playwright version:"
npx playwright --version

# Start sample applications if requested
if [ "$RUN_SAMPLE_APP" = "true" ]; then
    echo "🚀 Starting sample applications..."
    
    # Create logs directory
    mkdir -p logs
    
    # Kill any existing processes
    pkill -f "sample" || true
    sleep 2
    
    # Start sample web app in background
    nohup npm run sample:web > logs/sample-web.log 2>&1 &
    echo $! > logs/sample-web.pid
    
    # Start sample API in background  
    nohup npm run sample:api > logs/sample-api.log 2>&1 &
    echo $! > logs/sample-api.pid
    
    # Wait for apps to start
    echo "⏳ Waiting for applications to start..."
    sleep 15
    
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
fi

# Run Playwright tests
echo "🧪 Running Playwright tests..."
echo "Browser: $BROWSER"
echo "Test Pattern: $TEST_PATTERN"

# Create test results directory
mkdir -p test-results

# Run tests
npx playwright test "$TEST_PATTERN" \
    --project="$BROWSER" \
    --reporter=html,json,junit \
    --output-dir=test-results

# Show results
echo "📊 Test execution completed!"
echo "=== TEST RESULTS ==="
ls -la test-results/ || echo "No results directory"

# Show logs if available
if [ -d "logs" ]; then
    echo "=== SAMPLE APP LOGS ==="
    echo "--- Web App Log (last 10 lines) ---"
    tail -10 logs/sample-web.log 2>/dev/null || echo "No web app log"
    echo "--- API Log (last 10 lines) ---"
    tail -10 logs/sample-api.log 2>/dev/null || echo "No API log"
fi

# Cleanup
if [ "$RUN_SAMPLE_APP" = "true" ]; then
    echo "🧹 Cleaning up sample applications..."
    if [ -f "logs/sample-web.pid" ]; then
        kill $(cat logs/sample-web.pid) 2>/dev/null || true
    fi
    if [ -f "logs/sample-api.pid" ]; then  
        kill $(cat logs/sample-api.pid) 2>/dev/null || true
    fi
    pkill -f "sample" || true
fi

echo "✅ Playwright test execution completed!"
      </command>
    </hudson.tasks.Shell>
  </builders>
  <publishers>
    <hudson.tasks.ArtifactArchiver>
      <artifacts>test-results/**/*,playwright-report/**/*,logs/**/*</artifacts>
      <allowEmptyArchive>true</allowEmptyArchive>
      <onlyIfSuccessful>false</onlyIfSuccessful>
      <fingerprint>false</fingerprint>
      <defaultExcludes>true</defaultExcludes>
      <caseSensitive>true</caseSensitive>
      <followSymlinks>false</followSymlinks>
    </hudson.tasks.ArtifactArchiver>
    <hudson.tasks.junit.JunitResultArchiver>
      <testResults>test-results/**/junit.xml</testResults>
      <keepLongStdio>false</keepLongStdio>
      <healthScaleFactor>1.0</healthScaleFactor>
      <allowEmptyResults>true</allowEmptyResults>
    </hudson.tasks.junit.JunitResultArchiver>
    <htmlpublisher.HtmlPublisher>
      <reportTargets>
        <htmlpublisher.HtmlPublisherTarget>
          <reportName>Playwright Test Report</reportName>
          <reportDir>playwright-report</reportDir>
          <reportFiles>index.html</reportFiles>
          <alwaysLinkToLastBuild>true</alwaysLinkToLastBuild>
          <keepAll>true</keepAll>
          <allowMissing>true</allowMissing>
          <wrapperName>htmlpublisher-wrapper.html</wrapperName>
        </htmlpublisher.HtmlPublisherTarget>
      </reportTargets>
    </htmlpublisher.HtmlPublisher>
  </publishers>
  <buildWrappers/>
</project>
EOF

# Create the job using curl
echo "📝 Creating job 'playwright-test' in Jenkins..."
curl -X POST "http://localhost:8080/createItem?name=playwright-test" \
     -H "Content-Type: application/xml" \
     --data-binary @job.xml

echo ""
echo "✅ Job creation request sent!"
echo "🔄 Refreshing Jenkins..."

# Clean up
rm job.xml

# Try to trigger a rescan
curl -X POST "http://localhost:8080/computer/(master)/doConfigSubmit" 2>/dev/null || true

echo "✅ Done! Check Jenkins dashboard for 'playwright-test' job"