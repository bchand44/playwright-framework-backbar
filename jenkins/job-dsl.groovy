// Jenkins Job DSL for Playwright Framework
// Place this in your Jenkins Job DSL script

multibranchPipelineJob('playwright-automation-framework') {
    description('🎭 Playwright Test Automation Framework - Multi-branch Pipeline')
    
    branchSources {
        github {
            id('playwright-framework')
            scanCredentialsId('github-credentials')
            repoOwner('bchand44')
            repository('playwright-framework-backbar')
            
            buildOriginBranch(true)
            buildOriginBranchWithPR(true)
            buildOriginPRMerge(false)
            buildForkPRMerge(false)
        }
    }
    
    // Scan triggers
    triggers {
        periodicFolderTrigger {
            interval('5m')  // Scan for new branches every 5 minutes
        }
    }
    
    // Build strategies
    factory {
        workflowBranchProjectFactory {
            scriptPath('Jenkinsfile')
        }
    }
    
    // Branch discovery
    configure { node ->
        def traits = node / 'sources' / 'data' / 'jenkins.branch.BranchSource' / 'source' / 'traits'
        
        // Discover branches
        traits << 'jenkins.plugins.git.traits.BranchDiscoveryTrait' {
            strategyId('1') // Exclude branches that are also filed as PRs
        }
        
        // Discover PRs from origin
        traits << 'org.jenkinsci.plugins.github_branch_source.OriginPullRequestDiscoveryTrait' {
            strategyId('1') // Merging the pull request with the current target branch revision
        }
        
        // Clean before checkout
        traits << 'jenkins.plugins.git.traits.CleanBeforeCheckoutTrait'
        
        // Checkout over SSH
        traits << 'jenkins.plugins.git.traits.GitLFSPullTrait'
    }
    
    // Folder-level properties
    properties {
        folderLibraries {
            libraries {
                libraryConfiguration {
                    name('playwright-shared-library')
                    retriever {
                        modernSCM {
                            scm {
                                github {
                                    credentialsId('github-credentials')
                                    repoOwner('bchand44')
                                    repository('jenkins-shared-library')
                                }
                            }
                        }
                    }
                    defaultVersion('main')
                    allowVersionOverride(true)
                    includeInChangesets(false)
                }
            }
        }
    }
}

// Create additional jobs for scheduled runs
pipelineJob('playwright-nightly-regression') {
    description('🌙 Nightly Regression Test Suite')
    
    parameters {
        choiceParam('ENVIRONMENT', ['staging', 'production'], 'Environment to test')
        booleanParam('FULL_REGRESSION', true, 'Run complete regression suite')
        booleanParam('PERFORMANCE_TESTS', true, 'Include performance tests')
        stringParam('NOTIFICATION_CHANNEL', '#qa-automation', 'Slack channel for notifications')
    }
    
    triggers {
        cron('H 2 * * *') // Run at 2 AM daily
    }
    
    definition {
        cpsScm {
            scm {
                git {
                    remote {
                        url('https://github.com/bchand44/playwright-framework-backbar.git')
                        credentials('github-credentials')
                    }
                    branch('main')
                }
            }
            scriptPath('jenkins/nightly-regression.Jenkinsfile')
        }
    }
}

// Performance testing job
pipelineJob('playwright-performance-baseline') {
    description('⚡ Performance Baseline Testing')
    
    parameters {
        choiceParam('BASELINE_ENVIRONMENT', ['staging', 'production'], 'Environment for baseline')
        stringParam('PERFORMANCE_THRESHOLD', '95', 'Performance score threshold (%)')
        booleanParam('UPDATE_BASELINE', false, 'Update performance baseline')
    }
    
    triggers {
        cron('H 6 * * 1') // Run weekly on Mondays at 6 AM
    }
    
    definition {
        cpsScm {
            scm {
                git {
                    remote {
                        url('https://github.com/bchand44/playwright-framework-backbar.git')
                        credentials('github-credentials')
                    }
                    branch('main')
                }
            }
            scriptPath('jenkins/performance-baseline.Jenkinsfile')
        }
    }
}