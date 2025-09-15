# Jenkins Plugins Installation Commands
# Run these in Jenkins "Manage Jenkins" > "Script Console"

// Install essential plugins for Playwright
def plugins = [
    'workflow-aggregator',
    'pipeline-stage-view', 
    'nodejs',
    'github',
    'allure-jenkins-plugin',
    'html-publisher',
    'junit',
    'slack',
    'email-ext',
    'build-timeout',
    'timestamper',
    'ansicolor'
]

def pluginManager = Jenkins.instance.pluginManager
def updateCenter = Jenkins.instance.updateCenter

plugins.each { pluginName ->
    if (!pluginManager.getPlugin(pluginName)) {
        println "Installing plugin: ${pluginName}"
        def plugin = updateCenter.getPlugin(pluginName)
        if (plugin) {
            plugin.deploy(true)
        }
    } else {
        println "Plugin already installed: ${pluginName}"
    }
}

println "Plugin installation completed. Restart Jenkins to activate new plugins."