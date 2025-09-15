/**
 * Playwright Framework Jenkins Shared Library
 * Reusable functions for Playwright test automation
 */

def setupPlaywrightEnvironment(Map config = [:]) {
    def nodeVersion = config.nodeVersion ?: '18'
    def browsers = config.browsers ?: ['chromium', 'firefox', 'webkit']
    def installDeps = config.installDeps ?: true
    
    echo "🎭 Setting up Playwright environment..."
    
    // Setup Node.js
    sh """
        echo "📦 Installing Node.js ${nodeVersion}..."
        export NVM_DIR="\$HOME/.nvm"
        [ -s "\$NVM_DIR/nvm.sh" ] && . "\$NVM_DIR/nvm.sh"
        nvm install ${nodeVersion}
        nvm use ${nodeVersion}
        node --version
        npm --version
    """
    
    if (installDeps) {
        // Install dependencies
        sh 'npm ci --production=false'
    }
    
    // Install Playwright browsers
    def browserList = browsers.join(' ')
    sh "npx playwright install --with-deps ${browserList}"
    
    echo "✅ Playwright environment ready"
}

def runPlaywrightTests(Map config = [:]) {
    def testPattern = config.testPattern ?: 'tests/**/*.spec.ts'
    def browsers = config.browsers ?: ['chromium']
    def workers = config.workers ?: '4'
    def reporter = config.reporter ?: 'html,json,junit'
    def env = config.environment ?: 'staging'
    def retries = config.retries ?: '2'
    def timeout = config.timeout ?: '30000'
    def outputDir = config.outputDir ?: 'test-results'
    def tags = config.tags ?: ''
    def parallel = config.parallel ?: true
    
    echo "🧪 Running Playwright tests..."
    echo "📝 Pattern: ${testPattern}"
    echo "🌐 Browsers: ${browsers.join(', ')}"
    echo "👥 Workers: ${workers}"
    echo "🏷️ Tags: ${tags}"
    
    def results = [:]
    
    if (parallel && browsers.size() > 1) {
        // Run browsers in parallel
        def parallelJobs = [:]
        
        browsers.each { browser ->
            parallelJobs["${browser}"] = {
                def browserOutputDir = "${outputDir}/${browser}"
                
                sh """
                    mkdir -p ${browserOutputDir}
                    
                    npx playwright test ${testPattern} \
                        --project=${browser} \
                        --workers=${workers} \
                        --retries=${retries} \
                        --timeout=${timeout} \
                        --reporter=${reporter} \
                        --output-dir=${browserOutputDir} \
                        ${tags ? "--grep='${tags}'" : ''} \
                        ${env ? "--env=${env}" : ''}
                """
                
                // Collect results
                if (fileExists("${browserOutputDir}/results.json")) {
                    def browserResults = readJSON file: "${browserOutputDir}/results.json"
                    results[browser] = browserResults
                }
            }
        }
        
        parallel parallelJobs
    } else {
        // Run sequentially or single browser
        browsers.each { browser ->
            def browserOutputDir = "${outputDir}/${browser}"
            
            sh """
                mkdir -p ${browserOutputDir}
                
                npx playwright test ${testPattern} \
                    --project=${browser} \
                    --workers=${workers} \
                    --retries=${retries} \
                    --timeout=${timeout} \
                    --reporter=${reporter} \
                    --output-dir=${browserOutputDir} \
                    ${tags ? "--grep='${tags}'" : ''} \
                    ${env ? "--env=${env}" : ''}
            """
            
            if (fileExists("${browserOutputDir}/results.json")) {
                def browserResults = readJSON file: "${browserOutputDir}/results.json"
                results[browser] = browserResults
            }
        }
    }
    
    return results
}

def publishPlaywrightReports(Map config = [:]) {
    def outputDir = config.outputDir ?: 'test-results'
    def reportTitle = config.reportTitle ?: 'Playwright Test Report'
    def allureResults = config.allureResults ?: 'allure-results'
    def keepAll = config.keepAll ?: true
    
    echo "📊 Publishing Playwright reports..."
    
    // Archive test artifacts
    if (fileExists(outputDir)) {
        archiveArtifacts artifacts: "${outputDir}/**/*", fingerprint: true, allowEmptyArchive: true
    }
    
    // Publish HTML reports
    if (fileExists("${outputDir}/index.html")) {
        publishHTML([
            allowMissing: false,
            alwaysLinkToLastBuild: true,
            keepAll: keepAll,
            reportDir: outputDir,
            reportFiles: 'index.html',
            reportName: reportTitle
        ])
    }
    
    // Publish test results
    if (fileExists("${outputDir}/**/junit.xml")) {
        publishTestResults testResultsPattern: "${outputDir}/**/junit.xml"
    }
    
    // Publish Allure report
    if (fileExists(allureResults)) {
        allure([
            includeProperties: false,
            jdk: '',
            properties: [],
            reportBuildPolicy: 'ALWAYS',
            results: [[path: allureResults]]
        ])
    }
    
    echo "✅ Reports published successfully"
}

