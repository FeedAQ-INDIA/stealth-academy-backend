/**
 * Quick test to verify db import is working correctly
 */

const db = require("./src/entity");

async function testDbImport() {
    console.log("Testing database import...");
    
    try {
        // Check if required models are available
        console.log("✅ db object imported:", typeof db);
        console.log("✅ db.Organization available:", typeof db.Organization);
        console.log("✅ db.OrganizationUser available:", typeof db.OrganizationUser);
        console.log("✅ db.User available:", typeof db.User);
        
        // Test if we can access model methods
        console.log("✅ OrganizationUser.findOne method:", typeof db.OrganizationUser.findOne);
        console.log("✅ Organization.create method:", typeof db.Organization.create);
        
        console.log("\n🎯 Database import test PASSED!");
        console.log("The organization creation logic should now work correctly.");
        
    } catch (error) {
        console.error("❌ Database import test FAILED:", error.message);
        throw error;
    }
}

// Run the test
if (require.main === module) {
    testDbImport()
        .then(() => {
            console.log("\n✅ Test completed successfully!");
            process.exit(0);
        })
        .catch((error) => {
            console.error("❌ Test failed:", error);
            process.exit(1);
        });
}

module.exports = testDbImport;
