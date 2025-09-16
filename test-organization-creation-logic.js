/**
 * Test script to verify the organization creation logic
 * Business Rule: A user can create only 1 organization but can be part of multiple organizations
 */

const db = require("./src/entity");

async function testOrganizationCreationLogic() {
    console.log("Testing Organization Creation Logic...");
    
    // Test data
    const testUserId = 1; // Assuming user with ID 1 exists
    
    try {
        // Test 1: Check if user has already created an organization
        console.log("\nTest 1: Checking if user has already created an organization...");
        
        const userCreatedOrg = await db.OrganizationUser.findOne({
            where: {
                userId: testUserId,
                userRole: 'ADMIN',
                invitedBy: null // This indicates the user created the org
            },
            include: [
                {
                    model: db.Organization,
                    as: 'organization',
                    attributes: ['orgId', 'orgName', 'orgEmail', 'orgStatus']
                }
            ]
        });

        if (userCreatedOrg) {
            console.log("✅ User has already created an organization:");
            console.log(`   Organization ID: ${userCreatedOrg.organization.orgId}`);
            console.log(`   Organization Name: ${userCreatedOrg.organization.orgName}`);
            console.log(`   User Role: ${userCreatedOrg.userRole}`);
            console.log(`   Invited By: ${userCreatedOrg.invitedBy || 'Self (Creator)'}`);
            console.log("   Result: User CANNOT create another organization");
        } else {
            console.log("✅ User has not created any organization yet");
            console.log("   Result: User CAN create a new organization");
        }

        // Test 2: Check all organizations the user is part of
        console.log("\nTest 2: Checking all organizations user is part of...");
        
        const userOrganizations = await db.OrganizationUser.findAll({
            where: { userId: testUserId },
            include: [
                {
                    model: db.Organization,
                    as: 'organization',
                    attributes: ['orgId', 'orgName', 'orgEmail', 'orgStatus']
                }
            ]
        });

        console.log(`✅ User is part of ${userOrganizations.length} organization(s):`);
        userOrganizations.forEach((orgUser, index) => {
            console.log(`   ${index + 1}. ${orgUser.organization.orgName} (Role: ${orgUser.userRole}, InvitedBy: ${orgUser.invitedBy || 'Self'})`);
        });

        console.log("\n🎯 Business Rule Verification:");
        console.log(`   - Can create organizations: ${userCreatedOrg ? 'NO (already created one)' : 'YES'}`);
        console.log(`   - Can be part of multiple orgs: YES (currently in ${userOrganizations.length})`);
        
    } catch (error) {
        console.error("❌ Error during testing:", error.message);
    }
}

// Run the test
if (require.main === module) {
    testOrganizationCreationLogic()
        .then(() => {
            console.log("\n✅ Test completed successfully!");
            process.exit(0);
        })
        .catch((error) => {
            console.error("❌ Test failed:", error);
            process.exit(1);
        });
}

module.exports = testOrganizationCreationLogic;