def checkQualityGates(Map config = [:]) {
    def testResults = config.testResults ?: [:]
    def passThreshold = config.passThreshold ?: 95
    def performanceThreshold = config.performanceThreshold ?: 90
    def coverageThreshold = config.coverageThreshold ?: 80
    def securityThreshold = config.securityThreshold ?: 0
    
    echo "🚦 Checking quality gates..."
    
    def qualityGates = [:]
    def passed = true
    
    // Test pass rate
    if (testResults.passRate != null) {
        qualityGates.testPassRate = testResults.passRate >= passThreshold
        if (!qualityGates.testPassRate) {
            passed = false
            echo "❌ Test pass rate: ${testResults.passRate}% < ${passThreshold}%"
        } else {
            echo "✅ Test pass rate: ${testResults.passRate}% >= ${passThreshold}%"
        }
    }
    
    // Performance score
    if (testResults.performanceScore != null) {
        qualityGates.performance = testResults.performanceScore >= performanceThreshold
        if (!qualityGates.performance) {
            passed = false
            echo "❌ Performance score: ${testResults.performanceScore}% < ${performanceThreshold}%"
        } else {
            echo "✅ Performance score: ${testResults.performanceScore}% >= ${performanceThreshold}%"
        }
    }
    
    // Code coverage
    if (testResults.coverage != null) {
        qualityGates.coverage = testResults.coverage >= coverageThreshold
        if (!qualityGates.coverage) {
            passed = false
            echo "❌ Code coverage: ${testResults.coverage}% < ${coverageThreshold}%"
        } else {
            echo "✅ Code coverage: ${testResults.coverage}% >= ${coverageThreshold}%"
        }
    }
    
    // Security issues
    if (testResults.securityIssues != null) {
        qualityGates.security = testResults.securityIssues <= securityThreshold
        if (!qualityGates.security) {
            passed = false
            echo "❌ Security issues: ${testResults.securityIssues} > ${securityThreshold}"
        } else {
            echo "✅ Security issues: ${testResults.securityIssues} <= ${securityThreshold}"
        }
    }
    
    qualityGates.overall = passed
    
    if (!passed) {
        currentBuild.result = 'UNSTABLE'
        echo "🚨 Quality gates failed!"
    } else {
        echo "✅ All quality gates passed!"
    }
    
    return qualityGates
}

def notifySlack(Map config = [:]) {
    def channel = config.channel ?: '#qa-automation'
    def status = config.status ?: currentBuild.result ?: 'SUCCESS'
    def title = config.title ?: 'Playwright Test Results'
    def message = config.message ?: ''
    def testResults = config.testResults ?: [:]
    def includeReports = config.includeReports ?: true
    
    def color = 'good'
    def emoji = '✅'
    
    switch(status) {
        case 'SUCCESS':
            color = 'good'
            emoji = '✅'
            break
        case 'UNSTABLE':
            color = 'warning'
            emoji = '⚠️'
            break
        case 'FAILURE':
            color = 'danger'
            emoji = '❌'
            break
        default:
            color = 'good'
            emoji = '🔄'
    }
    
    def slackMessage = """
${emoji} *${title} - ${status}*
🎯 *Build:* ${BUILD_NUMBER}
🌿 *Branch:* ${env.BRANCH_NAME ?: 'main'}
⏱️ *Duration:* ${currentBuild.durationString}
    """.trim()
    
    if (testResults.totalTests) {
        slackMessage += """

📊 *Test Results:*
• Total Tests: ${testResults.totalTests}
• Passed: ${testResults.passed ?: 0}
• Failed: ${testResults.failed ?: 0}
• Skipped: ${testResults.skipped ?: 0}
• Pass Rate: ${testResults.passRate ?: 'N/A'}%
        """.trim()
    }
    
    if (includeReports) {
        slackMessage += """

🔗 *Reports:*
• <${BUILD_URL}|Build Details>
• <${BUILD_URL}allure/|Allure Report>
• <${BUILD_URL}artifact/playwright-report/index.html|Playwright Report>
        """.trim()
    }
    
    if (message) {
        slackMessage += "\n\n${message}"
    }
    
    slackSend(
        channel: channel,
        color: color,
        message: slackMessage
    )
}

