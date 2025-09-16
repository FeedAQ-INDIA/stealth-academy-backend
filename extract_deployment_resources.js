const fs = require('fs');
const path = require('path');

// Read the JSON file
const jsonData = JSON.parse(fs.readFileSync('c:\\Users\\AD11495\\Downloads\\prod-deployment.json', 'utf8'));

// Extract deployment information
const deployments = [];

jsonData.data.forEach(deployment => {
    const deploymentInfo = {
        name: deployment.metadata.name,
        namespace: deployment.metadata.namespace,
        replicas: deployment.spec.replicas,
        resources: {
            limits: {},
            requests: {}
        }
    };

    // Extract resource information from containers
    if (deployment.spec.template && 
        deployment.spec.template.spec && 
        deployment.spec.template.spec.containers) {
        
        deployment.spec.template.spec.containers.forEach(container => {
            if (container.resources) {
                if (container.resources.limits) {
                    deploymentInfo.resources.limits = {
                        cpu: container.resources.limits.cpu || 'Not set',
                        memory: container.resources.limits.memory || 'Not set'
                    };
                }
                if (container.resources.requests) {
                    deploymentInfo.resources.requests = {
                        cpu: container.resources.requests.cpu || 'Not set',
                        memory: container.resources.requests.memory || 'Not set'
                    };
                }
            }
        });
    }

    deployments.push(deploymentInfo);
});

// Sort by namespace and name
deployments.sort((a, b) => {
    if (a.namespace !== b.namespace) {
        return a.namespace.localeCompare(b.namespace);
    }
    return a.name.localeCompare(b.name);
});

// Create output
console.log('='.repeat(120));
console.log('KUBERNETES DEPLOYMENT RESOURCES SUMMARY');
console.log('='.repeat(120));
console.log();

let currentNamespace = '';
deployments.forEach(deployment => {
    if (deployment.namespace !== currentNamespace) {
        currentNamespace = deployment.namespace;
        console.log(`\n📁 NAMESPACE: ${currentNamespace.toUpperCase()}`);
        console.log('-'.repeat(120));
    }
    
    console.log(`\n🚀 Deployment: ${deployment.name}`);
    console.log(`   Replicas: ${deployment.replicas}`);
    console.log(`   Resource Limits:`);
    console.log(`     - CPU: ${deployment.resources.limits.cpu || 'Not set'}`);
    console.log(`     - Memory: ${deployment.resources.limits.memory || 'Not set'}`);
    console.log(`   Resource Requests:`);
    console.log(`     - CPU: ${deployment.resources.requests.cpu || 'Not set'}`);
    console.log(`     - Memory: ${deployment.resources.requests.memory || 'Not set'}`);
});

// Create CSV output
const csvLines = ['Namespace,Deployment Name,Replicas,CPU Limit,Memory Limit,CPU Request,Memory Request'];
deployments.forEach(deployment => {
    const line = [
        deployment.namespace,
        deployment.name,
        deployment.replicas,
        deployment.resources.limits.cpu || 'Not set',
        deployment.resources.limits.memory || 'Not set',
        deployment.resources.requests.cpu || 'Not set',
        deployment.resources.requests.memory || 'Not set'
    ].join(',');
    csvLines.push(line);
});

// Write CSV file
fs.writeFileSync('deployment_resources.csv', csvLines.join('\n'));

console.log('\n\n📊 SUMMARY STATISTICS');
console.log('='.repeat(60));
console.log(`Total Deployments: ${deployments.length}`);

const namespaces = [...new Set(deployments.map(d => d.namespace))];
console.log(`Namespaces: ${namespaces.join(', ')}`);

namespaces.forEach(ns => {
    const nsDeployments = deployments.filter(d => d.namespace === ns);
    console.log(`  - ${ns}: ${nsDeployments.length} deployments`);
});

console.log('\n📄 CSV file created: deployment_resources.csv');
