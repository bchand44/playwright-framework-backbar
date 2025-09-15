#!/bin/bash

# Re-enable Jenkins Security Script
echo "🔐 Re-enabling Jenkins Security..."

# Stop Jenkins
docker stop jenkins

# Restore security setting
docker exec jenkins cp /var/jenkins_home/config.xml.backup /var/jenkins_home/config.xml

# Or manually set security to true
docker exec jenkins sed -i 's/<useSecurity>false<\/useSecurity>/<useSecurity>true<\/useSecurity>/' /var/jenkins_home/config.xml

# Restart Jenkins
docker start jenkins

echo "✅ Security re-enabled. You'll need to login again."
echo "Username: batistutachand"
echo "Password: (your original password)"

# Alternative: Create new admin user
echo ""
echo "If you can't remember password, access Jenkins and run in Script Console:"
echo 'import jenkins.model.*'
echo 'import hudson.security.*'
echo 'def jenkins = Jenkins.getInstance()'
echo 'def hudsonRealm = new HudsonPrivateSecurityRealm(false)'
echo 'hudsonRealm.createAccount("admin", "admin123")'
echo 'jenkins.setSecurityRealm(hudsonRealm)'
echo 'jenkins.save()'
echo 'println "New admin user created: admin/admin123"'