def notifyEmail(Map config = [:]) {
    def to = config.to ?: 'qa-team@company.com'
    def subject = config.subject ?: "Playwright Test Results - Build ${BUILD_NUMBER}"
    def status = config.status ?: currentBuild.result ?: 'SUCCESS'
    def testResults = config.testResults ?: [:]
    def includeReports = config.includeReports ?: true
    
    def emoji = status == 'SUCCESS' ? '✅' : status == 'UNSTABLE' ? '⚠️' : '❌'
    
    def htmlBody = """
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; }
            .success { color: #28a745; }
            .warning { color: #ffc107; }
            .danger { color: #dc3545; }
            .info { color: #17a2b8; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
        </style>
    </head>
    <body>
        <div class="header">
            <h2>${emoji} Playwright Test Results - Build ${BUILD_NUMBER}</h2>
            <p><strong>Status:</strong> <span class="${status.toLowerCase()}">${status}</span></p>
            <p><strong>Branch:</strong> ${env.BRANCH_NAME ?: 'main'}</p>
            <p><strong>Duration:</strong> ${currentBuild.durationString}</p>
        </div>
    """.trim()
    
    if (testResults.totalTests) {
        htmlBody += """
        <h3>📊 Test Summary</h3>
        <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Total Tests</td><td>${testResults.totalTests}</td></tr>
            <tr><td>Passed</td><td class="success">${testResults.passed ?: 0}</td></tr>
            <tr><td>Failed</td><td class="danger">${testResults.failed ?: 0}</td></tr>
            <tr><td>Skipped</td><td class="warning">${testResults.skipped ?: 0}</td></tr>
            <tr><td>Pass Rate</td><td>${testResults.passRate ?: 'N/A'}%</td></tr>
        </table>
        """.trim()
    }
    
    if (includeReports) {
        htmlBody += """
        <h3>🔗 Reports</h3>
        <ul>
            <li><a href="${BUILD_URL}">Build Details</a></li>
            <li><a href="${BUILD_URL}allure/">Allure Report</a></li>
            <li><a href="${BUILD_URL}artifact/playwright-report/index.html">Playwright Report</a></li>
            <li><a href="${BUILD_URL}console">Console Logs</a></li>
        </ul>
        """.trim()
    }
    
    htmlBody += """
    </body>
    </html>
    """.trim()
    
    emailext(
        subject: subject,
        body: htmlBody,
        to: to,
        mimeType: 'text/html'
    )
}

def deployToEnvironment(Map config = [:]) {
    def environment = config.environment ?: 'staging'
    def artifact = config.artifact ?: ''
    def healthCheckUrl = config.healthCheckUrl ?: ''
    def timeout = config.timeout ?: 300
    def rollbackOnFailure = config.rollbackOnFailure ?: true
    
    echo "🚀 Deploying to ${environment} environment..."
    
    try {
        // Deployment steps (customize based on your deployment strategy)
        if (artifact) {
            sh "kubectl apply -f ${artifact} --namespace=${environment}"
        }
        
        // Wait for deployment
        sh "kubectl rollout status deployment/app --namespace=${environment} --timeout=${timeout}s"
        
        // Health check
        if (healthCheckUrl) {
            echo "🔍 Performing health check..."
            retry(5) {
                sh "curl -f ${healthCheckUrl}/health || exit 1"
                sleep 10
            }
        }
        
        echo "✅ Deployment to ${environment} successful"
        return true
        
    } catch (Exception e) {
        echo "❌ Deployment failed: ${e.message}"
        
        if (rollbackOnFailure) {
            echo "🔄 Rolling back deployment..."
            sh "kubectl rollout undo deployment/app --namespace=${environment}"
        }
        
        throw e
    }
}

def generateTestReport(Map config = [:]) {
    def testResults = config.testResults ?: [:]
    def outputPath = config.outputPath ?: 'test-summary.json'
    def includeMetrics = config.includeMetrics ?: true
    
    echo "📊 Generating test report..."
    
    def report = [
        timestamp: new Date().toString(),
        build: [
            number: BUILD_NUMBER,
            url: BUILD_URL,
            branch: env.BRANCH_NAME ?: 'main',
            duration: currentBuild.durationString
        ],
        results: testResults
    ]
    
    if (includeMetrics) {
        report.metrics = [
            passRate: testResults.passRate,
            failureRate: testResults.failed ? (testResults.failed / testResults.totalTests * 100) : 0,
            coverage: testResults.coverage,
            performance: testResults.performanceScore
        ]
    }
    
    writeJSON file: outputPath, json: report, pretty: 4
    
    echo "✅ Test report generated: ${outputPath}"
    return report
}

return this