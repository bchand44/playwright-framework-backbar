#!/bin/bash

# Simple Jenkins Password Reset Script
echo "🔐 Resetting Jenkins Password..."

# Method 1: Disable security temporarily
echo "Option 1: Temporarily disable Jenkins security"
echo "1. Stop Jenkins container: docker stop jenkins"
echo "2. Edit config to disable security"
echo "3. Start Jenkins and reset password"
echo "4. Re-enable security"

# Method 2: Use Jenkins CLI with script
echo ""
echo "Option 2: Using Jenkins Script Console"
echo "1. Access Jenkins at http://localhost:8080"
echo "2. If you can access, go to 'Manage Jenkins' > 'Script Console'"
echo "3. Paste and run this script:"
echo ""
cat << 'EOF'
import jenkins.model.*
import hudson.security.*

def jenkins = Jenkins.getInstance()
def user = jenkins.getUser("batistutachand")
if (user) {
    user.addProperty(hudson.security.HudsonPrivateSecurityRealm.Details.fromPlainPassword("admin123"))
    user.save()
    println "✅ Password reset successfully!"
    println "Username: batistutachand"
    println "New password: admin123"
} else {
    println "❌ User 'batistutachand' not found"
    // Create new admin user
    def hudsonRealm = new HudsonPrivateSecurityRealm(false)
    hudsonRealm.createAccount("admin", "admin123")
    jenkins.setSecurityRealm(hudsonRealm)
    jenkins.save()
    println "✅ Created new admin user: admin/admin123"
}
EOF

echo ""
echo "Option 3: Reset by disabling security temporarily"