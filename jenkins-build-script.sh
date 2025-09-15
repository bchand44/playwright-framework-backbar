#!/bin/bash

echo "🎭 ===== PLAYWRIGHT TEST EXECUTION ====="
echo "🕐 Started at: $(date)"
echo "🌐 Browser: $BROWSER"
echo "🎯 Test Pattern: $TEST_PATTERN" 
echo "🚀 Sample Apps: $RUN_SAMPLE_APP"
echo "==============================================="

# Navigate to framework directory
cd /var/jenkins_home/playwright-framework || {
    echo "❌ Error: Framework directory not found!"
    exit 1
}

echo "📂 Current directory: $(pwd)"
echo "📋 Directory contents:"
ls -la

# Setup environment
export CI=true
export NODE_OPTIONS="--max-old-space-size=4096"

# Check Node and npm
echo "📦 Node version: $(node --version)"
echo "📦 NPM version: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
if [ -f "package.json" ]; then
    npm install || npm ci || echo "⚠️ Using existing node_modules"
else
    echo "❌ package.json not found!"
    exit 1
fi

# Install Playwright browsers
echo "🎭 Installing Playwright browsers..."
npx playwright install chromium || echo "⚠️ Browser installation failed, using existing"

# Verify Playwright installation
echo "🎭 Playwright version:"
npx playwright --version

# List available tests
echo "📋 Available tests:"
find tests -name "*.spec.ts" -type f | head -10

# Start sample applications if requested
if [ "$RUN_SAMPLE_APP" = "true" ]; then
    echo "🚀 Starting sample applications..."
    
    # Create logs directory
    mkdir -p logs
    
    # Kill any existing processes
    echo "🧹 Cleaning existing processes..."
    pkill -f "sample" || true
    pkill -f "node.*3000" || true
    pkill -f "node.*3001" || true
    sleep 3
    
    # Check if package.json has sample scripts
    if grep -q "sample:web" package.json && grep -q "sample:api" package.json; then
        echo "✅ Sample scripts found in package.json"
        
        # Start sample web app in background
        echo "🌐 Starting web app on port 3000..."
        nohup npm run sample:web > logs/sample-web.log 2>&1 &
        WEB_PID=$!
        echo $WEB_PID > logs/sample-web.pid
        
        # Start sample API in background  
        echo "🔌 Starting API on port 3001..."
        nohup npm run sample:api > logs/sample-api.log 2>&1 &
        API_PID=$!
        echo $API_PID > logs/sample-api.pid
        
        # Wait for apps to start
        echo "⏳ Waiting for applications to start..."
        sleep 20
        
        # Check if apps are running
        echo "🔍 Checking application status..."
        if curl -s --max-time 5 http://localhost:3000 > /dev/null; then
            echo "✅ Web app is running on port 3000"
        else
            echo "⚠️ Web app not responding on port 3000"
        fi
        
        if curl -s --max-time 5 http://localhost:3001/health > /dev/null; then
            echo "✅ API is running on port 3001"  
        else
            echo "⚠️ API not responding on port 3001"
        fi
        
    else
        echo "⚠️ Sample scripts not found in package.json"
    fi
else
    echo "⏭️ Skipping sample app startup (RUN_SAMPLE_APP=false)"
fi

# Run Playwright tests
echo ""
echo "🧪 ===== RUNNING PLAYWRIGHT TESTS ====="
echo "🎯 Test Pattern: $TEST_PATTERN"
echo "🌐 Browser: $BROWSER"

# Create test results directory
mkdir -p test-results
mkdir -p playwright-report

# Check if test file exists
if [ -f "$TEST_PATTERN" ]; then
    echo "✅ Test file found: $TEST_PATTERN"
else
    echo "⚠️ Test file not found: $TEST_PATTERN"
    echo "Available test files:"
    find tests -name "*.spec.ts" -type f | head -5
    echo "Trying with first available test..."
    TEST_PATTERN=$(find tests -name "*.spec.ts" -type f | head -1)
    echo "Using: $TEST_PATTERN"
fi

# Run tests
echo "🚀 Executing tests..."
npx playwright test "$TEST_PATTERN" \
    --project="$BROWSER" \
    --reporter=html,json,junit \
    --output-dir=test-results \
    --workers=1 \
    --retries=1 \
    --timeout=30000

TEST_EXIT_CODE=$?

# Show results
echo ""
echo "📊 ===== TEST RESULTS ====="
echo "Exit code: $TEST_EXIT_CODE"

if [ -d "test-results" ]; then
    echo "📁 Test results directory contents:"
    find test-results -type f | head -10
fi

if [ -d "playwright-report" ]; then
    echo "📁 Playwright report directory contents:"
    find playwright-report -type f | head -10
fi

# Cleanup sample apps
if [ "$RUN_SAMPLE_APP" = "true" ]; then
    echo ""
    echo "🧹 Cleaning up sample applications..."
    if [ -f "logs/sample-web.pid" ]; then
        kill $(cat logs/sample-web.pid) 2>/dev/null || true
    fi
    if [ -f "logs/sample-api.pid" ]; then  
        kill $(cat logs/sample-api.pid) 2>/dev/null || true
    fi
    pkill -f "sample" || true
fi

echo ""
echo "🎭 ===== PLAYWRIGHT TEST COMPLETED ====="
echo "🕐 Completed at: $(date)"
echo "📊 Final exit code: $TEST_EXIT_CODE"

exit $TEST_EXIT_CODE